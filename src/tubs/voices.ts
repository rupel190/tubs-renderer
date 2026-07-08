import * as Tone from "tone";
import { FALLBACK_PALETTE, PALETTE, resolveVoiceKey } from "./palette";

export interface TriggerOpts {
	velocity: number;
	pitch?: string; // for pitched voices
	durationSec?: number; // for pitched voices (held notes)
	open?: boolean; // open hi-hat → longer ring
}

// A synth exposes at least these. Kept loose because each Tone synth differs.
type Synth = { triggerAttackRelease: (...args: any[]) => unknown; dispose: () => void };

export interface Voice {
	color: string;
	pitched: boolean;
	make: () => Synth;
	trigger: (synth: Synth, time: number, opts: TriggerOpts) => void;
}

// The synth kit. Edit these to taste — colors come from palette.ts.
export const VOICES: Record<string, Voice> = {
	kick: {
		color: PALETTE.kick,
		pitched: false,
		make: () => new Tone.MembraneSynth({ volume: -4 }).toDestination(),
		trigger: (s, t, o) => s.triggerAttackRelease("C1", "8n", t, o.velocity),
	},
	snare: {
		color: PALETTE.snare,
		pitched: false,
		make: () =>
			new Tone.NoiseSynth({
				volume: -8,
				envelope: { attack: 0.001, decay: 0.14, sustain: 0 },
			}).toDestination(),
		trigger: (s, t, o) => s.triggerAttackRelease(0.14, t, o.velocity),
	},
	hat: {
		color: PALETTE.hat,
		pitched: false,
		make: () =>
			new Tone.NoiseSynth({
				volume: -18,
				envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
			}).toDestination(),
		// open hat rings noticeably longer than a closed tick
		trigger: (s, t, o) =>
			s.triggerAttackRelease(o.open ? 0.22 : 0.03, t, o.velocity),
	},
	bass: {
		color: PALETTE.bass,
		pitched: true,
		make: () =>
			new Tone.MonoSynth({
				volume: -10,
				oscillator: { type: "sawtooth" },
				filterEnvelope: {
					attack: 0.01,
					decay: 0.2,
					sustain: 0.2,
					baseFrequency: 120,
					octaves: 2.5,
				},
				envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.2 },
			}).toDestination(),
		trigger: (s, t, o) =>
			s.triggerAttackRelease(o.pitch ?? "C2", o.durationSec ?? "16n", t, o.velocity),
	},
};

// A neutral click for rows whose label maps to no known instrument.
function makeGenericVoice(color: string): Voice {
	return {
		color,
		pitched: false,
		make: () =>
			new Tone.MembraneSynth({
				volume: -12,
				octaves: 2,
				pitchDecay: 0.02,
			}).toDestination(),
		trigger: (s, t, o) => s.triggerAttackRelease("C2", "16n", t, o.velocity),
	};
}

// Resolve a row to its Voice. rowIndex must match the one render passes to colorFor()
// so an unknown row's fallback color is identical in the grid and the audio kit.
export function voiceFor(label: string, rowIndex: number): Voice {
	const key = resolveVoiceKey(label);
	if (key) return VOICES[key];
	return makeGenericVoice(FALLBACK_PALETTE[rowIndex % FALLBACK_PALETTE.length]);
}
