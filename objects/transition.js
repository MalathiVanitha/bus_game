import SoundManager from './SoundManager.js';

// Which change plays between screens. Set it to one of:
//   'convoy'   - the home convoy drives across, a blue road filling in behind
//                it, and drives across again to push the blue away
//   'clouds'   - rows of clouds drift across until the screen is all cloud,
//                then drift on off it
//   'garage'   - a garage's roller door comes down and rolls back up
//   'suitcase' - a suitcase grows from the middle to fill the screen, then
//                opens down its zip
//   'tiles'    - rounded tiles pop up in a diagonal wave, then pop away
//   'iris'     - a white rim and the sky close in on the middle, then open
//   'random'   - a different one of the above each time
// For a quick look without changing this, add ?transition=<name> to the URL.
export const TRANSITION_STYLE = 'convoy';

// The change from one screen to the next. Whatever the style, it covers the
// screen, the game's logo settles in while the screens are swapped
// underneath, then the logo fades and the style clears to show the new
// screen.
//
// Everything is drawn from one clock of its own, stepped once a frame, so a
// slow frame only slows the change down rather than making it jump.

// The game's button blue, with a lighter and a darker one for detail.
const BLUE = 0x3f8ff0;
const BLUE_LIGHT = 0x4b99f3;
const BLUE_DARK = 0x2f73dc;
const SKY = 0x98ddfc;
const WHITE = 0xffffff;
const SHADOW = 0x101a33;

// Frames let go by after the swap before the clock runs on, so any hitch from
// building the new screen falls while it is covered.
const SETTLE_FRAMES = 2;
// The most the clock moves in one frame, whatever the frame took.
const MAX_STEP = 1000 / 30;

// The logo, as home shows it, in the middle while the screen is covered. It
// starts settling in a little before the cover is complete, and is gone a
// little after the cover starts clearing.
const LOGO_SHEET = 'sheet';
const LOGO_ART = 'home/logo';
const LOGO_WIDTH = 0.6;
const LOGO_IN_EARLY = 120;
const LOGO_IN = 320;
const LOGO_OUT_EARLY = 60;
const LOGO_OUT = 160;

const Ease = Phaser.Math.Easing;
const clamp01 = (v) => Phaser.Math.Clamp(v, 0, 1);

// A style draws the cover: drawClose(ms) from nothing to full over `close`
// ms, held full for `hold` ms, then drawOpen(ms) from full to nothing over
// `open` ms. The new screen starts to show `reveal` of the way into opening.
class Style {
    constructor(transition) {
        this.scene = transition.scene;
        this.root = this.scene.add.container(0, 0);
        this.root.visible = false;
        transition.addAt(this.root, transition.getIndex(transition.logo));
    }

    layout(width, height) {
        this.width = width;
        this.height = height;
        this.left = -width / 2;
        this.top = -height / 2;
    }

    // Fresh choices for each run.
    begin() {}
}

// The home convoy drives in from the right and out to the left, the blue
// filling in behind its last cart; then it drives across again, pushing the
// blue off ahead of it and leaving the new screen behind.
const CONVOY_ART = 'home/convoy';

class ConvoyStyle extends Style {
    constructor(transition) {
        super(transition);

        this.close = 760;
        this.hold = 240;
        this.open = 760;
        this.reveal = 0.02;

        this.cover = this.scene.add.graphics();
        this.root.add(this.cover);

        this.shadow = this.scene.add.image(0, 0, 'sheet', CONVOY_ART);
        this.shadow.setTintFill(SHADOW);
        this.shadow.alpha = 0.2;
        this.root.add(this.shadow);

        this.convoy = this.scene.add.image(0, 0, 'sheet', CONVOY_ART);
        this.root.add(this.convoy);
    }

    layout(width, height) {
        super.layout(width, height);

        this.size = Math.min(width * 0.95, 560);
        this.convoy.setScale(this.size / this.convoy.width);
        this.shadow.setScale(this.convoy.scale);
        // Its ends, in from the art's edges: the front bumper and the last cart.
        this.nose = -this.size * 0.47;
        this.tail = this.size * 0.45;
    }

    // Where the convoy's middle is, t of the way across.
    drive(t) {
        const from = this.width / 2 + this.size / 2 + 10;
        const to = -from;

        return from + (to - from) * Ease.Sine.InOut(t);
    }

