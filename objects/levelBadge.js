// The level number, top middle, as in the storyboard: a blue pill between the
// clock on its left and the pause button on its right.

const BADGE_Y = 51;
const BADGE_W = 150;
const BADGE_H = 54;

const FACE = 'button_blue';
// The button in the art is 144 tall, with 50 clear on either side of it. Its
// round ends are kept whole and the middle stretched.
const FACE_SCALE = BADGE_H / 144;
const FACE_PAD = 50;
const FACE_CORNER = 110;

const LABEL_Y = -2;
const LABEL_SIZE = 26;
const INK = '#ffffff';

const INTRO_Y = -90;
const INTRO_TIME = 540;
const INTRO_DELAY = 260;

export class LevelBadge extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.build();
        this.hide();
    }

    build() {
        const textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));

        const pill = this.scene.add.container(0, 0);

        const face = this.scene.add.nineslice(
            0, 0, FACE, null,
            BADGE_W / FACE_SCALE + FACE_PAD * 2, 160,
            FACE_CORNER, FACE_CORNER, 0, 0
        );
        face.setScale(FACE_SCALE);
        pill.add(face);

        this.label = this.scene.add.text(0, LABEL_Y, 'Level 1', {
            fontFamily: 'FredokaOne_Regular',
            fontSize: LABEL_SIZE,
            color: INK
        });
        this.label.setOrigin(.5);
        this.label.setResolution(textRes);
        pill.add(this.label);

        this.pill = pill;
        this.add(pill);
    }

    set(level) {
        this.label.setText('Level ' + level);
    }

    /** Drops in from above the screen with the level on it. */
    intro(level) {
        this.set(level);
        this.show();

        this.scene.tweens.killTweensOf(this.pill);

        this.pill.y = INTRO_Y;
        this.pill.alpha = 0;

        this.scene.tweens.add({
            targets: this.pill,
            y: 0,
            alpha: 1,
            duration: INTRO_TIME,
            delay: INTRO_DELAY,
            ease: 'Back.easeOut'
        });
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.scene.tweens.killTweensOf(this.pill);

        this.visible = false;
    }

    adjust() {
        this.x = dimensions.gameWidth / 2;
        this.y = BADGE_Y;
    }
}
