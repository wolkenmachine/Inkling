//
//  Renderer.swift
//  Inkling
//
//  Created by Marcel on 20/06/2022.
//

import MetalKit
import CoreImage.CIFilterBuiltins

// STRUCTS
struct Vertex {
  var position: SIMD4<Float>
  var color: SIMD4<Float>
}

struct RenderShape {
  var verts: [Vertex]
  var indices: [UInt16]
}

struct RenderImage {
  var texture_id: Int
  var width: Int
  var height: Int
}

// CONSTANTS
let NUMBER_OF_VERTS = 10000;
let MSAA = 4;

struct Constants {
  var screen_width: Float = Float(UIScreen.main.bounds.width)
  var screen_height: Float = Float(UIScreen.main.bounds.height)
}

// MAIN RENDERER CLASS
class Renderer: NSObject {
  var viewRef: ViewController!
  
  // Metal things
  var device: MTLDevice!
  var commandQueue: MTLCommandQueue!
  var pipelineState: MTLRenderPipelineState!
  var computePipelineState: MTLComputePipelineState!
  var depthState: MTLDepthStencilState!
  
  // Buffers
  var pointBuffer: MTLBuffer!       // Stroke points are passed through here
  var pointVertexBuffer: MTLBuffer! // Compute shader stroke geometry arrives in this buffer
  var vertexBuffer: MTLBuffer!      // Vertexes for other geometry
  var indexBuffer: MTLBuffer!       // Indecies for other geometry
  
  // Buffer sizes for rendering
  var vertexBufferSize = 0
  var indexBufferSize = 0
  var pointBufferSize = 0
  
  // Textures
  var samplerState: MTLSamplerState?
  var textures: [MTLTexture] = []
  
  // Depth Counting
  var depthCounter = 0
  
  // Screen size
  var constants = Constants()
  
  
  // Init function
  init(metalView: MTKView) {
    super.init()
    
    print(constants)
    device = MTLCreateSystemDefaultDevice()
    commandQueue = device.makeCommandQueue()
    metalView.device = device
    metalView.delegate = self
    
    createBuffers()
    createPipelineState()
    
    createSamplerState()
    loadTextures()
   
    // Default settings
    metalView.preferredFramesPerSecond = 120
    metalView.clearColor = MTLClearColor(red: 0.9921568627, green: 0.9882352941, blue: 0.9843137255, alpha: 1.0) // Off white
    metalView.sampleCount = MSAA
    
    metalView.depthStencilPixelFormat = MTLPixelFormat.depth32Float
    metalView.clearDepth = 0.0

  }
  
  private func createBuffers(){
    // Buffer for 10000 verts, and 10000 indexes
    let count = 200000
    vertexBuffer = device.makeBuffer(length: count * MemoryLayout<Vertex>.stride, options: [])
    indexBuffer = device.makeBuffer(length: count*MemoryLayout<UInt16>.size, options: [])
    
    // Compute
    var bytes: [Float] = []
    for i in 0..<10000 {
      bytes.append(Float(i))
    }
    pointBuffer = device.makeBuffer(length: count * MemoryLayout<Vertex>.stride, options: [])
    pointVertexBuffer = device.makeBuffer(length: count * MemoryLayout<Vertex>.stride, options: [])
  }

