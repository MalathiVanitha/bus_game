import { samplePolyline, smoothTrailPoints } from './trail.js';

// The art is drawn on a 220px canvas with the vehicle sitting inside it, so a
// vehicle drawn at cell size ends up a little under a cell wide - which is the
// gap the storyboard leaves between two carts.
const ART_CELL = 220;
const VEHICLE_FIT = 1.06;

// Each vehicle is one sprite, and the frame it is drawn with never changes. A
// vehicle turns by turning: there is no second render swapped or faded in when
// it changes direction, so it is never two half-drawn vehicles at once.
const TRACTOR_ART = "tractor_front";
const CART_ART = "luggage_cart";

// The art is drawn facing down the screen, towards the viewer, so it needs a
// quarter turn taking off its heading to point the way it is driving.
const ART_FACING = Math.PI / 2;

// How finely the path is walked before its corners are rounded off, in cells,
// and how many passes of binomial smoothing do the rounding. Together these set
// the radius the convoy swings through: measured off the turning animation, a
// corner is cut about a quarter of a cell inside its own square edge.
const SAMPLE_STEP = 0.12;
const CORNER_PASSES = 24;

// Road ahead of the tractor taken into the path, in cells, read off the cells it
// has been routed through. Without it the tractor meets each corner blind and
// snaps round once it is past; with it the corner is already in the path being
// rounded, so the convoy leans into the turn and comes out of it the way the
// animation does. Wide enough to cover the rounding either side of a corner.
const LOOK_AHEAD = 2;

// Path walked past the last vehicle, in cells, so the rounding and the heading
// chord have something to work with at that end rather than running off it.
const TAIL_PAD = 1.2;

// Half the chord a vehicle reads its heading off, in cells. Short, because the
// path it is measured along has already been rounded - this only has to give a
// steady direction, not do the smoothing itself.
const HEAD_SPAN = 0.22;

// A vehicle winds onto the heading the path gives it, as a critically damped
// spring - higher is a quicker, tighter turn. A spring rather than a plain ease
// because it carries speed: the vehicle builds into the turn and eases out of
// it, which is the shape the animation turns in. A plain ease would instead
// take its biggest bite on the first frame, which is exactly the frame the
// route the player has just asked for appears in the path.
const TURN_STIFFNESS = 20;

// Below this much left to turn, and this slow, a vehicle counts as having
// arrived at its heading and the convoy can stop being redrawn.
const TURN_REST = 0.002;
const TURN_REST_RATE = 0.01;

// A vehicle being drawn into a garage shrinks away over this much trail.
const SWALLOW_TAPER = 0.55;

// The couplings, drawn between vehicle centres and covered at both ends by the
// art they join.
const LINK_COLOR = 0x23262d;
const LINK_WIDTH = 0.11;

/**
 * The vehicles of one convoy and the couplings between them.
 *
 * Every frame the convoy is laid back out along the trail: the trail's square
 * corners are rounded off, the rounded path is measured by its own arc length,
 * and each vehicle is dropped a cell of that arc behind the one in front and
 * turned to face along it. Spacing by arc rather than by straight-line distance
 * is what lets the convoy draw up slightly as it swings through a bend and open
 * back out to a clean cell apart on the straight, the way the turning animation
 * does.
 */
