/*
 * Kott fittings (fixed, not draggable) — laid out after the owner's reference photo (a narrow walk-in closet): two
 * wall-to-wall shelves with storage boxes up top, a coat rail under them, a low shoe rack against the back wall
 * (three shelves, fewer than the photo, on request), a stick vacuum and a peg rail on the left wall and wire baskets on
 * the right wall. All sizes are E. The kott door (D3) swings out into the entry, so the whole inside can be used.
 *
 * Distances: `v` is measured from the door wall into the kott (0 = door wall, KOTT depth = back wall),
 * `u` from the left (west) wall; heights above the floor.
 */

export const kottFittings = {
  board: 0.018, // shelf and side-panel thickness
  shoeRack: {
    depth: 0.3,
    shelves: [0.04, 0.22, 0.4], // top of each shelf
    sideTop: 0.42,
  },
  upperShelves: {
    depth: 0.4,
    tops: [1.8, 2.22],
    boxH: 0.25,
    boxW: 0.35,
    boxD: 0.34,
  },
  rail: { v: 0.28, z: 1.7, r: 0.012 }, // v from the back wall
  coats: {
    width: 0.46, // shoulder width, across the rail
    thickness: 0.11,
    bottom: 0.92,
    top: 1.64,
    count: 5,
  },
  vacuum: { u: 0.07, v: 0.15, dockZ: 1.12 },
  pegRail: { v0: 0.14, v1: 0.44, z: 1.78, pegs: 3 },
  baskets: { v0: 0.07, v1: 0.37, depth: 0.12, height: 0.11, bottoms: [0.82, 1.08, 1.34], shelfTop: 1.6 },
};
