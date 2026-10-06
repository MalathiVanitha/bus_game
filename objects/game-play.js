import SoundManager from './SoundManager.js';
import { astar, Graph } from '../utils/astar.js';
import { Trail } from './trail.js';
import { Board } from './board.js';
import { Convoy } from './convoy.js';
import { Garage } from './garage.js';
import levels from '../data/level-data.js';
import { bakeShape } from '../utils/bake.js';

const BOARD_WIDTH = 500;
const BOARD_HEIGHT = 615;

// Portrait: the tiles centred on the screen, no wider or taller than this.
const BOARD_FIT_W = 450;
const BOARD_FIT_H = 560;

// Landscape: the board takes the height between the top bar and the bottom
// edge, and leaves room either side for the boosters.
const WIDE_TOP = 108;
const WIDE_BOTTOM = 52;
const WIDE_SIDE = 170;

const DRAG_SPEED = 4.6;
const CHASE_SPEED = 10;
const SETTLE_SPEED = 5.5;

// Cells a second, a second: how hard the lead picks up speed, and how hard it
// brakes as the end of its route comes up, so it rolls off and draws up
// rather than jumping to speed and stopping dead. Never slower than
// ARRIVE_FLOOR, so the last of the way does not crawl.
const ACCELERATION = 40;
const BRAKING = 30;
const ARRIVE_FLOOR = 0.8;

const CHASE_SLACK = 0.5;
const CHASE_SPAN = 4;

const GRAB_REACH = 0.75;

const BUMP_INTO = 0.28;
const BUMP_BACK = 0.16;

const BUMP_IN_TIME = 90;
const BUMP_BACK_TIME = 90;
const BUMP_REST_TIME = 300;

const TRAIL_TAIL = 1.5;

const PULL_SPEED = 5.5;
const PULL_WIND = 1.5;

const PULL_FLOOR = 3;

const BURST_COUNT = 18;
const BURST_SPREAD = 0.9;
const BURST_DRAG = 4;
const SPARK_TEXTURE = "convoy-spark";

const CONFETTI_COUNT = 36;
const CONFETTI_POP_COUNT = 16;
const CONFETTI_GRAVITY = 9;
const CONFETTI_DRAG = 1.6;
const CONFETTI_TEXTURE = "convoy-confetti-pill";
// Soft candy tones, as in the reference: pink, periwinkle, green, amber, orange.
const CONFETTI_COLORS = [
    "#ff6b8e", "#5f73f0", "#9fd86a", "#ffb534", "#ff8a3d"
];
// The convoy's own colour, toned to sit with the palette above.
const CONFETTI_TINT = {
    yellow: "#ffc53d",
    red: "#ff6b8e",
    cyan: "#4cc9f5",
    pink: "#ff8fc8",
    blue: "#5f8df0",
    orange: "#ff9a3d",
    green: "#4cc76a",
    lime: "#c6ec4a",
    purple: "#b25cf5",
    white: "#f4f6ff"
};
// Pill texture, drawn upright; the long side is the piece's length.
const CONFETTI_ART_W = 24;
const CONFETTI_ART_H = 72;
// Length of a piece in cells, and how thick it is against that length.
const CONFETTI_LENGTH = 0.34;
const CONFETTI_LENGTH_RANGE = 0.14;
const CONFETTI_THICK = 0.36;
// How short a piece gets when it tumbles end-on, so it never thins to a line.
const CONFETTI_TUMBLE_MIN = 0.45;

const CONVOY_SPLASH = {
    yellow: "#ffd400",
    red: "#ff5252",
    cyan: "#3ae4ff",
    pink: "#ff5fb4",
    blue: "#3d7bff",
    orange: "#ff8a1f",
    green: "#1fbf4a",
    lime: "#c8f01e",
    purple: "#a52cf5",
    white: "#ffffff"
};

const LOOK_AHEAD_CELLS = 2;

// How close (in cells, either way) a vehicle has to be to a garage for its
// front to need cutting at the mouth: the mouth reaches about 1.1 cells out,
// and a vehicle about half a cell past its middle.
const GARAGE_NEAR = 2;

const DOOR_HALF = 0.75;
const DOOR_DEPTH = 12;

// The board rises into place from a little small and low once the home screen
// has gone.
const INTRO_TIME = 640;
const INTRO_FADE = 320;
const INTRO_FROM = 0.84;
const INTRO_DROP = 70;

// What fills a hole in the board: a wall for a run of them, in this style if
// the level has no wall of its own, or one of these for a single hole.
const HOLE_WALL = 'hedge-green';
const HOLE_OBSTACLES = ['planter', 'cone', 'cargo_pallet'];

// Seconds on the clock for a level that does not give its own.
const DEFAULT_TIME = 60;

// The Remove booster: the picked convoy's vehicles pop and spin away one after
// another, tractor first, each with a little confetti.
const REMOVE_POP = 1.25;
const REMOVE_POP_TIME = 110;
const REMOVE_OUT_TIME = 260;
const REMOVE_STAGGER = 70;
const REMOVE_SPIN = 25;
const REMOVE_CONFETTI = 8;
// Each one flashes white and squashes before it goes, a ring washes out from
// where it stood, a few glints fly, and the board gives a little shudder.
const REMOVE_SQUASH_X = 1.3;
const REMOVE_SQUASH_Y = 0.8;
const REMOVE_RISE = 0.45;
const REMOVE_RING_FROM = 0.3;
const REMOVE_RING_TO = 1.5;
const REMOVE_RING_TIME = 420;
const REMOVE_GLINTS = 4;
const REMOVE_SHAKE = 5;
const REMOVE_SHAKE_TIME = 260;

const RING_TEXTURE = "booster-ring";
const RING_R = 32;
const RING_THICK = 6;
const GLINT = "fx-glint";
const GLINT_ART = 256;

// The Hint booster: the convoy that can get home glows, and a wave of lit
// cells runs along its way to the garage, over and over. It stands until that
// convoy is taken hold of, something moves into its way, or HINT_TIME is up.
const HINT_TIME = 12000;
const HINT_STEP = 70;
const HINT_REST = 5;
// Gold, for everything the hint puts down. Glints spark off each cell as the
// wave passes, with a bigger one at the garage.
const HINT_RING = 0xffc93c;
const HINT_GLINT = 0.8;
const HINT_GLINT_HOME = 1.5;
const HINT_GLINT_TIME = 420;
// Gold road arrows down the way, white-edged like the lesson's arrow, popping
// in one after another from the convoy to the garage; then a brightening runs
// down them, over and over, the way to drive.
const HINT_EDGE = 0xffffff;
const HINT_SHADE = 0x101a33;
const HINT_ARROW_TEXTURE = "hint-arrow";
const HINT_ARROW_ART = 40;
const HINT_ARROW_SIZE = 0.56;
const HINT_ARROW_IN = 70;
const HINT_ARROW_IN_TIME = 260;
const HINT_ARROW_ALPHA = 0.7;
const HINT_MARCH = 1000;
const HINT_MARCH_LAG = 0.12;
const HINT_MARCH_SWELL = 0.25;
// A fingertip shows the drag: it presses on the end to drive, glides along
// the arrows into the garage, lifts off with a ripple there, and goes again.
const HINT_TOUCH_TEXTURE = "hint-touch";
const HINT_TOUCH_ART = 44;
const HINT_TOUCH_SIZE = 0.7;
const HINT_TOUCH_PRESS = 0.8;
const HINT_TOUCH_WAIT = 450;
const HINT_TOUCH_IN = 240;
const HINT_TOUCH_CELL = 210;
const HINT_TOUCH_OUT = 240;
const HINT_TOUCH_REST = 420;
// All of it fades together when the hint is over.
const HINT_OUT_TIME = 240;

// The Freeze booster: the clock stands still this long, and a frost lies over
// the board meanwhile, flickering over the last THAW_WARN of it. One runs out
// before another can be used.
const FREEZE_TIME = 10000;
const ICE_FILL = 0x9fdcff;
const ICE_FILL_ALPHA = 0.16;
const ICE_EDGE = 0xffffff;
const ICE_IN = 320;
const ICE_OUT = 260;
const THAW_WARN = 2000;
const THAW_FLICKER = 0.012;

// The Crane booster: every obstacle rings gold while it waits for a pick.
// Then a hook on a cable drops in from above, catches the piece, gives it a
// squeeze, and hauls it off the top, growing a little as it rises.
const CRANE_RING_PULSE = 1.15;
const CRANE_RING_TIME = 420;
const CRANE_ICON = 'icons/icon-crane';
const CRANE_ICON_ART = 128;
const CRANE_HOOK = 1.4;
// Where on the art the hook catches (the foot of the hook's bowl).
const CRANE_ORIGIN_X = 0.42;
const CRANE_ORIGIN_Y = 0.86;
// Where the cable meets the top of the art.
const CRANE_TOP = 0.82;
const CRANE_CABLE = 0.07;
const CRANE_CABLE_COLOR = 0x4a5568;
const CRANE_CABLE_LENGTH = 40;
const CRANE_FROM = 8;
const CRANE_OVER = 0.32;
const CRANE_DROP_TIME = 420;
const CRANE_SWING = 9;
const CRANE_GRAB_TIME = 110;
const CRANE_SQUASH_X = 1.12;
const CRANE_SQUASH_Y = 0.86;
const CRANE_LIFT = 10;
const CRANE_LIFT_TIME = 620;
const CRANE_GROW = 1.35;

// The Ghost booster: the picked convoy goes see-through and drives through
// other convoys (never walls, obstacles or another's garage) until it is let
// go clear of them, or gets home. It shimmers between these.
const GHOST_ALPHA = 0.55;
const GHOST_SHIMMER = 0.12;
const GHOST_SHIMMER_RATE = 0.006;

const byDepth = (a, b) => a.depth - b.depth;

