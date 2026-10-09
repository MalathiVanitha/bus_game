// Adds levels to the end of data/level-data.js, from the one after its last up
// to LAST (1000, or the number given), each a board of its own laid out here.
//
// A new level takes its size and walls from one of levels 41-100, mirrored
// one of four ways, and nothing else: its holes, obstacles, convoys and
// garages are packed afresh the way tools/harden-levels.mjs packs a Super
// Hard board - convoys parked last-to-go first, each across the roads home
// of the ones already there, so the board always clears, then where
// everything stands searched over (simulated annealing) for a harder board.
// How full and how long that search runs depends on the level's difficulty,
// which keeps the beat of levels 1-100: a Hard level on every fifth, a Super
// Hard one on every tenth, Normal between; and all of it ramps up from 201
// to LAST (see PLAN). Bigger boards come in as the levels go on.
//
// Garages are then frozen as tools/freeze-levels.mjs freezes them, two or
// three to a board and counting higher further on; each freeze is kept only
// where the board still clears with it and it really holds its convoy back.
//
// Every board written clears by driving the convoys home one at a time (the
// promise the level data makes). New levels are marked "(generated)" in their
// comment; nest and lock them afterwards, in that order:
//
//   node tools/extend-levels.mjs [last]
//   node tools/nest-levels.mjs
//   node tools/lock-levels.mjs
//
// The picks are seeded by level number, so a level comes out the same each run.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(new URL('../data/level-data.js', import.meta.url));
const LAST = Number(process.argv[2]) || 1000;
const MARK = '(generated)';
const FREEZE_MARK = '(frozen)';
// Levels whose size and walls new boards are cut from.
const TEMPLATES = [41, 100];
// Seconds more on the clock for each freeze, as tools/freeze-levels.mjs.
const FREEZE_TIME = 6;
// Where the ramp starts: level 201 is the first ever added here.
const RAMP_FROM = 201;
const RAMP_TO = 1000;

const COLOURS = ['yellow', 'red', 'cyan', 'pink', 'blue', 'orange', 'green', 'lime', 'purple', 'white'];
const OBSTACLES = ['cone', 'planter', 'barrier', 'cargo_pallet', 'service_cabinet'];

// Per difficulty, each a [first, last] range ramped over the new levels:
// convoys, how many; fill, the share of the open floor convoys and garages
// take; holes, the share of the board cut out; obstacles, the most there can
// be as a share of the board; length, the shortest and longest a convoy is;
// steps, how long the search runs. The rest weigh the search as in
// tools/harden-levels.mjs (see score and looks); slack, where given, is how
// many rounds short of one convoy a round the board should clear in (as
// levels 51-200 do: a Normal board lets a few convoys go side by side), and
// the search aims for that rather than for the most rounds it can find.
const PLAN = {
    normal: {
        slack: [3, 1.5], convoys: [8, 10], fill: [0.62, 0.72], holes: [0.03, 0.07], obstacles: [0.08, 0.1], length: [2, 5],
        steps: [2500, 5000], drive: 1, start: 10, wait: 6, turn: 2, lane: 1, share: 4, stair: 45, bent: 30, crowd: 80, open: 30
    },
    hard: {
        slack: [1.5, 0.5], convoys: [9, 10], fill: [0.7, 0.8], holes: [0.06, 0.1], obstacles: [0.06, 0.08], length: [3, 6],
        steps: [12000, 20000], drive: 2, start: 20, wait: 18, turn: 5, lane: 2, share: 10, stair: 45, bent: 80, crowd: 80, open: 60
    },
    superHard: {
        convoys: [10, 10], fill: [0.8, 0.88], holes: [0.08, 0.13], obstacles: [0.02, 0.03], length: [4, 8],
        steps: [40000, 60000], drive: 3, start: 20, wait: 30, turn: 8, lane: 3, share: 14, stair: 45, bent: 120, crowd: 80, open: 80
    }
};
const BUILD_TRIES = 1000;
const BUILD_EASE = 100;

// Clocks. Normal levels give each convoy a steady NORMAL_EACH seconds, as
// levels 41-100 do; Hard and Super Hard are set from their boards as
// tools/harden-levels.mjs sets them.
const NORMAL_EACH = 13;
const DRAG_SPEED = 4.6;
const PULL_SPEED = 5.5;
const CLOCK_FIND = { hard: 1.5, superHard: 2.5 };
const CLOCK_TURN = 0.2;
const CLOCK_LEFT = 5;

const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const MIRRORS = ['', 'x', 'y', 'xy'];

