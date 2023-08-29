import ClipperShape from '@doodle3d/clipper-js';

import FreehandStroke from '../strokes/FreehandStroke';
import Vec from '../../lib/vec';

export function computeDensity(stroke: FreehandStroke): number {
  let shape = new ClipperShape([stroke.points], true, true, false, true);
  shape = shape.offset(10, {
    jointType: 'jtSquare',
    endType: 'etOpenSquare',
    miterLimit: 2.0,
    roundPrecision: 0.25,
  });

  const area = shape.totalArea();
  const perimeter = shape.totalPerimeter();

  return polsbyPopperScore(area, perimeter);
}

function polsbyPopperScore(area: number, perimeter: number): number {
  return (4 * Math.PI * area) / perimeter ** 2;
}