    place(x, at) {
        const bounce = Math.abs(Math.sin(at / 70)) * 3;

        this.convoy.setPosition(x, -bounce);
        this.shadow.setPosition(x, 10);
    }

    // The blue between from and to, with a white kerb along the edge at kerb.
    fill(from, to, kerb) {
        const g = this.cover;

        g.clear();

        if (to <= from) return;

        g.fillStyle(BLUE, 1);
        g.fillRect(from, this.top, to - from, this.height);

        if (kerb > this.left && kerb < -this.left) {
            g.fillStyle(WHITE, 1);
            g.fillRect(kerb - 5, this.top, 10, this.height);
        }
    }

    drawClose(ms, at) {
        const x = this.drive(ms / this.close);
        const edge = x + this.tail;

        this.fill(edge, -this.left, edge);
        this.place(x, at);
    }

    drawOpen(ms, at) {
        const x = this.drive(ms / this.open);
        const edge = x + this.nose;

        this.fill(this.left, edge, edge);
        this.place(x, at);
    }
}

// Rows of clouds drift in from the right, each trailing cloud-white behind
// it, until the screen is all cloud; then they drift on to the left, the new
// screen coming in behind the last cloud of each row.
const CLOUD_ART = 'home/cloud';
const CLOUD_ART_W = 300;
const CLOUD_ART_H = 140;
const CLOUD_COLOR = 0xf6fafb;

class CloudsStyle extends Style {
    constructor(transition) {
        super(transition);

        this.close = 640;
        this.hold = 260;
        this.open = 640;
        this.reveal = 0.1;

        // How long one row takes to drift across; the rows set off at odd
        // times within the rest.
        this.travel = 500;

        this.cover = this.scene.add.graphics();
        this.root.add(this.cover);

        this.clouds = [];
        this.lags = [];
        this.sizes = [];
    }

    layout(width, height) {
        super.layout(width, height);

        this.cloudWidth = width * 0.75;
        this.cloudHeight = this.cloudWidth * CLOUD_ART_H / CLOUD_ART_W;
        this.rowHeight = this.cloudHeight * 0.4;
        this.rows = Math.ceil(height / this.rowHeight);

        while (this.clouds.length < this.rows) {
            const cloud = this.scene.add.image(0, 0, 'sheet', CLOUD_ART);
            this.clouds.push(cloud);
            this.root.add(cloud);
        }

        // Each cloud sits a little high on its row, where its puffs are
        // deepest.
        this.clouds.forEach((cloud, i) => {
            cloud.visible = i < this.rows;
            cloud.y = this.top + (i + 0.5) * this.rowHeight - this.cloudHeight * 0.1;
        });
    }

    begin() {
        this.lags = this.clouds.map(() => Math.random() * (this.close - this.travel));
        this.sizes = this.clouds.map(() => 0.9 + Math.random() * 0.25);
    }

    // Where row i's cloud is, ms into its drift across.
    drift(i, ms) {
        const t = clamp01((ms - this.lags[i]) / this.travel);
        const from = this.width / 2 + this.cloudWidth * this.sizes[i] / 2;

        return from - 2 * from * Ease.Sine.InOut(t);
    }

    // Leading, the white is behind (right of) each cloud; trailing, ahead of it.
    draw(ms, leading) {
        const g = this.cover;

        g.clear();
        g.fillStyle(CLOUD_COLOR, 1);

        for (let i = 0; i < this.rows; i++) {
            const cloud = this.clouds[i];
            const x = this.drift(i, ms);
            const scale = this.cloudWidth * this.sizes[i] / CLOUD_ART_W;
            const reach = this.cloudWidth * this.sizes[i] * 0.2;
            const y = this.top + i * this.rowHeight;

            cloud.x = x;
            cloud.setScale(leading ? scale : -scale, scale);

            if (leading) g.fillRect(x + reach, y, -this.left - x - reach + 1, this.rowHeight + 1);
            else g.fillRect(this.left - 1, y, x - reach - this.left + 1, this.rowHeight + 1);
        }
    }

    drawClose(ms) {
        this.draw(ms, true);
    }

    drawOpen(ms) {
        this.draw(ms, false);
    }
}

