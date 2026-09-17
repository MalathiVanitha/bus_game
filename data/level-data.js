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

    obstacles: [
        [5, 1, "cone"],
        [4, 3, "planter"],
        [1, 5, "cargo_pallet"]
    ],

    convoys: [{
        key: "yellow",
        exit: [0, 3],
        facing: 90,
        cells: [
            [1, 1],
            [2, 1],
            [3, 1]
        ]
    }, {
        key: "red",
        exit: [3, 0],
        facing: 90,
        cells: [
            [2, 4],
            [3, 4],
            [4, 4]
        ]
    }, {
        key: "cyan",
        exit: [6, 3],
        facing: 90,
        cells: [
            [5, 5],
            [4, 5],
            [3, 5]
        ]
    }]
}