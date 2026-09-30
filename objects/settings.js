import soundsData from "../sounds-data.js";
import { openModal, shutModal } from "../utils/modal.js";
import { pressable } from "../utils/buttons.js";

const PANEL_W = 470;
const PANEL_H = 600;

const PANEL_SCALE = 0.56;
const PANEL_PAD_X = 44;
const PANEL_PAD_Y = 131;
const PANEL_CORNER_X = 125;
const PANEL_CORNER_Y = 150;

const PANEL_DRIFT_Y = -1.5;

const MODAL_MARGIN = 24;
// The card sits this far below the middle, so it is fitted as if that much taller at both ends.
const CARD_DROP = 17;

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

// The panel runs this much further down than the rows need, to fit the reset
// link under Done.
const RESET_EXTRA = 70;
const RESET_Y = 300;
const RESET_SIZE = 28;
const RESET_INK = '#d0406a';
const RESET_HIT_W = 240;
const RESET_HIT_H = 60;

// The card that asks before the progress is wiped.
const CONFIRM_W = 400;
const CONFIRM_H = 340;
const CONFIRM_DIM_ALPHA = 0.45;
const CONFIRM_TITLE_Y = -110;
const CONFIRM_TITLE_SIZE = 40;
const CONFIRM_LINE_Y = -32;
const CONFIRM_LINE_SIZE = 24;
const CONFIRM_LINE = 'Your level, coins and boosters\nwill all start over.';
const CONFIRM_BUY_Y = 58;
const CONFIRM_BUTTON_SCALE = 0.4;
const CONFIRM_BUTTON_SIZE = 38;
const CONFIRM_CANCEL_Y = 124;
const CONFIRM_CANCEL_SIZE = 26;
const CONFIRM_CANCEL_INK = '#8a3be0';

const GEAR_X = 84;
const GEAR_Y = 62;
const GEAR_BASE_SCALE = 0.524;
const GEAR_ICON_SCALE = 0.58;
const GEAR_HIT = 104;

// In a level the clock takes the top left, so the gear moves over to the
// storyboard's top-right button spot and turns into the blue pause button.
// It opens the same panel, which stops the clock while it is up.
const PLAY_GEAR_X = 102;
const PLAY_GEAR_Y = 52;

const PAUSE_SIZE = 60;

const PAUSE_FACE = 'button_blue';
// The button in the art is 144 tall, with 50 clear on either side of it. Its
// round ends are kept whole and the middle stretched.
const PAUSE_FACE_SCALE = PAUSE_SIZE / 144;
const PAUSE_PAD = 50;
const PAUSE_CORNER = 110;
const PAUSE_ICON_Y = -2;
const PAUSE_ICON_SCALE = 0.5;


// The gear (or pause button) pops in with a turn as its screen comes on.
const GEAR_INTRO_TIME = 460;
const GEAR_INTRO_DELAY = 180;
const GEAR_INTRO_TURN = -120;

const ROWS = [
    { key: 'music', icon: 'icons/icon-music', label: 'Music' },
    { key: 'sound', icon: 'icons/icon-sound', label: 'Sound' },
    { key: 'vibration', icon: 'icons/icon-vibration', label: 'Vibration' }
];

const STORE_KEY = 'baggage-out.settings';

