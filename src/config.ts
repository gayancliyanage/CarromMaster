import Phaser from 'phaser';

// Game dimensions (will scale to fit screen)
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 800;

// Board dimensions
export const BOARD_SIZE = 700;
export const BOARD_MARGIN = 50;
export const POCKET_RADIUS = 25;
export const PIECE_RADIUS = 15;
export const STRIKER_RADIUS = 20;
export const QUEEN_RADIUS = 15;

// Physics settings
export const FRICTION = 0.05;
export const FRICTION_AIR = 0.02;
export const RESTITUTION = 0.8; // Bounciness
export const STRIKER_MAX_POWER = 25;

// Colors
export const COLORS = {
  board: 0xdeb887,        // Burlywood (traditional carrom board)
  boardBorder: 0x8b4513,  // Saddle brown
  pocket: 0x2d2d2d,       // Dark gray
  whitePiece: 0xffffff,   // White
  blackPiece: 0x1a1a1a,   // Black
  queen: 0xff4444,        // Red
  striker: 0xffdd44,      // Yellow
  aimLine: 0x00ff00,      // Green
  baseline: 0x654321,     // Brown
};

// Game configuration
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 }, // Top-down view, no gravity
      debug: false,
    },
  },
  input: {
    activePointers: 1,
  },
};

// Piece positions (relative to board center)
export const INITIAL_POSITIONS = {
  // Center formation - Queen in middle, pieces around it
  queen: { x: 0, y: 0 },
  white: [
    { x: 0, y: -35 },
    { x: 35, y: 0 },
    { x: 0, y: 35 },
    { x: -35, y: 0 },
    { x: 25, y: -25 },
    { x: 25, y: 25 },
    { x: -25, y: 25 },
    { x: -25, y: -25 },
    { x: 0, y: -70 },
  ],
  black: [
    { x: 17.5, y: -17.5 },
    { x: 17.5, y: 17.5 },
    { x: -17.5, y: 17.5 },
    { x: -17.5, y: -17.5 },
    { x: 50, y: 0 },
    { x: -50, y: 0 },
    { x: 0, y: 50 },
    { x: 35, y: -35 },
    { x: -35, y: -35 },
  ],
};