const source = readFileSync(FILE, 'utf8');
const levels = (await import(FILE + '?' + Date.now())).default;
const FIRST = levels.length + 1;

if (FIRST > LAST) {
    console.log('There are ' + levels.length + ' levels already');
    process.exit(0);
}

// Each template's size and walls, smallest boards first.
const templates = [];

for (let n = TEMPLATES[0]; n <= TEMPLATES[1]; n++) {
    const data = levels[n - 1];

    MIRRORS.forEach((axis) => templates.push(mirror(data, axis)));
}

templates.sort((a, b) => a.columns * a.rows - b.columns * b.rows);

const blocks = [];

for (let level = FIRST; level <= LAST; level++) {
    const random = seeded(level * 7919 + 307);
    const t = Math.min(1, Math.max(0, (level - RAMP_FROM) / (RAMP_TO - RAMP_FROM)));
    const difficulty = level % 10 === 0 ? 'superHard' : level % 5 === 0 ? 'hard' : 'normal';
    let made = null;

    for (let attempt = 0; !made; attempt++) {
        if (attempt > 20) throw new Error('Level ' + level + ' could not be packed');

        made = pack(pickTemplate(t, random), PLAN[difficulty], t, random);
    }

    const data = made.data;
    const frozen = freezable(makeBoard(data)) ? freeze(data, level, t, random) : { freezes: 0, report: 'no freeze fits' };

    data.difficulty = difficulty;
    data.time = clockFor(makeBoard(data), made.result, difficulty) + FREEZE_TIME * frozen.freezes;

    blocks.push(write(data, level, [MARK, frozen.freezes ? FREEZE_MARK : ''].filter(Boolean).join(' ')));
    console.log('Level ' + level + ' (' + difficulty + ', ' + data.columns + 'x' + data.rows + '): ' + made.report +
        '; freezes: ' + frozen.report + '; time ' + data.time + 's');
}

const end = source.lastIndexOf(']');

writeFileSync(FILE, source.slice(0, end).replace(/,?\s*$/, '') + ',\n\n' + blocks.join(',\n\n') + '\n]\n');

// ---- making a level ------------------------------------------------------

// Smaller boards early on, the biggest ones only late.
function pickTemplate(t, random) {
    const from = Math.floor(t * 0.6 * templates.length);
    const to = Math.max(from + 1, Math.ceil((0.5 + t * 0.5) * templates.length));

    return templates[from + Math.floor(random() * (to - from))];
}

function mirror(data, axis) {
    const columns = data.columns;
    const rows = data.rows;
    const fx = axis.includes('x');
    const fy = axis.includes('y');
    const flip = (c) => [fx ? columns - 1 - c[0] : c[0], fy ? rows - 1 - c[1] : c[1]];

    return {
        columns: columns,
        rows: rows,
        walls: (data.walls || []).map((w) => Object.assign({}, w, { cells: w.cells.map(flip) }))
    };
}

