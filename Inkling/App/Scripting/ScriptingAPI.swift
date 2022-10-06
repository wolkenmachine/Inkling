//
//  ScriptingAPI.swift
//  Inkling
//
//  Created by Patrick Dubroy on 2022-10-05.
//

import Foundation
import JavaScriptCore

// All the methods and properties that are exposed to JavaScript.
@objc protocol HabitatJSExports: JSExport {
  func registerCanvasObserver(_ observer: JSValue) -> Void
  func test() -> Void
  func moveCluster(_ cluster: JSValue, _ pointArr: JSValue) -> Void
}

@objc class ScriptingAPI: NSObject, HabitatJSExports {
  let canvas: Canvas
  public var observerBridge: ObserverBridge? = nil

  init(_ canvas: Canvas) {
    self.canvas = canvas
  }

  func registerCanvasObserver(_ observer: JSValue) -> Void {
    // TODO(pdubroy): Implement unregister.
    observerBridge = ObserverBridge(observer)
    canvas.registerObserver(observerBridge!)
  }

  func test() -> Void {
    print("test")
  }

  func moveCluster(_ cluster: JSValue, _ pointArr: JSValue) -> Void {
    let nodeCluster: NodeCluster? = WeakHandle.get(fromJSValue: cluster)
    guard let nodeCluster = nodeCluster else {
      print("ERROR: moveCluster(): Unable to unwrap NodeCluster in arg 1")
      return
    }
    let point = pointArr.toObject() as? [Double]
    guard let point = point else {
      print("ERROR: moveCluster(): Unable to unwrap [Double] in arg 2")
      return
    }
    nodeCluster.move(CGVector(dx: point[0], dy: point[1]))
  }
}

// Used to pass an opaque reference to a Swift object into a JSContext,
// without retaining the object from the JS side.
@objc class WeakHandle: NSObject {
  weak var obj: AnyObject?

  init(_ obj: AnyObject) {
    self.obj = obj
  }

  func get<T>() -> T? {
    if let obj = obj {
      return obj as? T
    }
    return nil
  }

  class func get<T>(fromJSValue value: JSValue) -> T? {
    return (value.toObject() as? WeakHandle)?.get()
  }
}

// Returns true if `val` contains anything other than the JS value `false`.
private func isAnythingButFalse(_ val: JSValue?) -> Bool {
  if let val = val {
    return val.isBoolean ? val.toBool() : true
  }
  return true
}

class ObserverBridge: CanvasObserver, DraggingModeDelegate {
  let jsObserver: JSValue

  init(_ jsObserver: JSValue) {
    self.jsObserver = jsObserver;
  }

  func elementAdded(_ element: CanvasElement, toCanvas canvas: Canvas) {
    jsObserver["elementAdded"]?.call(withArguments: [WeakHandle(element)])
  }
  func elementRemoved(_ element: CanvasElement, fromCanvas canvas: Canvas) {
    jsObserver["elementRemoved"]?.call(withArguments: [WeakHandle(element)])
  }
  func clusterDragged(_ cluster: NodeCluster, toPos pos: CGVector) -> Bool {
    if let handler = jsObserver.objectForKeyedSubscript("clusterDragged") {
      let r = handler.call(withArguments: [WeakHandle(cluster), [pos.dx, pos.dy]])
      return isAnythingButFalse(r);
    }
    return true
  }
}
