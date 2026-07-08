// Makes `import X from './X.svelte'` type-safe for `tsc` under Svelte 5 without
// requiring the svelte-check toolchain. esbuild-svelte does the real compilation.
declare module "*.svelte" {
	import type { Component } from "svelte";
	const component: Component<Record<string, any>>;
	export default component;
}
