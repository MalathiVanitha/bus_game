import { bakeShape } from '../utils/bake.js';

// The change from one screen to the next, done with the game's own pieces:
// the convoy from the home screen drives across, tractor first, and lays the
// board down behind it until the screen is all board. The screens are swapped
// under it, and the convoy comes through again and takes the board up behind
// it, onto the new screen.

// One cell of the board, drawn the way board.js draws its own: a bevelled
// tile in the well, with a hairline gap round it.
const CELL = 64;
const WELL = 0x9aa3b3;
const TILE_FACE = 0xb8c0cf;
const TILE_LIGHT = 0xcbd2df;
const TILE_SHADE = 0xa7afbf;
const TILE_GAP = 2;
const TILE_CORNER = 6;
const TILE_BEVEL = 2;

// The white rim of the board, along the edge the convoy is dragging.
const RIM = 0xffffff;
const RIM_W = 8;
const EDGE_SHADE = 0x283085;
const EDGE_SHADE_ALPHA = 0.18;
const EDGE_SHADE_W = 18;

const CONVOY = 'home/convoy';
const CONVOY_SCALE = 0.5;
// Below the middle, in the gap between the home screen's own convoy and its
// Play button, so the two never drive over each other.
const CONVOY_Y = 150;
// The art has clear space under the tyres; they meet the ground this far up
// from the bottom of the frame, in art pixels.
const WHEEL_LINE = 46;
// How far the board's edge tucks under the last cart.
const TUCK = 40;
const BOB = 3;
const BOB_TIME = 110;
const ROCK = 1.2;

const GROUND = 0x283085;
const GROUND_ALPHA = 0.22;
const GROUND_H = 22;

// Dust kicked up behind the last cart, from the home screen's cloud.
const PUFF = 'home/cloud';
const PUFF_EVERY = 55;
const PUFF_TIME = 420;
const PUFF_SCALE = [0.12, 0.22];
const PUFF_DRIFT = 70;
const PUFF_RISE = 26;
const PUFF_TINT = 0xe6ebf3;

const PASS_TIME = 620;
const HOLD_TIME = 100;

const REVEAL_FROM = PASS_TIME + HOLD_TIME;
const TOTAL_TIME = REVEAL_FROM + PASS_TIME;

