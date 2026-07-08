import { MarkdownRenderChild, Plugin } from "obsidian";
import { mount, unmount } from "svelte";
import { parseTubs } from "./tubs/parse";
import { TubsError } from "./tubs/model";
import { stopActivePlayback } from "./tubs/playback";
import { DEFAULT_SETTINGS, type TubsSettings, TubsSettingTab } from "./settings";
import TubsBlock from "./svelte/TubsBlock.svelte";
import TubsErrorView from "./svelte/TubsError.svelte";

export default class TubsPlugin extends Plugin {
	settings!: TubsSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor("tubs", (source, el, ctx) => {
			// Tie the Svelte component's lifetime to the rendered block: when the block
			// leaves the DOM (re-render, note close), unmount() runs and playback stops.
			const child = new MarkdownRenderChild(el);
			ctx.addChild(child);

			try {
				const model = parseTubs(source, {
					bpm: this.settings.defaultBpm,
					root: this.settings.defaultRoot,
				});
				const view = mount(TubsBlock, {
					target: el,
					props: { model, settings: this.settings },
				});
				child.register(() => unmount(view));
			} catch (e) {
				const message =
					e instanceof TubsError || e instanceof Error ? e.message : String(e);
				const view = mount(TubsErrorView, { target: el, props: { message } });
				child.register(() => unmount(view));
			}
		});

		this.addSettingTab(new TubsSettingTab(this.app, this));
	}

	onunload(): void {
		stopActivePlayback();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
