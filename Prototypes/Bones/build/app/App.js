import EveryFrame from "./EveryFrame.js";
import Events from "./NativeEvents.js";
import Page from "./Page.js";
import Selection from "./Selection.js";
import Snaps from "./Snaps.js";
import SVG from "./Svg.js";
import ToolPicker from "./ToolPicker.js";
import BoneTool from "./tools/BoneTool.js";
import MoveTool from "./tools/MoveTool.js";
import FreehandTool from "./tools/FreehandTool.js";
import CombTool from "./tools/CombTool.js";
import PullableTool from "./tools/PullableTool.js";
import YodaTool from "./tools/YodaTool.js";
const events = new Events();
const svg = new SVG();
const page = new Page(svg);
const snaps = new Snaps(page);
const selection = new Selection(page, snaps);
const tools = [BoneTool, MoveTool, YodaTool, FreehandTool, CombTool, PullableTool];
const toolPicker = new ToolPicker(tools.map((t, i) => new t(svg, 30, 30 + 50 * i, page)));
let bone = void 0;
EveryFrame((dt, time) => {
  SVG.clearNow();
  toolPicker.update(events);
  toolPicker.selected?.update(events);
  selection.update(events);
  events.clear();
  toolPicker.selected?.render(svg);
  snaps.render(svg);
  page.render(svg);
});