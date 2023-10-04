import { GameObject } from '../GameObject';
import { Position, PositionWithPressure } from '../../lib/types';
import COLORS from './Colors';
import SVG from '../Svg';
import Stroke, { aStroke } from '../strokes/Stroke';
import Vec from '../../lib/vec';
import Rect from '../../lib/rect';

import WritingRecognizer from '../recognizers/WritingRecognizer';
import FormulaParser from './FormulaParser';

const PADDING = 2;

const writingRecognizer = new WritingRecognizer();


export default class FormulaEditor extends GameObject {
  width = 200;
  height = 44;
  position: Position = { x: 100, y: 100 };

  formulaParser: FormulaParser | null = null;

  active: boolean = false;

  // SVG
  protected readonly svgBackgroundElement = SVG.add('rect', {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    fill: COLORS.GREY_LIGHT,
    visibility: "hidden"
  })

  protected readonly svgCellElements: Array<SVGElement> = [];
  
  constructor(){
    super();
  }

  isPositionNearToggle(){
    return false;
  }

  isActive(){
    return this.active;
  }

  activateFromFormula(){

  }

  activateFromPosition(position: Position){
    this.position = position;
    this.adopt(new FormulaEditorCell());
    this.adopt(new FormulaEditorCell());
    this.adopt(new FormulaEditorCell());
    this.active = true;
  }

  deactivate(){
    for(const child of this.children) {
      child.remove();
    }

    this.active = false;
  }

  captureStroke(stroke: Stroke){
    for(const cell of this.findAll({what: aFormulaEditorCell})) {
      if(cell.captureStroke(stroke)) {
        this.recognizeStrokes(cell);
        return;
      }
    }
  }

  // Attempt to regcognize strokes on all the cells except the most recent one
  // (The user may be still want to add more strokes on that one)
  recognizeStrokes(exceptCell: FormulaEditorCell){
    for(const cell of this.findAll({what: aFormulaEditorCell})) {
      if(cell != exceptCell) {
        cell.recognizeStrokes();
      }
    }
    this.refresh();
  }

  refresh(){
    this.ensureEmptySpace();
    //TODO: this is where we potentially do syntax highlighting
    // But we've punted on that for now.

    // If the last character is an equals sign, we parse and close the editor
    const lastChar = this.lastCharacter();
    if(lastChar?.stringValue == "=") {
      this.parseFormulaAndClose();
    }
  }

  lastCharacter(){
    const cells = this.findAll({what: aFormulaEditorCell});

    for(let i = cells.length-1; i>=0; i--) {
      if(cells[i].stringValue != "") {
        return cells[i];
      }
    }
  }

  ensureEmptySpace(){
    // make sure there are at least two empty cells at the end
    const cells = this.findAll({what: aFormulaEditorCell});
    for(let i = 1; i<3; i++) {
      if(cells[cells.length-i].stringValue != "") {
        this.adopt(new FormulaEditorCell());
      }
    }
  }

  getAsString(){
    const cells = this.findAll({what: aFormulaEditorCell});
    let stringValue = cells.reduce((acc, cell)=>{return acc+cell.stringValue}, "")
    return stringValue.slice(0, -1)
  }

  parseFormulaAndClose(){
    // Find the formula parser
    let string = this.getAsString();
    let result = this.formulaParser!.parse(string, this.position);
    this.deactivate();
  }

  render(dt: number, t: number): void {
    // Layout cells
    let offset = Vec.add(this.position, Vec(PADDING, PADDING));
    for(const cell of this.findAll({what: aFormulaEditorCell})) {
      cell.position = offset;
      offset = Vec.add(offset, Vec(cell.width+PADDING, 0));
      cell.render(dt, t);
    }

    this.width = offset.x - this.position.x;

    // Update background rect
    SVG.update(this.svgBackgroundElement, {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
      visibility: this.active? "visible": "hidden"
    })
  }

  addGesture(name: string) {
    const cells = this.findAll({what: aFormulaEditorCell});
    const lastCell = cells[cells.length-3];
    
    writingRecognizer.addGesture(name, lastCell.strokeData);
  }

  printGestures(){
    writingRecognizer.printGestures();
  }
}

class FormulaEditorCell extends GameObject {
  width = 30;
  height = 40;
  position: Position = { x: 100, y: 100 };

  stringValue = "";

  timer: number | null = null;

  // Remember stroke data so we can add it to the library if we want
  strokeData: PositionWithPressure[][] = [];

  protected readonly svgCell = SVG.add('rect', {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    fill: COLORS.WHITE
  })

  protected readonly textElement = SVG.add('text', {
    x: this.position.x + 5,
    y: this.position.y + 30,
    fill: COLORS.GREY_DARK,
    'font-size': '30px',
  });

  render(dt: number, t: number) {
    if(this.timer != null) {
      this.timer -= dt;
      if(this.timer < 0) {
        this.recognizeStrokes();
        (this.parent! as FormulaEditor).refresh();
        this.timer = null;
      }
    }

    SVG.update(this.svgCell, {
      x: this.position.x,
      y: this.position.y,
    });

    SVG.update(this.textElement, {
      x: this.position.x + 5,
      y: this.position.y + 30,
    });

    this.textElement.textContent = this.stringValue;
  }

  captureStroke(stroke: Stroke): boolean {
    if(stroke.overlapsRect(Rect(this.position, this.width, this.height))) {
      this.adopt(stroke);
      this.timer = 0.5;
      return true;
    }
    return false;
  }

  recognizeStrokes(){
    const strokes = this.findAll({what: aStroke}).map(s=>s.points);
    if(strokes.length == 0) return;
    
    const result = writingRecognizer.recognize(strokes);
    this.stringValue = result.Name;
    
    // Remember stroke data if we want to add it to the library
    this.strokeData = strokes;

    // Clean up strokes that have been recognized
    this.children.forEach(child=>{
      child.remove();
    })
  }

  remove(): void {
    super.remove();
    this.svgCell.remove();
    this.textElement.remove();
  }
}

export const aFormulaEditorCell = (gameObj: GameObject) =>
  gameObj instanceof FormulaEditorCell ? gameObj : null;
