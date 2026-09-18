const ART_MARGIN = 200 / 220;
const TRACTOR_ART_CELL = 220 * ART_MARGIN;
const CART_ART_CELL = 314 * ART_MARGIN;

const VEHICLE_FIT = 1.06;

const TRACTOR_ART = "tractor_front";
const CART_ART = "luggage_cart";

const VEHICLE_SHEET = "luggages";

const TRACTOR_FACING = Math.PI / 2;
const CART_FACING = -Math.PI / 2;

const TURN_RADIUS = 0.5;

const TURN_SEGMENTS = 16;

const LOOK_AHEAD = 2;

const TAIL_PAD = 2.5;

const TANGENT = 0.1;

const TURN_STIFFNESS = 34;
const TURN_REST = 0.002;
const TURN_REST_RATE = 0.01;

const SLIP_STIFFNESS = 26;
const SLIP_REST = 0.05;
const SLIP_REST_RATE = 0.5;

const DOOR_SHRINK = 0.34;

const DOOR_DRAW_OFF = 1.35;

const DOOR_DEEP = 0.28;

const DOOR_REACH = 0.45;

const DOOR_LIFT = 0.06;
const DOOR_LIFT_AT = 0.55;

const LINK_COLOR = 0x23262d;
const LINK_WIDTH = 0.11;

const STRAIGHT = 1e-6;

const LINK_DEPTH = -Number.MAX_VALUE;

