export default {

    rows: 8,
    columns: 8,

    // Seconds on the clock. Running it out is what loses the level, and what
    // the end card's fail face offers to put more of back.
    time: 90,

    // 1 is tarmac a convoy can drive over. 0 is a gap in the board - nothing is
    // drawn there and nothing can be routed through it.
    pattern: [
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1]
    ],

    // An obstacle sits on a cell and takes it out of the board for everyone, the
    // same way a 0 in the pattern does - the difference is that it is a thing
    // standing on the tarmac, so driving into one is worth a knock.
    //
    // Column, row, and which of the pieces in the obstacle art to stand there.
    // Leave the name off for a cone. Laid out to match the storyboard.
    obstacles: [
        [6, 0, "cargo_container"],
        [1, 2],
        [4, 2, "barrier"],
        [3, 3],
        [0, 4, "planter"],
        [3, 6, "cargo_pallet"],
        [7, 7, "service_cabinet"]
    ],

    // Tractor first, then each cart back down the line. Cells have to be a
    // connected run of neighbours - the trail is built straight off them.
    //
    // `exit` is the convoy's own garage. Nobody else may route through it, and
    // driving this convoy's tractor onto it pulls the whole convoy in.
    convoys: [{
        key: "red",
        exit: [0, 1],
        cells: [
            [4, 1],
            [3, 1],
            [2, 1],
            [1, 1]
        ]
    }]
}