import { TubsError, type Cell, type Meta, type Row, type TubsModel } from "./model";

// Prefix match while tokenizing a row body; full match when classifying a token.
const NOTE_PREFIX_RE = /^[A-Ga-g][#b]?[0-9]/;
const NOTE_FULL_RE = /^[A-Ga-g][#b]?[0-9]$/;
// A count-header line consists only of digits, spaces, and the syllables . & e a
const COUNT_LINE_RE = /^[\s\d.&ea]+$/;

export interface ParseDefaults {
	bpm: number;
	div: number;
	beats: number;
	root: string;
}

const DEFAULTS: ParseDefaults = { bpm: 120, div: 4, beats: 4, root: "C2" };

export function parseTubs(
	source: string,
	defaults: Partial<ParseDefaults> = {},
): TubsModel {
	const d = { ...DEFAULTS, ...defaults };
	const meta: Meta = { bpm: d.bpm, div: d.div, beats: d.beats, root: d.root };
	const lineage: string[] = [];
	const rows: Row[] = [];
	let givenCountHeader: string[] | null = null;

	const lines = source.replace(/\r\n?/g, "\n").split("\n");

	lines.forEach((rawLine, idx) => {
		const lineNo = idx + 1;
		const line = rawLine.trim();
		if (line === "") return;

		const first = line[0];

		if (first === "#") return; // true comment — ignored entirely

		if (first === "@") {
			parseMeta(line.slice(1), meta, lineNo);
			return;
		}

		if (first === ">") {
			lineage.push(line.slice(1).trim());
			return;
		}

		if (line.includes("|")) {
			const pipe = line.indexOf("|");
			const label = line.slice(0, pipe).trim();
			const cells = tokenize(line.slice(pipe + 1)).map(classify);
			rows.push({ label, key: label.toLowerCase(), cells });
			return;
		}

		// No pipe: a count-header line is allowed only before the first row.
		if (rows.length === 0 && COUNT_LINE_RE.test(line)) {
			givenCountHeader = line.split(/\s+/).filter(Boolean);
			return;
		}
		// Anything else without a pipe is ignored leniently (never crash).
	});

	if (rows.length === 0) {
		throw new TubsError(
			'No instrument rows found — add at least one "Label | tokens" line.',
		);
	}
	if (!Number.isFinite(meta.div) || meta.div <= 0) {
		throw new TubsError(`div must be a positive number (got ${meta.div}).`);
	}
	if (!Number.isFinite(meta.beats) || meta.beats <= 0) {
		throw new TubsError(`beats must be a positive number (got ${meta.beats}).`);
	}

	const steps = Math.max(...rows.map((r) => r.cells.length));
	const stepsPerBar = Math.max(1, Math.round(meta.beats * meta.div));
	const barCount = Math.max(1, Math.ceil(steps / stepsPerBar));
	const countHeader = givenCountHeader
		? padHeader(givenCountHeader, steps)
		: generateCountHeader(steps, meta.div, meta.beats);

	return { meta, lineage, countHeader, rows, steps, stepsPerBar, barCount };
}

function parseMeta(body: string, meta: Meta, lineNo: number): void {
	// Pull out title="…" first, since its value may contain spaces.
	const titleMatch = body.match(/title\s*=\s*"([^"]*)"/);
	if (titleMatch) {
		meta.title = titleMatch[1];
		body = body.replace(titleMatch[0], " ");
	}

	for (const pair of body.trim().split(/\s+/).filter(Boolean)) {
		const eq = pair.indexOf("=");
		if (eq === -1) continue;
		const key = pair.slice(0, eq).trim();
		const value = pair.slice(eq + 1).trim();
		switch (key) {
			case "bpm":
				meta.bpm = requireNumber(value, "bpm", lineNo);
				break;
			case "div":
				meta.div = requireNumber(value, "div", lineNo);
				break;
			case "beats":
				meta.beats = requireNumber(value, "beats", lineNo);
				break;
			case "root":
				meta.root = value;
				break;
			case "title":
				if (meta.title === undefined) meta.title = value.replace(/^"|"$/g, "");
				break;
			// unknown keys ignored
		}
	}
}

function requireNumber(value: string, key: string, lineNo: number): number {
	const n = Number(value);
	if (!Number.isFinite(n)) {
		throw new TubsError(`${key} must be a number (got "${value}").`, lineNo);
	}
	return n;
}

// Whitespace between tokens is cosmetic. Single-char symbols may run together
// ("x.x." → x . x .); note names are multi-char and greedily matched ("F1 _" → F1 _).
export function tokenize(body: string): string[] {
	const tokens: string[] = [];
	let i = 0;
	while (i < body.length) {
		const c = body[i];
		if (/\s/.test(c)) {
			i++;
			continue;
		}
		const m = body.slice(i).match(NOTE_PREFIX_RE);
		if (m) {
			tokens.push(m[0]);
			i += m[0].length;
			continue;
		}
		tokens.push(c);
		i++;
	}
	return tokens;
}

export function classify(raw: string): Cell {
	switch (raw) {
		case ".":
			return { raw, kind: "rest" };
		case "x":
			return { raw, kind: "hit" };
		case "X":
			return { raw, kind: "accent" };
		case "g":
			return { raw, kind: "ghost" };
		case "o":
			return { raw, kind: "open" };
		case "_":
			return { raw, kind: "hold" };
	}
	if (NOTE_FULL_RE.test(raw)) {
		return { raw, kind: "note", pitch: raw[0].toUpperCase() + raw.slice(1) };
	}
	return { raw, kind: "unknown" };
}

// Beat-number on each downbeat, syllables in between. div=4 → 1 e & a; div=3 → 1 . .
const SYLLABLES: Record<number, string[]> = {
	1: [""],
	2: ["", "&"],
	3: ["", ".", "."],
	4: ["", "e", "&", "a"],
	6: ["", ".", ".", ".", ".", "."],
};

export function generateCountHeader(
	steps: number,
	div: number,
	beats: number,
): string[] {
	const syl = SYLLABLES[div];
	const header: string[] = [];
	for (let i = 0; i < steps; i++) {
		const pos = i % div;
		if (pos === 0) {
			header.push(String((Math.floor(i / div) % beats) + 1));
		} else {
			header.push(syl ? syl[pos] ?? "." : ".");
		}
	}
	return header;
}

function padHeader(given: string[], steps: number): string[] {
	const out = given.slice(0, steps);
	while (out.length < steps) out.push("");
	return out;
}
