import { bakeShape } from '../utils/bake.js';
import { unlocks } from './boosterUnlocks.js';

// The first time a booster is there to use, the level stops and shows how:
// the button is unlocked in front of the player, everything else dims, and an
// arrow asks for a tap on it. The tap plays the booster for real, and free -
// the hint lights a convoy's way home; the remove asks for a convoy and takes
// it off - and a card then says in a line what it does. "Got it!" hands the
// level back, clock and all.

const DIM = 0x101a33;
const DIM_ALPHA = 0.62;
const DIM_TIME = 260;

// The hole left in the dim over the button, and the ring pulsing round it.
const SPOT_R = 62;
// Gold, the game's colour for "this one" (the arrow, the booster glow, the
// hint's ring), edged in white like the arrow so it holds up on the dim.
const RING = 0xffc93c;
const RING_EDGE = 0xffffff;
const RING_THICK = 5;
const RING_EDGE_THICK = 3;
const RING_PULSE = 1.12;
const RING_TIME = 520;

// The arrow over whatever is to be tapped, bobbing down at it.
const ARROW = 0xffc93c;
const ARROW_EDGE = 0xffffff;
const ARROW_GAP = 58;
const ARROW_BOB = 12;
const ARROW_BOB_TIME = 380;

// The line over the arrow saying what to do.
const BUBBLE_H = 78;
const BUBBLE_PAD = 26;
const BUBBLE_GAP = 44;
const BUBBLE_FILL = 0xffffff;
const BUBBLE_EDGE = 0xa66cf2;
const BUBBLE_EDGE_THICK = 4;
const BUBBLE_MARGIN = 14;
const KICKER_SIZE = 20;
const BUBBLE_SIZE = 28;
const INK = '#283085';
const PURPLE = '#8a3be0';

// The card that says what the booster did.
const CARD_W = 440;
const CARD_H = 206;
const CARD_MARGIN = 14;
const CARD_BOTTOM = 34;
const CARD_TOP = 24;
const CARD_ICON_X = -150;
const CARD_ICON_SCALE = 0.62;
const CARD_TEXT_X = -92;
const CARD_TITLE_Y = -44;
const CARD_TITLE_SIZE = 34;
const CARD_BODY_Y = 4;
const CARD_BODY_SIZE = 21;
const CARD_BODY_W = 290;
const CARD_BUTTON_Y = CARD_H / 2 + 6;
const CARD_BUTTON_W = 220;
const CARD_BUTTON_H = 66;
const CARD_BUTTON_SIZE = 34;
const CARD_STROKE = '#1d8a12';
const CARD_POP_TIME = 380;
const CARD_SHUT_TIME = 220;
// In landscape the card is kept smaller, over the foot of the board.
const WIDE_CARD_SCALE = 0.72;

// How long the unlock plays before the arrow comes; long enough for the
// buttons to have risen in under the board.
const LESSON_WAIT = 820;

// The tap on the lit button: the ring bursts out from it as the dim, arrow
// and bubble fade, rather than all of it blinking off at once.
const GUIDE_OUT_TIME = 260;
const RING_BURST = 1.7;
// The hint is left to run by itself this long (one wave out to the garage)
// before the card comes up to say what it was.
const EXPLAIN_WAIT = 900;


const LESSONS = {
    hint: {
        name: 'Hint',
        icon: 'icons/icon-hint',
        body: 'Lights up a convoy that can drive home right now, and the way to its garage.'
    },
    remove: {
        name: 'Remove',
        icon: 'icons/icon-recycle',
        body: 'Takes any convoy off the board. Save it for one that is stuck in the way!',
        pick: 'Tap a convoy to remove it'
    }
};

