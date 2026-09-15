import { astar, Graph } from '../utils/astar.js';
import { Trail } from './trail.js';
import { Board } from './board.js';
import { Convoy } from './convoy.js';
import { Garage } from './garage.js';
import levelData from '../data/level-data.js';

const BOARD_SIZE = 440;

// Pace the tractor keeps when it is under the finger, and the pace it winds up
// to as the finger pulls ahead of it. Both in cells per second.
const DRAG_SPEED = 3.5;
const CHASE_SPEED = 8;
const SETTLE_SPEED = 5.5;

// The finger has to get this far ahead before the chase starts winding up, and
// this much further again before it is running flat out.
const CHASE_SLACK = 0.5;
const CHASE_SPAN = 4;

// How close a touch has to land to a vehicle to take hold of the convoy.
const GRAB_REACH = 0.75;

// The nudge a convoy gives when it runs up against a cone. Only a cone: a board
// edge, a wall, or another convoy all stop it just as dead, but none of them are
// something it has hit, so none of them are worth a knock.
const BUMP = 0.12;

// Trail kept behind the last cart, in cells. It has to cover what the rig reads
// past the end of the convoy plus the furthest a bump shunts it back.
const TRAIL_TAIL = 1.5;

// The last step into a garage is taken faster than a driven one - the convoy
// commits to the door. The reel-in after it is slower than driving, so the
// vehicles are seen to file in one at a time rather than all vanishing at once.
const DOOR_SPEED = 10;
const PULL_SPEED = 5;

// Cells of the routed road handed to the rig so it can curve the corner the
// tractor is coming up to, not just the ones it has already been round.
const LOOK_AHEAD_CELLS = 2;

// Past the back wall of a garage's doorway, a vehicle is cut away: it has gone
// as far into the room as the art has room for it.
//
// The slab that does it is wider than a vehicle - wider than the opening, which
// is narrower than the vehicles that go through it - and runs well past the back
// of the building, so the back wall is the only edge of it a vehicle is ever cut
// against. It is only drawn for a convoy actually on its way in, so it can never
// take a bite out of one driving past.
const DOOR_HALF = 0.75;
const DOOR_DEPTH = 12;

