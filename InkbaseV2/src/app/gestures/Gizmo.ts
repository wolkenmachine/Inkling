// if (fingerDown) {
//   const dist = Line.distToPoint(this.line, fingerDown.position);
//   if (dist < 20) {
//     return true;
//   }
// }
// const fingerUp = events.find('finger', 'ended');
// if (fingerUp) {
//   if (Vec.dist(handles.a.position, fingerUp.position) < 20) {
//     return true;
//   }
//   if (Vec.dist(handles.b.position, fingerUp.position) < 20) {
//     return true;
//   }
//   const d = Vec.dist(this.center, fingerUp.position);
//   if (Math.abs(d - this.radius) < 20) {
//     this.toggleAngle();
//     return true;
//   }
//   if (Line.distToPoint(this.line, fingerUp.position) < 20) {
//     this.toggleDistance();
//     return true;
//   }
// }