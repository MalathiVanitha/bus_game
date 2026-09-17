// A small square board to learn the game on: every cell is road, the three
// garages sit in the middle of three edges so each doorway looks straight in
// at the board, and the convoys are short enough to read at a glance.
//
// The one thing it asks for is an order. Yellow is parked across red's
// doorstep, so red cannot be driven home until yellow is out of the way; cyan
// is clear from the start and can go whenever.
//
// Each garage is turned by hand here, in degrees the way the screen turns: 0
// looks right, 90 down, 180 left, 270 up. The doorway, and so the cell the
// convoy drives in from, follows the angle. Drop the field and the garage goes
// back to being turned by where it stands.
export default {

    rows: 7,
    columns: 7,

    time: 60,

    pattern: [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1]
    ],

    // Off to the sides of the three routes, so they dress the board and narrow
    // it without ever standing in the way of a convoy that is driven sensibly.
    obstacles: [
        [5, 1, "cone"],
        [4, 3, "planter"],
        [1, 5, "cargo_pallet"]
    ],

    convoys: [{
        // Straight down the second column and in through the left-hand door.
        key: "yellow",
        exit: [0, 3],
        facing: 0,
        cells: [
            [1, 1],
            [2, 1],
            [3, 1]
        ]
    }, {
        // Up the third column and across the top - the long way round, and only
        // once yellow has pulled its last cart off the top row.
        key: "red",
        exit: [3, 0],
        facing: 90,
        cells: [
            [2, 4],
            [3, 4],
            [4, 4]
        ]
    }, {
        // Two cells up and in through the right-hand door.
        key: "cyan",
        exit: [6, 3],
        facing: 180,
        cells: [
            [5, 5],
            [4, 5],
            [3, 5]
        ]
    }]
}
