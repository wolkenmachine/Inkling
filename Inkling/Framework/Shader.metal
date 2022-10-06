//
//  Shader.metal
//  Inkling
//
//  Created by Marcel on 18/08/2022.
//

#include <metal_stdlib>
using namespace metal;

struct Constants {
  float screen_width;
  float screen_height;
};

struct VertexIn {
  float4 position [[ attribute(0) ]];
  float4 color [[ attribute(1) ]];
};

struct VertexOut {
  float4 position [[ position ]];
  float4 color;
};

// VERTEX SHADER
vertex VertexOut vertex_shader(const VertexIn vertexIn [[ stage_in ]],
                               constant Constants &constants [[buffer(1)]]) {
  
  float4 position = float4(vertexIn.position.x, vertexIn.position.y, vertexIn.position.z, 1);
  //float4 position = vertexIn.position;
  position.x = (position.x / constants.screen_width)* 2 - 1;
  position.y = -((position.y / constants.screen_height)* 2 - 1);
  
  VertexOut vertexOut;
  vertexOut.position = position;
  vertexOut.color = vertexIn.color;
  
  return vertexOut;
}

// FRAGMENT SHADER
//fragment half4 fragment_shader(VertexOut vertexIn [[ stage_in ]], texture2d<float> texture [[ texture (0) ]]) {
fragment half4 fragment_shader(VertexOut vertexIn [[ stage_in ]],
                               sampler sampler2d [[ sampler(0) ]],
                               array<texture2d<float, access::sample>, 100> texture [[texture(0)]]) {
  
  // If the red color is negative then try to sample a texture instead
  if (vertexIn.color.r < 0.0) {
    float2 uv = float2(vertexIn.color.b, vertexIn.color.a);
    float4 color = texture[vertexIn.color.g].sample(sampler2d, uv);
    return half4(color.r, color.g, color.b, color.a);
    
  } else {
    
    return half4(vertexIn.color.r, vertexIn.color.g, vertexIn.color.b, vertexIn.color.a);
  }
}

