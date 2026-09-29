import { bakeShape } from '../utils/bake.js';

// The change from one screen to the next, done with the game's own pieces:
// the screen is cut into lanes a board row high, and a convoy from the board
// drives down each one, tractor first, laying the board behind it. The lanes
// set off one after another from the top, and every other one runs the other
// way, like traffic, until the screen is all board. The screens are swapped
// under it, and the convoys come through again and take the board up behind
// them, onto the new screen.
//
// Every convoy drives at one steady speed and only across its own lane, so
// none of them has to cover much ground in a frame.

// One cell of the board, shaped the way board.js draws its own (a bevelled
// tile in a well) but in the blues of the game's buttons, with their gloss.
const CELL = 64;
const WELL = 0x2c64c9;
const TILE_FACE = 0x4f96f2;
const TILE_LIGHT = 0x8cc0ff;
const TILE_SHADE = 0x2f73dc;
const TILE_GAP = 3;
const TILE_CORNER = 10;
const TILE_BEVEL = 3;
const GLOSS = 0xffffff;
const GLOSS_ALPHA = 0.22;
const GLOSS_INSET = 7;
const GLOSS_H = 14;

// A lane is one row of the board, its tiles drawn this big.
const LANE = 96;

// The white rim of the board, along the edge each convoy is dragging.
const RIM = 0xffffff;
const RIM_W = 6;
const EDGE_SHADE = 0x283085;
const EDGE_SHADE_ALPHA = 0.18;
const EDGE_SHADE_W = 14;

// The convoys are built the way convoy.js builds them, one vehicle to a cell,
// from the same art.
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

const VEHICLE = LANE * 0.84;
const CARTS = [2, 3, 2, 3, 1, 3];
const COLORS = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'lime', 'white'];

const SHADOW = 0x101a33;
const SHADOW_ALPHA = 0.22;
const SHADOW_DY = 6;

// The carts sway a little behind the tractor as they go.
const SWAY = 2.2;
const SWAY_TIME = 150;
const SWAY_LAG = 0.9;

// How far the board's edge tucks under the last cart.
const TUCK = 18;

// Design units a millisecond, the same for every lane on every screen.
const SPEED = 1.7;
// Between one lane setting off and the next.
const STAGGER = 34;
// Fully covered, after the swap, before the board starts to come up.
const HOLD_TIME = 120;
// Frames let go by after the swap before the clock runs on, so any hitch from
// building the new screen falls while it is covered.
const SETTLE_FRAMES = 2;
// The most the clock moves in one frame, whatever the frame took.
const MAX_STEP = 1000 / 30;

