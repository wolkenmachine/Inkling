import SVG, { generatePathFromPoints, updateSvgElement } from '../Svg';
import generateId from '../generateId';
import { PositionWithPressure } from '../../lib/types';

export const strokeSvgProperties = {
  stroke: 'rgba(0, 0, 0, .5)',
  fill: 'none',
  'stroke-width': 2,
};

export default class FreehandStroke {
  readonly id = generateId();
  private readonly element: SVGElement;
  private needsRerender = true;
  private selected = false;

  constructor(
    svg: SVG,
    public points: Array<PositionWithPressure>
  ) {
    // Store normalised point data based on control points
    this.element = svg.addElement('path', {
      d: '',
      ...strokeSvgProperties,
    });
  }

  updatePath(newPoints: Array<PositionWithPressure>) {
    this.points = newPoints;
    this.needsRerender = true;
  }

  select() {
    this.selected = true;
    this.needsRerender = true;
  }

  deselect() {
    this.selected = false;
    this.needsRerender = true;
  }

  render() {
    if (!this.needsRerender) {
      return;
    }

    const path = generatePathFromPoints(this.points);
    updateSvgElement(this.element, {
      d: path,
      stroke: this.selected ? 'rgba(255, 0, 0, .5)' : 'rgba(0, 0, 0, .5)',
    });

    this.needsRerender = false;
  }
}
