import { bakeShape, dropBaked } from '../utils/bake.js';
import { fitText } from '../utils/text.js';
import { hintArrowImage, hintTouchImage } from './game-play.js';

// The very first level shows how to play before anything else, every time it
// is played: the whole
// screen goes soft and dim behind a blur, all but one convoy - one that can
// drive straight home - and its garage, which stay sharp inside pulsing gold
// rings. A
// fingertip drags it home over the blur along a line of arrows, and a bubble
// says what to do. Only that convoy can be taken hold of; doing so lifts the
// blur and the level goes on from that drag.
//
// The blur is one snapshot of the canvas, taken once the level has landed,
// blurred small on the CPU and stretched back over the screen: a single quad
// a frame, rather than a blur shader over everything. The convoy's and the
// garage's spots are cut out of it, so what shows through there is the live
// board.

// How long the level has to land - board, clock, badge and boosters - before
// its picture is taken.
const LESSON_WAIT = 1100;

// The snapshot is blurred at this many pixels per game unit, then stretched.
const BLUR_RES = 0.25;
// Box blur radius in those pixels, run this many times (three is near enough
// a gaussian).
const BLUR_RADIUS = 2;
const BLUR_PASSES = 3;
const SHADE = 'rgba(16, 26, 51, 0.32)';
const BLUR_TEXTURE = 'first-lesson-blur';

const FADE_IN = 320;
const FADE_OUT = 260;

// The clear spots round the convoy and its garage, in cells, and the ring on
// each one's edge.
const SPOT_PAD = 0.14;
const SPOT_ROUND = 0.32;
const RING = 0xffc93c;
const RING_EDGE = 0xffffff;
const RING_THICK = 5;
const RING_EDGE_THICK = 3;
const RING_PULSE = 1.05;
const RING_TIME = 520;
const RING_TEXTURE = 'first-lesson-ring';

// The arrows along the way and the fingertip dragging along them, sized to
// the cells as the hint's are.
const ARROW_SIZE = 0.56;
const ARROW_ART = 40;
const ARROW_ALPHA = 0.85;
const ARROW_IN = 70;
const ARROW_IN_TIME = 260;
const TOUCH_SIZE = 0.7;
const TOUCH_ART = 44;
const TOUCH_PRESS = 0.8;
const TOUCH_IN = 300;
const TOUCH_CELL = 260;
const TOUCH_OUT = 260;
const TOUCH_REST = 500;
const TOUCH_WAIT = 400;

// The bubble saying what to do, above or below the spot.
const BUBBLE_H = 98;
const BUBBLE_PAD = 26;
const BUBBLE_GAP = 26;
const BUBBLE_MARGIN = 14;
const BUBBLE_FILL = 0xffffff;
const BUBBLE_EDGE = 0xa66cf2;
const BUBBLE_EDGE_THICK = 4;
const BUBBLE_SHADE = 0x101a33;
const KICKER_SIZE = 20;
const LINE_SIZE = 28;
const INK = '#283085';
const PURPLE = '#8a3be0';

// One pass of a box blur along every line of an RGBA buffer, src into dst.
function blurLines(src, dst, lines, length, lineStride, step, r) {
    const size = r * 2 + 1;
    const last = length - 1;

    for (let l = 0; l < lines; l++) {
        const base = l * lineStride;

        for (let c = 0; c < 4; c++) {
            let sum = 0;

            for (let i = -r; i <= r; i++) sum += src[base + Math.min(last, Math.max(0, i)) * step + c];

            for (let i = 0; i < length; i++) {
                dst[base + i * step + c] = sum / size;
                sum += src[base + Math.min(last, i + r + 1) * step + c] - src[base + Math.max(0, i - r) * step + c];
            }
        }
    }
}

function blur(data, width, height, r, passes) {
    const spare = new Uint8ClampedArray(data.length);

    for (let p = 0; p < passes; p++) {
        blurLines(data, spare, height, width, width * 4, 4, r);
        blurLines(spare, data, width, height, 4, width * 4, r);
    }
}