// A packed board on the template, or null if its convoys couldn't be parked.
function pack(template, plan, t, random) {
    const lerp = (range) => range[0] + (range[1] - range[0]) * t;
    const columns = template.columns;
    const rows = template.rows;
    const walls = template.walls;
    const walled = new Set();

    walls.forEach((w) => w.cells.forEach((c) => walled.add(c[1] * columns + c[0])));

    const count = Math.min(COLOURS.length, Math.round(lerp(plan.convoys)));
    const keys = shuffle(COLOURS.slice(), random).slice(0, count);
    const holeCount = Math.round(lerp(plan.holes) * columns * rows);
    const maxObstacles = Math.round(lerp(plan.obstacles) * columns * rows);
    const steps = Math.round(lerp(plan.steps));
    const aim = plan.slack ? count - Math.round(lerp(plan.slack)) : 0;
    const off = (result) => aim ? result.rounds * 100 + Math.abs(result.rounds - aim) * 400 : 0;

    const levelOf = (st) => ({
        columns: columns,
        rows: rows,
        pattern: Array.from({ length: rows }, (_, row) =>
            Array.from({ length: columns }, (_, col) => st.holes.some((h) => h[0] === col && h[1] === row) ? 0 : 1)),
        obstacles: st.obstacles,
        walls: walls,
        convoys: st.convoys
    });

    const judge = (st) => {
        const level = levelOf(st);

        if (!placed(level)) return null;

        const board = makeBoard(level);
        const result = clears(board, true);

        return result.ok ? { result: result, score: score(result, plan) - off(result) - stairs(board, st.holes) * plan.stair + looks(board, plan) } : null;
    };

    let state = null;
    let now = null;

    for (let tries = 0; !now && tries < BUILD_TRIES; tries++) {
        state = build(keys, holeCount, lerp(plan.fill) - Math.floor(tries / BUILD_EASE) * 0.02, plan.length, walled, levelOf, random);
        now = state && judge(state);
    }

    if (!now) return null;

    let best = { state: state, judged: now };

    for (let step = 0; step < steps; step++) {
        const heat = 60 * (1 - step / steps) + 0.5;
        const next = {
            holes: state.holes.map((h) => h.slice()),
            obstacles: state.obstacles.map((o) => o.slice()),
            convoys: state.convoys.map((c) => Object.assign({}, c))
        };
        const roll = random();
        let ok;

        if (roll < 0.4) ok = moveConvoy(next, levelOf, Math.floor(random() * next.convoys.length), random);
        else if (roll < 0.7) ok = moveGarage(next, levelOf, Math.floor(random() * next.convoys.length), random);
        else if (roll < 0.85) ok = moveHole(next, levelOf, walled, random);
        else ok = toggleObstacle(next, levelOf, maxObstacles, random);

        if (!ok) continue;

        const judged = judge(next);

        if (!judged) continue;

        if (judged.score >= now.score || random() < Math.exp((judged.score - now.score) / heat)) {
            state = next;
            now = judged;

            if (now.score > best.judged.score) best = { state: state, judged: now };
        }
    }

    // Obstacles still short of the plan's share go where the board still
    // clears with them, so Normal boards keep their cones and planters.
    const want = Math.round(maxObstacles * 0.7);

    for (let tries = 0; best.state.obstacles.length < want && tries < 60; tries++) {
        const next = Object.assign({}, best.state, { obstacles: best.state.obstacles.slice() });

        if (!toggleObstacle(next, levelOf, maxObstacles, random) || next.obstacles.length <= best.state.obstacles.length) continue;

        const judged = judge(next);

        if (judged) best = { state: next, judged: judged };
    }

    const done = levelOf(best.state);
    const after = best.judged.result;
    const floor = columns * rows - best.state.holes.length - walled.size - best.state.obstacles.length;
    const taken = best.state.convoys.reduce((n, c) => n + c.cells.length + 1, 0);

    return {
        data: {
            rows: rows,
            columns: columns,
            pattern: done.pattern,
            obstacles: best.state.obstacles,
            walls: walls,
            convoys: best.state.convoys
        },
        result: after,
        report: count + ' convoys (' + best.state.convoys.map((c) => c.cells.length).join(',') + '), ' +
            Math.round(100 * taken / floor) + '% full, ' + best.state.holes.length + ' holes, ' +
            best.state.obstacles.length + ' obstacles; rounds ' + after.rounds + ', blocked at start ' +
            after.blockedAtStart + ', waiting ' + after.waiting
    };
}

function clockFor(board, result, difficulty) {
    if (!CLOCK_FIND[difficulty]) return Math.ceil(board.convoys.length * NORMAL_EACH / 5) * 5;

    const longest = Math.max(...board.convoys.map((c) => c.cells.length));
    const needed = board.convoys.length * CLOCK_FIND[difficulty] + result.distance / DRAG_SPEED +
        result.turns * CLOCK_TURN + longest / PULL_SPEED;

    return Math.ceil(needed) + CLOCK_LEFT;
}

// ---- freezing (as tools/freeze-levels.mjs) -------------------------------

// Two or three freezes, counting as high as 4 at first and 9 by the end.
function freeze(data, level, t, random) {
    const want = { count: random() < 0.5 ? 2 : 3, most: Math.round(4 + t * 5) };
    const board = makeBoard(data);
    const n = board.convoys.length;
    const freezes = new Array(n).fill(0);
    const done = [];

    for (let k = 0; k < want.count; k++) {
        const order = clearOrder(board, freezes);

        if (!order) break;

        const free = order.filter((i) => !freezes[i]);
        let placed = false;

        for (let p = 0; p < free.length && !placed; p++) {
            const index = free[p];
            const at = order.indexOf(index);
            const least = at + 1;
            const most = Math.min(n - 1, Math.max(want.most, least));
            const tries = [];

            for (let v = most; v >= least; v--) tries.push(v);

            if (tries.length > 2 && random() < 0.4) tries.push(tries.shift());

            for (let v = 0; v < tries.length; v++) {
                freezes[index] = tries[v];

                if (clearOrder(board, freezes)) {
                    placed = true;
                    done.push(index);
                    break;
                }

                freezes[index] = 0;
            }
        }

        if (!placed) break;
    }

    if (!clearOrder(board, freezes)) throw new Error('Level ' + level + ' does not clear');

    data.convoys.forEach((c, i) => {
        if (freezes[i]) c.frozen = freezes[i];
    });

    return {
        freezes: done.length,
        report: done.length ? done.map((i) => data.convoys[i].key + ' ' + freezes[i]).join(', ') : 'none fits'
    };
}

