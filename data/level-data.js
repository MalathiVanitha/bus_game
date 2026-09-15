export default {

    rows: 8,
    columns: 8,

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

    // Cones sit on a cell and take it out of the board for everyone, the same way
    // a 0 in the pattern does. Laid out to match the storyboard.
    cones: [
        [6, 0],
        [1, 2],
        [4, 2],
        [3, 3],
        [0, 4],
        [3, 6],
        [7, 7]
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