// Chains convoys up on levels 101 and up of data/level-data.js, in place,
// the way Gecko Out's later boards lock a gecko up until another brings the
// key home.
//
// A locked convoy ("lock: <colour>" on it) sits wrapped in chains of that
// colour, a padlock on it, and can't be moved. The key to it rides on
// another convoy ("carryKey: <colour>"), tied to its tractor: once that one
// drives into its garage, the key flies to the padlock and the chains come
// off. So the locked convoy waits on the one carrying its key, and that one
// on whatever blocks it.
//
// No new convoys or garages: an existing convoy is locked and another given
// its key. The key always goes on a convoy that can drive home from the very
// start, so the pattern reads the same on every level: clear the convoy
// with the key, then the chained one (see bestLock).
// Convoys carried inside others or frozen aren't locked or given a key, and a
// convoy is never both locked and carrying a key (one thing at a time on a
// convoy reads better). Chains and key never match the convoys they are on
// (CLASHES).
//
// Every board written clears by driving the convoys home one at a time (the
// promise the level data makes), as tools/nest-levels.mjs checks it, with a
// locked convoy going only once the one carrying its key is home. A board
// that only clears with convoys dragged aside first is left as it is.
//
//   101-169  one lock        170-400  one or two      401-  two
//
// Each lock puts LOCK_TIME more seconds on the clock. Locked levels are
// marked "(locked)" in their comment and skipped on a second run; the picks
// are seeded by level number. Run it after the other level tools: they don't
// know of locks, and tools/freeze-levels.mjs writes 101-200 afresh.
//
//   node tools/lock-levels.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(new URL('../data/level-data.js', import.meta.url));
const FIRST = 101;
const MARK = '(locked)';
const LOCK_TIME = 6;
// One colour a lock: the key and chains match. Never chains that melt into
// the convoy they are on.
const COLORS = ['gold', 'silver'];
const CLASHES = {
    gold: ['yellow', 'orange', 'lime'],
    silver: ['white']
};

// The most positions one search looks at before giving the board up as not
// clearing.
const SEARCH_LIMIT = 40000;

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

    out += source.slice(at, start);
    at = end;

    let block = source.slice(start, end);

    if (level >= FIRST && !heads[h][0].includes(MARK)) {
        const data = levels[level - 1];
        const random = seeded(level * 7919 + 211);
        const change = lockLevel(data, plan(level, random), random);

        if (change.locks) {
            block = block.replace(heads[h][0], heads[h][0] + ' ' + MARK);
            block = replaceField(block, 'convoys', (indent) => formatConvoys(change.convoys, indent));
            block = block.replace(/^( *)time: \d+,/m, '$1time: ' + change.time + ',');
        }

        console.log('Level ' + level + ': ' + change.report);
    }

    out += block;
}

out += source.slice(at);
writeFileSync(FILE, out);

// ---- locking -------------------------------------------------------------

function plan(level, random) {
    if (level < 170) return 1;
    if (level > 400) return 2;

    return random() < 0.5 ? 2 : 1;
}

function lockLevel(source, want, random) {
    const data = {
        columns: source.columns,
        rows: source.rows,
        pattern: source.pattern,
        walls: source.walls || [],
        obstacles: source.obstacles || [],
        convoys: source.convoys.map((c) => Object.assign({}, c, { cells: c.cells.map((p) => p.slice()) }))
    };
    const before = rounds(data);

    if (!before) return { locks: 0, report: 'left as it is, its board does not clear driving convoys home' };

    const done = [];

    for (let n = 0; n < want; n++) {
        const left = COLORS.filter((color) => !data.convoys.some((c) => c.lock === color));
        const best = bestLock(data, left, random);

        if (!best) break;

        data.convoys[best.lock].lock = best.color;
        data.convoys[best.carrier].carryKey = best.color;
        done.push(data.convoys[best.lock].key + ' locked, ' + best.color + ' key on ' + data.convoys[best.carrier].key);
    }

    const after = rounds(data);

    if (!after) throw new Error('A locked board does not clear');

    return {
        locks: done.length,
        convoys: data.convoys,
        time: (source.time || 60) + LOCK_TIME * done.length,
        report: done.length ?
            done.join('; ') + ' (rounds ' + before.count + ' -> ' + after.count + ')' :
            'no lock fits'
    };
}

