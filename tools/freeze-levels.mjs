// Freezes garages on levels 51-100 of data/level-data.js in place, and writes
// levels 101-200: the boards of levels 51-100 again, with some of their
// garages frozen. Only the boards that clear by
// driving convoys home one at a time are used (the others need convoys
// shuffled about first, which this can't check), and of them only those a
// freeze can hold something back on (see freezable), walked three times over,
// easiest first: mirrored left to right for 101-133, top to bottom for
// 134-166 and both ways for 167-200, so they don't read as repeats. Levels
// 51-100 keep their own boards and get one gentle freeze where one fits, to
// bring freezes in.
//
// A frozen garage ("frozen: n" on its convoy) sits under a block of ice showing
// n: it opens once n other convoys are home. The freezes go on the convoys that
// could go home soonest, so the easy first move is shut and the player has to
// clear others first; each freeze is only kept if the board still clears by
// driving the convoys home one at a time with the freezes counting down (the
// promise the level data makes), and only if it really holds that convoy
// back. More freezes and bigger numbers further on:
//
//   51-100   one freeze (counting 2-3)
//   101-120  one freeze       141-170  two freezes
//   121-140  one or two     171-200  two or three
//
// The levels it wrote before (everything past 100) are replaced on every run,
// and 51-100 frozen again from their boards; the picks are seeded by level
// number.
//
//   node tools/freeze-levels.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(new URL('../data/level-data.js', import.meta.url));
const FIRST = 101;
const LAST = 200;
const BASE = 51;
// Levels frozen in place, on their own boards.
const INTRO_LAST = 100;
// Seconds more on the clock for each freeze: waiting on one is thinking time.
const FREEZE_TIME = 6;
const MARK = '(frozen)';

const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const source = readFileSync(FILE, 'utf8');
const levels = (await import(FILE + '?' + Date.now())).default;
const heads = [...source.matchAll(/^ *\/\/ Level (\d+)[^\n]*$/gm)];

// Everything up to level 100's block, and the closing "]" of the list.
const keep = heads.filter((h) => Number(h[1]) <= 100);
const lastHead = keep[keep.length - 1];
const nextHead = heads.find((h) => Number(h[1]) > 100);
const tailEnd = nextHead ? nextHead.index : source.lastIndexOf(']');
const head = source.slice(0, tailEnd).replace(/,?\s*$/, '');
// Levels 51-100 as they were before being frozen here.
const base = levels.slice(0, 100).map(thawed);

// Its boards are laid out before convoys are nested (tools/nest-levels.mjs),
// which it knows nothing of.
if (base.some((l) => l.convoys.some((c) => c.inside))) {
    throw new Error('Levels 51-100 are nested: run this on data/level-data.js from before tools/nest-levels.mjs');
}
const bases = [];
const blocks = [];
let intro = '';
let at = 0;

for (let h = 0; h < keep.length; h++) {
    const level = Number(keep[h][1]);

    if (level < BASE || level > INTRO_LAST) continue;

    const start = keep[h].index;
    const end = h + 1 < keep.length ? keep[h + 1].index : tailEnd;
    const data = copy(base[level - 1]);
    const marks = keep[h][0].trim().replace(/^\/\/ Level \d+\s*/, '').replace(MARK, '').trim();
    const board = makeBoard(data);
    let result = { freezes: 0, report: 'left as it is, its board does not clear' };

    if (freezable(board)) result = freeze(data, level, seeded(level * 7919 + 101));

    let block = head.slice(start, end);

    block = block.replace(keep[h][0], keep[h][0].replace(/^( *\/\/ Level \d+).*$/, '$1') +
        [marks, result.freezes ? MARK : ''].filter(Boolean).map((m) => ' ' + m).join(''));
    block = replaceField(block, 'convoys', (indent) => formatConvoys(data.convoys, indent));
    block = block.replace(/^( *)time: \d+,/m, '$1time: ' + ((data.time || 60) + FREEZE_TIME * result.freezes) + ',');
    intro += head.slice(at, start) + block;
    at = end;
    console.log('Level ' + level + ': ' + result.report);
}

const frozenHead = intro + head.slice(at);
const PASSES = ['x', 'y', 'xy'];

for (let from = BASE; from <= 100; from++) {
    if (freezable(makeBoard(base[from - 1]))) bases.push(from);
}

for (let level = FIRST; level <= LAST; level++) {
    const i = level - FIRST;
    const pass = Math.min(PASSES.length - 1, Math.floor(i * PASSES.length / (LAST - FIRST + 1)));
    const passStart = Math.ceil(pass * (LAST - FIRST + 1) / PASSES.length);
    const passEnd = Math.ceil((pass + 1) * (LAST - FIRST + 1) / PASSES.length);
    const from = bases[Math.floor((i - passStart) * bases.length / (passEnd - passStart))];
    const data = mirror(base[from - 1], PASSES[pass]);
    const random = seeded(level * 7919 + 101);
    const result = freeze(data, level, random);

    data.time = (data.time || 60) + FREEZE_TIME * result.freezes;

    const baseHead = heads.find((h) => Number(h[1]) === from)[0].trim();
    const marks = baseHead.replace(/^\/\/ Level \d+\s*/, '').replace(MARK, '').trim();

    blocks.push(write(data, level, [marks, MARK].filter(Boolean).join(' ')));
    console.log('Level ' + level + ' (from ' + from + '): ' + result.report);
}

if (lastHead === undefined) throw new Error('No levels found');

writeFileSync(FILE, frozenHead + ',\n\n' + blocks.join(',\n\n') + '\n]\n');

