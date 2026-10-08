// Nests convoys inside others on levels 26 and up of data/level-data.js, in
// place, the way Gecko Out's hardest boards carry a gecko inside a gecko.
//
// A nested convoy ("inside: <key>" on it, its cells the carts right behind
// the outer one's tractor) rides small inside the outer one wherever that is
// driven, and can't be moved. Once the outer one is in its garage, the inner
// one comes out on the cells just outside the door - where the outer one's
// carts last stood - and plays as any other. So it waits on the outer one,
// and the outer one on whatever blocks it; and where the outer one is driven
// home decides where the inner one stands in the way of others.
//
// No new colours or garages: an existing convoy is moved inside another, a
// cart shorter than it at most, keeping its own garage. The cells it leaves
// get obstacles, where the board still clears with them, so the floor
// doesn't open up. Of every outer and inner, the pair kept is the one whose
// board takes the most rounds to clear - each round driving home every
// convoy that safely can - and keeps the inner one waiting longest.
//
// Every board written clears by driving the convoys home one at a time
// (the promise the level data makes): freezes counting down, an inner convoy
// only once its outer one is home, and set down where the outer one stops
// when driven home the shortest way. Setting one down can block others, so
// unlike the other level tools this searches the orders convoys can go in,
// not just one. A board that doesn't clear that way to begin with (some need
// a convoy dragged aside first) is checked step by step instead, as the
// player drags (see dragClears): it is nested only where it still clears
// with convoys moved aside, the inner one set down wherever the outer one
// is driven home from.
//
//   26-60    one nest            101-150  two
//   61-80    one, or two on      151-200  two or three
//            every tenth level
//   81-100   two
//
// Each nest puts NEST_TIME more seconds on the clock. Nested levels are
// marked "(nested)" in their comment and skipped on a second run; the picks
// are seeded by level number. Run it after the other level tools (to build
// again, take data/level-data.js back to before it was run first).
//
//   node tools/nest-levels.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(new URL('../data/level-data.js', import.meta.url));
const FIRST = 26;
const MARK = '(nested)';
const NEST_TIME = 8;
// The shortest a nested convoy can be (a tractor and a cart).
const SHORTEST = 2;
// Obstacles put on the cells a moved convoy leaves, if the level has none of
// its own to copy.
const OBSTACLES = ['cone', 'planter'];

// The most positions one search looks at before giving the board up as not
// clearing.
const SEARCH_LIMIT = 40000;
// The same, for a board searched step by step with convoys dragged aside.
const DRAG_LIMIT = 400000;

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
        const random = seeded(level * 7919 + 53);
        const change = nestLevel(data, plan(level, data, random), random);

        if (change.nests) {
            block = block.replace(heads[h][0], heads[h][0] + ' ' + MARK);
            block = replaceField(block, 'obstacles', (indent) => formatRows(change.obstacles, indent));
            block = replaceField(block, 'convoys', (indent) => formatConvoys(change.convoys, indent));
            block = block.replace(/^( *)time: \d+,/m, '$1time: ' + change.time + ',');
        }

        console.log('Level ' + level + ': ' + change.report);
    }

    out += block;
}

out += source.slice(at);
writeFileSync(FILE, out);

// ---- nesting -------------------------------------------------------------

function plan(level, data, random) {
    if (level <= 60) return 1;
    if (level <= 80) return level % 10 === 0 ? 2 : 1;
    if (level <= 150) return 2;

    return random() < 0.5 ? 2 : 3;
}

function nestLevel(source, want, random) {
    const data = {
        columns: source.columns,
        rows: source.rows,
        pattern: source.pattern,
        walls: source.walls || [],
        obstacles: (source.obstacles || []).map((o) => o.slice()),
        convoys: source.convoys.map((c) => Object.assign({}, c, { cells: c.cells.map((p) => p.slice()) }))
    };
    const types = [...new Set(data.obstacles.map((o) => o[2]).filter(Boolean))];
    const judge = rounds(data) ? rounds : dragRounds;
    const before = judge(data);

    if (!before) return { nests: 0, report: 'left as it is, its board does not clear' };

    const done = [];

    for (let n = 0; n < want; n++) {
        const best = bestNest(data, judge, random);

        if (!best) break;

        const inner = data.convoys[best.inner];
        const left = inner.cells;

        inner.cells = best.cells;
        inner.inside = data.convoys[best.outer].key;

        const filled = fillLeft(data, judge, left, types.length ? types : OBSTACLES, random);

        done.push(inner.key + ' in ' + inner.inside + (filled ? ' +' + filled + ' obstacles' : ''));
    }

    const after = judge(data);

    if (!after) throw new Error('A nested board does not clear');

    return {
        nests: done.length,
        obstacles: data.obstacles,
        convoys: data.convoys,
        time: (source.time || 60) + NEST_TIME * done.length,
        report: done.length ?
            done.join(', ') + (judge === rounds ?
                ' (rounds ' + before.count + ' -> ' + after.count + ')' :
                ' (clears with convoys dragged aside)') :
            'no nest fits'
    };
}

