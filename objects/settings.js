import soundsData from "../sounds-data.js";

const PANEL_W = 470;
const PANEL_H = 600;

const PANEL_SCALE = 0.56;
const PANEL_PAD_X = 44;
const PANEL_PAD_Y = 131;
const PANEL_CORNER_X = 125;
const PANEL_CORNER_Y = 150;

const PANEL_DRIFT_Y = -1.5;

const MODAL_MARGIN = 24;

const DIM = 0x101a33;
const DIM_ALPHA = 0.55;

const INK = '#283085';
const RULE = 0xded9f4;
const RULE_THICK = 3;
const RULE_HALF = 203;

const TITLE_X = -200;
const TITLE_Y = -242;
const TITLE_SIZE = 58;

const CLOSE_X = 193;
const CLOSE_Y = -250;
const CLOSE_SCALE = 0.72;
const CLOSE_HIT = 78;

const ROW_Y = [-128, -15, 99];
const RULE_Y = [-188, -71, 42];

const ICON_X = -158;
const ICON_SCALE = 0.76;

const LABEL_X = -84;
const LABEL_SIZE = 34;

const TOGGLE_X = 147;
const TOGGLE_SCALE = 0.85;
const KNOB_TRAVEL = 27;
const TOGGLE_OFF = 0xb7b8c3;
const TOGGLE_ON = 0xffffff;
const TOGGLE_TIME = 170;

const ROW_HIT_W = RULE_HALF * 2;
const ROW_HIT_H = 113;

const DONE_Y = 212;
const DONE_SCALE = 0.58;

const DONE_HIT_W = 416;
const DONE_HIT_H = 100;

const DONE_TEXT_Y = 207;
const DONE_SIZE = 54;

const GEAR_X = 84;
const GEAR_Y = 62;
const GEAR_BASE_SCALE = 0.524;
const GEAR_ICON_SCALE = 0.58;
const GEAR_HIT = 104;

const OPEN_TIME = 300;
const SHUT_TIME = 170;
const OPEN_FROM = 0.72;
const SHUT_TO = 0.86;

const PRESS = 0.94;
const PRESS_TIME = 90;

const ROWS = [
    { key: 'music', icon: 'icons/icon-music', label: 'Music' },
    { key: 'sound', icon: 'icons/icon-sound', label: 'Sound' },
    { key: 'vibration', icon: 'icons/icon-vibration', label: 'Vibration' }
];

const STORE_KEY = 'baggage-out.settings';

const DEFAULTS = { music: true, sound: true, vibration: false };

const BUZZ_MS = 18;

function readStore() {
    const state = Object.assign({}, DEFAULTS);

    try {
        const saved = JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}');

        for (const key in DEFAULTS) {
            if (typeof saved[key] === 'boolean') state[key] = saved[key];
        }
    } catch (e) {
        // defaults stand and the panel still opens.
    }

    return state;
}

function writeStore(state) {
    try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
        // Nothing to be done about it, and nothing worth stopping the game for.
    }
}