// Every convoy that can be locked, with every other that could carry its
// key, scored so each lock plays out the same pattern: clear the convoy with
// the key first, which opens the lock, then the one it held. So the carrier
// must have a clear road home from the very start - never hidden behind the
// lock or anything else (a level with no such convoy gets no lock) - the
// locked convoy should be one that was free to go early (so it is the lock,
// not the board, that holds it), and it should be next to go once its key
// is home. A lock that holds its convoy back past where it went before
// counts for most, and a board taking more rounds to clear for more still.
function bestLock(data, colors, random) {
    const base = rounds(data);
    const free = (c) => !c.inside && !c.frozen && !c.lock && !c.carryKey;
    let best = null;

    data.convoys.forEach((convoy, i) => {
        if (!free(convoy)) return;

        data.convoys.forEach((carrier, j) => {
            if (j === i || !free(carrier)) return;

            // Chains and key both stand out from the convoy they are on.
            const color = colors.find((c) => !CLASHES[c].includes(convoy.key) && !CLASHES[c].includes(carrier.key));

            if (!color) return;

            convoy.lock = color;
            carrier.carryKey = color;

            const result = rounds(data);

            // Free to go home as the board starts, with the lock on.
            if (result && result.count >= base.count && result.round[j] === 0 && goesNow(data, j)) {
                const held = result.round[i] > base.round[i] ? 1 : 0;
                const first = result.round[j];
                const wait = result.round[i] - first - 1;
                const score = result.count * 1000 + held * 300 - first * 80 - wait * 40 -
                    base.round[i] * 20 + random() * 10;

                if (!best || score > best.score) best = { score: score, lock: i, carrier: j, color: color };
            }

            delete carrier.carryKey;
            delete convoy.lock;
        });
    });

    return best;
}

// Whether a convoy has a clear road home as the board stands at the start.
function goesNow(data, i) {
    const board = makeBoard(data);

    return moves(board, startState(board), i).length > 0;
}

// ---- clearing a board ----------------------------------------------------
// As tools/nest-levels.mjs, with locks: a locked convoy can't go until the
// one carrying its key is home.

function makeBoard(data) {
    const columns = data.columns;
    const rows = data.rows;
    const size = columns * rows;
    const board = {
        columns: columns,
        rows: rows,
        blocked: new Array(size).fill(false),
        convoys: data.convoys,
        outer: data.convoys.map((c) => c.inside ? data.convoys.findIndex((o) => o.key === c.inside) : -1),
        // The convoy carrying the key each convoy waits on, or -1.
        keyFrom: data.convoys.map((c) => c.lock ? data.convoys.findIndex((o) => o.carryKey === c.lock) : -1)
    };

    board.cargo = data.convoys.map((c, i) => board.outer.indexOf(i));

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            if (data.pattern[row][col] !== 1) board.blocked[row * columns + col] = true;
        }
    }

    data.obstacles.forEach((o) => board.blocked[o[1] * columns + o[0]] = true);
    data.walls.forEach((w) => w.cells.forEach((c) => board.blocked[c[1] * columns + c[0]] = true));

    return board;
}

function startState(board) {
    const size = board.columns * board.rows;
    const state = {
        owner: new Array(size).fill(-1),
        garage: new Array(size).fill(-1),
        cells: board.convoys.map((c, i) => board.outer[i] === -1 ? c.cells : null),
        home: board.convoys.map(() => false),
        count: 0
    };

    board.convoys.forEach((convoy, i) => {
        if (state.cells[i]) state.cells[i].forEach((c) => state.owner[c[1] * board.columns + c[0]] = i);
        state.garage[convoy.exit[1] * board.columns + convoy.exit[0]] = i;
    });

    return state;
}

// The ways a convoy can go home now: from either end, the shortest road.
function moves(board, state, i) {
    const convoy = board.convoys[i];
    const cells = state.cells[i];
    const from = board.keyFrom[i];

    if (state.home[i] || !cells) return [];
    if ((convoy.frozen || 0) > state.count) return [];
    if (from !== -1 && !state.home[from]) return [];

    const out = [];

    [0, cells.length - 1].forEach((end) => {
        const road = roadHome(board, state.owner, state.garage, i, cells[end], convoy.exit);

        if (road) out.push({ index: i, end: end, road: road });
    });

    return out;
}

// Drives it home: its cells and garage are free, and what it carried is set
// down on the cells behind its tractor where it stopped, at the door.
function apply(board, state, move) {
    const columns = board.columns;
    const i = move.index;
    const cells = state.cells[i];
    const next = {
        owner: state.owner.slice(),
        garage: state.garage.slice(),
        cells: state.cells.slice(),
        home: state.home.slice(),
        count: state.count + 1
    };

    cells.forEach((c) => next.owner[c[1] * columns + c[0]] = -1);
    next.garage[board.convoys[i].exit[1] * columns + board.convoys[i].exit[0]] = -1;
    next.home[i] = true;
    next.cells[i] = null;

    const j = board.cargo[i];

    if (j !== -1) {
        const headFirst = move.end === 0;
        const lead = headFirst ? cells : cells.slice().reverse();
        const track = lead.slice().reverse().concat(move.road);
        const stop = track.slice(-cells.length).reverse();
        const nth = (k) => headFirst ? stop[k] : stop[stop.length - 1 - k];
        const length = board.convoys[j].cells.length;
        const down = [];

        for (let k = 1; k <= length; k++) down.push(nth(k));

        down.forEach((c) => next.owner[c[1] * columns + c[0]] = j);
        next.cells[j] = down;
    }

    return next;
}

