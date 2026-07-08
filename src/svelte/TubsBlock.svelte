<script lang="ts">
	import { onDestroy, untrack } from "svelte";
	import type { TubsModel } from "../tubs/model";
	import type { TubsSettings } from "../settings";
	import { TubsPlayback } from "../tubs/playback";
	import TubsGrid from "./TubsGrid.svelte";

	let { model, settings }: { model: TubsModel; settings: TubsSettings } = $props();

	// `model` is fixed for a given mounted block (a re-render mounts a fresh
	// component), so we intentionally read it once, untracked.
	const engine = untrack(() => new TubsPlayback(model));
	const playing = engine.playing;
	const step = engine.step;

	let bpm = $state(untrack(() => model.meta.bpm));

	onDestroy(() => engine.dispose());

	async function toggle() {
		if ($playing) engine.stop();
		else await engine.start();
	}

	function onBpmInput(e: Event) {
		const v = Number((e.target as HTMLInputElement).value);
		if (Number.isFinite(v) && v > 0) {
			bpm = v;
			engine.setBpm(v);
		}
	}
</script>

<div class="tubs">
	{#if model.meta.title}
		<div class="tubs-title">{model.meta.title}</div>
	{/if}
	{#each model.lineage as line}
		<div class="tubs-lineage">{line}</div>
	{/each}

	{#if settings.playbackEnabled}
		<div class="tubs-controls">
			<button
				class="tubs-play"
				onclick={toggle}
				aria-label={$playing ? "Stop" : "Play"}>{$playing ? "■" : "▶"}</button>
			<span class="tubs-bpm">
				♩=<input
					class="tubs-bpm-input"
					type="number"
					min="20"
					max="300"
					value={bpm}
					oninput={onBpmInput} />
			</span>
		</div>
	{/if}

	<TubsGrid {model} {settings} {step} />
</div>

<style>
	.tubs {
		margin: 0.4em 0;
	}
	.tubs-title {
		font-weight: 600;
		font-size: 0.95em;
		margin-bottom: 0.05em;
	}
	.tubs-lineage {
		font-size: 0.8em;
		font-style: italic;
		color: var(--text-muted);
		margin-bottom: 0.15em;
	}
	.tubs-controls {
		display: flex;
		align-items: center;
		gap: 0.6em;
		margin: 0.2em 0 0.35em;
	}
	.tubs-play {
		cursor: pointer;
		font-size: 0.78em;
		line-height: 1;
		padding: 0.28em 0.6em;
		border-radius: 4px;
		border: 1px solid var(--background-modifier-border);
		background: var(--interactive-normal);
		color: var(--text-normal);
	}
	.tubs-play:hover {
		background: var(--interactive-hover);
	}
	.tubs-bpm {
		display: inline-flex;
		align-items: center;
		gap: 0.15em;
		font-size: 0.78em;
		color: var(--text-muted);
		font-family: var(--font-monospace, monospace);
	}
	.tubs-bpm-input {
		width: 3.4em;
		padding: 0.1em 0.25em;
		font-size: 1em;
		color: var(--text-normal);
		background: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 3px;
	}
</style>
