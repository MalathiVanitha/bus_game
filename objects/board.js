import { bakeShape, bakeResolution, dropBaked } from '../utils/bake.js';

const RIM = 0xffffff;
const WELL = 0x7e8799;

const TILE_FACE = 0x9ca4b5;
const TILE_LIGHT = 0xafb7c6;
const TILE_SHADE = 0x8b93a5;

// Every shadow on the board, still or moving, is cast the same way.
export const SHADOW = 0x000000;

const ART_CELL = 55;

const RIM_PAD = 16 / ART_CELL;
const RIM_CORNER = 26 / ART_CELL;
const WELL_PAD = 3 / ART_CELL;
const WELL_CORNER = 16 / ART_CELL;
// How round the board's outline is where it turns in, round a cut in it.
const FILLET = 10 / ART_CELL;
// The rim curves down into the well like the lip of a bowl: white on top,
// shading to this where it meets the well, over the inner part of its width.
const RIM_DIP = 0xc3cbd9;
const RIM_DIP_FROM = 9 / ART_CELL;
const RIM_DIP_STEPS = 6;
// The floor sits down in the rim: shadow on the tiles along every edge of
// it, darkest at the edge and gone this far in.
const SINK = 0x1b2740;
const SINK_ALPHA = 0.055;
const SINK_DEPTH = 14 / ART_CELL;
const SINK_STEPS = 7;
// The board stands a little off the background, shadow below it.
const BOARD_SHADOW_ALPHA = 0.16;
const BOARD_SHADOW_DROP = 5 / ART_CELL;
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

// Obstacles drawn smaller than the cell, by kind; the rest fill it.
const OBSTACLE_SIZE = {
    barrier: 0.85
};

export const SHADOW_ALPHA = 0.42;
export const SHADOW_X = 0.07;
export const SHADOW_Y = 0.1;

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
const SHADOW_KEY = 'board-shadow';

// The outline of a box with its corners rounded each by its own radius (0 for
// square), clockwise from the top left.
const ROUND_STEPS = 6;