// ---- making a level ------------------------------------------------------

// A level with its freezes, and the time they put on its clock, taken off.
function thawed(data) {
    const freezes = data.convoys.filter((c) => c.frozen).length;

    return Object.assign(copy(data), {
        time: (data.time || 60) - FREEZE_TIME * freezes,
        convoys: data.convoys.map((c) => {
            const rest = Object.assign({}, c, { cells: c.cells.map((p) => p.slice()) });

            delete rest.frozen;

            return rest;
        })
    });
}

function copy(data) {
    return {
        difficulty: data.difficulty,
        rows: data.rows,
        columns: data.columns,
        time: data.time,
        pattern: data.pattern.map((r) => r.slice()),
        obstacles: (data.obstacles || []).map((o) => o.slice()),
        walls: (data.walls || []).map((w) => Object.assign({}, w, { cells: w.cells.map((p) => p.slice()) })),
        convoys: data.convoys.map((c) => Object.assign({}, c, { cells: c.cells.map((p) => p.slice()) }))
    };
}

function mirror(data, axis) {
    const columns = data.columns;
    const rows = data.rows;
    const fx = axis.includes('x');
    const fy = axis.includes('y');
    const flip = (c) => [fx ? columns - 1 - c[0] : c[0], fy ? rows - 1 - c[1] : c[1]];

    return {
        difficulty: data.difficulty,
        rows: rows,
        columns: columns,
        time: data.time,
        pattern: (fy ? data.pattern.slice().reverse() : data.pattern).map((r) => fx ? r.slice().reverse() : r.slice()),
        obstacles: (data.obstacles || []).map((o) => {
            const [col, row] = flip(o);

            return o.length > 2 ? [col, row].concat(o.slice(2)) : [col, row];
        }),
        walls: (data.walls || []).map((w) => Object.assign({}, w, { cells: w.cells.map(flip) })),
        convoys: data.convoys.map((c) => ({
            key: c.key,
            exit: flip(c.exit),
            facing: c.facing,
            cells: c.cells.map(flip)
        }))
    };
}

// How many freezes a level gets, and the most each can count.
function plan(level, random) {
    if (level <= INTRO_LAST) return { count: 1, most: level <= 75 ? 2 : 3 };

    const t = (level - FIRST) / (LAST - FIRST);
    let count;

    if (level <= 120) count = 1;
    else if (level <= 140) count = random() < 0.5 ? 1 : 2;
    else if (level <= 170) count = 2;
    else count = random() < 0.5 ? 2 : 3;

    return { count: count, most: Math.round(2 + t * 6) };
}

function freeze(data, level, random) {
    const want = plan(level, random);
    const board = makeBoard(data);
    const n = board.convoys.length;
    const freezes = new Array(n).fill(0);
    const done = [];

    for (let k = 0; k < want.count; k++) {
        // When each convoy gets home as things stand: soonest first.
        const order = clearOrder(board, freezes);

        if (!order) break;

        const free = order.filter((i) => !freezes[i]);

        let placed = false;

        for (let p = 0; p < free.length && !placed; p++) {
            const index = free[p];
            const at = order.indexOf(index);
            // It must hold the convoy past where it would go anyway.
            const least = at + 1;
            const most = Math.min(n - 1, Math.max(want.most, least));
            const tries = [];

            for (let v = most; v >= least; v--) tries.push(v);

            // The biggest that still clears, give or take, for some variety.
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
        report: done.length ? done.map((i) => data.convoys[i].key + ' ' + freezes[i]).join(', ') : 'no freeze fits'
    };
}

// Whether the board clears and has a convoy a freeze would really hold back:
// on some boards every convoy has to go in the one order, and there a freeze
// only ever counts down to where it would go anyway.
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

    data.obstacles.forEach((o) => board.blocked[o[1] * columns + o[0]] = true);
    data.walls.forEach((w) => w.cells.forEach((c) => board.blocked[c[1] * columns + c[0]] = true));

    board.convoys.forEach((convoy, i) => {
        convoy.cells.forEach((c) => board.owner[c[1] * columns + c[0]] = i);
        board.garage[convoy.exit[1] * columns + convoy.exit[0]] = i;
    });

    return board;
}

// Drives convoys home one at a time, any that has a clear road from either
// end and whose freeze has counted down, until none is left (the order they
// went, soonest first) or none can go (null). Getting one home only frees
// cells and counts freezes down, so taking whichever can go never shuts out
// an order that would have cleared.
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

            for (let e = 0; e < ends.length; e++) {
                if (roadHome(board, owner, garage, index, ends[e], convoy.exit)) {
                    going = index;
                    break;
                }
            }
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

function roadHome(board, owner, garage, index, from, goal) {
    const columns = board.columns;
    const target = goal[1] * columns + goal[0];
    const seen = new Set([from[1] * columns + from[0]]);
    const queue = [from];

    for (let q = 0; q < queue.length; q++) {
        const cell = queue[q];

        for (let i = 0; i < SIDES.length; i++) {
            const col = cell[0] + SIDES[i][0];
            const row = cell[1] + SIDES[i][1];
            const k = row * columns + col;

            if (col < 0 || row < 0 || col >= board.columns || row >= board.rows) continue;
            if (seen.has(k) || board.blocked[k] || owner[k] !== -1) continue;
            if (garage[k] !== -1 && garage[k] !== index) continue;

            if (k === target) return true;

            seen.add(k);
            queue.push([col, row]);
        }
    }

    return false;
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

// Puts write(indent) in place of the [...] that follows "name:" in block.
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