/**
 * The board and the convoys on it.
 *
 * A convoy is held as a run of cells, tractor first, plus a trail of pixel
 * points running back from the tractor. Dragging routes the tractor cell by
 * cell towards the finger and the trail records where it went; the vehicles are
 * then read back off that trail by arc length, so each one drives over the
 * ground the one ahead of it covered and turns where it turned.
 */
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
        this.cones = levelData.cones || [];

        this.tileWidth = BOARD_SIZE / this.columns;
        this.tileHeight = BOARD_SIZE / this.rows;
        this.cellSize = (this.tileWidth + this.tileHeight) / 2;

        this.startX = -BOARD_SIZE / 2 + this.tileWidth / 2;
        this.startY = -BOARD_SIZE / 2 + this.tileHeight / 2;

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
                    cone: false
                };
            }
        }

        for (let i = 0; i < this.cones.length; i++) {
            const col = this.cones[i][0];
            const row = this.cones[i][1];

            if (!this.onBoard(col, row)) continue;

            // Blocked like a gap in the board, but kept apart from one: a cone
            // is a thing standing on the tarmac, and hitting it is worth a knock
            // where driving into the edge of the world is not.
            this.tiles[row][col].blocked = true;
            this.tiles[row][col].cone = true;
        }

        this.board = new Board(this.scene, {
            parent: this,
            pattern: this.pattern,
            cones: this.cones,
            rows: this.rows,
            columns: this.columns,
            tileWidth: this.tileWidth,
            tileHeight: this.tileHeight,
            startX: this.startX,
            startY: this.startY
        });

        // The rooms the vehicles drive into, under the convoys; the buildings
        // themselves go over them, further down.
        this.garageBackGroup = this.scene.add.container();
        this.add(this.garageBackGroup);

        this.convoyGroup = this.scene.add.container();
        this.add(this.convoyGroup);

        // Cut the doorways out of the convoys, so a vehicle driving into a
        // garage goes out of sight inside it. The shape is held in world space,
        // which is why it is redrawn through the board's own transform.
        this.doorShape = this.scene.make.graphics({ add: false });
        this.doorMatrix = new Phaser.GameObjects.Components.TransformMatrix();
        this.doorParent = new Phaser.GameObjects.Components.TransformMatrix();

        const doors = this.doorShape.createGeometryMask();

        doors.invertAlpha = true;
        this.convoyGroup.setMask(doors);

        // Above the convoys, so a vehicle at a garage is behind the building
        // everywhere but the doorway, which is cut out of this layer.
        this.garageGroup = this.scene.add.container();
        this.add(this.garageGroup);

        this.mouthShape = this.scene.make.graphics({ add: false });

        const mouths = this.mouthShape.createGeometryMask();

        mouths.invertAlpha = true;
        this.garageGroup.setMask(mouths);

        this.drag = null;
        this.dragPoint = null;
        this.convoys = [];
        this.garages = [];

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

    isCone(col, row) {
        return this.onBoard(col, row) && this.tiles[row][col].cone;
    }

    canEnter(convoy, col, row) {
        if (!this.isFloor(col, row)) return false;

        const garage = this.garageAt(col, row);

        if (garage && garage.convoyIndex !== convoy.index) return false;

        return this.tiles[row][col].owner === -1;
    }

    garageAt(col, row) {
        for (let i = 0; i < this.garages.length; i++) {
            const garage = this.garages[i];

            if (garage.col === col && garage.row === row) return garage;
        }

        return null;
    }

    /**
     * Which way a garage's doorway looks: out towards the cell a convoy reaches
     * it from. A garage set into an edge has only the one way in, which is the
     * whole of it; where there is more than one, or none, the doorway is turned
     * towards the middle of the board, which is the way the board opens out.
     */
    wayIn(col, row) {
        const ways = [[1, 0], [-1, 0], [0, 1], [0, -1]];
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
                facing: this.wayIn(convoy.exit[0], convoy.exit[1]),
                behind: this.garageBackGroup,
                parent: this.garageGroup
            });

            this.garages.push(convoy.garage);
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
            garage: null,
            cells: cells,
            count: cells.length,

            // Cells the tractor still has to drive through, nearest first.
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
            hitCone: false,

            // Set the moment the tractor sets off for its own garage: from then
            // on the dive is paid for and the drag cannot steer it back out.
            diving: false,
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
            parent: this.convoyGroup
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

    /** Work out the cells the tractor should drive to reach the finger. */
    routeDrag(point) {
        const convoy = this.drag && this.drag.convoy;

        if (!convoy || convoy.escaped || convoy.swallowing) return;

        this.dragPoint = { x: point.x, y: point.y };

        // Once the tractor has set off for its own garage the rest of the drag
        // is ignored rather than steering it back out.
        if (this.enteringGarage(convoy)) {
            convoy.hitCone = false;
            return;
        }

        const goal = this.pixelToCell(point.x, point.y);

        if (!this.isFloor(goal.col, goal.row)) {
            this.noteConeHit(convoy, point);
            return;
        }

        const reserved = (convoy.stepReserved && convoy.queue.length) ? convoy.queue[0] : null;
        const lead = this.leadCell(convoy);

        const stamp = this.boardStamp + "|" + goal.col + "," + goal.row +
            "|" + lead.col + "," + lead.row + "|" + (reserved ? 1 : 0);

        if (convoy.routeStamp === stamp) {
            this.noteConeHit(convoy, point);
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

        this.noteConeHit(convoy, point);
    }

    /**
     * The convoy has run up against something on its way to the finger. Note it
     * only where that something is a cone, since that is the one case worth a
     * knock - a wall, the edge of the board or another convoy stop it just as
     * dead, and it simply comes to rest against them.
     */
    noteConeHit(convoy, point) {
        const lead = this.leadCell(convoy);
        const at = this.cellToPixel(lead.col, lead.row);

        const stuck = !convoy.queue.length && !convoy.settle &&
            Math.hypot(point.x - at.x, point.y - at.y) > this.cellSize * 0.6;

        const next = this.stepToward(lead, at, point);

        convoy.hitCone = stuck && this.isCone(next.col, next.row);
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
        if (this.enteringGarage(convoy)) return this.cellSize * DOOR_SPEED;

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
        let budget = this.leadSpeed(convoy) * (delta / 1000);
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

        return Math.abs(cell.col - convoy.exit[0]) + Math.abs(cell.row - convoy.exit[1]) === 1;
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

        convoy.diving = true;
        convoy.settle = null;
        convoy.queue.length = 0;
        convoy.queue.push({ col: convoy.exit[0], row: convoy.exit[1] });
    }

    commitToGarage(convoy) {
        convoy.diving = true;
        convoy.queue.length = 1;

        if (convoy.garage) convoy.garage.gape();
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
        const doors = this.doorShape;

        if (!mouths || !doors) return;

        const at = this.getWorldTransformMatrix(this.doorMatrix, this.doorParent)
            .decomposeMatrix();

        this.placeShape(mouths, at);
        this.placeShape(doors, at);

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

            if (convoy.escaped) continue;
            if (!convoy.swallowing && !this.enteringGarage(convoy)) continue;

            this.fillSlab(
                doors, spot, outX, outY,
                garage.doorBack, garage.doorBack - DOOR_DEPTH * this.cellSize,
                DOOR_HALF * this.cellSize
            );
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
        convoy.swallowed += this.cellSize * PULL_SPEED * (delta / 1000);

        if (convoy.swallowed >= convoy.bodyLength + this.cellSize) {
            convoy.swallowed = convoy.bodyLength + this.cellSize;
            this.onConvoyEscaped(convoy);
            return;
        }

        this.updateConvoyView(convoy, delta);
    }

    onConvoyEscaped(convoy) {
        if (convoy.escaped) return;

        convoy.escaped = true;
        convoy.swallowing = false;
        convoy.queue.length = 0;
        convoy.settle = null;
        convoy.settling = false;

        this.releaseCells(convoy);
        convoy.rig.setVisible(false);
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
     * Asked to drive somewhere it cannot reach, the convoy shunts back down its
     * own trail and rolls forward again. Tweened as a distance along the trail
     * rather than onto the art, which the next frame's draw would paint over.
     */
    bumpConvoy(convoy) {
        if (convoy.bumpTween) convoy.bumpTween.remove();

        convoy.bumpTween = this.scene.tweens.add({
            targets: convoy,
            recoil: this.cellSize * BUMP,
            duration: 70,
            ease: "Quad.easeOut",
            onComplete: () => {
                convoy.bumpTween = this.scene.tweens.add({
                    targets: convoy,
                    recoil: 0,
                    duration: 260,
                    ease: "Sine.easeOut",
                    onComplete: () => {
                        convoy.bumpTween = null;
                    }
                });
            }
        });
    }


    // ---- view -----------------------------------------------------------

    updateConvoyView(convoy, delta) {
        convoy.drawnRecoil = convoy.recoil;

        convoy.rig.draw(convoy.trail, {
            recoil: convoy.recoil,
            swallow: convoy.swallowed,
            ahead: this.roadAhead(convoy),
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
        const grabbed = this.pickConvoy(p.x, p.y);

        if (!grabbed) return;

        this.finishSettle(grabbed);

        this.drag = { convoy: grabbed };
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
     * A convoy is towed from its tractor, so a touch anywhere along it takes
     * hold of the same end. Nearest vehicle within reach wins.
     */
    pickConvoy(x, y) {
        const reach = this.cellSize * GRAB_REACH;

        let best = null;
        let bestDist = reach;

        for (let i = 0; i < this.convoys.length; i++) {
            const convoy = this.convoys[i];

            if (convoy.escaped || convoy.swallowing || this.enteringGarage(convoy)) continue;

            for (let k = 0; k < convoy.cells.length; k++) {
                const p = this.cellToPixel(convoy.cells[k].col, convoy.cells[k].row);
                const d = Math.hypot(p.x - x, p.y - y);

                if (d < bestDist) {
                    bestDist = d;
                    best = convoy;
                }
            }
        }

        return best;
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
            convoy.hitCone = false;
            return;
        }

        convoy.settling = true;

        if (convoy.hitCone) this.bumpConvoy(convoy);

        convoy.hitCone = false;

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

        this.board.step(step);
        this.updateDoors();
    }

    adjust() {
        this.x = dimensions.gameWidth / 2;
        this.y = dimensions.gameHeight / 2;

        this.setScale(dimensions.isLandscape ? 0.95 : 1);
    }

    destroy(fromScene) {
        this.detachInput();

        for (let i = 0; i < this.convoys.length; i++) this.convoys[i].rig.destroy();
        for (let i = 0; i < this.garages.length; i++) this.garages[i].destroy();

        super.destroy(fromScene);
    }
}
