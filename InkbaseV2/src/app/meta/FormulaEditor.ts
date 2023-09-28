import { GameObject } from "../GameObject";
import { Position } from '../../lib/types';
import COLORS from './Colors';
import SVG from '../Svg';

import Formula, { OpToken } from "./Formula"
import Page from "../Page";
import Vec from "../../lib/vec";
import Stroke from "../strokes/Stroke";
import WritingRecognizer from "./WritingRecognizer";
import NumberToken from "./NumberToken";

const PADDING = 3;
const PADDING_BIG = 5;

export default class FormulaEditor extends GameObject {
  formula: WeakRef<Formula> | null = null;

  width: number = 90;
  height: number = 46;
  position: Position = {x: 100, y: 100};

  editWidth: number = 46;

  recognizer = new WritingRecognizer();

  // SVG Elements
  protected wrapperElement = SVG.add('rect', {
    x: this.position.x, y: this.position.y,
    width: this.height, height: this.height,
    rx: 3,
    fill: COLORS.GREY_BRIGHT,
    stroke: "rgba(0,0,0,0.2)",
    "stroke-width": 0.3,
    visibility: "hidden"
  });

  protected nextCharElement = SVG.add('rect', {
    x: this.position.x+this.width+PADDING, y: this.position.y,
    width: this.height, height: this.height,
    rx: 3,
    fill: COLORS.GREY_LIGHT,
    visibility: "hidden"
  });

  protected toggleElement = SVG.add('circle', {
    cx: this.position.x, cy: this.position.y,
    r: 5,
    fill: COLORS.BLUE,
    visibility: "hidden"
  });

  newFormula(){
    const f = new Formula();
    this.page.adopt(f);
    this.formula = new WeakRef(f);

    f.position = Vec.add(this.position, Vec(PADDING, PADDING));
  }

  captureStroke(stroke: WeakRef<Stroke>) {
    let f = this.formula?.deref();
    let s = stroke.deref();
    if(f != null && s != null) {
      const capturePosition = Vec.add(this.position, Vec(f.width + this.editWidth/2, 20))
      let distance = s.distanceToPoint(capturePosition)
      if(distance && distance < 20) {
        console.log("capture", s);
        let result = this.recognizer.recognize([s.points]);
        console.log(result);

        let char = result.Name;
        if(result.isNumeric) {
          let lastToken = f.lastToken();
          if(lastToken instanceof NumberToken) {
            lastToken.addChar(char);
          } else {
            f.addToken(new NumberToken(parseInt(char)));
          }
        } else {
          f.addToken(new OpToken(char));
        }
        
        s.remove();
      }
    }
  }

  render(dt: number, t: number): void {
    let f = this.formula?.deref();
    if(f != null) {

      let offsetWidth = this.editWidth + PADDING_BIG * 2+ PADDING * 6;
      if(this.formula != null) {
        this.position = f.position
        this.width = f.width +offsetWidth
      } else {
        this.width = offsetWidth;
      }

      // Update total wrapper
      SVG.update(this.wrapperElement, {
        x: this.position.x-PADDING_BIG, y: this.position.y-PADDING_BIG,
        width: this.width, height: this.height + PADDING_BIG*2,
        visibility: "visible"
      })

      // Char elements
      let position = Vec.add(this.position, Vec(f.width, 0))
      SVG.update(this.nextCharElement, {
        x: position.x+PADDING, y: this.position.y,
        width: this.editWidth,
        visibility: "visible"
      })
      
      // Toggle
      SVG.update(this.toggleElement, {
        cx: position.x+ this.editWidth + 4*PADDING, cy: this.position.y + this.height/2,
        visibility: "visible"
      })
    } else {
      SVG.update(this.nextCharElement, {visibility: "hidden"});
      SVG.update(this.toggleElement, {visibility: "hidden"});
      SVG.update(this.wrapperElement, {visibility: "hidden"});
    }
  }
}