function freezable(board) {
    const order = clearOrder(board, []);

    if (!order) return false;

    const freezes = new Array(board.convoys.length).fill(0);

    for (let at = 0; at < order.length; at++) {
        for (let v = at + 1; v < order.length; v++) {
            freezes[order[at]] = v;

            if (clearOrder(board, freezes)) return true;
        }

        freezes[order[at]] = 0;
    }

    return false;
}

// Drives convoys home one at a time, any with a clear road whose freeze has
// counted down, until none is left (the order they went) or none can go.
function clearOrder(board, freezes) {
    const owner = board.owner.slice();
    const garage = board.garage.slice();
    const left = board.convoys.map((c, i) => i);
    const order = [];

    while (left.length) {
        let going = -1;

        for (let i = 0; i < left.length && going === -1; i++) {
            const index = left[i];
            const convoy = board.convoys[index];

            if ((freezes[index] || 0) > order.length) continue;

            const ends = [convoy.cells[0], convoy.cells[convoy.cells.length - 1]];

            if (ends.some((e) => roadHome(board, owner, garage, index, e, convoy.exit) !== -1)) going = index;
        }

        if (going === -1) return null;

        const convoy = board.convoys[going];

        convoy.cells.forEach((c) => owner[c[1] * board.columns + c[0]] = -1);
        garage[convoy.exit[1] * board.columns + convoy.exit[0]] = -1;
        left.splice(left.indexOf(going), 1);
        order.push(going);
    }

    return order;
}

// ---- packing (as tools/harden-levels.mjs) --------------------------------

// Convoys parked in the reverse of the order they can go: one parked later
// goes earlier, so it can't shut the road of one parked before it, and it is
// parked across those roads so they have to wait on it.
function build(keys, holeCount, fill, lengths, walled, levelOf, random) {
    const st = { holes: [], obstacles: [], convoys: [] };
    let level = levelOf(st);
    const { columns, rows } = level;

    for (let n = 0, guard = 0; n < holeCount && guard < holeCount * 50; guard++) {
        const col = Math.floor(random() * columns);
        const row = Math.floor(random() * rows);

        if (level.pattern[row][col] !== 1 || walled.has(row * columns + col)) continue;
        if (!staysWhole(level, level.pattern, col, row)) continue;

        st.holes.push([col, row]);
        level = levelOf(st);
        n++;
    }

    const open = columns * rows - st.holes.length - walled.size;
    const each = open * fill / keys.length - 1;
    const roads = new Set();

    for (let i = 0; i < keys.length; i++) {
        const length = Math.min(lengths[1], Math.max(lengths[0], Math.round(each + (random() - 0.5) * 2.4)));
        let parked = false;

        for (let t = 0; !parked && t < 200; t++) {
            const board = makeBoard(levelOf(st));
            const body = walk(board, length, roads, random);

            if (!body) continue;

            const home = farGarage(board, body, random);

            if (!home) continue;

            st.convoys.push({ key: keys[i], exit: home.exit, facing: 90, cells: body });
            home.road.forEach((k) => roads.add(k));
            parked = true;
        }

        if (!parked) return null;
    }

    return st;
}

function walk(board, length, roads, random) {
    const free = freeCells(board).map((c) => c[1] * board.columns + c[0]);
    const onRoads = free.filter((k) => roads.has(k));
    const pool = onRoads.length && random() < 0.75 ? onRoads : free;

    if (!pool.length) return null;

    const first = pool[Math.floor(random() * pool.length)];
    const cells = [[first % board.columns, Math.floor(first / board.columns)]];
    const used = new Set([first]);

    while (cells.length < length) {
        const [col, row] = cells[cells.length - 1];
        const steps = [];
        let total = 0;

        for (let d = 0; d < 4; d++) {
            const c = col + SIDES[d][0];
            const r = row + SIDES[d][1];
            const k = r * board.columns + c;

            if (!onBoard(board, c, r) || used.has(k) || board.blocked[k] || board.owner[k] !== -1 || board.garage[k] !== -1) continue;

            const weight = roads.has(k) ? 3 : 1;

            steps.push([d, k, weight]);
            total += weight;
        }

        if (!steps.length) return null;

        let pick = random() * total;
        let step = steps[0];

        for (let s = 0; s < steps.length; s++) {
            pick -= steps[s][2];

            if (pick <= 0) {
                step = steps[s];
                break;
            }
        }

        used.add(step[1]);
        cells.push([step[1] % board.columns, Math.floor(step[1] / board.columns)]);
    }

    return cells;
}

