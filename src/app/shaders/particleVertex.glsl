uniform float uTime;
uniform float uPixelRatio;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uDeformation;

attribute float aSize;
attribute float aBrightness;
attribute float aFormation;
attribute float aPhase;
attribute float aLayer;
attribute vec3 aOriginalPosition;
attribute float aSpeed;

varying float vBrightness;
varying float vDist;

// Simple noise functions
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y * 57.0 + i.z * 113.0;
  return mix(
    mix(mix(hash(n), hash(n + 1.0), f.x),
        mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
    mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
        mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y),
    f.z
  );
}

void main() {
  vec3 pos = aOriginalPosition;

  // Time-based drift using layered noise
  float t = uTime * 0.08 * aSpeed;
  float noiseScale = 0.35;

  float nx = noise(vec3(pos.x * noiseScale + t, pos.y * noiseScale * 0.7, pos.z * noiseScale + aPhase));
  float ny = noise(vec3(pos.y * noiseScale + t * 0.8 + 3.7, pos.z * noiseScale, pos.x * noiseScale + aPhase + 1.3));
  float nz = noise(vec3(pos.z * noiseScale + t * 0.6 + 7.1, pos.x * noiseScale, pos.y * noiseScale + aPhase + 2.7));

  float driftAmount = 0.8 + aLayer * 0.4;
  pos.x += (nx - 0.5) * driftAmount;
  pos.y += (ny - 0.5) * driftAmount;
  pos.z += (nz - 0.5) * driftAmount;

  // Time Flow — directional currents
  float flowAngle = hash(aPhase * 3.17) * 6.2831;
  float flowSpeed = 0.015 * aSpeed;
  float flowT = uTime * flowSpeed + aPhase * 10.0;
  pos.x += sin(flowT + flowAngle) * 1.2;
  pos.y += cos(flowT * 0.7 + flowAngle * 1.3) * 0.9;
  pos.z += sin(flowT * 0.5 + aPhase) * 0.6;

  // Mouse gravitational deformation
  vec2 mouseInfluence = uMouse * 8.0;
  float distToMouse = length(pos.xy - mouseInfluence);
  float deformRadius = 6.0;
  float deformFactor = max(0.0, 1.0 - distToMouse / deformRadius);
  deformFactor = pow(deformFactor, 2.0) * uDeformation;

  // Elastic stretch toward mouse direction
  vec2 toMouse = normalize(mouseInfluence - pos.xy + vec2(0.001));
  pos.xy += toMouse * deformFactor * 1.5 * (aLayer + 0.5);

  // Layer-based parallax
  float parallaxStrength = (aLayer + 0.5) * 0.3;
  pos.x += uMouse.x * parallaxStrength;
  pos.y += uMouse.y * parallaxStrength * 0.6;

  // Breathing effect
  float breathe = sin(uTime * 0.15 + aPhase * 6.28) * 0.02 + 1.0;
  pos *= breathe;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDist = -mvPosition.z;

  // Twinkling
  float twinkle = sin(uTime * 1.5 + aPhase * 13.7) * 0.25 + 0.75;
  vBrightness = aBrightness * twinkle;

  // Size by layer (closer = bigger)
  float layerScale = 0.4 + aLayer * 0.6;
  gl_PointSize = aSize * uPixelRatio * layerScale * (280.0 / -mvPosition.z);
  gl_PointSize = clamp(gl_PointSize, 0.4, 3.5);

  gl_Position = projectionMatrix * mvPosition;
}
