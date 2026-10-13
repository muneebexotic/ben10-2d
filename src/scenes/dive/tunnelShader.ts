/**
 * THE DEEP DIVE's tunnel, ray-traced per pixel: a timber-framed haulage way
 * with three tracks, seen from a camera behind the cart. Each pixel's ray
 * hits the floor, the ceiling or a wall (the walls bend with the track:
 * x = +-W + uBend * z^2, solved in two steps). Surfaces are procedural:
 * gravel, sleepers and rails on the floor; rock, timber posts every 4 m and
 * crystal veins (more of them the deeper the cart gets) on the walls; a
 * lantern every 8 m. Gaps cut the floor; past the trestle the tunnel opens
 * into the glowing crystal cavern. Colours are posterised and dithered into
 * the game's pixel-art palette.
 *
 * Projection matches `project()` in DiveView.ts exactly, so sprites sit on it.
 */
export const TUNNEL_FRAG = `#version 100
#pragma phaserTemplate(shaderName)
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 outTexCoord;
uniform vec2 uRes;
uniform float uTravel;
uniform float uYaw;
uniform vec2 uCam;
uniform float uBend;
uniform float uCavern;
uniform float uDepth;
uniform float uTime;
uniform vec4 uGaps;
uniform float uTrestle;
uniform float uFlash;
uniform float uLamp;
uniform float uPixel;

const float W = 1.6;
const float FLOOR_Y = -1.0;
const float CEIL_Y = 1.15;
const float FOCAL = 1.25;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
bool inGap(float z) {
  return (z >= uGaps.x && z < uGaps.y) || (z >= uGaps.z && z < uGaps.w);
}

void main() {
  vec2 frag = floor(outTexCoord * uRes / uPixel) * uPixel + uPixel * 0.5;
  vec2 p = (frag - 0.5 * uRes) / (0.5 * uRes.y);
  vec3 d = normalize(vec3(p.x, p.y, FOCAL));
  float cy = cos(uYaw);
  float sy = sin(uYaw);
  d = vec3(d.x * cy + d.z * sy, d.y, -d.x * sy + d.z * cy);
  vec3 o = vec3(uCam.x, uCam.y, 0.0);

  float tF = d.y < 0.0 ? (FLOOR_Y - o.y) / d.y : 1e4;
  float tC = d.y > 0.0 ? (CEIL_Y - o.y) / d.y : 1e4;
  float tW = 1e4;
  float side = d.x > 0.0 ? 1.0 : -1.0;
  if (abs(d.x) > 0.0001) {
    float tz = 6.0;
    for (int i = 0; i < 3; i++) {
      float z = max(0.0, o.z + d.z * tz);
      float wx = side * W + uBend * z * z;
      tz = (wx - o.x) / d.x;
    }
    if (tz > 0.0) tW = tz;
  }
  // The cavern: past the trestle the tunnel falls away into open space.
  float open = 0.0;
  float t = min(tF, min(tC, tW));
  vec3 h = o + d * t;
  float zw = h.z + uTravel;
  if (zw > uTrestle) {
    open = 1.0;
    t = 1e4;
  }

  vec3 col = vec3(0.0);
  float glow = 0.0;
  float bend = uBend * h.z * h.z;
  if (open < 0.5) {
    float post = fract(zw / 4.0);
    if (t == tF) {
      float u = h.x - bend;
      if (inGap(zw)) {
        col = vec3(0.01, 0.01, 0.02);
      } else {
        float near = 1.0 / (1.0 + t * 0.25);
        float g = noise(vec2(u * 7.0, zw * 7.0)) * near;
        col = vec3(0.15, 0.12, 0.10) + g * 0.06;
        for (int k = 0; k < 3; k++) {
          float lane = (float(k) - 1.0) * 1.05;
          float du = abs(u - lane);
          if (du < 0.42 && fract(zw * 1.6) < 0.22) col = vec3(0.24, 0.16, 0.09) + g * 0.04;
          if (abs(du - 0.3) < 0.028) col = vec3(0.42, 0.42, 0.5) + 0.18 * step(0.75, fract(zw * 0.5 + u));
        }
      }
    } else if (t == tC) {
      float u = h.x - bend;
      float r = noise(vec2(u * 3.0, zw * 2.0));
      col = vec3(0.10, 0.09, 0.12) + r * 0.06;
      if (post < 0.07) col = vec3(0.28, 0.18, 0.10);
    } else {
      float v = h.y;
      float near = 1.0 / (1.0 + t * 0.25);
      float r = noise(vec2(zw * 1.3, v * 2.6)) * 0.7 + noise(vec2(zw * 4.0, v * 7.0)) * 0.3 * near;
      col = vec3(0.13, 0.11, 0.14) + r * 0.08;
      if (post < 0.07) col = vec3(0.30, 0.19, 0.11) + r * 0.04;
      // Crystal studs: diamond-shaped crystals growing out of the rock, more of them the deeper the cart is.
      vec2 cellUv = vec2(zw / 1.4, v / 0.45 + side * 13.0);
      vec2 cell = floor(cellUv);
      vec2 local = fract(cellUv) - 0.5;
      float hc = hash(cell);
      float size = (hc - 0.86 + uDepth * 0.1) * 3.2;
      float diamond = abs(local.x) * 1.1 + abs(local.y) * 1.9;
      if (size > 0.0 && diamond < size && post >= 0.07) {
        col = mix(vec3(0.15, 0.5, 0.75), vec3(0.8, 0.98, 1.0), clamp(1.0 - diamond / size + local.y, 0.0, 1.0));
        glow = 0.7;
      }
    }
    // Lighting: the cart's headlamp, a lantern every 8 m near the ceiling, a little ambient.
    float lamp = uLamp / (1.0 + t * t * 0.05);
    float lz = floor(zw / 8.0) * 8.0 + 4.0;
    float dz = zw - lz;
    float lantern = 1.1 / (1.0 + dz * dz * 0.35);
    vec3 light = vec3(0.12) + lamp * vec3(1.0, 0.95, 0.85) + lantern * vec3(1.0, 0.7, 0.4) * (0.4 + 0.6 * smoothstep(-0.2, 1.0, h.y));
    col = col * light + col * glow * 1.4;
    // The lantern itself: a hot spot on the ceiling.
    if (t == tC && abs(dz) < 0.25 && abs(h.x - bend) < 0.18) col = vec3(1.0, 0.85, 0.5);
  }

  // Fog toward the dark, or toward the cavern's glow at the end.
  vec3 fogCol = mix(vec3(0.015, 0.012, 0.03), vec3(0.08, 0.32, 0.45), uCavern);
  float fog = 1.0 - exp(-t * (0.085 - uCavern * 0.04));
  col = mix(col, fogCol, clamp(fog, 0.0, 1.0));
  if (open > 0.5) {
    // The crystal cavern: a deep glow, and stars of crystal.
    float s = hash(floor(vec2(atan(d.x, d.z) * 90.0, d.y * 90.0)));
    col = mix(vec3(0.03, 0.12, 0.2), vec3(0.2, 0.7, 0.9), clamp(0.5 - d.y, 0.0, 1.0) * uCavern);
    if (s > 0.985) col += vec3(0.7, 0.95, 1.0) * (0.5 + 0.5 * sin(uTime * 3.0 + s * 50.0));
  }
  col += vec3(uFlash * 0.45, 0.0, 0.0);
  // Posterise with an ordered dither: the game's pixel palette.
  float dither = (hash(floor(frag / uPixel)) - 0.5) * 0.035;
  col = floor((col + dither) * 16.0 + 0.5) / 16.0;
  gl_FragColor = vec4(col, 1.0);
}
`;
