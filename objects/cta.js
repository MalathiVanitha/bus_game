import { pressable } from '../utils/buttons.js';

const PANEL_W = 470;

const WIN_H = 600;
const FAIL_H = 720;

const PANEL_SCALE = 0.56;
const PANEL_PAD_X = 44;
const PANEL_PAD_Y = 131;
const PANEL_CORNER_X = 125;
const PANEL_CORNER_Y = 150;

const MODAL_MARGIN = 24;

const DIM = 0x101a33;
const DIM_ALPHA = 0.55;

const INK = '#283085';
const MUTED = '#6d7793';
const CORAL = '#f4564c';
const LINK = '#2f6fe4';
const LINK_RULE = 0x2f6fe4;

const STARS = 'icon-stars';
const STARS_Y = -212;
const STARS_SCALE = 0.5;

const WIN_TITLE_Y = -104;
const WIN_TITLE_SIZE = 54;

const EARNED_Y = -44;
const EARNED_SIZE = 26;

const COIN_ICON = 'icons/icon-coin';
const COIN_Y = 22;
const COIN_ICON_SCALE = 0.36;
const COIN_GAP = 12;
const COIN_TEXT_SIZE = 62;

const DOUBLE_Y = 120;
const NEXT_Y = 216;

// ---- fail face -------------------------------------------------------------

const CLOCK = 'icons/icon-timer-coral';
const CLOCK_Y = -232;
const CLOCK_SCALE = 0.8;

const FAIL_TITLE_Y = -98;
const FAIL_TITLE_SIZE = 54;

const ASK_Y = -36;
const ASK_SIZE = 28;

const EXTRA_Y = 18;
const EXTRA_SIZE = 44;

const WATCH_Y = 106;

const CAPTION_Y = 173;
const CAPTION_SIZE = 22;

const RETRY_Y = 244;

const HOME_Y = 314;
const HOME_SIZE = 30;
const HOME_HIT_W = 200;
const HOME_HIT_H = 56;

const BUTTON_W = 400;
const BUTTON_H = 86;
const BUTTON_SIZE = 42;

const BUTTON_PAD = 44;
const BUTTON_MIN_SIZE = 26;
const BUTTON_SCALE = 0.35;
const BUTTON_CORNER_X = 120;
const BUTTON_CORNER_Y = 70;

const BADGE = 'icons/icon-video';
const BADGE_SCALE = 0.62;
const BADGE_GAP = 18;

const CONFETTI = [0xf4564c, 0x4a90e2, 0xffc93c, 0x58c26b, 0x8e6bd8, 0x9ad4f5];

const SPRINKLE_LEN = 26;
const SPRINKLE_THICK = 9;

const WIN_SPRINKLES = [
    [-192, -262, -30, 0],
    [-214, -202, 40, 5],
    [-176, -148, -60, 3],
    [-206, -92, 15, 2],
    [-218, -30, -25, 4],
    [-196, 36, 50, 1],
    [192, -258, 30, 1],
    [214, -198, -40, 4],
    [176, -144, 60, 2],
    [206, -88, -15, 3],
    [218, -26, 25, 0],
    [196, 40, -50, 5]
];

const RAY_RX = 140;
const RAY_RY = 104;
const RAY_ANGLES = [-180, -147, -114, -81, -48, -15, 18, 150, 165];

const FAIL_SPRINKLES = [
    [-208, -100, 25, 0],
    [208, -96, -25, 2],
    [-214, -20, -15, 1],
    [214, -16, 15, 3]
];

const POP_PER_CANNON = 30;
const POP_INSET = 12;

const POP_AIM = 66;
const POP_SPREAD = 26;

const POP_SPEED = [520, 980];
const POP_GRAVITY = 1250;
const POP_LIFE = [1100, 1900];
const POP_SPIN = [-520, 520];

const POP_FLUTTER = [6, 13];
const POP_LEN = [10, 30];

const POP_FADE = 0.7;

