import * as Tone from "tone";
import { writable, type Writable } from "svelte/store";
import type { TubsModel } from "./model";
import { voiceFor, type Voice } from "./voices";

interface StepEvent {
	pitch?: string;
	velocity: number;
	durSteps: number; // onset length in steps (1 + trailing holds)
	open: boolean;
}

// div → Tone subdivision. Triplet divs use the "t" suffix; power-of-two divs fall through.
const STEP_SUBDIV: Record<number, string> = {
	1: "4n",
	2: "8n",
	3: "8t",
	4: "16n",
	6: "16t",
	8: "32n",
	12: "32t",
};
function stepSubdivision(div: number): string {
	return STEP_SUBDIV[div] ?? `${4 * div}n`;
}

// Global transport means only one block sounds at a time (spec). Track who owns it.
let activePlayback: TubsPlayback | null = null;

export function stopActivePlayback(): void {
	activePlayback?.stop();
}

export class TubsPlayback {
	// Reactive state the Svelte layer subscribes to.
	readonly playing: Writable<boolean> = writable(false);
	readonly step: Writable<number> = writable(-1);

	private readonly model: TubsModel;
	private bpm: number;
	private seq: Tone.Sequence<number> | null = null;
	private synths: Array<{ synth: ReturnType<Voice["make"]>; voice: Voice }> = [];
	private readonly rowVoices: Voice[];
	private readonly rowEvents: Array<Array<StepEvent | null>>;
	private disposed = false;

	constructor(model: TubsModel) {
		this.model = model;
		this.bpm = model.meta.bpm;
		this.rowVoices = model.rows.map((r, i) => voiceFor(r.label, i));
		this.rowEvents = model.rows.map((_, ri) => this.buildRowEvents(ri));
	}

	private buildRowEvents(ri: number): Array<StepEvent | null> {
		const row = this.model.rows[ri];
		const voice = this.rowVoices[ri];
		const events: Array<StepEvent | null> = new Array(row.cells.length).fill(null);
		for (let i = 0; i < row.cells.length; i++) {
			const cell = row.cells[i];
			let velocity: number;
			let pitch: string | undefined;
			let open = false;
			switch (cell.kind) {
				case "hit":
					velocity = 0.7;
					break;
				case "accent":
					velocity = 1.0;
					break;
				case "ghost":
					velocity = 0.35;
					break;
				case "open":
					velocity = 0.7;
					open = true;
					break;
				case "note":
					velocity = 0.8;
					pitch = cell.pitch;
					break;
				default:
					continue; // rest / hold / unknown → no onset
			}
			if (voice.pitched && pitch === undefined) pitch = this.model.meta.root;
			// A held note runs through the trailing "_" cells.
			let durSteps = 1;
			for (
				let j = i + 1;
				j < row.cells.length && row.cells[j].kind === "hold";
				j++
			) {
				durSteps++;
			}
			events[i] = { pitch, velocity, durSteps, open };
		}
		return events;
	}

	async start(): Promise<void> {
		if (this.disposed) return;
		if (activePlayback && activePlayback !== this) activePlayback.stop();
		activePlayback = this;

		await Tone.start(); // resume AudioContext (must be inside a user gesture)
		Tone.Transport.bpm.value = this.bpm;

		this.synths = this.rowVoices.map((voice) => ({ synth: voice.make(), voice }));

		const div = this.model.meta.div;
		const subdiv = stepSubdivision(div);
		const indices = Array.from({ length: this.model.steps }, (_, i) => i);

		this.seq = new Tone.Sequence<number>(
			(time, stepIndex) => {
				// Compute step length from the live tempo so held-note durations stay
				// correct even if BPM is nudged mid-playback.
				const stepSeconds = 60 / Tone.Transport.bpm.value / div;
				for (let ri = 0; ri < this.rowEvents.length; ri++) {
					const ev = this.rowEvents[ri][stepIndex];
					if (!ev) continue;
					const { synth, voice } = this.synths[ri];
					voice.trigger(synth, time, {
						velocity: ev.velocity,
						pitch: ev.pitch,
						durationSec: voice.pitched ? ev.durSteps * stepSeconds : undefined,
						open: ev.open,
					});
				}
				// Move the playhead in sync with audio.
				Tone.Draw.schedule(() => this.step.set(stepIndex), time);
			},
			indices,
			subdiv,
		);

		this.seq.start(0); // Tone.Sequence loops by default → the pattern repeats
		Tone.Transport.start();
		this.playing.set(true);
	}

	stop(): void {
		if (this.seq) {
			this.seq.stop();
			this.seq.dispose();
			this.seq = null;
		}
		if (activePlayback === this) {
			Tone.Transport.stop();
			activePlayback = null;
		}
		for (const { synth } of this.synths) {
			try {
				synth.dispose();
			} catch {
				/* already gone */
			}
		}
		this.synths = [];
		this.playing.set(false);
		this.step.set(-1);
	}

	setBpm(bpm: number): void {
		this.bpm = bpm;
		if (activePlayback === this) Tone.Transport.bpm.value = bpm;
	}

	dispose(): void {
		this.disposed = true;
		this.stop();
	}
}
