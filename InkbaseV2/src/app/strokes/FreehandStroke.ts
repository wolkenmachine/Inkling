import { Position, PositionWithPressure } from '../../lib/types';
import { generateId } from '../../lib/helpers';
import StrokeGroup from './StrokeGroup';
import Vec from '../../lib/vec';
import Stroke from './Stroke';
import SVG from '../Svg';

export default class FreehandStroke extends Stroke {
  readonly id = generateId();
  private selected = false;
  public group: StrokeGroup | null = null;

  lengths: Array<number> = [];

  constructor(points: PositionWithPressure[]) {
    super(points);
    this.element = SVG.add('polyline', {
      fill: 'none',
      stroke: 'rgba(0, 0, 0, .5)',
      'stroke-width': 2,
    });
  }

  updatePath(newPoints: Array<PositionWithPressure>) {
    this.points = newPoints;
  }

  select() {
    this.selected = true;
  }

  deselect() {
    this.selected = false;
  }

  render() {
    super.render();
    SVG.update(
      this.element,
      this.selected
        ? { stroke: 'rgba(255, 0, 0, .5)', 'stroke-width': 4 }
        : { stroke: 'rgba(0, 0, 0, .5)', 'stroke-width': 2 }
    );
  }

  getLocalDirection(index: number) {
    const a = this.points[Math.max(index - 10, 0)];
    const b = this.points[Math.min(index + 10, this.points.length - 1)];

    return Vec.normalize(Vec.sub(b, a));
  }

  getLength() {
    let len = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      const pointA = this.points[i];
      const pointB = this.points[i + 1];
      len += Vec.dist(pointA, pointB);
    }

    return len;
  }

  computeLengths() {
    const lengths = [];
    let length_accumulator = 0;
    lengths.push(length_accumulator);

    for (let i = 0; i < this.points.length - 1; i++) {
      const length = Vec.dist(this.points[i + 1], this.points[i]);
      length_accumulator += length;
      lengths.push(length_accumulator);
    }
    this.lengths = lengths;
  }

  getPointAtLength(length: number): PositionWithPressure {
    if (length <= 0) {
      return this.points[0];
    }

    if (length >= this.lengths[this.lengths.length - 1]) {
      return this.points[this.points.length - 1];
    }

    const index = this.lengths.findIndex(l => l >= length);

    const start_length = this.lengths[index - 1];
    const end_length = this.lengths[index];

    const t = (length - start_length) / (end_length - start_length);

    return Vec.lerp(
      this.points[index - 1],
      this.points[index],
      t
    ) as PositionWithPressure;
  }

  getResampledPoints(step = 1): Array<PositionWithPressure> {
    this.computeLengths();
    const resampledPoints = [];
    const totalLength = this.lengths[this.lengths.length - 1];

    let length = 0;
    while (length <= totalLength) {
      const point = this.getPointAtLength(length);
      resampledPoints.push(point);
      length += step;
    }

    const point = this.getPointAtLength(totalLength);
    resampledPoints.push(point);
    return resampledPoints;
  }

  minDistanceFrom(pos: Position) {
    let minDistance = Infinity;
    for (const point of this.points) {
      minDistance = Math.min(minDistance, Vec.dist(point, pos));
    }
    return minDistance;
  }
}
