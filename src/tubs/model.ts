// The parsed representation of a `tubs` code block. Pure data — no Tone, no DOM.

export type CellKind =
	| "rest" // .
	| "hit" // x
	| "accent" // X
	| "ghost" // g
	| "open" // o
	| "hold" // _   (extends the previous onset)
	| "note" // F1, C#2, …
	| "unknown"; // anything else → rendered as ?

export interface Cell {
	raw: string; // original token, e.g. "x" or "F1"
	kind: CellKind;
	pitch?: string; // set when kind === "note", normalized e.g. "F#1"
}

export interface Row {
	label: string; // instrument label as written (trimmed)
	key: string; // lowercased label, for voice/color lookup
	cells: Cell[];
}

export interface Meta {
	bpm: number;
	div: number; // steps per beat (4 = 16ths, 3 = triplets)
	beats: number; // beats per bar
	root: string; // default pitch for plain x on a pitched row
	title?: string;
}

export interface TubsModel {
	meta: Meta;
	lineage: string[]; // "> …" lines, informational only
	countHeader: string[]; // per-column header syllable, length === steps
	rows: Row[];
	steps: number; // grid width = longest row
	stepsPerBar: number; // beats * div
	barCount: number;
}

// Thrown for structurally invalid blocks. Rendered as an inline message, never fatal.
export class TubsError extends Error {
	line?: number;
	constructor(message: string, line?: number) {
		super(message);
		this.name = "TubsError";
		this.line = line;
	}
}
