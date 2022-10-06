//
//  Shapes.swift
//  Inkling
//
//  Created by Marcel on 21/07/2022.
//

import Foundation
import UIKit


func lineShape(a: CGVector, b: CGVector, weight: CGFloat, color: Color) -> RenderShape {
  let color = color.as_simd()
  
  let diff = (a - b).normalized() * weight
  let a1 = a + diff.rotated90clockwise()
  let a2 = a + diff.rotated90counterclockwise()
  let b1 = b + diff.rotated90clockwise()
  let b2 = b + diff.rotated90counterclockwise()
  
  
  let verts = [
    Vertex(position: [Float(a1.dx), Float(a1.dy), 0], color: color),
    Vertex(position: [Float(a2.dx), Float(a2.dy), 0], color: color),
    Vertex(position: [Float(b1.dx), Float(b1.dy), 0], color: color),
    Vertex(position: [Float(b2.dx), Float(b2.dy), 0], color: color),
  ]


  let indices: [UInt16] = [
      0, 1, 2,
      2, 3, 1
  ]
  
  return RenderShape (verts: verts, indices: indices)
}

func polyLineShape(points: [CGVector], weight: CGFloat, color: Color) -> RenderShape {
  let color = color.as_simd()
  
  var verts: [Vertex] = []
  var indices: [UInt16] = []
  var points = points
  var indexOffset: UInt16 = 0
  
  var lastPoint = points[0]
  points.removeFirst()
  
  verts += [
    Vertex(position: [Float(lastPoint.dx), Float(lastPoint.dy), 0], color: color),
    Vertex(position: [Float(lastPoint.dx), Float(lastPoint.dy), 0], color: color)
  ]
  
  for point in points {
    let newPoint = point
    let diff = (newPoint - lastPoint).normalized() * weight // line thickness
    let left_offset = newPoint + diff.rotated90clockwise()
    let right_offset = newPoint + diff.rotated90counterclockwise()

    verts += [
      Vertex(position: [Float(right_offset.dx), Float(right_offset.dy), 0], color: color),
      Vertex(position: [Float(left_offset.dx), Float(left_offset.dy), 0], color: color),
    ]


    indices += [
      indexOffset+0, indexOffset+1, indexOffset+2,
      indexOffset+2, indexOffset+3, indexOffset+1
    ]

    indexOffset += 2

    lastPoint = newPoint
  }
  
  return RenderShape (verts: verts, indices: indices)
}

func rectShape(a: CGVector, b: CGVector, color: Color) -> RenderShape {
  let color = color.as_simd()
  
  let verts = [
    Vertex(position: [Float(a.dx), Float(a.dy), 0], color: color),
    Vertex(position: [Float(b.dx), Float(a.dy), 0], color: color),
    Vertex(position: [Float(b.dx), Float(b.dy), 0], color: color),
    Vertex(position: [Float(a.dx), Float(b.dy), 0], color: color),
  ]


  let indices: [UInt16] = [
      0, 1, 2,
      2, 3, 0
  ]
  
  return RenderShape (verts: verts, indices: indices)
}

func imageShape(a: CGVector, b: CGVector, texture: Int) -> RenderShape {
  let texture_id = Float(texture)
  
  let verts = [
    Vertex(position: [Float(a.dx), Float(a.dy), 0, 0], color: [-1.0, texture_id, 0.0, 0.0]),
    Vertex(position: [Float(b.dx), Float(a.dy), 0, 0], color: [-1.0, texture_id, 1.0, 0.0]),
    Vertex(position: [Float(b.dx), Float(b.dy), 0, 0], color: [-1.0, texture_id, 1.0, 1.0]),
    Vertex(position: [Float(a.dx), Float(b.dy), 0, 0], color: [-1.0, texture_id, 0.0, 1.0]),
  ]


  let indices: [UInt16] = [
      0, 1, 2,
      2, 3, 0
  ]
  
  return RenderShape (verts: verts, indices: indices)
}


// This can no doubt be done faster, but i'm lazy today
func circleShape(pos: CGVector, radius: Float, resolution: Int, color: Color) -> RenderShape {
  let color = color.as_simd()
  let x = Float(pos.dx)
  let y = Float(pos.dy)
  
  let circleFactor = (Float.pi*2)/Float(resolution)
  
  var verts: [Vertex] = []
  for i in 0..<resolution {
    let fi = Float(i)
    verts.append(Vertex(position: SIMD4<Float>(x + cos(fi*circleFactor) * radius , y + sin(fi*circleFactor) * radius, 0, 0), color: color))
  }
  
  var indices: [UInt16] = []
  for i in 0..<resolution-2 {
    indices.append(UInt16(0))
    indices.append(UInt16((i%resolution)+1))
    indices.append(UInt16((i+1)%resolution+1))
  }

  
  return RenderShape (verts: verts, indices: indices)
}

// This can no doubt be done faster, but i'm lazy today
func circleLineShape(pos: CGVector, radius: Float, resolution: Int, width: Float, color: Color) -> RenderShape {
  let color = color.as_simd()
  let x = Float(pos.dx)
  let y = Float(pos.dy)
  
  let circleFactor = (Float.pi*2)/Float(resolution)
  let hWidth = width;
  
  var verts: [Vertex] = []
  for i in 0...resolution {
    let fi = Float(i)
    verts.append(Vertex(position: SIMD4<Float>(x + cos(fi*circleFactor) * (radius - hWidth), y + sin(fi*circleFactor) * (radius - hWidth), 0, 0), color: color))
    verts.append(Vertex(position: SIMD4<Float>(x + cos(fi*circleFactor) * (radius + hWidth), y + sin(fi*circleFactor) * (radius + hWidth), 0, 0), color: color))
  }
  
  var indices: [UInt16] = []
  var indexOffset: UInt16 = 0
  for _ in 0..<resolution {
    indices += [
      indexOffset+0, indexOffset+1, indexOffset+2,
      indexOffset+2, indexOffset+3, indexOffset+1
    ]

    indexOffset += 2
  }
  
//  indices += [
//    indexOffset+0, indexOffset+1, indexOffset+2,
//    indexOffset+2, 1, 0
//  ]

  
  return RenderShape (verts: verts, indices: indices)
}

func polyFillShape(points: [CGVector], color: Color, depth: Float = 0) -> RenderShape {
  let color = color.as_simd()
  
  var verts: [Vertex] = []
  for p in points {
    verts.append(Vertex(position: SIMD4<Float>(Float(p.dx), Float(p.dy), depth, 0), color: color))
  }
  
  let indices = triangulatePolygon(points).map({ i in
    UInt16(i)
  })
  
  return RenderShape (verts: verts, indices: indices)
}
