// Reworks the levels data/level-data.js marks difficulty "hard" and
// "superHard", in place.
//
// Hard levels keep their convoys and garages:
//
//   - the pattern gets holes cut along its edges and up against its walls, so
//     the board's outline and walls grow into a tighter, more crooked shape
//     (the game turns pattern holes into walls and pieces, see fillHoles);
//   - extra obstacles go where they make the puzzle longest: routes home bend
//     round them and convoys wait on more others before they can go.
//
// Super Hard levels are designed over: the same board size, walls, convoy
// colours and lengths, but where the convoys park, where their garages stand
// and where the holes and extra obstacles go is searched for (simulated
// annealing) to make the board as hard as it gets: ideally only one convoy
// can go at a time, each freeing the next, down long, crooked roads.
//
// Every board written still clears by driving the convoys home one at a time
// (the promise the level data makes). A Hard level whose own board can't be
// shown to clear that way is left as it is.
//
// Reworked levels are marked "(hardened)" in their comment and skipped on a
// second run. The picks are seeded by level number.
//
//   node tools/harden-levels.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HARD, SUPER_HARD } from '../objects/levelDifficulty.js';

const FILE = fileURLToPath(new URL('../data/level-data.js', import.meta.url));
const MARK = '(hardened)';

// holes and obstacles: how many, or under 1 a share of the board's cells.
// drive, start, wait: how much a longer road home, a convoy blocked at the
// start and a convoy kept waiting each round count (see score). turn, lane:
// how much each turn a road home can't be driven without, and each one-lane
// cell on it, count. share: each one-lane cell more than one convoy's road
// runs through - the game routes a dragged convoy itself, so the bends alone
// don't make a road hard; a convoy driven into a shared lane too early,
// though, blocks the others there and has to be backed out. stair: the
// penalty for a hole touching another only corner to corner, which reads as
// scattered blocks rather than a wall and only makes roads zig-zag.
// tries: cells tried for each piece placed. pairs: when no one cell makes
// the board harder, look for two that do together (one shuts a road, the
// other the road round it).
// Super Hard levels ramp up: the first gets RAMP_FIRST of the plan's holes,
// obstacles and weights, level 100 all of them, so the early ones stay
// winnable in a few tries.
const RAMP_FIRST = 0.35;

// The clock a designed level's data asks for covers driving every road home
// TIME_DRIVE times over at the game's drag speed (cells a second), plus
// TIME_CONVOY seconds a convoy to find it and TIME_SPARE to spare, and never
// less than the level had. The data's time is the clock the game runs.
const DRAG_SPEED = 4.6;
const TIME_DRIVE = 2;
const TIME_CONVOY = 8;
const TIME_SPARE = 10;

const PLAN = {
    [HARD]: { holes: 3, squeeze: 0, obstacles: 2, drive: 1, start: 20, wait: 0, tries: 40, pairs: false },
    [SUPER_HARD]: { design: true, holes: 0.24, obstacles: 0.07, drive: 3, start: 20, wait: 30, turn: 8, lane: 3, share: 14, stair: 45, steps: 60000 }
};

// Cells looked at in pairs, best singles first.
const PAIR_POOL = 45;

const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const source = readFileSync(FILE, 'utf8');
const levels = (await import(FILE + '?' + Date.now())).default;
const heads = [...source.matchAll(/^ *\/\/ Level (\d+)[^\n]*$/gm)];
let out = '';
let at = 0;

for (let h = 0; h < heads.length; h++) {
    const level = Number(heads[h][1]);
    const start = heads[h].index;
    const end = h + 1 < heads.length ? heads[h + 1].index : source.length;
    const kind = levels[level - 1].difficulty;

    out += source.slice(at, start);
    at = end;

    let block = source.slice(start, end);

    if (PLAN[kind] && !heads[h][0].includes(MARK)) {
        const data = levels[level - 1];
        const plan = PLAN[kind];
        const change = plan.design ?
            design(data, ramped(plan, level), seeded(level * 7919 + 17)) :
            harden(data, plan, seeded(level * 7919 + 17));

        if (change) {
            block = block.replace(heads[h][0], heads[h][0] + ' ' + MARK);
            block = replaceField(block, 'pattern', (indent) => formatRows(change.pattern, indent));
            block = replaceField(block, 'obstacles', (indent) => formatRows(change.obstacles, indent));

            if (change.convoys) block = replaceField(block, 'convoys', (indent) => formatConvoys(change.convoys, indent));
            if (change.time) block = block.replace(/^( *)time: \d+,/m, '$1time: ' + change.time + ',');

            console.log('Level ' + level + ' (' + kind + '): ' + change.report);
        } else {
            console.log('Level ' + level + ' (' + kind + '): left as it is, its board does not clear one by one');
        }
    }

    out += block;
}

