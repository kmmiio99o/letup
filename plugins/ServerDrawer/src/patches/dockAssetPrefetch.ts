import { ReactNative } from "@vendetta/metro/common";
import { patchByPropWithRetry } from "./retry";

// QuestDockWithEntranceAnimation only renders its content after a first-frame prefetch
// succeeds: it prefetches backgroundImageUrl (useQuestDockHeroAsset(quest).staticUrl) and
// iconUrl (useQuestGameLogotypeAssetUrl(quest)) and stays invisible unless both load.
//
// Two conflicting constraints made a null-based skip (returning null from both hooks) fail:
//   - the prefetch gate only skips null urls
//   - QuestGameLogotype dereferences the logotype url as a real string (endsWith / Image)
//     and crashes when it is null, and reliably identifying that memo-wrapped component is
//     not possible across bundles.
//
// So both hooks return real-looking CDN urls (strings, never null), and the shared RN
// Image.prefetch singleton is patched so any prefetch of our fake urls resolves successfully.
// Whatever wrapper the quest module routes its preload through, the low-level image-cache call
// is RN Image.prefetch on the same object Vendetta's metro/common Image references - so the
// gate always sees SUCCEEDED while real asset prefetches pass through untouched.

const FAKE_ASSET_CDN = "https://cdn.discordapp.com/attachments/0/0/";
const FAKE_HERO_URL = `${FAKE_ASSET_CDN}server_drawer_hero.png`;
const FAKE_LOGO_URL = `${FAKE_ASSET_CDN}server_drawer_logo.png`;

function patchFakePrefetch(cleanups: (() => void)[]): boolean {
    const image = ReactNative.Image as unknown as { prefetch?: (...args: unknown[]) => unknown };
    const orig = image.prefetch;
    if (typeof orig !== "function") return false;
    image.prefetch = function (this: unknown, url: unknown, ...rest: unknown[]) {
        if (typeof url === "string" && url.includes("server_drawer_")) {
            return Promise.resolve(true);
        }
        return orig.apply(this, [url, ...rest]);
    };
    cleanups.push(() => {
        image.prefetch = orig;
    });
    return true;
}

export function patchDockAssetPrefetch(cleanups: (() => void)[]): boolean {
    let patched = 0;
    if (patchByPropWithRetry(cleanups, "useQuestDockHeroAsset", () => {
        return function () {
            return { staticUrl: FAKE_HERO_URL, videoAsset: null };
        };
    })) patched++;
    if (patchByPropWithRetry(cleanups, "useQuestGameLogotypeAssetUrl", () => {
        return function () {
            return FAKE_LOGO_URL;
        };
    })) patched++;
    if (patchFakePrefetch(cleanups)) patched++;
    return patched > 0;
}
