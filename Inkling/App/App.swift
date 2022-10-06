//
//  App.swift
//  Inkling
//
//  Created by Marcel on 18/08/2022.
//

import Foundation
import UIKit

class App {
  var viewRef: ViewController!
  
  var canvas: Canvas!
  var colorPicker: ColorPicker!
  
  var strokeCapture: StrokeCapture!
  var selectionCapture: SelectionCaputure!
  
  var draggingMode: DraggingMode?
  var selectionMode: SelectionMode?
  var guideMode: GuideMode?
  var dynamicGuide: DynamicGuide?
  
  var pseudoMode: PseudoModeInput!
  
  //var strokes: [Stroke]
  var images: [RenderImage] = []
  
  
  init(_ viewRef: ViewController) {
    self.viewRef = viewRef
    
    canvas = Canvas()
    colorPicker = ColorPicker()
    
    strokeCapture = StrokeCapture()
    selectionCapture = SelectionCaputure()
    
    pseudoMode = PseudoModeInput()
  }
  
  func update(touches: Touches){
    
    // color picker
    if let (color, position) = colorPicker.update(touches) {
      strokeCapture.color = color
      canvas.addFill(color, position)
    }
    
    // Selection gesture
    if selectionMode != nil {
      if let result = selectionMode!.update(touches) {
        switch result {
          case .Close:
            selectionMode = nil
            canvas.selection = nil
          case let .StartMorph(transform):
            canvas.selection?.startMorph(transform)
          case let .Morph(transform):
            canvas.selection?.morph(transform)
          case .Simplify:
            canvas.selection?.simplify()
          case .Delete:
            canvas.deleteSelection()
            selectionMode = nil
            canvas.selection = nil
        }
      }
    }
    
    // Dragging mode
    if let draggingMode = draggingMode {
      draggingMode.update(touches)
    }
    
    // Guide mode
    if guideMode != nil {
      if guideMode!.update(touches) {
        guideMode = nil
      }
    }
    
    // Dynamic Guide
    if dynamicGuide != nil {
      if dynamicGuide!.update(touches) {
        dynamicGuide = nil
      }
    }
    
    
    // PseudoMode
    let pseudoModeResult = pseudoMode.update(touches)
    if case let .GuideMode(positions, touches) = pseudoModeResult {
      guideMode = GuideMode(positions, touches)
    }
    
    if case let .DynamicGuide(touchId, touchPos, pencilPos) = pseudoModeResult {
      dynamicGuide = DynamicGuide(touchId, touchPos, pencilPos)
    }
    
    
    if pseudoMode.mode == .Drag {
      if draggingMode == nil {
        draggingMode = DraggingMode(canvas.clusters, canvas.handles)
      }
    } else {
      if draggingMode != nil {
        draggingMode = nil
      }
    }
    
    if pseudoMode.mode == .Select {
      if let polygon = selectionCapture.update(touches) {
        canvas.selectPolygon(polygon)
        if canvas.selection != nil {
          selectionMode = SelectionMode()
        } else {
          selectionMode = nil
        }
      }
    }
    
    if pseudoMode.mode == .Erase {
      canvas.erase(touches)
    }
    
    if pseudoMode.mode == .Default {
      if let stroke = strokeCapture.update(touches.events) {
        canvas.addStroke(stroke)
      }
    }
    
    
  }
  
  func render(renderer: Renderer) {
    if let guideMode = guideMode {
      guideMode.render(renderer)
    }
    
    if let dynamicGuide = dynamicGuide {
      dynamicGuide.render(renderer)
    }
    
    canvas.render(renderer, pseudoMode.mode)
    
    strokeCapture.render(renderer)
    colorPicker.render(renderer)
    
    if selectionMode == nil || selectionMode!.active == false {
      pseudoMode.render(renderer)
    }
    
    selectionCapture.render(renderer)
    if let selectionMode = selectionMode {
      selectionMode.render(renderer)
    }
    
    
  }
  
  func loadImage(imageUrl: String){
    print(imageUrl)
    if let imageId = viewRef.renderer.loadTextureFile(imageUrl) {
      images.append(imageId)
    }
  }
  
}
