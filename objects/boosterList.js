// Every booster, in the order they stand on the bar and the level card. The
// bar, the card, the lesson and the unlocks all read this one list, so a new
// booster is added here and nowhere else.
//
// opens: the level it unlocks on. label: its name under the tile. title and
// noun: the "get more" offer's. pick: the line under the bar while it waits
// for a tap on the board, for the ones that ask for one. body: what the
// first-time lesson's card says it does.

export const BOOSTERS = [
    {
        key: 'hint',
        icon: 'icons/icon-hint',
        opens: 3,
        label: 'Hint',
        title: 'Get more hints?',
        noun: 'hints',
        body: 'Lights up a convoy that can drive home right now, and the way to its garage.'
    },
    {
        key: 'remove',
        icon: 'icons/icon-recycle',
        opens: 5,
        label: 'Remove',
        title: 'Get more removes?',
        noun: 'removes',
        pick: 'Tap a convoy to remove it',
        body: 'Takes any convoy off the board. Save it for one that is stuck in the way!'
    },
    {
        key: 'crane',
        icon: 'icons/icon-crane',
        opens: 8,
        label: 'Crane',
        title: 'Get more cranes?',
        noun: 'cranes',
        pick: 'Tap an obstacle to lift it',
        body: 'Lifts a cone, a planter, a pallet or one block of wall clean off the board.'
    }
];

export function boosterFor(key) {
    return BOOSTERS.find((b) => b.key === key) || null;
}