// Every outer and inner, scored on how the board then clears. The inner one
// rides on the carts right behind the outer one's tractor, facing the same
// way.
function bestNest(data, judge, random) {
    const convoys = data.convoys;
    const outers = new Set(convoys.map((c) => c.inside).filter(Boolean));
    let best = null;

    for (let a = 0; a < convoys.length; a++) {
        const outer = convoys[a];

        if (outer.inside || outers.has(outer.key) || outer.cells.length < SHORTEST + 1) continue;

        for (let b = 0; b < convoys.length; b++) {
            const inner = convoys[b];

            if (b === a || inner.inside || outers.has(inner.key)) continue;

            const length = Math.min(inner.cells.length, outer.cells.length - 1);
            const was = inner.cells;

            if (length < SHORTEST) continue;

            inner.cells = outer.cells.slice(1, 1 + length).map((p) => p.slice());
            inner.inside = outer.key;

            const result = judge(data);

            if (result) {
                const score = result.count * 1000 + result.round[b] * 100 + result.waits * 10 + random() * 5;

                if (!best || score > best.score) {
                    best = { score: score, outer: a, inner: b, cells: inner.cells.map((p) => p.slice()) };
                }
            }

            delete inner.inside;
            inner.cells = was;
        }
    }

    return best;
}

// Obstacles on the cells a moved convoy left, one at a time, each kept only
// if the board still clears, no slower than it did, and every garage keeps
// an open side.
function fillLeft(data, judge, cells, types, random) {
    const base = judge(data);
    let filled = 0;

    shuffle(cells.slice(), random).forEach((cell) => {
        if (taken(data, cell)) return;

        const obstacle = [cell[0], cell[1], types[Math.floor(random() * types.length)]];

        data.obstacles.push(obstacle);

        const result = judge(data);

        if (result && result.count >= base.count && garagesOpen(data)) {
            filled++;
            return;
        }

        data.obstacles.pop();
    });

    return filled;
}

function taken(data, cell) {
    const same = (p) => p[0] === cell[0] && p[1] === cell[1];

    return data.convoys.some((c) => c.cells.some(same) || same(c.exit)) || data.obstacles.some(same);
}

