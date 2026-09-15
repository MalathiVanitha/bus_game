// Sampled off the storyboard: a white rounded tray, a near-black well cut into
// it, and the tarmac tiles sitting in the well.
const RIM = 0xffffff;
const WELL = 0x2b2e37;
const TILE = 0x5a697b;

const CONE = 0xf4772e;
const CONE_BAND = 0xfdf4ec;
const CONE_BASE = 0xd8541a;
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

const CONE_WIDTH = 0.44;
const CONE_HEIGHT = 0.62;
const CONE_BASE_H = 0.09;
const CONE_LIFT = 0.1;
const SHADOW_ALPHA = 0.22;

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
        this.cones = config.cones || [];

        this.g = scene.add.graphics();
        config.parent.add(this.g);

        // Over the tarmac and under everything the board's parent adds after it,
        // so a lit tile reads beneath the convoys rather than over them.
        this.liftG = scene.add.graphics();
        config.parent.add(this.liftG);

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

        g.fillStyle(TILE, 1);

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                if (!this.isFloor(col, row)) continue;

                const spot = this.cellToPixel(col, row);

                g.fillRoundedRect(
                    spot.x - this.tileWidth / 2 + gap / 2,
                    spot.y - this.tileHeight / 2 + gap / 2,
                    this.tileWidth - gap,
                    this.tileHeight - gap,
                    TILE_CORNER * this.cell
                );
            }
        }

        for (let i = 0; i < this.cones.length; i++) {
            const spot = this.cellToPixel(this.cones[i][0], this.cones[i][1]);

            this.drawCone(spot.x, spot.y);
        }
    }

    /** A cone, standing in for the art until it lands: enough to read the cell as taken. */
    drawCone(x, y) {
        const g = this.g;
        const w = CONE_WIDTH * this.cell;
        const h = CONE_HEIGHT * this.cell;
        const base = y + h / 2 - CONE_LIFT * this.cell;
        const tip = base - h;

        g.fillStyle(SHADOW, SHADOW_ALPHA);
        g.fillEllipse(x, base, w * 1.25, w * 0.42);

        g.fillStyle(CONE, 1);
        g.fillTriangle(x, tip, x - w / 2, base, x + w / 2, base);

        // The band sits on the slice of the cone between a third and a half of
        // the way up, so it narrows with the taper the same way a painted one does.
        const bandLow = 0.42;
        const bandHigh = 0.58;
        const lowY = base - h * bandLow;
        const highY = base - h * bandHigh;
        const lowW = (w / 2) * (1 - bandLow);
        const highW = (w / 2) * (1 - bandHigh);

        g.fillStyle(CONE_BAND, 1);
        g.fillPoints([
            { x: x - lowW, y: lowY },
            { x: x + lowW, y: lowY },
            { x: x + highW, y: highY },
            { x: x - highW, y: highY }
        ], true);

        g.fillStyle(CONE_BASE, 1);
        g.fillRoundedRect(
            x - w * 0.72, base - CONE_BASE_H * this.cell,
            w * 1.44, CONE_BASE_H * this.cell * 1.6,
            CONE_BASE_H * this.cell * 0.5
        );
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
