import { astar, Graph } from '../utils/astar.js';
import { Trail } from './trail.js';
import { Board } from './board.js';
import { Convoy } from './convoy.js';
import { Garage } from './garage.js';
import levels from '../data/level-data.js';

const BOARD_WIDTH = 500;
const BOARD_HEIGHT = 615;

const BOARD_SCREEN = 0.5;

const DRAG_SPEED = 3.5;
const CHASE_SPEED = 8;
const SETTLE_SPEED = 5.5;

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
    orange: "#ff9a3d"
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
    orange: "#ff8a1f"
};

const LOOK_AHEAD_CELLS = 2;

const DOOR_HALF = 0.75;
const DOOR_DEPTH = 12;

// The board rises into place from a little small and low once the home screen
// has gone.
const INTRO_TIME = 640;
const INTRO_FADE = 320;
const INTRO_FROM = 0.84;
const INTRO_DROP = 70;

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
        this.pattern = levelData.pattern;
        this.obstacles = levelData.obstacles || [];
        this.walls = levelData.walls || [];

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

        this.levelTime = levelData.time || 0;
        this.timeLeft = this.levelTime;
        this.running = false;
        this.finished = false;

        this.drag = null;
        this.dragPoint = null;
        this.convoys = [];
        this.garages = [];

        this.stackDirty = true;

        for (let i = 0; i < levelData.convoys.length; i++) {
            this.convoys.push(this.createConvoy(levelData.convoys[i], i));
        }

        this.createGarages();

        this.attachInput();
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

    canEnter(convoy, col, row) {
        if (!this.isFloor(col, row)) return false;

        const garage = this.garageAt(col, row);

        if (garage) {
            if (garage.convoyIndex !== convoy.index) return false;
            if (!this.atDoorstep(convoy, this.leadCell(convoy))) return false;
        }

        return this.tiles[row][col].owner === -1;
    }

    doorstep(convoy) {
        const garage = convoy.garage;

        if (!garage) return null;

        const outX = Math.cos(garage.facing);
        const outY = Math.sin(garage.facing);
        const along = Math.abs(outX) >= Math.abs(outY);

        return {
            col: convoy.exit[0] + (along ? Math.sign(outX) : 0),
            row: convoy.exit[1] + (along ? 0 : Math.sign(outY))
        };
    }

    atDoorstep(convoy, cell) {
        const step = this.doorstep(convoy);

        return !!step && !!cell && step.col === cell.col && step.row === cell.row;
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
        if (typeof convoy.facing !== "number") return;

        const step = this.doorstep(convoy);

        if (!this.isFloor(step.col, step.row)) {
            console.warn(
                "Garage '" + convoy.key + "' is turned towards a cell no convoy can stand on:",
                step.col, step.row
            );
        } else if (this.tiles[step.row][step.col].obstacle) {
            console.warn(
                "Garage '" + convoy.key + "' is turned towards an obstacle:",
                step.col, step.row
            );
        }
    }

    lightConvoy(convoy) {
        for (let i = 0; i < convoy.cells.length; i++) {
            this.board.pulseCell(convoy.cells[i].col, convoy.cells[i].row);
        }
    }

    occupy(convoy, col, row) {
        if (!this.onBoard(col, row)) return;

        this.tiles[row][col].owner = convoy.index;
        this.boardStamp++;
    }

    release(convoy, col, row) {
        if (!this.onBoard(col, row)) return;

        const tile = this.tiles[row][col];

        if (tile.owner !== convoy.index) return;

        tile.owner = -1;
        this.boardStamp++;
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
            parent: this.stage
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
                this.searchGraph.grid[col][row].weight = this.canEnter(convoy, col, row) ? 1 : 0;
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

    routeGoal(convoy, goal) {
        if (!this.isExitCell(convoy, goal.col, goal.row)) return goal;

        const step = this.doorstep(convoy);

        return (step && this.isFloor(step.col, step.row)) ? step : goal;
    }

    routeDrag(point) {
        const convoy = this.drag && this.drag.convoy;

        if (!convoy || convoy.escaped || convoy.swallowing) return;

        this.dragPoint = { x: point.x, y: point.y };

        if (this.enteringGarage(convoy)) {
            convoy.hitObstacle = false;
            return;
        }

        const goal = this.routeGoal(convoy, this.pixelToCell(point.x, point.y));

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
        if (hit && !convoy.hitObstacle) this.bumpConvoy(convoy);

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

    updateConvoy(convoy, delta) {
        const travel = this.leadSpeed(convoy) * (delta / 1000);

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
        convoy.entryStart = Math.max(this.leadSpeed(convoy), this.cellSize * PULL_FLOOR);
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

            this.fillSlab(
                mouths, spot, outX, outY,
                garage.doorMouth, garage.doorBack, garage.doorHalf
            );

            const going = !convoy.escaped &&
                (convoy.swallowing || this.enteringGarage(convoy));

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

            garage.cheer(() => {
                garage.vanish(() => {
                    // this.confettiFrom(garage.x, garage.y, CONFETTI_POP_COUNT, tint);
                    this.boardStamp++;
                });
            });
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
        const grabbed = this.pickEnd(p.x, p.y);

        if (!grabbed) return;

        this.finishSettle(grabbed.convoy);
        this.setLeadingEnd(grabbed.convoy, grabbed.end);
        this.updateConvoyView(grabbed.convoy, 0);

        this.drag = { convoy: grabbed.convoy };
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

    pickEnd(x, y) {
        const reach = this.cellSize * GRAB_REACH;

        let best = null;
        let bestDist = reach;

        for (let i = 0; i < this.convoys.length; i++) {
            const convoy = this.convoys[i];

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

        for (let i = 0; i < this.convoys.length; i++) {
            const convoy = this.convoys[i];

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

        if (this.running) {
            this.timeLeft -= step / 1000;

            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.finish(false);
            }
        }

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

        if (this.stackDirty) this.sortStage();

        this.board.step(step);
        this.updateEffects(step);
        this.updateDoors();
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
        this.restY = dimensions.gameHeight / 2;
        this.y = this.restY;

        const room = Math.min(
            dimensions.gameWidth / this.boardWidth,
            (dimensions.gameHeight * BOARD_SCREEN) / this.boardHeight
        );

        this.fitScale = Math.min(1, room);
        this.setScale(this.fitScale);

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