export class Convoy {
    constructor(scene, config) {
        this.scene = scene;
        this.key = config.key;
        this.cellSize = config.cellSize;
        this.count = config.count;
        this.settled = false;

        this.scale = (this.cellSize * VEHICLE_FIT) / ART_CELL;

        this.links = scene.add.graphics();
        config.parent.add(this.links);

        // Back to front, so the tractor sits over the cart it is towing and each
        // cart over the one behind it - the order they overlap in when the
        // convoy is drawn up on a corner.
        this.vehicles = [];

        for (let i = this.count - 1; i >= 0; i--) {
            const art = scene.add.sprite(
                0, 0, "sheet",
                this.frameFor(i === 0 ? TRACTOR_ART : CART_ART)
            );

            art.setOrigin(0.5);
            art.setScale(this.scale);
            config.parent.add(art);

            this.vehicles[i] = {
                art: art,
                x: 0,
                y: 0,
                shown: true,
                heading: null,
                turnRate: 0
            };
        }

        // Scratch buffers for the whole run - draw() is called every frame, and
        // sized for the longest path it can be asked to lay: the convoy, the
        // trail kept behind it, and the road ahead of the tractor.
        this.span = (this.count - 1) * this.cellSize + TAIL_PAD * this.cellSize;
        this.stepLen = this.cellSize * SAMPLE_STEP;

        const longest = this.span + LOOK_AHEAD * this.cellSize;

        this.maxSteps = Math.max(2, Math.round(longest / this.stepLen) + 1);
        this.steps = this.maxSteps;
        this.leadArc = 0;

        this.raw = [];
        this.path = [];
        this.coarse = [];
        this.arc = new Float64Array(this.maxSteps);

        for (let i = 0; i < this.maxSteps; i++) {
            this.raw.push({ x: 0, y: 0 });
            this.path.push({ x: 0, y: 0 });
        }
    }

    frameFor(name) {
        return "bus/" + this.key + "/" + name;
    }

    /**
     * `ahead` is the road the tractor is routed onto next, so the corner it is
     * coming up to is rounded along with the ones behind it.
     *
     * `recoil` slides the convoy back down the trail without moving it off it,
     * which is how the nudge off a wall is drawn. `swallow` slides it the other
     * way, pulling it into a garage a vehicle at a time. `rounding` is how much
     * of the corner rounding is currently applied - run down to nothing as the
     * convoy comes to rest, so a parked convoy sits on its cells exactly rather
     * than drawn up around the bend it stopped on.
     */
    draw(trail, opts) {
        const settings = opts || {};
        const pulled = settings.swallow || 0;
        const offset = (settings.recoil || 0) - pulled;
        const rounding = settings.rounding === undefined ? 1 : settings.rounding;
        const delta = settings.delta || 0;
        const taper = SWALLOW_TAPER * this.cellSize;

        this.buildPath(trail, settings.ahead, rounding);

        // Cleared by any vehicle still turning, so the board knows to keep
        // drawing until the convoy has properly come to rest.
        this.settled = true;

        for (let i = 0; i < this.count; i++) {
            const along = this.leadArc + offset + i * this.cellSize;
            const vehicle = this.vehicles[i];
            const here = this.pointAlong(along);

            // Full size until a garage starts pulling it in, then shrinking away
            // over the last half cell so nothing pokes out past the doorway.
            const room = i * this.cellSize - pulled;
            const fade = pulled > 0 ? Math.min(1, Math.max(0, (room + taper) / taper)) : 1;

            this.turnTowards(vehicle, this.headingAlong(along), delta);

            vehicle.x = here.x;
            vehicle.y = here.y;
            vehicle.shown = fade > 0.02;

            const art = vehicle.art;

            art.visible = vehicle.shown;
            art.x = here.x;
            art.y = here.y;
            art.rotation = vehicle.heading - ART_FACING;
            art.setScale(this.scale * fade);
        }

        this.drawLinks();
    }

