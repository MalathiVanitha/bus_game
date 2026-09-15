import { samplePolyline } from './trail.js';

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

// Which way each render is already pointing, so a vehicle's heading only has to
// make up the difference.
//
// Read off the art itself, where a vehicle is drawn longer along the way it
// drives: the cart is drawn side on - 191 wide by 156 tall, two suitcases and
// two axles down its length - so it already points along a row. The tractor is
// drawn head on - 170 by 191, its length running away from the viewer - so it
// points down a column. Giving both the same offset leaves one of them lying
// across its own direction of travel.
const TRACTOR_FACING = Math.PI / 2;
const CART_FACING = 0;

// Half the length of road a vehicle reads its heading across, in cells - from
// its centre out to its axles, near enough.
//
// This one number is the whole of the turn. A vehicle further than this from a
// corner has both ends of the read on the same straight and points straight
// along it; as it crosses, the read spans the corner and swings round. Half a
// cell is measured off the turning animation, which turns through nothing until
// half a cell before a corner and is square again half a cell after it.
const HEAD_SPAN = 0.5;

// Road ahead of the tractor taken into the reckoning, in cells, read off the
// cells it has been routed through. Without it the tractor meets every corner
// blind and snaps round once it is past; with it the corner is there to be read
// before it arrives, so the turn sits centred on the corner as the animation
// has it rather than trailing behind it.
const LOOK_AHEAD = 2;

// A vehicle winds onto the heading the road gives it, as a critically damped
// spring. The road already turns it through the right angles at the right
// places, so this is deliberately stiff - about a frame of give. Enough to take
// the corner off the moment a turn starts and off the moment it ends, and to
// swallow the frame a route the player has just asked for appears in, without
// dragging the whole turn along behind where the vehicle actually is.
const TURN_STIFFNESS = 55;

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
            const tractor = i === 0;
            const art = scene.add.sprite(
                0, 0, "sheet",
                this.frameFor(tractor ? TRACTOR_ART : CART_ART)
            );

            art.setOrigin(0.5);
            art.setScale(this.scale);
            config.parent.add(art);

            this.vehicles[i] = {
                art: art,
                facing: tractor ? TRACTOR_FACING : CART_FACING,
                x: 0,
                y: 0,
                shown: true,
                heading: null,
                turnRate: 0
            };
        }

        // Scratch, so draw() allocates nothing: the road the convoy is laid
        // along, and the two ends of the read a vehicle takes its heading from.
        this.coarse = [];
        this.lookahead = 0;
        this.ends = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
    }

    frameFor(name) {
        return "bus/" + this.key + "/" + name;
    }

    /**
     * Where a vehicle sits comes off the trail itself, by arc length, so two
     * vehicles are a cell apart wherever they are - folded round a corner just
     * as on a straight. Which way it points comes off a rounded-off copy of that
     * same trail, which is what gives the sweep through a bend. Position and
     * heading are read at the same point of the same run of trail, so the two
     * can never disagree about where the vehicle is.
     *
     * `ahead` is the road the tractor is routed onto next, so the corner it is
     * coming up to is rounded along with the ones behind it. `recoil` slides the
     * convoy back down the trail without moving it off it, which is how the
     * nudge off a wall is drawn; `swallow` slides it the other way, pulling it
     * into a garage a vehicle at a time.
     */
    draw(trail, opts) {
        const settings = opts || {};
        const pulled = settings.swallow || 0;
        const offset = (settings.recoil || 0) - pulled;
        const delta = settings.delta || 0;
        const taper = SWALLOW_TAPER * this.cellSize;

        this.layRoad(trail, settings.ahead);

        const reach = HEAD_SPAN * this.cellSize;

        // Cleared by any vehicle still turning, so the board knows to keep
        // drawing until the convoy has properly come to rest.
        this.settled = true;

        for (let i = 0; i < this.count; i++) {
            const along = i * this.cellSize + offset;
            const vehicle = this.vehicles[i];
            const here = trail.pointAt(along);

            // Full size until a garage starts pulling it in, then shrinking away
            // over the last half cell so nothing pokes out past the doorway.
            const room = i * this.cellSize - pulled;
            const fade = pulled > 0 ? Math.min(1, Math.max(0, (room + taper) / taper)) : 1;

            this.turnTowards(vehicle, this.headingAt(this.lookahead + along, reach), delta);

            vehicle.x = here.x;
            vehicle.y = here.y;
            vehicle.shown = fade > 0.02;

            const art = vehicle.art;

            art.visible = vehicle.shown;
            art.x = here.x;
            art.y = here.y;
            art.rotation = vehicle.heading - vehicle.facing;
            art.setScale(this.scale * fade);
        }

        this.drawLinks();
    }

    /**
     * Lay out the road this convoy sits on: the cells it is routed onto next,
     * furthest first, then the leading point and the trail running back from
     * it. One run of points from in front of the tractor to behind the last
     * cart, with `lookahead` saying how much of it is road not yet driven.
     */
    layRoad(trail, ahead) {
        const coarse = this.coarse;

        coarse.length = 0;

        if (ahead) {
            for (let i = ahead.length - 1; i >= 0; i--) coarse.push(ahead[i]);
        }

        for (let i = 0; i < trail.points.length; i++) coarse.push(trail.points[i]);

        const leadIndex = coarse.length - trail.points.length;

        let lookahead = 0;

        for (let i = 1; i <= leadIndex; i++) {
            lookahead += Math.hypot(
                coarse[i].x - coarse[i - 1].x,
                coarse[i].y - coarse[i - 1].y
            );
        }

        this.lookahead = lookahead;
    }

    /**
     * Which way a vehicle `at` along the road is pointing: the line from the
     * road under its back axle to the road under its front one. Both ends are
     * read off the road as it actually runs, so a vehicle clear of a corner
     * reads two points of one straight and comes out exactly square to it.
     */
    headingAt(at, reach) {
        const ends = this.ends;

        // Walked front to back, which is the only order samplePolyline reads in:
        // ends[0] is the road ahead of the vehicle, ends[1] the road behind it.
        samplePolyline(this.coarse, ends, 2, at - reach, at + reach);

        return Math.atan2(ends[0].y - ends[1].y, ends[0].x - ends[1].x);
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
