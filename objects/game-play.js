import { astar, Graph } from '../utils/astar.js';
import { Trail } from './trail.js';
import { Board } from './board.js';
import { Convoy } from './convoy.js';
import { Garage } from './garage.js';
import levelData from '../data/level-data.js';

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

// Going into the garage is one run, from the doorstep to the last cart gone:
// the tractor keeps whatever pace it arrived at the door with, and the whole
// convoy winds smoothly from there to PULL_SPEED, in cells a second, over
// PULL_WIND cells of the run. Nothing is stepped up or down on the way, so
// the convoy is seen to drive in rather than be snatched.
const PULL_SPEED = 5.5;
const PULL_WIND = 1.5;

// The least pace it sets off from the doorstep at, in cells a second, for a
// tractor that was barely moving when it got there.
const PULL_FLOOR = 3;

// The burst thrown out of the doorway once the whole convoy is in.
const BURST_COUNT = 18;
const BURST_SPREAD = 0.9;
const BURST_DRAG = 4;
const SPARK_TEXTURE = "convoy-spark";

// The colour each convoy bursts in, by its key. White for one not listed.
const CONVOY_SPLASH = {
    yellow: "#ffd400",
    red: "#ff5252",
    cyan: "#3ae4ff"
};

const LOOK_AHEAD_CELLS = 2;

const DOOR_HALF = 0.75;
const DOOR_DEPTH = 12;

// Everything standing on the board is drawn in order of depth, which each
// thing sets from its own y: further down the screen is nearer the viewer.
const byDepth = (a, b) => a.depth - b.depth;