out += source.slice(at);
writeFileSync(FILE, out);

// Super Hard: searches convoy spots, garage spots, holes and extra obstacles
// together for the hardest board that still clears. Starts from the level's
// own layout (or a random one, if that doesn't clear one by one) and keeps
// nudging one piece at a time, taking every change that makes the board
// harder and, early on, some that don't, so it can climb out of dead ends.
function ramped(plan, level) {
    const r = RAMP_FIRST + (1 - RAMP_FIRST) * Math.min(1, level / 100);
    const out = Object.assign({}, plan);

    ['holes', 'obstacles', 'wait', 'turn', 'lane', 'share'].forEach((k) => out[k] = plan[k] * r);

    return out;
}

function design(data, plan, random) {
    const area = data.columns * data.rows;
    const maxHoles = Math.round(plan.holes * area);
    const maxObstacles = Math.round(plan.obstacles * area);
    const bent = data.convoys.some((c) => new Set(c.cells.map((p) => p[0])).size > 1 &&
        new Set(c.cells.map((p) => p[1])).size > 1);
    const types = [...new Set((data.obstacles || []).map((o) => o[2]).concat(['cone', 'planter', 'barrier']))];
    const original = makeBoard(data);
    const before = clears(original, true);

    let state = {
        holes: [],
        obstacles: [],
        convoys: data.convoys.map((c) => ({ key: c.key, exit: c.exit.slice(), facing: c.facing, cells: c.cells.map((p) => p.slice()) }))
    };

    const levelOf = (st) => ({
        columns: data.columns,
        rows: data.rows,
        pattern: data.pattern.map((r, row) => r.map((v, col) => st.holes.some((h) => h[0] === col && h[1] === row) ? 0 : v)),
        obstacles: (data.obstacles || []).concat(st.obstacles),
        walls: data.walls || [],
        convoys: st.convoys
    });

    const judge = (st) => {
        const level = levelOf(st);

        if (!placed(level)) return null;

        const board = makeBoard(level);
        const result = clears(board, true);

        return result.ok ? { result: result, score: score(result, plan) - stairs(board, st.holes) * plan.stair } : null;
    };

    let now = judge(state);

    // The level's own layout doesn't clear one by one: start from a random
    // one that does.
    for (let t = 0; !now && t < 20000; t++) {
        const st = { holes: [], obstacles: [], convoys: state.convoys.map((c) => Object.assign({}, c)) };
        let ok = true;

        for (let i = 0; i < st.convoys.length && ok; i++) ok = moveConvoy(st, levelOf, i, bent, random);
        for (let i = 0; i < st.convoys.length && ok; i++) ok = moveGarage(st, levelOf, i, random);

        if (!ok) continue;

        now = judge(st);

        if (now) state = st;
    }

    if (!now) return null;

    let best = { state: state, judged: now };

    for (let step = 0; step < plan.steps; step++) {
        const heat = 60 * (1 - step / plan.steps) + 0.5;
        const next = {
            holes: state.holes.map((h) => h.slice()),
            obstacles: state.obstacles.map((o) => o.slice()),
            convoys: state.convoys.map((c) => Object.assign({}, c))
        };
        const roll = random();
        let ok;

        if (roll < 0.35) ok = moveConvoy(next, levelOf, Math.floor(random() * next.convoys.length), bent, random);
        else if (roll < 0.6) ok = moveGarage(next, levelOf, Math.floor(random() * next.convoys.length), random);
        else if (roll < 0.85) ok = toggleHole(next, levelOf, maxHoles, random);
        else ok = toggleObstacle(next, levelOf, maxObstacles, types, random);

        if (!ok) continue;

        const judged = judge(next);

        if (!judged) continue;

        if (judged.score >= now.score || random() < Math.exp((judged.score - now.score) / heat)) {
            state = next;
            now = judged;

            if (now.score > best.judged.score) best = { state: state, judged: now };
        }
    }

    const level = levelOf(best.state);
    const after = best.judged.result;
    const needed = after.distance / DRAG_SPEED * TIME_DRIVE + data.convoys.length * TIME_CONVOY + TIME_SPARE;
    const time = Math.max(data.time, Math.ceil(needed / 5) * 5);

    return {
        time: time,
        pattern: level.pattern,
        obstacles: (data.obstacles || []).map((o) => o.slice()).concat(best.state.obstacles),
        convoys: best.state.convoys,
        report: 'designed: time ' + data.time + ' -> ' + time + 's, ' + best.state.holes.length + ' holes, +' + best.state.obstacles.length + ' obstacles; rounds ' +
            (before.ok ? before.rounds : '-') + ' -> ' + after.rounds + ' of ' + data.convoys.length +
            ', waiting ' + (before.ok ? before.waiting : '-') + ' -> ' + after.waiting +
            ', drive ' + (before.ok ? before.distance : '-') + ' -> ' + after.distance +
            ', turns ' + (before.ok ? before.turns : '-') + ' -> ' + after.turns +
            ', one-lane ' + (before.ok ? before.lanes : '-') + ' -> ' + after.lanes +
            ', shared lanes ' + (before.ok ? before.shared : '-') + ' -> ' + after.shared +
            ', corner-only holes ' + stairs(makeBoard(level), best.state.holes)
    };
}