export class Settings extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.state = readStore();
        this.isOpen = false;
        this.toggles = {};

        this.build();
        this.apply();
    }


    build() {
        this.textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));

        this.buildGear();
        this.buildModal();
    }

    buildGear() {
        const gear = this.scene.add.container(0, 0);

        const base = this.scene.add.sprite(0, 0, 'sheet', 'ui/button_icon_base');
        base.setScale(GEAR_BASE_SCALE);
        gear.add(base);

        const icon = this.scene.add.sprite(0, 0, 'sheet', 'icons/icon-gear');
        icon.setScale(GEAR_ICON_SCALE);
        gear.add(icon);

        this.pressable(gear, GEAR_HIT, GEAR_HIT, () => this.show());

        this.gear = gear;
        this.add(gear);
    }

    buildModal() {
        const modal = this.scene.add.container(0, 0);

        this.dim = this.scene.add.rectangle(0, 0, 10, 10, DIM, DIM_ALPHA);
        this.dim.setInteractive();
        modal.add(this.dim);

        const fitter = this.scene.add.container(0, 0);
        modal.add(fitter);

        const card = this.scene.add.container(0, 0);
        fitter.add(card);

        card.add(this.scene.add.nineslice(
            0, PANEL_DRIFT_Y, 'panel_modal', null,
            PANEL_W / PANEL_SCALE + PANEL_PAD_X,
            PANEL_H / PANEL_SCALE + PANEL_PAD_Y,
            PANEL_CORNER_X, PANEL_CORNER_X, PANEL_CORNER_Y, PANEL_CORNER_Y
        ).setScale(PANEL_SCALE));

        const title = this.scene.add.text(TITLE_X, TITLE_Y, 'Settings', {
            fontFamily: 'FredokaOne_Regular',
            fontSize: TITLE_SIZE,
            color: INK
        });
        title.setOrigin(0, .5);
        title.setResolution(this.textRes);
        card.add(title);

        const close = this.scene.add.container(CLOSE_X, CLOSE_Y);
        const cross = this.scene.add.sprite(0, 0, 'sheet', 'icons/icon-close');
        cross.setScale(CLOSE_SCALE);
        close.add(cross);
        this.pressable(close, CLOSE_HIT, CLOSE_HIT, () => this.hide());
        card.add(close);

        for (let i = 0; i < RULE_Y.length; i++) {
            const rule = this.scene.add.rectangle(0, RULE_Y[i], RULE_HALF * 2, RULE_THICK, RULE);
            card.add(rule);
        }

        for (let i = 0; i < ROWS.length; i++) {
            this.buildRow(card, ROWS[i], ROW_Y[i]);
        }

        const done = this.scene.add.container(0, DONE_Y);

        const face = this.scene.add.sprite(0, 0, 'button_purple');
        face.setScale(DONE_SCALE);
        done.add(face);

        const doneText = this.scene.add.text(0, DONE_TEXT_Y - DONE_Y, 'Done', {
            fontFamily: 'FredokaOne_Regular',
            fontSize: DONE_SIZE,
            color: '#ffffff'
        });
        doneText.setOrigin(.5);
        doneText.setResolution(this.textRes);
        done.add(doneText);

        this.pressable(done, DONE_HIT_W, DONE_HIT_H, () => this.hide());
        card.add(done);

        modal.visible = false;

        this.modal = modal;
        this.fitter = fitter;
        this.card = card;
        this.add(modal);
    }

    buildRow(card, row, y) {
        const icon = this.scene.add.sprite(ICON_X, y, 'sheet', row.icon);
        icon.setScale(ICON_SCALE);
        card.add(icon);

        const label = this.scene.add.text(LABEL_X, y, row.label, {
            fontFamily: 'FredokaOne_Regular',
            fontSize: LABEL_SIZE,
            color: INK
        });
        label.setOrigin(0, .5);
        label.setResolution(this.textRes);
        card.add(label);

        const toggle = this.scene.add.container(TOGGLE_X, y);

        toggle.track = this.scene.add.sprite(0, 0, 'toggle-base');
        toggle.track.setScale(TOGGLE_SCALE);
        toggle.add(toggle.track);

        toggle.fill = this.scene.add.sprite(0, 0, 'toggle-fill');
        toggle.fill.setScale(TOGGLE_SCALE);
        toggle.add(toggle.fill);

        toggle.knob = this.scene.add.sprite(0, 0, 'sheet', 'ui/toggle_knob');
        toggle.knob.setScale(TOGGLE_SCALE);
        toggle.add(toggle.knob);

        toggle.mix = this.state[row.key] ? 1 : 0;

        this.paint(toggle);

        this.toggles[row.key] = toggle;
        card.add(toggle);

        const hot = this.scene.add.zone(0, y, ROW_HIT_W, ROW_HIT_H);

        this.pressable(hot, ROW_HIT_W, ROW_HIT_H, () => this.flip(row.key), toggle);
        card.add(hot);
    }

    pressable(target, width, height, onPress, feedback = target) {
        feedback.restScale = feedback.scaleX;

        target.setSize(width, height);
        target.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

        const sink = (to) => {
            this.scene.tweens.killTweensOf(feedback);
            this.scene.tweens.add({
                targets: feedback,
                scale: feedback.restScale * to,
                duration: PRESS_TIME,
                ease: 'Quad.easeOut'
            });
        };

        target.on('pointerdown', () => sink(PRESS));
        target.on('pointerout', () => sink(1));

        target.on('pointerup', () => {
            sink(1);
            onPress();
        });
    }

    paint(toggle) {
        const mix = toggle.mix;

        toggle.knob.x = Phaser.Math.Linear(-KNOB_TRAVEL, KNOB_TRAVEL, mix);
        toggle.fill.alpha = mix;

        const shade = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.IntegerToColor(TOGGLE_OFF),
            Phaser.Display.Color.IntegerToColor(TOGGLE_ON),
            100, mix * 100
        );

        toggle.track.setTint(Phaser.Display.Color.GetColor(shade.r, shade.g, shade.b));
    }

    flip(key) {
        const on = !this.state[key];
        const toggle = this.toggles[key];

        this.state[key] = on;

        writeStore(this.state);
        this.apply();

        this.scene.tweens.killTweensOf(toggle.knob);
        this.scene.tweens.add({
            targets: toggle.knob,
            x: on ? KNOB_TRAVEL : -KNOB_TRAVEL,
            duration: TOGGLE_TIME,
            ease: 'Back.easeOut'
        });

        if (toggle.wash) toggle.wash.remove();

        toggle.wash = this.scene.tweens.addCounter({
            from: toggle.mix,
            to: on ? 1 : 0,
            duration: TOGGLE_TIME,
            ease: 'Sine.easeOut',
            onUpdate: (tween) => {
                toggle.mix = tween.getValue();

                const x = toggle.knob.x;
                this.paint(toggle);
                toggle.knob.x = x;
            }
        });

        if (key === 'vibration' && on) Settings.buzz(BUZZ_MS, this.scene.game);
    }

    apply() {
        const music = this.state.music;
        const sound = this.state.sound;
        const manager = this.scene.sound;
        const tracks = soundsData.music || [];

        for (let i = 0; i < manager.sounds.length; i++) {
            const playing = manager.sounds[i];

            playing.setMute(tracks.indexOf(playing.key) === -1 ? !sound : !music);
        }

        manager.mute = !music && !sound;

        this.scene.game.settings = this.state;
        this.scene.events.emit('settings:changed', this.state);
    }

    static buzz(ms = BUZZ_MS, game = null) {
        const state = (game && game.settings) || null;

        if (state && !state.vibration) return;
        if (!navigator.vibrate) return;

        navigator.vibrate(ms);
    }


    show() {
        if (this.isOpen) return;

        this.isOpen = true;

        this.gear.disableInteractive();

        if (this.scene.gamePlay) this.scene.gamePlay.detachInput();

        this.modal.visible = true;
        this.dim.alpha = 0;
        this.card.setScale(OPEN_FROM);
        this.card.alpha = 0;

        this.scene.tweens.killTweensOf(this.dim);
        this.scene.tweens.killTweensOf(this.card);

        this.scene.tweens.add({
            targets: this.dim,
            alpha: DIM_ALPHA,
            duration: OPEN_TIME,
            ease: 'Quad.easeOut'
        });

        this.scene.tweens.add({
            targets: this.card,
            scale: 1,
            alpha: 1,
            duration: OPEN_TIME,
            ease: 'Back.easeOut'
        });
    }

    hide() {
        if (!this.isOpen) return;

        this.isOpen = false;

        this.scene.tweens.killTweensOf(this.dim);
        this.scene.tweens.killTweensOf(this.card);

        this.scene.tweens.add({
            targets: this.dim,
            alpha: 0,
            duration: SHUT_TIME,
            ease: 'Quad.easeIn'
        });

        this.scene.tweens.add({
            targets: this.card,
            scale: SHUT_TO,
            alpha: 0,
            duration: SHUT_TIME,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.modal.visible = false;
                this.card.setScale(1);
                this.card.alpha = 1;

                this.gear.setInteractive();

                if (this.scene.gamePlay) this.scene.gamePlay.attachInput();
            }
        });
    }


    adjust() {
        this.x = dimensions.gameWidth / 2;
        this.y = dimensions.gameHeight / 2;

        this.dim.setSize(dimensions.actualWidth, dimensions.actualHeight);

        if (this.dim.input) this.dim.input.hitArea.setSize(dimensions.actualWidth, dimensions.actualHeight);

        this.fitter.setScale(Math.min(
            1,
            (dimensions.gameHeight - MODAL_MARGIN * 2) / PANEL_H,
            (dimensions.gameWidth - MODAL_MARGIN * 2) / PANEL_W
        ));

        this.gear.x = -dimensions.gameWidth / 2 + GEAR_X;
        this.gear.y = -dimensions.gameHeight / 2 + GEAR_Y;
    }
}