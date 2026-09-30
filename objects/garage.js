const VEHICLE_SHEET = "luggages";

const ART_CELL = 170;
const GARAGE_FIT = 1;

const DOOR_FACING = Math.PI / 2;

// How far out from the middle the roof reaches (art pixels): vehicles are cut
// off here, so they slide in under the roof edge on whichever side they came.
const DOOR_BACK = 76;
const DOOR_MOUTH = 192;
const DOOR_HALF = 48;

const GAPE_SCALE = 1.1;
const GAPE_TIME = 200;
const SHUT_TIME = 320;

const GULP_SCALE = 1.07;
const GULP_TIME = 80;

const CHEER_SQUASH = 0.86;
const CHEER_SPREAD = 1.16;
const CHEER_IN = 90;
const CHEER_OUT = 420;

// Going away the moment its convoy is home: it swells for a beat, then breaks
// into a grid of pieces that burst out from the middle, turning as they go,
// and stay solid until they shrink away and fade at the end.
const SHATTER_POP = 1.12;
const SHATTER_POP_TIME = 90;
const SHATTER_GRID = 4;
const SHATTER_REACH = 0.3;
const SHATTER_REACH_RANGE = 0.25;
const SHATTER_SCATTER = 0.35;
const SHATTER_SPIN = 1.4;
const SHATTER_SHRINK = 0.2;
const SHATTER_TIME = 460;
const SHATTER_TIME_RANGE = 140;
const SHATTER_STAGGER = 40;
// Pieces start a hair oversize so no seams show between them as it breaks.
const SHATTER_OVERLAP = 1.03;

const FOOT = 0.5;
const NOSE = 0.5;

export class Garage {
    constructor(scene, config) {
        this.scene = scene;
        this.col = config.col;
        this.row = config.row;
        this.convoyIndex = config.convoyIndex;

        this.x = config.x;
        this.y = config.y;
        this.facing = config.facing;
        this.baseScale = (config.size * GARAGE_FIT) / ART_CELL;

        this.size = config.size;
        this.fx = config.fx || config.parent;
        this.leftovers = [];

        this.back = this.drawing(scene, config, config.behind);
        this.front = this.drawing(scene, config, config.parent);

        this.front.setMask(config.mask);
        this.front.depth = config.y + config.size * (FOOT + NOSE);

        this.doorBack = DOOR_BACK * this.baseScale;
        this.doorMouth = DOOR_MOUTH * this.baseScale;
        this.doorHalf = DOOR_HALF * this.baseScale;

        this.gapeTween = null;

        this.gone = false;
    }

    drawing(scene, config, parent) {
        const art = scene.add.sprite(
            config.x,
            config.y,
            VEHICLE_SHEET,
            config.key + "/garage"
        );

        art.setOrigin(0.5);
        art.setRotation(config.facing - DOOR_FACING);
        art.setScale(this.baseScale);
        parent.add(art);

        return art;
    }

    // Turns the doorway to the side a convoy is coming in from. The art stays
    // as it is: the garage is open on all four sides.
    openTo(facing) {
        this.facing = facing;
    }

    gape() {
        this.stopTween();

        this.gapeTween = this.scene.tweens.add({
            targets: [this.back, this.front],
            scale: this.baseScale * GAPE_SCALE,
            duration: GAPE_TIME,
            ease: "Back.easeOut",
            onComplete: () => {
                this.gapeTween = this.scene.tweens.add({
                    targets: [this.back, this.front],
                    scale: this.baseScale,
                    duration: SHUT_TIME,
                    ease: "Sine.easeOut",
                    onComplete: () => {
                        this.gapeTween = null;
                    }
                });
            }
        });
    }

    gulp() {
        this.stopTween();

        this.gapeTween = this.scene.tweens.add({
            targets: [this.back, this.front],
            scale: this.baseScale * GULP_SCALE,
            duration: GULP_TIME,
            yoyo: true,
            ease: "Quad.easeOut",
            onComplete: () => {
                this.gapeTween = null;
            }
        });
    }

    cheer(then) {
        this.stopTween();

        const both = [this.back, this.front];

        this.gapeTween = this.scene.tweens.add({
            targets: both,
            scaleX: this.baseScale * CHEER_SPREAD,
            scaleY: this.baseScale * CHEER_SQUASH,
            duration: CHEER_IN,
            ease: "Quad.easeOut",
            onComplete: () => {
                this.gapeTween = this.scene.tweens.add({
                    targets: both,
                    scaleX: this.baseScale,
                    scaleY: this.baseScale,
                    duration: CHEER_OUT,
                    ease: "Elastic.easeOut",
                    easeParams: [1.1, 0.5],
                    onComplete: () => {
                        this.gapeTween = null;
                        if (then) then();
                    }
                });
            }
        });
    }

