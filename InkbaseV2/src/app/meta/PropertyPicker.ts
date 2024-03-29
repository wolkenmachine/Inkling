import Token from './Token';
import SVG from '../Svg';
import { Position } from '../../lib/types';
import { WirePort } from './Wire';
import * as constraints from '../constraints';
import Vec from '../../lib/vec';
import {
  MetaStruct,
  MetaLabel,
  MetaNumber,
  MetaConnection,
  MetaNumberConnection,
} from './MetaSemantics';
import { generateId } from '../../lib/helpers';
import { GameObject } from '../GameObject';

const TAB_SIZE = 5;

function PropertyPickerPath(pos: Position, w: number, h: number) {
  return `
    M ${pos.x + TAB_SIZE} ${pos.y}
    L ${pos.x + w} ${pos.y}
    L ${pos.x + w} ${pos.y + h}
    L ${pos.x + TAB_SIZE} ${pos.y + h}
    L ${pos.x} ${pos.y + h / 2}
    L ${pos.x + TAB_SIZE} ${pos.y}
  `;
}

export default class PropertyPicker extends Token {
  readonly id = generateId();

  private lastRenderedValue = '';

  protected readonly boxElement = SVG.add('path', SVG.metaElm, {
    d: PropertyPickerPath(this.position, this.width, this.height),
    class: 'property-picker-box',
  });

  protected readonly textElement = SVG.add('text', SVG.metaElm, {
    x: this.position.x + 5 + TAB_SIZE,
    y: this.position.y + 21,
    class: 'property-picker-text',
  });

  readonly inputVariable = new MetaStruct([]);
  readonly inputPort = this.adopt(
    new WirePort(this.position, this.inputVariable)
  );

  readonly outputVariable = new MetaNumber(constraints.variable());
  readonly wirePort = this.adopt(
    new WirePort(this.position, this.outputVariable)
  );

  // Alias this so we conform to TokenWithVariable

  private property: MetaLabel | null = null;

  internalConnection: MetaConnection | null = null;

  isPrimary(): boolean {
    return true;
  }

  getVariable(): constraints.Variable {
    return this.outputVariable.variable;
  }

  render() {
    // getComputedTextLength() is slow, so we're gonna do some dirty checking here
    const content = this.property?.display as string;
    if (content !== this.lastRenderedValue) {
      this.lastRenderedValue = content;
      SVG.update(this.textElement, { content });
      this.width = this.textElement.getComputedTextLength() + 10 + TAB_SIZE;
    }

    SVG.update(this.boxElement, {
      d: PropertyPickerPath(this.position, this.width, this.height),
      'is-embedded': this.embedded,
    });

    SVG.update(this.textElement, {
      x: this.position.x + 5 + TAB_SIZE,
      y: this.position.y + 21,
    });

    this.inputPort.position = Vec.add(this.position, Vec(0, this.height / 2));
    this.wirePort.position = this.midPoint();
  }

  setProperty(newValue: MetaLabel) {
    this.property = newValue;
    this.update();
  }

  update() {
    if (!this.property) {
      return;
    }

    this.internalConnection = new MetaNumberConnection(
      this.property,
      this.outputVariable
    );
  }

  remove() {
    this.boxElement.remove();
    this.textElement.remove();
    super.remove();
  }
}

export const aPropertyPicker = (gameObj: GameObject) =>
  gameObj instanceof PropertyPicker ? gameObj : null;
