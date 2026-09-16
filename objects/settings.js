import soundsData from "../sounds-data.js";

// Sampled off the storyboard: a white card floated over the dimmed screen, the
// title ruled off from three toggle rows, and a purple Done button across the
// foot of it. Every number below was measured on that frame and carried into
// the 540x960 space the rest of the game is laid out in.

const PANEL_W = 470;
const PANEL_H = 600;

// panel_modal.png carries its own shadow as transparent padding, so the card is
// nine-sliced out to the size wanted and the padding added back around it. The
// whole thing is then scaled down as one, which keeps the border weight and the
// corner rounding in proportion instead of smearing them along the edges.
const PANEL_SCALE = 0.28;
const PANEL_PAD_X = 88;
const PANEL_PAD_Y = 263;
const PANEL_CORNER_X = 250;
const PANEL_CORNER_Y = 300;

// That padding is a little deeper above than below - the shadow falls downwards
// - so the card itself sits this far up of the middle of the art.
const PANEL_DRIFT_Y = -1.5;

// The narrow way of the screen the card is never allowed inside of. Portrait
// has room to spare; landscape does not, and the card is shrunk to fit rather
// than run off the top and bottom of it.
const MODAL_MARGIN = 24;

const DIM = 0x101a33;
const DIM_ALPHA = 0.55;

const INK = '#283085';
// The storyboard rules a hair under the white of its card; panel_modal.png is
// a shade of lavender rather than white, so the rules are dropped the same
// distance under that instead and stay as faint as they read there.
const RULE = 0xded9f4;
const RULE_THICK = 3;
const RULE_HALF = 203;

const TITLE_X = -200;
const TITLE_Y = -242;
const TITLE_SIZE = 58;

const CLOSE_X = 193;
const CLOSE_Y = -250;
const CLOSE_SCALE = 0.36;
const CLOSE_HIT = 78;

// Three rows, evenly spaced, each ruled off from the one above it.
const ROW_Y = [-128, -15, 99];
const RULE_Y = [-188, -71, 42];

const ICON_X = -158;
const ICON_SCALE = 0.38;

const LABEL_X = -84;
const LABEL_SIZE = 34;

// The toggles hang off the right hand end of the rules rather than off a centre
// of their own, so their ends line up with the rows above and below.
const TOGGLE_X = 140;
const TOGGLE_SCALE = 0.33;
const KNOB_TRAVEL = 44;
const TOGGLE_OFF = 0xb7b8c3;
const TOGGLE_ON = 0xffffff;
const TOGGLE_TIME = 170;

// The whole row answers to a tap, not just the switch on the end of it - a
// thumb aimed at the word Vibration has asked for the same thing as one aimed
// at the toggle. The rows are ruled off from each other, so a hit area that
// fills the space between two rules can never be mistaken for its neighbour.
const ROW_HIT_W = RULE_HALF * 2;
const ROW_HIT_H = 113;

const DONE_Y = 225;
const DONE_SCALE = 0.308;

// The face of the button rather than the sprite it is drawn from: the art
// carries a wide margin of nothing either side, which was picking up taps well
// clear of anything the player can see.
const DONE_HIT_W = 416;
const DONE_HIT_H = 100;

// The button art has a lip along its bottom edge, so the label sits above the
// middle of the sprite to read as centred on the face of it.
const DONE_TEXT_Y = 220;
const DONE_SIZE = 54;

// The gear, where the storyboard has it: top left of the design box, clear of
// everything the game itself draws.
const GEAR_X = 84;
const GEAR_Y = 62;
const GEAR_BASE_SCALE = 0.262;
const GEAR_ICON_SCALE = 0.29;
const GEAR_HIT = 104;

// The card is thrown a little past full and settles back; closing is quicker
// and drops straight out, so a Done never holds the game up.
const OPEN_TIME = 300;
const SHUT_TIME = 170;
const OPEN_FROM = 0.72;
const SHUT_TO = 0.86;

// A press sinks the thing under the finger rather than tinting it.
const PRESS = 0.94;
const PRESS_TIME = 90;

const ROWS = [
    { key: 'music', icon: 'icons/icon_music', label: 'Music' },
    { key: 'sound', icon: 'icons/icon_sound', label: 'Sound' },
    { key: 'vibration', icon: 'icons/icon_vibration', label: 'Vibration' }
];

const STORE_KEY = 'baggage-out.settings';

// What the storyboard shows on a fresh install: music and sound on, vibration
// off.
const DEFAULTS = { music: true, sound: true, vibration: false };

// How long a toggled-on vibration buzzes for, so the switch answers back.
const BUZZ_MS = 18;

