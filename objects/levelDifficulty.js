// How hard a level is: its own "difficulty" in data/level-data.js, nothing
// worked out here. Hard and Super Hard levels have tighter boards
// (tools/harden-levels.mjs) and their data's time is already their shorter
// clock. The level card colours its banner by this.

import levels from '../data/level-data.js';

export const NORMAL = 'normal';
export const HARD = 'hard';
export const SUPER_HARD = 'superHard';

/** The data for a level number, wrapping past the last level as the game does. */
export function levelData(level) {
    return levels[((level || 1) - 1) % levels.length];
}

export function difficulty(level) {
    return levelData(level).difficulty || NORMAL;
}
