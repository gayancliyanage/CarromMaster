import Phaser from 'phaser';

// Game dimensions (will scale to fit screen)
export const GAME_WIDTH = 450;
export const GAME_HEIGHT = 800;

// Board dimensions
export const BOARD_SIZE = 400;
export const BOARD_MARGIN = 25;
export const POCKET_RADIUS = 18;
export const PIECE_RADIUS = 12;
export const STRIKER_RADIUS = 16;
export const QUEEN_RADIUS = 12;

// Physics settings
export const FRICTION = 0.03;
export const FRICTION_AIR = 0.015;
export const RESTITUTION = 0.85;
export const STRIKER_MAX_POWER = 22;

// Colors - Premium wooden theme (matching reference image)
export const COLORS = {
  // Background
  bgGradientTop: 0x4a2020,    // Dark maroon top
  bgGradientBottom: 0x1a0808, // Very dark maroon bottom
  
  // Board - Light natural wood tones
  board: 0xe8d4a8,            // Light warm wood
  boardLight: 0xf0deb8,       // Lighter wood grain
  boardDark: 0x8b6914,        // Golden brown for lines
  boardBorder: 0x8b6914,      // Golden border lines
  boardFrame: 0xc9a227,       // Golden frame
  boardFrameDark: 0x8b6914,   // Darker gold for depth
  boardFrameLight: 0xdbb84d,  // Lighter gold highlight
  
  // Pockets
  pocket: 0x1a0f08,           // Very dark hole
  pocketRing: 0x3d2817,       // Dark wood ring
  pocketHighlight: 0x5c4030,  // Lighter ring edge
  
  // Pieces
  whitePiece: 0xf5f5f5,       // Clean white
  whitePieceRing: 0xd0d0d0,   // Gray ring
  blackPiece: 0x1a1a1a,       // Pure black
  blackPieceRing: 0x333333,   // Dark gray ring
  queen: 0xdc3545,            // Red queen
  queenRing: 0xb02a37,        // Darker red ring
  
  // Striker
  striker: 0xfff9e6,          // Cream white striker
  strikerRing: 0xc9a227,      // Golden ring
  strikerPattern: 0x8b6914,   // Golden pattern
  
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
  backgroundColor: '#1a0808',
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