// A garage's roller door, slats and all, comes down from the top and rolls
// back up.
const DOOR = 0xe8eef6;
const DOOR_GROOVE = 0xc4d0de;
const DOOR_SHINE = 0xffffff;
const DOOR_SLATS = 13;

class GarageStyle extends Style {
    constructor(transition) {
        super(transition);

        this.close = 520;
        this.hold = 260;
        this.open = 560;
        this.reveal = 0.08;

        this.door = this.scene.add.graphics();
        this.root.add(this.door);
    }

    layout(width, height) {
        super.layout(width, height);

        this.slat = height / DOOR_SLATS;
        this.bar = Math.max(18, this.slat * 0.55);
    }

    // The door with its bottom edge at y.
    draw(y) {
        const g = this.door;
        const left = this.left;
        const width = this.width;

        g.clear();

        if (y <= this.top) return;

        // A soft shadow under the bottom bar.
        g.fillStyle(SHADOW, 0.18);
        g.fillRect(left, y, width, 10);

        g.fillStyle(DOOR, 1);
        g.fillRect(left, this.top, width, y - this.top);

        // The slats ride with the door, counted up from its bottom edge.
        for (let k = 1; ; k++) {
            const line = y - this.bar - k * this.slat;

            if (line < this.top - 8) break;

            g.fillStyle(DOOR_GROOVE, 1);
            g.fillRect(left, line, width, 5);
            g.fillStyle(DOOR_SHINE, 1);
            g.fillRect(left, line + 5, width, 3);
        }

        // The bottom bar, in blue, with its handle.
        g.fillStyle(BLUE, 1);
        g.fillRect(left, y - this.bar, width, this.bar);
        g.fillStyle(BLUE_DARK, 1);
        g.fillRect(left, y - 4, width, 4);

        const handle = Math.min(120, width * 0.26);

        g.fillStyle(WHITE, 0.9);
        g.fillRoundedRect(-handle / 2, y - this.bar * 0.7, handle, this.bar * 0.36, this.bar * 0.18);
    }

    drawClose(ms) {
        const t = Ease.Cubic.InOut(ms / this.close);

        this.draw(this.top + (this.height + 10) * t);
    }

    drawOpen(ms) {
        const t = Ease.Cubic.InOut(ms / this.open);
        const down = -this.top + 10;
        const up = this.top - 20;

        this.draw(down + (up - down) * t);
    }
}

// A suitcase grows out of the middle until its side fills the screen; then it
// opens down its zip, the halves sliding apart to show the new screen.
class SuitcaseStyle extends Style {
    constructor(transition) {
        super(transition);

        this.close = 560;
        this.hold = 240;
        this.open = 520;
        this.reveal = 0.05;

        this.case = this.scene.add.graphics();
        this.root.add(this.case);
    }

    layout(width, height) {
        super.layout(width, height);

        // Full size, a little past the screen so even its round corners are.
        this.radius = Math.min(width, height) * 0.08;
        this.caseWidth = width + this.radius * 2;
        this.caseHeight = height + this.radius * 2;
    }

    // The case at scale s, its halves pulled split apart from the zip.
    draw(s, split) {
        const g = this.case;

        g.clear();

        if (s <= 0.001) return;

        const w = this.caseWidth * s;
        const h = this.caseHeight * s;
        const r = this.radius * s;
        const top = -h / 2;
        const half = w / 2;

        // While it is shut: the handle on top, the wheels underneath and an
        // outline round it, all past the screen's edges by the time it fills.
        if (split <= 0) {
            const hw = w * 0.36;
            const hh = h * 0.07;
            const post = w * 0.07;
            const wheel = w * 0.06;
            const line = 3 * s + 2;

            g.fillStyle(BLUE_DARK, 1);
            g.fillRoundedRect(-hw / 2, top - hh, hw, post, post / 2);
            g.fillRect(-hw / 2, top - hh + post / 2, post, hh - post / 2 + 2);
            g.fillRect(hw / 2 - post, top - hh + post / 2, post, hh - post / 2 + 2);

            g.fillStyle(SHADOW, 0.85);
            g.fillCircle(-half + r + wheel, -top + wheel * 0.5, wheel);
            g.fillCircle(half - r - wheel, -top + wheel * 0.5, wheel);

            g.fillStyle(BLUE_DARK, 1);
            g.fillRoundedRect(-half - line, top - line, w + line * 2, h + line * 2, r + line);
        }

        const zip = 3 * s + 2;

        [-1, 1].forEach((side) => {
            const offset = side * split;
            const x = side < 0 ? offset - half : offset;
            const corners = side < 0 ? { tl: r, tr: 0, bl: r, br: 0 } : { tl: 0, tr: r, bl: 0, br: r };

            g.fillStyle(BLUE, 1);
            g.fillRoundedRect(x, top, half, h, corners);

            // A strap down each half.
            g.fillStyle(BLUE_LIGHT, 1);
            g.fillRect(offset + side * w * 0.36 - w * 0.03, top, w * 0.06, h);

            // The zip, along the edge where the halves meet.
            g.fillStyle(BLUE_DARK, 1);
            g.fillRect(side < 0 ? offset - zip : offset, top, zip, h);
        });
    }

