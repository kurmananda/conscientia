import type { WheelItem } from "../components/three/WorkshopWheel";

const COLORS = [
  "#33d6ff", "#a855f7", "#f59e0b", "#ef4444",
  "#10b981", "#ec4899", "#6366f1", "#0ea5e9",
  "#06b6d4", "#eab308", "#14b8a6", "#f43f5e",
];

const TITLES = [
  "Code Combat", "Tech Talk Series", "Hackathon", "Robo War",
  "Innovation Expo", "Cultural Night", "Paper Presentation", "Gaming Arena",
  "Quiz Bowl", "Startup Pitchfest", "Workshop Showcase", "Networking Mixer",
];

const TYPES = [
  "Competition", "Talks", "Build Sprint", "Robotics",
  "Exhibition", "Cultural", "Research", "Gaming",
  "Quiz", "Pitch", "Showcase", "Networking",
];

const SLUGS = [
  "code-combat", "tech-talks", "hackathon", "robo-war",
  "innovation-expo", "cultural-night", "paper-presentation", "gaming-arena",
  "quiz-bowl", "pitchfest", "showcase", "mixer",
];

const TILE_PATHS = [
  "/tiles/tile-01.jpg",
  "/tiles/tile-02.jpg",
  "/tiles/tile-03.jpg",
  "/tiles/tile-04.jpg",
  "/tiles/tile-05.jpeg",
  "/tiles/tile-06.jpg",
  "/tiles/tile-07.jpg",
  "/tiles/tile-08.jpg",
];

const IMG_URLS = Array.from({ length: 12 }, (_, i) => TILE_PATHS[i % TILE_PATHS.length]);

export const eventWheelItems: WheelItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: SLUGS[i],
  title: TITLES[i],
  type: TYPES[i],
  color: COLORS[i],
  imageUrl: IMG_URLS[i],
}));
