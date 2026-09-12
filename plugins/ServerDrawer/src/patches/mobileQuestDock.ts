import { patchByPropWithRetry } from "./retry";

// The dock chrome resolves hero/logotype assets through AssetUtils.getQuestAsset ->
// resolveAsset, which reads `quest.config.assets.*`. Real server payloads store plain CDN
// filename strings there; resolveAsset prefixes the quests CDN base and returns a well-formed
// `{ url, mimetype, isAnimated }`. Consumers (`useQuestDockHeroAsset`, `useQuestGameLogotypeAssetUrl`)
// then dereference `.isAnimated` / `.url` / `.staticUrl` unconditionally.
//
// Earlier iterations fed this path nulls or `{ url }`-shaped objects: nulls made getQuestAsset
// return null (v341: "Cannot read property 'assets' of undefined"), and objects made
// resolveAsset call `.startsWith` on them (v342). Shipping valid filename strings in
// quest.config.assets fixes both without fallback patching - the real resolver always succeeds.
//
// The top-level `assets` map is kept in the object-shaped form: some builds read it directly
// (not through resolveAsset), where `{ url, ... }` entries stay non-null. The rest of the fake
// quest mirrors the shape that was proven to mount the dock.
const HERO_MEDIA_URL = "https://media.discordapp.net/attachments/0/0/1.png";

function legacyAssets() {
    return {
        questBarHero: { url: HERO_MEDIA_URL },
        questBarHeroVideo: { url: HERO_MEDIA_URL },
    };
}

function questAssets() {
    return {
        hero: "server_drawer_hero.png",
        heroVideo: null,
        questBarHero: "server_drawer_hero.png",
        questBarHeroBlurhash: null,
        questBarHeroVideo: null,
        gameTile: "server_drawer_tile.png",
        gameTileLight: "server_drawer_tile.png",
        gameTileDark: "server_drawer_tile.png",
        logotype: "server_drawer_logo.png",
        logotypeLight: "server_drawer_logo.png",
        logotypeDark: "server_drawer_logo.png",
    };
}

export function patchMobileQuestDock(cleanups: (() => void)[]): boolean {
    return patchByPropWithRetry(cleanups, "useMobileQuestDock", (orig) => {
        return function (this: any, ...args: any[]) {
            orig.apply(this, args);
            return {
                type: 1, // AdCreativeType.QUEST
                quest: {
                    id: "server-drawer",
                    assets: legacyAssets(),
                    config: {
                        quest_content_type: 0,
                        assets: questAssets(),
                        features: [],
                    },
                    userStatus: { enrolledAt: "2099-01-01", claimedAt: null },
                    benefits: { rewards: [] },
                    guildId: "0",
                    tasks: [],
                },
            };
        };
    });
}