    drawClose(ms) {
        const t = ms / this.close;

        this.root.rotation = Math.sin(t * Math.PI) * 0.12;
        this.draw(Ease.Cubic.In(t), 0);
    }

    drawOpen(ms) {
        const t = Ease.Cubic.InOut(ms / this.open);

        this.root.rotation = 0;
        this.draw(1, t * (this.width / 2 + this.radius * 2));
    }
}

// Rounded squares like the board's cells pop up in a diagonal wave from a
// corner, and pop away in the same sweep.
class TilesStyle extends Style {
    constructor(transition) {
        super(transition);

        // How long the wave takes to cross, and each tile to pop.
        this.spread = 280;
        this.pop = 230;

        this.close = this.spread + this.pop;
        this.hold = 280;
        this.open = this.spread + this.pop;
        this.reveal = 0.16;

        this.tiles = this.scene.add.graphics();
        this.root.add(this.tiles);
    }

    layout(width, height) {
        super.layout(width, height);

        this.cell = Math.ceil(Math.min(width, height) / 6);
        this.cols = Math.ceil(width / this.cell);
        this.rows = Math.ceil(height / this.cell);
    }

    // Each run sweeps from a corner of its own.
    begin() {
        this.flipX = Math.random() < 0.5;
        this.flipY = Math.random() < 0.5;
    }

    lag(col, row) {
        const c = this.flipX ? this.cols - 1 - col : col;
        const r = this.flipY ? this.rows - 1 - row : row;

        return (c + r) / Math.max(1, this.cols + this.rows - 2) * this.spread;
    }

    // size(lag) is how big a tile with that lag is, from 0 to 1; its corners
    // square off as it grows, so full tiles meet without gaps.
    draw(size) {
        const g = this.tiles;
        const cell = this.cell;

        g.clear();

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const s = size(this.lag(col, row));

                if (s <= 0.01) continue;

                const side = cell * s;
                const corner = cell * 0.3 * clamp01(1 - s) * Math.min(1, s * 2);
                const x = this.left + (col + 0.5) * cell - side / 2;
                const y = this.top + (row + 0.5) * cell - side / 2;

                g.fillStyle((row + col) % 2 ? BLUE_LIGHT : BLUE, 1);

                if (corner > 0.5) g.fillRoundedRect(x, y, side, side, corner);
                else g.fillRect(x, y, side, side);
            }
        }
    }

    drawClose(ms) {
        this.draw((lag) => Ease.Back.Out(clamp01((ms - lag) / this.pop), 1.3));
    }

    drawOpen(ms) {
        this.draw((lag) => 1 - Ease.Back.In(clamp01((ms - lag) / this.pop), 1.3));
    }
}

// A white rim and the sky close in on the middle, then open, sky first.
class IrisStyle extends Style {
    constructor(transition) {
        super(transition);

        this.closeTime = 380;
        this.openTime = 420;
        this.lag = 50;

        this.close = this.closeTime + this.lag;
        this.hold = 300;
        this.open = this.openTime + this.lag;
        this.reveal = 0.2;

        this.iris = this.scene.add.graphics();
        this.root.add(this.iris);
    }

    layout(width, height) {
        super.layout(width, height);

        this.far = Math.hypot(width, height) / 2 + 4;
        this.outer = this.far * 1.25;
    }

