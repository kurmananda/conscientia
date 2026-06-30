uniform float uTime;

varying float vBrightness;
varying float vDist;

void main() {
  // Circular soft disc
  vec2 uv = gl_PointCoord - vec2(0.5);
  float dist = length(uv);
  if (dist > 0.5) discard;

  // Soft edge falloff
  float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
  alpha = pow(alpha, 1.6);

  // Bloom core — bright center
  float core = 1.0 - smoothstep(0.0, 0.18, dist);
  float bloom = 1.0 - smoothstep(0.0, 0.45, dist);

  // Color — electric cyan with soft white core
  vec3 cyanDeep   = vec3(0.0,  0.898, 1.0);    // #00E5FF
  vec3 cyanSoft   = vec3(0.424, 0.984, 1.0);    // #6CFBFF
  vec3 white      = vec3(1.0,  1.0,   1.0);

  // Mix based on brightness level
  vec3 color = mix(cyanDeep, cyanSoft, vBrightness);
  color = mix(color, white, core * vBrightness * 0.7);

  // Subtle depth fade
  float depthFade = clamp(1.0 - (vDist - 5.0) / 40.0, 0.3, 1.0);

  float finalAlpha = alpha * vBrightness * depthFade * (0.55 + bloom * 0.45);
  finalAlpha = clamp(finalAlpha, 0.0, 1.0);

  gl_FragColor = vec4(color, finalAlpha);
}
