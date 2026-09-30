import { bakeShape, bakeResolution, dropBaked } from '../utils/bake.js';

const RIM = 0xffffff;
const WELL = 0x7e8799;

const TILE_FACE = 0x9ca4b5;
const TILE_LIGHT = 0xafb7c6;
const TILE_SHADE = 0x8b93a5;

const SHADOW = 0x000000;

const ART_CELL = 55;

const RIM_PAD = 16 / ART_CELL;
const RIM_CORNER = 26 / ART_CELL;
const WELL_PAD = 3 / ART_CELL;
const WELL_CORNER = 16 / ART_CELL;
const TILE_GAP = 1.5 / ART_CELL;
const TILE_CORNER = 5 / ART_CELL;
const TILE_BEVEL = 1.5 / ART_CELL;

const LIFT = 0xffffff;

const LIFT_ALPHA = 0.38;

const LIFT_INSET = 1.25 / ART_CELL;

const LIFT_RISE = 120;
const LIFT_HOLD = 70;
const LIFT_FALL = 320;

const LIFT_FROM = 0.8;
const LIFT_OVER = 0.06;

const OBSTACLE_ART = 200;
const OBSTACLE_FIT = 1;

const DEFAULT_OBSTACLE = 'cone';

const OBSTACLE_OFFSET = {
    cone: { x: 0, y: 0 },
    planter: { x: 0, y: 0 },
    cargo_pallet: { x: 0, y: 0 },
    barrier: { x: 0, y: 0 },
    cargo_container: { x: 0, y: 0 },
    service_cabinet: { x: 0, y: 0 }
};

const OBSTACLE_OFFSET_DEFAULT = { x: 0, y: 0 };

const SHADOW_ALPHA = 0.42;
const SHADOW_X = 0.07;
const SHADOW_Y = 0.1;

const WALL_SHEET = 'walls';
const WALL_ART = 384;
// The walls sheet is packed at this fraction of the art's size (walls.tps):
// a wall is never drawn at more than about half its art size, even on the
// biggest canvas. WALL_ART and WALL_MARGIN stay in the art's own pixels.
const WALL_PACK = 0.5;

const WALL_MARGIN = 30;
const WALL_BLEED = 0.04;

const WALL_N = 1;
const WALL_E = 2;
const WALL_S = 4;
const WALL_W = 8;

const WALL_PIECES = {
    0: ['isolated', 0],
    [WALL_N]: ['end', 0],
    [WALL_E]: ['end', 1],
    [WALL_S]: ['end', 2],
    [WALL_W]: ['end', 3],
    [WALL_N | WALL_S]: ['straight', 0],
    [WALL_E | WALL_W]: ['straight', 1],
    [WALL_N | WALL_E]: ['corner', 0],
    [WALL_E | WALL_S]: ['corner', 1],
    [WALL_S | WALL_W]: ['corner', 2],
    [WALL_W | WALL_N]: ['corner', 3],
    [WALL_W | WALL_N | WALL_E]: ['tee', 0],
    [WALL_N | WALL_E | WALL_S]: ['tee', 1],
    [WALL_E | WALL_S | WALL_W]: ['tee', 2],
    [WALL_S | WALL_W | WALL_N]: ['tee', 3],
    [WALL_N | WALL_E | WALL_S | WALL_W]: ['cross', 0]
};

const DEFAULT_WALL = 'concrete-wall';

// The floor and the lift highlight are drawn once into these, not every frame.
const FLOOR_KEY = 'board-floor';
const LIFT_KEY = 'board-lift';

export class Board {
    constructor(scene, config) {
        this.scene = scene;
        this.pattern = config.pattern;
        this.rows = config.rows;
        this.columns = config.columns;
        this.tileWidth = config.tileWidth;
        this.tileHeight = config.tileHeight;
        this.startX = config.startX;
        this.startY = config.startY;
        this.cell = (this.tileWidth + this.tileHeight) / 2;
        this.obstacles = config.obstacles || [];
        this.walls = config.walls || [];

        this.tileLayer = scene.add.container();
        config.parent.add(this.tileLayer);

        this.shadowLayer = scene.add.container();
        config.parent.add(this.shadowLayer);

        this.wallLayer = scene.add.container();
        config.parent.add(this.wallLayer);

        this.liftLayer = scene.add.container();
        config.parent.add(this.liftLayer);
        this.lifts = [];

        this.props = config.props;
        this.pieces = [];

        const count = this.rows * this.columns;

        this.liftLevel = new Float32Array(count);
        this.liftRise = new Float32Array(count);
        this.liftHold = new Float32Array(count);
        this.liftDrawn = false;

        this.draw();
    }