function farGarage(board, body, random) {
    const columns = board.columns;
    const mine = new Set(body.map((c) => c[1] * columns + c[0]));
    const from = new Map();
    const steps = new Map();
    const queue = [];

    [body[0], body[body.length - 1]].forEach((c) => {
        const k = c[1] * columns + c[0];

        if (steps.has(k)) return;

        steps.set(k, 0);
        from.set(k, -1);
        queue.push(k);
    });

    for (let q = 0; q < queue.length; q++) {
        const k = queue[q];
        const col = k % columns;
        const row = Math.floor(k / columns);

        for (let d = 0; d < 4; d++) {
            const c = col + SIDES[d][0];
            const r = row + SIDES[d][1];
            const n = r * columns + c;

            if (!onBoard(board, c, r) || steps.has(n) || mine.has(n)) continue;
            if (board.blocked[n] || board.owner[n] !== -1 || board.garage[n] !== -1) continue;

            steps.set(n, steps.get(k) + 1);
            from.set(n, k);
            queue.push(n);
        }
    }

    const far = [...steps.keys()].filter((k) => steps.get(k) >= 2);

    if (!far.length) return null;

    let total = 0;

    far.forEach((k) => total += steps.get(k) * steps.get(k));

    let pick = random() * total;
    let exit = far[0];

    for (let i = 0; i < far.length; i++) {
        pick -= steps.get(far[i]) * steps.get(far[i]);

        if (pick <= 0) {
            exit = far[i];
            break;
        }
    }

    const road = [];

    for (let k = exit; k !== -1 && !mine.has(k); k = from.get(k)) road.push(k);

    return { exit: [exit % columns, Math.floor(exit / columns)], road: road };
}

function moveHole(st, levelOf, walled, random) {
    if (!st.holes.length) return false;

    st.holes.splice(Math.floor(random() * st.holes.length), 1);

    const level = levelOf(st);
    const board = makeBoard(level);
    const cells = freeCells(board).filter((c) => !walled.has(c[1] * board.columns + c[0]) &&
        staysWhole(board, level.pattern, c[0], c[1]));

    if (!cells.length) return false;

    st.holes.push(cells[Math.floor(random() * cells.length)]);

    return true;
}

function moveConvoy(st, levelOf, i, random) {
    const level = levelOf(st);
    const columns = level.columns;
    const open = openCells(level, i);
    const own = st.convoys[i];

    open.delete(own.exit[1] * columns + own.exit[0]);

    const spots = [...open];

    for (let t = 0; t < 30; t++) {
        const k = spots[Math.floor(random() * spots.length)];
        const cells = [[k % columns, Math.floor(k / columns)]];
        const used = new Set([k]);
        let dir = Math.floor(random() * 4);

        while (cells.length < own.cells.length) {
            if (random() < 0.35) dir = Math.floor(random() * 4);

            const last = cells[cells.length - 1];
            const col = last[0] + SIDES[dir][0];
            const row = last[1] + SIDES[dir][1];
            const n = row * columns + col;

            if (col < 0 || row < 0 || col >= columns || row >= level.rows || !open.has(n) || used.has(n)) break;

            used.add(n);
            cells.push([col, row]);
        }

        if (cells.length < own.cells.length) continue;

        st.convoys[i] = Object.assign({}, own, { cells: cells });

        return true;
    }

    return false;
}

function moveGarage(st, levelOf, i, random) {
    const level = levelOf(st);
    const columns = level.columns;
    const own = st.convoys[i];
    const open = openCells(level, i);

    own.cells.forEach((c) => open.delete(c[1] * columns + c[0]));

    const spots = [...open];

    if (!spots.length) return false;

    const k = spots[Math.floor(random() * spots.length)];

    st.convoys[i] = Object.assign({}, own, { exit: [k % columns, Math.floor(k / columns)] });

    return true;
}

function toggleObstacle(st, levelOf, max, random) {
    if (st.obstacles.length && (st.obstacles.length >= max || random() < 0.3)) {
        st.obstacles.splice(Math.floor(random() * st.obstacles.length), 1);

        return true;
    }

    const cells = freeCells(makeBoard(levelOf(st)));

    if (!cells.length) return false;

    const [col, row] = cells[Math.floor(random() * cells.length)];

    st.obstacles.push([col, row, OBSTACLES[Math.floor(random() * OBSTACLES.length)]]);

    return true;
}