function garagesOpen(data) {
    const board = makeBoard(data);

    return data.convoys.every((c) => SIDES.some((s) => {
        const col = c.exit[0] + s[0];
        const row = c.exit[1] + s[1];

        return onBoard(board, col, row) && !board.blocked[row * board.columns + col];
    }));
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
        convoys: data.convoys,
        outer: data.convoys.map((c) => c.inside ? data.convoys.findIndex((o) => o.key === c.inside) : -1)
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

// Where everything stands before a move: no one home, the inner convoys still
// carried (on no cells of their own).
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

    if (state.home[i] || !cells) return [];
    if ((convoy.frozen || 0) > state.count) return [];

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
        // Driven from its head the lead is the tractor; from its tail, the
        // last cart. Its track is its body, lead last, then the road; it
        // stops with its lead on the garage and the rest behind.
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

// Whether some order of driving convoys home from here clears the board.
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

// Plays the board out, round after round: each round, every convoy that
// could go as the round began goes, if it still can and the board still
// clears after. The rounds it took, the round each convoy went in and their
// sum - or null if the board doesn't clear.
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
// as the cells after that end up to the garage, or null.
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

// ---- clearing a board with convoys dragged aside --------------------------

// As rounds, for a board that only clears with convoys dragged aside first:
// the order dragClears found them going home in stands in for the rounds
// (count is 0, so obstacles are kept wherever it still clears), or null.
function dragRounds(data) {
    const order = dragClears(data);

    if (!order) return null;

    const round = data.convoys.map((c, i) => order.indexOf(i));

    return { count: 0, round: round, waits: round.reduce((a, b) => a + b, 0) };
}

// Whether the board clears as the player plays it: a convoy steps either end
// into a free cell next to it, its last cart leaving one, until its lead
// steps onto its garage. What it carries is then set down on the cells its
// lead end stood on. A convoy carrying nothing that can drive home is sent
// there straight away (that only frees cells), and otherwise the search goes
// deepest first, most convoys home first. The order convoys went home in, or
// null if none is found within DRAG_LIMIT positions.
function dragClears(data) {
    const board = makeBoard(data);
    const columns = board.columns;
    const size = columns * board.rows;
    const convoys = board.convoys;
    const n = convoys.length;
    const exit = convoys.map((c) => c.exit[1] * columns + c.exit[0]);
    const lengths = convoys.map((c) => c.cells.length);
    const near = [];

    for (let k = 0; k < size; k++) {
        const col = k % columns;
        const row = (k - col) / columns;

        near[k] = SIDES.map((s) => [col + s[0], row + s[1]])
            .filter((p) => onBoard(board, p[0], p[1]) && !board.blocked[p[1] * columns + p[0]])
            .map((p) => p[1] * columns + p[0]);
    }

    const start = {
        cells: convoys.map((c, i) => board.outer[i] === -1 ? c.cells.map((p) => p[1] * columns + p[0]) : null),
        home: convoys.map(() => false),
        count: 0,
        depth: 0,
        order: []
    };

    if (start.cells.some((c) => c && c.some((k) => board.blocked[k]))) return null;

    const ahead = (a, b) => (b.count - a.count) || (b.depth - a.depth);
    const queue = [];
    const seen = new Set();
    let left = DRAG_LIMIT;

    queue.push(start);
    seen.add(dragKey(start));

    while (queue.length) {
        const state = sendHome(popBest(queue, ahead));

        if (state.home.every(Boolean)) return state.order;
        if (left-- <= 0) return null;

        const owner = dragOwners(state, size);
        const garage = dragGarages(state, exit, size);

        for (let i = 0; i < n; i++) {
            const cells = state.cells[i];

            if (state.home[i] || !cells) continue;

            const ends = cells.length > 1 ? [0, cells.length - 1] : [0];

            for (const end of ends) {
                for (const k of near[cells[end]]) {
                    if (owner[k] !== -1 || (garage[k] !== -1 && garage[k] !== i)) continue;

                    let next;

                    if (k === exit[i]) {
                        if ((convoys[i].frozen || 0) > state.count) continue;

                        next = driveIn(state, i, end === 0 ? cells : cells.slice().reverse());
                    } else {
                        next = Object.assign({}, state, { cells: state.cells.slice(), depth: state.depth + 1 });
                        next.cells[i] = end === 0 ? [k].concat(cells.slice(0, -1)) : cells.slice(1).concat(k);
                    }

                    const key = dragKey(next);

                    if (seen.has(key)) continue;

                    seen.add(key);
                    pushBest(queue, next, ahead);
                }
            }
        }
    }

    return null;

    // Home, lead first: what it carried goes down where its lead end stood.
    function driveIn(state, i, lead) {
        const next = {
            cells: state.cells.slice(),
            home: state.home.slice(),
            count: state.count + 1,
            depth: state.depth + 1,
            order: state.order.concat(i)
        };
        const j = board.cargo[i];

        next.home[i] = true;
        next.cells[i] = null;

        if (j !== -1) next.cells[j] = lead.slice(0, Math.min(lengths[j], lead.length - 1));

        return next;
    }

    function sendHome(state) {
        for (let again = true; again;) {
            again = false;

            const owner = dragOwners(state, size);
            const garage = dragGarages(state, exit, size);

            for (let i = 0; i < n && !again; i++) {
                const cells = state.cells[i];
                const j = board.cargo[i];

                if (state.home[i] || !cells || (j !== -1 && !state.home[j] && !state.cells[j])) continue;
                if ((convoys[i].frozen || 0) > state.count) continue;

                const ends = [0, cells.length - 1];

                for (let e = 0; e < ends.length && !again; e++) {
                    const from = cells[ends[e]];

                    if (roadHome(board, owner, garage, i, [from % columns, (from - from % columns) / columns], convoys[i].exit)) {
                        state = Object.assign({}, state, {
                            cells: state.cells.slice(),
                            home: state.home.slice(),
                            count: state.count + 1,
                            order: state.order.concat(i)
                        });
                        state.cells[i] = null;
                        state.home[i] = true;
                        again = true;
                    }
                }
            }
        }

        return state;
    }
}

function dragOwners(state, size) {
    const owner = new Array(size).fill(-1);

    state.cells.forEach((cells, i) => cells && cells.forEach((k) => owner[k] = i));

    return owner;
}

function dragGarages(state, exit, size) {
    const garage = new Array(size).fill(-1);

    exit.forEach((k, i) => { if (!state.home[i]) garage[k] = i; });

    return garage;
}

function dragKey(state) {
    return state.cells.map((c, i) => c ? c.join(',') : state.home[i] ? 'h' : 'c').join('|');
}

function pushBest(heap, item, ahead) {
    heap.push(item);

    for (let i = heap.length - 1; i > 0;) {
        const up = (i - 1) >> 1;

        if (ahead(heap[i], heap[up]) >= 0) break;

        [heap[i], heap[up]] = [heap[up], heap[i]];
        i = up;
    }
}

function popBest(heap, ahead) {
    const top = heap[0];
    const last = heap.pop();

    if (heap.length) {
        heap[0] = last;

        for (let i = 0; ;) {
            const a = 2 * i + 1;
            const b = a + 1;
            let m = i;

            if (a < heap.length && ahead(heap[a], heap[m]) < 0) m = a;
            if (b < heap.length && ahead(heap[b], heap[m]) < 0) m = b;
            if (m === i) break;

            [heap[i], heap[m]] = [heap[m], heap[i]];
            i = m;
        }
    }

    return top;
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
        [inner + 'cells: ' + formatRows(c.cells, inner)]
    ).join('\n'));

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
