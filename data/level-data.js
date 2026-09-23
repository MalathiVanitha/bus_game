export default [
    {
        rows: 9,
        columns: 8,

        time: 75,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 0, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1]
        ],

        obstacles: [
            [4, 1, "planter"],
            [7, 2, "cone"],
            [1, 7, "cone"]
        ],

        walls: [
            {
                style: "hedge-green",
                cells: [
                    [0, 1],
                    [0, 2],
                    [1, 2]
                ]
            },
            {
                style: "concrete-wall",
                cells: [
                    [5, 7]
                ]
            }
        ],

        convoys: [{
            key: "pink",
            exit: [7, 3],
            facing: 90,
            cells: [
                [6, 0],
                [5, 0],
                [4, 0],
                [3, 0]
            ]
        }, {
            key: "cyan",
            exit: [6, 7],
            facing: 90,
            cells: [
                [2, 2],
                [3, 2],
                [4, 2]
            ]
        }, {
            key: "blue",
            exit: [5, 8],
            facing: 90,
            cells: [
                [6, 3],
                [6, 4],
                [6, 5]
            ]
        }, {
            key: "orange",
            exit: [0, 4],
            facing: 90,
            cells: [
                [2, 8],
                [3, 8],
                [4, 8]
            ]
        }, {
            key: "yellow",
            exit: [1, 8],
            facing: 90,
            cells: [
                [3, 6],
                [4, 6],
                [5, 6]
            ]
        }, {
            key: "red",
            exit: [1, 0],
            facing: 90,
            cells: [
                [5, 5],
                [4, 5],
                [3, 5]
            ]
        }]
    },

    // Level 2
    {
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

        obstacles: [
            [5, 1, "cone"],
            // [4, 3, "planter"],
            [1, 5, "cargo_pallet"]
        ],

        walls: [
            // L
            {
                style: "hedge-green",
                cells: [
                    [1, 1],
                    [1, 2],
                    [2, 2]
                ]
            },
            // U
            {
                style: "hedge-lime",
                cells: [
                    [4, 1],
                    [4, 2],
                    [5, 2],
                    [6, 2],
                    [6, 1]
                ]
            },
            // T
            {
                style: "concrete-wall",
                cells: [
                    [1, 4],
                    [2, 4],
                    [3, 4],
                    [2, 5]
                ]
            },
            // Steps: touching only at the corners, so each cell keeps its own outline
            {
                style: "hedge-autumn",
                cells: [
                    [5, 4],
                    [6, 5],
                    [7, 5]
                ]
            }
        ],

        convoys: [{
            key: "yellow",
            exit: [0, 6],
            facing: 90,
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
            facing: 90,
            cells: [
                [4, 4],
                [4, 5],
                [4, 6]
            ]
        }]
    },

    // Level 3
    {
        rows: 8,
        columns: 8,

        time: 60,

        pattern: [
            [1, 1, 1, 1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1]
        ],

        obstacles: [],

        walls: [{
                style: "hedge-green",
                cells: [
                    [4, 0],
                    [5, 0],
                    [6, 0],
                    [7, 0]
                ]
            },
            {
                style: "concrete-wall",
                cells: [
                    [0, 2],
                    [1, 2],
                    [2, 2],
                    [3, 2]
                ]
            },
            {
                style: "hedge-lime",
                cells: [
                    [4, 4],
                    [5, 4],
                    [6, 4],
                    [7, 4]
                ]
            },
            {
                style: "hedge-autumn",
                cells: [
                    [0, 6],
                    [1, 6],
                    [2, 6],
                    [3, 6]
                ]
            }
        ],

        convoys: [{
            key: "pink",
            exit: [0, 0],
            facing: 90,
            cells: [
                [4, 1],
                [5, 1],
                [6, 1]
            ]
        }, {
            key: "blue",
            exit: [7, 2],
            facing: 90,
            cells: [
                [3, 3],
                [2, 3],
                [1, 3],
                [0, 3]
            ]
        }, {
            key: "orange",
            exit: [0, 4],
            facing: 90,
            cells: [
                [4, 5],
                [5, 5],
                [6, 5]
            ]
        }, {
            key: "red",
            exit: [7, 6],
            facing: 90,
            cells: [
                [3, 7],
                [2, 7],
                [1, 7],
                [0, 7]
            ]
        }]
    }
]