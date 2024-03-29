import Events from './NativeEvents';
import Page from './Page';
import Snaps from './Snaps';
import Selection from './Selection';
import FreehandSelection from './FreehandSelection';
import ToolPicker from './ToolPicker';
import FreehandTool from './tools/FreehandTool';
import FormalTool from './tools/FormalTool';
import ColorTool from './tools/ColorTool';
import Tool from './tools/Tool';
import ConstraintTool from './tools/ConstraintTool';
import SVG from './Svg';
import Handle from './strokes/Handle';
import Stroke from './strokes/Stroke';
import * as constraints from './constraints';
import { onEveryFrame } from '../lib/helpers';
import FormulaTool from './tools/FormulaTool';
import Formula from './strokes/Formula';
import FormulaSelection from './FormulaSelection';
import MetaTool from './tools/MetaTool';

const events = new Events();
const page = new Page({ strokeAnalyzer: false });
const snaps = new Snaps(page, { handleSnaps: true, alignmentSnaps: false });

const selection = new Selection(page, snaps);
const freehandSelection = new FreehandSelection(page);
const formulaSelection = new FormulaSelection(page);

const toolPicker = new ToolPicker([
  new FreehandTool('FREE', 30, 30, page),
  new FormalTool('FORM', 30, 80, page, snaps),
  new ColorTool('COLOR', 30, 130, page),
  new Tool('🧠', 30, 180, page, Stroke),
  new ConstraintTool('CONST', 30, 230, page, {
    vertical: true,
    horizontal: true,
    length: true,
    angle: true,
  }),
  new FormulaTool('1+2', 30, 280, page),
  new MetaTool('META', 30, 330, page)
]);

onEveryFrame((dt, time) => {
  SVG.clearNow();
  constraints.now.clear();

  // handle events
  toolPicker.update(events);
  
  toolPicker.selected?.update(events);

  
  


  selection.update(events);
  freehandSelection.update(events);
  formulaSelection.update(events);
  events.clear();

  constraints.solve(selection);

  // render everything
  toolPicker.selected?.render(dt, time);
  snaps.render();
  page.render(dt, time);
  for (const handle of Handle.all) {
    handle.render();
  }

});

