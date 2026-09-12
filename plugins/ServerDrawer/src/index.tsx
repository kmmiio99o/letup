import { patchQuestDockRender } from "./patches/questDockRender";
import { patchQuestDockBase } from "./patches/questDockBase";
import { patchMobileQuestDock } from "./patches/mobileQuestDock";
import { patchQuestEligibility } from "./patches/questEligibility";
import { patchDockAssetPrefetch } from "./patches/dockAssetPrefetch";
import { patchExpanded, patchEmpty } from "./patches/contentPatch";
import { patchHideGuildsBar, isHidingComplete } from "./patches/hideGuildsBar";
import { patchTransparentBackground } from "./patches/transparentBackground";
import { patchCreateElement } from "./patches/createElementIntercept";
import { storage } from "@vendetta/plugin";
import Settings from "./ui/Settings";

const TAG = "[ServerDrawer]";
const cleanups: (() => void)[] = [];

export default {
    onLoad() {
        storage.hideDmTile ??= false;
        storage.showGuildNames ??= false;

        console.log(TAG, "onLoad");

        let patched = 0;

        patchCreateElement(cleanups);
        patched++;

        if (patchQuestDockRender(cleanups)) patched++;
        if (patchQuestDockBase(cleanups)) patched++;
        if (patchMobileQuestDock(cleanups)) patched++;
        if (patchQuestEligibility(cleanups)) patched++;
        if (patchDockAssetPrefetch(cleanups)) patched++;
        if (patchExpanded(cleanups)) patched++;
        if (patchEmpty("QuestDockContentCollapsed", cleanups)) patched++;
        if (patchEmpty("QuestDockEnrolledHeader", cleanups)) patched++;
        if (patchEmpty("QuestDockUnenrolledHeader", cleanups)) patched++;
        if (patchEmpty("QuestDockEnrolledBody", cleanups)) patched++;
        if (patchEmpty("QuestDockUnenrolledBody", cleanups)) patched++;
        if (patchHideGuildsBar(cleanups)) patched++;
        if (patchTransparentBackground()) patched++;

        if (!isHidingComplete()) {
            console.log(TAG, "GuildsBar hiding not yet confirmed complete - type detectors + exact-ref intercepts still watching every render");
        }

        console.log(TAG, `onLoad done — ${patched} patches applied, ${cleanups.length} cleanups`);
    },
    onUnload() {
        console.log(TAG, "onUnload");
        for (const fn of cleanups) fn();
        cleanups.length = 0;
    },
    settings: Settings,
};
