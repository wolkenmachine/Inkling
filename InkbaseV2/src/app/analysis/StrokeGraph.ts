import { Position, PositionWithPressure } from '../../lib/types';
import Page from '../Page';
import FreehandStroke from '../strokes/FreehandStroke';
import Vec, { Vector } from '../../lib/vec';
import Svg from '../Svg';
import Polygon from '../../lib/polygon';


// **
// StrokeGraph, Intermediate representation of the page. Useful for finding loops etc.
// TODO: Maybe move to a different file, just leave here for now
// **

// Node in the graph
class StrokeGraphNode {
  averagePosition: Position;
  positions: Array<Position>;

  constructor(position: Position) {
    this.averagePosition = position;
    this.positions = [position];
  }

  addPosition(position: Position){
    this.positions.push(position);
    this.averagePosition = Vec.divS(
      this.positions.reduce((acc, v)=> Vec.add(acc, v), Vec(0,0)), 
      this.positions.length
    )
  }
}

// A partial stroke is a reference to a slice of a FreehandStroke
// Equivalent to an actual edge in the graph
// 
class PartialStroke {
  stroke: FreehandStroke;
  flipped: boolean;
  pointIndexes: Array<number>;
  nodes: Array<StrokeGraphNode>;
  //length: number;
  id: string;

  constructor (stroke: FreehandStroke, pointIndexes: Array<number>, nodes: Array<StrokeGraphNode>){
    this.stroke = stroke;

    this.flipped = false;
    this.pointIndexes = pointIndexes;
    if(this.pointIndexes[0] > this.pointIndexes[1]) {
      this.pointIndexes = this.pointIndexes.reverse();
      this.flipped = true;
    }

    this.nodes = nodes;
    //this.length = stroke.distanceBetweenPoints(pointIndexes[0], pointIndexes[1]);
    this.id = stroke.id+"_"+this.pointIndexes[0]+"_"+this.pointIndexes[1];
  }

  getPoints(){
    let pts = this.stroke.points.slice(this.pointIndexes[0], this.pointIndexes[1]+1);
    if(this.flipped) {
      pts.reverse();
    }

    return pts;
  }

  getDirection(){
    let direction = this.stroke.getLocalDirection(this.pointIndexes[this.flipped ? 1 : 0]);
    if(this.flipped) {
      direction = Vec.flip(direction);
    }

    return direction;
  }

  getReverseStroke() {
    let indexes = [...this.pointIndexes]
    if(!this.flipped) {
      indexes.reverse()
    }
    return new PartialStroke(this.stroke, indexes, [...this.nodes].reverse())
  }
}


// Not quite the same as an edge in the graph, as it represents multiple edges along the length of a stroke
class StrokeGraphEdge {
  stroke: FreehandStroke;

  // A sorted array of nodes positioned along the length of the stroke
  nodesWithPointIndex: Array<{node: StrokeGraphNode, pointIndex: number}> = [];
  
  constructor(stroke: FreehandStroke){
    this.stroke = stroke;
  }

  addNode(node: StrokeGraphNode, pointIndex: number) {
    if(this.nodesWithPointIndex.find(n=>n.node == node)) {
      return;
    }

    this.nodesWithPointIndex.push({node, pointIndex});
    this.nodesWithPointIndex.sort((a, b)=>{
      return a.pointIndex - b.pointIndex;
    })
  }

  // Find nodes that are directly reachable from this node along this edge
  getAdjacentNodes(node: StrokeGraphNode): Array<StrokeGraphNode>{
    let index = this.nodesWithPointIndex.findIndex(n=>n.node===node);
    if(index == -1) return [];

    const adjacentNodes = [
      this.nodesWithPointIndex[index-1],
      this.nodesWithPointIndex[index+1]
    ].filter(n=>n).map(n=>n.node);

    return adjacentNodes;
  }
  
  getPartialStrokeBetween(nodeA: StrokeGraphNode, nodeB: StrokeGraphNode): PartialStroke {
    const indexA = this.nodesWithPointIndex.find(n=>n.node===nodeA)?.pointIndex;
    const indexB = this.nodesWithPointIndex.find(n=>n.node===nodeB)?.pointIndex;
    if(indexA === undefined || indexB === undefined) {
      throw new Error('nodes not connected to this edge');
    };

    return new PartialStroke(this.stroke, [indexA, indexB], [nodeA, nodeB]);
  }

