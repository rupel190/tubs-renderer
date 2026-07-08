<script lang="ts">
	import type { Cell } from "../tubs/model";

	let { cell, color }: { cell: Cell | undefined; color: string } = $props();

	// Short rows are rests past their end.
	const kind = $derived(cell?.kind ?? "rest");
</script>

{#if kind === "hit"}
	<span class="mark dot" style="background:{color}"></span>
{:else if kind === "accent"}
	<span class="mark dot accent" style="background:{color}; box-shadow:0 0 0 2px {color}66"></span>
{:else if kind === "ghost"}
	<span class="mark dot ghost" style="background:{color}"></span>
{:else if kind === "open"}
	<span class="mark ring" style="border-color:{color}"></span>
{:else if kind === "note"}
	<span class="mark dot note" style="background:{color}"></span>
	<span class="notelabel" style="color:{color}">{cell?.pitch}</span>
{:else if kind === "hold"}
	<span class="mark holdbar" style="background:{color}"></span>
{:else if kind === "unknown"}
	<span class="unknown">?</span>
{/if}

<style>
	.mark {
		display: inline-block;
		vertical-align: middle;
	}
	.dot {
		width: 0.62em;
		height: 0.62em;
		border-radius: 50%;
	}
	.accent {
		width: 0.8em;
		height: 0.8em;
	}
	.ghost {
		width: 0.4em;
		height: 0.4em;
		opacity: 0.5;
	}
	.ring {
		width: 0.66em;
		height: 0.66em;
		border-radius: 50%;
		border: 2px solid;
		background: transparent;
		box-sizing: border-box;
	}
	.note {
		width: 0.55em;
		height: 0.55em;
	}
	/* Held note: a bar spanning the cell so onset → holds read as one sustained note. */
	.holdbar {
		width: 100%;
		height: 0.22em;
		border-radius: 1px;
		opacity: 0.85;
	}
	.notelabel {
		position: absolute;
		bottom: 1px;
		left: 0;
		right: 0;
		font-size: 0.62em;
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1;
		text-align: center;
		pointer-events: none;
	}
	.unknown {
		font-size: 0.8em;
		font-weight: 700;
		color: var(--text-error);
	}
</style>