export class Convoy {
    constructor(scene, config) {
        this.scene = scene;
        this.key = config.key;
        this.cellSize = config.cellSize;
        this.count = config.count;
        this.settled = false;

        const tractorScale = (this.cellSize * VEHICLE_FIT) / TRACTOR_ART_CELL;
        const cartScale = (this.cellSize * VEHICLE_FIT) / CART_ART_CELL;

        this.links = scene.add.graphics();
        this.links.depth = LINK_DEPTH;
        config.parent.add(this.links);

        this.vehicles = [];

        for (let i = this.count - 1; i >= 0; i--) {
            const tractor = i === 0;
            const scale = tractor ? tractorScale : cartScale;

            const art = scene.add.sprite(
                0, 0, VEHICLE_SHEET,
                this.frameFor(tractor ? TRACTOR_ART : CART_ART)
            );

            art.setOrigin(0.5);
            art.setScale(scale);
            config.parent.add(art);

            this.vehicles[i] = {
                art: art,
                scale: scale,
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

        this.doorShape = scene.make.graphics({ add: false });
        this.doorMask = this.doorShape.createGeometryMask();
        this.doorMask.invertAlpha = true;
        this.doorMasked = false;

        this.corners = [];
        this.road = [];
        this.arc = [];
        this.laid = 0;
        this.leadArc = 0;
        this.extended = { x: 0, y: 0 };

        this.roadWas = [];
        this.trailWas = [{ x: 0, y: 0 }];
        this.wasTrail = { points: this.trailWas };
        this.roadKnown = false;

        this.was = [];
        this.spot = { x: 0, y: 0, heading: 0 };

        this.last = [];

        for (let i = 0; i < this.count; i++) {
            this.was.push({ x: 0, y: 0, heading: 0 });
            this.last.push({ x: 0, y: 0, heading: 0 });
        }

        this.headFirst = true;

        this.parked = false;

        const ahead = Math.max(LOOK_AHEAD, this.count + 1);
        const most = (this.count + ahead + TAIL_PAD + 4) * (TURN_SEGMENTS + 2);

        for (let i = 0; i < most; i++) {
            this.road.push({ x: 0, y: 0 });
            this.arc.push(0);
        }
    }

    frameFor(name) {
        return this.key + "/" + name;
    }

    draw(trail, opts) {
        const settings = opts || {};
        const offset = (settings.recoil || 0) - (settings.swallow || 0);
        const delta = settings.delta || 0;
        const tangent = TANGENT * this.cellSize;

        const radius = TURN_RADIUS * this.cellSize;
        const road = settings.ahead;
        const door = settings.door;

        const turned = this.roadKnown && (settings.headFirst !== false) !== this.headFirst;

        this.headFirst = settings.headFirst !== false;

        const parked = !!settings.parked;
        const wasParked = this.parked;

        if (this.roadKnown && !turned) this.catchUp(trail);

        const shifted = this.roadKnown &&
            (turned || parked !== wasParked || this.trackChanged(trail, road));

        if (turned) {
            for (let i = 0; i < this.count; i++) {
                this.was[i].x = this.last[i].x;
                this.was[i].y = this.last[i].y;
                this.was[i].heading = this.last[i].heading;
            }
        } else if (shifted) {
            this.trailWas[0].x = trail.points[0].x;
            this.trailWas[0].y = trail.points[0].y;

            this.layTrack(this.wasTrail, this.roadWas, wasParked ? 0 : radius);

            for (let i = 0; i < this.count; i++) {
                this.trackAt(i, offset, tangent, this.was[i]);
            }
        }

        this.parked = parked;
        this.layTrack(trail, road, parked ? 0 : radius);
        this.remember(trail, road);

        this.settled = true;

        for (let i = 0; i < this.count; i++) {
            const vehicle = this.vehicles[i];
            const here = this.trackAt(i, offset, tangent, this.spot);

            this.last[i].x = here.x;
            this.last[i].y = here.y;
            this.last[i].heading = here.heading;

            if (shifted) this.takeUpSlip(vehicle, this.was[i], here);

            this.easeSlip(vehicle, delta);
            this.turnTowards(vehicle, here.heading + vehicle.slipTurn, delta);

            vehicle.x = here.x + vehicle.slipX;
            vehicle.y = here.y + vehicle.slipY;
            vehicle.shown = true;

            const art = vehicle.art;

            art.visible = true;
            art.x = vehicle.x;
            art.y = vehicle.y;
            art.depth = vehicle.y;
            art.rotation = vehicle.heading - vehicle.facing;
            art.setScale(vehicle.scale * (door ? this.doorScale(vehicle, door) : 1));
        }

        this.drawLinks();
    }

    doorScale(vehicle, door) {
        const along = (vehicle.x - door.x) * door.outX + (vehicle.y - door.y) * door.outY;
        const reach = door.mouth + DOOR_REACH * this.cellSize;
        const room = door.mouth - door.back + DOOR_DEEP * this.cellSize;

        if (along >= reach) return 1;
        if (along <= door.mouth - room) return DOOR_SHRINK;

        const deep = Math.min(1, Math.max(0, (door.mouth - along) / room));
        const taken = Math.min(1, (reach - along) / (reach - door.back));

        const crest = taken < DOOR_LIFT_AT ?
            taken / DOOR_LIFT_AT :
            (1 - taken) / (1 - DOOR_LIFT_AT);

        const lift = Math.sin(Math.PI * 0.5 * crest) * DOOR_LIFT;

        return 1 + (DOOR_SHRINK - 1) * Math.pow(deep, DOOR_DRAW_OFF) + lift;
    }

    trackAt(i, offset, tangent, out) {
        const slot = this.headFirst ? i : this.count - 1 - i;
        const along = this.leadArc + offset + slot * this.cellSize;
        const here = this.pointAt(along);

        out.x = here.x;
        out.y = here.y;
        out.heading = this.headingAt(along, tangent);

        if (!this.headFirst) out.heading = Phaser.Math.Angle.Wrap(out.heading + Math.PI);

        return out;
    }

    takeUpSlip(vehicle, was, now) {
        vehicle.slipX += was.x - now.x;
        vehicle.slipY += was.y - now.y;
        vehicle.slipTurn += Phaser.Math.Angle.Wrap(was.heading - now.heading);
    }

    easeSlip(vehicle, delta) {
        const step = delta / 1000;

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

    catchUp(trail) {
        const road = this.roadWas;
        const past = this.trailWas;
        const at = trail.points[1];

        if (!at || !road.length) return;

        let reached = 0;

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

    layTrack(trail, ahead, radius) {
        const corners = this.corners;
        const lead = trail.points[0];

        corners.length = 0;

        if (ahead) {
            for (let i = ahead.length - 1; i >= 0; i--) corners.push(ahead[i]);
        }

        if (!corners.length) this.carryOn(trail);

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

        let frontArc = 0;
        let backArc = 0;

        for (let i = 1; i < corners.length - 1; i++) {
            const arc = this.curveThrough(corners, i, radius);

            if (i === leg - 1) frontArc = arc;
            if (i === leg) backArc = arc;
        }

        this.push(corners[corners.length - 1]);

        if (leg === corners.length - 1) backArc = this.arc[this.laid - 1];

        this.leadArc = leg < 1 ? 0 :
            backArc + (frontArc - backArc) * this.alongLeg(lead, corners, leg);
    }

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

    alongLeg(lead, corners, leg) {
        const from = corners[leg];
        const to = corners[leg - 1];
        const span = Math.hypot(to.x - from.x, to.y - from.y);

        if (span < STRAIGHT) return 0;

        return Math.min(1, Math.hypot(lead.x - from.x, lead.y - from.y) / span);
    }

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

        const turn = Math.atan2(Math.abs(cross), dot);
        const reach = Math.min(
            radius / Math.tan((Math.PI - turn) / 2),
            inLen * 0.5,
            outLen * 0.5
        );

        this.push({ x: at.x - ux * reach, y: at.y - uy * reach });

        let midArc = 0;

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

    headingAt(along, tangent) {
        let front = along - tangent;
        let back = along + tangent;

        if (this.parked) {
            if (this.headFirst) {
                front = along - tangent * 2;
                back = along;
            } else {
                front = along;
                back = along + tangent * 2;
            }
        }

        const ahead = this.pointAt(front);
        const behind = this.pointAt(back);

        return Math.atan2(ahead.y - behind.y, ahead.x - behind.x);
    }

    turnTowards(vehicle, target, delta) {
        if (vehicle.heading === null) {
            vehicle.heading = target;
            vehicle.turnRate = 0;
            return;
        }

        const step = delta / 1000;
        const w = TURN_STIFFNESS;

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

    maskDoor(on) {
        if (on === this.doorMasked) return;

        this.doorMasked = on;

        for (let i = 0; i < this.vehicles.length; i++) {
            const art = this.vehicles[i].art;

            if (on) art.setMask(this.doorMask);
            else art.clearMask();
        }

        if (on) this.links.setMask(this.doorMask);
        else this.links.clearMask();
    }

    destroy() {
        for (let i = 0; i < this.vehicles.length; i++) this.vehicles[i].art.destroy();

        this.links.destroy();
        this.doorShape.destroy();
        this.vehicles.length = 0;
    }
}