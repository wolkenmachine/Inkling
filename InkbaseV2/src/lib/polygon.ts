import ClipperShape from '@doodle3d/clipper-js';

import { Position } from './types';

export default function Polygon() {}

Polygon.area = (vertices: Array<Position>) => {
  const shape = new ClipperShape([vertices], true, true, true, true);
  return Math.abs(shape.totalArea());
};

Polygon.inset = (vertices: Array<Position>, amount: number) => {
  //vertices = vertices.map(pt => ({ X: Math.round(pt.x), Y: Math.round(pt.y) }));

  let shape = new ClipperShape([vertices], true, true, false, true);
  shape = shape.offset(-amount, {
    jointType: 'jtSquare',
    endType: 'etClosedPolygon',
  });

  const paths = shape.paths.map(path => {
    return path.map(pt => ({ x: pt.X, y: pt.Y }));
  });

  return paths[0] || [];
};