function stateKey(state) {
    return state.home.map((h) => h ? 1 : 0).join('') + '|' +
        state.cells.map((c) => c ? c.map((p) => p[0] + ',' + p[1]).join(';') : '').join('|');
}

function clears(board, state, seen, budget) {
    if (state.home.every(Boolean)) return true;

    const key = stateKey(state);

    if (seen.has(key) || budget.left-- <= 0) return false;

    seen.add(key);

    for (let i = 0; i < board.convoys.length; i++) {
        const options = moves(board, state, i);

        for (let m = 0; m < options.length; m++) {
            if (clears(board, apply(board, state, options[m]), seen, budget)) return true;
        }
    }

    return false;
}

function solvable(board, state) {
    return clears(board, state, new Set(), { left: SEARCH_LIMIT });
}

// Plays the board out, round after round, as tools/nest-levels.mjs does: the
// rounds it took, the round each convoy went in and their sum - or null if
// the board doesn't clear.
function rounds(data) {
    const board = makeBoard(data);
    let state = startState(board);

    for (const c of board.convoys) {
        for (const p of c.cells) {
            if (board.blocked[p[1] * board.columns + p[0]]) return null;
        }
    }

    if (!solvable(board, state)) return null;

    const n = board.convoys.length;
    const round = new Array(n).fill(-1);
    let count = 0;

    while (!state.home.every(Boolean)) {
        const ready = [];

        for (let i = 0; i < n; i++) {
            if (moves(board, state, i).length) ready.push(i);
        }

        let went = 0;

        for (let r = 0; r < ready.length; r++) {
            const options = moves(board, state, ready[r]);

            for (let m = 0; m < options.length; m++) {
                const next = apply(board, state, options[m]);

                if (solvable(board, next)) {
                    state = next;
                    round[ready[r]] = count;
                    went++;
                    break;
                }
            }
        }

        if (!went) return null;

        count++;
    }

    return { count: count, round: round, waits: round.reduce((a, b) => a + b, 0) };
}

function onBoard(board, col, row) {
    return col >= 0 && row >= 0 && col < board.columns && row < board.rows;
}

// The shortest road from one end of a convoy to its garage over free cells,
// as the cells after that end up to it, or null.
function roadHome(board, owner, garage, index, from, goal) {
    const columns = board.columns;
    const target = goal[1] * columns + goal[0];
    const start = from[1] * columns + from[0];
    const back = new Map([[start, -1]]);
    const queue = [start];

    for (let q = 0; q < queue.length; q++) {
        const k0 = queue[q];
        const cell = [k0 % columns, Math.floor(k0 / columns)];

        for (let i = 0; i < SIDES.length; i++) {
            const col = cell[0] + SIDES[i][0];
            const row = cell[1] + SIDES[i][1];
            const k = row * columns + col;

            if (!onBoard(board, col, row)) continue;
            if (back.has(k) || board.blocked[k] || owner[k] !== -1) continue;
            if (garage[k] !== -1 && garage[k] !== index) continue;

            back.set(k, k0);

            if (k === target) {
                const road = [];

                for (let at = k; at !== start; at = back.get(at)) road.unshift([at % columns, Math.floor(at / columns)]);

                return road;
            }

            queue.push(k);
        }
    }

    return null;
}

// ---- writing it out ------------------------------------------------------

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

function formatConvoys(convoys, indent) {
    const inner = indent + '        ';
    const items = convoys.map((c) => [
        inner + 'key: "' + c.key + '",',
        inner + 'exit: [' + c.exit.join(', ') + '],',
        inner + 'facing: ' + c.facing + ','
    ].concat(
        c.frozen ? [inner + 'frozen: ' + c.frozen + ','] : [],
        c.inside ? [inner + 'inside: "' + c.inside + '",'] : [],
        c.lock ? [inner + 'lock: "' + c.lock + '",'] : [],
        c.carryKey ? [inner + 'carryKey: "' + c.carryKey + '",'] : [],
        [inner + 'cells: ' + formatRows(c.cells, inner)]
    ).join('\n'));

    return '[{\n' + items.join('\n' + indent + '    },\n' + indent + '    {\n') + '\n' + indent + '    }\n' + indent + ']';
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
