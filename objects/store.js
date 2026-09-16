// The Store button that sits under Play on the home screen. The shop itself is
// not drawn yet - there is no storyboard for it - so pressing the button says
// so on the scene and leaves the screen where it is. The panel belongs in here
// beside the button when the art for it lands.

import { pressable } from '../utils/buttons.js';

// Packed at the size the home pack lays it out at on its 1080 x 1920 canvas,
// which is twice the 540 x 960 the game is laid out in.
const ART_SCALE = 0.5;

const FACE = 'home/store-button';

const HIT_W = 350;
const HIT_H = 90;

const ICON = 'home/store-icon';
const ICON_X = -93;
const ICON_Y = -4;

const LABEL = 'Store';
const LABEL_X = 34;
const LABEL_Y = -4;
const LABEL_SIZE = 46;

export class Store extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0, onOpen = null) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.onOpen = onOpen;

        this.build();
    }

    build() {
        this.textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));

        const button = this.scene.add.container(0, 0);

        const face = this.scene.add.sprite(0, 0, 'sheet', FACE);
        face.setScale(ART_SCALE);
        button.add(face);

        const icon = this.scene.add.sprite(ICON_X, ICON_Y, 'sheet', ICON);
        icon.setScale(ART_SCALE);
        button.add(icon);

        const label = this.scene.add.text(LABEL_X, LABEL_Y, LABEL, {
            fontFamily: 'FredokaOne_Regular',
            fontSize: LABEL_SIZE,
            color: '#ffffff'
        });
        label.setOrigin(.5);
        label.setResolution(this.textRes);
        button.add(label);

        pressable(this.scene, button, HIT_W, HIT_H, () => this.open());

        this.button = button;
        this.add(button);
    }

    /** Whoever is listening gets to put the shop on the screen. */
    open() {
        this.scene.events.emit('store:open');

        if (this.onOpen) this.onOpen();
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }
}