    isFloor(col, row) {
        return col >= 0 && row >= 0 && col < this.columns && row < this.rows &&
            this.pattern[row][col] === 1;
    }

    cellToPixel(col, row) {
        return {
            x: this.startX + col * this.tileWidth,
            y: this.startY + row * this.tileHeight
        };
    }

    draw() {
        this.bakeFloor();

        this.shadowLayer.removeAll(true);
        this.placeWalls();
        this.placeObstacles();
    }

    // The rim, the well and every tile, as one image. Drawn again only if the
    // game is shown at a different resolution after a resize.
    bakeFloor() {
        const res = bakeResolution(this.scene);

        if (this.floorRes === res) return;

        this.floorRes = res;

        this.tileLayer.removeAll(true);
        this.liftLayer.removeAll(true);
        this.lifts.length = 0;
        this.liftDrawn = true;

        dropBaked(this.scene, FLOOR_KEY);
        dropBaked(this.scene, LIFT_KEY);

        const width = this.columns * this.tileWidth;
        const height = this.rows * this.tileHeight;
        const left = this.startX - this.tileWidth / 2;
        const top = this.startY - this.tileHeight / 2;

        const rimPad = RIM_PAD * this.cell;
        const wellPad = WELL_PAD * this.cell;

        const bounds = {
            left: left - rimPad,
            top: top - rimPad,
            width: width + rimPad * 2,
            height: height + rimPad * 2
        };

        this.tileLayer.add(bakeShape(this.scene, bounds, (g) => {
            g.fillStyle(RIM, 1);
            g.fillRoundedRect(
                left - rimPad, top - rimPad,
                width + rimPad * 2, height + rimPad * 2,
                RIM_CORNER * this.cell
            );

            g.fillStyle(WELL, 1);
            g.fillRoundedRect(
                left - wellPad, top - wellPad,
                width + wellPad * 2, height + wellPad * 2,
                WELL_CORNER * this.cell
            );

            this.drawTiles(g);
        }, FLOOR_KEY, res));
    }