  getAdjacentPartialStrokes(node: StrokeGraphNode): Array<PartialStroke> {
    const adjacentNodes = this.getAdjacentNodes(node);
    return adjacentNodes.map(otherNode=>{
      return this.getPartialStrokeBetween(node, otherNode);
    })
  }

  getPartialStrokes(): Array<PartialStroke> {
    if(this.nodesWithPointIndex.length < 2) {
      return [];
    }

    let strokes = [];
    for(let i = 0; i<this.nodesWithPointIndex.length-1; i++) {
      let a = this.nodesWithPointIndex[i];
      let b = this.nodesWithPointIndex[i+1];
      strokes.push(new PartialStroke(this.stroke, [a.pointIndex, b.pointIndex], [a.node, b.node]));
    }
    return strokes
  }
}

// A loop 
class StrokeGraphLoop {
  partialStrokes: Array<PartialStroke>;
  id: string;

  constructor(partialStrokes: Array<PartialStroke>){
    this.partialStrokes = partialStrokes
    this.id = partialStrokes
      .map(ps=>ps.id)
      .sort()
      .join("-");
  }

  getPolygonPoints(): Array<PositionWithPressure> {
    
    let start = this.partialStrokes[0];
    let node = start.nodes[1];

    let points = [...start.getPoints()];

    for (let i = 1; i < this.partialStrokes.length; i++) {
      let next = this.partialStrokes[i];
      let nextPoints = next.getPoints();
      // if(next.nodes[1] == node) {
      //   nextPoints.reverse();
      //   node = next.nodes[0];
      // } else {
      //   node = next.nodes[1];
      // }

      points = points.concat(nextPoints);
    }

    return points;
  }

  getArea(){
    let pts = this.getPolygonPoints();
    return Polygon.area(pts);
  }
}

export default class StrokeGraph {
  nodes: Array<StrokeGraphNode> = [];
  edges: Array<StrokeGraphEdge> = [];

  addNode(position: Position): StrokeGraphNode {
    // Find node that we can collapse into
    const found = this.nodes.find(node=>{
      return node.positions.find(p=>Vec.dist(position, p) < 10)
    })

    if(found) {
      found.addPosition(position);
      return found
    }

    const newNode = new StrokeGraphNode(position);
    this.nodes.push(newNode);
    return newNode;
  }

  addEdge(stroke: FreehandStroke, node: StrokeGraphNode, index: number){
    // Find an edge that we can collapse into
    let edge = this.edges.find(edge=>{
      return edge.stroke == stroke
    })

    if(!edge) {
      edge = new StrokeGraphEdge(stroke);
      this.edges.push(edge);
    }

    edge.addNode(node, index);
  }

  getPartialStrokes(){
    return this.edges.flatMap(edge=>edge.getPartialStrokes());
  }

  getAdjacentNodes(node: StrokeGraphNode): Set<StrokeGraphNode> {
    let neighbours: Set<StrokeGraphNode> = new Set();
    for(const edge of this.edges) {
      let edgeNeighbours = edge.getAdjacentNodes(node);
      for(const n of edgeNeighbours) {
        neighbours.add(n);
      }
    }

    return neighbours
  }

  getAdjacentPartialStrokes(node: StrokeGraphNode): Array<PartialStroke> {
    return this.edges.flatMap(edge=>edge.getAdjacentPartialStrokes(node));
  }