  private func createPipelineState(){
    /* LOAD SHADERS */
    let library = device.makeDefaultLibrary()
    let vertexFunction = library?.makeFunction(name: "vertex_shader")
    let fragmentFunction = library?.makeFunction(name: "fragment_shader")

    /* RENDER PIPELINE */
    let pipelineDescriptor = MTLRenderPipelineDescriptor()
    pipelineDescriptor.vertexFunction = vertexFunction
    pipelineDescriptor.fragmentFunction = fragmentFunction
    pipelineDescriptor.colorAttachments[0].pixelFormat = .bgra8Unorm // Default pixel format
    pipelineDescriptor.rasterSampleCount = MSAA

    // Create vertex descriptor
    let vertexDescriptor = MTLVertexDescriptor()
    vertexDescriptor.attributes[0].format = .float4
    vertexDescriptor.attributes[0].offset = 0
    vertexDescriptor.attributes[0].bufferIndex = 0
    
    vertexDescriptor.attributes[1].format = .float4
    vertexDescriptor.attributes[1].offset = MemoryLayout<SIMD4<Float>>.stride
    vertexDescriptor.attributes[1].bufferIndex = 0
    
    vertexDescriptor.layouts[0].stride = MemoryLayout<Vertex>.stride
    
    pipelineDescriptor.vertexDescriptor = vertexDescriptor
    
    // Settings for alpha blending
    pipelineDescriptor.colorAttachments[0].isBlendingEnabled           = true;
    pipelineDescriptor.colorAttachments[0].rgbBlendOperation           = MTLBlendOperation.add
    pipelineDescriptor.colorAttachments[0].alphaBlendOperation         = MTLBlendOperation.add;
    pipelineDescriptor.colorAttachments[0].sourceRGBBlendFactor        = MTLBlendFactor.sourceAlpha;
    pipelineDescriptor.colorAttachments[0].sourceAlphaBlendFactor      = MTLBlendFactor.sourceAlpha;
    pipelineDescriptor.colorAttachments[0].destinationRGBBlendFactor   = MTLBlendFactor.oneMinusSourceAlpha;
    pipelineDescriptor.colorAttachments[0].destinationAlphaBlendFactor = MTLBlendFactor.oneMinusSourceAlpha;
    
    // Settings for depth buffer
    pipelineDescriptor.depthAttachmentPixelFormat = MTLPixelFormat.depth32Float

    // Create Pipeline
    do {
      pipelineState = try device.makeRenderPipelineState(descriptor: pipelineDescriptor)
    } catch let error as NSError {
      print("error: \(error.localizedDescription)")
    }
    
    /* DEPTH BUFFER */
    let depthDescriptor = MTLDepthStencilDescriptor()
    depthDescriptor.depthCompareFunction = MTLCompareFunction.greaterEqual
    depthDescriptor.isDepthWriteEnabled = true
    depthState = device.makeDepthStencilState(descriptor: depthDescriptor)
    
    
    
    /* COMPUTE PIPELINE */
    // Get Compute function
    let geometryGPUFunction = library?.makeFunction(name: "compute_line_geometry")
    
    do {
      computePipelineState = try device.makeComputePipelineState(function: geometryGPUFunction!)
    } catch let error as NSError {
      print("error: \(error.localizedDescription)")
    }
  }
  
  func createSamplerState(){
    let descriptor = MTLSamplerDescriptor()
    descriptor.minFilter = .linear
    descriptor.magFilter = .linear
    samplerState = device.makeSamplerState(descriptor: descriptor)
  }
  
  // TEXTURE STUFF
  func loadTextures(){
    loadTextureResource("Eraser.png") // 0
    loadTextureResource("Select.png") // 1
    
    loadTextureResource("Close.png") // 2
    loadTextureResource("Simplify.png") // 3
    loadTextureResource("Trash.png") // 4
    
    loadTextureResource("Line.png") // 5
    loadTextureResource("Curve.png") // 6
    loadTextureResource("Circle.png") // 7
    loadTextureResource("Square.png") // 8
    
    loadTextureResource("Line_Selected.png") // 9
    loadTextureResource("Curve_Selected.png") // 10
    loadTextureResource("Circle_Selected.png") // 11
    loadTextureResource("Square_Selected.png") // 12
    
//    textures.append(loadTextureFile("happy-tree.png")!)
//    textures.append(loadTextTexture()!)
  }
  
  func loadTextureResource(_ path: String) -> RenderImage? {
    let textureLoader = MTKTextureLoader(device: device)
    
    if let textureURL = Bundle.main.url(forResource: path, withExtension: nil) {
      do {
        let texture = try textureLoader.newTexture(URL: textureURL, options: [:])
        
        textures.append(texture)
        return RenderImage(  texture_id: textures.count - 1,
                             width: texture.width,
                             height: texture.height
        )
      } catch {
        print("couldn't load texture")
      }
    } else {
      print("couldn't load construct url")
    }
    
    return nil
  }
  
  func loadTextureFile(_ path: String) -> RenderImage? {
    let textureLoader = MTKTextureLoader(device: device)
    
    if let textureURL = URL(string: path) {
      do {
        let texture = try textureLoader.newTexture(URL: textureURL, options: [:])
        
        textures.append(texture)
        return RenderImage(  texture_id: textures.count - 1,
                             width: texture.width,
                             height: texture.height
        )
          
      } catch {
        print("couldn't load texture")
      }
    } else {
      print("couldn't load construct url")
    }
    
    return nil
  }
  
  func loadTextTexture() -> MTLTexture? {
    let textImage = CIFilter(name: "CITextImageGenerator", parameters: [
        "inputText": "Hello World! \nHow are you?",
        "inputFontName": "HelveticaNeue",
        "inputFontSize": 40,
        "inputScaleFactor": 2.0
    ])!.outputImage!
    
    dump(textImage.extent)
    
    var texture: MTLTexture? = nil
    let textureLoader = MTKTextureLoader(device: device)
    do {
      if let convertedImage = convertCIImageToCGImage(textImage) {
        dump(convertedImage.bitmapInfo)
        texture = try textureLoader.newTexture(cgImage: convertedImage, options: nil);
      } else {
        print("couldn't load texture")
      }
      
    } catch {
      print("couldn't load texture")
    }
    
    
    return texture
  }
  
