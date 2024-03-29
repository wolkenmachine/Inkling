import Token from './Token';
import { WirePort } from './Wire';
import { MetaNumber } from './MetaSemantics';
import SVG from '../Svg';
import { Variable } from '../constraints';
import * as constraints from '../constraints';
import * as ohm from 'ohm-js';
import { GameObject } from '../GameObject';
import { generateId } from '../../lib/helpers';
import VarMover from '../VarMover';

export default class NumberToken extends Token {
  readonly id = generateId();

  private lastRenderedValue = '';
  private lastRenderedEditing = false;
  editValue = '';

  // Rendering stuff
  protected readonly elm = SVG.add('g', SVG.metaElm, { class: 'number-token' });

  protected readonly boxElm = SVG.add('rect', this.elm, {
    class: 'token-box',
    height: this.height,
  });

  protected readonly wholeElm = SVG.add('text', this.elm, {
    class: 'token-text',
  });

  protected readonly fracElm = SVG.add('text', this.elm, {
    class: 'token-frac-text',
  });

  protected digitElems: Array<SVGElement> = [];

  // Meta stuff things
  readonly variable: Variable;
  wirePort: WirePort;

  constructor(value?: number, source?: ohm.Interval);
  constructor(variable: Variable, source?: ohm.Interval);
  constructor(arg: number | Variable = 0, source?: ohm.Interval) {
    super(source);
    if (arg instanceof Variable) {
      this.variable = arg;
    } else {
      this.variable = constraints.variable(arg, {
        object: this,
        property: 'number-token-value',
      });
    }
    this.wirePort = this.adopt(
      new WirePort(this.position, new MetaNumber(this.variable))
    );
  }

  isPrimary() {
    return true;
  }

  addChar(char: string) {
    this.editValue += char;
  }

  updateCharAt(index: number, char: string) {
    const array = this.editValue.split('');
    array.splice(index, 1, char);
    this.editValue = array.join('');
  }

  edit() {
    this.editValue = this.variable.value.toFixed(0);
  }

  close() {
    let value = parseFloat(this.editValue);
    if (Number.isNaN(value)) {
      value = 0;
    }
    // VarMover.move(this.variable, value, 0.2);
    this.variable.value = value;
  }

  render(dt: number, t: number): void {
    SVG.update(this.elm, {
      transform: SVG.positionToTransform(this.position),
      'is-locked': this.getVariable().isLocked,
      'is-embedded': this.embedded,
      'is-editing': this.editing,
    });

    this.wirePort.position = this.midPoint();

    // getComputedTextLength() is slow, so we're gonna do some dirty checking here
    const newValue = this.editing
      ? this.editValue
      : this.variable.value.toFixed(2);

    if (
      newValue === this.lastRenderedValue &&
      this.lastRenderedEditing === this.editing
    ) {
      return;
    }

    this.lastRenderedEditing = this.editing;
    this.lastRenderedValue = newValue;

    // Cleanup digitElems
    for (const elem of this.digitElems) {
      elem.remove();
    }
    this.digitElems = [];

    // Render edit mode
    if (this.editing) {
      const chars = this.editValue.split('');

      // Update visuals
      for (const [i, char] of chars.entries()) {
        this.digitElems.push(
          SVG.add('text', this.elm, {
            class: 'token-text',
            content: char,
            style: `translate: ${5 + i * 27}px 24px;`,
          })
        );
      }
      this.width = chars.length * 27 - 3;
      SVG.update(this.boxElm, { width: this.width });
      SVG.update(this.wholeElm, { visibility: 'hidden' });
      SVG.update(this.fracElm, { visibility: 'hidden' });
    } else {
      this.lastRenderedValue = newValue;

      const [whole, frac] = newValue.split('.');

      SVG.update(this.wholeElm, { content: whole, visibility: 'visible' });
      SVG.update(this.fracElm, { content: frac, visibility: 'visible' });

      const wholeWidth = this.wholeElm.getComputedTextLength();
      const fracWidth = this.fracElm.getComputedTextLength();

      this.width = 5 + wholeWidth + 2 + fracWidth + 5;

      SVG.update(this.boxElm, { width: this.width });
      SVG.update(this.fracElm, { dx: wholeWidth + 2 });
    }

    for (const child of this.children) {
      child.render(dt, t);
    }
  }

  getVariable() {
    return this.variable;
  }

  onTap() {
    this.getVariable().toggleLock();
  }

  remove() {
    this.elm.remove();
    super.remove();
  }
}

export const aNumberToken = (gameObj: GameObject) =>
  gameObj instanceof NumberToken ? gameObj : null;
