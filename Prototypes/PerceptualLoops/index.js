import Vec from "./vec.js"

let nodes = {
    "A": {x: 100, y: 100},
    "B": {x: 200, y: 150},
    "C": {x: 300, y: 100},
    "D": {x: 100, y: 200},
    "E": {x: 150, y: 100},
    "F": {x: 300, y: 200},
    "G": {x: 100, y: 300},
    "H": {x: 200, y: 300},
    "I": {x: 300, y: 300},
}

let edges = [
    ["A", "B"],
    ["B", "E"],
    ["E", "F"],
    ["F", "I"],
    ["I", "H"],
    ["H", "G"],
    ["G", "D"],
    ["D", "A"],

    ["B", "C"],
    ["C", "F"],
]

// Pick a random edge
let startEdge = edges[0];

// Start walking
let a = nodes[startEdge[0]];
let b = nodes[startEdge[1]];
let vec = Vec.normalize(Vec.sub(b, a));
console.log(vec);

let nextEdges = [
    edges[1],
    edges[8],
]

let nextDirections = nextEdges.map(edge=>{
    let a = nodes[edge[0]];
    let b = nodes[edge[1]];
    return Vec.normalize(Vec.sub(b, a));
})

let innerAngles = nextDirections.map(dir=>{
    return Vec.angleBetweenClockwise(dir, vec)
})

console.log(nextDirections);
console.log(innerAngles);