export class Transition extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.running = false;
        this.lanes = [];
        this.builtFor = '';

        // Swallows taps while a change is under way.
        this.blocker = this.scene.add.zone(0, 0, 10, 10);
        this.add(this.blocker);

        this.buildBoard();

        this.edges = this.scene.add.container(0, 0);
        this.add(this.edges);

        this.traffic = this.scene.add.container(0, 0);
        this.add(this.traffic);

        this.visible = false;
    }

    buildBoard() {
        const tile = bakeShape(this.scene, {
            left: 0, top: 0, width: CELL, height: CELL
        }, (g) => {
            const x = TILE_GAP;
            const w = CELL - TILE_GAP * 2;

            g.fillStyle(WELL, 1);
            g.fillRect(0, 0, CELL, CELL);

            g.fillStyle(TILE_SHADE, 1);
            g.fillRoundedRect(x, x, w, w, TILE_CORNER);

            g.fillStyle(TILE_LIGHT, 1);
            g.fillRoundedRect(x, x, w, w - TILE_BEVEL, TILE_CORNER);

            g.fillStyle(TILE_FACE, 1);
            g.fillRoundedRect(x, x + TILE_BEVEL, w, w - TILE_BEVEL * 2, TILE_CORNER);

            g.fillStyle(GLOSS, GLOSS_ALPHA);
            g.fillRoundedRect(x + GLOSS_INSET, x + TILE_BEVEL + GLOSS_INSET / 2, w - GLOSS_INSET * 2, GLOSS_H, GLOSS_H / 2);
        }, 'transition-tile', Math.min(3, Math.max(1, (this.scene.gameScale || 1) * LANE / CELL)));

        this.tileRes = 1 / tile.restScale;
        tile.destroy();

        this.board = this.scene.add.tileSprite(0, 0, 10, 10, 'transition-tile');
        this.board.setTileScale(LANE / CELL / this.tileRes);
        this.add(this.board);

        // The board stays put on the screen, and a mask shows the part of it
        // the convoys have laid. Masks work in world space.
        this.cut = this.scene.make.graphics({ add: false });
        this.board.setMask(this.cut.createGeometryMask());
    }

    // A lane for every board row the screen is high, each with its convoy, rim
    // and shade. Built again only when the screen changes size.
    buildLanes(width, height) {
        const size = width + 'x' + height;

        if (this.builtFor === size) return;

        this.builtFor = size;

        this.traffic.removeAll(true);
        this.edges.removeAll(true);
        this.lanes = [];

        const count = Math.ceil(height / LANE);

        for (let i = 0; i < count; i++) {
            const carts = CARTS[i % CARTS.length];
            const lane = {
                y: -height / 2 + LANE * (i + 0.5),
                length: VEHICLE * (carts + 1),
                convoy: this.scene.add.container(0, 0),
                vehicles: [],
                rim: this.scene.add.rectangle(0, 0, RIM_W, LANE, RIM),
                shade: this.scene.add.rectangle(0, 0, EDGE_SHADE_W, LANE, EDGE_SHADE, EDGE_SHADE_ALPHA),
                dir: -1
            };

            lane.convoy.y = lane.y;

            this.edges.add(lane.shade);
            this.edges.add(lane.rim);
            this.traffic.add(lane.convoy);

            // Couplings first, under the vehicles, then shadows, then the
            // vehicles, last cart first so the tractor is on top.
            for (let k = 0; k < carts; k++) {
                const link = this.scene.add.rectangle(0, 0, VEHICLE, LINK_WIDTH * VEHICLE, LINK_COLOR);
                link.linkIndex = k;
                lane.convoy.add(link);
            }

            const shadows = [];
            const arts = [];

            for (let k = carts; k >= 0; k--) {
                const tractor = k === 0;
                const scale = VEHICLE * VEHICLE_FIT / (tractor ? TRACTOR_ART_CELL : CART_ART_CELL);

                const shadow = this.scene.add.sprite(0, 0, VEHICLE_SHEET, 'red/' + CART_ART);
                shadow.setScale(scale);
                shadow.setTintFill(SHADOW);
                shadow.alpha = SHADOW_ALPHA;
                shadows.push(shadow);

                const art = this.scene.add.sprite(0, 0, VEHICLE_SHEET, 'red/' + CART_ART);
                art.setScale(scale);
                arts.push(art);

                lane.vehicles[k] = { art, shadow, tractor };
            }

            shadows.forEach((s) => lane.convoy.add(s));
            arts.forEach((a) => lane.convoy.add(a));

            lane.links = lane.convoy.list.filter((o) => o.linkIndex !== undefined);

            this.lanes.push(lane);
        }
    }

    // Each run, the lanes get their colours and directions afresh.
    dressLanes() {
        const first = Phaser.Math.Between(0, COLORS.length - 1);
        const flip = Math.random() < 0.5 ? 1 : -1;

        this.lanes.forEach((lane, i) => {
            const color = COLORS[(first + i * 3) % COLORS.length];

            lane.dir = (i % 2 === 0 ? -1 : 1) * flip;

            lane.vehicles.forEach((v, k) => {
                const frame = color + '/' + (v.tractor ? TRACTOR_ART : CART_ART);
                const heading = lane.dir < 0 ? Math.PI : 0;
                const facing = v.tractor ? TRACTOR_FACING : CART_FACING;

                v.art.setFrame(frame);
                v.shadow.setFrame(frame);
                v.rotation = heading - facing;
                v.x = -lane.dir * (VEHICLE / 2 + k * VEHICLE);

                v.art.x = v.shadow.x = v.x;
                v.art.y = 0;
                v.shadow.y = SHADOW_DY;
                v.art.rotation = v.shadow.rotation = v.rotation;
            });

            lane.links.forEach((link) => {
                link.x = -lane.dir * VEHICLE * (link.linkIndex + 1);
            });
        });
    }

    /**
     * Lays the board, calls onCovered to swap what is under it, then takes it
     * up and calls onDone. A change asked for while one is running is dropped,
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

        this.board.setSize(width, height);

        this.buildLanes(width, height);
        this.dressLanes();

        this.traffic.visible = true;
        this.onCovered = onCovered;
        this.onDone = onDone;
        this.pass = this.passTime();
        this.stage = 'laying';
        this.clock = 0;

        this.draw(true, 0);

        this.scene.events.on('update', this.tick, this);

        return true;
    }

    // Its own clock, stepped once a frame. A slow frame only slows it down
    // for that frame, rather than throwing the convoys a long way on.
    tick(time, delta) {
        const step = Math.min(delta || 0, MAX_STEP);

        if (this.stage === 'laying') {
            this.clock = Math.min(this.pass, this.clock + step);
            this.draw(true, this.clock);

            if (this.clock < this.pass) return;

            this.traffic.visible = false;
            this.stage = 'settling';
            this.settleFrames = SETTLE_FRAMES;

            if (this.onCovered) this.onCovered();

            return;
        }

        if (this.stage === 'settling') {
            if (--this.settleFrames > 0) return;

            this.stage = 'lifting';
            this.clock = -HOLD_TIME;

            this.dressLanes();
            this.traffic.visible = true;
            this.draw(false, 0);

            return;
        }

        this.clock = Math.min(this.pass, this.clock + step);

        if (this.clock <= 0) return;

        this.draw(false, this.clock);

        if (this.clock < this.pass) return;

        this.scene.events.off('update', this.tick, this);

        this.stage = null;
        this.running = false;
        this.visible = false;
        this.cut.clear();
        this.blocker.disableInteractive();

        if (this.onDone) this.onDone();
    }

    // Everything the change shows, put through the renderer once, unseen, so
    // its art is already on the GPU and the first real change has no hitch.
    warmUp() {
        if (this.running || this.warmed) return;

        this.warmed = true;

        this.board.setSize(dimensions.actualWidth, dimensions.actualHeight);
        this.dressLanes();
        this.draw(true, this.passTime() / 2);

        this.alpha = 0.001;
        this.visible = true;

        this.scene.events.once('postrender', () => {
            if (this.running) return;

            this.visible = false;
            this.alpha = 1;
            this.cut.clear();
        });
    }

    // Long enough for the last lane's convoy to get right across.
    passTime() {
        const most = Math.max(...this.lanes.map((lane) => lane.length));

        return (this.lanes.length - 1) * STAGGER + (dimensions.actualWidth + most + TUCK) / SPEED;
    }

    draw(laying, at) {
        const width = dimensions.actualWidth;
        const matrix = this.getWorldTransformMatrix();

        this.cut.clear();
        this.cut.fillStyle(0xffffff, 1);

        this.lanes.forEach((lane, i) => {
            const dir = lane.dir;
            const travel = Phaser.Math.Clamp((at - i * STAGGER) * SPEED, 0, width + lane.length + TUCK);

            // The tractor's nose, in from just off the side the lane starts
            // on, and the board's edge, tucked under the last cart.
            const front = -dir * (width / 2) + dir * travel;
            const edge = front - dir * (lane.length - TUCK);

            // Laying, the board runs from the edge back to the side the convoy
            // came in from; taking it up, from the far side to the edge.
            const cameFrom = -dir * width / 2;
            const goingTo = dir * width / 2;
            const behind = laying ? cameFrom : goingTo;

            const left = Phaser.Math.Clamp(Math.min(edge, behind), -width / 2, width / 2);
            const right = Phaser.Math.Clamp(Math.max(edge, behind), -width / 2, width / 2);

            if (right > left) {
                const topLeft = matrix.transformPoint(left, lane.y - LANE / 2);
                const bottomRight = matrix.transformPoint(right, lane.y + LANE / 2);

                this.cut.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
            }

            // The rim along the board's open edge, and its shade on the
            // screen beyond it. The board lies on the side it came from when
            // laying, and the side it is going to when being taken up.
            const side = laying ? -dir : dir;
            const showEdge = right > left && edge > -width / 2 && edge < width / 2;

            lane.rim.visible = showEdge;
            lane.shade.visible = showEdge;
            lane.rim.setPosition(edge - side * RIM_W / 2, lane.y);
            lane.shade.setPosition(edge - side * (RIM_W + EDGE_SHADE_W / 2), lane.y);

            const moving = travel > 0 && travel < width + lane.length + TUCK;

            lane.convoy.x = front;
            lane.convoy.visible = moving;

            if (!moving) return;

            // The carts sway behind the tractor, each a beat after the one
            // in front.
            lane.vehicles.forEach((v, k) => {
                const sway = Math.sin(at / SWAY_TIME - k * SWAY_LAG + i) * SWAY * (v.tractor ? 0.4 : 1);
                const turn = Phaser.Math.DegToRad(sway);

                v.art.rotation = v.rotation + turn;
                v.shadow.rotation = v.art.rotation;
            });
        });
    }

    adjust() {
        this.x = dimensions.gameWidth / 2;
        this.y = dimensions.gameHeight / 2;

        // Ready ahead of the first run, so it does not start on a hitch.
        if (!this.running && dimensions.actualWidth) {
            this.buildLanes(dimensions.actualWidth, dimensions.actualHeight);
            this.warmUp();
        }
    }
}
