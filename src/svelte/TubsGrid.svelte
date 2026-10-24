<script lang="ts">
	import type { Writable } from "svelte/store";
	import type { TubsModel } from "../tubs/model";
	import type { TubsSettings } from "../tubs/settings";
	import { colorFor } from "../tubs/palette";
	import TubsCell from "./TubsCell.svelte";

	let {
		model,
		settings,
		step,
	}: { model: TubsModel; settings: TubsSettings; step: Writable<number> } = $props();

	const div = $derived(model.meta.div);
	const stepsPerBar = $derived(model.stepsPerBar);
	const cols = $derived(Array.from({ length: model.steps }, (_, i) => i));
	const rowColors = $derived(model.rows.map((r, i) => colorFor(r.label, i)));
</script>

<div class="tubs-grid-scroll">
	<table class="tubs-grid">
		{#if settings.showCountHeader}
			<thead>
				<tr class="tubs-count">
					<th class="tubs-gutter"></th>
					{#each cols as i}
						<th
							class="tubs-colhead"
							class:beat={i % div === 0}
							class:bar={i > 0 && i % stepsPerBar === 0}
							class:lit={i === $step}>{model.countHeader[i] ?? ""}</th>
					{/each}
				</tr>
			</thead>
		{/if}
		<tbody>
			{#each model.rows as row, ri}
				<tr>
					<td class="tubs-gutter tubs-label" style="color:{rowColors[ri]}"
						>{row.label}</td>
					{#each cols as i}
						<td
							class="tubs-cell"
							class:beat={i % div === 0}
							class:bar={i > 0 && i % stepsPerBar === 0}
							class:lit={i === $step}>
							<TubsCell cell={row.cells[i]} color={rowColors[ri]} />
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.tubs-grid-scroll {
		overflow-x: auto;
		max-width: 100%;
	}
	.tubs-grid {
		border-collapse: collapse;
		font-family: var(--font-monospace, monospace);
		margin: 0.2em 0;
	}
	.tubs-grid th,
	.tubs-grid td {
		text-align: center;
		padding: 0;
	}
	.tubs-gutter {
		text-align: left;
		white-space: nowrap;
		width: 1%;
		padding-right: 0.75em;
	}
	.tubs-label {
		font-size: 0.8em;
		font-weight: 600;
		letter-spacing: 0.03em;
		padding: 0.15em 0.75em 0.15em 0;
	}
	.tubs-colhead {
		font-size: 0.68em;
		font-weight: 500;
		color: var(--text-muted);
		padding-bottom: 0.25em;
		width: 1.7em;
		min-width: 1.7em;
	}
	.tubs-cell {
		width: 1.7em;
		height: 1.7em;
		min-width: 1.7em;
		position: relative;
		border: 1px solid var(--background-modifier-border);
		background: var(--background-secondary);
	}
	/* Increasing weight: step border < beat line < bar line. */
	.tubs-cell.beat,
	.tubs-colhead.beat {
		border-left: 2px solid var(--text-muted);
	}
	.tubs-cell.bar,
	.tubs-colhead.bar {
		border-left: 3px solid var(--text-normal);
	}
	/* Playhead — theme-aware translucent accent that doesn't hide the marks. */
	.tubs-cell.lit {
		background: color-mix(
			in srgb,
			var(--interactive-accent) 30%,
			var(--background-secondary)
		);
	}
	.tubs-colhead.lit {
		color: var(--text-accent);
		font-weight: 700;
	}
</style>