  findLoops(): Array<StrokeGraphLoop> {
    let allPartialStrokes = this.getPartialStrokes()
    
    if(allPartialStrokes.length == 0) {
      return [];
    }

    let foundLoops: Map<string, StrokeGraphLoop> = new Map();

    while(allPartialStrokes.length > 0) {
      let forwardStroke = allPartialStrokes.pop()!;
      let backwardStroke = forwardStroke.getReverseStroke();
      
      let loops = [
        this.findMaximallyClockwiseTurningLoop(forwardStroke, forwardStroke, false),
        this.findMaximallyClockwiseTurningLoop(forwardStroke, forwardStroke, true),
        this.findMaximallyClockwiseTurningLoop(backwardStroke, backwardStroke, false),
        this.findMaximallyClockwiseTurningLoop(backwardStroke, backwardStroke, true),
      ].filter(l=>l!=undefined)
        .map(loop=>{
          return {loop, area: loop!.getArea()}
        })
        .sort((a, b)=>{
          return a.area - b.area;
        });

        console.log("found loops", loops);
      
      if(loops.length > 0) {
        let activeLoop = loops[0].loop;
        activeLoop.partialStrokes.forEach(stroke=>{
          allPartialStrokes.filter(s=>s.id != stroke.id);
        })

        foundLoops.set(activeLoop.id, activeLoop);
      }

      


      // let forwardLoop = this.findMaximallyClockwiseTurningLoop(forwardStroke, forwardStroke, false);
      // let backwardLoop = this.findMaximallyClockwiseTurningLoop(forwardStroke, forwardStroke, true);

      // let activeLoop = forwardLoop;
      // if(backwardLoop!=null) {
      //   if(activeLoop == null) {
      //     activeLoop = backwardLoop
      //   } else {
      //     console.log(forwardLoop, backwardLoop, forwardLoop!.getArea(), backwardLoop!.getArea());
          
      //     // If they both return a result, pick the loop with the smallest area
      //     if(forwardLoop!.getArea() > backwardLoop!.getArea()) {
      //       activeLoop = backwardLoop;
      //     }
      //   }
      // }


      // if(activeLoop != null) {
      //   activeLoop.partialStrokes.forEach(stroke=>{
      //     allPartialStrokes.filter(s=>s.id != stroke.id);
      //   })

      //   foundLoops.set(activeLoop.id, activeLoop);
      // }


      // let loops = ([
      //   this.findMaximallyClockwiseTurningLoop(currStroke, currStroke),
      //   this.findMaximallyClockwiseTurningLoop(revStroke, revStroke),
      // ]).filter(l=>l!=null).sort((a, b)=>{
      //   return a?.getArea() - b?.getArea();
      // }) as Array<StrokeGraphLoop>;

      // loops.forEach(loop=>{
      //   loop.partialStrokes.forEach(stroke=>{
      //     allPartialStrokes.filter(s=>s.id != stroke.id);
      //   })

      //   foundLoops.set(loop.id, loop);
      // })

    }
    
    return Array.from(foundLoops.values());
  }

  findMaximallyClockwiseTurningLoop(currentStroke: PartialStroke, targetStroke: PartialStroke, flipped: boolean = false, path: Array<PartialStroke> = [], visited: Set<StrokeGraphNode> = new Set()): (StrokeGraphLoop | undefined) {
    interface PartialStrokeWithInnerAngle {partialStroke: PartialStroke, innerAngle: number};

    visited.add(currentStroke.nodes[1]);
    path.push(currentStroke);

    let direction = currentStroke.getDirection();
    let nextStrokes = this.getAdjacentPartialStrokes(currentStroke.nodes[1])
      .map(partialStroke=>{ 
        return {
          partialStroke,
          innerAngle: Vec.cross(direction, partialStroke.getDirection())
        }
      })
      .sort((a, b)=> { // Sort with largest inner angle first
        if(flipped) {
          return a.innerAngle - b.innerAngle
        } else {
          return b.innerAngle - a.innerAngle
        }
      }); 

    for(const nextStroke of nextStrokes) {
      if(path.length > 1 && nextStroke.partialStroke.id === targetStroke.id) {
        if(path[path.length-1].id !== targetStroke.id) { // Avoid immediate backtracking
          return new StrokeGraphLoop(path);
        }
      }
    }

    for(const nextStroke of nextStrokes) {
      if(!visited.has(nextStroke.partialStroke.nodes[1])) {
        let found = this.findMaximallyClockwiseTurningLoop(nextStroke.partialStroke, targetStroke, flipped, path, visited);
        if(found != undefined) {
          return found
        }
      }
      
    }

    path.pop();
  }

  // getMostConnectedNode(){
  //   let connectionCountForNodes = new Map();
  //   for(const node of this.nodes) {
  //     connectionCountForNodes.set(node, 0);
  //   }

  //   for(const edge of this.edges) {
  //     for(const np of edge.nodesWithPointIndex) {
  //       connectionCountForNodes.set(np.node, connectionCountForNodes.get(np.node)+1);
  //     }
  //   }


  //   let bestNode = this.nodes[0];
  //   let bestCount = 0;
  //   for(const n of this.nodes) {
  //     let count = connectionCountForNodes.get(n)
  //     if(count > bestCount) {
  //       bestCount = count;
  //       bestNode = n;
  //     }
  //   }

