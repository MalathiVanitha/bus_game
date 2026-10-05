# New boosters — storyboard

Proposed boosters to add next to Remove (unlocks at level 5) and Hint (level 3).

What shaped these:

- The only way to lose a level is running out of time. The fail card offers "+30 seconds" for watching a video (`objects/cta.js`).
- Either end of a convoy can be dragged (`grabAt` in `objects/game-play.js`), so a "turn around" booster would do nothing.
- Cones and planters arrive at level 4 and walls at level 7, but nothing yet lets the player deal with them.

Suggested unlock order:

| Level | Booster |
|---|---|
| 3 | Hint (existing) |
| 5 | Remove (existing) |
| 8 | Crane |
| 12 | Freeze |
| 20 | Ghost |

Build order: Freeze first (the smallest change), then Crane, then Ghost (the riskiest).

---

## 1. Freeze ❄️ — stops the clock

Icon: a stopwatch with a snowflake.

| # | Panel | What happens |
|---|---|---|
| 1 | Tap | The button pushes in. The timer pill at the top left flashes white. |
| 2 | Ice over | Frost creeps in from the pill's corners and the pill turns icy blue. The time stops and a small ❄ appears next to it. The grey board tiles take on a faint cool tint. |
| 3 | Play | The player drives as normal. A thin ring around the pill shrinks over **15 s** to show the freeze left. |
| 4 | Thaw | In the last 2 s the frost flickers. The ice cracks off in shards (`shatter.mp3`), the pill's colour returns with a small bounce, and the clock ticks again. |

**Rules**
- Using it again while frozen adds another 15 s.
- It's greyed out in the last second of a level, so it can't be wasted.

**Code**
- Add a `frozenFor` counter in `GamePlay.update()` that skips `this.timeLeft -= …` while it's above zero.
- Add an `ice` state to `Timer` for the frost look and the countdown ring.

---

## 2. Crane 🏗️ — clears one obstacle

Icon: a crane hook.

| # | Panel | What happens |
|---|---|---|
| 1 | Tap | The button glows gold. The board dims a little and every cone, planter, pallet and wall cell gets a pulsing gold ring. It's the same "pick one" mode Remove uses. |
| 2 | Pick | The player taps an obstacle. A hook on a cable drops in from above the board, swings once and settles over it. |
| 3 | Lift | The hook grabs the obstacle, squashes it slightly, then pulls it up and off the top of the screen. The obstacle grows a little as it rises and its shadow shrinks on the tile. |
| 4 | Clear | The empty cell gets the board's existing lift flash. Paths through it open straight away, and an active Hint redraws its route. |

**Rules**
- It lifts one cone, planter or pallet, or **one cell** of a wall. Limiting it to one wall cell stops a single use from deleting a level's whole layout.
- Tapping empty space cancels and doesn't use up the booster.

**Code**
- Add a pick mode for obstacles, following the pattern of `pickConvoy`.
- Add `Board.removeObstacle(col, row)`: drop the obstacle's sprite with a lift-off animation, clear the cell from the path graph, and update the wall pieces next to it.

---

## 3. Ghost 👻 — one convoy drives through the others

Icon: a ghost.

| # | Panel | What happens |
|---|---|---|
| 1 | Tap | The button glows. Every convoy that can be grabbed gets a ring, the same as with Remove. |
| 2 | Pick | The chosen convoy turns about 50% see-through, gets a soft white glow, and bobs slightly as if floating. |
| 3 | Drive | The player drags it. It passes **through other convoys**, but still not through walls or obstacles. |
| 4 | Home / drop | The effect ends when it reaches its garage, or when the player lets go. If they let go while overlapping another convoy, it slides back to the nearest free cells. |

**Rules**
- It lasts for one drag.
- It's priced below Remove, because the player still has to drive the convoy home.

**Code**
- Cell reservation (`releaseCells`, `stepReserved`) assumes convoys never share a cell. A ghost convoy has to skip reserving cells and skip other convoys when its route is worked out.
- The slide back to free cells on release is the hardest part.

---

## Not recommended

- **Undo:** drags can already be reversed by hand, so it would only give time back, and Freeze does that better.
- **Shuffle:** every level is built to be solvable by driving the convoys home one at a time. Rearranging the board randomly would break that.
- **Auto-drive:** it's Hint plus Remove in one button and adds nothing new.

## Changes needed for any of these

- **One booster list.** The boosters are written out in three places:
  - `BOOSTERS` in `objects/levelScreen.js`
  - `BUTTONS` in `objects/boosterBar.js`
  - `UNLOCK_AT` in `objects/boosterUnlocks.js`

  Move them into one shared list before adding new ones.
- **Layout.** The booster bar and the level card's "Select boosters" row are laid out for exactly two buttons. Four should fit across the bottom of the screen; five would need a scrolling row or a second row.
- **Art.** Freeze, Crane and Ghost icons need adding to `assets/sheet/sheet.webp`.
- **Tutorial.** The first-time lesson in `objects/boosterTutorial.js` can be reused for each new booster.
- **Store.** Each booster needs a "Get more?" offer entry (title and noun) in `BOOSTERS`.
