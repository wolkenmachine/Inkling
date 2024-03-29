import Point from "./Point";
import LineStroke from "./LineStroke";
import Vec from "../lib/vec";
import Line from "../lib/line";
import Arc from "../lib/arc";
import ArcStroke from "./ArcStroke";

export default class Page {
    constructor(){
        this.points = []
        this.strokes = []
    }

    // FIND ELEMENTS
    find_point_near(pos, dist = 20) {
        return this.points.find(point => Vec.dist(point.pos, pos) < dist);
    }

    find_stroke_near(pos) {
        return this.strokes.find(stroke=> {
            const dist = Line.distToPoint(Line(stroke.a.pos, stroke.b.pos), pos);
            return dist < 20;
        })
    }

    // ADD NEW
    add_line(line) {
        let a = new Point(line.a)
        let b = new Point(line.b)

        this.points.push(a)
        this.points.push(b)
        this.strokes.push(new LineStroke(a, b))
    }

    add_arc(arc) {
        let {start, end} = Arc.points(arc)

        console.log(start, end);
        let a = new Point(start)
        let b = new Point(end)
        let c = new Point(arc.center)
        this.points.push(a)
        this.points.push(b)
        this.points.push(c)

        this.strokes.push(new ArcStroke(a, b, c))
    }

    render(ctx){

        if(!this.repeater) {
            ctx.beginPath();
            ctx.ellipse(30, 30, 20, 20, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        

        this.strokes.forEach(stroke=>{
            stroke.render(ctx)
        })

        this.points.forEach(point=>{
            point.render(ctx)
        })
    }
}