export class GamePlay extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.init();
    }

    init() {
        this.rows = levelData.rows;
        this.columns = levelData.columns;
        this.pattern = levelData.pattern;
        this.obstacles = levelData.obstacles || [];

        // Square, so a cart is the same size whichever way it is driving and a
        // corner is a quarter turn rather than an ellipse.
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

        // Bumped on every occupy and release, so a route worked out on one
        // arrangement of the board is never reused on another.
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

            // Blocked like a gap in the board, but kept apart from one: an
            // obstacle is a thing standing on the tarmac, and hitting it is
            // worth a knock where driving into the edge of the world is not.
            this.tiles[row][col].blocked = true;
            this.tiles[row][col].obstacle = true;
        }

        // One layer for everything that stands on the board - obstacles,
        // vehicles, couplings and garages - sorted by depth, so whatever is
        // further down the screen is drawn over what stands behind it.
        this.stage = this.scene.add.container();

        this.board = new Board(this.scene, {
            parent: this,
            props: this.stage,
            pattern: this.pattern,
            obstacles: this.obstacles,
            rows: this.rows,
            columns: this.columns,
            tileWidth: this.tileWidth,
            tileHeight: this.tileHeight,
            startX: this.startX,
            startY: this.startY
        });

        // The rooms the vehicles drive into, under everything on the stage.
        this.garageBackGroup = this.scene.add.container();
        this.add(this.garageBackGroup);

        this.add(this.stage);

        // Bursts and the like, over everything on the board.
        this.effectGroup = this.scene.add.container();
        this.add(this.effectGroup);
        this.effects = [];

        // Cuts each garage's doorway out of its building, so a vehicle behind
        // the building is seen through the opening. Held in world space, which
        // is why it is redrawn through the board's own transform. The cut past
        // the back wall is each convoy's own, kept by its rig.
        this.mouthShape = this.scene.make.graphics({ add: false });
        this.mouthMask = this.mouthShape.createGeometryMask();
        this.mouthMask.invertAlpha = true;

        this.doorMatrix = new Phaser.GameObjects.Components.TransformMatrix();
        this.doorParent = new Phaser.GameObjects.Components.TransformMatrix();

        // The clock the level is played against. It does not start until the
        // home screen is out of the way, and it stops the moment the level is
        // settled either way.
        this.levelTime = levelData.time || 0;
        this.timeLeft = this.levelTime;
        this.running = false;
        this.finished = false;

        this.drag = null;
        this.dragPoint = null;
        this.convoys = [];
        this.garages = [];

        // Set by any vehicle being moved, cleared by the sort at the end of the
        // frame. The convoys are drawn where the level parked them before the
        // first frame runs, so the layer starts out needing one.
        this.stackDirty = true;

        for (let i = 0; i < levelData.convoys.length; i++) {
            this.convoys.push(this.createConvoy(levelData.convoys[i], i));
        }

        this.createGarages();

        this.attachInput();
    }


    // ---- board ----------------------------------------------------------

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

        // A garage takes its own convoy and nobody else's, and it takes it
        // through the door: the one cell its opening looks out on is the whole
        // of the way in. Driving at it from the side is driving at a wall, so
        // the tractor has to be stood on that cell before the door is open to
        // it at all - which is what keeps a convoy on the roads that lead there
        // rather than letting it slip in off whichever side it happens to reach.
        if (garage) {
            if (garage.convoyIndex !== convoy.index) return false;
            if (!this.atDoorstep(convoy, this.leadCell(convoy))) return false;
        }

        return this.tiles[row][col].owner === -1;
    }

    /**
     * The cell a garage's doorway looks out on - the one the convoy drives in
     * from. Worked out off the way the building is turned, so the two can never
     * disagree: wherever the art's opening points, that is the way in.
     *
     * The way in is a whole cell, so the angle is read as whichever of the four
     * it lies nearest. A garage turned off the square - set at a slant for the
     * look of it - still has the one cell in front of it as its step, rather
     * than a diagonal no convoy could drive out of.
     */
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

            if (garage.col === col && garage.row === row) return garage;
        }

        return null;
    }

    /**
     * Which way a garage's doorway is turned.
     *
     * A level may say so itself, in degrees turned the way the screen is: 0
     * looks right, 90 down, 180 left, 270 up. That is the last word on it -
     * the doorway, the dive and the opening cut out of the building are all
     * read off this one angle, so an angle the level gives turns the whole
     * garage and not just its art.
     *
     * Left out, it falls back to where the building stands, which is what
     * every garage did before a level could speak up.
     */
    garageFacing(convoy) {
        if (typeof convoy.facing !== "number") {
            return this.wayIn(convoy.exit[0], convoy.exit[1]);
        }

        return Phaser.Math.DegToRad(convoy.facing);
    }

    /**
     * Which way a garage's doorway looks: out towards the cell a convoy reaches
     * it from. A garage set into an edge has only the one way in, which is the
     * whole of it; where there is more than one, or none, the doorway is turned
     * towards the middle of the board, which is the way the board opens out.
     */
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

    /**
     * A garage turned by hand can be turned to face a wall. The doorway is the
     * whole of the way in, so that is a level nobody can finish - said out loud
     * here rather than left to be discovered by driving at it.
     */
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

    /**
     * Light every tile the convoy is standing on, so the lift covers the whole
     * of it rather than only the cell the tractor is stepping into. Stop calling
     * this and the track sinks away on the board's own clock.
     */
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


    // ---- convoys --------------------------------------------------------

    createConvoy(data, index) {
        const cells = data.cells.map((p) => ({ col: p[0], row: p[1] }));

        const convoy = {
            key: data.key,
            index: index,
            exit: data.exit,

            // Degrees, or left out for the garage to be turned by where it
            // stands. See garageFacing().
            facing: data.facing,
            garage: null,
            cells: cells,
            count: cells.length,

            // Which end is out in front. cells[0] is always the end being
            // driven, so a convoy taken by its last cart has its cells turned
            // round and is reversed down the board, tractor last.
            leadIsHead: true,

            // Cells the end being driven still has to go through, nearest first.
            queue: [],

            // The board and goal the queue was worked out for. Pointer moves
            // arrive far faster than the tractor crosses cells, and the same
            // ask twice over gives the same answer, so it is only solved once.
            routeStamp: "",

            // The tractor is already counted as standing on queue[0] - it has
            // the cell held, it is just not there yet.
            stepReserved: false,

            // Where a let-go tractor is walking back to when it is left part
            // way into a cell it never finished entering.
            settle: null,
            settling: false,

            moving: false,
            hitObstacle: false,

            // Set the moment the tractor sets off for its own garage: from then
            // on the dive is paid for and the drag cannot steer it back out.
            diving: false,
            entryStart: 0,
            entered: 0,
            swallowing: false,
            swallowed: 0,
            escaped: false,

            // How far back down the trail the convoy is currently shunted, and
            // the value the art was last drawn at.
            recoil: 0,
            drawnRecoil: 0,
            bumpTween: null,

            trail: null
        };

        this.validateConvoy(convoy, data.cells);

        for (let i = 0; i < cells.length; i++) this.occupy(convoy, cells[i].col, cells[i].row);

        // The distance from the tractor back to the last cart, which is how far
        // of the trail is worth keeping.
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

    /**
     * Lay the trail back over the cells the convoy is parked on. The tractor's
     * cell goes in twice: points[0] is the live leading point the drag moves,
     * and the copy behind it is the corner it has not left yet. A cell's worth
     * of trail is run on past the last cart as well, so that cart has real
     * ground behind it to read its heading and its rounding off.
     */
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

    /**
     * Drive the convoy from the end that was taken hold of. Taken by the tractor
     * it goes forwards; taken by the last cart it backs up, the whole convoy
     * reversing down the same track. Turning it round turns the cells round,
     * so cells[0] is still the end being driven and nothing else has to know.
     *
     * A step the old front had part taken is given up rather than finished:
     * the new front cannot be steered into a cell the other end had booked.
     */
    setLeadingEnd(convoy, end) {
        const wantHead = end === "head";

        if (wantHead === convoy.leadIsHead) return;

        this.cancelStep(convoy);
        convoy.settle = null;
        convoy.settling = false;
        convoy.hitObstacle = false;

        // A knock still playing out was measured down the old track from the
        // old front, and would run the convoy the wrong way from the new one.
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

    /** Hand back the cell the tractor had reserved but never reached. */
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


    // ---- routing --------------------------------------------------------

    // One Graph is kept for the life of the board and re-weighted per search. A
    // fresh one allocates a node per cell, and this runs on every pointer move.
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

    /** Work out the cells the tractor should drive to reach the finger. */
    routeDrag(point) {
        const convoy = this.drag && this.drag.convoy;

        if (!convoy || convoy.escaped || convoy.swallowing) return;

        this.dragPoint = { x: point.x, y: point.y };

        // Once the tractor has set off for its own garage the rest of the drag
        // is ignored rather than steering it back out.
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

        // A step already half taken is finished before anything else - the
        // tractor cannot be steered back out of a cell it is crossing into.
        if (reserved && (!route.length ||
                route[0].col !== reserved.col || route[0].row !== reserved.row)) {
            route.unshift(reserved);
        }

        convoy.queue = route;

        this.noteObstacleHit(convoy, point);
    }

    /**
     * The convoy has run up against something on its way to the finger. Note it
     * only where that something is an obstacle, since that is the one case worth a
     * knock - a wall, the edge of the board or another convoy stop it just as
     * dead, and it simply comes to rest against them.
     */
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

    /**
     * Spend this frame's travel on the leading point, walking it from one queued
     * cell centre to the next and laying the trail down behind it.
     */
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

                // The cell centre just reached becomes a corner of the trail,
                // and a fresh leading point carries on from it.
                convoy.trail.points.unshift({ x: target.x, y: target.y });
            } else {
                lead.x += (dx / dist) * budget;
                lead.y += (dy / dist) * budget;
                budget = 0;
                moved = true;
            }
        }

        // The run in is measured from the doorstep, through the dive and on
        // through the swallow, so its pace carries across the two unbroken.
        if (convoy.diving) convoy.entered += travel - budget;

        convoy.trail.trim(convoy.bodyLength + this.cellSize * TRAIL_TAIL);
        convoy.moving = moved;

        return moved;
    }

    /**
     * Where the leading point is headed. Taking a cell out of the queue books it
     * on the board first, so nothing else can be routed through it.
     */
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

            // lightConvoy() covers the body, but a flick fast enough to cross a
            // cell inside one frame would leave a hole in the track without
            // this. Lit here rather than in occupy(), so the convoys are dark
            // where the level starts them.
            this.board.pulseCell(cell.col, cell.row);

            convoy.cells.unshift({ col: cell.col, row: cell.row });
            convoy.stepReserved = true;

            if (this.isExitCell(convoy, cell.col, cell.row)) this.commitToGarage(convoy);
        }

        return this.cellToPixel(cell.col, cell.row);
    }

    /** The tractor is on the cell it booked, so the last cart lets its own go. */
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

    // True from the frame the tractor sets off for its own garage until the pull
    // inside takes over. The dive is already paid for, so nothing pulls it back.
    enteringGarage(convoy) {
        return convoy.diving && !convoy.swallowing && !convoy.escaped;
    }

    /**
     * Queued from the tile beside the garage: the tractor takes that last step
     * on its own rather than waiting for the drag to be walked onto the door.
     */
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

    /**
     * The tractor sets off for the door. The pace it has right now is where the
     * run in starts from, read before it is marked as diving - from then on it
     * is the run itself that sets the pace.
     */
    beginEntry(convoy) {
        convoy.entryStart = Math.max(this.leadSpeed(convoy), this.cellSize * PULL_FLOOR);
        convoy.entered = 0;
        convoy.diving = true;
    }

    /** The pace of the run in, for how far along it the convoy has got. */
    entrySpeed(convoy) {
        const wind = Phaser.Math.Clamp(convoy.entered / (PULL_WIND * this.cellSize), 0, 1);
        const eased = wind * wind * (3 - 2 * wind);

        return convoy.entryStart + (this.cellSize * PULL_SPEED - convoy.entryStart) * eased;
    }

    /** Tractor is through the door. Reel the rest of the convoy in after it. */
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

        // Carts seen through the mouth so far, for the garage to gulp at each.
        convoy.gulped = 0;

        if (this.drag && this.drag.convoy === convoy) {
            this.drag = null;
            this.dragPoint = null;
        }
    }

    /**
     * The cell centres the tractor is about to drive through, nearest first.
     * Handed to the rig so a corner is in the path being rounded before the
     * convoy reaches it, rather than appearing behind it once it is past.
     *
     * Empty once a convoy is on its way into a garage: from there it is being
     * pulled in rather than driven, and has nowhere further to be routed.
     */
    roadAhead(convoy) {
        const out = this.aheadBuffer || (this.aheadBuffer = []);

        out.length = 0;

        if (convoy.escaped) return out;

        // Being reeled in: the road carries straight on through the doorway and
        // into the building, far enough back for the whole convoy to follow the
        // tractor inside. Without it the track would stop at the garage and the
        // vehicles would pile up on its step instead of driving in.
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

    /**
     * Redraw the two doorway shapes.
     *
     * One cuts each garage's opening out of the buildings drawn over the
     * convoys, so a vehicle at the doorway is seen through it rather than
     * behind it - that is the whole of what makes it read as going inside. The
     * other hides a vehicle once it is past the back wall of the room, where
     * the art has no more depth to show it in.
     */
    updateDoors() {
        const mouths = this.mouthShape;

        if (!mouths) return;

        const at = this.getWorldTransformMatrix(this.doorMatrix, this.doorParent)
            .decomposeMatrix();

        this.placeShape(mouths, at);

        for (let i = 0; i < this.convoys.length; i++) {
            const convoy = this.convoys[i];
            const garage = convoy.garage;

            if (!garage) continue;

            const spot = this.cellToPixel(convoy.exit[0], convoy.exit[1]);

            // Out through the doorway, and across it.
            const outX = Math.cos(garage.facing);
            const outY = Math.sin(garage.facing);

            // The opening is always cut out, so an empty garage still shows the
            // room behind it and looks no different from before.
            this.fillSlab(
                mouths, spot, outX, outY,
                garage.doorMouth, garage.doorBack, garage.doorHalf
            );

            // The cut past the back wall is only on a convoy actually going in,
            // so it can never take a bite out of one driving past.
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

    /** Stand a mask shape on the board, whatever the board's own transform is. */
    placeShape(g, at) {
        g.clear();
        g.setPosition(at.translateX, at.translateY);
        g.setScale(at.scaleX, at.scaleY);
        g.setRotation(at.rotation);
        g.fillStyle(0xffffff, 1);
    }

    /**
     * A rectangle lying square to the way a garage looks, running from `near` to
     * `far` out along it and `half` wide either side.
     */
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

    /**
     * The garage gulps as each cart reaches its mouth. Cart `i` stands `i`
     * cells back from the tractor, which is at the garage's cell once the
     * swallow starts, so it is at the mouth when that much less than `i` cells
     * of the convoy has been taken.
     */
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

        // The last cart is in: the garage bounces on it and throws a burst of
        // the convoy's colour out of the doorway.
        if (convoy.garage) {
            convoy.garage.cheer();
            this.burstFrom(convoy.garage, CONVOY_SPLASH[convoy.key] || "#ffffff");
        }

        // The last one out is the level won.
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

    /**
     * Run into an obstacle: nose on into it, take the knock back, then roll forward to
     * rest. Tweened as a distance along the track rather than onto the art,
     * which the next frame's draw would paint over.
     */
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

    /**
     * One leg of the knock, as a distance in cells along the track the convoy is
     * standing on. Negative runs it forward, on into the obstacle; positive runs it
     * back down the way it came up.
     */
    bumpStep(convoy, to, duration, ease, then) {
        convoy.bumpTween = this.scene.tweens.add({
            targets: convoy,
            recoil: this.cellSize * to,
            duration: duration,
            ease: ease,
            onComplete: then
        });
    }


    // ---- effects --------------------------------------------------------

    /** A white disc, drawn once, for the burst blobs to be tinted from. */
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

    /**
     * Throw a spray of blobs out through a garage's doorway, the way it looks.
     * Seen from above there is no up for them to fall back from, so they fly
     * out, slow, shrink and fade instead.
     */
    burstFrom(garage, color) {
        const key = this.sparkTexture();

        if (!key) return;

        const tint = Phaser.Display.Color.HexStringToColor(color).color;
        const outX = Math.cos(garage.facing);
        const outY = Math.sin(garage.facing);
        const x = garage.x + outX * garage.doorMouth * 0.5;
        const y = garage.y + outY * garage.doorMouth * 0.5;

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

    /**
     * Throw away every live blob at once. They only ever go one at a time as
     * they run out, so anything still in flight when the board goes has to be
     * dropped by hand.
     */
    clearEffects() {
        for (let i = 0; i < this.effects.length; i++) this.effects[i].blob.destroy();

        this.effects.length = 0;
    }


    // ---- view -----------------------------------------------------------

    /**
     * Where this convoy's doorway stands, for the rig to draw its vehicles
     * smaller the further into it they have got. Nothing while it is out on the
     * board, so only a convoy actually going in is ever drawn any smaller.
     */
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

    /**
     * Standing still with nothing to do: not under the finger, not walking a
     * step through or back out of one, not being taken in by its garage. A
     * parked convoy is drawn square on its cells, one vehicle to each, rather
     * than left leaning through whatever corner it stopped on.
     */
    isParked(convoy) {
        if (this.drag && this.drag.convoy === convoy) return false;

        return !convoy.queue.length && !convoy.settle && !convoy.diving &&
            !convoy.swallowing && !convoy.escaped;
    }

    updateConvoyView(convoy, delta) {
        convoy.drawnRecoil = convoy.recoil;

        // A vehicle has been moved, so the layer is out of order until it is
        // sorted again. Raised here because this is the one place a vehicle is
        // ever moved, and read once at the end of the frame - a convoy being
        // redrawn twice in a frame is still only worth the one sort.
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


    // ---- input ----------------------------------------------------------

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

    /** The pointer in the board's own space, whatever the screen is doing. */
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

    /**
     * Which convoy the finger has taken hold of, and by which end. The tractor
     * or the last cart within reach wins, nearest first, so a touch on either
     * end drives the convoy from that end. A touch on a cart in between takes
     * whichever end it is nearer to - and, on a cart exactly halfway, the front.
     */
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

                // Nearer the end being driven now than the other one.
                const front = k * 2 < convoy.cells.length;

                return { convoy: convoy, end: (front === convoy.leadIsHead) ? "head" : "tail" };
            }
        }

        return null;
    }

    canGrab(convoy) {
        return !convoy.escaped && !convoy.swallowing && !this.enteringGarage(convoy);
    }

    /**
     * Let go. A step more than half taken is carried through to the next cell,
     * anything less is backed out of, so the convoy always comes to rest lined
     * up on the grid.
     */
    settleConvoy(convoy) {
        if (convoy.escaped || convoy.swallowing) return;

        convoy.routeStamp = "";

        // Already through the door - it finishes the run itself.
        if (this.enteringGarage(convoy)) {
            convoy.hitObstacle = false;
            return;
        }

        convoy.settling = true;

        // The knock has already been given, back when it ran into the thing.
        // Cleared so driving at it again is a fresh hit.
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

    /** Come to rest: the trail is relaid over the cells, corners and all. */
    settleTrail(convoy) {
        convoy.settling = false;

        this.rebuildTrail(convoy);
        this.updateConvoyView(convoy, 0);
    }

    /** Grabbed again part way through settling - drop the walk back and carry on. */
    finishSettle(convoy) {
        if (convoy.settle) {
            convoy.trail.points[0].x = convoy.settle.x;
            convoy.trail.points[0].y = convoy.settle.y;
            convoy.settle = null;
        }

        convoy.settling = false;
    }


    // ---- frame ----------------------------------------------------------

    update(time, delta) {
        const step = Math.min(delta || 16, 50);

        if (this.running) {
            this.timeLeft -= step / 1000;

            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.finish(false);
            }
        }

        // The finger can be held still over a cell the convoy could not reach
        // when the route was last worked out. Once it has moved out of the way
        // of itself, ask again.
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

    // ---- the run --------------------------------------------------------

    /** Hands the level over to the player and starts its clock. */
    start() {
        this.finished = false;
        this.running = true;

        this.attachInput();
    }

    /** Puts the level down, whichever way it went, and tells the scene. */
    finish(won) {
        if (this.finished) return;

        this.finished = true;
        this.running = false;

        this.detachInput();
        this.dropDrag();

        this.scene.showEndCard(won);
    }

    /** More seconds, and the level picked back up where it was left. */
    addTime(seconds) {
        this.timeLeft += seconds;
        this.finished = false;
        this.running = true;

        this.attachInput();
    }

    /** Lets go of whatever the finger was on, so it is not still held next frame. */
    dropDrag() {
        if (this.drag) this.settleConvoy(this.drag.convoy);

        this.drag = null;
        this.dragPoint = null;
    }

    /**
     * Tears the level down and lays it out again - for a retry, and for the
     * next level, which is the same board until there is more than one.
     */
    reset() {
        this.detachInput();

        for (let i = 0; i < this.convoys.length; i++) this.scene.tweens.killTweensOf(this.convoys[i].rig);

        // The mask shapes are kept out of the display list, so removing the
        // container's children would leave them behind.
        for (let i = 0; i < this.convoys.length; i++) this.convoys[i].rig.destroy();
        for (let i = 0; i < this.garages.length; i++) this.garages[i].destroy();
        this.mouthShape.destroy();
        this.clearEffects();

        this.removeAll(true);
        this.board = null;
        this.searchGraph = null;

        this.init();
    }

    /**
     * Stand the board in the middle of the screen, pulled in to whichever way
     * the screen runs out first. It keeps its own proportions either way, so a
     * tall level stays tall and its cells stay square - a landscape screen just
     * gets less of it.
     */
    adjust() {
        this.x = dimensions.gameWidth / 2;
        this.y = dimensions.gameHeight / 2;

        const room = Math.min(
            dimensions.gameWidth / this.boardWidth,
            (dimensions.gameHeight * BOARD_SCREEN) / this.boardHeight
        );

        this.setScale(Math.min(1, room));
    }

    destroy(fromScene) {
        this.detachInput();

        for (let i = 0; i < this.convoys.length; i++) this.convoys[i].rig.destroy();
        for (let i = 0; i < this.garages.length; i++) this.garages[i].destroy();
        this.mouthShape.destroy();
        this.clearEffects();

        super.destroy(fromScene);
    }
}