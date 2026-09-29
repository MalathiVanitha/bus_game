// The change from one screen to the next, as a candy iris: rings in the
// luggage colours close in on the middle one after another, each with a wavy
// edge that turns, the last a deep blue sunburst. Once the screen is covered
// the game's logo pops up in the middle with a convoy driving round it on a
// ring road, and the screens are swapped underneath. Then the badge pops away,
// the rings open back out, blue first, and confetti bursts over the new screen.
//
// Everything is drawn from one clock of its own, stepped once a frame, so a
// slow frame only slows the change down rather than making it jump.

// The rings, from the one that leads to the one that closes last (and so lies
// on top). Each sets off LAG ms after the change starts; opening, the order
// runs the other way.
const RINGS = [
    { color: 0xffffff, lag: 0, spin: 1 },
    { color: 0xffd23f, lag: 45, spin: -1 },
    { color: 0xff8a1f, lag: 115, spin: 1 },
    { color: 0xff4f8b, lag: 185, spin: -1 },
    { color: 0x2f73dc, lag: 255, spin: 1 }
];

// The wavy edge: how many lobes, how deep, and how fast they turn.
const LOBES = 9;
const WAVE = 0.07;
const WAVE_SPIN = 0.0016;
const SEGMENTS = 120;

// The sunburst on the blue ring.
const RAYS = 18;
const RAY_COLOR = 0x4f96f2;
const RAY_ALPHA = 0.55;
const RAY_SPIN = 0.00035;
const RAY_GAP = 14;

// Timing, in ms of the change's own clock.
const CLOSE_TIME = 460;
const COVERED = CLOSE_TIME + RINGS[RINGS.length - 1].lag;
const HOLD_TIME = 520;
const BADGE_OUT = 220;
const OPEN_TIME = 520;
const OPEN_AT = COVERED + HOLD_TIME;
// The rings start opening a little after the badge starts popping away.
const OPEN_DELAY = 110;
const OPEN_LAST_LAG = RINGS[RINGS.length - 1].lag;
const OPENED = OPEN_AT + OPEN_DELAY + OPEN_LAST_LAG + OPEN_TIME;
// When the new screen starts to show: a little way into the last ring (the
// lead one, over the screen) opening, while the hole is still a speck, so
// the screen's own intro plays out as the iris opens rather than unseen
// behind it.
const REVEAL_AT = OPEN_AT + OPEN_DELAY + OPEN_LAST_LAG + OPEN_TIME * 0.3;

// Frames let go by after the swap before the clock runs on, so any hitch from
// building the new screen falls while it is covered.
const SETTLE_FRAMES = 2;
// The most the clock moves in one frame, whatever the frame took.
const MAX_STEP = 1000 / 30;

// The badge: the game's logo, as home shows it, on a soft glow, with a ring road round it.
const BADGE_IN = 380;
const LOGO_SHEET = 'sheet';
const LOGO_ART = 'home/logo';
const LOGO_WIDTH = 0.66;
const GLOW = 0xffffff;
const GLOW_ALPHA = 0.18;
const ROAD = 0x1d4fa8;
const ROAD_ALPHA = 0.85;
const ROAD_LINE = 0xffffff;
const ROAD_LINE_ALPHA = 0.7;
const ROAD_DASHES = 28;

// The convoy on the ring road, built the way convoy.js builds them, one
// vehicle to a cell, from the same art.
const VEHICLE_SHEET = 'luggages';
const TRACTOR_ART = 'tractor_front';
const CART_ART = 'luggage_cart';
const ART_MARGIN = 200 / 220;
const TRACTOR_ART_CELL = 220 * ART_MARGIN;
const CART_ART_CELL = 314 * ART_MARGIN;
const VEHICLE_FIT = 1.06;
const TRACTOR_FACING = Math.PI / 2;
const CART_FACING = -Math.PI / 2;
const LINK_COLOR = 0x23262d;
const LINK_WIDTH = 0.11;
const CARTS = 4;
// Radians a millisecond round the ring.
const DRIVE = 0.0034;

const COLORS = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'lime', 'white'];

const SHADOW = 0x101a33;
const SHADOW_ALPHA = 0.25;
const SHADOW_DY = 6;

// Confetti thrown out as the rings open.
const CONFETTI = 44;
const CONFETTI_COLORS = [0xff4f4f, 0xff8a1f, 0xffd23f, 0x5ad35a, 0x37d0e0, 0x4f96f2, 0xa66bff, 0xff4f8b];
const CONFETTI_TIME = 820;
const CONFETTI_AT = OPEN_AT + OPEN_DELAY / 2;
const CONFETTI_STAGGER = 60;
const GRAVITY = 0.0016;

