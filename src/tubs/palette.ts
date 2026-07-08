// Instrument → color mapping. Pure (no Tone), so the render layer can pull colors
// without importing the audio engine. Voice/synth assignment lives in voices.ts and
// keys off the same resolveVoiceKey().

export const PALETTE = {
	kick: "#b5502f", // clay red
	snare: "#2f7d78", // teal
	hat: "#c79a3e", // ochre
	bass: "#6b4e8c", // violet
};

// Colors for rows whose label doesn't map to a known instrument.
export const FALLBACK_PALETTE = ["#7a8b5c", "#a05c7a", "#5c7a8b", "#9c7a4e"];

export type VoiceKey = keyof typeof PALETTE;

// Map a free-text instrument label to a known voice key, or null for "unknown".
export function resolveVoiceKey(label: string): VoiceKey | null {
	const key = label.toLowerCase().replace(/[^a-z0-9]/g, "");
	if (key === "kick" || key === "bd" || key.includes("kick") || key === "bassdrum")
		return "kick";
	if (key === "snare" || key === "sd" || key.includes("snare")) return "snare";
	if (key === "hat" || key === "hh" || key.includes("hat") || key.includes("hihat"))
		return "hat";
	if (key === "bass" || key.includes("bass")) return "bass";
	return null;
}

// Deterministic color for a row given its index (so render + playback agree).
export function colorFor(label: string, rowIndex: number): string {
	const key = resolveVoiceKey(label);
	if (key) return PALETTE[key];
	return FALLBACK_PALETTE[rowIndex % FALLBACK_PALETTE.length];
}
