// Which boosters the player has earned, and which they have been shown how to
// use. Every booster starts locked and opens, one at a time, on reaching its
// level; the first time it is there, the board stops and teaches it.
//
// Kept apart from the counts (levelScreen.js) so the bar, the level card and
// the lesson all read the one answer.

import { BOOSTERS } from './boosterList.js';

// The level each booster opens on.
export const UNLOCK_AT = {};

for (let i = 0; i < BOOSTERS.length; i++) UNLOCK_AT[BOOSTERS[i].key] = BOOSTERS[i].opens;

const STORE_KEY = 'baggage-out.unlocks';

function readStore() {
    const state = { reached: 1, taught: {} };

    try {
        const saved = JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}');

        if (isFinite(saved.reached)) state.reached = Math.max(1, Math.floor(saved.reached));
        if (saved.taught && typeof saved.taught === 'object') state.taught = saved.taught;
    } catch (e) {
        // Starts from the beginning, locked.
    }

    return state;
}

function writeStore(state) {
    try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
        // Nothing worth stopping the game for.
    }
}

const state = readStore();

export const unlocks = {
    /** The furthest level played. The level itself isn't saved, so this is. */
    reach(level) {
        if (level <= state.reached) return;

        state.reached = level;
        writeStore(state);
    },

    /** Open, on the furthest level played or on the one about to be. */
    isUnlocked(key, level = 0) {
        return Math.max(state.reached, level) >= (UNLOCK_AT[key] || 1);
    },

    wasTaught(key) {
        return !!state.taught[key];
    },

    teach(key) {
        state.taught[key] = true;
        writeStore(state);
    },

    /** Open and not yet shown how it works. */
    needsLesson(key) {
        return this.isUnlocked(key) && !this.wasTaught(key);
    }
};
