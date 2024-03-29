import Vec from "./lib/vec";
import engine from "./engine";
import Canvas from "./canvas";

import Draw from "./draw"

let draw = new Draw()

let canvas = new Canvas(document.body, ctx=>{
    ctx.clearRect(0,0, window.innerWidth, window.innerHeight);
    draw.render(ctx)

})

engine((events)=>{
  draw.update(events)
  canvas.render()
})