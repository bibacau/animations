// Template registry. The director scores these against each musical unit
// (keywords, energy, requirements, novelty) -- add a template here and it joins the pool.
import { TvPortal } from './tvPortal.js';
import { Gravity } from './gravity.js';
import { Platforms } from './platforms.js';
import { ProductSlam } from './productSlam.js';
import { Staircase } from './staircase.js';
import { Elevator } from './elevator.js';
import { Tunnel } from './tunnel.js';
import { WasherVortex } from './washerVortex.js';
import { Domino } from './domino.js';
import { Slide } from './slide.js';
import { Finale } from './finale.js';
import { Kinetic } from './kinetic.js';

export const REGISTRY = [TvPortal, Gravity, Platforms, ProductSlam, Staircase, Elevator, Tunnel, WasherVortex, Domino, Slide, Finale, Kinetic];
