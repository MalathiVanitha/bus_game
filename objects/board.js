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

const CONE_WIDTH = 0.44;
const CONE_HEIGHT = 0.62;
const CONE_BASE_H = 0.09;
const CONE_LIFT = 0.1;
const SHADOW_ALPHA = 0.22;

/**
 * The tarmac the convoys drive on. Drawn once into a graphics object - nothing
 * on it moves, so it is only redrawn when the board itself is rebuilt.
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
}
