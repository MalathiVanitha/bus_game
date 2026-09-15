// The art is drawn on the same 220px canvas the vehicles use.
const ART_CELL = 220;
const GARAGE_FIT = 1.02;

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

/**
 * A convoy's own garage. It holds a cell nobody else may route through, and the
 * matching convoy driving onto that cell is pulled inside.
 *
 * Turned so the doorway looks out the way a convoy reaches it from, which is
 * what lets a vehicle drive in through the opening rather than into a wall.
 *
 * Drawn twice, once under the convoys and once over them, with the doorway cut
 * out of the copy on top. A vehicle at the garage is then behind the building
 * everywhere except the opening, and seen through the opening - which is what
 * makes it read as driving inside rather than behind.
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
        // front has the doorway cut out of it by the mask the board keeps.
        this.back = this.drawing(scene, config, config.behind);
        this.front = this.drawing(scene, config, config.parent);

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
            "sheet",
            "bus/" + config.key + "/garage"
        );

        art.setOrigin(0.5);
        art.setRotation(config.facing - DOOR_FACING);
        art.setScale(this.baseScale);
        parent.add(art);

        return art;
    }

    gape() {
        if (this.gapeTween) this.gapeTween.remove();

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

    destroy() {
        if (this.gapeTween) this.gapeTween.remove();

        this.back.destroy();
        this.front.destroy();
    }
}