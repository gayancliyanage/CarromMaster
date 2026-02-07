import Phaser from 'phaser';

// Game dimensions (will scale to fit screen)
export const GAME_WIDTH = 450;
export const GAME_HEIGHT = 800;

// Board dimensions
export const BOARD_SIZE = 400;
export const BOARD_MARGIN = 25;
export const POCKET_RADIUS = 22;
export const PIECE_RADIUS = 12;
export const STRIKER_RADIUS = 16;
export const QUEEN_RADIUS = 12;

// Physics settings
export const FRICTION = 0.03;
export const FRICTION_AIR = 0.015;
export const RESTITUTION = 0.85;
export const STRIKER_MAX_POWER = 22;

// Colors - Premium theme
export const COLORS = {
  // Background
  bgGradientTop: 0x6b2d7b,    // Purple top
  bgGradientBottom: 0x1a0a2e, // Dark purple bottom
  
  // Board
  board: 0xd4a574,            // Light wood
  boardDark: 0xb8956a,        // Darker wood grain
  boardBorder: 0xc9a227,      // Gold border
  boardFrame: 0x2d1810,       // Dark wood frame
  
  // Pockets
  pocket: 0x1a1a1a,           // Black pocket
  pocketRing: 0xffd700,       // Gold ring around pocket
  pocketHighlight: 0xffeb3b,  // Yellow highlight
  
  // Pieces
  whitePiece: 0xfff8e7,       // Cream white
  whitePieceRing: 0xe8dcc8,   // Darker ring
  blackPiece: 0x2d2d2d,       // Dark gray
  blackPieceRing: 0x1a1a1a,   // Darker ring
  queen: 0xdc3545,            // Red
  queenRing: 0xb02a37,        // Darker red ring
  
  // Striker
  striker: 0xffffff,          // White striker
  strikerRing: 0xdc3545,      // Red ring
  strikerStar: 0xdc3545,      // Red star
  
  // UI
  aimLine: 0x00ff88,
  sliderTrack: 0x8b5a2b,
  sliderThumb: 0xffffff,
  textPrimary: 0xffffff,
  textSecondary: 0xaaaaaa,
  coinGold: 0xffd700,
};

// Game configuration
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a0a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  input: {
    activePointers: 2,
  },
};

// Piece positions - Hexagonal flower pattern like in the reference
export const INITIAL_POSITIONS = {
  queen: { x: 0, y: 0 },
  // Inner ring (6 pieces alternating)
  innerRing: [
    { x: 0, y: -26, color: 'white' },
    { x: 22.5, y: -13, color: 'black' },
    { x: 22.5, y: 13, color: 'white' },
    { x: 0, y: 26, color: 'black' },
    { x: -22.5, y: 13, color: 'white' },
    { x: -22.5, y: -13, color: 'black' },
  ],
  // Outer ring (12 pieces alternating)
  outerRing: [
    { x: 0, y: -52, color: 'white' },
    { x: 26, y: -45, color: 'black' },
    { x: 45, y: -26, color: 'white' },
    { x: 52, y: 0, color: 'black' },
    { x: 45, y: 26, color: 'white' },
    { x: 26, y: 45, color: 'black' },
    { x: 0, y: 52, color: 'white' },
    { x: -26, y: 45, color: 'black' },
    { x: -45, y: 26, color: 'white' },
    { x: -52, y: 0, color: 'black' },
    { x: -45, y: -26, color: 'white' },
    { x: -26, y: -45, color: 'black' },
  ],
};
