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
// make up the difference. Read off the art itself, where a vehicle is drawn
// longer along the way it drives: both are now drawn looking straight down at
// them with their length running away from the viewer - the tractor 170 wide by
// 191 tall, the cart 169 by 191 - so both already point down a column.
//
// Kept apart rather than shared because it is a fact about each piece of art
// and not about vehicles: the cart art was once drawn side on, and pointed
// along a row instead.
const TRACTOR_FACING = -Math.PI / 2;
const CART_FACING = -Math.PI / 2;

// The radius the track curves through at a corner, in cells.
//
// Half a cell is measured off the turning animation, and it is also the most a
// grid of whole cells can take: the curve then runs from exactly half a cell
// before a corner to exactly half a cell after it, which is the span the
// animation turns through, and two corners a single cell apart still each get
// their own curve with nothing left over between them.
const TURN_RADIUS = 0.5;

// Straight segments the curve at a corner is drawn with. Enough that a vehicle
// running along it is never seen to step between them. Even, because the arc
// length halfway along the curve is read off the middle one.
const TURN_SEGMENTS = 16;

// Road ahead of the tractor taken into the reckoning, in cells, read off the
// cells it has been routed through. Without it the tractor meets every corner
// blind and snaps round once it is past; with it the corner is already curved
// before it arrives, so the turn sits centred on the corner the way the
// animation has it rather than trailing behind it.
const LOOK_AHEAD = 2;

// Track laid past the last vehicle, in cells. Curving a corner shortens the
// track across it, so there has to be enough slack here that the last cart
// never reaches the end of what has been laid.
const TAIL_PAD = 2.5;

// Half the length of track a vehicle reads its heading across, in cells. Short,
// because the track is already curved - this only has to give a steady
// direction along it, not do any smoothing of its own.
const TANGENT = 0.1;

// A vehicle winds onto the heading the track gives it, as a critically damped
// spring. The track already turns it through the right angles in the right
// places, so this is stiff - a frame or two of give.
//
// Its one real job is the frame a route the player has just asked for first
// appears in: the track gains a corner the tractor may already be standing on,
// and the heading it should be at jumps. Slack enough to take the worst of that
// down to about twice an ordinary frame's turn, tight enough not to drag the
// whole turn along behind where the vehicle actually is.
const TURN_STIFFNESS = 34;
const TURN_REST = 0.002;
const TURN_REST_RATE = 0.01;

// The road ahead is part of the track, and it can change under a convoy that is
// standing on it: letting go drops the corner the tractor was leaning into, and
// asking for a new route lays a different one. Either way the track moves out
// from under the vehicles, and the ground they are drawn on has to keep up.
//
// So the move is measured and taken up as slip - how far each vehicle is drawn
// from where the track now puts it - and wound off as a critically damped
// spring. The vehicle does not move at all on the frame the road changes, and
// eases onto the new track over about a fifth of a second.
//
// Slacker than the heading spring below because it has a real distance to
// cover rather than a frame or two of give: a convoy let go on the approach to
// a corner has to give up most of a turn.
const SLIP_STIFFNESS = 26;
const SLIP_REST = 0.05;
const SLIP_REST_RATE = 0.5;

// A vehicle being drawn into a garage shrinks away over this much track.
const SWALLOW_TAPER = 0.55;

// The couplings, drawn between vehicle centres and covered at both ends by the
// art they join.
const LINK_COLOR = 0x23262d;
const LINK_WIDTH = 0.11;

const STRAIGHT = 1e-6;

