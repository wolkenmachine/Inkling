import { Position } from '../../lib/types';
import { generateId } from '../../lib/helpers';
import Vec from '../../lib/vec';
import SVG from '../Svg';
import Handle from './Handle';
import { GameObject } from '../GameObject';

export default class ArcSegment extends GameObject {
  readonly id = generateId();
  readonly a: Handle;
  readonly b: Handle;
  readonly c: Handle;

  private selected = false;
  private path = '';
  private readonly elements: { normal: SVGElement; selected: SVGElement };

  constructor(aPos: Position, bPos: Position, cPos: Position) {
    super();

    this.a = this.adopt(Handle.create('formal', aPos));
    this.b = this.adopt(Handle.create('formal', bPos));
    this.c = this.adopt(Handle.create('formal', cPos));

    this.updatePath();

    const attrs = { d: this.path, fill: 'none' };
    this.elements = {
      normal: SVG.add('path', {
        ...attrs,
        'stroke-width': 1,
        stroke: 'black',
      }),
      selected: SVG.add('path', {
        ...attrs,
        'stroke-width': 7,
        stroke: 'none',
      }),
    };
  }

  updatePath() {
    const radius = Vec.dist(this.a.position, this.c.position);
    const isLargeArc = 0; // more than 180
    const clockwise = 1; // clockwise or counterclockwise
    const xAxisRotation = 0;

    //           M   start_x              start_y            A   radius_x   radius_y  x-axis-rotation  more-than-180 clockwise    end_x                end_y
    this.path = `M ${this.a.position.x} ${this.a.position.y} A ${radius}  ${radius} ${xAxisRotation} ${isLargeArc} ${clockwise} ${this.b.position.x} ${this.b.position.y}`;
  }

  select() {
    this.selected = true;
  }

  deselect() {
    this.selected = false;
  }

  render(dt: number, t: number) {
    for (const child of this.children) {
      child.render(dt, t);
    }

    this.updatePath();
    const commonAttributes = { d: this.path };
    SVG.update(this.elements.normal, commonAttributes);
    SVG.update(this.elements.selected, {
      ...commonAttributes,
      stroke: this.selected ? 'rgba(180, 134, 255, 0.42)' : 'none',
    });
  }
}
