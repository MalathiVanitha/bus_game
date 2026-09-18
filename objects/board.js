// Sampled off the storyboard: a white rounded tray and a near-black well cut
// into it. The tarmac tiles sitting in the well are art.
const RIM = 0xffffff;
const WELL = 0x2b2e37;

const TILE = 'board/tile_road';
const TILE_ART = 85;

const SHADOW = 0x000000;

// Everything below is a fraction of a cell, so the board holds its proportions
// whatever size the screen gives it.
const ART_CELL = 55;

const RIM_PAD = 16 / ART_CELL;
const RIM_CORNER = 26 / ART_CELL;
const WELL_PAD = 5 / ART_CELL;
const WELL_CORNER = 16 / ART_CELL;
const TILE_GAP = 3 / ART_CELL;
const TILE_CORNER = 9 / ART_CELL;

// A tile lights up as a convoy takes it and sinks back to nothing on its own
// clock - it does not wait for the vehicles to move off, so a convoy left parked
// on its track ends up sitting on plain tarmac again.
const LIFT = 0xffffff;

// Bright enough to read against the tarmac, short of the white of the rim.
const LIFT_ALPHA = 0.38;

// Kept inside the tile, on top of the seam the tiles are already drawn with, so
// that seam still reads between two lit neighbours.
const LIFT_INSET = 1.5 / ART_CELL;

// Up fast, a breath at full, then a long sink - so the convoy leaves a trail
// that reads as one thing rather than a row of separate tiles blinking out.
const LIFT_RISE = 120;
const LIFT_HOLD = 70;
const LIFT_FALL = 320;

// A lit tile opens out from this much of its size, with a touch of overshoot
// past full before it settles.
const LIFT_FROM = 0.8;
const LIFT_OVER = 0.06;

// Every piece of the obstacle art is drawn inside a box of this size, and each
// one is already sized within that box to read against the others - a barrier
// low and wide, a cone tall and narrow. So the box is what gets fitted to the
// cell, and one scale covers the lot of them; fitting each piece to the cell in
// its own right would flatten those differences out.
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

// A soft pool under each piece, sat where the art's own feet are rather than at
// a fixed depth, so a barrier gets its shadow at its legs and a cone at its base.
const SHADOW_ALPHA = 0.16;
const SHADOW_SPREAD = 0.86;
const SHADOW_DEPTH = 0.17;

