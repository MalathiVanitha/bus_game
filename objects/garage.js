// The art is drawn on the same 220px canvas the vehicles use.
const ART_CELL = 220;
const GARAGE_FIT = 1.02;

// The doorway opens as a convoy commits to it and eases back once it is in.
const GAPE_SCALE = 1.1;
const GAPE_TIME = 200;
const SHUT_TIME = 320;

/**
 * A convoy's own garage. It holds a cell nobody else may route through, and the
 * matching convoy driving onto that cell is pulled inside.
 *
 * Drawn above the convoys, so a vehicle being pulled in slides behind the
 * doorway rather than over it.
 */
export class Garage {
    constructor(scene, config) {
        this.scene = scene;
        this.col = config.col;
        this.row = config.row;
        this.convoyIndex = config.convoyIndex;

        this.art = scene.add.sprite(
            config.x,
            config.y,
            "sheet",
            "bus/" + config.key + "/garage"
        );

        this.art.setOrigin(0.5);

        this.baseScale = (config.size * GARAGE_FIT) / ART_CELL;
        this.art.setScale(this.baseScale);

        config.parent.add(this.art);

        this.gapeTween = null;
    }

    gape() {
        if (this.gapeTween) this.gapeTween.remove();

        this.gapeTween = this.scene.tweens.add({
            targets: this.art,
            scale: this.baseScale * GAPE_SCALE,
            duration: GAPE_TIME,
            ease: "Back.easeOut",
            onComplete: () => {
                this.gapeTween = this.scene.tweens.add({
                    targets: this.art,
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

        this.art.destroy();
    }
}
