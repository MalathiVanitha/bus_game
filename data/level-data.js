// 50 levels, easiest first. Levels 1-3 are open boards, cones and planters
// arrive at 4, walls at 7, bent convoys at 11 and cut corners at 16; each
// band adds a convoy or a wall and one more round of "clear that one first".
// Every generated level is solvable by driving the convoys home one at a time.
export default [
    // Level 1
    {
        rows: 7,
        columns: 6,
        time: 50,
        pattern: [
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1]
        ],
        obstacles: [],
        walls: [],
        convoys: [{
                key: "purple",
                exit: [4, 5],
                facing: 90,
                cells: [
                    [3, 0],
                    [4, 0],
                    [5, 0]
                ]
            },
            {
                key: "blue",
                exit: [1, 3],
                facing: 90,
                cells: [
                    [3, 2],
                    [4, 2],
                    [5, 2]
                ]
            }
        ]
    },

    // Level 2
    {
        rows: 7,
        columns: 6,
        time: 60,
        pattern: [
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1]
        ],
        obstacles: [],
        walls: [],
        convoys: [{
                key: "green",
                exit: [3, 3],
                facing: 90,
                cells: [
                    [0, 0],
                    [1, 0],
                    [2, 0]
                ]
            },
            {
                key: "purple",
                exit: [4, 3],
                facing: 90,
                cells: [
                    [2, 5],
                    [1, 5],
                    [0, 5]
                ]
            },
            {
                key: "red",
                exit: [4, 4],
                facing: 90,
                cells: [
                    [5, 6],
                    [4, 6],
                    [3, 6]
                ]
            }
        ]
    },

    // Level 3
    {
        rows: 7,
        columns: 6,
        time: 60,
        pattern: [
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1]
        ],
        obstacles: [],
        walls: [],
        convoys: [{
                key: "cyan",
                exit: [4, 1],
                facing: 90,
                cells: [
                    [0, 3],
                    [0, 2],
                    [0, 1]
                ]
            },
            {
                key: "purple",
                exit: [3, 1],
                facing: 90,
                cells: [
                    [5, 0],
                    [5, 1],
                    [5, 2]
                ]
            },
            {
                key: "red",
                exit: [0, 4],
                facing: 90,
                cells: [
                    [2, 0],
                    [2, 1],
                    [2, 2]
                ]
            }
        ]
    },

    // Level 4
    {
        rows: 7,
        columns: 6,
        time: 65,
        pattern: [
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1]
        ],
        obstacles: [
            [0, 0, "planter"]
        ],
        walls: [],
        convoys: [{
                key: "white",
                exit: [5, 6],
                facing: 90,
                cells: [
                    [5, 1],
                    [4, 1],
                    [3, 1]
                ]
            },
            {
                key: "pink",
                exit: [5, 0],
                facing: 90,
                cells: [
                    [1, 6],
                    [1, 5],
                    [1, 4]
                ]
            },
            {
                key: "purple",
                exit: [4, 2],
                facing: 90,
                cells: [
                    [0, 1],
                    [1, 1],
                    [2, 1]
                ]
            }
        ]
    },

    // Level 5
    {
        rows: 7,
        columns: 6,
        time: 65,
        pattern: [
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1]
        ],
        obstacles: [
            [0, 6, "cone"],
            [5, 3, "cone"]
        ],
        walls: [],
        convoys: [{
                key: "white",
                exit: [4, 1],
                facing: 90,
                cells: [
                    [0, 2],
                    [1, 2],
                    [2, 2]
                ]
            },
            {
                key: "red",
                exit: [1, 3],
                facing: 90,
                cells: [
                    [5, 2],
                    [4, 2],
                    [3, 2]
                ]
            },
            {
                key: "orange",
                exit: [5, 1],
                facing: 90,
                cells: [
                    [4, 3],
                    [4, 4],
                    [4, 5]
                ]
            }
        ]
    },

    // Level 6
    {
        rows: 7,
        columns: 6,
        time: 65,
        pattern: [
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1]
        ],
        obstacles: [
            [3, 1, "planter"]
        ],
        walls: [],
        convoys: [{
                key: "white",
                exit: [1, 0],
                facing: 90,
                cells: [
                    [2, 3],
                    [1, 3],
                    [0, 3]
                ]
            },
            {
                key: "purple",
                exit: [0, 2],
                facing: 90,
                cells: [
                    [5, 5],
                    [5, 4],
                    [5, 3]
                ]
            },
            {
                key: "orange",
                exit: [0, 0],
                facing: 90,
                cells: [
                    [5, 2],
                    [4, 2],
                    [3, 2]
                ]
            }
        ]
    },

    // Level 7
    {
        rows: 8,
        columns: 7,
        time: 70,
        pattern: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ],
        obstacles: [
            [4, 4, "cargo_container"],
            [5, 3, "cone"]
        ],
        walls: [{
            style: "hedge-lime",
            cells: [
                [5, 6],
                [4, 6],
                [3, 6]
            ]
        }],
        convoys: [{
                key: "purple",
                exit: [1, 4],
                facing: 90,
                cells: [
                    [3, 3],
                    [3, 4],
                    [3, 5]
                ]
            },
            {
                key: "yellow",
                exit: [1, 6],
                facing: 90,
                cells: [
                    [6, 6],
                    [6, 5],
                    [6, 4]
                ]
            },
            {
                key: "orange",
                exit: [6, 7],
                facing: 90,
                cells: [
                    [6, 2],
                    [6, 1],
                    [6, 0]
                ]
            },
            {
                key: "white",
                exit: [2, 7],
                facing: 90,
                cells: [
                    [3, 2],
                    [4, 2],
                    [5, 2]
                ]
            }
        ]
    },

    // Level 8
    {
        rows: 8,
        columns: 7,
        time: 70,
        pattern: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ],
        obstacles: [
            [0, 2, "cargo_pallet"]
        ],
        walls: [{
            style: "hedge-lime",
            cells: [
                [1, 4],
                [0, 4]
            ]
        }],
        convoys: [{
                key: "red",
                exit: [6, 3],
                facing: 90,
                cells: [
                    [2, 6],
                    [2, 5],
                    [2, 4]
                ]
            },
            {
                key: "blue",
                exit: [2, 7],
                facing: 90,
                cells: [
                    [5, 2],
                    [4, 2],
                    [3, 2]
                ]
            },
            {
                key: "lime",
                exit: [0, 6],
                facing: 90,
                cells: [
                    [6, 4],
                    [5, 4],
                    [4, 4]
                ]
            },
            {
                key: "white",
                exit: [4, 3],
                facing: 90,
                cells: [
                    [5, 5],
                    [4, 5],
                    [3, 5]
                ]
            }
        ]
    },

    // Level 9
    {
        rows: 8,
        columns: 7,
        time: 70,
        pattern: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ],
        obstacles: [
            [3, 1, "barrier"],
            [5, 4, "barrier"]
        ],
        walls: [{
            style: "concrete-wall",
            cells: [
                [5, 1],
                [5, 0]
            ]
        }],
        convoys: [{
                key: "blue",
                exit: [3, 5],
                facing: 90,
                cells: [
                    [1, 4],
                    [1, 5],
                    [1, 6]
                ]
            },
            {
                key: "lime",
                exit: [5, 6],
                facing: 90,
                cells: [
                    [4, 0],
                    [4, 1],
                    [4, 2]
                ]
            },
            {
                key: "orange",
                exit: [6, 0],
                facing: 90,
                cells: [
                    [0, 1],
                    [1, 1],
                    [2, 1]
                ]
            },
            {
                key: "purple",
                exit: [6, 1],
                facing: 90,
                cells: [
                    [3, 3],
                    [4, 3],
                    [5, 3]
                ]
            }
        ]
    },

    // Level 10
    {
        rows: 8,
        columns: 7,
        time: 70,
        pattern: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ],
        obstacles: [
            [2, 1, "cargo_container"]
        ],
        walls: [{
            style: "hedge-lime",
            cells: [
                [2, 5],
                [2, 6],
                [2, 7]
            ]
        }],
        convoys: [{
                key: "purple",
                exit: [0, 1],
                facing: 90,
                cells: [
                    [4, 6],
                    [4, 5],
                    [4, 4]
                ]
            },
            {
                key: "pink",
                exit: [3, 4],
                facing: 90,
                cells: [
                    [4, 7],
                    [5, 7],
                    [6, 7]
                ]
            },
            {
                key: "yellow",
                exit: [1, 5],
                facing: 90,
                cells: [
                    [3, 0],
                    [4, 0],
                    [5, 0]
                ]
            },
            {
                key: "blue",
                exit: [5, 3],
                facing: 90,
                cells: [
                    [1, 4],
                    [1, 3],
                    [1, 2]
                ]
            }
        ]
    },

    // Level 11
    {
        rows: 8,
        columns: 7,
        time: 70,
        pattern: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ],
        obstacles: [
            [6, 2, "planter"],
            [1, 0, "service_cabinet"]
        ],
        walls: [{
                style: "concrete-wall",
                cells: [
                    [2, 6],
                    [1, 6]
                ]
            },
            {
                style: "hedge-autumn",
                cells: [
                    [2, 2],
                    [2, 1]
                ]
            }
        ],
        convoys: [{
                key: "blue",
                exit: [0, 2],
                facing: 90,
                cells: [
                    [2, 5],
                    [2, 4],
                    [2, 3]
                ]
            },
            {
                key: "green",
                exit: [0, 4],
                facing: 90,
                cells: [
                    [5, 6],
                    [4, 6],
                    [3, 6]
                ]
            },
            {
                key: "pink",
                exit: [5, 2],
                facing: 90,
                cells: [
                    [6, 4],
                    [5, 4],
                    [4, 4],
                    [3, 4]
                ]
            },
            {
                key: "white",
                exit: [0, 7],
                facing: 90,
                cells: [
                    [2, 0],
                    [3, 0],
                    [4, 0]
                ]
            }
        ]
    },

    // Level 12
    {
        rows: 8,
        columns: 7,
        time: 70,
        pattern: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ],
        obstacles: [
            [2, 4, "planter"],
            [1, 6, "planter"]
        ],
        walls: [{
                style: "hedge-teal",
                cells: [
                    [1, 1],
                    [1, 0]
                ]
            },
            {
                style: "hedge-autumn",
                cells: [
                    [5, 6],
                    [5, 7],
                    [6, 7]
                ]
            }
        ],
        convoys: [{
                key: "lime",
                exit: [0, 7],
                facing: 90,
                cells: [
                    [5, 1],
                    [4, 1],
                    [3, 1],
                    [2, 1]
                ]
            },
            {
                key: "green",
                exit: [0, 3],
                facing: 90,
                cells: [
                    [4, 7],
                    [3, 7],
                    [3, 6]
                ]
            },
            {
                key: "purple",
                exit: [5, 4],
                facing: 90,
                cells: [
                    [0, 5],
                    [1, 5],
                    [2, 5],
                    [3, 5]
                ]
            },
            {
                key: "yellow",
                exit: [4, 5],
                facing: 90,
                cells: [
                    [3, 2],
                    [4, 2],
                    [5, 2]
                ]
            }
        ]
    },

    // Level 13 (hand-made)
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
            [1, 5, "cargo_pallet"]
        ],
        walls: [{
                style: "hedge-green",
                cells: [
                    [1, 1],
                    [1, 2],
                    [2, 2]
                ]
            },
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
            {
                style: "concrete-wall",
                cells: [
                    [1, 4],
                    [2, 4],
                    [3, 4],
                    [2, 5]
                ]
            },
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
            },
            {
                key: "red",
                exit: [7, 0],
                facing: 90,
                cells: [
                    [5, 3],
                    [4, 3],
                    [3, 3]
                ]
            },
            {
                key: "cyan",
                exit: [0, 0],
                facing: 90,
                cells: [
                    [4, 4],
                    [4, 5],
                    [4, 6]
                ]
            }
        ]
    },

    // Level 14 (hand-made)
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
            },
            {
                key: "blue",
                exit: [7, 2],
                facing: 90,
                cells: [
                    [3, 3],
                    [2, 3],
                    [1, 3],
                    [0, 3]
                ]
            },
            {
                key: "orange",
                exit: [0, 4],
                facing: 90,
                cells: [
                    [4, 5],
                    [5, 5],
                    [6, 5]
                ]
            },
            {
                key: "red",
                exit: [7, 6],
                facing: 90,
                cells: [
                    [3, 7],
                    [2, 7],
                    [1, 7],
                    [0, 7]
                ]
            }
        ]
    },

    // Level 15
    {
        rows: 8,
        columns: 7,
        time: 70,
        pattern: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ],
        obstacles: [
            [4, 6, "planter"],
            [3, 5, "service_cabinet"]
        ],
        walls: [{
                style: "concrete-wall",
                cells: [
                    [6, 4],
                    [5, 4],
                    [4, 4]
                ]
            },
            {
                style: "hedge-lime",
                cells: [
                    [1, 4],
                    [2, 4]
                ]
            }
        ],
        convoys: [{
                key: "red",
                exit: [2, 6],
                facing: 90,
                cells: [
                    [5, 0],
                    [5, 1],
                    [5, 2],
                    [6, 2]
                ]
            },
            {
                key: "yellow",
                exit: [4, 1],
                facing: 90,
                cells: [
                    [6, 5],
                    [5, 5],
                    [4, 5]
                ]
            },
            {
                key: "white",
                exit: [0, 0],
                facing: 90,
                cells: [
                    [0, 4],
                    [0, 5],
                    [0, 6],
                    [0, 7]
                ]
            },
            {
                key: "blue",
                exit: [2, 1],
                facing: 90,
                cells: [
                    [6, 3],
                    [5, 3],
                    [4, 3],
                    [3, 3]
                ]
            }
        ]
    },

    // Level 16
    {
        rows: 8,
        columns: 7,
        time: 80,
        pattern: [
            [0, 0, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ],
        obstacles: [
            [1, 6, "cargo_pallet"],
            [0, 5, "planter"]
        ],
        walls: [{
                style: "hedge-lime",
                cells: [
                    [3, 5],
                    [3, 6],
                    [4, 6]
                ]
            },
            {
                style: "hedge-autumn",
                cells: [
                    [5, 1],
                    [5, 2],
                    [5, 3],
                    [6, 2]
                ]
            }
        ],

        convoys: [{
                key: "yellow",
                exit: [4, 1],
                facing: 90,
                cells: [
                    [1, 3],
                    [1, 4],
                    [1, 5]
                ]
            },
            {
                key: "red",
                exit: [4, 0],
                facing: 90,
                cells: [
                    [3, 2],
                    [3, 3],
                    [2, 3]
                ]
            },
            {
                key: "orange",
                exit: [2, 0],
                facing: 90,
                cells: [
                    [4, 7],
                    [3, 7],
                    [2, 7]
                ]
            },
            {
                key: "blue",
                exit: [0, 7],
                facing: 90,
                cells: [
                    [6, 5],
                    [5, 5],
                    [5, 6]
                ]
            },
            {
                key: "lime",
                exit: [6, 7],
                facing: 90,
                cells: [
                    [2, 4],
                    [3, 4],
                    [4, 4],
                    [5, 4]
                ]
            }
        ]
    },

    // Level 17
    {
        rows: 8,
        columns: 7,

        time: 80,

        pattern: [
            [0, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ],

        obstacles: [
            [2, 1, "barrier"],
            [5, 2, "barrier"]
        ],

        walls: [{
                style: "hedge-teal",
                cells: [
                    [4, 7],
                    [4, 6],
                    [4, 5]
                ]
            },
            {
                style: "cargo-wall",
                cells: [
                    [2, 5],
                    [1, 5],
                    [0, 5],
                    [1, 6]
                ]
            }
        ],

        convoys: [{
                key: "pink",
                exit: [4, 4],
                facing: 90,
                cells: [
                    [3, 0],
                    [3, 1],
                    [3, 2]
                ]
            },
            {
                key: "red",
                exit: [5, 4],
                facing: 90,
                cells: [
                    [3, 6],
                    [3, 5],
                    [3, 4],
                    [3, 3]
                ]
            },
            {
                key: "yellow",
                exit: [1, 7],
                facing: 90,
                cells: [
                    [6, 2],
                    [6, 3],
                    [6, 4],
                    [6, 5]
                ]
            },
            {
                key: "green",
                exit: [0, 6],
                facing: 90,
                cells: [
                    [2, 2],
                    [1, 2],
                    [0, 2]
                ]
            },
            {
                key: "cyan",
                exit: [2, 0],
                facing: 90,
                cells: [
                    [5, 6],
                    [5, 7],
                    [6, 7]
                ]
            }
        ]
    },

    // Level 18
    {
        rows: 8,
        columns: 7,

        time: 80,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [0, 0, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [5, 1, "planter"],
            [4, 2, "service_cabinet"],
            [1, 0, "cargo_pallet"]
        ],

        walls: [{
                style: "hedge-autumn",
                cells: [
                    [4, 7],
                    [4, 6],
                    [4, 5],
                    [3, 5]
                ]
            },
            {
                style: "hedge-green",
                cells: [
                    [1, 4],
                    [1, 3],
                    [0, 3]
                ]
            }
        ],

        convoys: [{
                key: "orange",
                exit: [6, 6],
                facing: 90,
                cells: [
                    [0, 1],
                    [1, 1],
                    [2, 1]
                ]
            },
            {
                key: "cyan",
                exit: [6, 1],
                facing: 90,
                cells: [
                    [0, 6],
                    [1, 6],
                    [2, 6],
                    [3, 6]
                ]
            },
            {
                key: "purple",
                exit: [0, 5],
                facing: 90,
                cells: [
                    [5, 3],
                    [4, 3],
                    [3, 3]
                ]
            },
            {
                key: "lime",
                exit: [2, 7],
                facing: 90,
                cells: [
                    [4, 0],
                    [5, 0],
                    [6, 0]
                ]
            },
            {
                key: "pink",
                exit: [1, 2],
                facing: 90,
                cells: [
                    [6, 5],
                    [6, 4],
                    [6, 3]
                ]
            }
        ]
    },

    // Level 19
    {
        rows: 8,
        columns: 7,

        time: 80,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [0, 0, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [2, 1, "barrier"],
            [0, 5, "planter"]
        ],

        walls: [{
                style: "cargo-wall",
                cells: [
                    [3, 4],
                    [2, 4],
                    [1, 4],
                    [2, 5]
                ]
            },
            {
                style: "hedge-autumn",
                cells: [
                    [5, 5],
                    [5, 6],
                    [4, 6]
                ]
            }
        ],

        convoys: [{
                key: "purple",
                exit: [1, 1],
                facing: 90,
                cells: [
                    [2, 3],
                    [2, 2],
                    [3, 2]
                ]
            },
            {
                key: "orange",
                exit: [0, 2],
                facing: 90,
                cells: [
                    [5, 3],
                    [5, 2],
                    [5, 1],
                    [5, 0]
                ]
            },
            {
                key: "lime",
                exit: [5, 4],
                facing: 90,
                cells: [
                    [1, 6],
                    [2, 6],
                    [3, 6]
                ]
            },
            {
                key: "red",
                exit: [0, 0],
                facing: 90,
                cells: [
                    [4, 1],
                    [4, 2],
                    [4, 3]
                ]
            },
            {
                key: "yellow",
                exit: [3, 5],
                facing: 90,
                cells: [
                    [1, 2],
                    [1, 3],
                    [0, 3]
                ]
            }
        ]
    },

    // Level 20
    {
        rows: 8,
        columns: 7,

        time: 80,

        pattern: [
            [0, 0, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ],

        obstacles: [
            [3, 3, "barrier"],
            [0, 5, "cargo_pallet"]
        ],

        walls: [{
                style: "cargo-wall",
                cells: [
                    [3, 7],
                    [3, 6],
                    [3, 5]
                ]
            },
            {
                style: "hedge-teal",
                cells: [
                    [2, 2],
                    [2, 1],
                    [1, 1]
                ]
            }
        ],

        convoys: [{
                key: "green",
                exit: [2, 7],
                facing: 90,
                cells: [
                    [5, 4],
                    [4, 4],
                    [3, 4],
                    [2, 4]
                ]
            },
            {
                key: "lime",
                exit: [1, 7],
                facing: 90,
                cells: [
                    [6, 6],
                    [6, 5],
                    [6, 4],
                    [6, 3]
                ]
            },
            {
                key: "purple",
                exit: [3, 1],
                facing: 90,
                cells: [
                    [0, 4],
                    [0, 3],
                    [0, 2]
                ]
            },
            {
                key: "cyan",
                exit: [2, 0],
                facing: 90,
                cells: [
                    [4, 1],
                    [4, 2],
                    [4, 3]
                ]
            },
            {
                key: "orange",
                exit: [5, 1],
                facing: 90,
                cells: [
                    [1, 5],
                    [1, 4],
                    [1, 3]
                ]
            }
        ]
    },

    // Level 21
    {
        rows: 9,
        columns: 8,

        time: 85,

        pattern: [
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1]
        ],

        obstacles: [
            [3, 1, "cargo_container"],
            [6, 8, "planter"],
            [6, 0, "cargo_container"]
        ],

        walls: [{
                style: "cargo-wall",
                cells: [
                    [1, 4],
                    [1, 3],
                    [2, 3],
                    [2, 2]
                ]
            },
            {
                style: "hedge-lime",
                cells: [
                    [7, 5],
                    [6, 5],
                    [5, 5],
                    [5, 4]
                ]
            }
        ],

        convoys: [{
                key: "red",
                exit: [5, 0],
                facing: 90,
                cells: [
                    [0, 2],
                    [0, 3],
                    [0, 4],
                    [0, 5]
                ]
            },
            {
                key: "orange",
                exit: [7, 6],
                facing: 90,
                cells: [
                    [3, 5],
                    [3, 6],
                    [3, 7]
                ]
            },
            {
                key: "lime",
                exit: [6, 4],
                facing: 90,
                cells: [
                    [2, 7],
                    [2, 6],
                    [2, 5],
                    [1, 5]
                ]
            },
            {
                key: "yellow",
                exit: [3, 0],
                facing: 90,
                cells: [
                    [5, 3],
                    [5, 2],
                    [5, 1]
                ]
            },
            {
                key: "green",
                exit: [7, 7],
                facing: 90,
                cells: [
                    [4, 8],
                    [3, 8],
                    [2, 8]
                ]
            },
            {
                key: "white",
                exit: [0, 6],
                facing: 90,
                cells: [
                    [6, 1],
                    [6, 2],
                    [6, 3]
                ]
            }
        ]
    },

    // Level 22 (hand-made)
    {
        rows: 9,
        columns: 8,

        time: 60,

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

        walls: [{
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
            },
            {
                key: "cyan",
                exit: [6, 7],
                facing: 90,
                cells: [
                    [2, 2],
                    [3, 2],
                    [4, 2]
                ]
            },
            {
                key: "blue",
                exit: [5, 8],
                facing: 90,
                cells: [
                    [6, 3],
                    [6, 4],
                    [6, 5]
                ]
            },
            {
                key: "orange",
                exit: [0, 4],
                facing: 90,
                cells: [
                    [2, 8],
                    [3, 8],
                    [4, 8]
                ]
            },
            {
                key: "yellow",
                exit: [1, 8],
                facing: 90,
                cells: [
                    [3, 6],
                    [4, 6],
                    [5, 6]
                ]
            },
            {
                key: "red",
                exit: [1, 0],
                facing: 90,
                cells: [
                    [5, 5],
                    [4, 5],
                    [3, 5]
                ]
            }
        ]
    },

    // Level 23
    {
        rows: 9,
        columns: 8,

        time: 80,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [2, 7, "cargo_pallet"],
            [7, 4, "planter"],
            [4, 3, "cargo_pallet"]
        ],

        walls: [{
                style: "hedge-teal",
                cells: [
                    [5, 2],
                    [5, 1],
                    [6, 1]
                ]
            },
            {
                style: "cargo-wall",
                cells: [
                    [5, 7],
                    [4, 7],
                    [4, 6]
                ]
            }
        ],

        convoys: [{
                key: "cyan",
                exit: [5, 6],
                facing: 90,
                cells: [
                    [3, 0],
                    [3, 1],
                    [3, 2],
                    [3, 3]
                ]
            },
            {
                key: "yellow",
                exit: [0, 0],
                facing: 90,
                cells: [
                    [7, 5],
                    [6, 5],
                    [5, 5]
                ]
            },
            {
                key: "lime",
                exit: [3, 8],
                facing: 90,
                cells: [
                    [5, 4],
                    [4, 4],
                    [3, 4],
                    [2, 4]
                ]
            },
            {
                key: "blue",
                exit: [7, 7],
                facing: 90,
                cells: [
                    [2, 6],
                    [1, 6],
                    [0, 6],
                    [0, 7]
                ]
            },
            {
                key: "green",
                exit: [4, 5],
                facing: 90,
                cells: [
                    [2, 1],
                    [1, 1],
                    [0, 1]
                ]
            }
        ]
    },

    // Level 24
    {
        rows: 9,
        columns: 8,

        time: 85,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [4, 1, "cone"],
            [7, 7, "cone"],
            [4, 5, "planter"]
        ],

        walls: [{
                style: "hedge-autumn",
                cells: [
                    [6, 6],
                    [6, 5],
                    [6, 4]
                ]
            },
            {
                style: "cargo-wall",
                cells: [
                    [1, 7],
                    [1, 6],
                    [1, 5]
                ]
            }
        ],

        convoys: [{
                key: "lime",
                exit: [1, 0],
                facing: 90,
                cells: [
                    [4, 2],
                    [5, 2],
                    [5, 3]
                ]
            },
            {
                key: "blue",
                exit: [7, 4],
                facing: 90,
                cells: [
                    [2, 4],
                    [2, 5],
                    [2, 6],
                    [2, 7]
                ]
            },
            {
                key: "yellow",
                exit: [0, 1],
                facing: 90,
                cells: [
                    [2, 8],
                    [3, 8],
                    [4, 8]
                ]
            },
            {
                key: "orange",
                exit: [0, 5],
                facing: 90,
                cells: [
                    [3, 3],
                    [2, 3],
                    [1, 3]
                ]
            },
            {
                key: "pink",
                exit: [4, 6],
                facing: 90,
                cells: [
                    [7, 3],
                    [7, 2],
                    [7, 1],
                    [7, 0]
                ]
            },
            {
                key: "red",
                exit: [3, 4],
                facing: 90,
                cells: [
                    [5, 5],
                    [5, 6],
                    [5, 7]
                ]
            }
        ]
    },

    // Level 25
    {
        rows: 9,
        columns: 8,

        time: 80,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ],

        obstacles: [
            [6, 3, "service_cabinet"],
            [1, 7, "barrier"],
            [3, 8, "barrier"]
        ],

        walls: [{
                style: "hedge-autumn",
                cells: [
                    [5, 6],
                    [4, 6],
                    [3, 6],
                    [4, 7]
                ]
            },
            {
                style: "hedge-green",
                cells: [
                    [3, 1],
                    [3, 2],
                    [3, 3],
                    [2, 3]
                ]
            }
        ],

        convoys: [{
                key: "white",
                exit: [6, 8],
                facing: 90,
                cells: [
                    [4, 2],
                    [5, 2],
                    [6, 2],
                    [7, 2]
                ]
            },
            {
                key: "cyan",
                exit: [6, 1],
                facing: 90,
                cells: [
                    [2, 1],
                    [1, 1],
                    [0, 1],
                    [0, 2]
                ]
            },
            {
                key: "pink",
                exit: [6, 7],
                facing: 90,
                cells: [
                    [0, 4],
                    [1, 4],
                    [2, 4]
                ]
            },
            {
                key: "red",
                exit: [2, 8],
                facing: 90,
                cells: [
                    [3, 5],
                    [4, 5],
                    [5, 5]
                ]
            },
            {
                key: "yellow",
                exit: [4, 8],
                facing: 90,
                cells: [
                    [6, 0],
                    [5, 0],
                    [4, 0]
                ]
            }
        ]
    },

    // Level 26
    {
        rows: 9,
        columns: 8,

        time: 90,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ],

        obstacles: [
            [6, 1, "cone"],
            [7, 6, "cargo_container"],
            [5, 3, "service_cabinet"],
            [7, 2, "cone"]
        ],

        walls: [{
                style: "hedge-autumn",
                cells: [
                    [3, 5],
                    [3, 4],
                    [2, 4]
                ]
            },
            {
                style: "cargo-wall",
                cells: [
                    [1, 3],
                    [1, 2],
                    [0, 2]
                ]
            }
        ],

        convoys: [{
                key: "blue",
                exit: [5, 8],
                facing: 90,
                cells: [
                    [0, 7],
                    [1, 7],
                    [2, 7]
                ]
            },
            {
                key: "white",
                exit: [6, 4],
                facing: 90,
                cells: [
                    [4, 8],
                    [4, 7],
                    [4, 6],
                    [4, 5]
                ]
            },
            {
                key: "yellow",
                exit: [1, 0],
                facing: 90,
                cells: [
                    [3, 6],
                    [3, 7],
                    [3, 8]
                ]
            },
            {
                key: "orange",
                exit: [5, 7],
                facing: 90,
                cells: [
                    [2, 0],
                    [3, 0],
                    [4, 0]
                ]
            },
            {
                key: "cyan",
                exit: [6, 6],
                facing: 90,
                cells: [
                    [0, 1],
                    [1, 1],
                    [2, 1],
                    [3, 1]
                ]
            },
            {
                key: "green",
                exit: [7, 0],
                facing: 90,
                cells: [
                    [6, 5],
                    [5, 5],
                    [5, 6]
                ]
            }
        ]
    },

    // Level 27
    {
        rows: 9,
        columns: 8,

        time: 85,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ],

        obstacles: [
            [0, 2, "barrier"],
            [6, 6, "service_cabinet"],
            [5, 4, "cargo_container"],
            [6, 2, "cone"]
        ],

        walls: [{
                style: "hedge-lime",
                cells: [
                    [4, 6],
                    [4, 7],
                    [4, 8],
                    [3, 7]
                ]
            },
            {
                style: "concrete-wall",
                cells: [
                    [3, 0],
                    [4, 0],
                    [5, 0]
                ]
            }
        ],

        convoys: [{
                key: "green",
                exit: [0, 1],
                facing: 90,
                cells: [
                    [4, 2],
                    [4, 3],
                    [3, 3],
                    [2, 3]
                ]
            },
            {
                key: "purple",
                exit: [4, 5],
                facing: 90,
                cells: [
                    [2, 1],
                    [3, 1],
                    [4, 1],
                    [5, 1]
                ]
            },
            {
                key: "blue",
                exit: [3, 4],
                facing: 90,
                cells: [
                    [7, 1],
                    [7, 2],
                    [7, 3],
                    [7, 4]
                ]
            },
            {
                key: "cyan",
                exit: [2, 7],
                facing: 90,
                cells: [
                    [3, 5],
                    [2, 5],
                    [1, 5]
                ]
            },
            {
                key: "pink",
                exit: [1, 4],
                facing: 90,
                cells: [
                    [7, 7],
                    [6, 7],
                    [5, 7]
                ]
            },
            {
                key: "orange",
                exit: [0, 0],
                facing: 90,
                cells: [
                    [6, 5],
                    [6, 4],
                    [6, 3]
                ]
            }
        ]
    },

    // Level 28
    {
        rows: 9,
        columns: 8,

        time: 85,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [5, 8, "cargo_pallet"],
            [4, 1, "service_cabinet"],
            [1, 5, "cargo_container"]
        ],

        walls: [{
                style: "concrete-wall",
                cells: [
                    [0, 0],
                    [1, 0],
                    [2, 0],
                    [1, 1]
                ]
            },
            {
                style: "hedge-teal",
                cells: [
                    [7, 2],
                    [6, 2],
                    [6, 3],
                    [5, 3]
                ]
            },
            {
                style: "hedge-lime",
                cells: [
                    [3, 7],
                    [3, 6],
                    [4, 6]
                ]
            }
        ],

        convoys: [{
                key: "blue",
                exit: [3, 2],
                facing: 90,
                cells: [
                    [4, 0],
                    [5, 0],
                    [6, 0]
                ]
            },
            {
                key: "yellow",
                exit: [7, 0],
                facing: 90,
                cells: [
                    [5, 4],
                    [5, 5],
                    [5, 6]
                ]
            },
            {
                key: "pink",
                exit: [5, 2],
                facing: 90,
                cells: [
                    [2, 5],
                    [2, 6],
                    [2, 7],
                    [2, 8]
                ]
            },
            {
                key: "red",
                exit: [7, 5],
                facing: 90,
                cells: [
                    [7, 1],
                    [6, 1],
                    [5, 1]
                ]
            },
            {
                key: "purple",
                exit: [1, 6],
                facing: 90,
                cells: [
                    [6, 7],
                    [5, 7],
                    [4, 7]
                ]
            },
            {
                key: "green",
                exit: [4, 2],
                facing: 90,
                cells: [
                    [1, 2],
                    [0, 2],
                    [0, 1]
                ]
            }
        ]
    },

    // Level 29
    {
        rows: 9,
        columns: 8,

        time: 85,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [1, 7, "cone"],
            [5, 8, "service_cabinet"],
            [0, 6, "cargo_pallet"]
        ],

        walls: [{
                style: "hedge-green",
                cells: [
                    [6, 4],
                    [6, 5],
                    [6, 6],
                    [6, 7]
                ]
            },
            {
                style: "hedge-lime",
                cells: [
                    [2, 1],
                    [2, 2],
                    [2, 3],
                    [1, 3]
                ]
            }
        ],

        convoys: [{
                key: "purple",
                exit: [7, 0],
                facing: 90,
                cells: [
                    [4, 6],
                    [3, 6],
                    [3, 5]
                ]
            },
            {
                key: "yellow",
                exit: [1, 2],
                facing: 90,
                cells: [
                    [5, 0],
                    [4, 0],
                    [3, 0],
                    [3, 1]
                ]
            },
            {
                key: "lime",
                exit: [6, 3],
                facing: 90,
                cells: [
                    [0, 4],
                    [0, 5],
                    [1, 5],
                    [2, 5]
                ]
            },
            {
                key: "green",
                exit: [2, 8],
                facing: 90,
                cells: [
                    [5, 3],
                    [5, 2],
                    [5, 1]
                ]
            },
            {
                key: "orange",
                exit: [7, 3],
                facing: 90,
                cells: [
                    [3, 7],
                    [4, 7],
                    [5, 7]
                ]
            },
            {
                key: "red",
                exit: [1, 4],
                facing: 90,
                cells: [
                    [4, 2],
                    [4, 3],
                    [4, 4],
                    [4, 5]
                ]
            }
        ]
    },

    // Level 30
    {
        rows: 9,
        columns: 8,

        time: 85,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ],

        obstacles: [
            [6, 0, "cone"],
            [3, 3, "barrier"],
            [3, 0, "cargo_container"]
        ],

        walls: [{
                style: "hedge-autumn",
                cells: [
                    [0, 6],
                    [0, 5],
                    [1, 5]
                ]
            },
            {
                style: "hedge-green",
                cells: [
                    [6, 5],
                    [5, 5],
                    [4, 5],
                    [3, 5]
                ]
            }
        ],

        convoys: [{
                key: "green",
                exit: [0, 0],
                facing: 90,
                cells: [
                    [4, 4],
                    [3, 4],
                    [2, 4],
                    [1, 4]
                ]
            },
            {
                key: "cyan",
                exit: [7, 2],
                facing: 90,
                cells: [
                    [3, 2],
                    [2, 2],
                    [2, 3]
                ]
            },
            {
                key: "purple",
                exit: [7, 0],
                facing: 90,
                cells: [
                    [3, 7],
                    [2, 7],
                    [2, 8]
                ]
            },
            {
                key: "red",
                exit: [6, 4],
                facing: 90,
                cells: [
                    [4, 6],
                    [3, 6],
                    [2, 6],
                    [2, 5]
                ]
            },
            {
                key: "white",
                exit: [1, 6],
                facing: 90,
                cells: [
                    [7, 6],
                    [6, 6],
                    [5, 6]
                ]
            },
            {
                key: "pink",
                exit: [4, 3],
                facing: 90,
                cells: [
                    [2, 0],
                    [2, 1],
                    [1, 1],
                    [1, 0]
                ]
            }
        ]
    },

    // Level 31
    {
        rows: 9,
        columns: 8,

        time: 90,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [6, 7, "cargo_pallet"],
            [5, 0, "barrier"],
            [7, 0, "barrier"]
        ],

        walls: [{
                style: "concrete-wall",
                cells: [
                    [7, 5],
                    [7, 4],
                    [7, 3]
                ]
            },
            {
                style: "hedge-autumn",
                cells: [
                    [2, 6],
                    [2, 5],
                    [3, 5]
                ]
            },
            {
                style: "hedge-green",
                cells: [
                    [3, 3],
                    [3, 2],
                    [4, 2],
                    [4, 1]
                ]
            }
        ],

        convoys: [{
                key: "yellow",
                exit: [5, 1],
                facing: 90,
                cells: [
                    [5, 5],
                    [5, 6],
                    [5, 7]
                ]
            },
            {
                key: "blue",
                exit: [4, 4],
                facing: 90,
                cells: [
                    [2, 2],
                    [2, 1],
                    [1, 1]
                ]
            },
            {
                key: "red",
                exit: [1, 2],
                facing: 90,
                cells: [
                    [3, 4],
                    [2, 4],
                    [1, 4],
                    [0, 4]
                ]
            },
            {
                key: "orange",
                exit: [3, 1],
                facing: 90,
                cells: [
                    [0, 3],
                    [0, 2],
                    [0, 1],
                    [0, 0]
                ]
            },
            {
                key: "cyan",
                exit: [5, 2],
                facing: 90,
                cells: [
                    [5, 8],
                    [4, 8],
                    [3, 8]
                ]
            },
            {
                key: "pink",
                exit: [2, 3],
                facing: 90,
                cells: [
                    [6, 3],
                    [6, 4],
                    [6, 5]
                ]
            }
        ]
    },

    // Level 32
    {
        rows: 9,
        columns: 8,

        time: 95,

        pattern: [
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [7, 6, "cargo_pallet"],
            [3, 8, "planter"],
            [2, 0, "cargo_container"]
        ],

        walls: [{
                style: "hedge-teal",
                cells: [
                    [4, 6],
                    [3, 6],
                    [2, 6]
                ]
            },
            {
                style: "hedge-green",
                cells: [
                    [0, 2],
                    [1, 2],
                    [2, 2],
                    [2, 3]
                ]
            },
            {
                style: "concrete-wall",
                cells: [
                    [3, 4],
                    [4, 4],
                    [5, 4],
                    [4, 3]
                ]
            }
        ],

        convoys: [{
                key: "blue",
                exit: [0, 4],
                facing: 90,
                cells: [
                    [6, 7],
                    [5, 7],
                    [4, 7]
                ]
            },
            {
                key: "lime",
                exit: [0, 7],
                facing: 90,
                cells: [
                    [3, 5],
                    [4, 5],
                    [5, 5]
                ]
            },
            {
                key: "purple",
                exit: [1, 5],
                facing: 90,
                cells: [
                    [6, 0],
                    [5, 0],
                    [4, 0]
                ]
            },
            {
                key: "red",
                exit: [3, 3],
                facing: 90,
                cells: [
                    [6, 2],
                    [6, 3],
                    [6, 4]
                ]
            },
            {
                key: "pink",
                exit: [5, 2],
                facing: 90,
                cells: [
                    [7, 4],
                    [7, 3],
                    [7, 2],
                    [7, 1]
                ]
            },
            {
                key: "yellow",
                exit: [6, 6],
                facing: 90,
                cells: [
                    [2, 1],
                    [1, 1],
                    [0, 1]
                ]
            },
            {
                key: "cyan",
                exit: [4, 8],
                facing: 90,
                cells: [
                    [4, 2],
                    [3, 2],
                    [3, 1],
                    [3, 0]
                ]
            }
        ]
    },

    // Level 33
    {
        rows: 9,
        columns: 8,

        time: 90,

        pattern: [
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [7, 6, "cargo_container"],
            [4, 1, "service_cabinet"],
            [6, 1, "planter"]
        ],

        walls: [{
                style: "hedge-green",
                cells: [
                    [0, 2],
                    [1, 2],
                    [1, 3],
                    [2, 3]
                ]
            },
            {
                style: "hedge-lime",
                cells: [
                    [5, 5],
                    [4, 5],
                    [4, 4]
                ]
            },
            {
                style: "cargo-wall",
                cells: [
                    [2, 5],
                    [2, 6],
                    [2, 7],
                    [2, 8]
                ]
            }
        ],

        convoys: [{
                key: "orange",
                exit: [6, 7],
                facing: 90,
                cells: [
                    [5, 3],
                    [5, 2],
                    [5, 1],
                    [5, 0]
                ]
            },
            {
                key: "blue",
                exit: [4, 3],
                facing: 90,
                cells: [
                    [6, 2],
                    [6, 3],
                    [6, 4],
                    [6, 5]
                ]
            },
            {
                key: "purple",
                exit: [7, 4],
                facing: 90,
                cells: [
                    [2, 1],
                    [1, 1],
                    [0, 1]
                ]
            },
            {
                key: "pink",
                exit: [2, 0],
                facing: 90,
                cells: [
                    [7, 3],
                    [7, 2],
                    [7, 1]
                ]
            },
            {
                key: "red",
                exit: [0, 4],
                facing: 90,
                cells: [
                    [3, 4],
                    [3, 5],
                    [3, 6],
                    [3, 7]
                ]
            },
            {
                key: "lime",
                exit: [3, 0],
                facing: 90,
                cells: [
                    [2, 2],
                    [3, 2],
                    [4, 2]
                ]
            }
        ]
    },

    // Level 34
    {
        rows: 9,
        columns: 8,

        time: 95,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ],

        obstacles: [
            [4, 4, "cargo_container"],
            [3, 0, "cargo_pallet"],
            [3, 2, "cargo_pallet"]
        ],

        walls: [{
                style: "hedge-teal",
                cells: [
                    [1, 2],
                    [1, 3],
                    [0, 3]
                ]
            },
            {
                style: "concrete-wall",
                cells: [
                    [7, 6],
                    [6, 6],
                    [5, 6],
                    [6, 7]
                ]
            },
            {
                style: "hedge-autumn",
                cells: [
                    [7, 0],
                    [6, 0],
                    [6, 1],
                    [5, 1]
                ]
            }
        ],

        convoys: [{
                key: "lime",
                exit: [0, 6],
                facing: 90,
                cells: [
                    [5, 5],
                    [5, 4],
                    [6, 4],
                    [7, 4]
                ]
            },
            {
                key: "green",
                exit: [7, 5],
                facing: 90,
                cells: [
                    [3, 3],
                    [3, 4],
                    [3, 5],
                    [2, 5]
                ]
            },
            {
                key: "orange",
                exit: [1, 1],
                facing: 90,
                cells: [
                    [2, 7],
                    [3, 7],
                    [4, 7],
                    [5, 7]
                ]
            },
            {
                key: "cyan",
                exit: [2, 4],
                facing: 90,
                cells: [
                    [0, 0],
                    [1, 0],
                    [2, 0]
                ]
            },
            {
                key: "blue",
                exit: [0, 1],
                facing: 90,
                cells: [
                    [4, 3],
                    [5, 3],
                    [6, 3]
                ]
            },
            {
                key: "pink",
                exit: [5, 0],
                facing: 90,
                cells: [
                    [2, 6],
                    [1, 6],
                    [1, 5],
                    [1, 4]
                ]
            },
            {
                key: "yellow",
                exit: [1, 7],
                facing: 90,
                cells: [
                    [6, 8],
                    [5, 8],
                    [4, 8],
                    [3, 8]
                ]
            }
        ]
    },

    // Level 35
    {
        rows: 9,
        columns: 8,

        time: 90,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [3, 7, "barrier"],
            [6, 4, "cargo_container"],
            [4, 4, "cone"]
        ],

        walls: [{
                style: "hedge-green",
                cells: [
                    [2, 3],
                    [2, 4],
                    [2, 5],
                    [2, 6]
                ]
            },
            {
                style: "hedge-teal",
                cells: [
                    [7, 0],
                    [6, 0],
                    [5, 0],
                    [6, 1]
                ]
            },
            {
                style: "concrete-wall",
                cells: [
                    [0, 1],
                    [1, 1],
                    [2, 1],
                    [3, 1]
                ]
            }
        ],

        convoys: [{
                key: "green",
                exit: [7, 1],
                facing: 90,
                cells: [
                    [5, 2],
                    [5, 3],
                    [5, 4]
                ]
            },
            {
                key: "red",
                exit: [2, 8],
                facing: 90,
                cells: [
                    [7, 2],
                    [7, 3],
                    [7, 4],
                    [7, 5]
                ]
            },
            {
                key: "pink",
                exit: [0, 3],
                facing: 90,
                cells: [
                    [3, 5],
                    [3, 4],
                    [3, 3],
                    [3, 2]
                ]
            },
            {
                key: "lime",
                exit: [3, 0],
                facing: 90,
                cells: [
                    [5, 8],
                    [5, 7],
                    [5, 6],
                    [5, 5]
                ]
            },
            {
                key: "cyan",
                exit: [2, 7],
                facing: 90,
                cells: [
                    [2, 0],
                    [1, 0],
                    [0, 0]
                ]
            },
            {
                key: "orange",
                exit: [6, 3],
                facing: 90,
                cells: [
                    [0, 5],
                    [1, 5],
                    [1, 6],
                    [1, 7]
                ]
            }
        ]
    },

    // Level 36
    {
        rows: 10,
        columns: 8,

        time: 95,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ],

        obstacles: [
            [7, 7, "cargo_container"],
            [1, 8, "service_cabinet"],
            [0, 5, "cone"],
            [5, 7, "cargo_container"]
        ],

        walls: [{
                style: "concrete-wall",
                cells: [
                    [4, 3],
                    [4, 4],
                    [4, 5]
                ]
            },
            {
                style: "cargo-wall",
                cells: [
                    [6, 1],
                    [5, 1],
                    [4, 1],
                    [4, 0]
                ]
            },
            {
                style: "hedge-teal",
                cells: [
                    [1, 2],
                    [2, 2],
                    [3, 2],
                    [2, 3]
                ]
            }
        ],

        convoys: [{
                key: "orange",
                exit: [5, 5],
                facing: 90,
                cells: [
                    [2, 6],
                    [2, 5],
                    [2, 4],
                    [1, 4]
                ]
            },
            {
                key: "purple",
                exit: [7, 4],
                facing: 90,
                cells: [
                    [3, 0],
                    [2, 0],
                    [1, 0],
                    [0, 0]
                ]
            },
            {
                key: "lime",
                exit: [7, 5],
                facing: 90,
                cells: [
                    [6, 3],
                    [6, 2],
                    [5, 2],
                    [4, 2]
                ]
            },
            {
                key: "yellow",
                exit: [7, 6],
                facing: 90,
                cells: [
                    [3, 7],
                    [3, 8],
                    [3, 9]
                ]
            },
            {
                key: "blue",
                exit: [7, 0],
                facing: 90,
                cells: [
                    [0, 3],
                    [0, 2],
                    [0, 1]
                ]
            },
            {
                key: "cyan",
                exit: [5, 4],
                facing: 90,
                cells: [
                    [4, 6],
                    [5, 6],
                    [6, 6]
                ]
            },
            {
                key: "green",
                exit: [6, 9],
                facing: 90,
                cells: [
                    [1, 7],
                    [1, 6],
                    [1, 5]
                ]
            }
        ]
    },

    // Level 37
    {
        rows: 10,
        columns: 8,

        time: 95,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [5, 3, "cone"],
            [0, 2, "barrier"],
            [1, 8, "cargo_pallet"],
            [6, 6, "planter"]
        ],

        walls: [{
                style: "hedge-teal",
                cells: [
                    [6, 2],
                    [6, 1],
                    [6, 0]
                ]
            },
            {
                style: "hedge-autumn",
                cells: [
                    [1, 4],
                    [1, 5],
                    [1, 6],
                    [2, 5]
                ]
            },
            {
                style: "cargo-wall",
                cells: [
                    [4, 8],
                    [5, 8],
                    [6, 8]
                ]
            }
        ],

        convoys: [{
                key: "green",
                exit: [3, 8],
                facing: 90,
                cells: [
                    [4, 6],
                    [3, 6],
                    [2, 6]
                ]
            },
            {
                key: "cyan",
                exit: [7, 0],
                facing: 90,
                cells: [
                    [4, 5],
                    [4, 4],
                    [4, 3]
                ]
            },
            {
                key: "pink",
                exit: [3, 3],
                facing: 90,
                cells: [
                    [5, 7],
                    [6, 7],
                    [7, 7]
                ]
            },
            {
                key: "white",
                exit: [0, 3],
                facing: 90,
                cells: [
                    [5, 0],
                    [5, 1],
                    [4, 1],
                    [3, 1]
                ]
            },
            {
                key: "orange",
                exit: [1, 0],
                facing: 90,
                cells: [
                    [5, 4],
                    [5, 5],
                    [5, 6]
                ]
            },
            {
                key: "red",
                exit: [7, 1],
                facing: 90,
                cells: [
                    [4, 2],
                    [3, 2],
                    [2, 2]
                ]
            },
            {
                key: "purple",
                exit: [1, 3],
                facing: 90,
                cells: [
                    [2, 1],
                    [1, 1],
                    [0, 1]
                ]
            }
        ]
    },

    // Level 38
    {
        rows: 10,
        columns: 8,

        time: 95,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ],

        obstacles: [
            [7, 0, "planter"],
            [3, 9, "service_cabinet"],
            [6, 1, "cone"],
            [1, 8, "cone"]
        ],

        walls: [{
                style: "concrete-wall",
                cells: [
                    [5, 6],
                    [4, 6],
                    [4, 7],
                    [3, 7]
                ]
            },
            {
                style: "hedge-teal",
                cells: [
                    [7, 4],
                    [6, 4],
                    [5, 4],
                    [4, 4]
                ]
            },
            {
                style: "hedge-lime",
                cells: [
                    [2, 0],
                    [1, 0],
                    [0, 0]
                ]
            }
        ],

        convoys: [{
                key: "white",
                exit: [7, 1],
                facing: 90,
                cells: [
                    [4, 0],
                    [4, 1],
                    [4, 2]
                ]
            },
            {
                key: "yellow",
                exit: [0, 2],
                facing: 90,
                cells: [
                    [0, 5],
                    [0, 6],
                    [1, 6]
                ]
            },
            {
                key: "purple",
                exit: [1, 4],
                facing: 90,
                cells: [
                    [4, 8],
                    [3, 8],
                    [2, 8]
                ]
            },
            {
                key: "lime",
                exit: [2, 6],
                facing: 90,
                cells: [
                    [5, 7],
                    [5, 8],
                    [5, 9]
                ]
            },
            {
                key: "blue",
                exit: [5, 0],
                facing: 90,
                cells: [
                    [3, 3],
                    [3, 4],
                    [3, 5],
                    [3, 6]
                ]
            },
            {
                key: "red",
                exit: [1, 9],
                facing: 90,
                cells: [
                    [4, 3],
                    [5, 3],
                    [6, 3],
                    [7, 3]
                ]
            },
            {
                key: "cyan",
                exit: [0, 3],
                facing: 90,
                cells: [
                    [2, 1],
                    [2, 2],
                    [2, 3],
                    [2, 4]
                ]
            }
        ]
    },

    // Level 39
    {
        rows: 10,
        columns: 8,

        time: 95,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [2, 6, "cargo_pallet"],
            [7, 7, "service_cabinet"],
            [0, 5, "cargo_pallet"],
            [3, 5, "cargo_container"]
        ],

        walls: [{
                style: "concrete-wall",
                cells: [
                    [1, 3],
                    [2, 3],
                    [3, 3],
                    [4, 3]
                ]
            },
            {
                style: "cargo-wall",
                cells: [
                    [6, 2],
                    [6, 3],
                    [6, 4]
                ]
            },
            {
                style: "hedge-autumn",
                cells: [
                    [5, 1],
                    [4, 1],
                    [3, 1],
                    [2, 1]
                ]
            }
        ],

        convoys: [{
                key: "yellow",
                exit: [5, 9],
                facing: 90,
                cells: [
                    [7, 5],
                    [7, 4],
                    [7, 3]
                ]
            },
            {
                key: "cyan",
                exit: [0, 2],
                facing: 90,
                cells: [
                    [4, 7],
                    [5, 7],
                    [6, 7]
                ]
            },
            {
                key: "red",
                exit: [0, 4],
                facing: 90,
                cells: [
                    [5, 6],
                    [5, 5],
                    [5, 4],
                    [5, 3]
                ]
            },
            {
                key: "blue",
                exit: [2, 8],
                facing: 90,
                cells: [
                    [3, 0],
                    [2, 0],
                    [1, 0],
                    [0, 0]
                ]
            },
            {
                key: "orange",
                exit: [0, 6],
                facing: 90,
                cells: [
                    [4, 4],
                    [3, 4],
                    [2, 4]
                ]
            },
            {
                key: "white",
                exit: [4, 6],
                facing: 90,
                cells: [
                    [1, 7],
                    [2, 7],
                    [3, 7],
                    [3, 8]
                ]
            },
            {
                key: "purple",
                exit: [5, 0],
                facing: 90,
                cells: [
                    [4, 9],
                    [3, 9],
                    [2, 9]
                ]
            }
        ]
    },

    // Level 40
    {
        rows: 10,
        columns: 8,

        time: 95,

        pattern: [
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [0, 3, "cargo_pallet"],
            [6, 5, "barrier"],
            [5, 0, "planter"],
            [5, 2, "cone"]
        ],

        walls: [{
                style: "hedge-autumn",
                cells: [
                    [3, 8],
                    [2, 8],
                    [1, 8],
                    [0, 8]
                ]
            },
            {
                style: "concrete-wall",
                cells: [
                    [2, 6],
                    [2, 5],
                    [2, 4],
                    [3, 4]
                ]
            },
            {
                style: "cargo-wall",
                cells: [
                    [4, 5],
                    [4, 6],
                    [5, 6],
                    [5, 7]
                ]
            }
        ],

        convoys: [{
                key: "blue",
                exit: [7, 6],
                facing: 90,
                cells: [
                    [1, 2],
                    [1, 3],
                    [1, 4]
                ]
            },
            {
                key: "red",
                exit: [6, 4],
                facing: 90,
                cells: [
                    [4, 7],
                    [3, 7],
                    [2, 7]
                ]
            },
            {
                key: "purple",
                exit: [1, 7],
                facing: 90,
                cells: [
                    [4, 3],
                    [5, 3],
                    [6, 3]
                ]
            },
            {
                key: "green",
                exit: [3, 1],
                facing: 90,
                cells: [
                    [7, 3],
                    [7, 2],
                    [6, 2]
                ]
            },
            {
                key: "pink",
                exit: [3, 9],
                facing: 90,
                cells: [
                    [5, 5],
                    [5, 4],
                    [4, 4]
                ]
            },
            {
                key: "cyan",
                exit: [0, 2],
                facing: 90,
                cells: [
                    [2, 1],
                    [2, 2],
                    [2, 3]
                ]
            },
            {
                key: "lime",
                exit: [6, 8],
                facing: 90,
                cells: [
                    [0, 4],
                    [0, 5],
                    [0, 6]
                ]
            }
        ]
    },

    // Level 41
    {
        rows: 10,
        columns: 8,

        time: 105,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ],

        obstacles: [
            [5, 3, "cone"],
            [2, 1, "cargo_pallet"],
            [2, 9, "cone"],
            [3, 3, "cargo_pallet"],
            [4, 6, "barrier"]
        ],

        walls: [{
                style: "cargo-wall",
                cells: [
                    [6, 7],
                    [6, 8],
                    [6, 9],
                    [7, 8]
                ]
            },
            {
                style: "hedge-lime",
                cells: [
                    [0, 8],
                    [0, 7],
                    [0, 6],
                    [1, 6]
                ]
            },
            {
                style: "hedge-teal",
                cells: [
                    [5, 0],
                    [6, 0],
                    [7, 0]
                ]
            }
        ],

        convoys: [{
                key: "green",
                exit: [6, 2],
                facing: 90,
                cells: [
                    [4, 4],
                    [3, 4],
                    [2, 4],
                    [1, 4]
                ]
            },
            {
                key: "cyan",
                exit: [1, 9],
                facing: 90,
                cells: [
                    [3, 5],
                    [3, 6],
                    [3, 7]
                ]
            },
            {
                key: "red",
                exit: [1, 8],
                facing: 90,
                cells: [
                    [4, 5],
                    [5, 5],
                    [6, 5]
                ]
            },
            {
                key: "yellow",
                exit: [7, 1],
                facing: 90,
                cells: [
                    [2, 8],
                    [2, 7],
                    [2, 6],
                    [2, 5]
                ]
            },
            {
                key: "lime",
                exit: [5, 9],
                facing: 90,
                cells: [
                    [1, 2],
                    [1, 1],
                    [1, 0]
                ]
            },
            {
                key: "blue",
                exit: [4, 9],
                facing: 90,
                cells: [
                    [7, 5],
                    [7, 6],
                    [7, 7]
                ]
            },
            {
                key: "white",
                exit: [3, 9],
                facing: 90,
                cells: [
                    [5, 2],
                    [4, 2],
                    [4, 1]
                ]
            },
            {
                key: "orange",
                exit: [6, 3],
                facing: 90,
                cells: [
                    [0, 0],
                    [0, 1],
                    [0, 2],
                    [0, 3]
                ]
            }
        ]
    },

    // Level 42
    {
        rows: 10,
        columns: 8,

        time: 100,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [5, 0, "service_cabinet"],
            [6, 1, "service_cabinet"],
            [7, 5, "cargo_pallet"],
            [5, 5, "barrier"],
            [4, 9, "cargo_container"]
        ],

        walls: [{
                style: "hedge-green",
                cells: [
                    [0, 3],
                    [0, 4],
                    [0, 5],
                    [0, 6]
                ]
            },
            {
                style: "cargo-wall",
                cells: [
                    [3, 5],
                    [3, 4],
                    [3, 3]
                ]
            },
            {
                style: "hedge-autumn",
                cells: [
                    [3, 7],
                    [4, 7],
                    [5, 7],
                    [6, 7]
                ]
            }
        ],

        convoys: [{
                key: "yellow",
                exit: [2, 5],
                facing: 90,
                cells: [
                    [2, 0],
                    [1, 0],
                    [1, 1],
                    [1, 2]
                ]
            },
            {
                key: "blue",
                exit: [3, 9],
                facing: 90,
                cells: [
                    [1, 3],
                    [2, 3],
                    [2, 2],
                    [2, 1]
                ]
            },
            {
                key: "cyan",
                exit: [5, 2],
                facing: 90,
                cells: [
                    [3, 6],
                    [2, 6],
                    [1, 6]
                ]
            },
            {
                key: "orange",
                exit: [0, 7],
                facing: 90,
                cells: [
                    [6, 5],
                    [6, 4],
                    [6, 3],
                    [6, 2]
                ]
            },
            {
                key: "white",
                exit: [5, 6],
                facing: 90,
                cells: [
                    [4, 4],
                    [4, 3],
                    [4, 2],
                    [4, 1]
                ]
            },
            {
                key: "red",
                exit: [6, 0],
                facing: 90,
                cells: [
                    [6, 8],
                    [5, 8],
                    [4, 8],
                    [3, 8]
                ]
            },
            {
                key: "green",
                exit: [0, 0],
                facing: 90,
                cells: [
                    [7, 0],
                    [7, 1],
                    [7, 2],
                    [7, 3]
                ]
            }
        ]
    },

    // Level 43
    {
        rows: 10,
        columns: 8,

        time: 95,

        pattern: [
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ],

        obstacles: [
            [2, 7, "planter"],
            [3, 0, "cargo_container"],
            [3, 4, "service_cabinet"],
            [1, 1, "barrier"]
        ],

        walls: [{
                style: "hedge-autumn",
                cells: [
                    [3, 9],
                    [4, 9],
                    [5, 9],
                    [6, 9]
                ]
            },
            {
                style: "hedge-teal",
                cells: [
                    [6, 3],
                    [5, 3],
                    [4, 3]
                ]
            },
            {
                style: "concrete-wall",
                cells: [
                    [5, 7],
                    [6, 7],
                    [7, 7],
                    [7, 6]
                ]
            }
        ],

        convoys: [{
                key: "yellow",
                exit: [4, 1],
                facing: 90,
                cells: [
                    [0, 3],
                    [0, 2],
                    [1, 2]
                ]
            },
            {
                key: "pink",
                exit: [4, 4],
                facing: 90,
                cells: [
                    [5, 0],
                    [5, 1],
                    [6, 1]
                ]
            },
            {
                key: "lime",
                exit: [2, 9],
                facing: 90,
                cells: [
                    [0, 4],
                    [1, 4],
                    [2, 4]
                ]
            },
            {
                key: "red",
                exit: [7, 2],
                facing: 90,
                cells: [
                    [3, 8],
                    [3, 7],
                    [3, 6],
                    [3, 5]
                ]
            },
            {
                key: "purple",
                exit: [1, 8],
                facing: 90,
                cells: [
                    [2, 1],
                    [2, 2],
                    [3, 2],
                    [4, 2]
                ]
            },
            {
                key: "blue",
                exit: [7, 5],
                facing: 90,
                cells: [
                    [4, 8],
                    [5, 8],
                    [6, 8]
                ]
            },
            {
                key: "orange",
                exit: [6, 4],
                facing: 90,
                cells: [
                    [4, 7],
                    [4, 6],
                    [4, 5]
                ]
            }
        ]
    },

    // Level 44
    {
        rows: 10,
        columns: 8,

        time: 100,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [1, 4, "cargo_container"],
            [4, 3, "cargo_pallet"],
            [5, 0, "service_cabinet"],
            [0, 5, "service_cabinet"]
        ],

        walls: [{
                style: "hedge-lime",
                cells: [
                    [2, 2],
                    [3, 2],
                    [3, 1],
                    [3, 0],
                    [2, 0]
                ]
            },
            {
                style: "cargo-wall",
                cells: [
                    [6, 6],
                    [6, 5],
                    [7, 5],
                    [7, 4]
                ]
            },
            {
                style: "hedge-autumn",
                cells: [
                    [4, 7],
                    [3, 7],
                    [2, 7],
                    [2, 6]
                ]
            },
            {
                style: "concrete-wall",
                cells: [
                    [3, 9],
                    [4, 9],
                    [5, 9]
                ]
            }
        ],

        convoys: [{
                key: "cyan",
                exit: [7, 3],
                facing: 90,
                cells: [
                    [5, 8],
                    [4, 8],
                    [3, 8],
                    [2, 8]
                ]
            },
            {
                key: "orange",
                exit: [0, 0],
                facing: 90,
                cells: [
                    [7, 0],
                    [7, 1],
                    [7, 2]
                ]
            },
            {
                key: "purple",
                exit: [3, 4],
                facing: 90,
                cells: [
                    [5, 5],
                    [4, 5],
                    [3, 5],
                    [2, 5],
                    [1, 5]
                ]
            },
            {
                key: "pink",
                exit: [2, 1],
                facing: 90,
                cells: [
                    [5, 4],
                    [5, 3],
                    [5, 2],
                    [5, 1]
                ]
            },
            {
                key: "lime",
                exit: [7, 7],
                facing: 90,
                cells: [
                    [0, 4],
                    [0, 3],
                    [0, 2],
                    [0, 1]
                ]
            },
            {
                key: "white",
                exit: [4, 6],
                facing: 90,
                cells: [
                    [1, 2],
                    [1, 1],
                    [1, 0]
                ]
            },
            {
                key: "green",
                exit: [5, 6],
                facing: 90,
                cells: [
                    [6, 1],
                    [6, 2],
                    [6, 3]
                ]
            }
        ]
    },

    // Level 45
    {
        rows: 10,
        columns: 8,

        time: 95,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [2, 7, "planter"],
            [6, 3, "planter"],
            [0, 7, "barrier"],
            [0, 0, "barrier"]
        ],

        walls: [{
                style: "cargo-wall",
                cells: [
                    [4, 4],
                    [5, 4],
                    [5, 5],
                    [6, 5]
                ]
            },
            {
                style: "hedge-lime",
                cells: [
                    [2, 2],
                    [2, 1],
                    [2, 0],
                    [3, 1]
                ]
            },
            {
                style: "hedge-autumn",
                cells: [
                    [6, 8],
                    [6, 7],
                    [7, 7],
                    [7, 6]
                ]
            }
        ],

        convoys: [{
                key: "red",
                exit: [7, 0],
                facing: 90,
                cells: [
                    [1, 0],
                    [1, 1],
                    [1, 2],
                    [1, 3],
                    [1, 4]
                ]
            },
            {
                key: "yellow",
                exit: [5, 3],
                facing: 90,
                cells: [
                    [0, 5],
                    [1, 5],
                    [2, 5],
                    [3, 5]
                ]
            },
            {
                key: "pink",
                exit: [1, 6],
                facing: 90,
                cells: [
                    [4, 9],
                    [4, 8],
                    [4, 7],
                    [4, 6]
                ]
            },
            {
                key: "purple",
                exit: [6, 0],
                facing: 90,
                cells: [
                    [5, 2],
                    [6, 2],
                    [7, 2]
                ]
            },
            {
                key: "green",
                exit: [4, 3],
                facing: 90,
                cells: [
                    [1, 8],
                    [2, 8],
                    [2, 9]
                ]
            },
            {
                key: "white",
                exit: [7, 3],
                facing: 90,
                cells: [
                    [0, 3],
                    [0, 2],
                    [0, 1]
                ]
            },
            {
                key: "orange",
                exit: [3, 4],
                facing: 90,
                cells: [
                    [3, 7],
                    [3, 6],
                    [2, 6]
                ]
            }
        ]
    },

    // Level 46
    {
        rows: 10,
        columns: 8,

        time: 110,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ],

        obstacles: [
            [4, 1, "cone"],
            [3, 0, "cargo_pallet"],
            [5, 5, "cargo_pallet"],
            [6, 3, "cone"],
            [6, 8, "service_cabinet"]
        ],

        walls: [{
                style: "hedge-green",
                cells: [
                    [2, 4],
                    [3, 4],
                    [4, 4],
                    [3, 3]
                ]
            },
            {
                style: "hedge-lime",
                cells: [
                    [1, 6],
                    [2, 6],
                    [3, 6],
                    [2, 7]
                ]
            },
            {
                style: "cargo-wall",
                cells: [
                    [1, 9],
                    [2, 9],
                    [3, 9]
                ]
            },
            {
                style: "concrete-wall",
                cells: [
                    [2, 2],
                    [1, 2],
                    [0, 2],
                    [0, 3]
                ]
            }
        ],

        convoys: [{
                key: "cyan",
                exit: [0, 1],
                facing: 90,
                cells: [
                    [5, 8],
                    [4, 8],
                    [3, 8]
                ]
            },
            {
                key: "pink",
                exit: [1, 3],
                facing: 90,
                cells: [
                    [7, 2],
                    [7, 3],
                    [7, 4],
                    [7, 5],
                    [7, 6]
                ]
            },
            {
                key: "purple",
                exit: [5, 1],
                facing: 90,
                cells: [
                    [2, 5],
                    [3, 5],
                    [4, 5]
                ]
            },
            {
                key: "blue",
                exit: [6, 5],
                facing: 90,
                cells: [
                    [6, 2],
                    [5, 2],
                    [4, 2],
                    [3, 2]
                ]
            },
            {
                key: "orange",
                exit: [5, 9],
                facing: 90,
                cells: [
                    [0, 0],
                    [1, 0],
                    [2, 0]
                ]
            },
            {
                key: "green",
                exit: [7, 8],
                facing: 90,
                cells: [
                    [0, 8],
                    [0, 7],
                    [0, 6]
                ]
            },
            {
                key: "white",
                exit: [7, 0],
                facing: 90,
                cells: [
                    [5, 7],
                    [6, 7],
                    [6, 6]
                ]
            },
            {
                key: "red",
                exit: [6, 0],
                facing: 90,
                cells: [
                    [3, 7],
                    [4, 7],
                    [4, 6]
                ]
            }
        ]
    },

    // Level 47
    {
        rows: 10,
        columns: 8,

        time: 110,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 0, 0]
        ],

        obstacles: [
            [1, 4, "service_cabinet"],
            [7, 2, "cargo_pallet"],
            [3, 9, "service_cabinet"],
            [0, 2, "cargo_pallet"],
            [5, 9, "barrier"]
        ],

        walls: [{
                style: "hedge-lime",
                cells: [
                    [1, 6],
                    [1, 7],
                    [2, 7],
                    [3, 7],
                    [3, 6]
                ]
            },
            {
                style: "concrete-wall",
                cells: [
                    [3, 2],
                    [3, 3],
                    [3, 4],
                    [4, 4]
                ]
            },
            {
                style: "hedge-green",
                cells: [
                    [6, 5],
                    [6, 6],
                    [6, 7],
                    [6, 8]
                ]
            },
            {
                style: "hedge-autumn",
                cells: [
                    [3, 0],
                    [2, 0],
                    [1, 0],
                    [0, 0]
                ]
            }
        ],

        convoys: [{
                key: "orange",
                exit: [5, 7],
                facing: 90,
                cells: [
                    [4, 0],
                    [4, 1],
                    [4, 2],
                    [4, 3]
                ]
            },
            {
                key: "lime",
                exit: [1, 2],
                facing: 90,
                cells: [
                    [7, 5],
                    [7, 6],
                    [7, 7]
                ]
            },
            {
                key: "purple",
                exit: [5, 3],
                facing: 90,
                cells: [
                    [3, 8],
                    [4, 8],
                    [4, 7],
                    [4, 6]
                ]
            },
            {
                key: "white",
                exit: [2, 9],
                facing: 90,
                cells: [
                    [2, 5],
                    [3, 5],
                    [4, 5]
                ]
            },
            {
                key: "blue",
                exit: [7, 0],
                facing: 90,
                cells: [
                    [5, 2],
                    [6, 2],
                    [6, 3]
                ]
            },
            {
                key: "yellow",
                exit: [1, 1],
                facing: 90,
                cells: [
                    [0, 6],
                    [0, 5],
                    [0, 4]
                ]
            },
            {
                key: "red",
                exit: [5, 0],
                facing: 90,
                cells: [
                    [5, 6],
                    [5, 5],
                    [5, 4]
                ]
            },
            {
                key: "pink",
                exit: [5, 1],
                facing: 90,
                cells: [
                    [2, 1],
                    [2, 2],
                    [2, 3],
                    [2, 4]
                ]
            }
        ]
    },

    // Level 48
    {
        rows: 10,
        columns: 8,

        time: 115,

        pattern: [
            [0, 0, 1, 1, 1, 1, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ],

        obstacles: [
            [3, 8, "planter"],
            [1, 7, "cargo_container"],
            [2, 6, "cargo_container"],
            [2, 9, "cone"],
            [5, 0, "cone"]
        ],

        walls: [{
                style: "cargo-wall",
                cells: [
                    [2, 4],
                    [1, 4],
                    [0, 4],
                    [0, 3]
                ]
            },
            {
                style: "concrete-wall",
                cells: [
                    [5, 6],
                    [5, 7],
                    [5, 8],
                    [6, 7]
                ]
            },
            {
                style: "hedge-teal",
                cells: [
                    [4, 2],
                    [3, 2],
                    [2, 2],
                    [1, 2]
                ]
            },
            {
                style: "hedge-green",
                cells: [
                    [6, 1],
                    [6, 2],
                    [6, 3]
                ]
            }
        ],

        convoys: [{
                key: "red",
                exit: [0, 8],
                facing: 90,
                cells: [
                    [4, 4],
                    [5, 4],
                    [6, 4]
                ]
            },
            {
                key: "yellow",
                exit: [2, 8],
                facing: 90,
                cells: [
                    [2, 5],
                    [3, 5],
                    [4, 5],
                    [5, 5]
                ]
            },
            {
                key: "blue",
                exit: [3, 9],
                facing: 90,
                cells: [
                    [3, 3],
                    [2, 3],
                    [1, 3]
                ]
            },
            {
                key: "white",
                exit: [1, 5],
                facing: 90,
                cells: [
                    [7, 2],
                    [7, 3],
                    [7, 4],
                    [7, 5],
                    [7, 6]
                ]
            },
            {
                key: "pink",
                exit: [6, 6],
                facing: 90,
                cells: [
                    [1, 1],
                    [0, 1],
                    [0, 2]
                ]
            },
            {
                key: "purple",
                exit: [6, 8],
                facing: 90,
                cells: [
                    [3, 1],
                    [4, 1],
                    [5, 1]
                ]
            },
            {
                key: "orange",
                exit: [2, 7],
                facing: 90,
                cells: [
                    [4, 9],
                    [5, 9],
                    [6, 9]
                ]
            },
            {
                key: "cyan",
                exit: [5, 3],
                facing: 90,
                cells: [
                    [0, 5],
                    [0, 6],
                    [0, 7]
                ]
            }
        ]
    },

    // Level 49
    {
        rows: 10,
        columns: 8,

        time: 110,

        pattern: [
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ],

        obstacles: [
            [6, 0, "service_cabinet"],
            [0, 1, "barrier"],
            [1, 8, "cargo_pallet"],
            [4, 7, "planter"],
            [3, 9, "service_cabinet"]
        ],

        walls: [{
                style: "hedge-autumn",
                cells: [
                    [5, 5],
                    [6, 5],
                    [7, 5]
                ]
            },
            {
                style: "cargo-wall",
                cells: [
                    [0, 4],
                    [1, 4],
                    [2, 4],
                    [2, 5]
                ]
            },
            {
                style: "hedge-green",
                cells: [
                    [4, 0],
                    [3, 0],
                    [2, 0]
                ]
            },
            {
                style: "hedge-teal",
                cells: [
                    [3, 2],
                    [4, 2],
                    [5, 2]
                ]
            }
        ],

        convoys: [{
                key: "purple",
                exit: [0, 7],
                facing: 90,
                cells: [
                    [5, 3],
                    [6, 3],
                    [6, 2],
                    [7, 2]
                ]
            },
            {
                key: "blue",
                exit: [5, 0],
                facing: 90,
                cells: [
                    [1, 0],
                    [1, 1],
                    [2, 1]
                ]
            },
            {
                key: "green",
                exit: [2, 9],
                facing: 90,
                cells: [
                    [4, 6],
                    [4, 5],
                    [4, 4],
                    [4, 3]
                ]
            },
            {
                key: "red",
                exit: [2, 2],
                facing: 90,
                cells: [
                    [6, 1],
                    [5, 1],
                    [4, 1]
                ]
            },
            {
                key: "lime",
                exit: [7, 6],
                facing: 90,
                cells: [
                    [2, 8],
                    [3, 8],
                    [4, 8],
                    [5, 8],
                    [5, 7]
                ]
            },
            {
                key: "yellow",
                exit: [1, 5],
                facing: 90,
                cells: [
                    [4, 9],
                    [5, 9],
                    [6, 9]
                ]
            },
            {
                key: "orange",
                exit: [3, 3],
                facing: 90,
                cells: [
                    [3, 7],
                    [2, 7],
                    [1, 7],
                    [1, 6],
                    [2, 6]
                ]
            },
            {
                key: "cyan",
                exit: [0, 5],
                facing: 90,
                cells: [
                    [7, 7],
                    [7, 8],
                    [6, 8]
                ]
            }
        ]
    },

    // Level 50
    {
        rows: 10,
        columns: 8,

        time: 110,

        pattern: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ],

        obstacles: [
            [5, 6, "planter"],
            [1, 3, "service_cabinet"],
            [7, 7, "barrier"],
            [3, 3, "barrier"],
            [2, 2, "cargo_container"]
        ],

        walls: [{
                style: "cargo-wall",
                cells: [
                    [6, 5],
                    [7, 5],
                    [7, 4],
                    [7, 3],
                    [6, 3]
                ]
            },
            {
                style: "hedge-teal",
                cells: [
                    [2, 9],
                    [3, 9],
                    [4, 9],
                    [5, 9]
                ]
            },
            {
                style: "concrete-wall",
                cells: [
                    [6, 0],
                    [5, 0],
                    [4, 0],
                    [4, 1]
                ]
            },
            {
                style: "hedge-green",
                cells: [
                    [1, 5],
                    [2, 5],
                    [3, 5]
                ]
            }
        ],

        convoys: [{
                key: "blue",
                exit: [1, 1],
                facing: 90,
                cells: [
                    [4, 5],
                    [4, 4],
                    [3, 4],
                    [2, 4],
                    [1, 4]
                ]
            },
            {
                key: "white",
                exit: [0, 0],
                facing: 90,
                cells: [
                    [4, 3],
                    [4, 2],
                    [5, 2],
                    [6, 2]
                ]
            },
            {
                key: "purple",
                exit: [6, 9],
                facing: 90,
                cells: [
                    [3, 6],
                    [2, 6],
                    [1, 6],
                    [0, 6]
                ]
            },
            {
                key: "lime",
                exit: [7, 2],
                facing: 90,
                cells: [
                    [1, 7],
                    [2, 7],
                    [3, 7]
                ]
            },
            {
                key: "orange",
                exit: [7, 6],
                facing: 90,
                cells: [
                    [0, 4],
                    [0, 3],
                    [0, 2]
                ]
            },
            {
                key: "cyan",
                exit: [5, 1],
                facing: 90,
                cells: [
                    [4, 8],
                    [3, 8],
                    [2, 8],
                    [1, 8]
                ]
            },
            {
                key: "red",
                exit: [3, 2],
                facing: 90,
                cells: [
                    [5, 5],
                    [5, 4],
                    [5, 3]
                ]
            },
            {
                key: "yellow",
                exit: [7, 0],
                facing: 90,
                cells: [
                    [1, 0],
                    [2, 0],
                    [3, 0]
                ]
            }
        ]
    }
]