  func convertCIImageToCGImage(_ inputImage: CIImage) -> CGImage? {
      let context = CIContext(options: nil)
      if let cgImage = context.createCGImage(inputImage, from: inputImage.extent) {
          return cgImage
      }
      return nil
  }
  
  
  
  // API
  // Reset the buffer
  public func clearBuffer(){
    vertexBufferSize = 0;
    indexBufferSize = 0;
    pointBufferSize = 0;
  }

  // Copy new elements into buffer
  // TODO auto grow buffer size if we overflow
  public func addShapeData(_ shape: RenderShape) {
    // Copy verts
    let vertexByteOffset = MemoryLayout<Vertex>.stride * vertexBufferSize
    (vertexBuffer.contents() + vertexByteOffset).copyMemory(from: shape.verts, byteCount: shape.verts.count * MemoryLayout<Vertex>.stride)
    
    
    
    // Offset indicies by bufferSize
    let indices = shape.indices.map { $0 + UInt16(vertexBufferSize) }
    
    // Copy indicies
    let indexByteOffset = MemoryLayout<UInt16>.stride * indexBufferSize
    (indexBuffer.contents() + indexByteOffset).copyMemory(from: indices, byteCount: indices.count * MemoryLayout<UInt16>.stride)
    
    
    // Increase buffer sizes
    vertexBufferSize += shape.verts.count
    indexBufferSize += shape.indices.count
  }
  
//  public func loadStrokes(data: [Vertex]) {
//    pointBuffer.contents().copyMemory(from: data, byteCount: data.count * MemoryLayout<Vertex>.stride)
//    pointBufferSize = data.count
//  }
  
  public func addStrokeData(_ data: [Vertex]) {
    let byteOffset = MemoryLayout<Vertex>.stride * pointBufferSize
    (pointBuffer.contents() + byteOffset).copyMemory(from: data, byteCount: data.count * MemoryLayout<Vertex>.stride)
    pointBufferSize += data.count
  }
  
}

extension Renderer: MTKViewDelegate {
  func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {}
  
  // This function is called every frame
  func draw(in view: MTKView) {
    guard let drawable = view.currentDrawable,
          let descriptor = view.currentRenderPassDescriptor else {
            return
          }
    
    viewRef.update()
    
    // Prepare commandBuffer
    let commandBuffer = commandQueue.makeCommandBuffer()!
    
    /* Compute Pass */
    if(pointBufferSize > 2) {
      let computeCommandEncoder = commandBuffer.makeComputeCommandEncoder()!
      computeCommandEncoder.setComputePipelineState(computePipelineState)
      
      computeCommandEncoder.setBuffer(pointBuffer, offset: 0, index: 0)
      computeCommandEncoder.setBuffer(pointVertexBuffer, offset: 0, index: 1)
      
      let threadsPerGrid = MTLSize(width: pointBufferSize-1, height: 1, depth: 1)
      let maxThreadsPerThreadGroup = computePipelineState.maxTotalThreadsPerThreadgroup
      let threadsPerThreadGroup = MTLSize(width: maxThreadsPerThreadGroup, height: 1, depth: 1)
      computeCommandEncoder.dispatchThreads(threadsPerGrid, threadsPerThreadgroup: threadsPerThreadGroup)
      
      computeCommandEncoder.endEncoding()
    }
    
    /* Render Pass */
    let commandEncoder = commandBuffer.makeRenderCommandEncoder(descriptor: descriptor)!
    commandEncoder.setRenderPipelineState(pipelineState)
    commandEncoder.setDepthStencilState(depthState)

    commandEncoder.setVertexBytes(&constants, length: MemoryLayout<Constants>.stride, index: 1)

    // Load texture information
    commandEncoder.setFragmentTextures(textures, range: 0..<textures.count)
    commandEncoder.setFragmentSamplerState(samplerState, index: 0)
    

    
    // Draw shapes
    if indexBufferSize > 0 {
      // Load vertext buffer
      commandEncoder.setVertexBuffer(vertexBuffer, offset: 0, index: 0)
      commandEncoder.drawIndexedPrimitives(type: .triangle, indexCount: indexBufferSize, indexType: .uint16, indexBuffer: indexBuffer, indexBufferOffset: 0)
    }
    
    // Draw lines
    if pointBufferSize>2 {
      commandEncoder.setVertexBuffer(pointVertexBuffer, offset: 0, index: 0)
      commandEncoder.drawPrimitives(type: MTLPrimitiveType.triangleStrip, vertexStart: 0, vertexCount: pointBufferSize*2-2)
    }
    
    commandEncoder.endEncoding()
    
    // Wrap up and commit commandBuffer
    commandBuffer.present(drawable)
    commandBuffer.commit()
    
  }
}
