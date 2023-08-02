var ot=class{constructor(){this.events=[],this.activePencil=null,this.activeFingers={}}did(t,s,i){return this.events.find(o=>o.type===t&&o.state===s&&(i==null||o.id===i))}didAll(t,s,i){return this.events.filter(o=>o.type===t&&o.state===s&&(i==null||o.id===i))}didLast(t,s,i){return this.events.findLast(o=>o.type===t&&o.state===s&&(i==null||o.id===i))}},I=new ot;window.nativeEvent=(e,t)=>{Object.entries(t).forEach(([s,i])=>{i.forEach(o=>{I.events.push({type:o.type==="pencil"?"pencil":"finger",state:e,id:s,position:{x:o.x,y:o.y},timestamp:o.timestamp}),o.type==="pencil"?I.activePencil=e!=="ended"?{x:o.x,y:o.y}:null:e!=="ended"?I.activeFingers[s]={x:o.x,y:o.y}:delete I.activeFingers[s]})})};var rt=null;function ht(){rt(I),I.events=[],window.requestAnimationFrame(ht)}function Y(e){rt=e,window.requestAnimationFrame(ht)}var Vt=Math.PI*2,lt=e=>Number.EPSILON>Math.abs(e);var at=(e,t)=>(p=1/t,Math.round(e*p)/p);var n=(e=0,t=0)=>({x:e,y:t}),h=n;n.clone=e=>n(e.x,e.y);n.fromRectXY=e=>n(e.x,e.y);n.fromRectWH=e=>n(e.w,e.h);n.fromRectRB=e=>n(e.x+e.w,e.y+e.h);n.of=e=>n(e,e);n.random=(e=1)=>n.Smul(e,n.complement(n.Smul(2,n(Math.random(),Math.random()))));n.toA=e=>[e.x,e.y];n.polar=(e,t)=>n(t*Math.cos(e),t*Math.sin(e));n.x=Object.freeze(n(1));n.y=Object.freeze(n(0,1));n.zero=Object.freeze(n());n.map=(e,t)=>n(e(t.x),e(t.y));n.map2=(e,t,s)=>n(e(t.x,s.x),e(t.y,s.y));n.reduce=(e,t)=>e(t.x,t.y);n.cross=(e,t)=>e.x*t.y-e.y*t.x;n.project=(e,t)=>n.mulS(t,n.dot(e,t)/n.len2(t));n.reject=(e,t)=>n.sub(e,n.project(e,t));n.scalarProjection=(e,t,s)=>{let i=n.sub(e,t),o=n.normalize(n.sub(s,t)),r=n.mulS(o,n.dot(i,o));return n.add(t,r)};n.add=(e,t)=>n(e.x+t.x,e.y+t.y);n.div=(e,t)=>n(e.x/t.x,e.y/t.y);n.mul=(e,t)=>n(e.x*t.x,e.y*t.y);n.sub=(e,t)=>n(e.x-t.x,e.y-t.y);n.addS=(e,t)=>n.add(e,n.of(t));n.divS=(e,t)=>n.div(e,n.of(t));n.mulS=(e,t)=>n.mul(e,n.of(t));n.subS=(e,t)=>n.sub(e,n.of(t));n.Sadd=(e,t)=>n.add(n.of(e),t);n.Sdiv=(e,t)=>n.div(n.of(e),t);n.Smul=(e,t)=>n.mul(n.of(e),t);n.Ssub=(e,t)=>n.sub(n.of(e),t);n.dist=(e,t)=>n.len(n.sub(e,t));n.dist2=(e,t)=>n.len2(n.sub(e,t));n.dot=(e,t)=>e.x*t.x+e.y*t.y;n.equal=(e,t)=>lt(n.dist2(e,t));n.len2=e=>n.dot(e,e);n.len=e=>Math.sqrt(n.dot(e,e));n.ceil=e=>n.map(Math.ceil,e);n.floor=e=>n.map(Math.floor,e);n.round=e=>n.map(Math.round,e);n.roundTo=(e,t)=>n.map2(at,e,n.of(t));n.complement=e=>n.Ssub(1,e);n.half=e=>n.divS(e,2);n.normalize=e=>n.divS(e,n.len(e));n.recip=e=>n.Sdiv(1,e);n.renormalize=(e,t,s,i,o)=>n.add(n.mul(n.div(n.sub(e,t),n.sub(s,t)),n.sub(o,i)),i);n.avg=(e,t)=>n.half(n.add(e,t));n.lerp=(e,t,s)=>n.add(e,n.Smul(s,n.sub(t,e)));n.max=(e,t)=>n.map2(Math.max,e,t);n.min=(e,t)=>n.map2(Math.min,e,t);n.abs=e=>n.map(Math.abs,e);n.invert=e=>n(-e.x,-e.y);n.invertX=e=>n(-e.x,e.y);n.invertY=e=>n(e.x,-e.y);n.rotate90CW=e=>n(e.y,-e.x);n.rotate90CCW=e=>n(-e.y,e.x);n.rotate=(e,t)=>n(e.x*Math.cos(t)-e.y*Math.sin(t),e.x*Math.sin(t)+e.y*Math.cos(t));n.rotateAround=(e,t,s)=>{let i=n.sub(e,t),o=n.rotate(i,s);return n.add(o,t)};n.angle=e=>Math.atan2(e.y,e.x);n.angleBetween=(e,t)=>{let s=n.dot(e,t),i=n.len(e),o=n.len(t);return Math.acos(s/(i*o))*180/Math.PI};n.angleBetweenClockwise=(e,t)=>{let s=n.dot(e,t),i=n.cross(e,t),r=Math.atan2(s,i)*(180/Math.PI);return r<0&&(r=360+r),r};n.update=(e,t)=>{e.x=t.x,e.y=t.y};var C=class{constructor(t){this.page=t,this.firstFinger=null,this.firstFingerMoved=null,this.secondFinger=null,this.secondFingerMoved=null,this.draggingMorph=null,this.draggingAngle=null}update(t){let s=t.did("finger","began");if(s)if(this.firstFinger)!this.secondFinger&&this.draggingMorph&&(this.secondFinger=s,this.draggingAngle=this.draggingMorph.angle);else{this.firstFinger=s;let i=this.page.findMorphPointNear(s.position);i&&(this.draggingMorph=i,this.draggingAngle=this.draggingMorph.angle),window.setTimeout(()=>{!this.firstFinger||this.draggingMorph||(!this.firstFingerMoved||h.dist(this.firstFinger.position,this.firstFingerMoved.position)<15)&&(console.log("Long Press"),this.draggingMorph=this.page.addMorphPoint(this.firstFinger.position))},500)}if(this.firstFinger){let i=t.didLast("finger","moved",this.firstFinger.id);i&&(this.firstFingerMoved=i,this.draggingMorph&&(this.draggingMorph.setPosition(i.position),this.page.updateMorphs())),t.did("finger","ended",this.firstFinger.id)&&(this.firstFinger=null,this.firstFingerMoved=null,this.draggingMorph=null)}if(this.firstFinger&&this.secondFinger&&this.firstFingerMoved&&this.draggingMorph){let i=t.didLast("finger","moved",this.secondFinger.id);if(i){this.secondFingerMoved=i;let o=h.angle(h.sub(this.secondFinger.position,this.firstFinger.position)),l=h.angle(h.sub(this.secondFingerMoved.position,this.firstFingerMoved.position))-o;this.draggingMorph.angle=this.draggingAngle+l,this.page.updateMorphs()}}this.secondFinger&&t.did("finger","ended",this.secondFinger.id)&&(this.secondFinger=null,this.secondFingerMoved=null)}},dt=C;var It=0;function P(){return It++}var G=class{constructor(t,s,i,o){this.id=P(),this.a=s,this.b=i,this.c=o,this.dirty=!0,this.selected=!1,this.radius=h.dist(this.a.position,this.c.position),this.isLargeArc=0,this.clockwise=1,this.xAxisRotation=0,this.updatePath();let r={d:this.path,"stroke-width":1,stroke:"black",fill:"none"};this.elements={normal:t.addElement("path",r),selected:t.addElement("path",{...r,"stroke-width":7,stroke:"none"})}}updatePath(){this.path=`M ${this.a.position.x} ${this.a.position.y} A ${this.radius}  ${this.radius} ${this.xAxisRotation} ${this.isLargeArc} ${this.clockwise} ${this.b.position.x} ${this.b.position.y}`}select(){this.dirty=!0,this.selected=!0}deselect(){this.dirty=!0,this.selected=!1}render(t){if(this.dirty||this.a.dirty||this.b.dirty||this.c.dirty){this.radius=h.dist(this.a.position,this.c.position),this.isLargeArc=0,this.clockwise=1,this.xAxisRotation=0,this.updatePath();let s={d:this.path};t.updateElement(this.elements.normal,s),t.updateElement(this.elements.selected,{...s,stroke:this.selected?"rgba(180, 134, 255, 0.42)":"none"}),this.dirty=!1}}},ct=G;var z=class{constructor(t,s,i){this.id=P(),this.a=s,this.b=i,this.dirty=!0,this.selected=!1;let o={x1:this.a.position.x,y1:this.a.position.y,x2:this.b.position.x,y2:this.b.position.y,"stroke-width":1,stroke:"black"};this.elements={normal:t.addElement("line",o),selected:t.addElement("line",{...o,"stroke-width":7,stroke:"none"})}}select(){this.dirty=!0,this.selected=!0}deselect(){this.dirty=!0,this.selected=!1}render(t){if(this.dirty||this.a.dirty||this.b.dirty){let s={x1:this.a.position.x,y1:this.a.position.y,x2:this.b.position.x,y2:this.b.position.y};t.updateElement(this.elements.normal,s),t.updateElement(this.elements.selected,{...s,stroke:this.selected?"rgba(180, 134, 255, 0.42)":"none"}),this.dirty=!1}}},pt=z;var U=class{constructor(t=document.body){this.root=document.createElementNS("http://www.w3.org/2000/svg","svg"),this.updateElement(this.root,{xmlns:"http://www.w3.org/2000/svg",width:window.innerWidth,height:window.innerHeight}),t.appendChild(this.root)}addElement(t,s){let i=document.createElementNS("http://www.w3.org/2000/svg",t);return this.updateElement(i,s),this.root.appendChild(i),i}updateElement(t,s){Object.entries(s).forEach(([i,o])=>t.setAttribute(i,o))}},ft=U;function A(e){return e.map((s,i)=>`${i===0?"M":"L"} ${s.x} ${s.y}`).join(" ")}var q=class{constructor(t,s){this.id=P(),this.points=s,this.pointsMorphed=s,this.dirty=!0,this.selected=!1;let i=A(this.pointsMorphed);this.elements={normal:t.addElement("path",{d:i,stroke:"darkgrey","stroke-width":2,fill:"none"})}}applyMorphs(t){this.pointsMorphed=this.points.map(s=>{let i=t.map(a=>{let d=h.dist(a.firstPosition,s);return 1/Math.pow(d,2)}),o=i.reduce((a,d)=>a+d,0);i=i.map(a=>a/o);let l=t.map((a,d)=>{let c=i[d],g=h.mulS(a.morphVector,c),u=h.rotateAround(s,a.firstPosition,a.angle*c),f=h.sub(u,s);return h.add(g,f)}).reduce((a,d)=>h.add(a,d),h(0,0));return h.add(s,l)}),this.dirty=!0}move(t){this.dirty=!0,this.position=t}select(){this.dirty=!0,this.selected=!0}deselect(){this.dirty=!0,this.selected=!1}render(t){if(!this.dirty)return;let s=A(this.pointsMorphed);t.updateElement(this.elements.normal,{d:s}),this.dirty=!1}},ut=q;var N=class{constructor(t,s){this.id=P(),this.position=s,this.dirty=!0,this.selected=!1,this.elements={normal:t.addElement("circle",{cx:0,cy:0,r:3,fill:"black"}),selected:t.addElement("circle",{cx:0,cy:0,r:7,fill:"none"})}}setPosition(t){this.dirty=!0,this.position=t}select(){this.dirty=!0,this.selected=!0}deselect(){this.dirty=!0,this.selected=!1}remove(){this.elements.normal.remove(),this.elements.selected.remove()}render(t){this.dirty&&(t.updateElement(this.elements.normal,{transform:`translate(${this.position.x} ${this.position.y})`}),t.updateElement(this.elements.selected,{transform:`translate(${this.position.x} ${this.position.y})`,fill:this.selected?"rgba(180, 134, 255, 0.42)":"none"}),this.dirty=!1)}},gt=N;var B=class{constructor(t,s){this.id=P(),this.firstPosition=s,this.position=s,this.morphVector=h(0,0),this.angle=0,this.dirty=!0,this.selected=!1,this.elements={normal:t.addElement("circle",{cx:0,cy:0,r:30,fill:"none",stroke:"grey"}),rotationLine:t.addElement("line",{x1:0,y1:0,x2:0,y2:0,stroke:"grey"})}}setPosition(t){this.dirty=!0,this.position=t,this.morphVector=h.sub(this.position,this.firstPosition)}select(){this.dirty=!0,this.selected=!0}deselect(){this.dirty=!0,this.selected=!1}remove(){this.elements.normal.remove()}render(t){if(!this.dirty)return;t.updateElement(this.elements.normal,{transform:`translate(${this.position.x} ${this.position.y})`});let s=h.add(this.position,h.polar(this.angle,60));t.updateElement(this.elements.rotationLine,{x1:this.position.x,y1:this.position.y,x2:s.x,y2:s.y}),this.dirty=!1}},mt=B;var H=class{constructor(){this.strokes=[],this.connectivity=[],this.elements=[],this.dirty=!1}addStroke(t){this.strokes.push(t),this.computeConnectivityGraph(),this.dirty=!0}computeConnectivityGraph(){this.connectivity=[];for(let t=0;t<this.strokes.length;t++){let s=this.strokes[t],i=[s.points[0],s.points[s.points.length-1]];for(let o=0;o<this.strokes.length;o++){if(t==o)continue;let r=this.strokes[o];for(let l=0;l<i.length;l++){let a=i[l],d=Dt(a,r.points);console.log(d),d.dist<20&&this.connectivity.push({a:t,b:o,indexA:l==0?0:s.points.length-1,indexB:d.index})}}}console.log(this.connectivity)}render(t){!this.dirty||(this.elements.forEach(s=>s.remove()),this.elements=this.connectivity.map(s=>{let i=this.strokes[s.a].points[s.indexA],o=this.strokes[s.b].points[s.indexB];return t.addElement("line",{x1:i.x,y1:i.y,x2:o.x,y2:o.y,stroke:"pink","stroke-width":"4"})}),this.dirty=!1)}},yt=H;function Dt(e,t){let s=h.dist(e,t[0]),i=0;for(let o=0;o<t.length;o++){let r=h.dist(e,t[o]);r<s&&(s=r,i=o)}return{dist:s,index:i}}var _=class{constructor(t){this.svg=t,this.points=[],this.morphPoints=[],this.lineSegments=[],this.freehandStrokes=[],this.morphGroup=new yt}addPoint(t){let s=new gt(this.svg,t);return this.points.push(s),s}addLineSegment(t,s){let i=new pt(this.svg,t,s);return this.lineSegments.push(i),i}addArcSegment(t,s,i){let o=new ct(this.svg,t,s,i);return this.lineSegments.push(o),o}addMorphPoint(t){let s=new mt(this.svg,t);return this.morphPoints.push(s),s}addFreehandStroke(t){let s=new ut(this.svg,t);return this.freehandStrokes.push(s),this.morphGroup.addStroke(s),s}findPointNear(t,s=20){let i=null,o=s;for(let r of this.points){let l=h.dist(r.position,t);l<o&&(o=l,i=r)}return i}findMorphPointNear(t,s=20){let i=null,o=s;for(let r of this.morphPoints){let l=h.dist(r.position,t);l<o&&(o=l,i=r)}return i}mergePoint(t){let s=new Set(this.points.filter(i=>i!==t&&h.dist(i.position,t.position)===0));if(s.size!==0){for(let i of this.lineSegments)s.has(i.a)&&(i.a=t),s.has(i.b)&&(i.b=t),s.has(i.c)&&(i.c=t);for(let i of s)i.remove();this.points=this.points.filter(i=>!s.has(i))}}pointsReachableFrom(t){let s=new Set(t);for(;;){let i=s.size;for(let o of this.lineSegments)s.has(o.a)&&s.add(o.b),s.has(o.b)&&s.add(o.a);if(s.size===i)break}return s}updateMorphs(){if(!(this.morphPoints.length<2)){for(let t=0;t<this.morphPoints.length;t++){let s=this.morphPoints[t],i=0,o=0;if(t<this.morphPoints.length-1){let r=h.angle(h.sub(this.morphPoints[t+1].firstPosition,this.morphPoints[t].firstPosition));i+=h.angle(h.sub(this.morphPoints[t+1].position,this.morphPoints[t].position))-r,o+=1}if(t>0){let r=h.angle(h.sub(this.morphPoints[t-1].firstPosition,this.morphPoints[t].firstPosition));i+=h.angle(h.sub(this.morphPoints[t-1].position,this.morphPoints[t].position))-r,o+=1}o==2&&(i=i/2),this.morphPoints[t].angle=i,this.morphPoints[t].dirty=!0}this.freehandStrokes.forEach(t=>t.applyMorphs(this.morphPoints))}}render(t){let s=i=>i.render(t);this.lineSegments.forEach(s),this.freehandStrokes.forEach(s),this.points.forEach(s),this.morphPoints.forEach(s),this.morphGroup.render(t)}},xt=_;var ge=Math.PI/180,me=180/Math.PI;var W=class{constructor(t){this.page=t,this.activeSnaps=[],this.snapSvgElementById=new Map,this.dirty=!1}snapPositions(t){let s=[],i=new Map,o=this.page.points.filter(a=>!t.has(a)),r=Array.from(t.keys()),l=this.page.pointsReachableFrom(r);for(let[a,d]of t){if(s.some(u=>u.snapPoint===a)){i.set(a,d);continue}let c=[];for(let u of o){let f=h.sub(u.position,d);if(h.len(f)<10){c.push(f),s.push(new Pt(a,u));break}}if(c.length===0){for(let u of l){if(u===a)continue;let f=u.position.x-d.x;if(Math.abs(f)<10){let m=h(f,0);c.push(m),s.push(new Z(a,u));break}}for(let u of l){if(u===a)continue;let f=u.position.y-d.y;if(Math.abs(f)<10){let m=h(0,f);c.push(m),s.push(new Z(a,u));break}}}let g=c.reduce((u,f)=>h.add(u,f),d);i.set(a,g)}return this.setActiveSnaps(s),i}setActiveSnaps(t){this.activeSnaps=t,this.dirty=!0;let s=new Set(t.map(i=>i.id));for(let[i,o]of this.snapSvgElementById)s.has(i)||(o.remove(),this.snapSvgElementById.delete(i))}clear(){this.setActiveSnaps([])}render(t){if(!!this.dirty){for(let s of this.activeSnaps){let i=s.id,{shapeType:o,shapeData:r}=s.getShape(),l=this.snapSvgElementById.get(i);l==null?(l=t.addElement(o,{...r,fill:"none",stroke:"rgb(180, 134, 255)"}),this.snapSvgElementById.set(i,l)):t.updateElement(l,r)}this.dirty=!1}}},bt=W,Q=class{constructor(t,s){this.point=t,this.snapPoint=s,this.id=`${t.id}.${s.id}.${this.constructor.name}`}getShape(){throw new Error("subclass responsibility!")}},Pt=class extends Q{constructor(t,s){super(t,s)}getShape(){return{shapeType:"circle",shapeData:{cx:this.point.position.x,cy:this.point.position.y,r:7}}}},Z=class extends Q{constructor(t,s){super(t,s)}getShape(){return{shapeType:"line",shapeData:{x1:this.point.position.x,y1:this.point.position.y,x2:this.snapPoint.position.x,y2:this.snapPoint.position.y}}}};var J=class{constructor(t){this.selected=0,this.dirty=!1,this.buttons=[t.addElement("circle",{cx:30,cy:30,r:20,fill:"black"}),t.addElement("circle",{cx:30,cy:80,r:20,fill:"lightgrey"}),t.addElement("circle",{cx:30,cy:130,r:20,fill:"lightgrey"})]}update(t){let s=t.did("finger","began");if(!s)return;let i=[30,80,130].findIndex(o=>h.dist(h(30,o),s.position)<20);i!==-1&&(this.selected=i,this.dirty=!0)}render(t){this.dirty&&(console.log("update"),this.buttons.forEach((s,i)=>t.updateElement(s,{fill:this.selected===i?"black":"lightgrey"})),this.dirty=!1)}},Mt=J;function E(e,t,s,i,o=!0){return{center:e,radius:t,startAngle:s,endAngle:i,clockwise:o}}var b=E;E.len=e=>{let{radius:t,startAngle:s,endAngle:i}=e;return t*Math.abs(i-s)};E.distToPointCircle=(e,t)=>{let s=h.dist(e.center,t);return Math.abs(s-e.radius)};E.spreadPointsAlong=(e,t)=>{let s=[],o=E.directedInnerAngle(e)/(t-1);for(let r=0;r<t;r++){let l=e.startAngle+o*r,a=h(e.radius*Math.cos(l),e.radius*Math.sin(l));s.push(h.add(e.center,a))}return s};E.directedInnerAngle=e=>{let t=e.endAngle-e.startAngle;return e.clockwise&&t<0?2*Math.PI-Math.abs(t):!e.clockwise&&t>0?-2*Math.PI+Math.abs(t):t};E.points=e=>{console.log(e);let t=h.add(e.center,h.polar(e.startAngle,e.radius)),s=h.add(e.center,h.polar(e.endAngle,e.radius));return{start:t,end:s}};var y=(e,t)=>({a:e,b:t}),k=y;y.len=e=>h.dist(e.a,e.b);y.directionVec=e=>h.normalize(h.sub(e.b,e.a));y.intersect=(e,t)=>{let{a:s,b:i}=e,{a:o,b:r}=t,l=i.x-s.x,a=i.y-s.y,d=r.x-o.x,c=r.y-o.y,g=l*c-a*d;if(g===0)return null;let u=s.x-o.x,f=s.y-o.y,m=(u*c-f*d)/g,v=(l*f-a*u)/g;if(m>=0&&m<=1&&v>=0&&v<=1){let w=s.x+m*l,F=s.y+m*a;return{x:w,y:F}}return null};y.intersectAnywhere=(e,t)=>{let{a:s,b:i}=e,{a:o,b:r}=t,l=i.x-s.x,a=i.y-s.y,d=r.x-o.x,c=r.y-o.y,g=l*c-a*d;if(g===0)return null;let u=s.x-o.x,f=s.y-o.y,m=(u*c-f*d)/g,v=(l*f-a*u)/g,w=s.x+m*l,F=s.y+m*a;return{x:w,y:F}};y.getYforX=(e,t)=>{let{a:s,b:i}=e,{x:o,y:r}=s,{x:l,y:a}=i;return(a-r)/(l-o)*(t-o)+r};y.getXforY=(e,t)=>{let{a:s,b:i}=e,{x:o,y:r}=s,{x:l,y:a}=i,d=(a-r)/(l-o);return(t-r)/d+o};y.distToPoint=(e,t)=>h.dist(t,y.closestPoint(e,t));y.closestPoint=(e,t,s=!0)=>{let{a:i,b:o}=e,r=h.sub(o,i),l=h.sub(t,i),a=h.dot(l,r)/h.dot(r,r);return s&&a<=0?i:s&&a>=1?o:h.add(i,h.mulS(r,a))};y.spreadPointsAlong=(e,t)=>{let s=y.len(e)/t,i=h.mulS(y.directionVec(e),s),o=[];for(let r=0;r<t;r++)o.push(h.add(e.a,h.mulS(i,r)));return o};var D={},$=D;D.line=e=>{if(e.length===0)return null;let t=k(h.clone(e[0]),h.clone(e[e.length-1])),s=0;for(let o=1;o<e.length-1;o++)s+=k.distToPoint(t,e[o]);let i=k.len(t);return{type:"line",line:t,fitness:i===0?1:s/i,length:i}};D.arc=e=>{if(e.length<3)return null;let t=D.innerTriangle(e),[s,i,o]=t;if(!i)return null;let{x:r,y:l}=s,{x:a,y:d}=i,{x:c,y:g}=o,u=2*(r*(d-g)+a*(g-l)+c*(l-d)),f=((r*r+l*l)*(d-g)+(a*a+d*d)*(g-l)+(c*c+g*g)*(l-d))/u,m=((r*r+l*l)*(c-a)+(a*a+d*d)*(r-c)+(c*c+g*g)*(a-r))/u,v=Math.sqrt((r-f)*(r-f)+(l-m)*(l-m)),w=Math.atan2(l-m,r-f),F=Math.atan2(g-m,c-f),T=h.sub(s,i),O=h.sub(i,o),x=h.cross(T,O)>0,j=b(h(f,m),v,w,F,x),L=b.len(j),V=0;for(let R of e)V+=b.distToPointCircle(j,R);return{type:"arc",arc:j,fitness:V/L,length:L}};D.innerTriangle=e=>{let t=e[0],s=e[e.length-1],i=-1,o=-1;for(let r=0;r<e.length;r++){let l=e[r],a=k.distToPoint(k(t,s),l);a>i&&(i=a,o=r)}return[t,e[o],s]};D.circle=e=>{if(e.length<3)return null;let t=e.length,s=0,i=0,o=0,r=0,l=0,a=0,d=0,c=0,g=0;for(let X of e){let{x:M,y:S}=X;s+=M,i+=S,o+=M*M,r+=S*S,l+=M*S,a+=M*M*M,d+=S*S*S,c+=M*S*S,g+=M*M*S}let u=t*o-s*s,f=t*l-s*i,m=t*a+t*c-(o+r)*s,v=t*r-i*i,w=t*g+t*d-(o+r)*i,F=(w*f-m*v)/(u*v-f*f),T=(w*u-m*f)/(f*f-v*u),O=-(F*s+T*i+o+r)/t,x=h(-F/2,-T/2),j=Math.sqrt(x.x*x.x+x.y*x.y-O),L=Math.atan2(e[0].y-x.y,e[0].x-x.x),V=Math.atan2(e[e.length-1].y-x.y,e[e.length-1].x-x.x),R=h.sub(e[0],e[1]),At=h.sub(e[1],e[2]),Et=h.cross(R,At)>0,it={center:x,radius:j,startAngle:L,endAngle:V,clockwise:Et},nt=0;for(let X of e)nt+=b.distToPointCircle(it,X);let jt=2*Math.PI*j;return{type:"circle",circle:it,fitness:nt/jt}};var K=class{constructor(t,s){this.page=t,this.snaps=s,this.element=null,this.inputPoints=null,this.idealPoints=null,this.renderPoints=null,this.speed=0,this.maxSpeed=0,this.previousPosition=null,this.mode="unknown",this.fit=null,this.fixedStroke=null}update(t){let s=t.did("pencil","began");if(s&&(this.inputPoints=[s.position],this.renderPoints=[h.clone(s.position)],this.speed=0,this.maxSpeed=0,this.previousPosition=s.position,this.mode="unknown",this.dirty=!0),t.didAll("pencil","moved").forEach(r=>{let l=h.dist(this.previousPosition,r.position),a=.05;if(this.speed=a*l+(1-a)*this.speed,this.maxSpeed=Math.max(this.maxSpeed,this.speed),this.previousPosition=r.position,this.mode!=="fixed")this.inputPoints.push(r.position),this.renderPoints.push(h.clone(r.position)),this.mode==="guess"&&this.doFit();else{let d=r.position,c=new Map;c.set(this.fixedStroke.a,this.fixedStroke.a.position),c.set(this.fixedStroke.b,d);let g=this.snaps.snapPositions(c);this.fixedStroke.a.setPosition(g.get(this.fixedStroke.a)),this.fixedStroke.b.setPosition(g.get(this.fixedStroke.b))}this.mode==="unknown"&&this.inputPoints.length>100&&(this.mode="guess"),this.mode!=="fixed"&&this.inputPoints.length>10&&this.speed<Math.min(1,this.maxSpeed)&&(this.doFit(),this.createStroke(),this.clearGuess(),this.mode="fixed"),this.dirty=!0}),t.did("pencil","ended")&&(this.mode!=="fixed"&&(this.doFit(),this.createStroke(),this.clearGuess()),this.page.mergePoint(this.fixedStroke.a),this.page.mergePoint(this.fixedStroke.b),this.fixedStroke=null,this.mode="unknown",this.snaps.clear()),this.idealPoints&&this.renderPoints.length===this.idealPoints.length)for(let r=0;r<this.idealPoints.length;r++)this.renderPoints[r]=h.lerp(this.idealPoints[r],this.renderPoints[r],.8)}doFit(){let t=$.line(this.inputPoints),s=$.arc(this.inputPoints),i=$.circle(this.inputPoints);this.fit=t,s!=null&&Math.abs(b.directedInnerAngle(s.arc))>.4*Math.PI&&(t==null||s.fitness<t.fitness)&&(this.fit=s,i!=null&&Math.abs(b.directedInnerAngle(s.arc))>1.5*Math.PI&&i.circle.radius<500&&i.fitness<s.fitness&&(this.fit=i)),this.fit!=null&&this.updateIdeal()}createStroke(){if(this.fit.type==="line"){let t=this.page.addPoint(this.fit.line.a),s=this.page.addPoint(this.fit.line.b),i=this.page.addLineSegment(t,s);this.fixedStroke=i}else if(this.fit.type==="arc"){let{start:t,end:s}=b.points(this.fit.arc),i=this.page.addPoint(t),o=this.page.addPoint(s),r=this.page.addPoint(this.fit.arc.center),l=this.page.addArcSegment(i,o,r);this.fixedStroke=l}}clearGuess(){this.inputPoints=null,this.idealPoints=null,this.renderPoints=null,this.element.remove(),this.element=null}updateIdeal(){this.fit.type==="line"?this.idealPoints=k.spreadPointsAlong(this.fit.line,this.inputPoints.length):this.fit.type==="arc"?this.idealPoints=b.spreadPointsAlong(this.fit.arc,this.inputPoints.length):this.fit.type==="circle"&&(this.idealPoints=b.spreadPointsAlong(this.fit.circle,this.inputPoints.length))}render(t){if(!!this.dirty){if(this.renderPoints){this.element||(this.element=t.addElement("path",{d:"",stroke:"black",fill:"none"}));let s=A(this.renderPoints);t.updateElement(this.element,{d:s})}this.dirty=!1}}},St=K;var tt=class{constructor(t,s){this.page=t,this.points=null,this.element=s.addElement("path",{d:"",stroke:"darkgrey","stroke-width":2,fill:"none"}),this.dirty=!1}update(t){let s=t.did("pencil","began");if(s!=null&&this.startStroke(s.position),this.points==null)return;t.didAll("pencil","moved").forEach(r=>this.extendStroke(r.position)),t.did("pencil","ended")!=null&&this.endStroke()}startStroke(t){this.points=[t],this.dirty=!0}extendStroke(t){this.points.push(t),this.dirty=!0}endStroke(){this.page.addFreehandStroke(this.points),this.points=null,this.dirty=!0}render(t){if(!this.dirty)return;let s=this.points==null?"":A(this.points);t.updateElement(this.element,{d:s}),this.dirty=!1}},vt=tt;var et=class{constructor(t,s){this.page=t,this.svg=s,this.points=[],this.element=null}update(t){let s=t.did("pencil","began");s&&(this.points=[s.position]);let i=t.did("pencil","moved");i&&this.points.push(i.position);let o=t.did("pencil","ended")}render(t){}},wt=et;var st=class{constructor(){this.svg=new ft,this.page=new xt(this.svg),this.snaps=new bt(this.page),this.morphing=new dt(this.page),this.toolPicker=new Mt(this.svg),this.tools=[new vt(this.page,this.svg),new St(this.page,this.snaps),new wt(this.page)]}update(t){this.toolPicker.update(t),this.tools[this.toolPicker.selected].update(t),this.morphing.update(t)}render(){this.toolPicker.render(this.svg),this.tools[this.toolPicker.selected].render(this.svg),this.snaps.render(this.svg),this.page.render(this.svg)}},Ft=st;var kt=new Ft;Y(e=>{kt.update(e),kt.render()});
//# sourceMappingURL=main.js.map