// Fills a box of an RGBA buffer with the average of the pixels just outside
// it.
function fillWithSurround(data, width, height, box) {
    const left = Math.max(0, box.left);
    const top = Math.max(0, box.top);
    const right = Math.min(width - 1, box.right);
    const bottom = Math.min(height - 1, box.bottom);
    const sum = [0, 0, 0, 0];
    let count = 0;

    const take = (x, y) => {
        const at = (y * width + x) * 4;

        for (let c = 0; c < 4; c++) sum[c] += data[at + c];
        count++;
    };

    for (let x = left; x <= right; x++) {
        take(x, top);
        take(x, bottom);
    }

    for (let y = top + 1; y < bottom; y++) {
        take(left, y);
        take(right, y);
    }

    if (!count) return;

    for (let y = top + 1; y < bottom; y++) {
        for (let x = left + 1; x < right; x++) {
            const at = (y * width + x) * 4;

            for (let c = 0; c < 4; c++) data[at + c] = sum[c] / count;
        }
    }
}

function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

export class FirstLesson extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));
        this.target = null;
        this.parts = [];

        // Swallows taps on the buttons and the gear; the board hears taps on
        // the scene itself, so the convoy can still be taken hold of.
        this.blocker = this.scene.add.zone(0, 0, 10, 10);
        this.blocker.setOrigin(0);
        this.add(this.blocker);

        this.buildBubble();

        this.visible = false;
    }

    get gamePlay() {
        return this.scene.gamePlay;
    }

    /** Whether the lesson is under way. */
    get active() {
        return !!this.target;
    }

    /** Teaches the level. Called as level 1 starts. */
    begin() {
        this.abort();

        const play = this.gamePlay;
        const target = play.findHint();

        if (!target) return;

        this.target = target;

        // Held to that one convoy from now, even before the blur comes, so the
        // lesson is not walked past by a grab on another.
        play.lesson = { convoy: target.convoy, onGrab: () => this.grabbed() };

        this.blocker.setInteractive();
        this.layoutBlocker();

        this.wait = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: LESSON_WAIT,
            onComplete: () => {
                this.wait = null;
                this.capture(() => this.show());
            }
        });
    }

    // The screen as it stands, taken at the end of the next frame drawn,
    // while this is hidden. The WebGL canvas can be read from then, before
    // the browser shows it and clears it.
    capture(onDone) {
        const game = this.scene.game;

        this.dropCapture();
        this.visible = false;

        this.capturing = () => {
            this.capturing = null;
            this.bakeBlur(game.canvas);
            onDone();
        };

        game.events.once(Phaser.Core.Events.POST_RENDER, this.capturing);
    }

    dropCapture() {
        if (!this.capturing) return;

        this.scene.game.events.off(Phaser.Core.Events.POST_RENDER, this.capturing);
        this.capturing = null;
    }

    // The snapshot, small, blurred, shaded and with the spots cut out,
    // as the texture laid over the screen.
    bakeBlur(source) {
        const textures = this.scene.textures;
        const width = Math.max(1, Math.round(dimensions.actualWidth * BLUR_RES));
        const height = Math.max(1, Math.round(dimensions.actualHeight * BLUR_RES));

        if (this.blurImage) {
            this.blurImage.destroy();
            this.blurImage = null;
        }

        if (textures.exists(BLUR_TEXTURE)) textures.remove(BLUR_TEXTURE);

        const texture = textures.createCanvas(BLUR_TEXTURE, width, height);
        const ctx = texture.context;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, source.width, source.height, 0, 0, width, height);

        // The spots, in the texture's pixels.
        const spots = this.spots();
        const k = BLUR_RES;
        const pixels = ctx.getImageData(0, 0, width, height);
        const boxes = spots.map((spot) => ({
            left: Math.floor((spot.x - dimensions.leftOffset) * k) - 1,
            top: Math.floor((spot.y - dimensions.topOffset) * k) - 1,
            right: Math.ceil((spot.x + spot.width - dimensions.leftOffset) * k) + 1,
            bottom: Math.ceil((spot.y + spot.height - dimensions.topOffset) * k) + 1
        }));

        // What is in the spots is painted over with the floor round them
        // first, or the blur would smear it out past their edges into a blurry
        // halo round the sharp convoy and garage.
        for (let i = 0; i < boxes.length; i++) fillWithSurround(pixels.data, width, height, boxes[i]);

        blur(pixels.data, width, height, BLUR_RADIUS, BLUR_PASSES);
        ctx.putImageData(pixels, 0, 0);

        ctx.fillStyle = SHADE;
        ctx.fillRect(0, 0, width, height);

        // Cut fully through: destination-out takes away as much as the fill
        // is opaque, and the fill is still the see-through shade.
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000';

        for (let i = 0; i < spots.length; i++) {
            const spot = spots[i];

            roundRectPath(ctx, (spot.x - dimensions.leftOffset) * k, (spot.y - dimensions.topOffset) * k, spot.width * k, spot.height * k, spot.round * k);
            ctx.fill();
        }

        ctx.globalCompositeOperation = 'source-over';

        texture.refresh();

        this.blurImage = this.scene.add.image(dimensions.leftOffset, dimensions.topOffset, BLUR_TEXTURE);
        this.blurImage.setOrigin(0);
        this.blurImage.setDisplaySize(dimensions.actualWidth, dimensions.actualHeight);

        // Under the blocker's place in the stack does not matter (a zone
        // draws nothing); under everything else drawn here.
        this.addAt(this.blurImage, 0);
    }

    // Where a cell is on the screen, in the game's own units.
    cellPoint(cell) {
        const play = this.gamePlay;
        const at = play.cellToPixel(cell.col, cell.row);

        return { x: play.x + at.x * play.scaleX, y: play.y + at.y * play.scaleY };
    }

    get cell() {
        return this.gamePlay.cellSize * this.gamePlay.scaleX;
    }

    // What is kept clear: the convoy, then its garage.
    spots() {
        const convoy = this.target.convoy;
        const spots = [this.spotRound(convoy.cells)];

        if (convoy.exit) spots.push(this.spotRound([{ col: convoy.exit[0], row: convoy.exit[1] }]));

        return spots;
    }

    // The box round some cells, padded.
    spotRound(cells) {
        const half = this.cell / 2;
        const pad = this.cell * SPOT_PAD;
        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;

        for (let i = 0; i < cells.length; i++) {
            const p = this.cellPoint(cells[i]);

            left = Math.min(left, p.x);
            top = Math.min(top, p.y);
            right = Math.max(right, p.x);
            bottom = Math.max(bottom, p.y);
        }

        return {
            x: left - half - pad,
            y: top - half - pad,
            width: right - left + (half + pad) * 2,
            height: bottom - top + (half + pad) * 2,
            round: this.cell * SPOT_ROUND
        };
    }

    show() {
        if (!this.target) return;

        this.visible = true;
        this.alpha = 1;

        this.buildGuide();
        this.layoutBlocker();

        this.blurImage.alpha = 0;
        this.scene.tweens.add({ targets: this.blurImage, alpha: 1, duration: FADE_IN, ease: 'Sine.easeOut' });

        this.popIn(this.bubble);
        this.gamePlay.bumpConvoy(this.target.convoy);
    }

    // The ring, the arrows, the fingertip and the bubble, for the spot as it
    // is now.
    buildGuide() {
        this.clearGuide();

        const tweens = this.scene.tweens;
        const spots = this.spots();
        const target = this.target;

        // A ring on each spot, centred so it pulses about its middle.
        for (let i = 0; i < spots.length; i++) {
            const spot = spots[i];
            const w = spot.width;
            const h = spot.height;
            const reach = RING_THICK / 2 + RING_EDGE_THICK + 2;
            const key = RING_TEXTURE + i;

            dropBaked(this.scene, key);

            const ring = bakeShape(this.scene, {
                left: -w / 2 - reach, top: -h / 2 - reach,
                width: w + reach * 2, height: h + reach * 2
            }, (g) => {
                g.lineStyle(RING_THICK + RING_EDGE_THICK * 2, RING_EDGE, 1);
                g.strokeRoundedRect(-w / 2, -h / 2, w, h, spot.round);
                g.lineStyle(RING_THICK, RING, 1);
                g.strokeRoundedRect(-w / 2, -h / 2, w, h, spot.round);
            }, key);

            ring.setPosition(spot.x + w / 2, spot.y + h / 2);
            this.addPart(ring);

            tweens.add({
                targets: ring,
                scale: ring.restScale * RING_PULSE,
                alpha: 0.6,
                duration: RING_TIME,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // One arrow on each cell of the way but the garage's, pointing on.
        const points = [target.from].concat(target.route).map((c) => this.cellPoint(c));

        for (let i = 1; i < points.length - 1; i++) {
            const arrow = hintArrowImage(this.scene);
            const fit = arrow.restScale * this.cell * ARROW_SIZE / ARROW_ART;

            arrow.setPosition(points[i].x, points[i].y);
            arrow.rotation = Math.atan2(points[i + 1].y - points[i].y, points[i + 1].x - points[i].x);
            arrow.alpha = ARROW_ALPHA;
            arrow.setScale(0);
            this.addPart(arrow);

            tweens.add({
                targets: arrow,
                scale: fit,
                duration: ARROW_IN_TIME,
                delay: FADE_IN + (i - 1) * ARROW_IN,
                ease: 'Back.easeOut'
            });
        }

        this.dragTouch(points);
        this.placeBubble(this.guideBox(spots[0], points));
    }

    // The fingertip pressing on the end to drive, dragging it home along the
    // arrows, and letting go there; over and over.
    dragTouch(points) {
        const touch = hintTouchImage(this.scene);
        const fit = touch.restScale * this.cell * TOUCH_SIZE / TOUCH_ART;
        const path = new Phaser.Curves.Path(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) path.lineTo(points[i].x, points[i].y);

        const glide = Math.max(2, points.length - 1) * TOUCH_CELL;
        const outAt = TOUCH_IN + glide;
        const cycle = outAt + TOUCH_OUT + TOUCH_REST;
        const start = points[0];
        const end = points[points.length - 1];
        const spot = new Phaser.Math.Vector2();

        touch.alpha = 0;
        touch.setPosition(start.x, start.y);
        this.addPart(touch);

        this.touchRun = this.scene.tweens.addCounter({
            from: 0,
            to: cycle,
            duration: cycle,
            delay: FADE_IN + TOUCH_WAIT,
            repeat: -1,
            onUpdate: (tween) => {
                const t = tween.getValue();

                if (t < TOUCH_IN) {
                    const k = t / TOUCH_IN;

                    touch.setPosition(start.x, start.y);
                    touch.alpha = Math.min(1, k * 2);
                    touch.setScale(fit * (1.35 - (1.35 - TOUCH_PRESS) * Phaser.Math.Easing.Quadratic.Out(k)));
                } else if (t < outAt) {
                    path.getPoint(Phaser.Math.Easing.Sine.InOut((t - TOUCH_IN) / glide), spot);
                    touch.setPosition(spot.x, spot.y);
                    touch.alpha = 1;
                    touch.setScale(fit * TOUCH_PRESS);
                } else {
                    const k = Math.min(1, (t - outAt) / TOUCH_OUT);

                    touch.setPosition(end.x, end.y);
                    touch.alpha = 1 - k;
                    touch.setScale(fit * (TOUCH_PRESS + 0.5 * k));
                }
            }
        });
    }

    addPart(part) {
        this.parts.push(part);
        this.add(part);
    }

    clearGuide() {
        if (this.touchRun) {
            this.touchRun.remove();
            this.touchRun = null;
        }

        this.scene.tweens.killTweensOf(this.parts);

        for (let i = 0; i < this.parts.length; i++) this.parts[i].destroy();

        this.parts = [];
    }

    text(content, size, color) {
        const text = this.scene.add.text(0, 0, content, { fontFamily: 'FredokaOne_Regular', fontSize: size, color: color });

        text.setOrigin(.5);
        text.setResolution(this.textRes);

        return text;
    }

    buildBubble() {
        const bubble = this.scene.add.container(0, 0);

        bubble.back = this.scene.add.graphics();
        bubble.add(bubble.back);

        bubble.kicker = this.text('How to play', KICKER_SIZE, PURPLE);
        bubble.kicker.y = -BUBBLE_H / 2 + 26;
        bubble.add(bubble.kicker);

        bubble.line = this.text('Drag this convoy to its garage!', LINE_SIZE, INK);
        bubble.line.y = 12;
        bubble.add(bubble.line);

        this.bubble = bubble;
        this.add(bubble);
    }

    // The spot and the way home together, so the bubble covers neither.
    guideBox(spot, points) {
        const half = this.cell / 2;
        let left = spot.x;
        let top = spot.y;
        let right = spot.x + spot.width;
        let bottom = spot.y + spot.height;

        for (let i = 0; i < points.length; i++) {
            left = Math.min(left, points[i].x - half);
            top = Math.min(top, points[i].y - half);
            right = Math.max(right, points[i].x + half);
            bottom = Math.max(bottom, points[i].y + half);
        }

        return { x: left, y: top, width: right - left, height: bottom - top };
    }

    // Sized to its words and the screen, and put below what the guide shows
    // if that is in the top half, above it if not.
    placeBubble(spot) {
        const bubble = this.bubble;
        const room = dimensions.actualWidth - (BUBBLE_MARGIN + BUBBLE_PAD) * 2;

        fitText(bubble.kicker, room, KICKER_SIZE);
        fitText(bubble.line, room, LINE_SIZE);

        const width = Math.max(bubble.line.width, bubble.kicker.width) + BUBBLE_PAD * 2;
        const height = BUBBLE_H;
        const round = height / 3;

        bubble.back.clear();
        bubble.back.fillStyle(BUBBLE_SHADE, 0.25);
        bubble.back.fillRoundedRect(-width / 2, -height / 2 + 5, width, height, round);
        bubble.back.fillStyle(BUBBLE_FILL, 1);
        bubble.back.lineStyle(BUBBLE_EDGE_THICK, BUBBLE_EDGE, 1);
        bubble.back.fillRoundedRect(-width / 2, -height / 2, width, height, round);
        bubble.back.strokeRoundedRect(-width / 2, -height / 2, width, height, round);

        const half = width / 2 + BUBBLE_MARGIN;
        const left = dimensions.leftOffset;
        const middle = spot.y + spot.height / 2;
        const below = middle < dimensions.gameHeight / 2;

        bubble.x = Phaser.Math.Clamp(spot.x + spot.width / 2, left + half, left + dimensions.actualWidth - half);
        bubble.y = below ?
            spot.y + spot.height + BUBBLE_GAP + height / 2 :
            spot.y - BUBBLE_GAP - height / 2;

        // Last, over the ring and arrows.
        this.bringToTop(bubble);
    }

    popIn(piece) {
        piece.alpha = 0;
        piece.setScale(0.8);

        this.scene.tweens.add({
            targets: piece,
            alpha: 1,
            scale: 1,
            duration: 300,
            delay: FADE_IN / 2,
            ease: 'Back.easeOut'
        });
    }

    // The convoy is taken hold of: the blur lifts off the drag.
    grabbed() {
        const wasShown = this.visible;

        this.target = null;
        this.blocker.disableInteractive();

        if (this.wait) {
            this.wait.remove();
            this.wait = null;
        }

        this.dropCapture();

        if (!wasShown) {
            this.clear();
            return;
        }

        this.scene.tweens.killTweensOf(this);
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: FADE_OUT,
            ease: 'Sine.easeIn',
            onComplete: () => this.clear()
        });
    }

    /** Stops the lesson part way, as the level is left. */
    abort() {
        if (this.gamePlay && this.gamePlay.lesson) this.gamePlay.lesson = null;

        this.clear();
    }

    clear() {
        if (this.wait) {
            this.wait.remove();
            this.wait = null;
        }

        this.dropCapture();
        this.clearGuide();
        this.scene.tweens.killTweensOf([this, this.bubble]);

        if (this.blurImage) {
            this.scene.tweens.killTweensOf(this.blurImage);
            this.blurImage.destroy();
            this.blurImage = null;
        }

        if (this.scene.textures.exists(BLUR_TEXTURE)) this.scene.textures.remove(BLUR_TEXTURE);

        dropBaked(this.scene, RING_TEXTURE + 0);
        dropBaked(this.scene, RING_TEXTURE + 1);

        this.target = null;
        this.blocker.disableInteractive();
        this.visible = false;
        this.alpha = 1;
    }

    layoutBlocker() {
        const width = dimensions.actualWidth;
        const height = dimensions.actualHeight;

        this.blocker.setPosition(dimensions.leftOffset, dimensions.topOffset);
        this.blocker.setSize(width, height);

        if (this.blocker.input) this.blocker.input.hitArea.setSize(width, height);
    }

    // A new screen size: the board has moved, so the picture is taken again.
    adjust() {
        this.layoutBlocker();

        if (!this.target || this.wait) return;

        this.clearGuide();
        this.capture(() => {
            this.visible = true;
            this.buildGuide();
        });
    }
}