    // Everything outside a circle of radius r.
    ring(g, r, color) {
        g.fillStyle(color, 1);

        if (r <= 0) {
            g.fillRect(-this.outer, -this.outer, this.outer * 2, this.outer * 2);
            return;
        }

        const segments = 72;
        const outer = this.outer;

        for (let s = 0; s < segments; s++) {
            const a = s / segments * Math.PI * 2;
            const b = (s + 1) / segments * Math.PI * 2;
            const ax = Math.cos(a);
            const ay = Math.sin(a);
            const bx = Math.cos(b);
            const by = Math.sin(b);

            g.fillTriangle(ax * r, ay * r, bx * r, by * r, ax * outer, ay * outer);
            g.fillTriangle(bx * r, by * r, bx * outer, by * outer, ax * outer, ay * outer);
        }
    }

    // The white ring under the sky one; once the sky is shut it is all that shows.
    draw(white, sky) {
        const g = this.iris;

        g.clear();

        if (white < this.far && sky > 0) this.ring(g, white, WHITE);
        if (sky < this.far) this.ring(g, sky, SKY);
    }

    drawClose(ms) {
        const r = (lag) => this.far * (1 - Ease.Cubic.InOut(clamp01((ms - lag) / this.closeTime)));

        this.draw(r(0), r(this.lag));
    }

    drawOpen(ms) {
        const r = (lag) => this.far * Ease.Cubic.InOut(clamp01((ms - lag) / this.openTime));

        this.draw(r(this.lag), r(0));
    }
}

const STYLES = {
    convoy: ConvoyStyle,
    clouds: CloudsStyle,
    garage: GarageStyle,
    suitcase: SuitcaseStyle,
    tiles: TilesStyle,
    iris: IrisStyle
};

// The style asked for: from the URL if it names one, else TRANSITION_STYLE.
function chosenStyle() {
    let name = TRANSITION_STYLE;

    try {
        name = new URLSearchParams(window.location.search).get('transition') || name;
    } catch (e) {
        // No URL to read; keep the setting.
    }

    return name === 'random' || STYLES[name] ? name : 'convoy';
}

