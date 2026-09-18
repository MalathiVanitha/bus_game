export default {
    rows: 8,
    columns: 8,

    time: 60,

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

    obstacles: [],

    // Each wall is one piece of hedge, crate or concrete, laid over the cells it
    // lists. Cells of the same wall that sit side by side join up; see
    // Board.placeWalls().
    walls: [
        // L
        {
            style: "hedge-green",
            cells: [[1, 1], [1, 2], [2, 2]]
        },
        // U
        {
            style: "hedge-lime",
            cells: [[4, 1], [4, 2], [5, 2], [6, 2], [6, 1]]
        },
        // T
        {
            style: "hedge-teal",
            cells: [[1, 4], [2, 4], [3, 4], [2, 5]]
        },
        // Steps: touching only at the corners, so each cell keeps its own outline
        {
            style: "hedge-autumn",
            cells: [[5, 4], [6, 5], [7, 5]]
        }
    ],

    convoys: [{
        key: "yellow",
        exit: [0, 7],
        facing: 0,
        cells: [
            [4, 7],
            [5, 7],
            [6, 7]
        ]
    }, {
        key: "red",
        exit: [7, 0],
        facing: 90,
        cells: [
            [5, 3],
            [4, 3],
            [3, 3]
        ]
    }, {
        key: "cyan",
        exit: [0, 0],
        facing: 0,
        cells: [
            [4, 4],
            [4, 5],
            [4, 6]
        ]
    }]
}