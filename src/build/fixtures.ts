import { fixtures } from '../data/apartment';
import type { BuildContext } from './context';

export function buildFixtures(ctx: BuildContext) {
  for (const f of fixtures) {
    ctx.box(f.key, f, f.z0, f.z1, {
      parent: f.ceiling ? ctx.ceilings : undefined,
      pickable: f.pickable,
      rounded: f.rounded,
    });
    if (f.collide ?? f.z0 < 1.0) ctx.obstacles.push(f);
  }
}