export class Transition extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.running = false;
        this.builtFor = '';
        this.reveals = [];
        this.revealed = true;

        this.choice = chosenStyle();
        this.styles = {};

        // Swallows taps while a change is under way.
        this.blocker = this.scene.add.zone(0, 0, 10, 10);
        this.add(this.blocker);

        // Always on top; each style puts its own pieces in under it.
        this.logo = this.scene.add.image(0, 0, LOGO_SHEET, LOGO_ART);
        this.add(this.logo);

        this.visible = false;
    }

    // The styles this setting can play: all of them for 'random'.
    names() {
        return this.choice === 'random' ? Object.keys(STYLES) : [this.choice];
    }

    // Each style is built the first time it is wanted.
    styleFor(name) {
        if (!this.styles[name]) {
            this.styles[name] = new STYLES[name](this);

            if (this.builtFor) this.styles[name].layout(this.layoutWidth, this.layoutHeight);
        }

        return this.styles[name];
    }

    // Sizes that follow the screen, worked out again only when it changes.
    layout(width, height) {
        const size = width + 'x' + height;

        if (this.builtFor === size) return;

        this.builtFor = size;
        this.layoutWidth = width;
        this.layoutHeight = height;

        this.logoScale = Math.min(width, height) * LOGO_WIDTH / this.logo.width;

        Object.values(this.styles).forEach((style) => style.layout(width, height));
    }

    // Puts style in charge, and its timings on the clock.
    use(style) {
        Object.values(this.styles).forEach((other) => { other.root.visible = other === style; });

        this.style = style;

        this.covered = style.close;
        this.openAt = style.close + style.hold;
        this.total = this.openAt + style.open;
        this.revealAt = this.openAt + style.open * style.reveal;
    }

    /**
     * Covers the screen, calls onCovered to swap what is under it, then
     * clears it and calls onDone. A change asked for while one is running is
     * dropped, so a double tap cannot start two.
     */
    run(onCovered, onDone = null) {
        if (this.running) return false;

        this.running = true;
        this.visible = true;
        this.alpha = 1;

        const width = dimensions.actualWidth;
        const height = dimensions.actualHeight;

        this.blocker.setSize(width, height);
        this.blocker.setInteractive();

        this.layout(width, height);

        const style = this.styleFor(Phaser.Utils.Array.GetRandom(this.names()));

        this.use(style);
        style.begin();

        this.onCovered = onCovered;
        this.onDone = onDone;
        this.stage = 'closing';
        this.clock = 0;
        this.revealed = false;
        this.reveals.length = 0;

        this.draw(0);

        SoundManager.fx(this.scene, 'whoosh', 0.45);

        this.scene.events.on('update', this.tick, this);

        return true;
    }

    /**
     * Calls fn as the new screen starts to show, so an intro set off under the
     * cover is seen; straight away if no change is under way or it already
     * shows.
     */
    whenOpen(fn) {
        if (this.revealed) fn();
        else this.reveals.push(fn);
    }

    reveal() {
        this.revealed = true;

        SoundManager.fx(this.scene, 'whoosh', 0.3, 300);

        const reveals = this.reveals.splice(0);

        for (let i = 0; i < reveals.length; i++) reveals[i]();
    }

    tick(time, delta) {
        const step = Math.min(delta || 0, MAX_STEP);

        if (this.stage === 'closing') {
            this.clock = Math.min(this.covered, this.clock + step);
            this.draw(this.clock);

            if (this.clock < this.covered) return;

            this.stage = 'settling';
            this.settleFrames = SETTLE_FRAMES;

            if (this.onCovered) this.onCovered();

            return;
        }

        if (this.stage === 'settling') {
            if (--this.settleFrames > 0) return;

            this.stage = 'opening';

            return;
        }

        this.clock = Math.min(this.total, this.clock + step);

        // Before this frame's draw, so whatever the reveal sets up is shown in
        // its starting pose on the frame the screen first shows.
        if (!this.revealed && this.clock >= this.revealAt) this.reveal();

        this.draw(this.clock);

        if (this.clock < this.total) return;

        this.scene.events.off('update', this.tick, this);

        this.stage = null;
        this.running = false;
        this.visible = false;
        this.blocker.disableInteractive();

        if (this.onDone) this.onDone();
    }

    // Every style this setting can play, put through the renderer once,
    // unseen, so its art is already on the GPU and the first real change has
    // no hitch.
    warmUp() {
        if (this.running || this.warmed) return;

        this.warmed = true;

        const styles = this.names().map((name) => this.styleFor(name));

        styles.forEach((style) => {
            style.begin();
            style.drawClose(style.close * 0.6, 0);
            style.root.visible = true;
        });

        this.logo.visible = true;
        this.alpha = 0.001;
        this.visible = true;

        this.scene.events.once('postrender', () => {
            if (this.running) return;

            this.visible = false;
            this.alpha = 1;
            styles.forEach((style) => { style.root.visible = false; });
        });
    }

    draw(at) {
        const style = this.style;

        if (at < this.openAt) style.drawClose(Math.min(at, style.close), at);
        else style.drawOpen(Math.min(at - this.openAt, style.open), at);

        this.drawLogo(at);
    }

    // The logo grows gently into place as the cover completes, floats a
    // little while the screens swap, and shrinks away as the cover clears.
    drawLogo(at) {
        const inAt = this.covered - LOGO_IN_EARLY;
        const outAt = this.openAt - LOGO_OUT_EARLY;
        const shown = at - inAt;

        if (shown <= 0 || at >= outAt + LOGO_OUT) {
            this.logo.visible = false;
            return;
        }

        this.logo.visible = true;

        let t;
        let scale;

        if (at < outAt) {
            t = Math.min(1, shown / LOGO_IN);
            scale = 0.8 + 0.2 * Ease.Back.Out(t, 1.4);
            this.logo.alpha = Ease.Quadratic.Out(t);
        } else {
            t = (at - outAt) / LOGO_OUT;
            scale = 1 - 0.15 * Ease.Quadratic.In(t);
            this.logo.alpha = 1 - Ease.Quadratic.In(t);
        }

        this.logo.setScale(this.logoScale * scale);
        this.logo.y = Math.sin(shown / 260) * 3;
    }

    adjust() {
        this.x = dimensions.gameWidth / 2;
        this.y = dimensions.gameHeight / 2;

        // Ready ahead of the first run, so it does not start on a hitch.
        if (!this.running && dimensions.actualWidth) {
            this.layout(dimensions.actualWidth, dimensions.actualHeight);
            this.warmUp();
        }
    }
}