// Holes that meet another blocked cell only corner to corner, with both cells
// between them open.
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

// Whether every convoy and garage stands on its own open floor cell.
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

// Free cells of the level as it stands, convoy i's own left out.
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

// Parks convoy i somewhere else: a straight run, or (on levels that have
// them) a bent one, of the same length.
function moveConvoy(st, levelOf, i, bent, random) {
    const level = levelOf(st);
    const columns = level.columns;
    const open = openCells(level, i);
    const own = st.convoys[i];
    const exitKey = own.exit[1] * columns + own.exit[0];

    open.delete(exitKey);

    const spots = [...open];

    for (let t = 0; t < 30; t++) {
        const k = spots[Math.floor(random() * spots.length)];
        const cells = [[k % columns, Math.floor(k / columns)]];
        const used = new Set([k]);
        let dir = Math.floor(random() * 4);

        while (cells.length < own.cells.length) {
            if (bent && random() < 0.35) dir = Math.floor(random() * 4);

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

// Cuts a hole at the edge of the floor or against something solid, or fills
// one back in.
function toggleHole(st, levelOf, max, random) {
    if (st.holes.length && (st.holes.length >= max || random() < 0.3)) {
        st.holes.splice(Math.floor(random() * st.holes.length), 1);

        return true;
    }

    const level = levelOf(st);
    const board = makeBoard(level);
    const cells = freeCells(board).filter((c) => edgy(board, c[0], c[1]) && staysWhole(board, level.pattern, c[0], c[1]));

    if (!cells.length) return false;

    st.holes.push(cells[Math.floor(random() * cells.length)]);

    return true;
}

function toggleObstacle(st, levelOf, max, types, random) {
    if (st.obstacles.length && (st.obstacles.length >= max || random() < 0.3)) {
        st.obstacles.splice(Math.floor(random() * st.obstacles.length), 1);

        return true;
    }

    const cells = freeCells(makeBoard(levelOf(st)));

    if (!cells.length) return false;

    const [col, row] = cells[Math.floor(random() * cells.length)];

    st.obstacles.push([col, row, types[Math.floor(random() * types.length)]]);

    return true;
}

function harden(data, plan, random) {
    const board = makeBoard(data);
    const before = clears(board);

    if (!before.ok) return null;

    const pattern = data.pattern.map((r) => r.slice());
    const obstacles = (data.obstacles || []).map((o) => o.slice());
    const area = data.columns * data.rows;
    const count = (n) => n < 1 ? Math.round(n * area) : n;
    const holeCount = count(plan.holes);
    const obstacleCount = count(plan.obstacles);
    const types = [...new Set(obstacles.map((o) => o[2]).concat(['cone', 'planter', 'barrier']))];
    let holes = 0;

    // Holes first: cut from the edge or next to something already solid, so
    // they read as the outline or a wall growing, never a stray pit. The
    // floor must stay in one piece.
    const cut = (col, row, on) => {
        board.blocked[row * board.columns + col] = on;
        pattern[row][col] = on ? 0 : 1;
    };

    while (holes < holeCount) {
        const best = bestCells(board, random, plan, holeCount - holes,
            (col, row) => edgy(board, col, row) && staysWhole(board, pattern, col, row), cut, 3);

        if (!best) break;

        best.forEach((c) => cut(c[0], c[1], true));
        holes += best.length;
    }

    const place = (col, row) => {
        board.blocked[row * board.columns + col] = true;
        obstacles.push([col, row, types[Math.floor(random() * types.length)]]);
    };

    // Crowd garages down to one doorstep.
    const garages = shuffle(board.convoys.map((c) => c.exit), random);
    let squeezed = 0;

    for (let i = 0; i < garages.length && squeezed < plan.squeeze; i++) {
        const doorsteps = shuffle(openAround(board, garages[i]), random);
        const count = obstacles.length;

        if (doorsteps.length < 2) continue;

        for (let j = 1; j < doorsteps.length; j++) {
            const [col, row] = doorsteps[j];

            if (tryBlock(board, col, row)) place(col, row);
        }

        if (obstacles.length > count) squeezed++;
    }

    const block = (col, row, on) => board.blocked[row * board.columns + col] = on;

    for (let n = 0; n < obstacleCount;) {
        const best = bestCells(board, random, plan, obstacleCount - n, () => true, block, 1);

        if (!best) break;

        best.forEach((c) => place(c[0], c[1]));
        n += best.length;
    }

    const after = clears(board);
    const added = obstacles.length - (data.obstacles || []).length;

    return {
        pattern: pattern,
        obstacles: obstacles,
        report: '+' + holes + ' holes, +' + added + ' obstacles; rounds ' + before.rounds + ' -> ' + after.rounds +
            ', waiting ' + before.waiting + ' -> ' + after.waiting + ', drive ' + before.distance + ' -> ' + after.distance
    };
}

// The free cell (or, with plan.pairs and room for two, the two cells) that,
// blocked, make the board hardest while it still clears. mark(col, row, on)
// blocks a cell and undoes it.
function bestCells(board, random, plan, room, allowed, mark, tightWeight) {
    const base = score(clears(board), plan);
    const cells = shuffle(freeCells(board).filter((c) => allowed(c[0], c[1])), random).slice(0, plan.tries);
    const singles = [];

    for (let i = 0; i < cells.length; i++) {
        const [col, row] = cells[i];

        mark(col, row, true);

        const result = clears(board);

        mark(col, row, false);

        if (result.ok) singles.push({ cells: [cells[i]], hard: score(result, plan), tight: tightness(board, col, row) });
    }

    if (!singles.length) return null;

    const rank = (a, b) => (b.hard + b.tight * tightWeight) - (a.hard + a.tight * tightWeight);

    singles.sort(rank);

    if (singles[0].hard > base || !plan.pairs || room < 2) return singles[0].cells;

    // No single cell gains: try two at once.
    const pool = singles.slice(0, PAIR_POOL);
    let best = null;

    for (let i = 0; i < pool.length; i++) {
        const a = pool[i].cells[0];

        mark(a[0], a[1], true);

        for (let j = i + 1; j < pool.length; j++) {
            const b = pool[j].cells[0];

            if (!allowed(b[0], b[1])) continue;

            mark(b[0], b[1], true);

            const result = clears(board);

            mark(b[0], b[1], false);

            if (!result.ok) continue;

            const pair = { cells: [a, b], hard: score(result, plan), tight: (pool[i].tight + pool[j].tight) / 2 };

            if (pair.hard > base && (!best || rank(pair, best) < 0)) best = pair;
        }

        mark(a[0], a[1], false);
    }

    return best ? best.cells : singles[0].cells;
}

// The longer the chain of convoys waiting on others, and the further they
// have to drive, the harder the board. A high plan.drive favours walls that
// bend the roads home over ones that only fill space; plan.wait favours
// boards where, round after round, only one or two convoys can go and the
// player has to find them among the rest.
function score(result, plan) {
    return result.rounds * 100 + result.blockedAtStart * plan.start + result.waiting * plan.wait +
        result.distance * plan.drive + (result.turns || 0) * (plan.turn || 0) + (result.lanes || 0) * (plan.lane || 0) +
        (result.shared || 0) * (plan.share || 0);
}

// Cells hemmed in by walls, obstacles, garages and convoy ends score higher,
// so new pieces sit tight against what is already there.
function tightness(board, col, row) {
    let near = 0;

    for (let i = 0; i < SIDES.length; i++) {
        const c = col + SIDES[i][0];
        const r = row + SIDES[i][1];
        const k = r * board.columns + c;

        if (!onBoard(board, c, r) || board.blocked[k]) near++;
        else if (board.garage[k] !== -1) near += 2;
        else if (board.owner[k] !== -1) near++;
    }

    return near;
}

function edgy(board, col, row) {
    for (let i = 0; i < SIDES.length; i++) {
        const c = col + SIDES[i][0];
        const r = row + SIDES[i][1];

        if (!onBoard(board, c, r) || board.blocked[r * board.columns + c]) return true;
    }

    return false;
}

// Whether the pattern's floor is still one piece with this cell cut out.
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

function tryBlock(board, col, row) {
    const k = row * board.columns + col;

    if (board.blocked[k] || board.owner[k] !== -1 || board.garage[k] !== -1) return false;

    board.blocked[k] = true;

    if (clears(board).ok) return true;

    board.blocked[k] = false;

    return false;
}

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
        convoys: data.convoys.filter((c) => c.exit)
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

function openAround(board, at) {
    const open = [];

    for (let i = 0; i < SIDES.length; i++) {
        const col = at[0] + SIDES[i][0];
        const row = at[1] + SIDES[i][1];

        if (onBoard(board, col, row) && !board.blocked[row * board.columns + col]) open.push([col, row]);
    }

    return open;
}

// Drives home, round after round, every convoy with a clear road from either
// end to its garage (the road the Hint looks for), until none is left or none
// can go. Clearing one only frees cells, so the order within a round doesn't
// matter. With deep, also sizes up each road home: the fewest turns it can
// be driven in, and how many of its cells are one-lane (walled on two sides).
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

            // The easier of its two ends counts: the player will pick it.
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

// The road home with the fewest turns (0-1 search over cell and heading), and
// how many of its cells are one-lane: walls, holes or obstacles on two or
// more sides.
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

    // Plain queue sorted by rounds of cost: 0-cost steps go to a front list.
    let found = -1;
    let front = [];

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

// Swaps the array after "<name>: " in a level's text for a new one, written
// one item per line at the field's own indent.
function replaceField(block, name, write) {
    const found = new RegExp('^( *)' + name + ': \\[', 'm').exec(block);

    if (!found) throw new Error('No ' + name + ' in:\n' + block.slice(0, 200));

    const open = found.index + found[0].length - 1;
    let depth = 0;
    let close = open;

    for (; close < block.length; close++) {
        if (block[close] === '[') depth++;
        else if (block[close] === ']' && --depth === 0) break;
    }

    return block.slice(0, open) + write(found[1]) + block.slice(close + 1);
}

function formatRows(rows, indent) {
    if (!rows.length) return '[]';

    const item = (v) => typeof v === 'string' ? '"' + v + '"' : String(v);
    const lines = rows.map((r) => indent + '    [' + r.map(item).join(', ') + ']');

    return '[\n' + lines.join(',\n') + '\n' + indent + ']';
}

// In the file's own layout: "convoys: [{" with each convoy's fields two
// steps in.
function formatConvoys(convoys, indent) {
    const inner = indent + '        ';
    const items = convoys.map((c) => [
        inner + 'key: "' + c.key + '",',
        inner + 'exit: [' + c.exit.join(', ') + '],',
        inner + 'facing: ' + c.facing + ',',
        inner + 'cells: ' + formatRows(c.cells, inner)
    ].join('\n'));

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