function roundedBox(x0, y0, x1, y1, tl, tr, br, bl) {
    const points = [];
    const corner = (cx, cy, r, from) => {
        if (r <= 0) {
            points.push({ x: cx, y: cy });
            return;
        }

        // The corner's own point, pulled in by r both ways, is the arc's middle.
        const mx = cx + (cx === x0 ? r : -r);
        const my = cy + (cy === y0 ? r : -r);

        for (let i = 0; i <= ROUND_STEPS; i++) {
            const a = from + (i / ROUND_STEPS) * Math.PI / 2;

            points.push({ x: mx + Math.cos(a) * r, y: my + Math.sin(a) * r });
        }
    };

    corner(x0, y0, tl, Math.PI);
    corner(x1, y0, tr, Math.PI * 1.5);
    corner(x1, y1, br, 0);
    corner(x0, y1, bl, Math.PI / 2);

    return points;
}

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
        this.wallBlocks = [];

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
        this.wallBlocks.length = 0;
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
        dropBaked(this.scene, SHADOW_KEY);

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

        const fillet = FILLET * this.cell;

        // Solid, then faded as a whole, so the cells' overlapping shapes
        // don't darken where they meet.
        const shadow = bakeShape(this.scene, bounds, (g) => {
            g.fillStyle(SHADOW, 1);
            this.drawOutline(g, rimPad, RIM_CORNER * this.cell, fillet);
        }, SHADOW_KEY, res);

        shadow.y = BOARD_SHADOW_DROP * this.cell;
        shadow.setAlpha(BOARD_SHADOW_ALPHA);
        this.tileLayer.add(shadow);

        this.tileLayer.add(bakeShape(this.scene, bounds, (g) => {
            // The rim and the well follow the board's own outline, round
            // any cells cut out of it, rounded where it turns outward.
            g.fillStyle(RIM, 1);
            this.drawOutline(g, rimPad, RIM_CORNER * this.cell, fillet);

            // Each band a little narrower and greyer, down to the well.
            const dipFrom = RIM_DIP_FROM * this.cell;
            const white = Phaser.Display.Color.ValueToColor(RIM);
            const grey = Phaser.Display.Color.ValueToColor(RIM_DIP);

            for (let i = 1; i <= RIM_DIP_STEPS; i++) {
                const t = i / RIM_DIP_STEPS;
                const pad = dipFrom + (wellPad - dipFrom) * t;
                const tint = Phaser.Display.Color.Interpolate.ColorWithColor(white, grey, 1, t * t);
                const corner = RIM_CORNER * this.cell + (WELL_CORNER - RIM_CORNER) * this.cell * (rimPad - pad) / (rimPad - wellPad);

                g.fillStyle(Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b), 1);
                this.drawOutline(g, pad, corner, fillet + rimPad - pad);
            }

            g.fillStyle(WELL, 1);
            this.drawOutline(g, wellPad, WELL_CORNER * this.cell, fillet + rimPad - wellPad);

            this.drawTiles(g);
            this.drawSink(g, wellPad);
        }, FLOOR_KEY, res));
    }

    // Along each side of a floor cell with no floor past it, bands from the
    // well's edge in, each a little deeper: stacked, they shade off inward.
    drawSink(g, wellPad) {
        const depth = SINK_DEPTH * this.cell;
        const halfW = this.tileWidth / 2;
        const halfH = this.tileHeight / 2;

        g.fillStyle(SINK, SINK_ALPHA);

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (!this.isFloor(col, row)) continue;

                const { x, y } = this.cellToPixel(col, row);
                const up = !this.isFloor(col, row - 1);
                const down = !this.isFloor(col, row + 1);
                const left = !this.isFloor(col - 1, row);
                const right = !this.isFloor(col + 1, row);

                // A side's band reaches into the well only where the well is.
                const x0 = x - halfW - (left ? wellPad : 0);
                const x1 = x + halfW + (right ? wellPad : 0);
                const y0 = y - halfH - (up ? wellPad : 0);
                const y1 = y + halfH + (down ? wellPad : 0);

                for (let i = 1; i <= SINK_STEPS; i++) {
                    const d = wellPad + depth * i / SINK_STEPS;

                    if (up) g.fillRect(x0, y - halfH - wellPad, x1 - x0, d);
                    if (down) g.fillRect(x0, y + halfH + wellPad - d, x1 - x0, d);
                    if (left) g.fillRect(x - halfW - wellPad, y0, d, y1 - y0);
                    if (right) g.fillRect(x + halfW + wellPad - d, y0, d, y1 - y0);
                }
            }
        }
    }

    // Every floor cell, grown by pad on all sides: together they make the
    // board's shape, an even pad wider than its tiles. A corner is rounded
    // only where the outline turns outward there (nothing beside it either
    // way), so cells meet square; where it turns inward, round a cut, the
    // corner is filled in to a curve of radius fillet.
    drawOutline(g, pad, corner, fillet) {
        const halfW = this.tileWidth / 2 + pad;
        const halfH = this.tileHeight / 2 + pad;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (!this.isFloor(col, row)) continue;

                const spot = this.cellToPixel(col, row);
                const up = this.isFloor(col, row - 1);
                const down = this.isFloor(col, row + 1);
                const left = this.isFloor(col - 1, row);
                const right = this.isFloor(col + 1, row);

                g.fillPoints(roundedBox(
                    spot.x - halfW, spot.y - halfH, spot.x + halfW, spot.y + halfH,
                    !up && !left ? corner : 0,
                    !up && !right ? corner : 0,
                    !down && !right ? corner : 0,
                    !down && !left ? corner : 0
                ), true);
            }
        }

        // The cut cells' corners with floor on both sides of them.
        const sides = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (this.isFloor(col, row)) continue;

                const spot = this.cellToPixel(col, row);

                for (let i = 0; i < sides.length; i++) {
                    const [sx, sy] = sides[i];

                    if (!this.isFloor(col + sx, row) || !this.isFloor(col, row + sy)) continue;

                    // Where the two cells' pads meet, in the cut cell.
                    const qx = spot.x + sx * (this.tileWidth / 2 - pad);
                    const qy = spot.y + sy * (this.tileHeight / 2 - pad);
                    // The curve's middle, in from there both ways.
                    const cx = qx - sx * fillet;
                    const cy = qy - sy * fillet;
                    const from = Math.atan2(qy - cy, 0);
                    let to = Math.atan2(0, qx - cx);

                    // The quarter turn between them, not the long way round.
                    if (to - from > Math.PI) to -= Math.PI * 2;
                    if (from - to > Math.PI) to += Math.PI * 2;
                    const points = [{ x: qx, y: qy }];

                    for (let k = 0; k <= ROUND_STEPS; k++) {
                        const a = from + (to - from) * (k / ROUND_STEPS);

                        points.push({ x: cx + Math.cos(a) * fillet, y: cy + Math.sin(a) * fillet });
                    }

                    g.fillPoints(points, true);
                }
            }
        }
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

        // Their shadows share a layer with the obstacles', so they are kept
        // apart to be cleared on their own.
        for (let i = 0; i < this.wallBlocks.length; i++) this.wallBlocks[i].shadow.destroy();

        this.wallBlocks.length = 0;

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

                this.wallBlocks.push({ col: col, row: row, block: block, shadow: shadow });
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
            const size = scale * (OBSTACLE_SIZE[spot[2]] || 1);

            piece.setScale(size);
            piece.depth = at.y;
            this.props.add(piece);
            this.pieces.push(piece);

            const shadow = this.scene.add.sprite(x + SHADOW_X * this.cell - 2, y + SHADOW_Y * this.cell - 2, 'sheet', frame);
            shadow.setScale(size * 1.15);
            shadow.setTintFill(SHADOW);
            shadow.setAlpha(SHADOW_ALPHA);
            this.shadowLayer.add(shadow);

            piece.shadow = shadow;
        }
    }

    /**
     * Takes whatever stands on a cell off the board: an obstacle, or one block
     * of a wall (the wall either side of it is laid again, ends where it was
     * joined). Hands back its art and shadow, still where they stood but no
     * longer the board's, for the caller to carry off and destroy; null if
     * there was nothing there.
     */
    takeOff(col, row) {
        for (let i = 0; i < this.obstacles.length; i++) {
            if (this.obstacles[i][0] !== col || this.obstacles[i][1] !== row) continue;

            const piece = this.pieces[i];

            this.obstacles.splice(i, 1);
            this.pieces.splice(i, 1);
            this.props.remove(piece);
            this.shadowLayer.remove(piece.shadow);

            return { art: piece, shadow: piece.shadow };
        }

        for (let i = 0; i < this.walls.length; i++) {
            const cells = this.walls[i].cells;
            const at = cells.findIndex((c) => c[0] === col && c[1] === row);

            if (at < 0) continue;

            const spot = this.wallBlocks.find((b) => b.col === col && b.row === row);

            cells.splice(at, 1);

            if (!spot) {
                this.placeWalls();
                return null;
            }

            // Out of their layers before the rest are laid again, which clears them.
            this.wallLayer.remove(spot.block);
            this.shadowLayer.remove(spot.shadow);
            this.wallBlocks.splice(this.wallBlocks.indexOf(spot), 1);

            this.placeWalls();

            return { art: spot.block, shadow: spot.shadow };
        }

        return null;
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