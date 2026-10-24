// Entry for using the renderer outside Obsidian (the playable demo at rupel.xyz/music/tubs/).
// Everything here is Obsidian-free; mount TubsBlock with Svelte's mount() and give the page
// the theme variables the components read (--text-normal, --background-secondary, …).
export { parseTubs } from "./tubs/parse";
export { TubsError, type TubsModel } from "./tubs/model";
export { DEFAULT_SETTINGS, type TubsSettings } from "./tubs/settings";
export { stopActivePlayback } from "./tubs/playback";
export { default as TubsBlock } from "./svelte/TubsBlock.svelte";
export { default as TubsErrorView } from "./svelte/TubsError.svelte";