const FALL_EVERY = 90;
const FALL_FOR = 1600;
const FALL_TIME = [800, 1300];
const FALL_SWAY = 90;

const OPEN_TIME = 300;
const SHUT_TIME = 170;
const OPEN_FROM = 0.72;
const SHUT_TO = 0.86;

const STARS_DELAY = 140;
const STARS_TIME = 420;
const STARS_FROM = 0.4;

const CLOCK_SHAKE = 7;
const CLOCK_SHAKE_TIME = 90;
const CLOCK_SHAKES = 5;

export class CTA extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.userWon = false;
        this.isOpen = false;

        this.value = 100;

        this.init();
    }

    init() {
        this.textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));

        this.dim = this.scene.add.rectangle(0, 0, 10, 10, DIM, DIM_ALPHA);

        this.dim.setInteractive();
        this.add(this.dim);

        this.confettiGrp = this.scene.add.container(0, 0);
        this.add(this.confettiGrp);

        this.fitter = this.scene.add.container(0, 0);
        this.add(this.fitter);

        this.winGroup = this.buildWin();
        this.failGroup = this.buildFail();

        this.popGrp = this.scene.add.container(0, 0);
        this.add(this.popGrp);

        this.visible = false;
    }

    buildWin() {
        const card = this.card(WIN_H);

        for (let i = 0; i < WIN_SPRINKLES.length; i++) {
            const bit = WIN_SPRINKLES[i];

            card.add(this.sprinkle(bit[0], bit[1], bit[2], CONFETTI[bit[3]]));
        }

        this.stars = this.scene.add.sprite(0, STARS_Y, STARS);
        this.stars.setScale(STARS_SCALE);
        card.add(this.stars);

        card.add(this.text(0, WIN_TITLE_Y, 'Level complete!', WIN_TITLE_SIZE, INK));
        card.add(this.text(0, EARNED_Y, 'Coins earned', EARNED_SIZE, MUTED));

        this.coinIcon = this.scene.add.sprite(0, COIN_Y, 'sheet', COIN_ICON);
        this.coinIcon.setScale(COIN_ICON_SCALE);
        card.add(this.coinIcon);

        this.coinText = this.text(0, COIN_Y, String(this.value), COIN_TEXT_SIZE, INK, 0);
        card.add(this.coinText);

        this.centreCoins();

        this.doubleButton = this.button(
            0, DOUBLE_Y, 'button_purple', this.doubleLabel(), true, () => this.double()
        );
        card.add(this.doubleButton);

        card.add(this.button(0, NEXT_Y, 'button_green', 'Next level', false, () => this.next()));

        return card;
    }

    buildFail() {
        const card = this.card(FAIL_H);

        for (let i = 0; i < RAY_ANGLES.length; i++) {
            const angle = RAY_ANGLES[i];
            const rad = Phaser.Math.DegToRad(angle);

            card.add(this.sprinkle(
                Math.cos(rad) * RAY_RX,
                CLOCK_Y + Math.sin(rad) * RAY_RY,
                angle,
                CONFETTI[i % CONFETTI.length]
            ));
        }

        for (let i = 0; i < FAIL_SPRINKLES.length; i++) {
            const bit = FAIL_SPRINKLES[i];

            card.add(this.sprinkle(bit[0], bit[1], bit[2], CONFETTI[bit[3]]));
        }

        this.clock = this.scene.add.sprite(0, CLOCK_Y, 'sheet', CLOCK);
        this.clock.setScale(CLOCK_SCALE);
        card.add(this.clock);

        card.add(this.text(0, FAIL_TITLE_Y, "Time's up!", FAIL_TITLE_SIZE, INK));
        card.add(this.text(0, ASK_Y, 'A little more time?', ASK_SIZE, MUTED));
        card.add(this.text(0, EXTRA_Y, '+30 seconds', EXTRA_SIZE, CORAL));

        card.add(this.button(
            0, WATCH_Y, 'button_green', 'Watch & continue', true, () => this.continue()
        ));

        card.add(this.text(0, CAPTION_Y, 'Watch a video for extra time', CAPTION_SIZE, MUTED));
        card.add(this.button(0, RETRY_Y, 'button_purple', 'Retry', false, () => this.retry()));
        card.add(this.link(0, HOME_Y, 'Home', () => this.home()));

        return card;
    }

    card(height) {
        const card = this.scene.add.container(0, 0);

        card.add(this.scene.add.nineslice(
            0, 0, 'panel_modal', null,
            PANEL_W / PANEL_SCALE + PANEL_PAD_X,
            height / PANEL_SCALE + PANEL_PAD_Y,
            PANEL_CORNER_X, PANEL_CORNER_X, PANEL_CORNER_Y, PANEL_CORNER_Y
        ).setScale(PANEL_SCALE));

        const catcher = this.scene.add.zone(0, 0, PANEL_W, height);
        catcher.setInteractive();
        card.add(catcher);

        card.visible = false;
        this.fitter.add(card);

        return card;
    }

    sprinkle(x, y, angle, color, length = SPRINKLE_LEN, thick = SPRINKLE_THICK) {
        const bit = this.scene.add.graphics();

        bit.fillStyle(color, 1);
        bit.fillRoundedRect(-length / 2, -thick / 2,
            length, thick, Math.min(length, thick) / 2
        );

        bit.setPosition(x, y);
        bit.setAngle(angle);

        return bit;
    }

    button(x, y, art, label, badged, onPress) {
        const button = this.scene.add.container(x, y);

        const face = this.scene.add.nineslice(
            0, 0, art, null,
            BUTTON_W / BUTTON_SCALE, BUTTON_H / BUTTON_SCALE,
            BUTTON_CORNER_X, BUTTON_CORNER_X, BUTTON_CORNER_Y, BUTTON_CORNER_Y
        );

        face.setScale(BUTTON_SCALE);
        button.add(face);

        button.label = this.text(0, -2, label, BUTTON_SIZE, '#ffffff');
        button.add(button.label);

        if (badged) {
            button.badge = this.scene.add.sprite(0, -2, 'sheet', BADGE);

            button.badge.setScale(BADGE_SCALE);
            button.add(button.badge);
        }

        this.layoutButton(button);

        pressable(this.scene, button, BUTTON_W, BUTTON_H, onPress);

        return button;
    }

    layoutButton(button) {
        const text = button.label;
        const badge = button.badge;
        const taken = badge ? badge.displayWidth + BADGE_GAP : 0;
        const room = BUTTON_W - BUTTON_PAD - taken;

        text.setFontSize(BUTTON_SIZE);

        if (text.width > room) {
            text.setFontSize(Math.max(
                BUTTON_MIN_SIZE,
                Math.floor(BUTTON_SIZE * room / text.width)
            ));
        }

        if (!badge) {
            text.x = 0;
            return;
        }

        const span = badge.displayWidth + BADGE_GAP + text.width;

        badge.x = -span / 2 + badge.displayWidth / 2;
        text.x = span / 2 - text.width / 2;
    }

    link(x, y, label, onPress) {
        const link = this.scene.add.container(x, y);
        const text = this.text(0, 0, label, HOME_SIZE, LINK);

        link.add(text);

        link.add(this.scene.add.rectangle(0, text.height / 2 - 2, text.width, 2, LINK_RULE));

        pressable(this.scene, link, HOME_HIT_W, HOME_HIT_H, onPress);

        return link;
    }

    text(x, y, content, size, color, originX = .5) {
        const text = this.scene.add.text(x, y, content, {
            fontFamily: 'FredokaOne_Regular',
            fontSize: size,
            color: color
        });

        text.setOrigin(originX, .5);
        text.setResolution(this.textRes);

        return text;
    }

    doubleLabel() {
        return 'Double to ' + (this.value * 2);
    }

    centreCoins() {
        const span = this.coinIcon.displayWidth + COIN_GAP + this.coinText.width;

        this.coinIcon.x = -span / 2 + this.coinIcon.displayWidth / 2;
        this.coinText.x = span / 2 - this.coinText.width;
    }

    setValue(value) {
        this.value = Math.max(0, Math.floor(value));

        this.coinText.setText(String(this.value));
        this.centreCoins();

        this.relabel(this.doubleButton, this.doubleLabel());
    }

    relabel(button, label) {
        button.label.setText(label);

        this.layoutButton(button);
    }

    double() {
        this.scene.events.emit('cta:double', { coins: this.value * 2 });
        this.hide();
    }

    next() {
        this.scene.events.emit('cta:next', { coins: this.value });
        this.hide();
    }

    continue () {
        this.scene.events.emit('cta:continue', { seconds: 30 });
        this.hide();
    }

    retry() {
        this.scene.events.emit('cta:retry');
        this.hide();
    }

    home() {
        this.scene.events.emit('cta:home');
        this.hide();
    }

    show() {
        if (this.isOpen) return;

        this.isOpen = true;
        this.visible = true;

        this.adjust();

        const card = this.userWon ? this.winGroup : this.failGroup;

        this.winGroup.visible = this.userWon;
        this.failGroup.visible = !this.userWon;

        this.dim.alpha = 0;
        card.setScale(OPEN_FROM);
        card.alpha = 0;

        this.scene.tweens.killTweensOf(this.dim);
        this.scene.tweens.killTweensOf(card);

        this.scene.tweens.add({
            targets: this.dim,
            alpha: DIM_ALPHA,
            duration: OPEN_TIME,
            ease: 'Quad.easeOut'
        });

        this.scene.tweens.add({
            targets: card,
            scale: 1,
            alpha: 1,
            duration: OPEN_TIME,
            ease: 'Back.easeOut',
            onComplete: () => {
                if (this.userWon) {
                    this.popStars();
                    this.pop();
                } else {
                    this.shakeClock();
                }
            }
        });

        if (this.userWon) this.rain();
    }

    popStars() {
        this.scene.tweens.killTweensOf(this.stars);

        this.stars.setScale(STARS_SCALE * STARS_FROM);
        this.stars.alpha = 0;

        this.scene.tweens.add({
            targets: this.stars,
            scale: STARS_SCALE,
            alpha: 1,
            duration: STARS_TIME,
            delay: STARS_DELAY,
            ease: 'Back.easeOut'
        });
    }

    shakeClock() {
        this.scene.tweens.killTweensOf(this.clock);

        this.clock.angle = 0;
        this.scene.tweens.add({
            targets: this.clock,
            angle: { from: -CLOCK_SHAKE, to: CLOCK_SHAKE },
            duration: CLOCK_SHAKE_TIME,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: CLOCK_SHAKES,
            onComplete: () => { this.clock.angle = 0; }
        });
    }

    pop() {
        this.stopPop();

        const scale = this.fitter.scaleX || 1;
        const gravity = POP_GRAVITY * scale;

        const fromX = (PANEL_W / 2 - POP_INSET) * scale;
        const fromY = (WIN_H / 2 - POP_INSET) * scale;

        const pieces = [];

        for (let side = -1; side <= 1; side += 2) {

            const aim = side < 0 ? -POP_AIM : POP_AIM - 180;

            for (let i = 0; i < POP_PER_CANNON; i++) {
                const away = Phaser.Math.DegToRad(aim + Phaser.Math.Between(-POP_SPREAD, POP_SPREAD));
                const speed = Phaser.Math.Between(POP_SPEED[0], POP_SPEED[1]) * scale;

                const bit = this.sprinkle(
                    side * fromX, fromY, 0,
                    CONFETTI[Phaser.Math.Between(0, CONFETTI.length - 1)],
                    Phaser.Math.Between(POP_LEN[0], POP_LEN[1]) * scale,
                    SPRINKLE_THICK * scale
                );

                this.popGrp.add(bit);

                pieces.push({
                    bit: bit,
                    x: bit.x,
                    y: bit.y,
                    vx: Math.cos(away) * speed,
                    vy: Math.sin(away) * speed,
                    spin: Phaser.Math.Between(POP_SPIN[0], POP_SPIN[1]),
                    flutter: Phaser.Math.FloatBetween(POP_FLUTTER[0], POP_FLUTTER[1]),
                    life: Phaser.Math.Between(POP_LIFE[0], POP_LIFE[1]) / 1000
                });
            }
        }

        this.popRun = this.scene.tweens.addCounter({
            from: 0,
            to: POP_LIFE[1] / 1000,
            duration: POP_LIFE[1],
            ease: 'Linear',
            onUpdate: (tween) => this.flyPop(pieces, tween.getValue(), gravity),
            onComplete: () => {
                this.popRun = null;
                this.popGrp.removeAll(true);
            }
        });
    }

    flyPop(pieces, at, gravity) {
        for (let i = 0; i < pieces.length; i++) {
            const piece = pieces[i];
            const spent = at / piece.life;

            if (spent >= 1) {
                piece.bit.visible = false;
                continue;
            }

            piece.bit.x = piece.x + piece.vx * at;
            piece.bit.y = piece.y + piece.vy * at + gravity * at * at / 2;
            piece.bit.angle = piece.spin * at;

            piece.bit.scaleX = Math.cos(piece.flutter * at);

            piece.bit.alpha = spent < POP_FADE ? 1 : 1 - (spent - POP_FADE) / (1 - POP_FADE);
        }
    }

    stopPop() {
        if (this.popRun) {
            this.popRun.remove();
            this.popRun = null;
        }

        this.popGrp.removeAll(true);
    }

    rain() {
        this.stopRain();

        this.fall = this.scene.time.addEvent({
            delay: FALL_EVERY,
            loop: true,
            callback: () => this.fallOne()
        });

        this.fallEnds = this.scene.time.delayedCall(FALL_FOR, () => this.stopRain());
    }

    fallOne() {
        const bit = this.sprinkle(
            Phaser.Math.Between(-dimensions.actualWidth / 2, dimensions.actualWidth / 2), -dimensions.actualHeight / 2,
            Phaser.Math.Between(0, 360),
            CONFETTI[Phaser.Math.Between(0, CONFETTI.length - 1)],
            Phaser.Math.Between(SPRINKLE_THICK, SPRINKLE_LEN)
        );

        this.confettiGrp.add(bit);

        const run = Phaser.Math.Between(FALL_TIME[0], FALL_TIME[1]);

        this.scene.tweens.add({
            targets: bit,
            x: bit.x + Phaser.Math.Between(-FALL_SWAY, FALL_SWAY),
            y: dimensions.actualHeight / 2,
            angle: bit.angle + Phaser.Math.Between(180, 540),
            duration: run,
            ease: 'Linear',
            onComplete: () => bit.destroy()
        });
    }

    stopRain() {
        if (this.fall) {
            this.fall.remove();
            this.fall = null;
        }

        if (this.fallEnds) {
            this.fallEnds.remove();
            this.fallEnds = null;
        }
    }

    hide() {
        if (!this.isOpen) return;

        this.isOpen = false;

        this.stopRain();
        this.stopPop();

        const card = this.userWon ? this.winGroup : this.failGroup;

        this.scene.tweens.killTweensOf(this.dim);
        this.scene.tweens.killTweensOf(card);

        this.scene.tweens.add({
            targets: this.dim,
            alpha: 0,
            duration: SHUT_TIME,
            ease: 'Quad.easeIn'
        });

        this.scene.tweens.add({
            targets: card,
            scale: SHUT_TO,
            alpha: 0,
            duration: SHUT_TIME,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.visible = false;
                this.confettiGrp.removeAll(true);

                card.setScale(1);
                card.alpha = 1;
                card.visible = false;
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
            (dimensions.gameHeight - MODAL_MARGIN * 2) / FAIL_H,
            (dimensions.gameWidth - MODAL_MARGIN * 2) / PANEL_W
        ));
    }
}