// Every save the game makes is under this prefix: the level, coins, boosters
// and unlocks. The reset clears them all but the settings above, which are
// the player's preferences rather than progress.
const SAVE_PREFIX = 'baggage-out.';

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
        this.docked = false;
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

        const pause = this.scene.add.container(0, 0);

        const face = this.scene.add.nineslice(
            0, 0, PAUSE_FACE, null,
            PAUSE_SIZE / PAUSE_FACE_SCALE + PAUSE_PAD * 2, 160,
            PAUSE_CORNER, PAUSE_CORNER, 0, 0
        );
        face.setScale(PAUSE_FACE_SCALE);
        pause.add(face);

        const bars = this.scene.add.sprite(0, PAUSE_ICON_Y, 'sheet', 'icons/icon-pause');
        bars.setScale(PAUSE_ICON_SCALE);
        pause.add(bars);

        gear.add(pause);

        this.gearFace = [base, icon];
        this.pauseFace = pause;

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
            0, PANEL_DRIFT_Y + RESET_EXTRA / 2, 'panel_modal', null,
            PANEL_W / PANEL_SCALE + PANEL_PAD_X,
            (PANEL_H + RESET_EXTRA) / PANEL_SCALE + PANEL_PAD_Y,
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

        const reset = this.scene.add.container(0, RESET_Y);
        reset.add(this.label(0, 0, 'Reset Game', RESET_SIZE, RESET_INK));
        this.pressable(reset, RESET_HIT_W, RESET_HIT_H, () => this.showConfirm());
        card.add(reset);

        this.buildConfirm(fitter);

        modal.visible = false;

        this.modal = modal;
        this.fitter = fitter;
        this.card = card;
        this.add(modal);
    }

    buildConfirm(fitter) {
        const confirm = this.scene.add.container(0, 0);

        confirm.dim = this.scene.add.rectangle(0, 0, PANEL_W * 4, PANEL_H * 4, DIM, CONFIRM_DIM_ALPHA);
        confirm.dim.setInteractive();
        confirm.add(confirm.dim);

        const card = this.scene.add.container(0, 0);
        confirm.add(card);

        card.add(this.scene.add.nineslice(
            0, 0, 'panel_modal', null,
            CONFIRM_W / PANEL_SCALE + PANEL_PAD_X,
            CONFIRM_H / PANEL_SCALE + PANEL_PAD_Y,
            PANEL_CORNER_X, PANEL_CORNER_X, PANEL_CORNER_Y, PANEL_CORNER_Y
        ).setScale(PANEL_SCALE));

        const catcher = this.scene.add.zone(0, 0, CONFIRM_W, CONFIRM_H);
        catcher.setInteractive();
        card.add(catcher);

        card.add(this.label(0, CONFIRM_TITLE_Y, 'Reset game?', CONFIRM_TITLE_SIZE, INK));

        const line = this.label(0, CONFIRM_LINE_Y, CONFIRM_LINE, CONFIRM_LINE_SIZE, INK);
        line.setAlign('center');
        card.add(line);

        const yes = this.scene.add.container(0, CONFIRM_BUY_Y);
        const face = this.scene.add.sprite(0, 0, 'button_purple');
        face.setScale(CONFIRM_BUTTON_SCALE);
        yes.add(face);
        yes.add(this.label(0, -3, 'Reset', CONFIRM_BUTTON_SIZE, '#ffffff'));
        this.pressable(yes, face.displayWidth, face.displayHeight, () => this.resetGame());
        card.add(yes);

        const cancel = this.scene.add.container(0, CONFIRM_CANCEL_Y);
        cancel.add(this.label(0, 0, 'Cancel', CONFIRM_CANCEL_SIZE, CONFIRM_CANCEL_INK));
        this.pressable(cancel, RESET_HIT_W, RESET_HIT_H, () => this.hideConfirm());
        card.add(cancel);

        confirm.card = card;
        confirm.visible = false;
        // Back on the middle of the screen, where the fitter is not.
        confirm.y = RESET_EXTRA / 2 - CARD_DROP;

        this.confirm = confirm;
        fitter.add(confirm);
    }

    label(x, y, content, size, color) {
        const text = this.scene.add.text(x, y, content, {
            fontFamily: 'FredokaOne_Regular',
            fontSize: size,
            color: color
        });

        text.setOrigin(.5);
        text.setResolution(this.textRes);

        return text;
    }

    showConfirm() {
        if (this.confirm.visible) return;

        this.confirm.visible = true;
        openModal(this.scene, this.confirm.dim, this.confirm.card, CONFIRM_DIM_ALPHA);
    }

    hideConfirm() {
        if (!this.confirm.visible || this.resetting) return;

        shutModal(this.scene, this.confirm.dim, this.confirm.card, () => {
            this.confirm.visible = false;
        });
    }

    /**
     * Wipes every saved bit of progress and starts the game over. The pieces
     * that read their saves did so as they were built, so the page is loaded
     * again rather than each one being put back by hand.
     */
    resetGame() {
        if (this.resetting) return;

        this.resetting = true;

        try {
            const storage = window.localStorage;
            const keys = [];

            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);

                if (key && key.indexOf(SAVE_PREFIX) === 0 && key !== STORE_KEY) keys.push(key);
            }

            keys.forEach((key) => storage.removeItem(key));
        } catch (e) {
            // Nothing saved to clear, or no way to clear it; the reload still
            // starts over from what is there.
        }

        window.location.reload();
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
        pressable(this.scene, target, width, height, onPress, feedback);
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

        this.confirm.visible = false;
        this.gear.disableInteractive();

        // The clock stands still while the panel is up and the board can't be played.
        if (this.scene.gamePlay) {
            this.scene.gamePlay.detachInput();
            this.scene.gamePlay.paused = true;
        }

        this.modal.visible = true;
        openModal(this.scene, this.dim, this.card, DIM_ALPHA);
    }

    hide() {
        if (!this.isOpen) return;

        this.isOpen = false;

        shutModal(this.scene, this.dim, this.card, () => {
            this.modal.visible = false;

            this.gear.setInteractive();

            if (this.scene.gamePlay) {
                this.scene.gamePlay.attachInput();
                this.scene.gamePlay.paused = false;
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
            (dimensions.gameHeight - MODAL_MARGIN * 2) / (PANEL_H + RESET_EXTRA + CARD_DROP * 2),
            (dimensions.gameWidth - MODAL_MARGIN * 2) / PANEL_W
        ));

        // Centred on the panel, which runs RESET_EXTRA further down than up.
        this.fitter.x = 0;
        this.fitter.y = (CARD_DROP - RESET_EXTRA / 2) * this.fitter.scaleY;

        this.placeGear();
    }

    introGear() {
        const gear = this.gear;
        const rest = gear.restScale || 1;

        this.scene.tweens.killTweensOf(gear);

        gear.setScale(0);
        gear.angle = GEAR_INTRO_TURN;

        this.scene.tweens.add({
            targets: gear,
            scale: rest,
            angle: 0,
            duration: GEAR_INTRO_TIME,
            delay: GEAR_INTRO_DELAY,
            ease: 'Back.easeOut'
        });
    }

    /** Moves the gear to its in-level corner (true) or back home (false). */
    dock(inLevel) {
        this.docked = inLevel;
        this.placeGear();
    }

    placeGear() {
        this.gearFace.forEach((part) => part.visible = !this.docked);
        this.pauseFace.visible = this.docked;

        this.gear.x = this.docked ?
            dimensions.gameWidth / 2 - PLAY_GEAR_X :
            -dimensions.gameWidth / 2 + GEAR_X;
        this.gear.y = -dimensions.gameHeight / 2 + (this.docked ? PLAY_GEAR_Y : GEAR_Y);
    }
}