    /**
     * Walk the trail back from the leading point, round its corners off, and
     * measure the result by its own arc length. Rounding a corner shortens the
     * path across it, so the measuring has to be done on the rounded path and
     * not the trail it came from - otherwise every vehicle behind a bend ends up
     * short of where it belongs.
     */
    buildPath(trail, ahead, rounding) {
        const raw = this.raw;
        const path = this.path;
        const coarse = this.coarse;

        // The road ahead, furthest first, then the leading point and the trail
        // running back from it - one run of points from in front of the tractor
        // to behind the last cart.
        coarse.length = 0;

        let lookahead = 0;

        if (ahead) {
            for (let i = ahead.length - 1; i >= 0; i--) coarse.push(ahead[i]);
        }

        for (let i = 0; i < trail.points.length; i++) coarse.push(trail.points[i]);

        // Where the tractor sits in that run: everything pushed before the
        // leading point is road it has not driven yet.
        const leadIndex = coarse.length - trail.points.length;

        for (let i = 1; i <= leadIndex; i++) {
            lookahead += Math.hypot(
                coarse[i].x - coarse[i - 1].x,
                coarse[i].y - coarse[i - 1].y
            );
        }

        const total = lookahead + this.span;
        const steps = Math.max(2, Math.min(this.maxSteps, Math.round(total / this.stepLen) + 1));

        this.steps = steps;

        samplePolyline(coarse, raw, steps, 0, total);

        for (let i = 0; i < steps; i++) {
            path[i].x = raw[i].x;
            path[i].y = raw[i].y;
        }

        if (rounding > 0) {
            smoothTrailPoints(path, CORNER_PASSES);

            // A convoy coming to rest eases back onto the trail as it was, which
            // is the run of cell centres it is parked on.
            if (rounding < 1) {
                for (let i = 0; i < steps; i++) {
                    path[i].x = raw[i].x + (path[i].x - raw[i].x) * rounding;
                    path[i].y = raw[i].y + (path[i].y - raw[i].y) * rounding;
                }
            }
        }

        const arc = this.arc;

        arc[0] = 0;

        for (let i = 1; i < steps; i++) {
            arc[i] = arc[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
        }

        // Rounding a corner shortens the path across it, so how far along the
        // tractor now sits has to be read back off the rounded path. Smoothing
        // moves points without reordering them, so the sample that stood for the
        // leading point still does.
        const at = Math.min(steps - 1, lookahead / ((total || 1) / (steps - 1)));
        const i0 = Math.min(steps - 2, Math.floor(at));

        this.leadArc = arc[i0] + (arc[i0 + 1] - arc[i0]) * (at - i0);
    }

    /** Position `along` of arc length back from the leading point. */
    pointAlong(along) {
        const path = this.path;
        const arc = this.arc;
        const last = this.steps - 1;
        const want = Math.min(arc[last], Math.max(0, along));

        let i = 1;

        while (i < last && arc[i] < want) i++;

        const run = arc[i] - arc[i - 1];
        const t = run > 0 ? (want - arc[i - 1]) / run : 0;
        const a = path[i - 1];
        const b = path[i];

        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }

    /** Which way the path is running at that arc length. */
    headingAlong(along) {
        const reach = HEAD_SPAN * this.cellSize;
        const total = this.arc[this.steps - 1];
        const ahead = this.pointAlong(Math.max(0, along - reach));
        const behind = this.pointAlong(Math.min(total, along + reach));

        return Math.atan2(ahead.y - behind.y, ahead.x - behind.x);
    }

    /**
     * Wind a vehicle round towards `target`. Solved implicitly - the frame step
     * is not small enough for the plain form to stay put at low stiffness.
     */
    turnTowards(vehicle, target, delta) {
        if (vehicle.heading === null) {
            vehicle.heading = target;
            vehicle.turnRate = 0;
            return;
        }

        const step = delta / 1000;

        if (step <= 0) return;

        const w = TURN_STIFFNESS;
        const gap = Phaser.Math.Angle.Wrap(target - vehicle.heading);
        const damp = 1 + 2 * w * step + w * w * step * step;

        vehicle.turnRate = (vehicle.turnRate + w * w * gap * step) / damp;
        vehicle.heading = Phaser.Math.Angle.Wrap(vehicle.heading + vehicle.turnRate * step);

        if (Math.abs(gap) > TURN_REST || Math.abs(vehicle.turnRate) > TURN_REST_RATE) {
            this.settled = false;
        }
    }

    drawLinks() {
        const g = this.links;

        g.clear();
        g.lineStyle(LINK_WIDTH * this.cellSize, LINK_COLOR, 1);

        for (let i = 1; i < this.count; i++) {
            const a = this.vehicles[i - 1];
            const b = this.vehicles[i];

            if (!a.shown || !b.shown) continue;

            g.lineBetween(a.x, a.y, b.x, b.y);
        }
    }

    setVisible(visible) {
        for (let i = 0; i < this.vehicles.length; i++) this.vehicles[i].art.visible = visible;

        this.links.visible = visible;
    }

    destroy() {
        for (let i = 0; i < this.vehicles.length; i++) this.vehicles[i].art.destroy();

        this.links.destroy();
        this.vehicles.length = 0;
    }
}