function score(result, plan) {
    return result.rounds * 100 + result.blockedAtStart * plan.start + result.waiting * plan.wait +
        result.distance * plan.drive + result.turns * plan.turn + result.lanes * plan.lane + result.shared * plan.share;
}

function looks(board, plan) {
    const { columns, rows } = board;
    const open = (c, r) => !board.blocked[r * columns + c] && board.owner[r * columns + c] === -1 &&
        board.garage[r * columns + c] === -1;
    let bent = 0;
    let crowd = 0;
    let wide = 0;

    board.convoys.forEach((c) => {
        if (new Set(c.cells.map((p) => p[0])).size > 1 && new Set(c.cells.map((p) => p[1])).size > 1) bent++;
    });

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const k = row * columns + col;

            if (board.garage[k] !== -1) {
                if (col + 1 < columns && board.garage[k + 1] !== -1) crowd++;
                if (row + 1 < rows && board.garage[k + columns] !== -1) crowd++;
            }

            if (col + 1 < columns && row + 1 < rows && open(col, row) && open(col + 1, row) &&
                open(col, row + 1) && open(col + 1, row + 1)) wide++;
        }
    }

    return bent * plan.bent - crowd * plan.crowd - wide * plan.open;
}

function stairs(board, holes) {
    const blocked = (col, row) => !onBoard(board, col, row) || board.blocked[row * board.columns + col];
    let count = 0;

    for (let i = 0; i < holes.length; i++) {
        const [col, row] = holes[i];

        for (const [dc, dr] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            if (!onBoard(board, col + dc, row + dr) || !blocked(col + dc, row + dr)) continue;
            if (!blocked(col + dc, row) && !blocked(col, row + dr)) count++;
        }
    }

    return count;
}

function placed(level) {
    const board = makeBoard(Object.assign({}, level, { convoys: [] }));
    const taken = new Set();

    for (let i = 0; i < level.convoys.length; i++) {
        const convoy = level.convoys[i];
        const cells = convoy.cells.concat([convoy.exit]);

        for (let j = 0; j < cells.length; j++) {
            const [col, row] = cells[j];
            const k = row * board.columns + col;

            if (!onBoard(board, col, row) || board.blocked[k] || taken.has(k)) return false;

            taken.add(k);
        }
    }

    return true;
}

function openCells(level, skip) {
    const board = makeBoard(Object.assign({}, level, { convoys: level.convoys.filter((c, i) => i !== skip) }));
    const open = new Set();

    for (let k = 0; k < board.blocked.length; k++) {
        if (!board.blocked[k] && board.owner[k] === -1 && board.garage[k] === -1) open.add(k);
    }

    if (skip >= 0) {
        const own = level.convoys[skip];

        own.cells.forEach((c) => open.add(c[1] * level.columns + c[0]));
        open.add(own.exit[1] * level.columns + own.exit[0]);
    }

    return open;
}

function staysWhole(board, pattern, col, row) {
    const floor = [];

    for (let r = 0; r < board.rows; r++) {
        for (let c = 0; c < board.columns; c++) {
            if (pattern[r][c] === 1 && !(c === col && r === row)) floor.push(r * board.columns + c);
        }
    }

    if (!floor.length) return false;

    const seen = new Set([floor[0]]);
    const queue = [floor[0]];
    const isFloor = (c, r) => onBoard(board, c, r) && pattern[r][c] === 1 && !(c === col && r === row);

    for (let q = 0; q < queue.length; q++) {
        const c0 = queue[q] % board.columns;
        const r0 = Math.floor(queue[q] / board.columns);

        for (let i = 0; i < SIDES.length; i++) {
            const c = c0 + SIDES[i][0];
            const r = r0 + SIDES[i][1];
            const k = r * board.columns + c;

            if (!isFloor(c, r) || seen.has(k)) continue;

            seen.add(k);
            queue.push(k);
        }
    }

    return seen.size === floor.length;
}

// ---- clearing a board ----------------------------------------------------

