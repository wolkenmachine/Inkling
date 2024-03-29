import { Events } from "../../engine";
import SVG from "../Svg";

export class Tool {
  button: any;
  isSelected = false;

  constructor(svg: SVG, public buttonX: number, public buttonY: number) {
    this.button = svg.addElement('circle', { cx: buttonX, cy: buttonY, r: 20 });
    this.refreshButton();
  }

  onSelected() {
    if (this.isSelected) {
      this.onAction();
    } else {
      this.isSelected = true;
      this.refreshButton();
    }
  }

  onAction() {
    // no op by default, but can be overridden by subclass
  }

  onDeselected() {
    this.isSelected = false;
    this.refreshButton();
  }

  update(_events: Events) {
    // no op by default, but can be overridden by subclass
  }

  render(_svg: SVG) {
    // no op by default, but can be overridden by subclass
  }

  private refreshButton() {
    this.button.setAttribute('fill', this.isSelected ? 'black' : 'lightgrey');
  }
}