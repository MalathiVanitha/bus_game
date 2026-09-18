const VEHICLE_SHEET = "luggages";

const ART_CELL = 170;
const GARAGE_FIT = 1;

const DOOR_FACING = Math.PI / 2;

const DOOR_BACK = 20;
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

const VANISH_DELAY = 120;
const VANISH_POP = 1.15;
const VANISH_POP_TIME = 110;
const VANISH_TIME = 260;

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

        this.back = this.drawing(scene, config, config.behind);
        this.front = this.drawing(scene, config, config.parent);

        this.front.setMask(config.mask);
        this.front.depth = config.y +
            config.size * (FOOT + Math.max(0, Math.sin(config.facing)) * NOSE);

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

        const both = [this.back, this.front];

        this.gapeTween = this.scene.tweens.add({
            targets: both,
            scale: this.baseScale * VANISH_POP,
            delay: VANISH_DELAY,
            duration: VANISH_POP_TIME,
            ease: "Quad.easeOut",
            onComplete: () => {
                this.gapeTween = this.scene.tweens.add({
                    targets: both,
                    scale: 0,
                    alpha: 0,
                    duration: VANISH_TIME,
                    ease: "Back.easeIn",
                    onComplete: () => {
                        this.gapeTween = null;
                        this.back.setVisible(false);
                        this.front.setVisible(false);
                        if (then) then();
                    }
                });
            }
        });
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

        this.back.destroy();
        this.front.destroy();
    }
}