  //   return bestNode;
  // }

  // getSpanningTree(){
  //   let visited = new Set()
  //   let tree = new Map()

  //   (function recurse(node: StrokeGraphNode){
  //     let neighbours = this.getAdjacentNodes(node);
  //       //let neighbours = nodes[root]
  //       //let sorted_neighbours = [...neighbours].sort((a,b)=>nodes[b].size - nodes[a].size)
  //       // let next = []
  //       // sorted_neighbours.forEach(n=>{
  //       //     if(!visited.has(n)) {
  //       //         visited.add(n)
  //       //         tree.add_edge(root, n)
  //       //         next.push(n)
  //       //     }
  //       // })
  //       // next.forEach(recurse)
  //   }).bind(this)

  //   // find most connected node
  //   recurse(this.getMostConnectedNode())

  //   return tree
  // }

  // // Find the shortest cycle for this node
  // findShortestCycle(startNode: StrokeGraphNode, visited: Set<string>) {
  //   let partialStrokes = this.getAdjacentPartialStrokes(startNode);
  //   console.log("partialStrokes", partialStrokes);
  //   partialStrokes.sort((a, b)=>a.distance - b.distance);

  //   // If there are multiple partial strokes that means we can possibly find a loop
  //   if(partialStrokes.length > 1) {
  //     const startStroke = partialStrokes.pop();
  //     const targetNodes = partialStrokes.map(ps=>ps.nodes[1]);

  //     for(const targetNode of targetNodes) {

  //     }
  //   }
  // }


  
  findMaximallyClockwiseTurningLoopForNode(startNode: StrokeGraphNode){
    interface StackEntry {node: StrokeGraphNode, direction: (Vector | null)};

    let stack = [{node: startNode, direction: Vec(1,0)}];
    let path = [];
    let targetNode = startNode;
    let visitedEdgeIds = new Set<string>(); 

    while(stack.length > 0) {
      const {node, direction} = stack.pop()!; //"!" To make typescript happy. Can't be undefined, because stack.length > 0
      path.push(node);
      if(node == targetNode) {
        return path;
      }

      let partialStrokes = this.getAdjacentPartialStrokes(node);
      let potentialNextSteps = [];

      for(const ps of partialStrokes) {
        if(!visitedEdgeIds.has(ps.id)) {
          visitedEdgeIds.add(ps.id);
          let direction = ps.getDirection();
          let nextNode = ps.nodes[1];
          potentialNextSteps.push({node: nextNode, direction});
        }
      }

      potentialNextSteps = potentialNextSteps.sort((a, b)=>{
        return Vec.cross(direction, a.direction) - Vec.cross(direction, b.direction);
      });
      stack.push(...potentialNextSteps);

      path.pop();
      
      
    }
    return path;
  }


  // TODO: Improve search heuristic here
  // findLoopsForNode(
  //   startNode: StrokeGraphNode, 
  //   targetNode: StrokeGraphNode, 
  //   visitedEdges: Set<string> = new Set(),
  //   path: Array<PartialStroke> = [],
  //   paths: Array<StrokeGraphLoop> = []
  // ) {

  //   console.log("sfs", startNode, targetNode, visitedEdges, path, paths);
    
  //   if(path.length > 0 && startNode === targetNode) {
  //     paths.push(new StrokeGraphLoop([...path]));
  //   }

  //   let partialStrokes = this.getAdjacentPartialStrokes(startNode)
  //     .filter(ps=>!visitedEdges.has(ps.id)) // Only edges that we haven't visited yet
  //     //.sort((a, b)=>a.distance - b.distance); // Do shortest edge first

  //   console.log("partialStrokes", partialStrokes);
    
  //   for(const ps of partialStrokes) {
  //     let nextNode = ps.nodes[1];
  //     visitedEdges.add(ps.id);
  //     path.push(ps);
  //     this.findLoopsForNode(nextNode, targetNode, visitedEdges, path, paths);
  //     visitedEdges.delete(ps.id);
  //     path.pop();
  //   }

  //   return paths;
  // }

  

  render(){
    this.nodes.forEach(node=>{
      Svg.now("circle", {
        cx: node.averagePosition.x,
        cy: node.averagePosition.y,
        r: "5",
        fill: "pink"
      });
    })
    
  }
}