export class BoosterTutorial extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));
        this.key = null;
        this.spot = null;

        // Swallows every tap but those in the spot.
        this.blocker = this.scene.add.zone(0, 0, 10, 10);
        this.blocker.setOrigin(0);
        this.add(this.blocker);

        this.dim = this.scene.add.rectangle(0, 0, 10, 10, DIM, 1);
        this.dim.setOrigin(0);
        this.add(this.dim);

        this.hole = this.scene.make.graphics({ add: false });
        this.dim.setMask(this.hole.createGeometryMask());
        this.dim.mask.setInvertAlpha(true);

        const ringR = SPOT_R + RING_THICK / 2 + RING_EDGE_THICK;

        this.ring = bakeShape(this.scene, {
            left: -ringR, top: -ringR,
            width: ringR * 2, height: ringR * 2
        }, (g) => {
            g.lineStyle(RING_THICK + RING_EDGE_THICK * 2, RING_EDGE, 1);
            g.strokeCircle(0, 0, SPOT_R);
            g.lineStyle(RING_THICK, RING, 1);
            g.strokeCircle(0, 0, SPOT_R);
        }, 'lesson-ring');
        this.add(this.ring);

        this.arrow = bakeShape(this.scene, { left: -26, top: -44, width: 52, height: 50 }, (g) => {
            // Pointing down, its tip at 0,0.
            g.fillStyle(ARROW_EDGE, 1);
            g.fillRoundedRect(-14, -44, 28, 30, 6);
            g.fillTriangle(-26, -20, 26, -20, 0, 6);
            g.fillStyle(ARROW, 1);
            g.fillRoundedRect(-9, -40, 18, 26, 4);
            g.fillTriangle(-19, -17, 19, -17, 0, 0);
        }, 'lesson-arrow');
        this.add(this.arrow);

        this.buildBubble();
        this.buildCard();

        this.visible = false;
    }

    get bar() {
        return this.scene.boosterBar;
    }

    get gamePlay() {
        return this.scene.gamePlay;
    }

    text(x, y, content, size, color, originX = .5, stroke = null) {
        const style = { fontFamily: 'FredokaOne_Regular', fontSize: size, color: color };

        if (stroke) {
            style.stroke = stroke;
            style.strokeThickness = Math.round(size / 11);
        }

        const text = this.scene.add.text(x, y, content, style);
        text.setOrigin(originX, .5);
        text.setResolution(this.textRes);

        return text;
    }

    buildBubble() {
        this.bubble = this.scene.add.container(0, 0);

        this.bubble.back = this.scene.add.graphics();
        this.bubble.add(this.bubble.back);

        this.bubble.kicker = this.text(0, -BUBBLE_H / 2 + 22, '', KICKER_SIZE, PURPLE);
        this.bubble.add(this.bubble.kicker);

        this.bubble.line = this.text(0, 0, '', BUBBLE_SIZE, INK);
        this.bubble.add(this.bubble.line);

        this.add(this.bubble);
    }

    // The bubble sized to its words, with a small kicker line over them or not.
    say(kicker, line) {
        const bubble = this.bubble;
        const height = kicker ? BUBBLE_H + 20 : BUBBLE_H - 14;

        bubble.kicker.setText(kicker || '');
        bubble.kicker.visible = !!kicker;
        bubble.kicker.y = -height / 2 + 24;

        bubble.line.setText(line);
        bubble.line.y = kicker ? 12 : 0;

        const width = Math.max(bubble.line.width, bubble.kicker.width) + BUBBLE_PAD * 2;

        bubble.back.clear();
        bubble.back.fillStyle(DIM, 0.25);
        bubble.back.fillRoundedRect(-width / 2, -height / 2 + 5, width, height, height / 3);
        bubble.back.fillStyle(BUBBLE_FILL, 1);
        bubble.back.lineStyle(BUBBLE_EDGE_THICK, BUBBLE_EDGE, 1);
        bubble.back.fillRoundedRect(-width / 2, -height / 2, width, height, height / 3);
        bubble.back.strokeRoundedRect(-width / 2, -height / 2, width, height, height / 3);

        bubble.bubbleW = width;
        bubble.bubbleH = height;
    }

    buildCard() {
        const screen = this.scene.levelScreen;
        const card = this.scene.add.container(0, 0);

        card.add(screen.panel(CARD_W, CARD_H));

        // Taps on the card stay on it.
        const catcher = this.scene.add.zone(0, 0, CARD_W, CARD_H);
        catcher.setInteractive();
        card.add(catcher);

        card.icon = this.scene.add.sprite(CARD_ICON_X, -8, 'sheet', LESSONS.hint.icon);
        card.icon.setScale(CARD_ICON_SCALE);
        card.add(card.icon);

        card.title = this.text(CARD_TEXT_X, CARD_TITLE_Y, '', CARD_TITLE_SIZE, INK, 0);
        card.add(card.title);

        card.body = this.text(CARD_TEXT_X, CARD_BODY_Y, '', CARD_BODY_SIZE, INK, 0);
        card.body.setOrigin(0, 0);
        card.body.setWordWrapWidth(CARD_BODY_W);
        card.body.setLineSpacing(2);
        card.add(card.body);

        card.button = screen.green(0, CARD_BUTTON_Y, CARD_BUTTON_W, CARD_BUTTON_H, 'Got it!', CARD_BUTTON_SIZE, () => this.gotIt(), CARD_STROKE);
        card.add(card.button);

        card.visible = false;

        this.card = card;
        this.add(card);
    }

    /** Whether a lesson is under way. */
    get active() {
        return !!this.key;
    }

    /**
     * Teaches one booster, held locked on the bar for it. The level is held
     * still from now until "Got it!".
     */
    teach(key, onDone = null) {
        if (!LESSONS[key]) return;

        this.abort();

        this.key = key;
        this.onDone = onDone;
        this.stage = 'unlocking';

        this.holdLevel();

        this.visible = true;
        this.blocker.setInteractive();
        this.showGuide(false);
        this.card.visible = false;
        this.layout();

        this.wait = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: LESSON_WAIT,
            onComplete: () => {
                this.wait = null;

                this.bar.unlock(key, () => {
                    if (this.key === key) this.askForTap();
                });
            }
        });
    }

    // Everything but the lesson let go of: no drags, no clock.
    holdLevel() {
        const play = this.gamePlay;

        play.dropDrag();
        play.detachInput();
        play.paused = true;

        this.bar.stopPicking();
        this.bar.teaching = (key) => this.pressed(key);
    }

    releaseLevel() {
        const play = this.gamePlay;

        this.bar.teaching = null;
        play.stopPicking();
        play.paused = false;

        if (play.running && !play.finished) play.attachInput();
    }

    // The dim with a hole over the new button, the arrow, and what to do.
    askForTap() {
        const lesson = LESSONS[this.key];

        this.stage = 'tap';
        this.spot = this.bar.buttonPoint(this.key);

        this.say('New booster unlocked!', 'Tap to try ' + lesson.name);
        this.showGuide(true);
        this.layout();

        this.dim.alpha = 0;
        this.scene.tweens.add({ targets: this.dim, alpha: DIM_ALPHA, duration: DIM_TIME, ease: 'Sine.easeOut' });

        this.popIn(this.bubble);
        this.fadeIn(this.arrow);
    }

    pressed(key) {
        if (this.stage !== 'tap' || key !== this.key) return;

        // Taps are held off (the blocker has no hole now) until the booster
        // has done its part and the next thing is asked for.
        this.stage = 'using';

        // Played as a real use looks: the icon pops and glints fly.
        this.bar.used(this.bar.buttons[key]);

        if (key === 'hint') {
            // Free this once: the hint as it would be played, kept lit until
            // the card that explains it is closed. It starts on the tap, and
            // the card waits until it has been seen.
            if (this.gamePlay.showHint()) this.gamePlay.hint.hold = true;

            this.releaseGuide();
            this.later(EXPLAIN_WAIT, () => this.explain());
            return;
        }

        this.bar.glow(this.bar.buttons.remove, true);
        this.releaseGuide(() => this.askForConvoy());
    }

    // The guide lets go of the button it pointed at.
    releaseGuide(onDone = null) {
        const tweens = this.scene.tweens;
        const fading = [this.dim, this.arrow, this.bubble];

        tweens.killTweensOf([this.dim, this.arrow, this.bubble, this.ring]);

        tweens.add({
            targets: this.ring,
            scale: this.ring.restScale * RING_BURST,
            alpha: 0,
            duration: GUIDE_OUT_TIME,
            ease: 'Quad.easeOut'
        });

        tweens.add({
            targets: fading,
            alpha: 0,
            duration: GUIDE_OUT_TIME,
            ease: 'Sine.easeIn'
        });

        // Its own counter, apart from this.wait, so the hint's wait for its
        // card can run alongside it.
        if (this.releasing) this.releasing.remove();

        this.releasing = tweens.addCounter({
            from: 0,
            to: 1,
            duration: GUIDE_OUT_TIME,
            onComplete: () => {
                this.releasing = null;
                this.hideGuide(fading, onDone);
            }
        });
    }

    // Faded out: hidden, and put back to full for the next time it shows.
    hideGuide(fading, onDone) {
        this.showGuide(false);
        this.spot = null;
        this.layout();

        for (let i = 0; i < fading.length; i++) fading[i].alpha = 1;

        if (onDone) onDone();
    }

    // Runs fn after ms on a counter of its own, dropped with the lesson.
    later(ms, fn) {
        if (this.wait) this.wait.remove();

        this.wait = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: ms,
            onComplete: () => {
                this.wait = null;
                fn();
            }
        });
    }

    // Remove: point at a convoy and wait for it to be tapped.
    askForConvoy() {
        const play = this.gamePlay;
        const convoy = play.convoys.find((c) => !c.escaped && c.cells.length);

        if (!convoy) {
            this.bar.glow(this.bar.buttons.remove, false);
            this.explain();
            return;
        }

        // The blocker stays up, so the gear and the other buttons stay shut:
        // the board hears taps on the scene itself, not on a game object, so
        // the pick still reaches it through the blocker.
        this.stage = 'pick';

        const head = play.cellToPixel(play.headCell(convoy).col, play.headCell(convoy).row);

        this.spot = {
            x: play.x + head.x * play.scaleX,
            y: play.y + head.y * play.scaleY,
            board: true
        };

        this.say(null, LESSONS.remove.pick);
        this.showGuide(true, false);
        this.layout();
        this.popIn(this.bubble);
        this.fadeIn(this.arrow);

        play.attachInput();
        play.pickConvoy((picked) => {
            play.detachInput();
            this.bar.glow(this.bar.buttons.remove, false);
            this.showGuide(false);
            this.spot = null;

            play.removeConvoy(picked);

            // Taking the last one off wins the level, and its card comes up
            // over this one; the lesson has been seen all the same.
            if (play.convoys.every((c) => c.escaped || c.swallowing || c === picked)) {
                this.finish();
                return;
            }

            this.explain();
        });
    }

    // The card saying, in a line, what just happened.
    explain() {
        const lesson = LESSONS[this.key];
        const card = this.card;

        this.stage = 'explain';
        this.blocker.setInteractive();
        this.cardAtTop = this.hintLow();

        card.icon.setFrame(lesson.icon);
        card.title.setText(lesson.name);
        card.body.setText(lesson.body);
        card.body.y = CARD_BODY_Y - card.body.height / 2 + 12;
        card.title.y = card.body.y - 26;

        card.visible = true;
        this.layout();

        const rest = card.restScale;

        card.alpha = 0;
        card.setScale(rest * 0.8);

        this.scene.tweens.add({
            targets: card,
            alpha: 1,
            scale: rest,
            duration: CARD_POP_TIME,
            ease: 'Back.easeOut'
        });
    }

    // Whether what the hint lights sits in the lower half of the board, so the
    // card goes over the top of the screen instead of over it.
    hintLow() {
        const play = this.gamePlay;
        const hint = play.hint;

        if (!hint) return false;

        const cells = hint.route.concat(hint.convoy.cells);
        let low = Infinity;
        let high = -Infinity;

        for (let i = 0; i < cells.length; i++) {
            const y = play.cellToPixel(cells[i].col, cells[i].row).y;

            low = Math.min(low, y);
            high = Math.max(high, y);
        }

        return (low + high) / 2 > 0;
    }

    gotIt() {
        if (this.stage !== 'explain') return;

        this.stage = 'closing';

        const card = this.card;

        this.scene.tweens.add({
            targets: card,
            alpha: 0,
            scale: card.restScale * 0.85,
            duration: CARD_SHUT_TIME,
            ease: 'Quad.easeIn'
        });

        // Its own counter, so the hand-back does not hang off the card's tween.
        this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: CARD_SHUT_TIME,
            onComplete: () => this.finish()
        });
    }

    finish() {
        const key = this.key;
        const onDone = this.onDone;

        this.letHintGo();

        unlocks.teach(key);

        this.clear();
        this.releaseLevel();

        if (onDone) onDone();
    }

    letHintGo() {
        const hint = this.gamePlay.hint;

        if (!hint || !hint.hold) return;

        // Let go, it runs once more from the top, then fades as any hint does.
        hint.hold = false;
        hint.time = 0;
    }

    /** Stops a lesson part way, as the level is left. It is taught next time. */
    abort() {
        if (!this.key) return;

        this.letHintGo();
        this.bar.glow(this.bar.buttons[this.key], false);
        this.clear();
        this.bar.teaching = null;
        this.gamePlay.stopPicking();
    }

    clear() {
        if (this.wait) {
            this.wait.remove();
            this.wait = null;
        }

        if (this.releasing) {
            this.releasing.remove();
            this.releasing = null;
        }

        this.scene.tweens.killTweensOf([this.dim, this.card, this.bubble, this.arrow, this.ring]);

        this.key = null;
        this.stage = null;
        this.spot = null;
        this.onDone = null;

        this.card.visible = false;
        this.cardAtTop = false;
        this.showGuide(false);
        this.blocker.disableInteractive();
        this.hole.clear();
        this.visible = false;
    }

    // The arrow and bubble, and with a dim, the dim and its ring.
    showGuide(on, dim = true) {
        this.scene.tweens.killTweensOf([this.arrow, this.ring]);

        this.arrow.visible = on;
        this.bubble.visible = on;
        this.ring.visible = on && dim;
        this.dim.visible = on && dim;

        if (!on) return;

        this.arrow.bob = 0;
        this.scene.tweens.add({
            targets: this.arrow,
            bob: { from: 0, to: 1 },
            duration: ARROW_BOB_TIME,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: () => this.placeArrow()
        });

        if (dim) {
            this.ring.setScale(this.ring.restScale);
            this.ring.alpha = 1;

            this.scene.tweens.add({
                targets: this.ring,
                scale: this.ring.restScale * RING_PULSE,
                alpha: 0.5,
                duration: RING_TIME,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    placeArrow() {
        if (!this.spot) return;

        const reach = this.spot.board ? 30 : ARROW_GAP;

        this.arrow.x = this.spot.x;
        this.arrow.y = this.spot.y - reach - (this.arrow.bob || 0) * ARROW_BOB;
    }

    fadeIn(piece) {
        piece.alpha = 0;

        this.scene.tweens.add({
            targets: piece,
            alpha: 1,
            duration: 200,
            ease: 'Sine.easeOut'
        });
    }

    popIn(piece) {
        piece.alpha = 0;
        piece.setScale(0.8);

        this.scene.tweens.add({
            targets: piece,
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    layout() {
        const left = dimensions.leftOffset;
        const top = dimensions.topOffset;
        const width = dimensions.actualWidth;
        const height = dimensions.actualHeight;

        this.blocker.setPosition(left, top);
        this.blocker.setSize(width, height);

        // The spot is left out of the blocker, so its button takes the tap.
        if (this.blocker.input) {
            this.blocker.input.hitArea.setSize(width, height);
            this.blocker.input.hitAreaCallback = (area, x, y) => {
                if (!Phaser.Geom.Rectangle.Contains(area, x, y)) return false;
                if (!this.spot || this.stage !== 'tap') return true;

                return Phaser.Math.Distance.Between(left + x, top + y, this.spot.x, this.spot.y) > SPOT_R;
            };
        }

        this.dim.setPosition(left, top);
        this.dim.setSize(width, height);

        this.hole.clear();

        if (this.spot) {
            // Masks are drawn in world space.
            const matrix = this.getWorldTransformMatrix();
            const centre = matrix.transformPoint(this.spot.x, this.spot.y);
            const edge = matrix.transformPoint(this.spot.x + SPOT_R, this.spot.y);

            this.hole.fillStyle(0xffffff, 1);
            this.hole.fillCircle(centre.x, centre.y, edge.x - centre.x);

            this.ring.setPosition(this.spot.x, this.spot.y);
            this.placeArrow();

            // Over the arrow, kept on the screen.
            const bubble = this.bubble;
            const half = (bubble.bubbleW || 0) / 2 + BUBBLE_MARGIN;

            bubble.x = Phaser.Math.Clamp(this.spot.x, left + half, left + width - half);
            bubble.y = this.arrow.y - ARROW_BOB - BUBBLE_GAP - (bubble.bubbleH || BUBBLE_H) / 2;
        }

        // The card along the foot of the screen, over the booster buttons, or
        // along the top, over the clock, when the hint is down below.
        const card = this.card;
        const wide = dimensions.isLandscape;
        const fit = Math.min(wide ? WIDE_CARD_SCALE : 1, (width - CARD_MARGIN * 2) / (CARD_W + 30));

        card.restScale = fit;
        card.setScale(fit);
        card.x = dimensions.gameWidth / 2;
        card.y = this.cardAtTop ?
            top + CARD_TOP + (CARD_H / 2 + 12) * fit :
            top + height - CARD_BOTTOM - (CARD_H / 2 + CARD_BUTTON_H / 2) * fit;
    }

    adjust() {
        if (this.key && this.spot && this.stage === 'tap') this.spot = this.bar.buttonPoint(this.key);

        this.layout();
    }
}