function makeBoard(data) {
    const columns = data.columns;
    const rows = data.rows;
    const size = columns * rows;
    const board = {
        columns: columns,
        rows: rows,
        blocked: new Array(size).fill(false),
        owner: new Array(size).fill(-1),
        garage: new Array(size).fill(-1),
        convoys: data.convoys
    };

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            if (data.pattern[row][col] !== 1) board.blocked[row * columns + col] = true;
        }
    }

    (data.obstacles || []).forEach((o) => board.blocked[o[1] * columns + o[0]] = true);
    (data.walls || []).forEach((w) => w.cells.forEach((c) => board.blocked[c[1] * columns + c[0]] = true));

    board.convoys.forEach((convoy, i) => {
        convoy.cells.forEach((c) => board.owner[c[1] * columns + c[0]] = i);
        board.garage[convoy.exit[1] * columns + convoy.exit[0]] = i;
    });

    return board;
}

function onBoard(board, col, row) {
    return col >= 0 && row >= 0 && col < board.columns && row < board.rows;
}

function freeCells(board) {
    const cells = [];

    for (let row = 0; row < board.rows; row++) {
        for (let col = 0; col < board.columns; col++) {
            const k = row * board.columns + col;

            if (!board.blocked[k] && board.owner[k] === -1 && board.garage[k] === -1) cells.push([col, row]);
        }
    }

    return cells;
}

// Drives home, round after round, every convoy with a clear road from either
// end, until none is left or none can go; with deep, also sizes up each road
// home (fewest turns, one-lane cells, lanes shared between roads).
function clears(board, deep = false) {
    const owner = board.owner.slice();
    const garage = board.garage.slice();
    const left = board.convoys.map((c, i) => i);
    let rounds = 0;
    let distance = 0;
    let blockedAtStart = 0;
    let waiting = 0;
    let turns = 0;
    let lanes = 0;
    const laneUse = new Map();

    while (left.length) {
        const going = [];

        for (let i = 0; i < left.length; i++) {
            const index = left[i];
            const convoy = board.convoys[index];
            const ends = [convoy.cells[0], convoy.cells[convoy.cells.length - 1]];
            let best = -1;

            for (let e = 0; e < ends.length; e++) {
                const d = roadHome(board, owner, garage, index, ends[e], convoy.exit);

                if (d !== -1 && (best === -1 || d < best)) best = d;
            }

            if (best === -1) continue;

            going.push([index, best]);

            if (!deep) continue;

            let road = null;

            for (let e = 0; e < ends.length; e++) {
                const r = fewestTurns(board, owner, garage, index, ends[e], convoy.exit);

                if (r && (!road || r.turns < road.turns || (r.turns === road.turns && r.lanes < road.lanes))) road = r;
            }

            turns += road.turns;
            lanes += road.lanes;
            road.laneCells.forEach((k) => laneUse.set(k, (laneUse.get(k) || 0) + 1));
        }

        if (!going.length) return { ok: false };
        if (rounds === 0) blockedAtStart = left.length - going.length;

        waiting += left.length - going.length;
        rounds++;

        for (let i = 0; i < going.length; i++) {
            const index = going[i][0];
            const convoy = board.convoys[index];

            distance += going[i][1];
            convoy.cells.forEach((c) => owner[c[1] * board.columns + c[0]] = -1);
            garage[convoy.exit[1] * board.columns + convoy.exit[0]] = -1;
            left.splice(left.indexOf(index), 1);
        }
    }

    let shared = 0;

    laneUse.forEach((n) => shared += n - 1);

    return {
        ok: true, rounds: rounds, distance: distance, blockedAtStart: blockedAtStart, waiting: waiting,
        turns: turns, lanes: lanes, shared: shared
    };
}

function fewestTurns(board, owner, garage, index, from, goal) {
    const columns = board.columns;
    const target = goal[1] * columns + goal[0];
    const size = board.blocked.length * 4;
    const cost = new Int32Array(size).fill(-1);
    const back = new Int32Array(size).fill(-1);
    const deque = [];
    let head = 0;

    const passable = (col, row, k) => onBoard(board, col, row) && !board.blocked[k] && owner[k] === -1 &&
        (garage[k] === -1 || garage[k] === index);

    for (let dir = 0; dir < 4; dir++) {
        const col = from[0] + SIDES[dir][0];
        const row = from[1] + SIDES[dir][1];
        const k = row * columns + col;

        if (!passable(col, row, k)) continue;

        cost[k * 4 + dir] = 0;
        deque.push(k * 4 + dir);
    }

    let found = -1;
    const front = [];

    while (head < deque.length || front.length) {
        const state = front.length ? front.pop() : deque[head++];
        const k = state >> 2;
        const dir = state & 3;

        if (k === target) {
            found = state;
            break;
        }

        const col = k % columns;
        const row = Math.floor(k / columns);

        for (let d = 0; d < 4; d++) {
            const c = col + SIDES[d][0];
            const r = row + SIDES[d][1];
            const n = r * columns + c;

            if (!passable(c, r, n)) continue;

            const next = n * 4 + d;
            const add = d === dir ? 0 : 1;
            const total = cost[state] + add;

            if (cost[next] !== -1 && cost[next] <= total) continue;

            cost[next] = total;
            back[next] = state;

            if (add) deque.push(next);
            else front.push(next);
        }
    }

    if (found === -1) return null;

    const laneCells = [];

    for (let state = found; state !== -1; state = back[state]) {
        const k = state >> 2;
        const col = k % columns;
        const row = Math.floor(k / columns);
        let walled = 0;

        for (let d = 0; d < 4; d++) {
            const c = col + SIDES[d][0];
            const r = row + SIDES[d][1];

            if (!onBoard(board, c, r) || board.blocked[r * columns + c]) walled++;
        }

        if (walled >= 2) laneCells.push(k);
    }

    return { turns: cost[found], lanes: laneCells.length, laneCells: laneCells };
}