// The change is over once the rings are open and the confetti has fallen.
const TOTAL = Math.max(OPENED, CONFETTI_AT + CONFETTI_STAGGER + CONFETTI_TIME);

export class Transition extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.running = false;
        this.builtFor = '';
        this.reveals = [];
        this.revealed = true;

        // Swallows taps while a change is under way.
        this.blocker = this.scene.add.zone(0, 0, 10, 10);
        this.add(this.blocker);

        this.iris = this.scene.add.graphics();
        this.add(this.iris);

        this.badge = this.scene.add.container(0, 0);
        this.add(this.badge);

        this.road = this.scene.add.graphics();
        this.badge.add(this.road);

        this.convoy = this.scene.add.container(0, 0);
        this.badge.add(this.convoy);

        this.logo = this.scene.add.image(0, 0, LOGO_SHEET, LOGO_ART);
        this.badge.add(this.logo);

        this.buildConvoy();

        this.confetti = [];
        for (let i = 0; i < CONFETTI; i++) {
            const bit = this.scene.add.rectangle(0, 0, 14, 22, CONFETTI_COLORS[i % CONFETTI_COLORS.length]);
            this.confetti.push(bit);
            this.add(bit);
        }

        this.visible = false;
    }

    buildConvoy() {
        this.links = [];
        this.vehicles = [];

        for (let k = 0; k < CARTS; k++) {
            const link = this.scene.add.rectangle(0, 0, 10, 10, LINK_COLOR);
            this.links.push(link);
            this.convoy.add(link);
        }

        const shadows = [];
        const arts = [];

        for (let k = CARTS; k >= 0; k--) {
            const shadow = this.scene.add.sprite(0, 0, VEHICLE_SHEET, 'red/' + CART_ART);
            shadow.setTintFill(SHADOW);
            shadow.alpha = SHADOW_ALPHA;
            shadows.push(shadow);

            const art = this.scene.add.sprite(0, 0, VEHICLE_SHEET, 'red/' + CART_ART);
            arts.push(art);

            this.vehicles[k] = { art, shadow, tractor: k === 0 };
        }

        shadows.forEach((s) => this.convoy.add(s));
        arts.forEach((a) => this.convoy.add(a));
    }

    // Sizes that follow the screen, worked out again only when it changes.
    layout(width, height) {
        const size = width + 'x' + height;

        if (this.builtFor === size) return;

        this.builtFor = size;

        // The rings start (and end) far enough out that even the deepest dip
        // of their wavy edge is past the corners.
        this.far = Math.hypot(width, height) / 2 / (1 - WAVE) + 4;
        this.outer = this.far * 1.25;

        const short = Math.min(width, height);

        this.track = short * 0.36;
        this.vehicle = Math.min(84, this.track * 0.42);

        this.logo.setScale(this.track * 2 * LOGO_WIDTH / this.logo.width);

        this.road.clear();
        this.road.fillStyle(GLOW, GLOW_ALPHA);
        this.road.fillCircle(0, 0, this.track + this.vehicle * 1.1);
        this.road.lineStyle(this.vehicle * 1.02, ROAD, ROAD_ALPHA);
        this.road.strokeCircle(0, 0, this.track);

        this.road.lineStyle(Math.max(3, this.vehicle * 0.06), ROAD_LINE, ROAD_LINE_ALPHA);
        for (let i = 0; i < ROAD_DASHES; i++) {
            const a = i / ROAD_DASHES * Math.PI * 2;
            this.road.beginPath();
            this.road.arc(0, 0, this.track, a, a + Math.PI / ROAD_DASHES * 0.9);
            this.road.strokePath();
        }

        this.links.forEach((link) => link.setSize(this.vehicle, LINK_WIDTH * this.vehicle));

        this.vehicles.forEach((v) => {
            const scale = this.vehicle * VEHICLE_FIT / (v.tractor ? TRACTOR_ART_CELL : CART_ART_CELL);
            v.art.setScale(scale);
            v.shadow.setScale(scale);
        });
    }

    // Each run gets its own colours, and the sunburst and badge a fresh turn.
    dress() {
        const first = Phaser.Math.Between(0, COLORS.length - 1);

        this.vehicles.forEach((v, k) => {
            const color = COLORS[(first + (v.tractor ? 0 : 3 + k * 2)) % COLORS.length];
            const frame = color + '/' + (v.tractor ? TRACTOR_ART : CART_ART);

            v.art.setFrame(frame);
            v.shadow.setFrame(frame);
        });

        this.turn = Math.random() * Math.PI * 2;
        this.flip = Math.random() < 0.5 ? 1 : -1;

        this.confetti.forEach((bit) => {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.55 + Math.random() * 0.9;

            bit.vx = Math.cos(angle) * speed;
            bit.vy = Math.sin(angle) * speed - 0.35;
            bit.spin = (Math.random() - 0.5) * 0.03;
            bit.start = Math.random() * CONFETTI_STAGGER;
            bit.setSize(10 + Math.random() * 8, 16 + Math.random() * 12);
        });
    }

    /**
     * Closes the iris, calls onCovered to swap what is under it, then opens it
     * and calls onDone. A change asked for while one is running is dropped,
     * so a double tap cannot start two.
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
        this.dress();

        this.onCovered = onCovered;
        this.onDone = onDone;
        this.stage = 'closing';
        this.clock = 0;
        this.revealed = false;
        this.reveals.length = 0;

        this.draw(0);

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

        const reveals = this.reveals.splice(0);

        for (let i = 0; i < reveals.length; i++) reveals[i]();
    }

    tick(time, delta) {
        const step = Math.min(delta || 0, MAX_STEP);

        if (this.stage === 'closing') {
            this.clock = Math.min(COVERED, this.clock + step);
            this.draw(this.clock);

            if (this.clock < COVERED) return;

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

        this.clock = Math.min(TOTAL, this.clock + step);

        // Before this frame's draw, so whatever the reveal sets up is shown in
        // its starting pose on the frame the hole first opens.
        if (!this.revealed && this.clock >= REVEAL_AT) this.reveal();

        this.draw(this.clock);

        if (this.clock < TOTAL) return;

        this.scene.events.off('update', this.tick, this);

        this.stage = null;
        this.running = false;
        this.visible = false;
        this.iris.clear();
        this.blocker.disableInteractive();

        if (this.onDone) this.onDone();
    }

    // Everything the change shows, put through the renderer once, unseen, so
    // its art is already on the GPU and the first real change has no hitch.
    warmUp() {
        if (this.running || this.warmed) return;

        this.warmed = true;

        this.dress();
        this.draw(OPEN_AT + OPEN_DELAY + 80);

        this.alpha = 0.001;
        this.visible = true;

        this.scene.events.once('postrender', () => {
            if (this.running) return;

            this.visible = false;
            this.alpha = 1;
            this.iris.clear();
        });
    }

    // How far out ring i's edge is at this point of the clock: from far out
    // down to nothing while closing, and back out again while opening.
    ringRadius(i, at) {
        const ring = RINGS[i];

        if (at < OPEN_AT) {
            const t = Phaser.Math.Clamp((at - ring.lag) / CLOSE_TIME, 0, 1);

            return this.far * (1 - Phaser.Math.Easing.Cubic.InOut(t));
        }

        // Opening, the top ring (blue) goes first and the lead ring last.
        const lag = OPEN_LAST_LAG - ring.lag;
        const t = Phaser.Math.Clamp((at - OPEN_AT - OPEN_DELAY - lag) / OPEN_TIME, 0, 1);

        return this.far * Phaser.Math.Easing.Cubic.In(t);
    }

    draw(at) {
        const g = this.iris;

        g.clear();

        const radii = RINGS.map((ring, i) => this.ringRadius(i, at));
        const top = RINGS.length - 1;

        // Once the top ring is shut, it is all that shows.
        const from = radii[top] <= 0 ? top : 0;

        for (let i = from; i < RINGS.length; i++) {
            if (radii[i] >= this.far) continue;

            this.drawRing(g, radii[i], RINGS[i].color, at * WAVE_SPIN * RINGS[i].spin * this.flip + i);
        }

        if (radii[top] < this.far) this.drawRays(g, radii[top], at);

        this.drawBadge(at);
        this.drawConfetti(at);
    }

    // Everything outside a wavy circle of radius r, as a band of quads out to
    // well past the corners.
    drawRing(g, r, color, phase) {
        g.fillStyle(color, 1);

        const outer = this.outer;
        let px = 0;
        let py = 0;
        let ox = 0;
        let oy = 0;

        for (let s = 0; s <= SEGMENTS; s++) {
            const a = s / SEGMENTS * Math.PI * 2;
            const edge = r * (1 + WAVE * Math.sin(a * LOBES + phase));
            const cos = Math.cos(a);
            const sin = Math.sin(a);
            const x = cos * edge;
            const y = sin * edge;
            const fx = cos * outer;
            const fy = sin * outer;

            if (s > 0) {
                g.fillTriangle(px, py, x, y, ox, oy);
                g.fillTriangle(x, y, fx, fy, ox, oy);
            }

            px = x;
            py = y;
            ox = fx;
            oy = fy;
        }
    }

    // Lighter wedges turning slowly on the blue ring, kept clear of its edge.
    drawRays(g, r, at) {
        g.fillStyle(RAY_COLOR, RAY_ALPHA);

        const inner = r > 0 ? r * (1 + WAVE) + RAY_GAP : 0;
        const outer = this.outer;
        const width = Math.PI / RAYS;
        const turn = this.turn + at * RAY_SPIN * this.flip;

        for (let i = 0; i < RAYS; i++) {
            const a = turn + i * width * 2;
            const b = a + width;
            const ax = Math.cos(a);
            const ay = Math.sin(a);
            const bx = Math.cos(b);
            const by = Math.sin(b);

            if (inner <= 0) {
                g.fillTriangle(0, 0, ax * outer, ay * outer, bx * outer, by * outer);
                continue;
            }

            g.fillTriangle(ax * inner, ay * inner, bx * inner, by * inner, ax * outer, ay * outer);
            g.fillTriangle(bx * inner, by * inner, bx * outer, by * outer, ax * outer, ay * outer);
        }
    }

    // The logo and its ring road pop up once the screen is covered, the
    // convoy drives round, and it all pops away as the rings open.
    drawBadge(at) {
        const shown = at - COVERED + BADGE_IN * 0.25;

        if (shown <= 0 || at >= OPEN_AT + BADGE_OUT) {
            this.badge.visible = false;
            return;
        }

        this.badge.visible = true;

        let scale;
        let spin;

        if (at < OPEN_AT) {
            const t = Math.min(1, shown / BADGE_IN);
            scale = Phaser.Math.Easing.Back.Out(t, 2.2);
            spin = (1 - Phaser.Math.Easing.Cubic.Out(t)) * -0.5 * this.flip;
        } else {
            const t = (at - OPEN_AT) / BADGE_OUT;
            scale = 1 + Math.sin(t * Math.PI) * 0.12 - Phaser.Math.Easing.Back.In(t, 2.5);
            spin = Phaser.Math.Easing.Cubic.In(t) * 0.4 * this.flip;
        }

        this.badge.setScale(Math.max(0.001, scale));
        this.badge.rotation = spin;

        // The logo breathes while it waits.
        this.logo.rotation = Math.sin(at / 180) * 0.05;
        this.logo.y = Math.sin(at / 240) * 4;

        this.drawConvoy(shown);
    }

    drawConvoy(shown) {
        const R = this.track;
        const dir = this.flip;
        const head = this.turn + shown * DRIVE * dir;
        const gap = this.vehicle / R;

        const place = (angle) => ({
            x: Math.cos(angle) * R,
            y: Math.sin(angle) * R,
            heading: angle + dir * Math.PI / 2
        });

        this.vehicles.forEach((v, k) => {
            const p = place(head - dir * k * gap);
            const facing = v.tractor ? TRACTOR_FACING : CART_FACING;
            const bounce = Math.abs(Math.sin(shown / 70 + k * 0.9)) * 2;

            v.art.setPosition(p.x, p.y - bounce);
            v.shadow.setPosition(p.x, p.y + SHADOW_DY);
            v.art.rotation = v.shadow.rotation = p.heading - facing;
        });

        this.links.forEach((link, k) => {
            const p = place(head - dir * (k + 0.5) * gap);

            link.setPosition(p.x, p.y);
            link.rotation = p.heading;
        });
    }

    // Thrown out from the middle as the rings open, falling and spinning, and
    // fading at the end.
    drawConfetti(at) {
        this.confetti.forEach((bit) => {
            const t = at - CONFETTI_AT - bit.start;

            if (t <= 0 || t >= CONFETTI_TIME) {
                bit.visible = false;
                return;
            }

            bit.visible = true;
            bit.x = bit.vx * t;
            bit.y = bit.vy * t + GRAVITY * t * t / 2;
            bit.rotation = bit.spin * t;
            // Flutter: the bit turns edge-on and back as it falls.
            bit.scaleX = Math.cos(t / 90 + bit.start);
            bit.alpha = Math.min(1, (CONFETTI_TIME - t) / 250);
        });
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