    vanish(then) {
        if (this.gone) return;

        this.stopTween();
        this.gone = true;

        this.gapeTween = this.scene.tweens.add({
            targets: [this.back, this.front],
            scale: this.baseScale * SHATTER_POP,
            duration: SHATTER_POP_TIME,
            ease: "Quad.easeOut",
            onComplete: () => {
                this.gapeTween = null;
                this.back.setVisible(false);
                this.front.setVisible(false);
                this.shatter(then);
            }
        });
    }

    shatter(then) {
        // The grid covers the art itself. The frame is trimmed: it sits at
        // frame.x/y inside the full-size source the sprite is centred on.
        const art = this.back;
        const frame = art.frame;
        const scale = art.scaleX;
        const pieceW = frame.width / SHATTER_GRID;
        const pieceH = frame.height / SHATTER_GRID;
        const cos = Math.cos(art.rotation);
        const sin = Math.sin(art.rotation);
        let left = SHATTER_GRID * SHATTER_GRID;

        for (let row = 0; row < SHATTER_GRID; row++) {
            for (let col = 0; col < SHATTER_GRID; col++) {
                // The piece's middle, from the middle of the art, as it sits on
                // the board.
                const artX = (frame.x + (col + 0.5) * pieceW - frame.realWidth / 2) * scale;
                const artY = (frame.y + (row + 0.5) * pieceH - frame.realHeight / 2) * scale;
                const offX = artX * cos - artY * sin;
                const offY = artX * sin + artY * cos;

                // Straight out from the middle, give or take, so the pieces do
                // not all leave in a neat ring.
                const away = Math.atan2(offY, offX) + (Math.random() - 0.5) * 2 * SHATTER_SCATTER;
                const reach = this.size * (SHATTER_REACH + Math.random() * SHATTER_REACH_RANGE);

                const piece = this.scene.add.sprite(
                    this.x + offX, this.y + offY,
                    art.texture.key, this.shard(frame, col, row, pieceW, pieceH)
                );

                piece.setOrigin(0.5);
                piece.setRotation(art.rotation);
                piece.setScale(scale * SHATTER_OVERLAP);
                this.fx.add(piece);
                this.leftovers.push(piece);

                // Out fast and easing off; the shrink holds, dips a touch, then
                // goes; the fade waits for the end.
                this.scene.tweens.add({
                    targets: piece,
                    x: { value: piece.x + Math.cos(away) * reach, ease: "Cubic.easeOut" },
                    y: { value: piece.y + Math.sin(away) * reach, ease: "Cubic.easeOut" },
                    rotation: {
                        value: art.rotation + (Math.random() - 0.5) * 2 * SHATTER_SPIN,
                        ease: "Quad.easeOut"
                    },
                    scale: { value: this.baseScale * SHATTER_SHRINK, ease: "Back.easeIn" },
                    alpha: { value: 0, ease: "Quad.easeIn" },
                    delay: Math.random() * SHATTER_STAGGER,
                    duration: SHATTER_TIME + Math.random() * SHATTER_TIME_RANGE,
                    onComplete: () => {
                        this.forget(piece);
                        if (--left === 0 && then) then();
                    }
                });
            }
        }
    }

    // Its own frame cut from the garage's, made once per colour and kept. A crop
    // would do, but Phaser clips crops on trimmed frames short on the far sides.
    shard(frame, col, row, width, height) {
        const name = frame.name + "#shard" + col + "-" + row;
        const texture = frame.texture;

        if (!texture.has(name)) {
            texture.add(
                name, frame.sourceIndex,
                frame.cutX + col * width, frame.cutY + row * height,
                width, height
            );
        }

        return name;
    }

    forget(piece) {
        const at = this.leftovers.indexOf(piece);

        if (at >= 0) this.leftovers.splice(at, 1);
        piece.destroy();
    }

    stopTween() {
        if (!this.gapeTween) return;

        this.gapeTween.remove();
        this.gapeTween = null;
        this.back.setScale(this.baseScale);
        this.front.setScale(this.baseScale);
    }

    destroy() {
        if (this.gapeTween) this.gapeTween.remove();

        for (let i = 0; i < this.leftovers.length; i++) {
            this.scene.tweens.killTweensOf(this.leftovers[i]);
            this.leftovers[i].destroy();
        }

        this.leftovers.length = 0;

        this.back.destroy();
        this.front.destroy();
    }
}