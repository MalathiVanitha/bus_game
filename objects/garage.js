// The art is drawn on the same 220px canvas the vehicles use, and packed into
// the same atlas beside them, keyed by the convoy's colour.
const VEHICLE_SHEET = "luggages";

const ART_CELL = 170;
const GARAGE_FIT = 1;

// Which way the doorway points in the art: the opening is drawn at the foot of
// the frame, so it faces the way y grows. Everything else is worked out as a
// turn away from that.
const DOOR_FACING = Math.PI / 2;

// The doorway itself, measured off the art in its own 220px units, as offsets
// from the middle of the frame along the way the door faces.
//
// The opening is a room with depth, not a flat panel: it runs from a back wall
// in shadow out to the lit ramp lip at its mouth, between the two white pillars.
// A vehicle is seen driving that whole length before the back wall takes it.
const DOOR_BACK = 20;
const DOOR_MOUTH = 192;
const DOOR_HALF = 48;

// The doorway opens as a convoy commits to it and eases back once it is in.
const GAPE_SCALE = 1.1;
const GAPE_TIME = 200;
const SHUT_TIME = 320;

// The quick swell as each cart is taken through the mouth.
const GULP_SCALE = 1.07;
const GULP_TIME = 80;

// The bounce once the whole convoy is in: squashed along the doorway and
// spread across it, then springing back past straight.
const CHEER_SQUASH = 0.86;
const CHEER_SPREAD = 1.16;
const CHEER_IN = 90;
const CHEER_OUT = 420;

// Where the building stands among the things stacked by depth, in cells down
// from the middle of its cell: at its foot. A doorway that looks down the
// screen pushes that out by the reach of a vehicle's nose, so one driving up
// to the door is behind the wall from the moment it touches it, not drawn over.
const FOOT = 0.5;
const NOSE = 0.5;

/**
 * A convoy's own garage. It holds a cell nobody else may route through, and the
 * matching convoy driving onto that cell is pulled inside.
 *
 * Turned so the doorway looks out the way a convoy reaches it from, which is
 * what lets a vehicle drive in through the opening rather than into a wall.
 *
 * Drawn twice: the room, under everything, and the building, stacked by depth
 * with the vehicles and with the doorway cut out of it. A vehicle at the garage
 * is then behind the building everywhere except the opening, and seen through
 * the opening - which is what makes it read as driving inside rather than
 * behind.
 */
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

        // The room behind a vehicle, and the building in front of it. The one in
        // front has the doorway cut out of it by the mask handed in.
        this.back = this.drawing(scene, config, config.behind);
        this.front = this.drawing(scene, config, config.parent);

        this.front.setMask(config.mask);
        this.front.depth = config.y +
            config.size * (FOOT + Math.max(0, Math.sin(config.facing)) * NOSE);

        // The doorway in pixels, for the board to cut out and to hide vehicles
        // past: how far out the mouth and the back wall stand from the middle of
        // the cell, and how wide the opening is either side of it.
        this.doorBack = DOOR_BACK * this.baseScale;
        this.doorMouth = DOOR_MOUTH * this.baseScale;
        this.doorHalf = DOOR_HALF * this.baseScale;

        this.gapeTween = null;
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

    /** A cart has gone through the mouth: a quick swell and back. */
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

    /**
     * The whole convoy is in. The building takes it with a bounce: pressed
     * down along the doorway and out across it, then springing back.
     */
    cheer() {
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