export class GamePlay extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.init();
    }

    init() {
        const levelData = levels[((this.scene.level || 1) - 1) % levels.length];

        this.rows = levelData.rows;
        this.columns = levelData.columns;
        this.pattern = levelData.pattern.map((r) => r.slice());
        // Copies: the Crane takes pieces off the board, and the level's own
        // lists must stand for the next time it is played.
        this.obstacles = (levelData.obstacles || []).map((o) => o.slice());
        this.walls = (levelData.walls || []).map((w) => Object.assign({}, w, {
            cells: w.cells.map((c) => c.slice())
        }));

        this.fillHoles();

        this.cellSize = Math.min(BOARD_WIDTH / this.columns, BOARD_HEIGHT / this.rows);
        this.tileWidth = this.cellSize;
        this.tileHeight = this.cellSize;

        this.boardWidth = this.columns * this.tileWidth;
        this.boardHeight = this.rows * this.tileHeight;

        this.startX = -this.boardWidth / 2 + this.tileWidth / 2;
        this.startY = -this.boardHeight / 2 + this.tileHeight / 2;

        this.dragSpeed = this.cellSize * DRAG_SPEED;
        this.chaseSpeed = this.cellSize * CHASE_SPEED;
        this.settleSpeed = this.cellSize * SETTLE_SPEED;
        this.chaseSlack = this.cellSize * CHASE_SLACK;
        this.chaseSpan = this.cellSize * CHASE_SPAN;

        this.boardStamp = 0;

        this.tiles = [];

        for (let row = 0; row < this.rows; row++) {
            this.tiles[row] = [];

            for (let col = 0; col < this.columns; col++) {
                this.tiles[row][col] = {
                    owner: -1,
                    blocked: this.pattern[row][col] !== 1,
                    obstacle: false
                };
            }
        }

        for (let i = 0; i < this.obstacles.length; i++) {
            const col = this.obstacles[i][0];
            const row = this.obstacles[i][1];

            if (!this.onBoard(col, row)) continue;

            this.tiles[row][col].blocked = true;
            this.tiles[row][col].obstacle = true;
        }

        for (let i = 0; i < this.walls.length; i++) {
            const cells = this.walls[i].cells;

            for (let j = 0; j < cells.length; j++) {
                const col = cells[j][0];
                const row = cells[j][1];

                if (!this.onBoard(col, row)) continue;

                this.tiles[row][col].blocked = true;
                this.tiles[row][col].obstacle = true;
            }
        }

        this.stage = this.scene.add.container();

        this.board = new Board(this.scene, {
            parent: this,
            props: this.stage,
            pattern: this.pattern,
            obstacles: this.obstacles,
            walls: this.walls,
            rows: this.rows,
            columns: this.columns,
            tileWidth: this.tileWidth,
            tileHeight: this.tileHeight,
            startX: this.startX,
            startY: this.startY
        });

        // Over the floor and walls, under everything that moves.
        this.iceSheet = this.makeIceSheet();
        this.add(this.iceSheet);

        // The shadows of the garages and convoys: over the ice, under them all.
        this.castGroup = this.scene.add.container();
        this.add(this.castGroup);

        this.garageBackGroup = this.scene.add.container();
        this.add(this.garageBackGroup);

        this.add(this.stage);

        this.effectGroup = this.scene.add.container();
        this.add(this.effectGroup);
        this.effects = [];

        this.mouthShape = this.scene.make.graphics({ add: false });
        this.mouthMask = this.mouthShape.createGeometryMask();
        this.mouthMask.invertAlpha = true;

        this.doorMatrix = new Phaser.GameObjects.Components.TransformMatrix();
        this.doorParent = new Phaser.GameObjects.Components.TransformMatrix();

        // Straight from the level data: Hard and Super Hard levels' times there
        // are already their shorter clocks.
        this.levelTime = levelData.time > 0 ? levelData.time : DEFAULT_TIME;
        this.timeLeft = this.levelTime;
        this.running = false;
        this.paused = false;
        // The clock holds at full until the player first takes hold of a convoy.
        this.clockStarted = false;
        this.finished = false;

        this.drag = null;
        this.dragPoint = null;
        this.picking = null;
        this.pickingObstacle = null;
        this.obstacleMarks = null;
        this.removing = 0;
        this.hint = null;
        // Milliseconds of Freeze left, and how much there was when it was
        // last topped up, for the clock to show what is left of it.
        this.frozen = 0;
        this.frozenTotal = 0;
        this.ghost = null;
        this.convoys = [];
        this.garages = [];

        this.stackDirty = true;

        for (let i = 0; i < levelData.convoys.length; i++) {
            this.convoys.push(this.createConvoy(levelData.convoys[i], i));
        }

        this.createGarages();

        this.attachInput();
    }

    /**
     * No cell is left an empty hole in the board: a run of them becomes a
     * wall - joined to one it touches, or in the level's own wall style - and
     * one on its own an obstacle. Either way it stays as blocked as the hole
     * was, so the level plays the same; but it is floor under it now, so the
     * Crane can lift it like any other.
     */
    fillHoles() {
        const holes = [];
        const covered = new Set();

        this.walls.forEach((wall) => wall.cells.forEach((c) => covered.add(c[1] * this.columns + c[0])));
        this.obstacles.forEach((o) => covered.add(o[1] * this.columns + o[0]));

        // A hole a wall or obstacle already stands on only wants its floor.
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (covered.has(row * this.columns + col)) this.pattern[row][col] = 1;
            }
        }

        const isHole = (col, row) => this.onBoard(col, row) && this.pattern[row][col] !== 1;
        const seen = new Set();
        const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (!isHole(col, row) || seen.has(row * this.columns + col)) continue;

                // Every hole joined to this one, side by side.
                const group = [];
                const queue = [[col, row]];

                seen.add(row * this.columns + col);

                while (queue.length) {
                    const cell = queue.pop();

                    group.push(cell);

                    for (let i = 0; i < sides.length; i++) {
                        const c = cell[0] + sides[i][0];
                        const r = cell[1] + sides[i][1];
                        const k = r * this.columns + c;

                        if (!isHole(c, r) || seen.has(k)) continue;

                        seen.add(k);
                        queue.push([c, r]);
                    }
                }

                holes.push(group);
            }
        }

        if (!holes.length) return;

        const style = (this.walls[0] && this.walls[0].style) || HOLE_WALL;

        for (let i = 0; i < holes.length; i++) {
            const group = holes[i];

            for (let j = 0; j < group.length; j++) this.pattern[group[j][1]][group[j][0]] = 1;

            const touching = this.walls.find((wall) => wall.cells.some((w) =>
                group.some((g) => Math.abs(w[0] - g[0]) + Math.abs(w[1] - g[1]) === 1)));

            if (touching) {
                touching.cells.push(...group);
            } else if (group.length > 1) {
                this.walls.push({ style: style, cells: group });
            } else {
                const [col, row] = group[0];

                this.obstacles.push([col, row, HOLE_OBSTACLES[(col + row) % HOLE_OBSTACLES.length]]);
            }
        }
    }

    cellToPixel(col, row) {
        return {
            x: this.startX + col * this.tileWidth,
            y: this.startY + row * this.tileHeight
        };
    }

    pixelToCell(x, y) {
        return {
            col: Math.round((x - this.startX) / this.tileWidth),
            row: Math.round((y - this.startY) / this.tileHeight)
        };
    }

    onBoard(col, row) {
        return col >= 0 && row >= 0 && col < this.columns && row < this.rows;
    }

    isFloor(col, row) {
        return this.onBoard(col, row) && !this.tiles[row][col].blocked;
    }

    isObstacle(col, row) {
        return this.onBoard(col, row) && this.tiles[row][col].obstacle;
    }

    // Routing lets a convoy plan through its own garage from any side; the
    // actual step in is only taken from a cell right next to it.
    canEnter(convoy, col, row, routing) {
        if (!this.isFloor(col, row)) return false;

        const garage = this.garageAt(col, row);

        if (garage) {
            if (garage.convoyIndex !== convoy.index) return false;
            if (!routing && !this.atDoorstep(convoy, this.leadCell(convoy))) return false;
        }

        const owner = this.tiles[row][col].owner;

        if (owner === -1) return true;

        // A ghost passes over other convoys, but never over itself.
        return convoy === this.ghost && owner !== convoy.index && !this.inConvoy(convoy, col, row);
    }

    inConvoy(convoy, col, row) {
        for (let i = 0; i < convoy.cells.length; i++) {
            if (convoy.cells[i].col === col && convoy.cells[i].row === row) return true;
        }

        return false;
    }

    // Any cell beside the garage is a way in: it is open on all four sides.
    atDoorstep(convoy, cell) {
        if (!convoy.exit || !cell) return false;

        return Math.abs(cell.col - convoy.exit[0]) + Math.abs(cell.row - convoy.exit[1]) === 1;
    }

    faceGarage(convoy, from) {
        if (!convoy.garage || !from) return;

        convoy.garage.openTo(Math.atan2(from.row - convoy.exit[1], from.col - convoy.exit[0]));
    }

    garageAt(col, row) {
        for (let i = 0; i < this.garages.length; i++) {
            const garage = this.garages[i];

            if (garage.gone) continue;
            if (garage.col === col && garage.row === row) return garage;
        }

        return null;
    }

    garageFacing(convoy) {
        if (typeof convoy.facing !== "number") {
            return this.wayIn(convoy.exit[0], convoy.exit[1]);
        }

        return Phaser.Math.DegToRad(convoy.facing);
    }

    wayIn(col, row) {
        const ways = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ];
        const open = [];

        for (let i = 0; i < ways.length; i++) {
            if (this.isFloor(col + ways[i][0], row + ways[i][1])) open.push(ways[i]);
        }

        if (open.length === 1) return Math.atan2(open[0][1], open[0][0]);

        const outX = (this.columns - 1) / 2 - col;
        const outY = (this.rows - 1) / 2 - row;

        return Math.abs(outX) >= Math.abs(outY) ?
            Math.atan2(0, outX || 1) : Math.atan2(outY, 0);
    }

    createGarages() {
        for (let i = 0; i < this.convoys.length; i++) {
            const convoy = this.convoys[i];

            if (!convoy.exit) continue;

            const spot = this.cellToPixel(convoy.exit[0], convoy.exit[1]);

            convoy.garage = new Garage(this.scene, {
                key: convoy.key,
                col: convoy.exit[0],
                row: convoy.exit[1],
                convoyIndex: convoy.index,
                x: spot.x,
                y: spot.y,
                size: this.cellSize,
                facing: this.garageFacing(convoy),
                behind: this.garageBackGroup,
                shadows: this.castGroup,
                fx: this.effectGroup,
                parent: this.stage,
                mask: this.mouthMask
            });

            this.garages.push(convoy.garage);

            this.validateGarage(convoy);
        }
    }

    sortStage() {
        this.stage.sort("depth", byDepth);
        this.stackDirty = false;
    }

    validateGarage(convoy) {
        const [col, row] = convoy.exit;
        const sides = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ];

        for (let i = 0; i < sides.length; i++) {
            const c = col + sides[i][0];
            const r = row + sides[i][1];

            if (this.isFloor(c, r) && !this.tiles[r][c].obstacle) return;
        }

        console.warn("Garage '" + convoy.key + "' has no open cell beside it:", col, row);
    }

    lightConvoy(convoy) {
        for (let i = 0; i < convoy.cells.length; i++) {
            this.board.pulseCell(convoy.cells[i].col, convoy.cells[i].row);
        }
    }

    // A ghost over another convoy leaves the cell that convoy's: it takes it
    // when that one moves off (claimGhostCells).
    occupy(convoy, col, row) {
        if (!this.onBoard(col, row)) return;

        const tile = this.tiles[row][col];

        if (convoy === this.ghost && tile.owner !== -1) return;

        tile.owner = convoy.index;
        this.boardStamp++;
    }

    release(convoy, col, row) {
        if (!this.onBoard(col, row)) return;

        const tile = this.tiles[row][col];

        if (tile.owner !== convoy.index) return;

        tile.owner = -1;
        this.boardStamp++;

        if (this.ghost && this.ghost !== convoy) this.claimGhostCells();
    }

    // Every free cell under the ghost is its own, so nothing else drives in
    // under it.
    claimGhostCells() {
        const ghost = this.ghost;

        if (!ghost) return;

        for (let i = 0; i < ghost.cells.length; i++) {
            const tile = this.tiles[ghost.cells[i].row][ghost.cells[i].col];

            if (tile.owner === -1) {
                tile.owner = ghost.index;
                this.boardStamp++;
            }
        }
    }

    createConvoy(data, index) {
        const cells = data.cells.map((p) => ({ col: p[0], row: p[1] }));

        const convoy = {
            key: data.key,
            index: index,
            exit: data.exit,

            facing: data.facing,
            garage: null,
            cells: cells,
            count: cells.length,

            leadIsHead: true,

            queue: [],

            routeStamp: "",

            stepReserved: false,

            settle: null,
            settling: false,

            moving: false,
            hitObstacle: false,

            diving: false,
            entryStart: 0,
            entered: 0,
            swallowing: false,
            swallowed: 0,
            escaped: false,

            recoil: 0,
            drawnRecoil: 0,
            bumpTween: null,

            trail: null
        };

        this.validateConvoy(convoy, data.cells);

        for (let i = 0; i < cells.length; i++) this.occupy(convoy, cells[i].col, cells[i].row);

        convoy.bodyLength = (convoy.count - 1) * this.cellSize;

        this.rebuildTrail(convoy);

        convoy.rig = new Convoy(this.scene, {
            key: convoy.key,
            count: convoy.count,
            cellSize: this.cellSize,
            parent: this.stage,
            shadows: this.castGroup
        });

        this.updateConvoyView(convoy, 0);

        return convoy;
    }

    validateConvoy(convoy, cellList) {
        for (let i = 0; i < cellList.length; i++) {
            const col = cellList[i][0];
            const row = cellList[i][1];
            const prev = cellList[i - 1];

            if (prev && Math.abs(col - prev[0]) + Math.abs(row - prev[1]) !== 1) {
                console.warn(
                    "Convoy '" + convoy.key + "' jumps between non-adjacent cells:",
                    prev, "->", [col, row]
                );
            }

            if (!this.onBoard(col, row)) {
                console.warn("Convoy '" + convoy.key + "' uses a cell off the board:", col, row);
            } else if (this.tiles[row][col].blocked) {
                console.warn("Convoy '" + convoy.key + "' uses a blocked cell:", col, row);
            } else if (this.tiles[row][col].owner >= 0) {
                console.warn("Cell already taken by another convoy:", col, row);
            }
        }
    }

    rebuildTrail(convoy) {
        const points = convoy.cells.map((cell) => this.cellToPixel(cell.col, cell.row));

        points.unshift({ x: points[0].x, y: points[0].y });

        const last = points[points.length - 1];
        const before = points[points.length - 2];

        points.push({
            x: last.x + (last.x - before.x) * TRAIL_TAIL,
            y: last.y + (last.y - before.y) * TRAIL_TAIL
        });

        convoy.trail = new Trail(points);
    }

    leadCell(convoy) {
        return convoy.cells[0];
    }

    headCell(convoy) {
        return convoy.leadIsHead ? convoy.cells[0] : convoy.cells[convoy.cells.length - 1];
    }

    tailCell(convoy) {
        return convoy.leadIsHead ? convoy.cells[convoy.cells.length - 1] : convoy.cells[0];
    }

    setLeadingEnd(convoy, end) {
        const wantHead = end === "head";

        if (wantHead === convoy.leadIsHead) return;

        this.cancelStep(convoy);
        convoy.settle = null;
        convoy.settling = false;
        convoy.hitObstacle = false;

        if (convoy.bumpTween) {
            convoy.bumpTween.remove();
            convoy.bumpTween = null;
        }

        convoy.recoil = 0;

        convoy.cells.reverse();
        convoy.leadIsHead = wantHead;
        convoy.routeStamp = "";

        this.rebuildTrail(convoy);
    }

    cancelStep(convoy, walkBack) {
        if (!convoy.stepReserved) return;

        const gone = convoy.cells.shift();

        this.release(convoy, gone.col, gone.row);
        convoy.stepReserved = false;
        convoy.queue.length = 0;
        convoy.routeStamp = "";

        const back = this.cellToPixel(convoy.cells[0].col, convoy.cells[0].row);

        if (walkBack) {
            convoy.settle = back;
            return;
        }

        convoy.trail.points[0].x = back.x;
        convoy.trail.points[0].y = back.y;
    }

    routeGraph(convoy) {
        if (!this.searchGraph) {
            const grid = [];

            for (let col = 0; col < this.columns; col++) {
                grid[col] = [];

                for (let row = 0; row < this.rows; row++) grid[col][row] = 1;
            }

            this.searchGraph = new Graph(grid);
        }

        for (let col = 0; col < this.columns; col++) {
            for (let row = 0; row < this.rows; row++) {
                this.searchGraph.grid[col][row].weight = this.canEnter(convoy, col, row, true) ? 1 : 0;
            }
        }

        return this.searchGraph;
    }

    findRoute(convoy, goal) {
        const graph = this.routeGraph(convoy);
        const lead = this.leadCell(convoy);

        const route = astar.search(
            graph,
            graph.grid[lead.col][lead.row],
            graph.grid[goal.col][goal.row], { closest: true }
        );

        return route.map((node) => ({ col: node.x, row: node.y }));
    }

    routeDrag(point) {
        const convoy = this.drag && this.drag.convoy;

        if (!convoy || convoy.escaped || convoy.swallowing) return;

        this.dragPoint = { x: point.x, y: point.y };

        if (this.enteringGarage(convoy)) {
            convoy.hitObstacle = false;
            return;
        }

        const goal = this.pixelToCell(point.x, point.y);

        if (!this.isFloor(goal.col, goal.row)) {
            this.noteObstacleHit(convoy, point);
            return;
        }

        const reserved = (convoy.stepReserved && convoy.queue.length) ? convoy.queue[0] : null;
        const lead = this.leadCell(convoy);

        const stamp = this.boardStamp + "|" + goal.col + "," + goal.row +
            "|" + lead.col + "," + lead.row + "|" + (reserved ? 1 : 0);

        if (convoy.routeStamp === stamp) {
            this.noteObstacleHit(convoy, point);
            return;
        }

        convoy.routeStamp = stamp;

        let route = [];

        if (goal.col !== lead.col || goal.row !== lead.row) {
            route = this.findRoute(convoy, goal);
        }

        if (reserved && (!route.length ||
                route[0].col !== reserved.col || route[0].row !== reserved.row)) {
            route.unshift(reserved);
        }

        convoy.queue = route;

        this.noteObstacleHit(convoy, point);
    }

    noteObstacleHit(convoy, point) {
        const lead = this.leadCell(convoy);
        const at = this.cellToPixel(lead.col, lead.row);

        const stuck = !convoy.queue.length && !convoy.settle &&
            Math.hypot(point.x - at.x, point.y - at.y) > this.cellSize * 0.6;

        const next = this.stepToward(lead, at, point);
        const hit = stuck && this.isObstacle(next.col, next.row);

        // The knock goes off the moment the convoy runs up against it -
        // that is when it hits it - and is not sounded again until it has come
        // off the thing and been driven back at it.
        if (hit && !convoy.hitObstacle) {
            this.bumpConvoy(convoy);
            SoundManager.fx(this.scene, 'bump', 0.8);
        }

        convoy.hitObstacle = hit;
    }

    /**
     * The cell the tractor would take next on its way to the finger: one step
     * along whichever of the two axes it is further off on, which is the cell it
     * is being driven into and so the one it can hit.
     */
    stepToward(lead, at, point) {
        const dx = point.x - at.x;
        const dy = point.y - at.y;

        if (Math.abs(dx) >= Math.abs(dy)) {
            return { col: lead.col + Math.sign(dx), row: lead.row };
        }

        return { col: lead.col, row: lead.row + Math.sign(dy) };
    }


    // ---- movement -------------------------------------------------------

    // Base pace while the tractor is under the finger, winding up towards
    // chaseSpeed as the finger pulls ahead. Squared, so short careful drags keep
    // their fine control and only a real flick makes the convoy run.
    leadSpeed(convoy) {
        if (this.enteringGarage(convoy)) return this.entrySpeed(convoy);

        if (!this.drag || this.drag.convoy !== convoy || !this.dragPoint) return this.settleSpeed;

        const lead = convoy.trail.points[0];
        const lag = Math.hypot(this.dragPoint.x - lead.x, this.dragPoint.y - lead.y);
        const t = Phaser.Math.Clamp((lag - this.chaseSlack) / this.chaseSpan, 0, 1);

        return this.dragSpeed + (this.chaseSpeed - this.dragSpeed) * t * t;
    }

    // How far the lead still has to go before the route runs out: to the cell
    // it is heading for, then a cell for each one queued after it.
    roadLeft(convoy) {
        const target = convoy.queue.length ?
            this.cellToPixel(convoy.queue[0].col, convoy.queue[0].row) :
            convoy.settle;

        if (!target) return 0;

        const lead = convoy.trail.points[0];
        const rest = Math.max(0, convoy.queue.length - 1) * this.cellSize;

        return Math.hypot(target.x - lead.x, target.y - lead.y) + rest;
    }

    // leadSpeed, reached at a limited rate from the speed it is already doing,
    // and held down to what it can still brake from before the road runs out.
    // Into a garage it keeps entrySpeed's own wind-up untouched.
    pace(convoy, delta) {
        const want = this.leadSpeed(convoy);

        if (this.enteringGarage(convoy)) {
            convoy.pace = want;
            return want;
        }

        const step = delta / 1000;
        const brake = Math.sqrt(2 * BRAKING * this.cellSize * this.roadLeft(convoy));
        const limit = Math.min(want, Math.max(brake, ARRIVE_FLOOR * this.cellSize));
        const now = convoy.pace || 0;

        convoy.pace = limit > now ?
            Math.min(limit, now + ACCELERATION * this.cellSize * step) :
            limit;

        return convoy.pace;
    }

    updateConvoy(convoy, delta) {
        const travel = this.pace(convoy, delta) * (delta / 1000);

        let budget = travel;
        let moved = false;
        let guard = 0;

        while (budget > 0 && guard++ < 64) {
            const target = this.nextTarget(convoy);

            if (!target) break;

            const lead = convoy.trail.points[0];
            const dx = target.x - lead.x;
            const dy = target.y - lead.y;
            const dist = Math.hypot(dx, dy);

            const stepping = convoy.queue.length > 0;

            if (dist <= budget) {
                lead.x = target.x;
                lead.y = target.y;
                budget -= dist;
                moved = moved || dist > 0;

                if (!stepping) {
                    convoy.settle = null;
                    break;
                }

                this.onTargetReached(convoy);

                convoy.trail.points.unshift({ x: target.x, y: target.y });
            } else {
                lead.x += (dx / dist) * budget;
                lead.y += (dy / dist) * budget;
                budget = 0;
                moved = true;
            }
        }

        if (convoy.diving) convoy.entered += travel - budget;

        convoy.trail.trim(convoy.bodyLength + this.cellSize * TRAIL_TAIL);
        convoy.moving = moved;

        if (!moved) convoy.pace = 0;

        return moved;
    }

    nextTarget(convoy) {
        if (!convoy.queue.length) return convoy.settle;

        const cell = convoy.queue[0];

        if (!cell) {
            convoy.queue.length = 0;
            return null;
        }

        if (!convoy.stepReserved) {
            if (!this.canEnter(convoy, cell.col, cell.row)) {
                convoy.queue.length = 0;
                convoy.routeStamp = "";
                return null;
            }

            if (this.isExitCell(convoy, cell.col, cell.row)) {
                this.faceGarage(convoy, this.leadCell(convoy));
            }

            this.occupy(convoy, cell.col, cell.row);

            this.board.pulseCell(cell.col, cell.row);

            convoy.cells.unshift({ col: cell.col, row: cell.row });
            convoy.stepReserved = true;

            if (this.isExitCell(convoy, cell.col, cell.row)) this.commitToGarage(convoy);
        }

        return this.cellToPixel(cell.col, cell.row);
    }

    onTargetReached(convoy) {
        const cell = convoy.queue.shift();

        convoy.stepReserved = false;

        const gone = convoy.cells.pop();

        this.release(convoy, gone.col, gone.row);

        if (this.isExitCell(convoy, cell.col, cell.row)) {
            this.beginSwallow(convoy);
            return;
        }

        SoundManager.fx(this.scene, 'step', 0.35);

        if (this.nextToExit(convoy, cell)) this.queueExitStep(convoy);
    }

    isExitCell(convoy, col, row) {
        return !!convoy.exit && convoy.exit[0] === col && convoy.exit[1] === row;
    }

    nextToExit(convoy, cell) {
        if (!convoy.exit) return false;

        return this.atDoorstep(convoy, cell);
    }

    enteringGarage(convoy) {
        return convoy.diving && !convoy.swallowing && !convoy.escaped;
    }

    queueExitStep(convoy) {
        if (convoy.diving || convoy.swallowing || convoy.escaped) return;
        if (!this.canEnter(convoy, convoy.exit[0], convoy.exit[1])) return;

        this.faceGarage(convoy, this.leadCell(convoy));
        this.beginEntry(convoy);
        convoy.settle = null;
        convoy.queue.length = 0;
        convoy.queue.push({ col: convoy.exit[0], row: convoy.exit[1] });
    }

    commitToGarage(convoy) {
        this.beginEntry(convoy);
        convoy.queue.length = 1;

        if (convoy.garage) convoy.garage.gape();
    }

    beginEntry(convoy) {
        convoy.entryStart = Math.max(convoy.pace || 0, this.cellSize * PULL_FLOOR);
        convoy.entered = 0;
        convoy.diving = true;
    }

    entrySpeed(convoy) {
        const wind = Phaser.Math.Clamp(convoy.entered / (PULL_WIND * this.cellSize), 0, 1);
        const eased = wind * wind * (3 - 2 * wind);

        return convoy.entryStart + (this.cellSize * PULL_SPEED - convoy.entryStart) * eased;
    }

    beginSwallow(convoy) {
        if (convoy.swallowing || convoy.escaped) return;

        convoy.swallowing = true;
        convoy.swallowed = 0;
        convoy.queue.length = 0;
        convoy.stepReserved = false;
        convoy.settle = null;
        convoy.settling = false;
        convoy.recoil = 0;

        if (convoy.bumpTween) {
            convoy.bumpTween.remove();
            convoy.bumpTween = null;
        }

        if (convoy.garage) convoy.garage.gape();

        convoy.gulped = 0;

        if (this.drag && this.drag.convoy === convoy) {
            this.drag = null;
            this.dragPoint = null;
        }
    }

    roadAhead(convoy) {
        const out = this.aheadBuffer || (this.aheadBuffer = []);

        out.length = 0;

        if (convoy.escaped) return out;

        if (convoy.swallowing) {
            if (!convoy.garage) return out;

            const spot = this.cellToPixel(convoy.exit[0], convoy.exit[1]);
            const stepX = -Math.cos(convoy.garage.facing) * this.cellSize;
            const stepY = -Math.sin(convoy.garage.facing) * this.cellSize;

            for (let i = 1; i <= convoy.count + 1; i++) {
                out.push({ x: spot.x + stepX * i, y: spot.y + stepY * i });
            }

            return out;
        }

        for (let i = 0; i < convoy.queue.length && out.length < LOOK_AHEAD_CELLS; i++) {
            out.push(this.cellToPixel(convoy.queue[i].col, convoy.queue[i].row));
        }

        return out;
    }

    updateDoors() {
        const mouths = this.mouthShape;

        if (!mouths) return;

        const at = this.getWorldTransformMatrix(this.doorMatrix, this.doorParent)
            .decomposeMatrix();

        this.placeShape(mouths, at);

        for (let i = 0; i < this.convoys.length; i++) {
            const convoy = this.convoys[i];
            const garage = convoy.garage;

            if (!garage || garage.gone) continue;

            const spot = this.cellToPixel(convoy.exit[0], convoy.exit[1]);

            const outX = Math.cos(garage.facing);
            const outY = Math.sin(garage.facing);

            const going = !convoy.escaped &&
                (convoy.swallowing || this.enteringGarage(convoy));

            garage.clip(going || this.vehicleNear(garage));

            if (garage.clipped) {
                this.fillSlab(
                    mouths, spot, outX, outY,
                    garage.doorMouth, garage.doorBack, garage.doorHalf
                );
            }

            if (going) {
                const doors = convoy.rig.doorShape;

                this.placeShape(doors, at);
                this.fillSlab(
                    doors, spot, outX, outY,
                    garage.doorBack, garage.doorBack - DOOR_DEPTH * this.cellSize,
                    DOOR_HALF * this.cellSize
                );
            }

            convoy.rig.maskDoor(going);
        }
    }

    // Whether any vehicle still on the board is close enough to the garage
    // to be under its roof edge.
    vehicleNear(garage) {
        const reach = this.cellSize * GARAGE_NEAR;

        for (let i = 0; i < this.convoys.length; i++) {
            const convoy = this.convoys[i];

            if (convoy.escaped) continue;

            const vehicles = convoy.rig.vehicles;

            for (let j = 0; j < vehicles.length; j++) {
                const art = vehicles[j].art;

                if (Math.abs(art.x - garage.x) < reach && Math.abs(art.y - garage.y) < reach) return true;
            }
        }

        return false;
    }

    placeShape(g, at) {
        g.clear();
        g.setPosition(at.translateX, at.translateY);
        g.setScale(at.scaleX, at.scaleY);
        g.setRotation(at.rotation);
        g.fillStyle(0xffffff, 1);
    }

    fillSlab(g, spot, outX, outY, near, far, half) {
        const acrossX = -outY;
        const acrossY = outX;

        g.fillPoints([
            { x: spot.x + outX * near + acrossX * half, y: spot.y + outY * near + acrossY * half },
            { x: spot.x + outX * near - acrossX * half, y: spot.y + outY * near - acrossY * half },
            { x: spot.x + outX * far - acrossX * half, y: spot.y + outY * far - acrossY * half },
            { x: spot.x + outX * far + acrossX * half, y: spot.y + outY * far + acrossY * half }
        ], true);
    }

    updateSwallow(convoy, delta) {
        const step = this.entrySpeed(convoy) * (delta / 1000);

        convoy.swallowed += step;
        convoy.entered += step;

        if (convoy.swallowed >= convoy.bodyLength + this.cellSize) {
            convoy.swallowed = convoy.bodyLength + this.cellSize;
            this.onConvoyEscaped(convoy);
            return;
        }

        this.gulpCarts(convoy);
        this.updateConvoyView(convoy, delta);
    }

    gulpCarts(convoy) {
        const garage = convoy.garage;

        if (!garage) return;

        const past = convoy.swallowed + garage.doorMouth - this.cellSize;
        const taken = Math.min(convoy.count - 1, Math.floor(past / this.cellSize));

        while (convoy.gulped < taken) {
            convoy.gulped++;
            garage.gulp();
            SoundManager.fx(this.scene, 'gulp', 0.7, (convoy.gulped - 1) * 200);
            this.board.pulseCell(convoy.exit[0], convoy.exit[1]);
        }
    }

    onConvoyEscaped(convoy) {
        if (convoy.escaped) return;

        convoy.escaped = true;
        convoy.swallowing = false;
        convoy.queue.length = 0;
        convoy.settle = null;
        convoy.settling = false;

        if (convoy.bumpTween) {
            convoy.bumpTween.remove();
            convoy.bumpTween = null;
        }

        convoy.recoil = 0;

        this.releaseCells(convoy);
        convoy.rig.setVisible(false);

        if (convoy.garage) {
            const garage = convoy.garage;
            const splash = CONVOY_SPLASH[convoy.key] || "#ffffff";
            const tint = CONFETTI_TINT[convoy.key] || null;

            this.burstFrom(garage, splash);
            this.confettiFrom(garage.x, garage.y, CONFETTI_COUNT, tint);
            SoundManager.fx(this.scene, 'home', 0.8);

            // Gone as soon as the last vehicle is in: nothing left to wait for.
            garage.vanish(() => {
                this.boardStamp++;
            }, this.garageColor(convoy));
        }

        for (let i = 0; i < this.convoys.length; i++) {
            if (!this.convoys[i].escaped) return;
        }

        this.finish(true);
    }

    releaseCells(convoy) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (this.tiles[row][col].owner === convoy.index) this.tiles[row][col].owner = -1;
            }
        }

        if (this.ghost && this.ghost !== convoy) this.claimGhostCells();

        convoy.cells.length = 0;
        this.boardStamp++;
    }

    bumpConvoy(convoy) {
        if (convoy.bumpTween) convoy.bumpTween.remove();

        this.bumpStep(convoy, -BUMP_INTO, BUMP_IN_TIME, "Quad.easeOut", () => {
            this.bumpStep(convoy, BUMP_BACK, BUMP_BACK_TIME, "Quad.easeOut", () => {
                this.bumpStep(convoy, 0, BUMP_REST_TIME, "Sine.easeOut", () => {
                    convoy.bumpTween = null;
                });
            });
        });
    }

    bumpStep(convoy, to, duration, ease, then) {
        convoy.bumpTween = this.scene.tweens.add({
            targets: convoy,
            recoil: this.cellSize * to,
            duration: duration,
            ease: ease,
            onComplete: then
        });
    }

    sparkTexture() {
        const key = SPARK_TEXTURE;

        if (this.scene.textures.exists(key)) return key;

        const size = 32;
        const canvas = this.scene.textures.createCanvas(key, size, size);

        if (!canvas) return "";

        const ctx = canvas.getContext();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        canvas.refresh();

        return key;
    }

    // The garage's own colour, as a number, for the pop it goes out with.
    garageColor(convoy) {
        return Phaser.Display.Color.HexStringToColor(CONVOY_SPLASH[convoy.key] || "#ffffff").color;
    }

    burstFrom(garage, color) {
        const key = this.sparkTexture();

        if (!key) return;

        const tint = Phaser.Display.Color.HexStringToColor(color).color;
        const outX = Math.cos(garage.facing);
        const outY = Math.sin(garage.facing);
        const x = garage.x + outX * garage.doorMouth * 0.5;
        const y = garage.y + outY * garage.doorMouth * 0.5 - 20;

        for (let i = 0; i < BURST_COUNT; i++) {
            const angle = garage.facing + (Math.random() - 0.5) * 2 * BURST_SPREAD;
            const speed = this.cellSize * (3 + Math.random() * 5);
            const size = this.cellSize * (0.1 + Math.random() * 0.14);
            const blob = this.scene.add.image(x, y, key);

            blob.setTint(tint);
            blob.setDisplaySize(size, size);
            this.effectGroup.add(blob);

            this.effects.push({
                blob: blob,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0,
                span: 0.4 + Math.random() * 0.3,
                size: size
            });
        }
    }

    confettiTexture() {
        const key = CONFETTI_TEXTURE;

        if (this.scene.textures.exists(key)) return key;

        const w = CONFETTI_ART_W;
        const h = CONFETTI_ART_H;
        const canvas = this.scene.textures.createCanvas(key, w, h);

        if (!canvas) return "";

        const ctx = canvas.getContext();
        const pill = (x, y, pw, ph) => {
            const r = pw / 2;

            ctx.beginPath();
            ctx.arc(x + r, y + r, r, Math.PI, 0);
            ctx.lineTo(x + pw, y + ph - r);
            ctx.arc(x + r, y + ph - r, r, 0, Math.PI);
            ctx.closePath();
            ctx.fill();
        };

        ctx.fillStyle = "#d9d9d9";
        pill(1, 1, w - 2, h - 2);

        ctx.fillStyle = "#ffffff";
        pill(3, 3, (w - 2) * 0.62, h - 8);

        canvas.refresh();

        return key;
    }

    confettiFrom(x, y, count, color) {
        const key = this.confettiTexture();

        if (!key) return;

        const cell = this.cellSize;

        for (let i = 0; i < count; i++) {
            const pick = i % 3 === 0 && color ?
                color : Phaser.Utils.Array.GetRandom(CONFETTI_COLORS);
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
            const speed = cell * (4 + Math.random() * 6);
            const size = cell * (CONFETTI_LENGTH + Math.random() * CONFETTI_LENGTH_RANGE);
            const piece = this.scene.add.image(x, y, key);

            piece.setTint(Phaser.Display.Color.HexStringToColor(pick).color);
            piece.setRotation(Math.random() * Math.PI * 2);
            this.effectGroup.add(piece);

            this.effects.push({
                blob: piece,
                confetti: true,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                spin: (Math.random() - 0.5) * 14,
                flip: Math.random() * Math.PI * 2,
                flipRate: 4 + Math.random() * 6,
                sway: Math.random() * Math.PI * 2,
                life: 0,
                span: 1.1 + Math.random() * 0.7,
                size: size
            });
        }
    }

    stepConfetti(p, dt) {
        const drag = Math.max(0, 1 - CONFETTI_DRAG * dt);
        const piece = p.blob;

        p.vx *= drag;
        p.vy = p.vy * drag + CONFETTI_GRAVITY * this.cellSize * dt;
        p.flip += p.flipRate * dt;
        p.sway += 5 * dt;

        piece.x += (p.vx + Math.sin(p.sway) * this.cellSize * 0.8) * dt;
        piece.y += p.vy * dt;
        piece.rotation += p.spin * dt;

        // Tumbles end over end: the length shortens and grows back while the
        // thickness holds, so the piece always reads as a pill.
        const tumble = CONFETTI_TUMBLE_MIN + (1 - CONFETTI_TUMBLE_MIN) * Math.abs(Math.cos(p.flip));
        const w = p.size * CONFETTI_THICK;
        const h = Math.max(w, p.size * tumble);

        piece.setDisplaySize(w, h);

        const t = p.life / p.span;

        piece.alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    }

    updateEffects(delta) {
        const dt = delta / 1000;
        const drag = Math.max(0, 1 - BURST_DRAG * dt);

        for (let i = this.effects.length - 1; i >= 0; i--) {
            const p = this.effects[i];

            p.life += dt;

            if (p.life >= p.span) {
                p.blob.destroy();
                this.effects.splice(i, 1);
                continue;
            }

            if (p.confetti) {
                this.stepConfetti(p, dt);
                continue;
            }

            p.vx *= drag;
            p.vy *= drag;
            p.blob.x += p.vx * dt;
            p.blob.y += p.vy * dt;

            const t = p.life / p.span;
            const size = p.size * (1 - t * 0.6);

            p.blob.alpha = 1 - t * t;
            p.blob.setDisplaySize(size, size);
        }
    }

    clearEffects() {
        this.clearHintMark();

        if (this.shudderRun) {
            this.shudderRun.remove();
            this.shudderRun = null;
        }

        for (let i = 0; i < this.effects.length; i++) this.effects[i].blob.destroy();

        this.effects.length = 0;
    }

    doorwayFor(convoy) {
        const garage = convoy.garage;

        if (!garage || convoy.escaped) return null;
        if (!convoy.swallowing && !this.enteringGarage(convoy)) return null;

        const spot = this.cellToPixel(convoy.exit[0], convoy.exit[1]);
        const door = this.doorway || (this.doorway = {});

        door.x = spot.x;
        door.y = spot.y;
        door.outX = Math.cos(garage.facing);
        door.outY = Math.sin(garage.facing);
        door.mouth = garage.doorMouth;
        door.back = garage.doorBack;

        return door;
    }

    isParked(convoy) {
        if (this.drag && this.drag.convoy === convoy) return false;

        return !convoy.queue.length && !convoy.settle && !convoy.diving &&
            !convoy.swallowing && !convoy.escaped;
    }

    updateConvoyView(convoy, delta) {
        convoy.drawnRecoil = convoy.recoil;

        this.stackDirty = true;

        convoy.rig.draw(convoy.trail, {
            headFirst: convoy.leadIsHead,
            parked: this.isParked(convoy),
            recoil: convoy.recoil,
            swallow: convoy.swallowed,
            ahead: this.roadAhead(convoy),
            door: this.doorwayFor(convoy),
            delta: delta || 0
        });
    }

    attachInput() {
        this.detachInput();

        const input = this.scene.input;

        input.on("pointerdown", this.onPointerDown, this);
        input.on("pointermove", this.onPointerMove, this);
        input.on("pointerup", this.onPointerUp, this);
        input.on("pointerupoutside", this.onPointerUp, this);
    }

    detachInput() {
        const input = this.scene.input;

        input.off("pointerdown", this.onPointerDown, this);
        input.off("pointermove", this.onPointerMove, this);
        input.off("pointerup", this.onPointerUp, this);
        input.off("pointerupoutside", this.onPointerUp, this);
    }

    localPointer() {
        const mouse = this.scene.offsetMouse();

        return {
            x: (mouse.x - this.x) / this.scaleX,
            y: (mouse.y - this.y) / this.scaleY
        };
    }

    onPointerDown() {
        const p = this.localPointer();

        // The Crane waiting on an obstacle: a tap on one picks it, and a tap
        // anywhere else on the board puts the crane away. Taps off the board
        // (its own button among them) are left to whatever they land on.
        if (this.pickingObstacle) {
            const cell = this.pixelToCell(p.x, p.y);

            if (!this.onBoard(cell.col, cell.row)) return;

            const pick = this.pickingObstacle;

            if (this.isObstacle(cell.col, cell.row)) {
                this.stopPicking();
                pick.onPick(cell.col, cell.row);
            } else if (pick.onCancel) pick.onCancel();

            return;
        }

        const grabbed = this.pickEnd(p.x, p.y);

        // A booster waiting on a convoy takes the tap instead of a drag.
        if (this.picking) {
            if (!grabbed) return;

            const onPick = this.picking;

            this.picking = null;
            onPick(grabbed.convoy);
            return;
        }

        // Held still (a lesson, an offer, the settings) or a booster still
        // taking effect: the board is not to be played until it is let go.
        // Input may be attached under a hold (the intro's landing attaches
        // it), so the hold is kept here rather than by detaching alone.
        if (this.paused || this.removing > 0) return;

        if (!grabbed) return;

        if (this.hint && this.hint.convoy === grabbed.convoy) this.hint = null;

        this.clockStarted = true;

        this.finishSettle(grabbed.convoy);
        this.setLeadingEnd(grabbed.convoy, grabbed.end);

        // Picked up from a standstill, it pulls away rather than leaping off.
        grabbed.convoy.pace = 0;
        this.updateConvoyView(grabbed.convoy, 0);

        this.drag = { convoy: grabbed.convoy };
        if (grabbed.convoy === this.ghost) grabbed.convoy.ghostDriven = true;
        SoundManager.fx(this.scene, 'grab', 0.55);
        this.routeDrag(p);
    }

    onPointerMove() {
        if (!this.drag) return;

        this.routeDrag(this.localPointer());
    }

    onPointerUp() {
        const convoy = this.drag && this.drag.convoy;

        this.drag = null;
        this.dragPoint = null;

        if (convoy) this.settleConvoy(convoy);
    }

    // Over another convoy, the ghost is the one taken hold of.
    pickEnd(x, y) {
        if (this.ghost) {
            const ghost = this.pickEndOf([this.ghost], x, y);

            if (ghost) return ghost;
        }

        return this.pickEndOf(this.convoys, x, y);
    }

    pickEndOf(convoys, x, y) {
        const reach = this.cellSize * GRAB_REACH;

        let best = null;
        let bestDist = reach;

        for (let i = 0; i < convoys.length; i++) {
            const convoy = convoys[i];

            if (!this.canGrab(convoy)) continue;

            const ends = [
                { end: "head", cell: this.headCell(convoy) },
                { end: "tail", cell: this.tailCell(convoy) }
            ];

            for (let e = 0; e < 2; e++) {
                const p = this.cellToPixel(ends[e].cell.col, ends[e].cell.row);
                const d = Math.hypot(p.x - x, p.y - y);

                if (d < bestDist) {
                    bestDist = d;
                    best = { convoy: convoy, end: ends[e].end };
                }
            }
        }

        if (best) return best;

        for (let i = 0; i < convoys.length; i++) {
            const convoy = convoys[i];

            if (!this.canGrab(convoy)) continue;

            for (let k = 0; k < convoy.cells.length; k++) {
                const p = this.cellToPixel(convoy.cells[k].col, convoy.cells[k].row);

                if (Math.hypot(p.x - x, p.y - y) >= reach) continue;

                const front = k * 2 < convoy.cells.length;

                return { convoy: convoy, end: (front === convoy.leadIsHead) ? "head" : "tail" };
            }
        }

        return null;
    }

    canGrab(convoy) {
        return !convoy.escaped && !convoy.swallowing && !this.enteringGarage(convoy);
    }

    settleConvoy(convoy) {
        if (convoy.escaped || convoy.swallowing) return;

        convoy.routeStamp = "";

        if (this.enteringGarage(convoy)) {
            convoy.hitObstacle = false;
            return;
        }

        convoy.settling = true;

        convoy.hitObstacle = false;

        if (!convoy.stepReserved) {
            convoy.queue.length = 0;
            return;
        }

        const back = convoy.cells[1];

        if (!convoy.queue.length || !back) {
            this.cancelStep(convoy, true);
            return;
        }

        const target = this.cellToPixel(convoy.queue[0].col, convoy.queue[0].row);
        const from = this.cellToPixel(back.col, back.row);
        const lead = convoy.trail.points[0];
        const stride = Math.hypot(target.x - from.x, target.y - from.y);
        const left = Math.hypot(target.x - lead.x, target.y - lead.y);

        if (left <= stride / 2) {
            convoy.queue.length = 1;
            return;
        }

        this.cancelStep(convoy, true);
    }

    settleTrail(convoy) {
        convoy.settling = false;

        this.rebuildTrail(convoy);
        this.updateConvoyView(convoy, 0);
    }

    finishSettle(convoy) {
        if (convoy.settle) {
            convoy.trail.points[0].x = convoy.settle.x;
            convoy.trail.points[0].y = convoy.settle.y;
            convoy.settle = null;
        }

        convoy.settling = false;
    }

    update(time, delta) {
        const step = Math.min(delta || 16, 50);

        if (this.running && this.clockStarted && !this.paused) {
            if (this.frozen > 0) {
                this.frozen = Math.max(0, this.frozen - step);

                if (this.frozen <= 0) this.thaw();
            } else {
                this.timeLeft -= step / 1000;

                if (this.timeLeft <= 0) {
                    this.timeLeft = 0;
                    this.finish(false);
                }
            }
        }

        if (this.frozen > 0) this.frostBoard(time);
        if (this.ghost) this.watchGhost(time);

        if (this.drag && this.dragPoint && !this.drag.convoy.queue.length) {
            this.routeDrag(this.dragPoint);
        }

        for (let i = 0; i < this.convoys.length; i++) {
            const convoy = this.convoys[i];

            if (convoy.escaped) continue;

            if (convoy.swallowing) {
                this.updateSwallow(convoy, step);
                this.lightConvoy(convoy);
                continue;
            }

            const moved = this.updateConvoy(convoy, step);

            if (moved) this.lightConvoy(convoy);

            if (moved || convoy.recoil !== convoy.drawnRecoil || !convoy.rig.settled) {
                this.updateConvoyView(convoy, step);
            }

            if (convoy.settling && !convoy.queue.length && !convoy.settle) {
                this.settleTrail(convoy);
            }
        }

        if (this.hint) this.stepHint(step);
        if (!this.hint && this.hintFx && !this.hintFx.leaving) this.fadeHint();

        if (this.stackDirty) this.sortStage();

        this.board.step(step);
        this.updateEffects(step);
        this.updateDoors();
    }

    // ---- boosters -------------------------------------------------------

    /** The next tap on a convoy is handed to onPick, rather than grabbing it. */
    pickConvoy(onPick) {
        this.dropDrag();
        this.pickingObstacle = null;
        this.markObstacles(false);
        this.picking = onPick;
    }

    stopPicking() {
        this.picking = null;
        this.pickingObstacle = null;
        this.markObstacles(false);
    }

    /**
     * Takes a convoy off the board, garage and all, as though it had got home.
     * False if it can't be taken (it is already on its way in).
     */
    removeConvoy(convoy) {
        if (!this.canGrab(convoy)) return false;

        if (this.drag && this.drag.convoy === convoy) {
            this.drag = null;
            this.dragPoint = null;
        }

        // Nothing else moves on the board while it goes.
        this.dropDrag();
        this.removing++;

        if (this.hint && this.hint.convoy === convoy) this.hint = null;

        // Popped as it is, see-through and all.
        if (convoy === this.ghost) {
            this.ghost = null;
            convoy.ghost = false;
        }

        const spots = convoy.cells.map((cell) => this.cellToPixel(cell.col, cell.row));
        const tint = CONFETTI_TINT[convoy.key] || null;
        const splash = this.garageColor(convoy);

        convoy.escaped = true;
        convoy.queue.length = 0;
        convoy.settle = null;
        convoy.settling = false;
        convoy.diving = false;

        if (convoy.bumpTween) {
            convoy.bumpTween.remove();
            convoy.bumpTween = null;
        }

        this.releaseCells(convoy);

        convoy.rig.links.visible = false;

        const rig = convoy.rig;
        const vehicles = rig.vehicles;

        for (let i = 0; i < vehicles.length; i++) {
            const art = vehicles[i].art;
            const scale = vehicles[i].scale;
            const follow = () => rig.castShadow(i);
            const delay = i * REMOVE_STAGGER;
            const spot = spots[convoy.leadIsHead ? i : spots.length - 1 - i] || spots[0];
            const cell = convoy.cells[convoy.leadIsHead ? i : spots.length - 1 - i];

            this.scene.tweens.add({
                targets: art,
                scaleX: scale * REMOVE_SQUASH_X,
                scaleY: scale * REMOVE_SQUASH_Y,
                duration: REMOVE_POP_TIME,
                delay: delay,
                ease: 'Quad.easeOut',
                onUpdate: follow,
                onStart: () => {
                    SoundManager.fx(this.scene, 'poof', 0.7, i * 150);
                    art.setTintFill(0xffffff);
                    this.confettiFrom(spot.x, spot.y, REMOVE_CONFETTI, tint);
                    this.ringAt(spot.x, spot.y, splash);
                    this.glintsAt(spot.x, spot.y, REMOVE_GLINTS, splash);
                    if (cell) this.board.pulseCell(cell.col, cell.row);
                },
                onComplete: () => {
                    art.clearTint();

                    this.scene.tweens.add({
                        targets: art,
                        scaleX: scale * REMOVE_POP,
                        scaleY: scale * REMOVE_POP,
                        duration: REMOVE_POP_TIME,
                        ease: 'Back.easeOut',
                        onUpdate: follow,
                        onComplete: () => {
                            this.scene.tweens.add({
                                targets: art,
                                scale: 0,
                                alpha: 0,
                                y: art.y - this.cellSize * REMOVE_RISE,
                                angle: art.angle + (i % 2 ? REMOVE_SPIN : -REMOVE_SPIN) * 4,
                                duration: REMOVE_OUT_TIME,
                                ease: 'Back.easeIn',
                                onUpdate: follow
                            });
                        }
                    });
                }
            });
        }

        this.shudder();

        if (convoy.garage) convoy.garage.vanish(() => { this.boardStamp++; }, this.garageColor(convoy));

        // Its own counter, the length of the whole pop, before the level can
        // be called: the last convoy off the board should be seen to go.
        this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: (vehicles.length - 1) * REMOVE_STAGGER + REMOVE_POP_TIME * 2 + REMOVE_OUT_TIME,
            onComplete: () => {
                this.removing = Math.max(0, this.removing - 1);
                convoy.rig.setVisible(false);

                if (this.convoys.every((c) => c.escaped)) this.finish(true);
            }
        });

        return true;
    }

    // ---- Freeze ---------------------------------------------------------

    /**
     * Stands the clock still for FREEZE_TIME. False, and nothing done, while
     * a freeze is still running or once the level is over.
     */
    freeze() {
        if (!this.running || this.finished || this.frozen > 0) return false;

        this.frostIn();

        this.frozen = FREEZE_TIME;
        this.frozenTotal = FREEZE_TIME;

        SoundManager.fx(this.scene, 'star', 0.6);

        return true;
    }

    thaw() {
        this.frozen = 0;
        this.frozenTotal = 0;

        const sheet = this.iceSheet;

        this.scene.tweens.killTweensOf(sheet);
        this.scene.tweens.add({
            targets: sheet,
            alpha: 0,
            duration: ICE_OUT,
            ease: 'Quad.easeIn',
            onComplete: () => { sheet.visible = false; }
        });
    }

    frostIn() {
        const sheet = this.iceSheet;

        this.scene.tweens.killTweensOf(sheet);

        sheet.visible = true;
        sheet.alpha = 0;
        sheet.fading = true;

        this.scene.tweens.add({
            targets: sheet,
            alpha: 1,
            duration: ICE_IN,
            ease: 'Quad.easeOut',
            onComplete: () => { sheet.fading = false; }
        });
    }

    // The frost flickers as the freeze runs out.
    frostBoard(time) {
        const sheet = this.iceSheet;

        if (sheet.fading) return;

        sheet.alpha = this.frozen > THAW_WARN ? 1 :
            0.55 + 0.45 * Math.abs(Math.cos(time * THAW_FLICKER));
    }

    // A pale blue wash over the floor, whitening towards the rim like frost
    // creeping in from the edges. Drawn once a board size.
    makeIceSheet() {
        const w = this.boardWidth;
        const h = this.boardHeight;
        const edge = this.cellSize * 0.18;
        const key = 'ice-sheet-' + Math.round(w) + 'x' + Math.round(h);

        const sheet = bakeShape(this.scene, { left: -w / 2, top: -h / 2, width: w, height: h }, (g) => {
            g.fillStyle(ICE_FILL, ICE_FILL_ALPHA);
            g.fillRoundedRect(-w / 2, -h / 2, w, h, edge);

            for (let i = 0; i < 4; i++) {
                const inset = edge * (0.25 + i * 0.5);

                g.lineStyle(edge * 0.6, ICE_EDGE, 0.34 - i * 0.08);
                g.strokeRoundedRect(-w / 2 + inset, -h / 2 + inset, w - inset * 2, h - inset * 2, edge);
            }
        }, key);

        sheet.visible = false;
        sheet.alpha = 0;

        return sheet;
    }

    // ---- Crane ----------------------------------------------------------

    hasObstacles() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (this.tiles[row][col].obstacle) return true;
            }
        }

        return false;
    }

    /**
     * The next tap on an obstacle is handed to onPick as its cell; a tap
     * anywhere else on the board calls onCancel. Every obstacle rings gold
     * meanwhile.
     */
    pickObstacle(onPick, onCancel = null) {
        this.dropDrag();
        this.picking = null;
        this.pickingObstacle = { onPick: onPick, onCancel: onCancel };
        this.markObstacles(true);
    }

    markObstacles(on) {
        if (this.obstacleMarks) {
            this.scene.tweens.killTweensOf(this.obstacleMarks);

            for (let i = 0; i < this.obstacleMarks.length; i++) this.obstacleMarks[i].destroy();

            this.obstacleMarks = null;
        }

        if (!on) return;

        this.ringTexture();
        this.obstacleMarks = [];

        const fit = this.cellSize * 0.9 / (RING_R * 2);

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (!this.tiles[row][col].obstacle) continue;

                const at = this.cellToPixel(col, row);
                const ring = this.scene.add.image(at.x, at.y, RING_TEXTURE);

                ring.setTint(HINT_RING);
                ring.setScale(fit);
                this.effectGroup.add(ring);
                this.obstacleMarks.push(ring);
            }
        }

        this.scene.tweens.add({
            targets: this.obstacleMarks,
            scale: fit * CRANE_RING_PULSE,
            alpha: 0.55,
            duration: CRANE_RING_TIME,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * Lifts whatever stands on a cell off the board: the cell is floor again
     * at once, and the crane carries the piece away. False if there was
     * nothing there to lift.
     */
    liftObstacle(col, row) {
        if (this.finished || !this.isObstacle(col, row)) return false;

        const piece = this.board.takeOff(col, row);
        const tile = this.tiles[row][col];

        tile.obstacle = false;
        tile.blocked = this.pattern[row][col] !== 1;
        this.boardStamp++;

        if (!piece) return true;

        // Nothing is driven while the crane works.
        this.dropDrag();
        this.removing++;

        const at = this.cellToPixel(col, row);
        const size = this.cellSize;
        const hookScale = size * CRANE_HOOK / CRANE_ICON_ART;

        const crane = this.scene.add.container(at.x, at.y - size * CRANE_FROM);
        this.effectGroup.add(crane);

        const cable = this.scene.add.rectangle(0, 0, size * CRANE_CABLE, size * CRANE_CABLE_LENGTH, CRANE_CABLE_COLOR);
        cable.setOrigin(0.5, 1);
        cable.y = -CRANE_ICON_ART * hookScale * CRANE_TOP;
        cable.x = CRANE_ICON_ART * hookScale * (0.5 - CRANE_ORIGIN_X);
        crane.add(cable);

        const hook = this.scene.add.sprite(0, 0, 'sheet', CRANE_ICON);
        hook.setOrigin(CRANE_ORIGIN_X, CRANE_ORIGIN_Y);
        hook.setScale(hookScale);
        crane.add(hook);

        const art = piece.art;
        const shadow = piece.shadow;
        const artScaleX = art.scaleX;
        const artScaleY = art.scaleY;

        // The piece stays where it stood, under the hook, until it is caught.
        this.board.shadowLayer.add(shadow);
        this.effectGroup.addAt(art, this.effectGroup.getIndex(crane));

        crane.angle = CRANE_SWING;
        SoundManager.fx(this.scene, 'whoosh', 0.6);

        this.scene.tweens.add({
            targets: crane,
            y: at.y - size * CRANE_OVER,
            duration: CRANE_DROP_TIME,
            ease: 'Back.easeOut'
        });

        this.scene.tweens.add({
            targets: crane,
            angle: 0,
            duration: CRANE_DROP_TIME * 1.4,
            ease: 'Elastic.easeOut',
            easeParams: [1.2, 0.5]
        });

        // Caught: a squeeze, then it hangs from the hook and goes up with it.
        this.scene.tweens.add({
            targets: art,
            scaleX: artScaleX * CRANE_SQUASH_X,
            scaleY: artScaleY * CRANE_SQUASH_Y,
            delay: CRANE_DROP_TIME,
            duration: CRANE_GRAB_TIME,
            yoyo: true,
            ease: 'Quad.easeOut',
            onStart: () => {
                SoundManager.fx(this.scene, 'grab', 0.7);
                this.board.pulseCell(col, row);
            },
            onComplete: () => {
                crane.addAt(art, 0);
                art.setPosition(art.x - crane.x, art.y - crane.y);
                art.angle -= crane.angle;

                this.ringAt(at.x, at.y, HINT_RING);
                this.glintsAt(at.x, at.y, REMOVE_GLINTS);
                SoundManager.fx(this.scene, 'whoosh', 0.6);

                this.scene.tweens.add({
                    targets: crane,
                    y: at.y - size * CRANE_LIFT,
                    duration: CRANE_LIFT_TIME,
                    ease: 'Cubic.easeIn'
                });

                this.scene.tweens.add({
                    targets: art,
                    scaleX: artScaleX * CRANE_GROW,
                    scaleY: artScaleY * CRANE_GROW,
                    duration: CRANE_LIFT_TIME,
                    ease: 'Quad.easeOut'
                });

                this.scene.tweens.add({
                    targets: shadow,
                    scale: 0,
                    alpha: 0,
                    duration: CRANE_LIFT_TIME * 0.6,
                    ease: 'Quad.easeIn'
                });

                // Its own counter, the length of the lift, to clear up on.
                this.scene.tweens.addCounter({
                    from: 0,
                    to: 1,
                    duration: CRANE_LIFT_TIME,
                    onComplete: () => {
                        this.removing = Math.max(0, this.removing - 1);
                        shadow.destroy();
                        crane.destroy();
                    }
                });
            }
        });

        return true;
    }

    // ---- Ghost ----------------------------------------------------------

    /** Makes a convoy the ghost. False if it can't be (one already is). */
    makeGhost(convoy) {
        if (this.ghost || this.finished || !this.canGrab(convoy)) return false;

        this.ghost = convoy;
        convoy.ghost = true;
        convoy.ghostDriven = false;
        convoy.ghostStuck = false;

        convoy.rig.setGhost(GHOST_ALPHA);
        this.bumpConvoy(convoy);
        this.lightConvoy(convoy);
        SoundManager.fx(this.scene, 'whoosh', 0.7);

        for (let i = 0; i < convoy.cells.length; i += 2) {
            const at = this.cellToPixel(convoy.cells[i].col, convoy.cells[i].row);

            this.glintsAt(at.x, at.y, 2, 0xffffff);
        }

        return true;
    }

    endGhost() {
        const convoy = this.ghost;

        if (!convoy) return;

        this.ghost = null;
        convoy.ghost = false;

        if (convoy.escaped) return;

        convoy.rig.setGhost(1);
        this.claimCells(convoy);
        this.lightConvoy(convoy);
        SoundManager.fx(this.scene, 'poof', 0.5);

        const head = this.headCell(convoy);
        const at = this.cellToPixel(head.col, head.row);

        this.ringAt(at.x, at.y, 0xffffff);
    }

    // Landed: every free cell it stands on is its own.
    claimCells(convoy) {
        for (let i = 0; i < convoy.cells.length; i++) {
            const cell = convoy.cells[i];

            if (this.tiles[cell.row][cell.col].owner === -1) this.occupy(convoy, cell.col, cell.row);
        }
    }

    ghostOverlaps(convoy) {
        for (let i = 0; i < convoy.cells.length; i++) {
            if (this.tiles[convoy.cells[i].row][convoy.cells[i].col].owner !== convoy.index) return true;
        }

        return false;
    }

    // Shimmers while it lasts. Once it has been driven and let go, it lands
    // as soon as it stands clear of every other convoy; let go over one, it
    // says so once and waits to be moved off.
    watchGhost(time) {
        const ghost = this.ghost;

        if (ghost.escaped) {
            this.endGhost();
            return;
        }

        ghost.rig.setGhost(GHOST_ALPHA + GHOST_SHIMMER * Math.sin(time * GHOST_SHIMMER_RATE));

        if (!ghost.ghostDriven || ghost.swallowing || this.enteringGarage(ghost)) return;

        if (this.drag && this.drag.convoy === ghost) {
            ghost.ghostStuck = false;
            return;
        }

        if (ghost.queue.length || ghost.settle || ghost.settling || ghost.stepReserved) return;

        if (!this.ghostOverlaps(ghost)) {
            this.endGhost();
            return;
        }

        if (!ghost.ghostStuck) {
            ghost.ghostStuck = true;
            this.scene.events.emit('ghost:stuck');
        }
    }

    ringTexture() {
        if (this.scene.textures.exists(RING_TEXTURE)) return;

        const outer = RING_R + RING_THICK;
        const ring = bakeShape(this.scene, { left: -outer, top: -outer, width: outer * 2, height: outer * 2 }, (g) => {
            g.lineStyle(RING_THICK, 0xffffff, 1);
            g.strokeCircle(0, 0, RING_R);
        }, RING_TEXTURE);

        ring.destroy();
    }

    // A ring washing out from a point, as wide as a cell and then some.
    ringAt(x, y, color) {
        this.ringTexture();

        const ring = this.scene.add.image(x, y, RING_TEXTURE);
        const fit = this.cellSize / (RING_R * 2);

        ring.setTint(color);
        ring.setScale(fit * REMOVE_RING_FROM);
        this.effectGroup.add(ring);

        this.scene.tweens.add({
            targets: ring,
            scale: fit * REMOVE_RING_TO,
            alpha: 0,
            duration: REMOVE_RING_TIME,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy()
        });
    }

    // A few glints flung out from a point.
    glintsAt(x, y, count, color = HINT_RING) {
        if (!this.scene.textures.exists(GLINT)) return;

        const size = this.cellSize * 0.8 / GLINT_ART;

        for (let i = 0; i < count; i++) {
            const turn = (i / count) * Math.PI * 2 + Math.random() * 0.8;
            const reach = this.cellSize * (0.6 + Math.random() * 0.4);
            const glint = this.scene.add.image(x, y, GLINT);

            glint.setScale(size);
            glint.setTint(color);
            this.effectGroup.add(glint);

            this.scene.tweens.add({
                targets: glint,
                x: x + Math.cos(turn) * reach,
                y: y + Math.sin(turn) * reach,
                scale: 0,
                angle: 180,
                duration: REMOVE_RING_TIME,
                ease: 'Cubic.easeOut',
                onComplete: () => glint.destroy()
            });
        }
    }

    // One glint that swells and spins away on the spot.
    glintOn(x, y, size) {
        if (!this.scene.textures.exists(GLINT)) return;

        const glint = this.scene.add.image(x, y, GLINT);
        const scale = this.cellSize * size / GLINT_ART;

        glint.setScale(0);
        glint.setTint(HINT_RING);
        this.effectGroup.add(glint);

        this.scene.tweens.add({
            targets: glint,
            scale: { from: scale, to: 0 },
            angle: 120,
            duration: HINT_GLINT_TIME,
            ease: 'Quad.easeIn',
            onComplete: () => glint.destroy()
        });
    }

    // The board jolts side to side and settles, as something is knocked off it.
    shudder() {
        if (this.shudderRun) this.shudderRun.remove();

        this.shudderRun = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: REMOVE_SHAKE_TIME,
            onUpdate: (tween) => {
                const t = tween.getValue();

                this.x = dimensions.gameWidth / 2 + Math.sin(t * Math.PI * 6) * REMOVE_SHAKE * (1 - t);
            },
            onComplete: () => {
                this.shudderRun = null;
                this.x = dimensions.gameWidth / 2;
            }
        });
    }

    // Everything the hint lays on the board: the arrows down the way and the
    // fingertip showing the drag. route runs from the cell next to the end to
    // drive from, to the garage.
    markHint(cell, route) {
        this.clearHintMark();

        const fx = { parts: [], arrows: [], leaving: false };
        const at = this.cellToPixel(cell.col, cell.row);

        this.hintFx = fx;

        // One arrow on each cell of the way but the garage's, pointing on to
        // the next, so a corner shows the turn.
        for (let i = 0; i < route.length - 1; i++) {
            const here = this.cellToPixel(route[i].col, route[i].row);
            const next = this.cellToPixel(route[i + 1].col, route[i + 1].row);
            const arrow = this.hintArrow(here.x, here.y);

            arrow.rotation = Math.atan2(next.y - here.y, next.x - here.x);
            arrow.fit = arrow.restScale * this.cellSize * HINT_ARROW_SIZE / HINT_ARROW_ART;
            arrow.setScale(0);
            arrow.alpha = HINT_ARROW_ALPHA;
            arrow.ready = false;

            fx.arrows.push(arrow);
            fx.parts.push(arrow);

            this.scene.tweens.add({
                targets: arrow,
                scale: arrow.fit,
                duration: HINT_ARROW_IN_TIME,
                delay: i * HINT_ARROW_IN,
                ease: 'Back.easeOut',
                onComplete: () => { arrow.ready = true; }
            });
        }

        this.showHintTouch(fx, [at].concat(route.map((c) => this.cellToPixel(c.col, c.row))));
    }

    // A chevron pointing along +x: gold, edged in white, on a soft shadow.
    hintArrow(x, y) {
        const h = HINT_ARROW_ART / 2;
        const points = [
            { x: -h * 0.7, y: -h * 0.9 }, { x: -h * 0.05, y: -h * 0.9 }, { x: h * 0.75, y: 0 },
            { x: -h * 0.05, y: h * 0.9 }, { x: -h * 0.7, y: h * 0.9 }, { x: h * 0.05, y: 0 }
        ];
        const arrow = bakeShape(this.scene, { left: -h - 4, top: -h - 4, width: HINT_ARROW_ART + 8, height: HINT_ARROW_ART + 12 }, (g) => {
            g.fillStyle(HINT_SHADE, 0.22);
            g.fillPoints(points.map((p) => ({ x: p.x, y: p.y + 4 })), true);
            g.fillStyle(HINT_RING, 1);
            g.fillPoints(points, true);
            g.lineStyle(3.5, HINT_EDGE, 1);
            g.strokePoints(points, true);
        }, HINT_ARROW_TEXTURE);

        arrow.setPosition(x, y);
        this.effectGroup.add(arrow);

        return arrow;
    }

    // A brightening that runs down the arrows towards the garage, again and
    // again, so they read as the way to go.
    marchHintArrows(time) {
        const fx = this.hintFx;

        if (!fx || fx.leaving) return;

        for (let i = 0; i < fx.arrows.length; i++) {
            const arrow = fx.arrows[i];

            if (!arrow.ready) continue;

            const phase = ((time / HINT_MARCH - i * HINT_MARCH_LAG) % 1 + 1) % 1;
            const lit = phase < 0.35 ? Math.sin(phase / 0.35 * Math.PI) : 0;

            arrow.setScale(arrow.fit * (1 + HINT_MARCH_SWELL * lit));
            arrow.alpha = HINT_ARROW_ALPHA + (1 - HINT_ARROW_ALPHA) * lit;
        }
    }

    // The fingertip, pressing on the end to drive and dragging it home along
    // points, on one repeating counter of its own.
    showHintTouch(fx, points) {
        const r = HINT_TOUCH_ART / 2;
        const touch = bakeShape(this.scene, { left: -r - 2, top: -r - 2, width: HINT_TOUCH_ART + 4, height: HINT_TOUCH_ART + 8 }, (g) => {
            g.fillStyle(HINT_SHADE, 0.25);
            g.fillCircle(0, 4, r);
            g.fillStyle(HINT_EDGE, 1);
            g.fillCircle(0, 0, r);
            g.fillStyle(HINT_RING, 1);
            g.fillCircle(0, 0, r * 0.62);
            g.fillStyle(HINT_EDGE, 0.7);
            g.fillCircle(-r * 0.2, -r * 0.2, r * 0.18);
        }, HINT_TOUCH_TEXTURE);
        const fit = touch.restScale * this.cellSize * HINT_TOUCH_SIZE / HINT_TOUCH_ART;

        touch.alpha = 0;
        this.effectGroup.add(touch);
        fx.parts.push(touch);
        fx.touch = touch;

        const path = new Phaser.Curves.Path(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) path.lineTo(points[i].x, points[i].y);

        const glide = Math.max(2, points.length - 1) * HINT_TOUCH_CELL;
        const glideAt = HINT_TOUCH_IN;
        const outAt = glideAt + glide;
        const cycle = outAt + HINT_TOUCH_OUT + HINT_TOUCH_REST;
        const start = points[0];
        const end = points[points.length - 1];
        const spot = new Phaser.Math.Vector2();
        let lastAt = 0;

        const place = (t) => {
            if (t < glideAt) {
                // Comes down on the end and presses.
                const k = t / HINT_TOUCH_IN;

                touch.setPosition(start.x, start.y);
                touch.alpha = Math.min(1, k * 2);
                touch.setScale(fit * (1.35 - (1.35 - HINT_TOUCH_PRESS) * Phaser.Math.Easing.Quadratic.Out(k)));
            } else if (t < outAt) {
                // Pressed, along the way.
                path.getPoint(Phaser.Math.Easing.Sine.InOut((t - glideAt) / glide), spot);
                touch.setPosition(spot.x, spot.y);
                touch.alpha = 1;
                touch.setScale(fit * HINT_TOUCH_PRESS);
            } else {
                // Lets go in the garage.
                const k = Math.min(1, (t - outAt) / HINT_TOUCH_OUT);

                touch.setPosition(end.x, end.y);
                touch.alpha = 1 - k;
                touch.setScale(fit * (HINT_TOUCH_PRESS + 0.5 * k));
            }
        };

        touch.setPosition(start.x, start.y);

        fx.touchRun = this.scene.tweens.addCounter({
            from: 0,
            to: cycle,
            duration: cycle,
            delay: HINT_TOUCH_WAIT,
            repeat: -1,
            onUpdate: (tween) => {
                const t = tween.getValue();

                // A ripple where it presses and where it lets go, once a pass.
                if (t < lastAt) lastAt = 0;
                if (lastAt < glideAt && t >= glideAt) this.ringAt(start.x, start.y, HINT_EDGE);
                if (lastAt < outAt && t >= outAt) this.ringAt(end.x, end.y, HINT_EDGE);

                lastAt = t;
                place(t);
            }
        });
    }

    // Something has moved into the way it lights, so it no longer holds.
    hintBlocked(hint) {
        for (let i = 0; i < hint.route.length - 1; i++) {
            const cell = hint.route[i];

            if (this.tiles[cell.row][cell.col].owner !== -1) return true;
        }

        return false;
    }

    // Over: everything it put down fades out together.
    fadeHint() {
        const fx = this.hintFx;

        fx.leaving = true;

        if (fx.touchRun) fx.touchRun.remove();

        this.scene.tweens.killTweensOf(fx.parts);
        this.scene.tweens.add({
            targets: fx.parts,
            alpha: 0,
            duration: HINT_OUT_TIME,
            ease: 'Sine.easeIn',
            onComplete: () => {
                if (this.hintFx === fx) this.clearHintMark();
            }
        });
    }

    clearHintMark() {
        const fx = this.hintFx;

        if (!fx) return;

        if (fx.touchRun) fx.touchRun.remove();

        this.scene.tweens.killTweensOf(fx.parts);

        for (let i = 0; i < fx.parts.length; i++) fx.parts[i].destroy();

        this.hintFx = null;
    }

    /**
     * Finds a convoy that can drive into its garage as the board stands, and
     * lights its way. False, and nothing shown, if none can.
     */
    showHint() {
        let best = null;

        for (let i = 0; i < this.convoys.length; i++) {
            const convoy = this.convoys[i];

            if (!convoy.exit || !this.canGrab(convoy) || !convoy.cells.length) continue;

            const ends = [this.headCell(convoy), this.tailCell(convoy)];

            for (let e = 0; e < ends.length; e++) {
                const route = this.freeRoute(convoy, ends[e]);

                if (route && (!best || route.length < best.route.length)) {
                    best = { convoy: convoy, route: route, from: ends[e] };
                }
            }
        }

        if (!best) return false;

        this.hint = { convoy: best.convoy, route: best.route, time: 0 };

        this.bumpConvoy(best.convoy);
        this.markHint(best.from, best.route);
        SoundManager.fx(this.scene, 'hint', 0.7);

        const start = this.cellToPixel(best.from.col, best.from.row);

        this.glintsAt(start.x, start.y, REMOVE_GLINTS);

        if (best.convoy.garage) best.convoy.garage.cheer();

        return true;
    }

    // The way from one end of a convoy to its garage over empty cells alone,
    // as a list of cells ending on the garage, or null. The convoy's own body
    // counts as in the way, so what it finds can be driven as it stands.
    freeRoute(convoy, from) {
        const goal = convoy.exit;
        const seen = new Map();
        const queue = [from];
        const key = (col, row) => row * this.columns + col;
        const sides = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ];

        seen.set(key(from.col, from.row), null);

        while (queue.length) {
            const cell = queue.shift();

            for (let i = 0; i < sides.length; i++) {
                const col = cell.col + sides[i][0];
                const row = cell.row + sides[i][1];
                const k = key(col, row);

                if (seen.has(k) || !this.isFloor(col, row)) continue;
                if (this.tiles[row][col].owner !== -1) continue;

                const garage = this.garageAt(col, row);

                if (garage && garage.convoyIndex !== convoy.index) continue;

                seen.set(k, cell);

                if (col === goal[0] && row === goal[1]) {
                    const route = [];
                    let at = { col: col, row: row };

                    while (at && !(at.col === from.col && at.row === from.row)) {
                        route.unshift(at);
                        at = seen.get(key(at.col, at.row));
                    }

                    return route;
                }

                queue.push({ col: col, row: row });
            }
        }

        return null;
    }

    stepHint(step) {
        const hint = this.hint;

        // A held hint (a booster's first-time lesson) runs until let go.
        if (hint.convoy.escaped || this.hintBlocked(hint) || (!hint.hold && hint.time >= HINT_TIME)) {
            this.hint = null;
            return;
        }

        this.marchHintArrows(hint.time);

        const was = Math.floor(hint.time / HINT_STEP);

        hint.time += step;

        const now = Math.floor(hint.time / HINT_STEP);

        this.lightConvoy(hint.convoy);

        // A wave of lit cells runs out along the way, then a short rest.
        for (let n = was + 1; n <= now; n++) {
            const k = n % (hint.route.length + HINT_REST);

            if (k >= hint.route.length) continue;

            const cell = hint.route[k];
            const at = this.cellToPixel(cell.col, cell.row);
            const home = k === hint.route.length - 1;

            this.board.pulseCell(cell.col, cell.row);
            this.glintOn(at.x, at.y, home ? HINT_GLINT_HOME : HINT_GLINT);
        }
    }

    /**
     * Takes the board out of sight in its starting pose, so it does not show
     * through the home screen's sky as that fades. Input stays off until the
     * intro has landed, so nothing can be grabbed mid-flight.
     */
    readyIntro() {
        this.stopIntro();
        this.detachInput();

        this.alpha = 0;
        this.setScale((this.fitScale || 1) * INTRO_FROM);
        this.y = this.restY + INTRO_DROP;
    }

    /** Brings the board on, then hands over to onDone. */
    intro(onDone = null) {
        this.readyIntro();

        const fit = this.fitScale || 1;

        this.introDone = onDone;
        this.introTweens = [
            this.scene.tweens.add({
                targets: this,
                alpha: 1,
                duration: INTRO_FADE,
                ease: 'Quad.easeOut'
            }),
            this.scene.tweens.add({
                targets: this,
                scale: fit,
                y: this.restY,
                duration: INTRO_TIME,
                ease: 'Back.easeOut',
                onComplete: () => this.stopIntro()
            })
        ];
    }

    // Lands the board where it belongs and hands over, whether the intro ran
    // its course or was cut short by a resize.
    stopIntro() {
        if (!this.introTweens) return;

        for (let i = 0; i < this.introTweens.length; i++) this.introTweens[i].remove();

        this.introTweens = null;

        this.alpha = 1;
        this.setScale(this.fitScale || 1);
        this.y = this.restY;

        const done = this.introDone;

        this.introDone = null;

        if (done) done();
    }

    start() {
        this.finished = false;
        this.running = true;

        // Still flying in: the board can be played once it has landed.
        if (this.introTweens) {
            const then = this.introDone;

            this.introDone = () => {
                if (then) then();
                if (this.running) this.attachInput();
            };

            return;
        }

        this.attachInput();
    }

    finish(won) {
        if (this.finished) return;

        this.finished = true;
        this.running = false;

        this.detachInput();
        this.dropDrag();

        this.scene.showEndCard(won);
    }

    addTime(seconds) {
        this.timeLeft += seconds;
        this.finished = false;
        this.running = true;

        this.attachInput();
    }

    dropDrag() {
        if (this.drag) this.settleConvoy(this.drag.convoy);

        this.drag = null;
        this.dragPoint = null;
    }

    reset() {
        this.detachInput();
        this.stopPicking();

        if (this.iceSheet) this.scene.tweens.killTweensOf(this.iceSheet);

        for (let i = 0; i < this.convoys.length; i++) this.scene.tweens.killTweensOf(this.convoys[i].rig);

        for (let i = 0; i < this.convoys.length; i++) this.convoys[i].rig.destroy();
        for (let i = 0; i < this.garages.length; i++) this.garages[i].destroy();
        this.mouthShape.destroy();
        this.clearEffects();

        this.removeAll(true);
        this.board = null;
        this.searchGraph = null;

        this.init();
    }

    adjust() {
        this.x = dimensions.gameWidth / 2;

        let room;

        if (dimensions.isLandscape) {
            const tall = dimensions.gameHeight - WIDE_TOP - WIDE_BOTTOM;

            this.restY = WIDE_TOP + tall / 2;

            room = Math.min(
                (dimensions.gameWidth - WIDE_SIDE * 2) / this.boardWidth,
                tall / this.boardHeight
            );
        } else {
            this.restY = dimensions.gameHeight / 2;

            room = Math.min(
                BOARD_FIT_W / this.boardWidth,
                BOARD_FIT_H / this.boardHeight
            );
        }

        this.y = this.restY;

        this.fitScale = Math.min(1, room);
        this.setScale(this.fitScale);

        if (this.board) this.board.refresh();

        this.stopIntro();
    }

    destroy(fromScene) {
        this.introDone = null;
        this.stopIntro();
        this.detachInput();

        for (let i = 0; i < this.convoys.length; i++) this.convoys[i].rig.destroy();
        for (let i = 0; i < this.garages.length; i++) this.garages[i].destroy();
        this.mouthShape.destroy();
        this.clearEffects();

        super.destroy(fromScene);
    }
}