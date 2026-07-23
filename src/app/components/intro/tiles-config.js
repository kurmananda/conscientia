/**
 * Tile Configuration
 *
 * This file defines all visual properties for each gallery tile in the intro animation.
 * To replace placeholder images with your own, simply update the `src` field on each tile.
 * To add or remove tiles, add/remove entries from this array.
 *
 * Depth layers:
 *   0 = closest  (largest scale, no blur, full brightness, most parallax)
 *   1 = middle   (medium scale, slight blur, slightly dimmed)
 *   2 = farthest (smallest scale, more blur, noticeably dimmer, least parallax)
 */

export interface TileConfig {
  /** Path to the image. Replace with your own image paths. */
  src: string;
  /** Alt text for the image */
  alt: string;
  /**
   * Tile width in viewport-relative units (vw for landscape, vh for portrait).
   * Stored as a percentage number; applied as a CSS value string at render time.
   */
  widthVw: number;
  /** Aspect ratio as a CSS string, e.g. "3/4" or "16/9" */
  aspectRatio: string;
  /**
   * Position from center of the screen in percent of viewport.
   * x=0, y=0 is perfect center.
   */
  x: number; // percent of viewport width
  y: number; // percent of viewport height
  /** Depth layer: 0 = closest, 1 = mid, 2 = farthest */
  depth: 0 | 1 | 2;
  /**
   * Initial rotation in degrees. Will be randomised slightly at runtime,
   * but this sets the "resting" angle so the layout stays balanced.
   */
  rotation: number;
  /**
   * Stagger delay offset in ms. Controls when this tile appears relative
   * to the first tile. Gives the organic, sequential reveal feel.
   */
  delay: number;
  /**
   * If true, this tile will be the one that expands to fill the screen
   * in the exit transition. Only one tile should have this set to true.
   */
  isHero?: boolean;
}

/**
 * TILE CATALOGUE
 * ─────────────────────────────────────────────────────────────────────────────
 * Images cycle through the 8 generated placeholder images.
 * Replace src values with your own images to customise the gallery.
 */
export const TILES: TileConfig[] = [
  // ── CLOSEST LAYER (depth 0) ───────────────────────────────────────────────
  {
    src: "/tiles/tile-01.jpg",
    alt: "Gallery image 1",
    widthVw: 22,
    aspectRatio: "3/4",
    x: -38,
    y: -18,
    depth: 0,
    rotation: -4,
    delay: 0,
  },
  {
    src: "/tiles/tile-05.jpeg",
    alt: "Gallery image 5",
    widthVw: 18,
    aspectRatio: "4/5",
    x: 36,
    y: 12,
    depth: 0,
    rotation: 5,
    delay: 80,
    isHero: true, // ← This tile expands on exit
  },
  {
    src: "/tiles/tile-03.jpg",
    alt: "Gallery image 3",
    widthVw: 26,
    aspectRatio: "16/9",
    x: 4,
    y: 28,
    depth: 0,
    rotation: -2,
    delay: 160,
  },
  {
    src: "/tiles/tile-07.jpg",
    alt: "Gallery image 7",
    widthVw: 16,
    aspectRatio: "2/3",
    x: -14,
    y: -30,
    depth: 0,
    rotation: 3,
    delay: 240,
  },

  // ── MIDDLE LAYER (depth 1) ────────────────────────────────────────────────
  {
    src: "/tiles/tile-02.jpg",
    alt: "Gallery image 2",
    widthVw: 20,
    aspectRatio: "4/3",
    x: 18,
    y: -24,
    depth: 1,
    rotation: -6,
    delay: 120,
  },
  {
    src: "/tiles/tile-06.jpg",
    alt: "Gallery image 6",
    widthVw: 24,
    aspectRatio: "3/2",
    x: -22,
    y: 22,
    depth: 1,
    rotation: 4,
    delay: 200,
  },
  {
    src: "/tiles/tile-04.jpg",
    alt: "Gallery image 4",
    widthVw: 15,
    aspectRatio: "1/1",
    x: 44,
    y: -8,
    depth: 1,
    rotation: -3,
    delay: 280,
  },
  {
    src: "/tiles/tile-08.jpg",
    alt: "Gallery image 8",
    widthVw: 18,
    aspectRatio: "5/4",
    x: -46,
    y: 10,
    depth: 1,
    rotation: 2,
    delay: 320,
  },
  {
    src: "/tiles/tile-01.jpg",
    alt: "Gallery image 9",
    widthVw: 14,
    aspectRatio: "2/3",
    x: 8,
    y: -34,
    depth: 1,
    rotation: -5,
    delay: 360,
  },
  {
    src: "/tiles/tile-03.jpg",
    alt: "Gallery image 10",
    widthVw: 17,
    aspectRatio: "3/4",
    x: 54,
    y: 28,
    depth: 1,
    rotation: 6,
    delay: 400,
  },

  // ── FARTHEST LAYER (depth 2) ──────────────────────────────────────────────
  {
    src: "/tiles/tile-06.jpg",
    alt: "Gallery image 11",
    widthVw: 16,
    aspectRatio: "16/9",
    x: -54,
    y: -32,
    depth: 2,
    rotation: 3,
    delay: 180,
  },
  {
    src: "/tiles/tile-02.jpg",
    alt: "Gallery image 12",
    widthVw: 14,
    aspectRatio: "4/3",
    x: 28,
    y: 36,
    depth: 2,
    rotation: -4,
    delay: 260,
  },
  {
    src: "/tiles/tile-05.jpeg",
    alt: "Gallery image 13",
    widthVw: 12,
    aspectRatio: "1/1",
    x: -30,
    y: -38,
    depth: 2,
    rotation: 5,
    delay: 340,
  },
  {
    src: "/tiles/tile-07.jpg",
    alt: "Gallery image 14",
    widthVw: 15,
    aspectRatio: "3/4",
    x: 62,
    y: -18,
    depth: 2,
    rotation: -2,
    delay: 420,
  },
  {
    src: "/tiles/tile-08.jpg",
    alt: "Gallery image 15",
    widthVw: 13,
    aspectRatio: "2/3",
    x: -62,
    y: 24,
    depth: 2,
    rotation: 4,
    delay: 460,
  },
  {
    src: "/tiles/tile-04.jpg",
    alt: "Gallery image 16",
    widthVw: 11,
    aspectRatio: "4/5",
    x: -6,
    y: 38,
    depth: 2,
    rotation: -6,
    delay: 500,
  },
];

/**
 * Per-depth visual multipliers.
 * Adjust to tune the 3-D feel without touching individual tiles.
 */
export const DEPTH_STYLES = {
  0: { scale: 1.0, blur: 0, brightness: 1.0, parallaxFactor: 1.0 },
  1: { scale: 0.82, blur: 0.8, brightness: 0.82, parallaxFactor: 0.55 },
  2: { scale: 0.66, blur: 2.0, brightness: 0.62, parallaxFactor: 0.25 },
} as const;
