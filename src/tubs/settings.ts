// Settings shape + defaults. Kept free of the `obsidian` import (unlike ../settings.ts, which
// holds the settings tab) so the renderer can run on a plain web page too — see ../web.ts.

export interface TubsSettings {
	defaultBpm: number;
	playbackEnabled: boolean;
	showCountHeader: boolean;
	defaultRoot: string;
}

export const DEFAULT_SETTINGS: TubsSettings = {
	defaultBpm: 120,
	playbackEnabled: true,
	showCountHeader: true,
	defaultRoot: "C2",
};