// The length of the shortest clear road from a convoy's end to its garage,
// or -1 if there is none.
function roadHome(board, owner, garage, index, from, goal) {
    const columns = board.columns;
    const target = goal[1] * columns + goal[0];
    const steps = new Map([[from[1] * columns + from[0], 0]]);
    const queue = [from];

    for (let q = 0; q < queue.length; q++) {
        const cell = queue[q];
        const d = steps.get(cell[1] * columns + cell[0]);

        for (let i = 0; i < SIDES.length; i++) {
            const col = cell[0] + SIDES[i][0];
            const row = cell[1] + SIDES[i][1];
            const k = row * columns + col;

            if (!onBoard(board, col, row) || steps.has(k) || board.blocked[k]) continue;
            if (owner[k] !== -1) continue;
            if (garage[k] !== -1 && garage[k] !== index) continue;

            if (k === target) return d + 1;

            steps.set(k, d + 1);
            queue.push([col, row]);
        }
    }

    return -1;
}

// ---- writing it out ------------------------------------------------------

function write(data, level, marks) {
    const i1 = '    ';
    const i2 = '        ';
    const lines = [
        i1 + '// Level ' + level + (marks ? ' ' + marks : ''),
        i1 + '{',
        i2 + 'difficulty: "' + data.difficulty + '",',
        i2 + 'rows: ' + data.rows + ',',
        i2 + 'columns: ' + data.columns + ',',
        i2 + 'time: ' + data.time + ',',
        i2 + 'pattern: ' + formatRows(data.pattern, i2) + ',',
        i2 + 'obstacles: ' + formatRows(data.obstacles, i2) + ',',
        i2 + 'walls: ' + formatWalls(data.walls, i2) + ',',
        i2 + 'convoys: ' + formatConvoys(data.convoys, i2),
        i1 + '}'
    ];

    return lines.join('\n');
}

function formatRows(rows, indent) {
    if (!rows.length) return '[]';

    const item = (v) => typeof v === 'string' ? '"' + v + '"' : String(v);
    const lines = rows.map((r) => indent + '    [' + r.map(item).join(', ') + ']');

    return '[\n' + lines.join(',\n') + '\n' + indent + ']';
}

function formatWalls(walls, indent) {
    if (!walls.length) return '[]';

    const inner = indent + '    ';
    const items = walls.map((w) => {
        const fields = Object.keys(w).filter((k) => k !== 'cells')
            .map((k) => inner + k + ': ' + JSON.stringify(w[k]) + ',');

        return fields.concat([inner + 'cells: ' + formatRows(w.cells, inner)]).join('\n');
    });

    return '[{\n' + items.join('\n' + indent + '}, {\n') + '\n' + indent + '}]';
}

function formatConvoys(convoys, indent) {
    const inner = indent + '        ';
    const items = convoys.map((c) => [
        inner + 'key: "' + c.key + '",',
        inner + 'exit: [' + c.exit.join(', ') + '],',
        inner + 'facing: ' + c.facing + ','
    ].concat(c.frozen ? [inner + 'frozen: ' + c.frozen + ','] : [], [
        inner + 'cells: ' + formatRows(c.cells, inner)
    ]).join('\n'));

    return '[{\n' + items.join('\n' + indent + '    },\n' + indent + '    {\n') + '\n' + indent + '    }\n' + indent + ']';
}

function shuffle(list, random) {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const t = list[i];

        list[i] = list[j];
        list[j] = t;
    }

    return list;
}

// mulberry32
function seeded(seed) {
    let a = seed >>> 0;

    return () => {
        a = (a + 0x6d2b79f5) >>> 0;

        let t = a;

        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
