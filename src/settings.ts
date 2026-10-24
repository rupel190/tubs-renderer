import { App, PluginSettingTab, Setting } from "obsidian";
import type TubsPlugin from "./main";

export class TubsSettingTab extends PluginSettingTab {
	plugin: TubsPlugin;

	constructor(app: App, plugin: TubsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Default tempo (BPM)")
			.setDesc("Used when a tubs block has no @ bpm=… of its own.")
			.addText((t) =>
				t
					.setValue(String(this.plugin.settings.defaultBpm))
					.onChange(async (v) => {
						const n = Number(v);
						if (Number.isFinite(n) && n > 0) {
							this.plugin.settings.defaultBpm = n;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName("Enable playback")
			.setDesc("Show the Play button and load audio. Turn off to render grids only.")
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.playbackEnabled)
					.onChange(async (v) => {
						this.plugin.settings.playbackEnabled = v;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Show count header")
			.setDesc("Show the “1 e & a” counting row above each grid.")
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.showCountHeader)
					.onChange(async (v) => {
						this.plugin.settings.showCountHeader = v;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Default bass root")
			.setDesc(
				"Pitch for a plain x on a bass row when no note name is given (e.g. C2, F1).",
			)
			.addText((t) =>
				t
					.setValue(this.plugin.settings.defaultRoot)
					.onChange(async (v) => {
						this.plugin.settings.defaultRoot = v.trim() || "C2";
						await this.plugin.saveSettings();
					}),
			);
	}
}