function readStore() {
    const state = Object.assign({}, DEFAULTS);

    try {
        const saved = JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}');

        for (const key in DEFAULTS) {
            if (typeof saved[key] === 'boolean') state[key] = saved[key];
        }
    } catch (e) {
        // Private browsing, a wiped store, something half written - the
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

/**
 * The gear button and the card it opens.
 *
 * Both live here so the settings are one thing to drop into a scene: add it,
 * call adjust() when the screen changes, and everything else - what is on, what
 * is remembered, what the sound manager is told - is handled inside.
 */
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

    // ---- build ----------------------------------------------------------

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

        const icon = this.scene.add.sprite(0, 0, 'sheet', 'icons/icon_gear');
        icon.setScale(GEAR_ICON_SCALE);
        gear.add(icon);

        this.pressable(gear, GEAR_HIT, GEAR_HIT, () => this.show());

        this.gear = gear;
        this.add(gear);
    }

    buildModal() {
        const modal = this.scene.add.container(0, 0);

        // Sized in adjust(), where the bleed the screen actually has is known.
        this.dim = this.scene.add.rectangle(0, 0, 10, 10, DIM, DIM_ALPHA);
        this.dim.setInteractive();
        modal.add(this.dim);

        // The card is sized by the tweens that open and shut it, so the fit to
        // the screen is kept on a layer of its own between them.
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
            fontFamily: 'Oduda-Bold-Demo',
            fontSize: TITLE_SIZE,
            color: INK
        });
        title.setOrigin(0, .5);
        title.setResolution(this.textRes);
        card.add(title);

        const close = this.scene.add.container(CLOSE_X, CLOSE_Y);
        const cross = this.scene.add.sprite(0, 0, 'sheet', 'icons/icon_close');
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
            fontFamily: 'Oduda-Bold-Demo',
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
            fontFamily: 'Oduda-Bold-Demo',
            fontSize: LABEL_SIZE,
            color: INK
        });
        label.setOrigin(0, .5);
        label.setResolution(this.textRes);
        card.add(label);

        const toggle = this.scene.add.container(TOGGLE_X, y);

        // The white track is tinted for the off state and left alone for the on
        // one, where the green pill is faded in over it. That leaves the light
        // rim of the track showing around the green, which is what the
        // storyboard has.
        toggle.track = this.scene.add.sprite(0, 0, 'sheet', 'ui/toggle_base_white');
        toggle.track.setScale(TOGGLE_SCALE);
        toggle.add(toggle.track);

        toggle.fill = this.scene.add.sprite(0, 0, 'sheet', 'ui/toggle_fill_green');
        toggle.fill.setScale(TOGGLE_SCALE);
        toggle.add(toggle.fill);

        toggle.knob = this.scene.add.sprite(0, 0, 'sheet', 'ui/toggle_knob');
        toggle.knob.setScale(TOGGLE_SCALE);
        toggle.add(toggle.knob);

        toggle.mix = this.state[row.key] ? 1 : 0;

        this.paint(toggle);

        this.toggles[row.key] = toggle;
        card.add(toggle);

        // Over the top of the row it covers, so it is the first thing a tap
        // anywhere along that row finds. The switch is what sinks under the
        // finger, wherever on the row the finger actually landed.
        const hot = this.scene.add.zone(0, y, ROW_HIT_W, ROW_HIT_H);

        this.pressable(hot, ROW_HIT_W, ROW_HIT_H, () => this.flip(row.key), toggle);
        card.add(hot);
    }

    /**
     * A tap target that sinks under the finger and fires when it is let go of.
     * Sliding off the target lifts it again and calls the press off, so a
     * mis-hit can be taken back rather than having to be undone.
     */
    pressable(target, width, height, onPress, feedback = target) {
        feedback.restScale = feedback.scaleX;

        // The hit area is given from a top left corner of 0,0 rather than
        // centred on the target: Phaser adds the display origin to a point
        // before it tests it, so a rectangle centred here as well would be
        // counted twice over and sit half its own size up and to the left of
        // the thing it is meant to cover.
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

    // ---- toggles --------------------------------------------------------

    /** Lays a toggle out for whatever mix of off (0) and on (1) it is sitting at. */
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

        // The knob is thrown with a little overshoot, so the track is coloured
        // off a mix of its own that only ever runs between off and on.
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

    // ---- state ----------------------------------------------------------

    /**
     * Hands the settings to everything that has to act on them: the sounds
     * already built are muted a group at a time, the manager itself covers the
     * one-shots that are played straight off it, and the state is left where
     * the rest of the game can read it.
     */
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

    /** Buzzes the handset, if it has one and the player has asked for it. */
    static buzz(ms = BUZZ_MS, game = null) {
        const state = (game && game.settings) || null;

        if (state && !state.vibration) return;
        if (!navigator.vibrate) return;

        navigator.vibrate(ms);
    }

    // ---- open and close -------------------------------------------------

    show() {
        if (this.isOpen) return;

        this.isOpen = true;

        this.gear.disableInteractive();

        // The board listens on the scene's own pointer events, which a panel
        // laid over the top of it cannot swallow, so it is taken off the input
        // for as long as the card is up.
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

    // ---- layout ---------------------------------------------------------

    adjust() {
        this.x = dimensions.gameWidth / 2;
        this.y = dimensions.gameHeight / 2;

        // The dim covers the bleed as well as the design box, so nothing of the
        // game shows past the edges of it on a tall screen.
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