export class Transition extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.running = false;

        // Swallows taps while a change is under way.
        this.blocker = this.scene.add.zone(0, 0, 10, 10);
        this.add(this.blocker);

        this.buildBoard();

        this.rim = this.scene.add.rectangle(0, 0, RIM_W, 10, RIM);
        this.add(this.rim);

        this.edgeShade = this.scene.add.rectangle(0, 0, EDGE_SHADE_W, 10, EDGE_SHADE, EDGE_SHADE_ALPHA);
        this.add(this.edgeShade);

        this.puffs = this.scene.add.container(0, 0);
        this.add(this.puffs);

        this.ground = this.scene.add.ellipse(0, 0, 10, GROUND_H, GROUND, GROUND_ALPHA);
        this.add(this.ground);

        this.convoy = this.scene.add.sprite(0, 0, 'sheet', CONVOY);
        this.convoy.setScale(CONVOY_SCALE);
        this.add(this.convoy);

        this.visible = false;
    }

    buildBoard() {
        const tile = bakeShape(this.scene, {
            left: 0, top: 0, width: CELL, height: CELL
        }, (g) => {
            const x = TILE_GAP;
            const w = CELL - TILE_GAP * 2;

            g.fillStyle(WELL, 1);
            g.fillRect(0, 0, CELL, CELL);

            g.fillStyle(TILE_SHADE, 1);
            g.fillRoundedRect(x, x, w, w, TILE_CORNER);

            g.fillStyle(TILE_LIGHT, 1);
            g.fillRoundedRect(x, x, w, w - TILE_BEVEL, TILE_CORNER);

            g.fillStyle(TILE_FACE, 1);
            g.fillRoundedRect(x, x + TILE_BEVEL, w, w - TILE_BEVEL * 2, TILE_CORNER);
        }, 'transition-tile');

        this.tileRes = 1 / tile.restScale;
        tile.destroy();

        this.board = this.scene.add.tileSprite(0, 0, 10, 10, 'transition-tile');
        this.board.setTileScale(1 / this.tileRes);
        this.add(this.board);

        // The board stays put on the screen, and a mask shows the part of it
        // the convoy has laid. Masks work in world space.
        this.cut = this.scene.make.graphics({ add: false });
        this.board.setMask(this.cut.createGeometryMask());
    }

    /**
     * Lays the board, calls onCovered to swap what is under it, then takes it
     * up and calls onDone. A change asked for while one is running is dropped,
     * so a double tap cannot start two.
     */
    run(onCovered, onDone = null) {
        if (this.running) return false;

        this.running = true;
        this.visible = true;

        const width = dimensions.actualWidth;
        const height = dimensions.actualHeight;

        this.blocker.setSize(width, height);
        this.blocker.setInteractive();

        this.board.setSize(width, height);
        this.rim.height = height;
        this.edgeShade.height = height;

        this.ground.width = this.convoy.displayWidth * 0.92;

        this.lastPuff = 0;
        this.puffs.removeAll(true);

        let covered = false;

        this.draw(0);

        this.scene.tweens.addCounter({
            from: 0,
            to: TOTAL_TIME,
            duration: TOTAL_TIME,
            ease: 'Linear',
            onUpdate: (tween) => {
                const at = tween.getValue();

                this.draw(at);

                if (!covered && at >= PASS_TIME) {
                    covered = true;
                    if (onCovered) onCovered();
                }
            },
            onComplete: () => {
                if (!covered && onCovered) onCovered();

                this.running = false;
                this.visible = false;
                this.cut.clear();
                this.puffs.removeAll(true);
                this.blocker.disableInteractive();

                if (onDone) onDone();
            }
        });

        return true;
    }

    draw(at) {
        const width = dimensions.actualWidth;
        const height = dimensions.actualHeight;
        const convoyW = this.convoy.displayWidth;

        // Each pass runs right to left, tractor first: in from off the right,
        // out past the left.
        const laying = at < REVEAL_FROM;
        const pass = laying ?
            Math.min(1, at / PASS_TIME) :
            Math.min(1, (at - REVEAL_FROM) / PASS_TIME);

        const from = width / 2 + convoyW / 2;
        const to = -width / 2 - convoyW / 2 + TUCK - RIM_W - EDGE_SHADE_W;
        const moving = laying ? at < PASS_TIME : true;

        const x = from + (to - from) * Phaser.Math.Easing.Sine.InOut(pass);

        this.convoy.x = x;
        this.convoy.y = CONVOY_Y - Math.abs(Math.sin(at / BOB_TIME * Math.PI)) * BOB * (moving ? 1 : 0);
        this.convoy.angle = Math.sin(at / BOB_TIME * Math.PI * 0.5) * ROCK * (moving ? 1 : 0);
        this.convoy.visible = moving && pass > 0 && pass < 1;

        const wheels = CONVOY_Y + this.convoy.displayHeight / 2 - WHEEL_LINE * CONVOY_SCALE;

        this.ground.setPosition(x, wheels);
        this.ground.visible = this.convoy.visible;

        // The edge of the board, tucked under the last cart.
        const edge = Phaser.Math.Clamp(x + convoyW / 2 - TUCK, -width / 2, width / 2);

        // Laying, the board runs from the edge to the right of the screen;
        // taking it up, from the left of the screen to the edge.
        const left = laying ? edge : -width / 2;
        const right = laying ? width / 2 : edge;

        this.cutTo(left, right, height);

        const showEdge = right - left > 0 && edge > -width / 2 && edge < width / 2;

        this.rim.visible = showEdge;
        this.edgeShade.visible = showEdge;

        // The rim runs along the board's open edge, and its shade falls on the
        // screen beyond.
        this.rim.x = laying ? edge - RIM_W / 2 : edge + RIM_W / 2;
        this.edgeShade.x = laying ?
            edge - RIM_W - EDGE_SHADE_W / 2 :
            edge + RIM_W + EDGE_SHADE_W / 2;

        this.kickDust(at, x + convoyW / 2 - TUCK, wheels);
        this.driftDust(at);
    }

    cutTo(left, right, height) {
        const matrix = this.getWorldTransformMatrix();

        this.cut.clear();

        if (right <= left) return;

        const topLeft = matrix.transformPoint(left, -height / 2);
        const bottomRight = matrix.transformPoint(right, height / 2);

        this.cut.fillStyle(0xffffff, 1);
        this.cut.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    }

    kickDust(at, x, y) {
        if (!this.convoy.visible || at - this.lastPuff < PUFF_EVERY) return;

        this.lastPuff = at;

        const puff = this.scene.add.sprite(x, y - 6, 'sheet', PUFF);
        puff.setTint(PUFF_TINT);
        puff.born = at;
        puff.startX = x;
        puff.startY = y - 6;
        puff.size = Phaser.Math.FloatBetween(PUFF_SCALE[0], PUFF_SCALE[1]);
        puff.setScale(puff.size * 0.4);

        this.puffs.add(puff);
    }

    driftDust(at) {
        const puffs = this.puffs.list;

        for (let i = puffs.length - 1; i >= 0; i--) {
            const puff = puffs[i];
            const life = (at - puff.born) / PUFF_TIME;

            if (life >= 1) {
                puff.destroy();
                continue;
            }

            const ease = Phaser.Math.Easing.Quadratic.Out(life);

            puff.x = puff.startX + ease * PUFF_DRIFT;
            puff.y = puff.startY - ease * PUFF_RISE;
            puff.setScale(puff.size * (0.4 + 0.6 * ease));
            puff.alpha = 1 - life;
        }
    }

    adjust() {
        this.x = dimensions.gameWidth / 2;
        this.y = dimensions.gameHeight / 2;
    }
}