/**
 * The tarmac the convoys drive on. The board itself is drawn once and only
 * redrawn when it is rebuilt, since nothing on it moves.
 *
 * The tiles a convoy is standing on light up over the top of it, on a layer of
 * their own that is redrawn every frame there is anything lit to draw.
 */
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

        this.g = scene.add.graphics();
        config.parent.add(this.g);

        // The tarmac itself, a piece of art to a cell, over the well it sits in.
        this.tileLayer = scene.add.container();
        config.parent.add(this.tileLayer);

        // The pools under the obstacles lie on the tarmac, so they are drawn
        // over the tiles rather than on the tray underneath them.
        this.shadowG = scene.add.graphics();
        config.parent.add(this.shadowG);

        // Over the tarmac and under everything the board's parent adds after it,
        // so a lit tile reads beneath the convoys rather than over them.
        this.liftG = scene.add.graphics();
        config.parent.add(this.liftG);

        // The layer the obstacles stand on, handed in by the parent: they are
        // stacked by depth there with everything else standing on the board.
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
        const g = this.g;

        g.clear();

        const width = this.columns * this.tileWidth;
        const height = this.rows * this.tileHeight;
        const left = this.startX - this.tileWidth / 2;
        const top = this.startY - this.tileHeight / 2;

        const rimPad = RIM_PAD * this.cell;
        const wellPad = WELL_PAD * this.cell;

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

        const gap = TILE_GAP * this.cell;

        // A tile is laid a seam short of its cell, which is the gap the board
        // was drawn with before the art took over.
        this.tileLayer.removeAll(true);

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (!this.isFloor(col, row)) continue;

                const spot = this.cellToPixel(col, row);
                const tile = this.scene.add.sprite(spot.x, spot.y, 'sheet', TILE);

                tile.setScale(
                    (this.tileWidth - gap) / TILE_ART,
                    (this.tileHeight - gap) / TILE_ART
                );

                this.tileLayer.add(tile);
            }
        }

        this.placeObstacles();
    }

    /**
     * Stands the obstacle art on the cells that carry one, and lays each piece's
     * shadow down on the tarmac under it.
     *
     * The shadows go on the board's own graphics, since they never change; the
     * pieces themselves are sprites, on the layer the parent has placed.
     */
    placeObstacles() {
        const g = this.shadowG;
        const scale = (this.cell * OBSTACLE_FIT) / OBSTACLE_ART;

        g.clear();

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

            // Where the drawn pixels stop inside the art's box - the piece's
            // feet, which is where its shadow belongs, whatever the box says.
            // The shadow goes with the piece, not the cell.
            const art = piece.frame.data.spriteSourceSize;
            const foot = (art.y + art.h - OBSTACLE_ART / 2) * scale;

            g.fillStyle(SHADOW, SHADOW_ALPHA);
            g.fillEllipse(x, y + foot, art.w * scale * SHADOW_SPREAD, this.cell * SHADOW_DEPTH);
        }
    }

    /**
     * The nudge a piece gets within its cell: its own kind's, and on top of
     * that whatever the level says for this one piece in particular.
     */
    obstacleOffset(name, own) {
        const kind = OBSTACLE_OFFSET[name] || OBSTACLE_OFFSET_DEFAULT;

        return {
            x: kind.x + ((own && own.x) || 0),
            y: kind.y + ((own && own.y) || 0)
        };
    }

    /** Falls back to a cone rather than the missing-texture box. */
    obstacleFrame(name) {
        // The art is packed under hyphenated names, while a level names its
        // obstacles the way the rest of the data does.
        const frame = 'obstacles/obstacle-' + String(name || DEFAULT_OBSTACLE).replace(/_/g, '-');

        if (this.scene.textures.getFrame('sheet', frame)) return frame;

        return 'obstacles/obstacle-' + DEFAULT_OBSTACLE;
    }

    /** A convoy is standing on the tile - light it, or top it back up. */
    pulseCell(col, row) {
        if (!this.isFloor(col, row)) return;

        const i = row * this.columns + col;

        // A tile still lit from a moment ago is only topped back up, so a convoy
        // doubling back over its own track does not pop it open from nothing.
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

        // One idle frame still has to run, to wipe the last tile off the layer.
        if (!live && !this.liftDrawn) return;

        this.drawLifts();
        this.liftDrawn = live;
    }

    drawLifts() {
        const g = this.liftG;
        const gap = TILE_GAP * this.cell;
        const inset = gap / 2 + LIFT_INSET * this.cell;

        g.clear();

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                const i = row * this.columns + col;
                const level = this.liftLevel[i];

                if (level <= 0) continue;

                const scale = this.liftScale(this.liftRise[i]);
                const w = (this.tileWidth - inset * 2) * scale;
                const h = (this.tileHeight - inset * 2) * scale;
                const spot = this.cellToPixel(col, row);

                g.fillStyle(LIFT, level * LIFT_ALPHA);
                g.fillRoundedRect(
                    spot.x - w / 2, spot.y - h / 2,
                    w, h,
                    TILE_CORNER * this.cell * scale
                );
            }
        }
    }

    /** Opens out to full size with a bump past it, then settles on the tile. */
    liftScale(t) {
        const ease = 1 - Math.pow(1 - t, 3);

        return LIFT_FROM + (1 - LIFT_FROM) * ease + Math.sin(Math.PI * t) * LIFT_OVER;
    }
}