    drawTiles(g) {
        const gap = TILE_GAP * this.cell;

        const corner = TILE_CORNER * this.cell;
        const bevel = TILE_BEVEL * this.cell;
        const w = this.tileWidth - gap;
        const h = this.tileHeight - gap;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (!this.isFloor(col, row)) continue;

                const spot = this.cellToPixel(col, row);
                const x = spot.x - w / 2;
                const y = spot.y - h / 2;

                g.fillStyle(TILE_SHADE, 1);
                g.fillRoundedRect(x, y, w, h, corner);

                g.fillStyle(TILE_LIGHT, 1);
                g.fillRoundedRect(x, y, w, h - bevel, corner);

                g.fillStyle(TILE_FACE, 1);
                g.fillRoundedRect(x, y + bevel, w, h - bevel * 2, corner);
            }
        }
    }

    // Picked up again on a resize, in case the floor was drawn at another size.
    refresh() {
        this.bakeFloor();
    }

    placeWalls() {
        const scale = (this.cell * (1 + WALL_BLEED)) / ((WALL_ART - WALL_MARGIN * 2) * WALL_PACK);

        this.wallLayer.removeAll(true);

        for (let i = 0; i < this.walls.length; i++) {
            const wall = this.walls[i];
            const style = wall.style || DEFAULT_WALL;
            const cells = new Set(wall.cells.map((c) => c[0] + ',' + c[1]));
            const has = (col, row) => cells.has(col + ',' + row);

            for (let j = 0; j < wall.cells.length; j++) {
                const col = wall.cells[j][0];
                const row = wall.cells[j][1];

                const joins =
                    (has(col, row - 1) ? WALL_N : 0) |
                    (has(col + 1, row) ? WALL_E : 0) |
                    (has(col, row + 1) ? WALL_S : 0) |
                    (has(col - 1, row) ? WALL_W : 0);

                const piece = WALL_PIECES[joins];
                const frame = style + '/' + piece[0];
                const turn = piece[1] * Math.PI / 2;
                const at = this.cellToPixel(col, row);

                const shadow = this.scene.add.sprite(
                    at.x + SHADOW_X * this.cell,
                    at.y + SHADOW_Y * this.cell,
                    WALL_SHEET,
                    frame
                );

                shadow.setScale(scale);
                shadow.setRotation(turn);
                shadow.setTintFill(SHADOW);
                shadow.setAlpha(SHADOW_ALPHA);
                this.shadowLayer.add(shadow);

                const block = this.scene.add.sprite(at.x, at.y, WALL_SHEET, frame);

                block.setScale(scale);
                block.setRotation(turn);
                this.wallLayer.add(block);
            }
        }
    }

    placeObstacles() {
        const scale = (this.cell * OBSTACLE_FIT) / OBSTACLE_ART;

        for (let i = 0; i < this.pieces.length; i++) this.pieces[i].destroy();

        this.pieces.length = 0;

        for (let i = 0; i < this.obstacles.length; i++) {
            const spot = this.obstacles[i];
            const at = this.cellToPixel(spot[0], spot[1]);
            const frame = this.obstacleFrame(spot[2]);
            const nudge = this.obstacleOffset(spot[2], spot[3]);

            const x = at.x + nudge.x * this.cell;
            const y = at.y + nudge.y * this.cell;

            const piece = this.scene.add.sprite(x, y, 'sheet', frame);

            piece.setScale(scale);
            piece.depth = at.y;
            this.props.add(piece);
            this.pieces.push(piece);

            const shadow = this.scene.add.sprite(x + SHADOW_X * this.cell - 2, y + SHADOW_Y * this.cell - 2, 'sheet', frame);
            shadow.setScale(scale * 1.15);
            shadow.setTintFill(SHADOW);
            shadow.setAlpha(SHADOW_ALPHA);
            this.shadowLayer.add(shadow);
        }
    }

    obstacleOffset(name, own) {
        const kind = OBSTACLE_OFFSET[name] || OBSTACLE_OFFSET_DEFAULT;

        return {
            x: kind.x + ((own && own.x) || 0),
            y: kind.y + ((own && own.y) || 0)
        };
    }

    obstacleFrame(name) {
        const frame = 'obstacles/obstacle-' + String(name || DEFAULT_OBSTACLE).replace(/_/g, '-');

        if (this.scene.textures.getFrame('sheet', frame)) return frame;

        return 'obstacles/obstacle-' + DEFAULT_OBSTACLE;
    }

    pulseCell(col, row) {
        if (!this.isFloor(col, row)) return;

        const i = row * this.columns + col;

        if (this.liftLevel[i] <= 0) this.liftRise[i] = 0;

        this.liftLevel[i] = 1;
        this.liftHold[i] = LIFT_HOLD;
    }

    step(delta) {
        const level = this.liftLevel;
        const rise = this.liftRise;
        const hold = this.liftHold;

        let live = false;

        for (let i = 0; i < level.length; i++) {
            if (level[i] <= 0) continue;

            if (hold[i] > 0) hold[i] -= delta;
            else level[i] = Math.max(0, level[i] - delta / LIFT_FALL);

            if (level[i] <= 0) continue;

            if (rise[i] < 1) rise[i] = Math.min(1, rise[i] + delta / LIFT_RISE);

            live = true;
        }

        if (!live && !this.liftDrawn) return;

        this.drawLifts();
        this.liftDrawn = live;
    }

    // A lift is the same rounded square at every size (its corner grows with
    // it), so each cell shows one baked square, scaled and faded.
    liftFor(i, col, row) {
        if (this.lifts[i]) return this.lifts[i];

        const gap = TILE_GAP * this.cell;
        const inset = gap / 2 + LIFT_INSET * this.cell;
        const w = this.tileWidth - inset * 2;
        const h = this.tileHeight - inset * 2;
        const bounds = { left: -w / 2, top: -h / 2, width: w, height: h };

        const lift = bakeShape(this.scene, bounds, (g) => {
            g.fillStyle(LIFT, 1);
            g.fillRoundedRect(-w / 2, -h / 2, w, h, TILE_CORNER * this.cell);
        }, LIFT_KEY, this.floorRes);

        const spot = this.cellToPixel(col, row);

        lift.setPosition(spot.x, spot.y);
        this.liftLayer.add(lift);
        this.lifts[i] = lift;

        return lift;
    }

    drawLifts() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                const i = row * this.columns + col;
                const level = this.liftLevel[i];

                if (level <= 0) {
                    if (this.lifts[i]) this.lifts[i].visible = false;
                    continue;
                }

                const lift = this.liftFor(i, col, row);

                lift.visible = true;
                lift.alpha = level * LIFT_ALPHA;
                lift.setScale(lift.restScale * this.liftScale(this.liftRise[i]));
            }
        }
    }

    liftScale(t) {
        const ease = 1 - Math.pow(1 - t, 3);

        return LIFT_FROM + (1 - LIFT_FROM) * ease + Math.sin(Math.PI * t) * LIFT_OVER;
    }
}