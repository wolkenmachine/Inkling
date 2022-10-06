//
//  Canvas.swift
//  Inkling
//
//  Created by Marcel on 22/08/2022.
//

import Foundation
import UIKit


// Canvas is a dumb container that we act on from the outside

class Canvas {
  var elements: [CanvasElement] = []
  var clusters: NodeClusters = NodeClusters()
  var handles: [BezierNode] = []
  var selection: CanvasSelection? = nil
  var depthCount: Float = 0
  
  func addStroke(_ stroke: Stroke) {
    let line_segments = analyseStroke(stroke)
    
    for line in line_segments {
      addElement(line)
    }
  }
  
  func addFill(_ color: Color, _ position: CGVector) {
    if let polygon = clusters.findEnclosingPolygon(position) {
      let fill = CanvasFill(polygon, color: color)
      addElement(fill)
    }
  }
  
  func addElement(_ element: CanvasElement) {
    depthCount += 0.0001
    element.setDepth(depth: depthCount)
    elements.append(element)
    
    for node in element.nodes {
      clusters.addNode(node)
    }
    
    if let element = element as? CanvasBezier {
      handles.append(contentsOf: element.handles)
    }
  }
  
  func removeElement(_ element: CanvasElement){
    elements.removeAll(where: { e in e === element })
    //clusters.removeAllForMorphable()
  }
  
  func selectPolygon(_ polygon: [CGVector]) {
    let foundSelection = CanvasSelection(clusters.findClustersInPolygon(polygon))
    
    if selection == nil {
      selection = foundSelection
    } else {
      selection?.updateSelection(foundSelection)
    }
    
    if selection != nil {
      if selection?.selectedClusters.count == 0 {
        selection = nil
      }
    }
  }
  
  func erase(_ touches: Touches){
    for event in touches.moved(.Pencil) {
       for element in elements {
         var stroke: Stroke? = nil
         
         if let line = element as? CanvasLine {
           stroke = line.stroke
         }
         if let curve = element as? CanvasCurve {
           stroke = curve.stroke
         }
         
         if let stroke = stroke {
           if let split_strokes = stroke.erase(event.pos) {
             clusters.removeNodesWithElement(element)
             elements.removeAll(where: {e in e === element })
             for s in split_strokes {
               addStroke(s)
             }
           }
         }
       }
    }
  }
  
  func deleteSelection(){
    if let selection = selection {
      for cluster in selection.selectedClusters {
        for node in cluster.nodes {
          clusters.removeNode(node)
          elements.removeAll(where: {e in e === node.element})
          handles.removeAll(where: {h in h.element === node.element})
        }
      }
      
      
    }
  }
  
  func render(_ renderer: Renderer, _ mode: PseudoMode){
    for element in elements {
      element.render(renderer)
    }
    
    if mode == PseudoMode.Drag {
      for handle in handles {
        handle.render(renderer)
      }
      
      clusters.render(renderer)
    }
    
    if mode == PseudoMode.Select {
      clusters.renderSelection(renderer)
    }
    
    if let selection = selection {
      selection.render(renderer)
    }
  }
}