/**
 * The vehicles of one convoy and the couplings between them.
 *
 * Every frame a length of track is laid: the cells the tractor is routed onto
 * next, the point it has reached, and the trail running back from it, with
 * every corner curved rather than square. The track is then measured by its own
 * arc length and a vehicle set down every cell of it, facing along it.
 *
 * Measuring along the curve rather than along the cells is what makes the
 * convoy read as one thing: each vehicle runs over exactly the track the one in
 * front of it ran over, and draws up a little through a bend the way anything
 * on a rope does, rather than each turning on the spot as it reaches a corner.
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
                turnRate: 0,

                // How far this vehicle is drawn from where the track now puts
                // it, and how fast that is winding off.
                slipX: 0,
                slipY: 0,
                slipTurn: 0,
                slipRateX: 0,
                slipRateY: 0,
                slipRateTurn: 0
            };
        }

        // Scratch, so draw() allocates nothing. The corners the track is laid
        // through, the track itself, and the arc length reached at each of its
        // points.
        this.corners = [];
        this.road = [];
        this.arc = [];
        this.laid = 0;
        this.leadArc = 0;
        this.extended = { x: 0, y: 0 };

        // The track as it was last laid: the road ahead, and the corners behind.
        // Kept so a track that has changed shape can be laid again as it was and
        // measured against the one replacing it.
        //
        // The tractor's own leading point is left out of it. That point moves
        // every frame, and its movement is the convoy driving rather than the
        // track changing - so the old track is always relaid with the tractor
        // where it is now, and what comes out is the change alone.
        this.roadWas = [];
        this.trailWas = [{ x: 0, y: 0 }];
        this.wasTrail = { points: this.trailWas };
        this.roadKnown = false;

        // Where each vehicle stood on that track, and scratch for where it
        // stands on this one.
        this.was = [];
        this.spot = { x: 0, y: 0, heading: 0 };

        for (let i = 0; i < this.count; i++) this.was.push({ x: 0, y: 0, heading: 0 });

        const most = (this.count + LOOK_AHEAD + TAIL_PAD + 4) * (TURN_SEGMENTS + 2);

        for (let i = 0; i < most; i++) {
            this.road.push({ x: 0, y: 0 });
            this.arc.push(0);
        }
    }

    frameFor(name) {
        return "bus/" + this.key + "/" + name;
    }

    /**
     * `ahead` is the road the tractor is routed onto next, so the corner it is
     * coming up to is curved before it gets there. `recoil` slides the convoy
     * back down the track without moving it off it, which is how the nudge off a
     * wall is drawn; `swallow` slides it the other way, pulling it into a garage
     * a vehicle at a time.
     *
     * The corners are laid at the same radius every frame, moving or stopped.
     * The track is what the convoy is standing on, so anything that reshapes it
     * moves vehicles that are not driving anywhere: straightening a stopped
     * convoy back onto its cells would walk it off its corner every time it came
     * to rest and back around it the moment it set off again.
     *
     * What the track cannot avoid is changing when the road does - letting go
     * drops the corner the tractor was leaning into, and asking for a new route
     * lays a different one. That change is measured and taken up as slip rather
     * than shown, so the convoy eases onto the new track instead of jumping onto
     * it.
     */
    draw(trail, opts) {
        const settings = opts || {};
        const pulled = settings.swallow || 0;
        const offset = (settings.recoil || 0) - pulled;
        const delta = settings.delta || 0;
        const taper = SWALLOW_TAPER * this.cellSize;
        const tangent = TANGENT * this.cellSize;

        const radius = TURN_RADIUS * this.cellSize;
        const road = settings.ahead;

        // Cells the tractor has reached move from the road ahead to the trail
        // behind, which changes both lists and the track not at all.
        if (this.roadKnown) this.catchUp(trail);

        // The track has changed shape under the convoy. Lay it again as it was -
        // with the tractor where it is now, so its own travel does not count -
        // and read off where each vehicle stood, to measure against where the
        // new track puts them.
        const shifted = this.roadKnown && this.trackChanged(trail, road);

        if (shifted) {
            this.trailWas[0].x = trail.points[0].x;
            this.trailWas[0].y = trail.points[0].y;

            this.layTrack(this.wasTrail, this.roadWas, radius);

            for (let i = 0; i < this.count; i++) {
                this.trackAt(i, offset, tangent, this.was[i]);
            }
        }

        this.layTrack(trail, road, radius);
        this.remember(trail, road);

        // Cleared by any vehicle still turning or still winding off slip, so the
        // board knows to keep drawing until the convoy has properly come to rest.
        this.settled = true;

        for (let i = 0; i < this.count; i++) {
            const vehicle = this.vehicles[i];
            const here = this.trackAt(i, offset, tangent, this.spot);

            // Full size until a garage starts pulling it in, then shrinking away
            // over the last half cell so nothing pokes out past the doorway.
            const room = i * this.cellSize - pulled;
            const fade = pulled > 0 ? Math.min(1, Math.max(0, (room + taper) / taper)) : 1;

            if (shifted) this.takeUpSlip(vehicle, this.was[i], here);

            this.easeSlip(vehicle, delta);
            this.turnTowards(vehicle, here.heading + vehicle.slipTurn, delta);

            vehicle.x = here.x + vehicle.slipX;
            vehicle.y = here.y + vehicle.slipY;
            vehicle.shown = fade > 0.02;

            const art = vehicle.art;

            art.visible = vehicle.shown;
            art.x = vehicle.x;
            art.y = vehicle.y;
            art.rotation = vehicle.heading - vehicle.facing;
            art.setScale(this.scale * fade);
        }

        this.drawLinks();
    }

    /** Where the track puts vehicle `i`, and which way it faces there. */
    trackAt(i, offset, tangent, out) {
        const along = this.leadArc + offset + i * this.cellSize;
        const here = this.pointAt(along);

        out.x = here.x;
        out.y = here.y;
        out.heading = this.headingAt(along, tangent);

        return out;
    }

    /**
     * Take up the move from `was` to `now` as slip, so the vehicle is drawn
     * exactly where it was drawn last frame and the new track is eased onto
     * rather than snapped to.
     */
    takeUpSlip(vehicle, was, now) {
        vehicle.slipX += was.x - now.x;
        vehicle.slipY += was.y - now.y;
        vehicle.slipTurn += Phaser.Math.Angle.Wrap(was.heading - now.heading);
    }

    /**
     * Wind the slip off towards nothing. Critically damped, and starting from
     * rest, so a vehicle eases out of the offset rather than setting off at full
     * tilt the frame the road changes. Solved implicitly, the same as the
     * heading spring and for the same reason.
     */
    easeSlip(vehicle, delta) {
        const step = delta / 1000;

        // A frame of no time winds nothing off, but it must still say whether
        // there is slip left to wind off: the convoy is redrawn once with no
        // time on it as it comes to rest, and reporting itself settled there
        // would stop the board redrawing and leave the slip standing.
        if (step > 0) {
            const w = SLIP_STIFFNESS;
            const damp = 1 + 2 * w * step + w * w * step * step;

            vehicle.slipRateX = (vehicle.slipRateX - w * w * vehicle.slipX * step) / damp;
            vehicle.slipRateY = (vehicle.slipRateY - w * w * vehicle.slipY * step) / damp;
            vehicle.slipRateTurn =
                (vehicle.slipRateTurn - w * w * vehicle.slipTurn * step) / damp;

            vehicle.slipX += vehicle.slipRateX * step;
            vehicle.slipY += vehicle.slipRateY * step;
            vehicle.slipTurn += vehicle.slipRateTurn * step;
        }

        const still = Math.abs(vehicle.slipX) < SLIP_REST &&
            Math.abs(vehicle.slipY) < SLIP_REST &&
            Math.abs(vehicle.slipRateX) < SLIP_REST_RATE &&
            Math.abs(vehicle.slipRateY) < SLIP_REST_RATE &&
            Math.abs(vehicle.slipTurn) < TURN_REST &&
            Math.abs(vehicle.slipRateTurn) < TURN_REST_RATE;

        if (!still) {
            this.settled = false;
            return;
        }

        vehicle.slipX = 0;
        vehicle.slipY = 0;
        vehicle.slipTurn = 0;
        vehicle.slipRateX = 0;
        vehicle.slipRateY = 0;
        vehicle.slipRateTurn = 0;
    }

    /**
     * Move the cells the tractor has reached since the last frame from the
     * remembered road ahead to the remembered trail behind.
     *
     * Handing a cell from one list to the other leaves the track itself exactly
     * as it was - it is the same run of corners, split in a different place. But
     * it is the split that says which leg of the track the tractor is on, so
     * without this the track would be relaid with the tractor still short of a
     * corner it has already driven through, and the convoy would be shown
     * jumping the difference.
     */
    catchUp(trail) {
        const road = this.roadWas;
        const past = this.trailWas;
        const at = trail.points[1];

        if (!at || !road.length) return;

        let reached = 0;

        // The road is held nearest first, so a cell that is now the newest
        // corner behind the tractor takes every cell before it with it.
        for (let i = 0; i < road.length; i++) {
            if (road[i].x === at.x && road[i].y === at.y) {
                reached = i + 1;
                break;
            }
        }

        if (!reached) return;

        for (let i = 0; i < reached; i++) {
            past.splice(1, 0, { x: road[i].x, y: road[i].y });
        }

        road.splice(0, reached);
    }

    /**
     * Would the track come out differently from the one last laid? Only the road
     * ahead and the corners behind are compared - the tractor's leading point is
     * left out, because it moves every frame and that is the convoy driving
     * rather than the track changing.
     *
     * A cell handed over from the road to the trail as the tractor reaches it
     * changes both lists at once and the track not at all, which is why they
     * have to be compared together rather than one at a time.
     */
    trackChanged(trail, road) {
        return this.listChanged(this.roadWas, road, 0) ||
            this.listChanged(this.trailWas, trail.points, 1);
    }

    listChanged(was, now, from) {
        const count = now ? now.length - from : 0;

        if (was.length - from !== count) return true;

        for (let i = 0; i < count; i++) {
            if (was[from + i].x !== now[from + i].x ||
                was[from + i].y !== now[from + i].y) return true;
        }

        return false;
    }

    remember(trail, road) {
        this.keep(this.roadWas, road, 0);
        this.keep(this.trailWas, trail.points, 1);
        this.roadKnown = true;
    }

    keep(was, now, from) {
        const count = now ? now.length - from : 0;

        while (was.length - from < count) was.push({ x: 0, y: 0 });

        was.length = from + count;

        for (let i = 0; i < count; i++) {
            was[from + i].x = now[from + i].x;
            was[from + i].y = now[from + i].y;
        }
    }

    /**
     * Lay the track: the cells the convoy is routed onto next, furthest first,
     * then the cells behind it, with every corner curved through `radius`. The
     * tractor's own place along it is worked out afterwards, into `leadArc`.
     *
     * The tractor is deliberately not laid down as one of the corners. It is not
     * a bend - it only marks how far down the track the convoy has got - and
     * putting it on the track spikes it: within half a cell of a corner the
     * tractor stands inside that corner's curve, and a track made to pass
     * through it has to leave the curve, double back to the square corner and
     * pick the curve up again. That spike sits exactly where the convoy is
     * rounding the bend, which is the one place it must not.
     */
    layTrack(trail, ahead, radius) {
        const corners = this.corners;
        const lead = trail.points[0];

        corners.length = 0;

        if (ahead) {
            for (let i = ahead.length - 1; i >= 0; i--) corners.push(ahead[i]);
        }

        // Nothing routed - the tractor has stopped, or is walking back off a
        // step it never finished. The cell it would be driving onto is put in
        // anyway, so the corner behind it still has a whole leg to curve into
        // rather than one that ends wherever the tractor happens to have got to,
        // and so the track does not change shape under a convoy the moment its
        // route runs out.
        if (!corners.length) this.carryOn(trail);

        // Where the corner behind the tractor lands, and so which leg of the
        // track the tractor is somewhere along: the one from there to the point
        // before it.
        const leg = corners.length;

        for (let i = 1; i < trail.points.length; i++) corners.push(trail.points[i]);

        if (corners.length < 2) {
            this.laid = 0;
            this.push(lead);
            this.leadArc = 0;
            return;
        }

        this.laid = 0;
        this.push(corners[0]);

        // Arc length at the two ends of that leg. A curved corner is not on the
        // track itself, so each stands at the middle of its own curve, which is
        // where a vehicle parked on that cell belongs.
        let frontArc = 0;
        let backArc = 0;

        for (let i = 1; i < corners.length - 1; i++) {
            const arc = this.curveThrough(corners, i, radius);

            if (i === leg - 1) frontArc = arc;
            if (i === leg) backArc = arc;
        }

        this.push(corners[corners.length - 1]);

        if (leg === corners.length - 1) backArc = this.arc[this.laid - 1];

        // No leg at all: nothing was routed and the tractor has no direction to
        // carry on in, so it is standing on the front of the track.
        this.leadArc = leg < 1 ? 0 :
            backArc + (frontArc - backArc) * this.alongLeg(lead, corners, leg);
    }

    /**
     * Put in the cell the tractor would be driving onto, a cell on from the
     * corner behind it in the direction it is travelling.
     *
     * That is exactly the cell a route would have handed over, so a convoy whose
     * route runs out - or which is walking back off a step it never finished -
     * keeps the very same track under it rather than having its front redrawn.
     * The direction comes from how far it has got off that corner, and from the
     * corner before it when it is sitting on one: a resting convoy has its
     * leading point and the corner beneath it in the same place.
     */
    carryOn(trail) {
        const points = trail.points;

        if (points.length < 2) return;

        let dx = points[0].x - points[1].x;
        let dy = points[0].y - points[1].y;

        if (Math.hypot(dx, dy) < STRAIGHT) {
            if (points.length < 3) return;

            dx = points[1].x - points[2].x;
            dy = points[1].y - points[2].y;
        }

        const len = Math.hypot(dx, dy);

        if (len < STRAIGHT) return;

        this.extended.x = points[1].x + (dx / len) * this.cellSize;
        this.extended.y = points[1].y + (dy / len) * this.cellSize;

        this.corners.push(this.extended);
    }

    /**
     * How far the tractor has got along its leg, from the corner behind it to
     * the point ahead of it, as a fraction.
     *
     * Read off the square cells and spent on the curved track, so a convoy
     * cutting a corner covers a shade less ground than the grid says it does -
     * the same as anything running on rails. The carts are spaced off this
     * point along that same curved track, so it has to be measured the way they
     * are or they would crowd or stretch through every bend.
     */
    alongLeg(lead, corners, leg) {
        const from = corners[leg];
        const to = corners[leg - 1];
        const span = Math.hypot(to.x - from.x, to.y - from.y);

        if (span < STRAIGHT) return 0;

        return Math.min(1, Math.hypot(lead.x - from.x, lead.y - from.y) / span);
    }

    /**
     * Put the corner at `i` onto the track, curved if it turns. The curve leaves
     * each leg `reach` short of the corner and runs from one leg to the other,
     * so the track meets both running exactly along them - nothing turns until
     * the curve starts, and it is square again the moment it ends.
     *
     * Hands back the arc length standing for the corner itself, which is where a
     * vehicle parked on that cell belongs: the middle of the curve where it
     * turns, the corner itself where it does not.
     */
    curveThrough(corners, i, radius) {
        const prev = corners[i - 1];
        const at = corners[i];
        const next = corners[i + 1];

        const inX = at.x - prev.x;
        const inY = at.y - prev.y;
        const outX = next.x - at.x;
        const outY = next.y - at.y;

        const inLen = Math.hypot(inX, inY);
        const outLen = Math.hypot(outX, outY);

        if (inLen < STRAIGHT || outLen < STRAIGHT) {
            this.push(at);
            return this.arc[this.laid - 1];
        }

        const ux = inX / inLen;
        const uy = inY / inLen;
        const vx = outX / outLen;
        const vy = outY / outLen;

        const cross = ux * vy - uy * vx;
        const dot = ux * vx + uy * vy;

        if (Math.abs(cross) < STRAIGHT || radius <= 0) {
            this.push(at);
            return this.arc[this.laid - 1];
        }

        // How far back down each leg the curve has to start to come round at
        // this radius, kept inside half of either leg so two corners a cell
        // apart never fight over the same stretch of track.
        const turn = Math.atan2(Math.abs(cross), dot);
        const reach = Math.min(
            radius / Math.tan((Math.PI - turn) / 2),
            inLen * 0.5,
            outLen * 0.5
        );

        this.push({ x: at.x - ux * reach, y: at.y - uy * reach });

        let midArc = 0;

        // Run a point along each leg's own line - the incoming one from where
        // the curve starts on through the corner, the outgoing one from short of
        // the corner out to where the curve ends - and hand the track over from
        // the first to the second.
        //
        // What matters is how the handover is paced. Paced evenly the track
        // would be a plain quadratic through the corner: it meets both legs
        // pointing the right way, but it takes up its full bend the instant it
        // leaves the straight, so a vehicle reaching the curve starts turning at
        // full rate in one frame and stops dead at the far end. Eased in and out
        // instead - flat in value, slope and curvature at both ends - the bend
        // is taken up and given back over the length of the curve, so a vehicle
        // winds into the turn and out of it. That easing is the whole of what
        // makes a corner read as track rather than as a hinge, and the path
        // either way runs through the same points, so nothing else shifts.
        for (let s = 1; s <= TURN_SEGMENTS; s++) {
            const t = s / TURN_SEGMENTS;
            const hand = t * t * t * (t * (t * 6 - 15) + 10);

            const back = (1 - hand) * reach * (t - 1);
            const on = hand * reach * t;

            this.push({
                x: at.x + ux * back + vx * on,
                y: at.y + uy * back + vy * on
            });

            if (s === TURN_SEGMENTS / 2) midArc = this.arc[this.laid - 1];
        }

        return midArc;
    }

    push(point) {
        const road = this.road;
        const at = this.laid;

        if (at >= road.length) return;

        road[at].x = point.x;
        road[at].y = point.y;

        this.arc[at] = at === 0 ? 0 :
            this.arc[at - 1] + Math.hypot(point.x - road[at - 1].x, point.y - road[at - 1].y);

        this.laid = at + 1;
    }

    /** Position `along` of arc length down the track from its leading end. */
    pointAt(along) {
        const road = this.road;
        const arc = this.arc;
        const last = this.laid - 1;
        const want = Math.min(arc[last], Math.max(0, along));

        let i = 1;

        while (i < last && arc[i] < want) i++;

        const run = arc[i] - arc[i - 1];
        const t = run > 0 ? (want - arc[i - 1]) / run : 0;
        const a = road[i - 1];
        const b = road[i];

        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }

    /** Which way the track runs at that arc length. */
    headingAt(along, tangent) {
        const ahead = this.pointAt(along - tangent);
        const behind = this.pointAt(along + tangent);

        return Math.atan2(ahead.y - behind.y, ahead.x - behind.x);
    }

    /**
     * Wind a vehicle round towards `target`. Solved implicitly - the frame step
     * is not small enough for the plain form to stay put at this stiffness.
     */
    turnTowards(vehicle, target, delta) {
        if (vehicle.heading === null) {
            vehicle.heading = target;
            vehicle.turnRate = 0;
            return;
        }

        const step = delta / 1000;
        const w = TURN_STIFFNESS;

        // As in easeSlip: a frame of no time turns the vehicle nowhere, but it
        // still has to report a turn left to make.
        if (step > 0) {
            const gap = Phaser.Math.Angle.Wrap(target - vehicle.heading);
            const damp = 1 + 2 * w * step + w * w * step * step;

            vehicle.turnRate = (vehicle.turnRate + w * w * gap * step) / damp;
            vehicle.heading =
                Phaser.Math.Angle.Wrap(vehicle.heading + vehicle.turnRate * step);
        }

        const left = Phaser.Math.Angle.Wrap(target - vehicle.heading);

        if (Math.abs(left) > TURN_REST || Math.abs(vehicle.turnRate) > TURN_REST_RATE) {
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