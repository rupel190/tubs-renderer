<script lang="ts">
	let { message }: { message: string } = $props();
</script>

<div class="tubs-error">
	<strong>TUBS:</strong>
	{message}
</div>

<style>
	.tubs-error {
		margin: 0.4em 0;
		padding: 0.4em 0.7em;
		border-left: 3px solid var(--text-error);
		border-radius: 3px;
		background: var(--background-secondary);
		color: var(--text-error);
		font-family: var(--font-monospace, monospace);
		font-size: 0.85em;
	}
</style>
