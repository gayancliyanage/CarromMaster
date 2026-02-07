import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  BOARD_SIZE,
  POCKET_RADIUS,
  PIECE_RADIUS,
  STRIKER_RADIUS,
  COLORS,
  FRICTION,
  FRICTION_AIR,
  RESTITUTION,
  STRIKER_MAX_POWER,
  INITIAL_POSITIONS,
} from '../config';

interface Piece extends MatterJS.BodyType {
  gameData?: {
    type: 'white' | 'black' | 'queen' | 'striker';
    pocketed: boolean;
    graphics?: Phaser.GameObjects.Container;
  };
}

export class GameScene extends Phaser.Scene {
  private striker!: Piece;
  private pieces: Piece[] = [];
  private pockets: { x: number; y: number }[] = [];
  private isDragging = false;
  private isAiming = false;
  private dragStart: { x: number; y: number } | null = null;
  private aimLine!: Phaser.GameObjects.Graphics;
  private powerIndicator!: Phaser.GameObjects.Graphics;
  private currentPlayer: 'white' | 'black' = 'white';
  private whiteScore = 0;
  private blackScore = 0;
  private queenPocketed = false;
  private strikerBaseY!: number;
  private boardCenterX!: number;
  private boardCenterY!: number;
  private isStrikerMoving = false;
  private strikerSlider!: Phaser.GameObjects.Container;
  private strikerSliderX = 0;
  private sliderMinX!: number;
  private sliderMaxX!: number;
  private strikerGraphics!: Phaser.GameObjects.Container;
  private audioContext!: AudioContext;
  private boardLeft!: number;
  private boardRight!: number;
  private boardTop!: number;
  private boardBottom!: number;

  constructor() {
    super({ key: 'Game' });
  }

  create(): void {
    this.boardCenterX = GAME_WIDTH / 2;
    this.boardCenterY = GAME_HEIGHT / 2 - 30;
    this.strikerBaseY = this.boardCenterY + BOARD_SIZE / 2 - 35;

    // Calculate board boundaries (must match wall positions)
    const playArea = BOARD_SIZE - 50;
    const halfPlay = playArea / 2;
    this.boardLeft = this.boardCenterX - halfPlay + 15;
    this.boardRight = this.boardCenterX + halfPlay - 15;
    this.boardTop = this.boardCenterY - halfPlay + 15;
    this.boardBottom = this.boardCenterY + halfPlay - 15;

    // Reset game state
    this.pieces = [];
    this.whiteScore = 0;
    this.blackScore = 0;
    this.queenPocketed = false;
    this.currentPlayer = 'white';
    this.isStrikerMoving = false;

    // Initialize audio
    this.initAudio();

    // Draw background gradient
    this.createBackground();

    // Create the board
    this.createBoard();

    // Create pockets
    this.createPockets();

    // Create pieces
    this.createPieces();

    // Create striker slider
    this.createStrikerSlider();

    // Create striker
    this.createStriker();

    // Create UI elements
    this.createUI();

    // Set up input
    this.setupInput();

    // Set up collision detection
    this.setupCollisions();

    // Create aim line graphics
    this.aimLine = this.add.graphics();
    this.powerIndicator = this.add.graphics();

    // Fade in
    this.cameras.main.fadeIn(300);
  }

  private initAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  private playSound(type: 'hit' | 'pocket' | 'wall' | 'shoot'): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      switch (type) {
        case 'hit':
          // Short click sound for piece collision
          oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.1);
          break;

        case 'wall':
          // Thud sound for wall bounce
          oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
          oscillator.type = 'sine';
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.15);
          break;

        case 'pocket':
          // Satisfying drop sound
          oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
          oscillator.type = 'sine';
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.3);
          break;

        case 'shoot':
          // Whoosh sound for shooting
          oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.08);
          gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
          oscillator.type = 'triangle';
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.08);
          break;
      }
    } catch (e) {
      // Ignore audio errors
    }
  }

  private createBackground(): void {
    // Purple gradient background
    const bg = this.add.graphics();
    
    // Create gradient effect with rectangles
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(COLORS.bgGradientTop),
        Phaser.Display.Color.IntegerToColor(COLORS.bgGradientBottom),
        steps,
        i
      );
      bg.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
      bg.fillRect(0, (GAME_HEIGHT / steps) * i, GAME_WIDTH, GAME_HEIGHT / steps + 1);
    }
  }

  private createBoard(): void {
    const x = this.boardCenterX;
    const y = this.boardCenterY;
    const size = BOARD_SIZE;
    const playArea = size - 50;
    const frameWidth = 28;
    const graphics = this.add.graphics();

    // 1. Dark wood frame (outermost)
    graphics.fillStyle(COLORS.boardFrame);
    graphics.fillRoundedRect(
      x - playArea / 2 - frameWidth, 
      y - playArea / 2 - frameWidth, 
      playArea + frameWidth * 2, 
      playArea + frameWidth * 2,
      4
    );

    // 2. Main board surface (light cream wood)
    graphics.fillStyle(COLORS.board);
    graphics.fillRect(x - playArea / 2, y - playArea / 2, playArea, playArea);

    // 3. Subtle wood grain
    graphics.lineStyle(1, 0xddd5c0, 0.5);
    for (let i = 0; i < 30; i++) {
      const lineY = y - playArea / 2 + (playArea / 30) * i;
      graphics.beginPath();
      graphics.moveTo(x - playArea / 2, lineY);
      graphics.lineTo(x + playArea / 2, lineY);
      graphics.strokePath();
    }

    // 4. Outer black border line
    const outerInset = 12;
    graphics.lineStyle(2.5, 0x000000, 1);
    graphics.strokeRect(
      x - playArea / 2 + outerInset, 
      y - playArea / 2 + outerInset, 
      playArea - outerInset * 2, 
      playArea - outerInset * 2
    );

    // 5. Inner black border line
    const innerInset = 32;
    graphics.lineStyle(2, 0x000000, 1);
    graphics.strokeRect(
      x - playArea / 2 + innerInset, 
      y - playArea / 2 + innerInset, 
      playArea - innerInset * 2, 
      playArea - innerInset * 2
    );

    // 6. Red circles at corners and midpoints of inner border
    const redCircleRadius = 5;
    const cornerOffset = playArea / 2 - innerInset;
    
    // Corner red circles
    graphics.fillStyle(0xdc3545);
    graphics.fillCircle(x - cornerOffset, y - cornerOffset, redCircleRadius);
    graphics.fillCircle(x + cornerOffset, y - cornerOffset, redCircleRadius);
    graphics.fillCircle(x - cornerOffset, y + cornerOffset, redCircleRadius);
    graphics.fillCircle(x + cornerOffset, y + cornerOffset, redCircleRadius);
    
    // Midpoint red circles
    graphics.fillCircle(x, y - cornerOffset, redCircleRadius);
    graphics.fillCircle(x, y + cornerOffset, redCircleRadius);
    graphics.fillCircle(x - cornerOffset, y, redCircleRadius);
    graphics.fillCircle(x + cornerOffset, y, redCircleRadius);

    // Center design
    this.drawCenterDesign(graphics, x, y);

    // Corner lines
    this.drawCornerLines(graphics, x, y, size);

    // Baselines
    this.drawBaselines(graphics, x, y, size);

    // Create physics walls
    this.createWalls();
  }

  private drawCenterDesign(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
    // Outer circle
    graphics.lineStyle(2, 0x000000, 0.8);
    graphics.strokeCircle(x, y, 60);
    
    // Inner circle
    graphics.lineStyle(1.5, 0x000000, 0.6);
    graphics.strokeCircle(x, y, 45);

    // Draw 8-point star pattern (like real carrom)
    const outerRadius = 40;
    const innerRadius = 15;
    
    // Draw alternating red and black star points
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      const nextAngle = angle + Math.PI / 8;
      const prevAngle = angle - Math.PI / 8;
      
      // Alternate colors: red and black
      const color = i % 2 === 0 ? 0xdc3545 : 0x1a1a1a;
      graphics.fillStyle(color);
      
      graphics.beginPath();
      graphics.moveTo(x, y);
      graphics.lineTo(
        x + Math.cos(prevAngle) * innerRadius,
        y + Math.sin(prevAngle) * innerRadius
      );
      graphics.lineTo(
        x + Math.cos(angle) * outerRadius,
        y + Math.sin(angle) * outerRadius
      );
      graphics.lineTo(
        x + Math.cos(nextAngle) * innerRadius,
        y + Math.sin(nextAngle) * innerRadius
      );
      graphics.closePath();
      graphics.fillPath();
    }

    // Center red circle
    graphics.fillStyle(0xdc3545);
    graphics.fillCircle(x, y, 8);
    
    // Small black center dot
    graphics.fillStyle(0x000000);
    graphics.fillCircle(x, y, 3);
  }

  private drawCornerLines(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
    const offset = size / 2 - 50;
    const lineLength = 35;
    graphics.lineStyle(2, COLORS.boardDark, 0.5);

    // Diagonal lines pointing to corners
    const corners = [
      { cx: x - offset, cy: y - offset, angle: Math.PI * 1.25 },
      { cx: x + offset, cy: y - offset, angle: Math.PI * 1.75 },
      { cx: x - offset, cy: y + offset, angle: Math.PI * 0.75 },
      { cx: x + offset, cy: y + offset, angle: Math.PI * 0.25 },
    ];

    corners.forEach(({ cx, cy, angle }) => {
      graphics.beginPath();
      graphics.moveTo(cx, cy);
      graphics.lineTo(
        cx + Math.cos(angle) * lineLength,
        cy + Math.sin(angle) * lineLength
      );
      graphics.strokePath();
      
      // Small circles at the end
      graphics.fillStyle(COLORS.boardDark, 0.5);
      graphics.fillCircle(cx, cy, 4);
    });
  }

  private drawBaselines(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
    const baselineOffset = size / 2 - 35;
    const baselineWidth = 120;

    graphics.lineStyle(2, COLORS.boardDark, 0.6);

    // Bottom baseline (current player)
    graphics.beginPath();
    graphics.moveTo(x - baselineWidth / 2, y + baselineOffset);
    graphics.lineTo(x + baselineWidth / 2, y + baselineOffset);
    graphics.strokePath();

    // Baseline circles
    graphics.fillStyle(COLORS.boardDark, 0.6);
    graphics.fillCircle(x - baselineWidth / 2, y + baselineOffset, 5);
    graphics.fillCircle(x + baselineWidth / 2, y + baselineOffset, 5);

    // Top baseline
    graphics.beginPath();
    graphics.moveTo(x - baselineWidth / 2, y - baselineOffset);
    graphics.lineTo(x + baselineWidth / 2, y - baselineOffset);
    graphics.strokePath();

    graphics.fillCircle(x - baselineWidth / 2, y - baselineOffset, 5);
    graphics.fillCircle(x + baselineWidth / 2, y - baselineOffset, 5);
  }

  private createWalls(): void {
    const cx = this.boardCenterX;
    const cy = this.boardCenterY;
    const playArea = BOARD_SIZE - 50;
    const halfBoard = playArea / 2; // Inner edge of board
    const wallThickness = 20;
    const pocketGap = POCKET_RADIUS + 10; // Gap at corners for pockets

    const wallOptions = {
      isStatic: true,
      friction: 0.05,
      restitution: 0.85,
      label: 'wall',
    };

    // Wall segment length = side length minus corner gaps
    const sideLength = halfBoard * 2;
    const segmentLen = (sideLength - pocketGap * 2) / 2;

    // Top wall - left segment
    this.matter.add.rectangle(
      cx - segmentLen / 2 - pocketGap / 2,
      cy - halfBoard,
      segmentLen,
      wallThickness,
      wallOptions
    );
    // Top wall - right segment
    this.matter.add.rectangle(
      cx + segmentLen / 2 + pocketGap / 2,
      cy - halfBoard,
      segmentLen,
      wallThickness,
      wallOptions
    );

    // Bottom wall - left segment
    this.matter.add.rectangle(
      cx - segmentLen / 2 - pocketGap / 2,
      cy + halfBoard,
      segmentLen,
      wallThickness,
      wallOptions
    );
    // Bottom wall - right segment
    this.matter.add.rectangle(
      cx + segmentLen / 2 + pocketGap / 2,
      cy + halfBoard,
      segmentLen,
      wallThickness,
      wallOptions
    );

    // Left wall - top segment
    this.matter.add.rectangle(
      cx - halfBoard,
      cy - segmentLen / 2 - pocketGap / 2,
      wallThickness,
      segmentLen,
      wallOptions
    );
    // Left wall - bottom segment
    this.matter.add.rectangle(
      cx - halfBoard,
      cy + segmentLen / 2 + pocketGap / 2,
      wallThickness,
      segmentLen,
      wallOptions
    );

    // Right wall - top segment
    this.matter.add.rectangle(
      cx + halfBoard,
      cy - segmentLen / 2 - pocketGap / 2,
      wallThickness,
      segmentLen,
      wallOptions
    );
    // Right wall - bottom segment
    this.matter.add.rectangle(
      cx + halfBoard,
      cy + segmentLen / 2 + pocketGap / 2,
      wallThickness,
      segmentLen,
      wallOptions
    );

    // Add corner blockers (angled pieces to guide balls toward pockets or bounce back)
    const cornerOffset = halfBoard - 5;
    const blockerSize = 15;
    
    // These small corner pieces prevent balls from getting stuck in corner gaps
    const corners = [
      { x: cx - cornerOffset, y: cy - cornerOffset, angle: Math.PI / 4 },
      { x: cx + cornerOffset, y: cy - cornerOffset, angle: -Math.PI / 4 },
      { x: cx - cornerOffset, y: cy + cornerOffset, angle: -Math.PI / 4 },
      { x: cx + cornerOffset, y: cy + cornerOffset, angle: Math.PI / 4 },
    ];

    corners.forEach(corner => {
      // Small angled deflector near each pocket
      this.matter.add.rectangle(
        corner.x + Math.cos(corner.angle + Math.PI) * 12,
        corner.y + Math.sin(corner.angle + Math.PI) * 12,
        blockerSize,
        wallThickness / 2,
        { ...wallOptions, angle: corner.angle }
      );
    });
  }

  private createPockets(): void {
    const x = this.boardCenterX;
    const y = this.boardCenterY;
    const playArea = BOARD_SIZE - 50;
    const offset = playArea / 2 - 5; // Near corners of play area

    this.pockets = [
      { x: x - offset, y: y - offset },
      { x: x + offset, y: y - offset },
      { x: x - offset, y: y + offset },
      { x: x + offset, y: y + offset },
    ];

    const graphics = this.add.graphics();

    this.pockets.forEach(pocket => {
      // Outer glow/highlight
      graphics.fillStyle(COLORS.pocketHighlight, 0.6);
      graphics.fillCircle(pocket.x, pocket.y, POCKET_RADIUS + 8);
      
      // Gold ring
      graphics.fillStyle(COLORS.pocketRing);
      graphics.fillCircle(pocket.x, pocket.y, POCKET_RADIUS + 4);
      
      // Black pocket hole
      graphics.fillStyle(COLORS.pocket);
      graphics.fillCircle(pocket.x, pocket.y, POCKET_RADIUS);
      
      // Inner shadow effect
      graphics.fillStyle(0x000000, 0.5);
      graphics.fillCircle(pocket.x + 2, pocket.y + 2, POCKET_RADIUS - 3);
    });
  }

  private createPieces(): void {
    const x = this.boardCenterX;
    const y = this.boardCenterY;

    // Create queen (center)
    this.createPiece(x, y, 'queen');

    // Create inner ring pieces
    INITIAL_POSITIONS.innerRing.forEach(pos => {
      this.createPiece(x + pos.x, y + pos.y, pos.color as 'white' | 'black');
    });

    // Create outer ring pieces
    INITIAL_POSITIONS.outerRing.forEach(pos => {
      this.createPiece(x + pos.x, y + pos.y, pos.color as 'white' | 'black');
    });
  }

  private createPiece(x: number, y: number, type: 'white' | 'black' | 'queen'): void {
    const radius = PIECE_RADIUS;

    const piece = this.matter.add.circle(x, y, radius, {
      friction: FRICTION,
      frictionAir: FRICTION_AIR,
      restitution: RESTITUTION,
      label: 'piece',
      density: 0.001,
    }) as Piece;

    piece.gameData = { type, pocketed: false };
    this.pieces.push(piece);

    // Create graphics container
    const container = this.add.container(x, y);
    piece.gameData.graphics = container;

    // Determine colors
    let mainColor: number, ringColor: number, highlightColor: number;
    if (type === 'queen') {
      mainColor = COLORS.queen;
      ringColor = COLORS.queenRing;
      highlightColor = 0xff6666;
    } else if (type === 'white') {
      mainColor = COLORS.whitePiece;
      ringColor = COLORS.whitePieceRing;
      highlightColor = 0xffffff;
    } else {
      mainColor = COLORS.blackPiece;
      ringColor = COLORS.blackPieceRing;
      highlightColor = 0x555555;
    }

    const graphics = this.add.graphics();

    // Shadow
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillCircle(2, 2, radius);

    // Main piece body
    graphics.fillStyle(mainColor);
    graphics.fillCircle(0, 0, radius);

    // Outer ring (3D effect)
    graphics.lineStyle(2, ringColor);
    graphics.strokeCircle(0, 0, radius - 1);

    // Inner ring
    graphics.lineStyle(1.5, ringColor);
    graphics.strokeCircle(0, 0, radius * 0.6);

    // Highlight (top-left shine)
    graphics.fillStyle(highlightColor, 0.3);
    graphics.fillCircle(-radius * 0.3, -radius * 0.3, radius * 0.25);

    container.add(graphics);
  }

  private createStrikerSlider(): void {
    const sliderY = this.strikerBaseY + 50;
    const sliderWidth = 180;
    
    this.sliderMinX = this.boardCenterX - sliderWidth / 2 + 20;
    this.sliderMaxX = this.boardCenterX + sliderWidth / 2 - 20;
    this.strikerSliderX = this.boardCenterX;

    // Slider track
    const track = this.add.graphics();
    track.fillStyle(COLORS.sliderTrack, 0.8);
    track.fillRoundedRect(
      this.boardCenterX - sliderWidth / 2,
      sliderY - 12,
      sliderWidth,
      24,
      12
    );
    
    // Inner track shadow
    track.fillStyle(0x000000, 0.3);
    track.fillRoundedRect(
      this.boardCenterX - sliderWidth / 2 + 4,
      sliderY - 8,
      sliderWidth - 8,
      16,
      8
    );

    // Slider thumb (striker icon)
    this.strikerSlider = this.add.container(this.strikerSliderX, sliderY);
    
    const thumbGraphics = this.add.graphics();
    thumbGraphics.fillStyle(COLORS.strikerRing);
    thumbGraphics.fillCircle(0, 0, 18);
    thumbGraphics.fillStyle(COLORS.sliderThumb);
    thumbGraphics.fillCircle(0, 0, 14);
    
    // Star icon
    thumbGraphics.fillStyle(COLORS.strikerStar);
    this.drawStar(thumbGraphics, 0, 0, 5, 6, 3);
    
    this.strikerSlider.add(thumbGraphics);
    this.strikerSlider.setInteractive(
      new Phaser.Geom.Circle(0, 0, 20),
      Phaser.Geom.Circle.Contains
    );

    // Make slider draggable
    this.input.setDraggable(this.strikerSlider);
    
    this.strikerSlider.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      if (this.isStrikerMoving) return;
      
      const newX = Phaser.Math.Clamp(dragX, this.sliderMinX, this.sliderMaxX);
      this.strikerSlider.x = newX;
      this.strikerSliderX = newX;
      
      // Update striker position
      this.matter.body.setPosition(this.striker, {
        x: newX,
        y: this.strikerBaseY,
      });
      this.strikerGraphics.setPosition(newX, this.strikerBaseY);
    });
  }

  private drawStar(graphics: Phaser.GameObjects.Graphics, cx: number, cy: number, points: number, outer: number, inner: number): void {
    const step = Math.PI / points;
    graphics.beginPath();
    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const angle = i * step - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    graphics.closePath();
    graphics.fillPath();
  }

  private createStriker(): void {
    const x = this.strikerSliderX;
    const y = this.strikerBaseY;

    this.striker = this.matter.add.circle(x, y, STRIKER_RADIUS, {
      friction: FRICTION,
      frictionAir: FRICTION_AIR * 1.2,
      restitution: RESTITUTION,
      label: 'striker',
      density: 0.002,
    }) as Piece;

    this.striker.gameData = { type: 'striker', pocketed: false };

    // Create striker graphics
    this.strikerGraphics = this.add.container(x, y);

    const graphics = this.add.graphics();
    
    // Shadow
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillCircle(2, 2, STRIKER_RADIUS);
    
    // Main body (white)
    graphics.fillStyle(COLORS.striker);
    graphics.fillCircle(0, 0, STRIKER_RADIUS);
    
    // Red outer ring
    graphics.lineStyle(3, COLORS.strikerRing);
    graphics.strokeCircle(0, 0, STRIKER_RADIUS - 2);
    
    // Red star in center
    graphics.fillStyle(COLORS.strikerStar);
    this.drawStar(graphics, 0, 0, 5, 8, 4);
    
    // Highlight
    graphics.fillStyle(0xffffff, 0.4);
    graphics.fillCircle(-STRIKER_RADIUS * 0.3, -STRIKER_RADIUS * 0.3, STRIKER_RADIUS * 0.25);

    this.strikerGraphics.add(graphics);
  }

  private createUI(): void {
    // Player info - top area
    const panelY = 50;
    
    // Left player (You)
    this.createPlayerPanel(60, panelY, 'You', this.whiteScore, true);
    
    // Right player (Opponent)
    this.createPlayerPanel(GAME_WIDTH - 60, panelY, 'CPU', this.blackScore, false);
    
    // Coins display (center top)
    const coinsContainer = this.add.container(GAME_WIDTH / 2, panelY);
    
    const coinBg = this.add.graphics();
    coinBg.fillStyle(0x000000, 0.3);
    coinBg.fillRoundedRect(-40, -20, 80, 40, 10);
    
    const coinIcon = this.add.text(-25, 0, '🪙', { font: '20px Arial' });
    coinIcon.setOrigin(0.5);
    
    const coinText = this.add.text(10, 0, '1000', {
      font: 'bold 16px Arial',
      color: '#ffd700',
    });
    coinText.setOrigin(0.5);
    
    coinsContainer.add([coinBg, coinIcon, coinText]);

    // Back button
    const backButton = this.add.text(20, 20, '✕', {
      font: 'bold 24px Arial',
      color: '#ffffff',
    });
    backButton.setInteractive({ useHandCursor: true });
    backButton.on('pointerdown', () => this.scene.start('Menu'));
  }

  private createPlayerPanel(x: number, y: number, name: string, score: number, isLeft: boolean): void {
    const container = this.add.container(x, y);
    
    // Avatar background
    const avatarBg = this.add.graphics();
    avatarBg.fillStyle(COLORS.boardBorder);
    avatarBg.fillRoundedRect(-25, -25, 50, 50, 8);
    
    // Avatar placeholder
    const avatar = this.add.graphics();
    avatar.fillStyle(isLeft ? 0x4a90d9 : 0xd94a4a);
    avatar.fillRoundedRect(-22, -22, 44, 44, 6);
    
    // Avatar emoji
    const emoji = this.add.text(0, -5, isLeft ? '😊' : '🤖', { font: '24px Arial' });
    emoji.setOrigin(0.5);
    
    // Name
    const nameText = this.add.text(0, 40, name, {
      font: '14px Arial',
      color: '#ffffff',
    });
    nameText.setOrigin(0.5);
    
    // Score with piece icon
    const scoreContainer = this.add.container(0, 60);
    
    const pieceIcon = this.add.graphics();
    pieceIcon.fillStyle(isLeft ? COLORS.whitePiece : COLORS.blackPiece);
    pieceIcon.fillCircle(-15, 0, 8);
    pieceIcon.lineStyle(1, isLeft ? COLORS.whitePieceRing : COLORS.blackPieceRing);
    pieceIcon.strokeCircle(-15, 0, 8);
    
    const scoreText = this.add.text(5, 0, score.toString(), {
      font: 'bold 18px Arial',
      color: '#ffffff',
    });
    scoreText.setOrigin(0.5);
    
    scoreContainer.add([pieceIcon, scoreText]);
    container.add([avatarBg, avatar, emoji, nameText, scoreContainer]);
  }

  private setupInput(): void {
    // Aiming from striker
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isStrikerMoving) return;
      
      const distance = Phaser.Math.Distance.Between(
        pointer.x, pointer.y,
        this.striker.position.x, this.striker.position.y
      );

      if (distance < STRIKER_RADIUS * 3) {
        this.isAiming = true;
        this.dragStart = { x: pointer.x, y: pointer.y };
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isAiming || !this.dragStart || this.isStrikerMoving) return;
      this.drawAimLine(pointer);
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isAiming || !this.dragStart) return;
      
      this.shoot(pointer);
      this.isAiming = false;
      this.dragStart = null;
      this.aimLine.clear();
      this.powerIndicator.clear();
    });
  }

  private drawAimLine(pointer: Phaser.Input.Pointer): void {
    if (!this.dragStart) return;

    const dx = this.dragStart.x - pointer.x;
    const dy = this.dragStart.y - pointer.y;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 100);
    const angle = Math.atan2(dy, dx);
    const power = distance / 100;

    this.aimLine.clear();
    
    // Dotted aim line
    this.aimLine.lineStyle(2, COLORS.aimLine, 0.8);
    const lineLength = distance * 1.5;
    const dotSpacing = 8;
    
    for (let i = 0; i < lineLength; i += dotSpacing) {
      const startX = this.striker.position.x + Math.cos(angle) * i;
      const startY = this.striker.position.y + Math.sin(angle) * i;
      const endX = this.striker.position.x + Math.cos(angle) * (i + dotSpacing / 2);
      const endY = this.striker.position.y + Math.sin(angle) * (i + dotSpacing / 2);
      
      this.aimLine.beginPath();
      this.aimLine.moveTo(startX, startY);
      this.aimLine.lineTo(endX, endY);
      this.aimLine.strokePath();
    }

    // Power indicator circle around striker
    this.powerIndicator.clear();
    const indicatorColor = power > 0.7 ? 0xff4444 : (power > 0.4 ? 0xffaa00 : 0x44ff44);
    this.powerIndicator.lineStyle(3, indicatorColor, 0.6);
    this.powerIndicator.strokeCircle(
      this.striker.position.x,
      this.striker.position.y,
      STRIKER_RADIUS + 5 + power * 15
    );
  }

  private shoot(pointer: Phaser.Input.Pointer): void {
    if (!this.dragStart) return;

    const dx = this.dragStart.x - pointer.x;
    const dy = this.dragStart.y - pointer.y;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 100);
    
    if (distance < 10) return; // Minimum drag distance
    
    const power = (distance / 100) * STRIKER_MAX_POWER;
    const angle = Math.atan2(dy, dx);

    const velocityX = Math.cos(angle) * power;
    const velocityY = Math.sin(angle) * power;

    this.matter.body.setVelocity(this.striker, { x: velocityX, y: velocityY });
    this.isStrikerMoving = true;
    this.playSound('shoot');
  }

  private setupCollisions(): void {
    this.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      event.pairs.forEach(pair => {
        const labelA = (pair.bodyA as any).label;
        const labelB = (pair.bodyB as any).label;

        // Wall collision
        if (labelA === 'wall' || labelB === 'wall') {
          this.playSound('wall');
        } 
        // Piece-to-piece or striker-to-piece collision
        else if ((labelA === 'piece' || labelA === 'striker') && 
                 (labelB === 'piece' || labelB === 'striker')) {
          this.playSound('hit');
        }
      });
    });
  }

  private createHitEffect(x: number, y: number): void {
    // Quick flash effect at collision point
    const flash = this.add.graphics();
    flash.fillStyle(0xffffff, 0.6);
    flash.fillCircle(x, y, 8);
    
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 150,
      onComplete: () => flash.destroy(),
    });
  }

  private createWallBounceEffect(x: number, y: number): void {
    // Spark effect when hitting wall
    const spark = this.add.graphics();
    spark.fillStyle(0xffd700, 0.8);
    spark.fillCircle(x, y, 6);
    
    this.tweens.add({
      targets: spark,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      onComplete: () => spark.destroy(),
    });
  }

  private createPocketEffect(x: number, y: number, color: number): void {
    // Particle burst effect
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const particle = this.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 4);
      particle.setPosition(x, y);
      
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: 0,
        scale: 0.3,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }

    // Flash ring
    const ring = this.add.graphics();
    ring.lineStyle(4, 0xffd700, 1);
    ring.strokeCircle(x, y, 10);
    
    this.tweens.add({
      targets: ring,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  update(): void {
    // Update piece graphics positions
    this.pieces.forEach(piece => {
      if (piece.gameData?.graphics && !piece.gameData.pocketed) {
        piece.gameData.graphics.setPosition(piece.position.x, piece.position.y);
      }
    });

    // Update striker graphics
    if (this.strikerGraphics) {
      this.strikerGraphics.setPosition(this.striker.position.x, this.striker.position.y);
    }

    // Keep pieces inside board boundaries
    this.constrainPieces();

    // Check if all pieces stopped
    if (this.isStrikerMoving) {
      if (this.checkAllStopped()) {
        this.isStrikerMoving = false;
        this.handleTurnEnd();
      }
    }

    // Check pockets
    this.checkPockets();
  }

  private constrainPieces(): void {
    const padding = 5;
    const minX = this.boardLeft + padding;
    const maxX = this.boardRight - padding;
    const minY = this.boardTop + padding;
    const maxY = this.boardBottom - padding;

    // Constrain striker
    const sx = this.striker.position.x;
    const sy = this.striker.position.y;
    if (sx < minX || sx > maxX || sy < minY || sy > maxY) {
      this.matter.body.setPosition(this.striker, {
        x: Phaser.Math.Clamp(sx, minX, maxX),
        y: Phaser.Math.Clamp(sy, minY, maxY),
      });
      // Reverse velocity component that went out
      const vel = this.striker.velocity;
      this.matter.body.setVelocity(this.striker, {
        x: sx < minX || sx > maxX ? -vel.x * 0.7 : vel.x,
        y: sy < minY || sy > maxY ? -vel.y * 0.7 : vel.y,
      });
    }

    // Constrain pieces
    this.pieces.forEach(piece => {
      if (piece.gameData?.pocketed) return;
      const px = piece.position.x;
      const py = piece.position.y;
      if (px < minX || px > maxX || py < minY || py > maxY) {
        this.matter.body.setPosition(piece, {
          x: Phaser.Math.Clamp(px, minX, maxX),
          y: Phaser.Math.Clamp(py, minY, maxY),
        });
        const vel = piece.velocity;
        this.matter.body.setVelocity(piece, {
          x: px < minX || px > maxX ? -vel.x * 0.7 : vel.x,
          y: py < minY || py > maxY ? -vel.y * 0.7 : vel.y,
        });
      }
    });
  }

  private checkAllStopped(): boolean {
    const threshold = 0.1;

    const strikerVel = this.striker.velocity;
    if (Math.abs(strikerVel.x) > threshold || Math.abs(strikerVel.y) > threshold) {
      return false;
    }

    for (const piece of this.pieces) {
      if (piece.gameData?.pocketed) continue;
      const vel = piece.velocity;
      if (Math.abs(vel.x) > threshold || Math.abs(vel.y) > threshold) {
        return false;
      }
    }

    return true;
  }

  private checkPockets(): void {
    // Check striker
    for (const pocket of this.pockets) {
      const dist = Phaser.Math.Distance.Between(
        this.striker.position.x, this.striker.position.y,
        pocket.x, pocket.y
      );
      if (dist < POCKET_RADIUS + 14) {
        this.pocketStriker();
        break;
      }
    }

    // Check pieces
    this.pieces.forEach(piece => {
      if (piece.gameData?.pocketed) return;

      for (const pocket of this.pockets) {
        const dist = Phaser.Math.Distance.Between(
          piece.position.x, piece.position.y,
          pocket.x, pocket.y
        );
        if (dist < POCKET_RADIUS + 16) {
          this.pocketPiece(piece, pocket);
          break;
        }
      }
    });
  }

  private pocketStriker(): void {
    this.playSound('pocket');
    this.matter.body.setPosition(this.striker, {
      x: this.strikerSliderX,
      y: this.strikerBaseY,
    });
    this.matter.body.setVelocity(this.striker, { x: 0, y: 0 });
  }

  private pocketPiece(piece: Piece, pocket: { x: number; y: number }): void {
    if (!piece.gameData) return;

    piece.gameData.pocketed = true;
    
    // Play sound
    this.playSound('pocket');
    
    // Get color for effect
    let color = 0xffffff;
    if (piece.gameData.type === 'queen') {
      color = COLORS.queen;
    } else if (piece.gameData.type === 'white') {
      color = COLORS.whitePiece;
    } else {
      color = COLORS.blackPiece;
    }
    
    // Create pocket animation
    this.createPocketEffect(pocket.x, pocket.y, color);
    
    // Animate piece shrinking into pocket
    if (piece.gameData.graphics) {
      this.tweens.add({
        targets: piece.gameData.graphics,
        x: pocket.x,
        y: pocket.y,
        scaleX: 0,
        scaleY: 0,
        duration: 300,
        ease: 'Quad.easeIn',
        onComplete: () => {
          if (piece.gameData?.graphics) {
            piece.gameData.graphics.setVisible(false);
          }
        },
      });
    }
    
    this.matter.body.setPosition(piece, { x: -100, y: -100 });
    this.matter.body.setVelocity(piece, { x: 0, y: 0 });
    this.matter.body.setStatic(piece, true);

    if (piece.gameData.type === 'white') {
      if (this.currentPlayer === 'white') this.whiteScore++;
    } else if (piece.gameData.type === 'black') {
      if (this.currentPlayer === 'black') this.blackScore++;
    } else if (piece.gameData.type === 'queen') {
      this.queenPocketed = true;
    }

    this.checkWinCondition();
  }

  private handleTurnEnd(): void {
    this.matter.body.setPosition(this.striker, {
      x: this.strikerSliderX,
      y: this.strikerBaseY,
    });
    this.matter.body.setVelocity(this.striker, { x: 0, y: 0 });

    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
  }

  private checkWinCondition(): void {
    const whitePieces = this.pieces.filter(p => p.gameData?.type === 'white' && !p.gameData?.pocketed);
    const blackPieces = this.pieces.filter(p => p.gameData?.type === 'black' && !p.gameData?.pocketed);

    if (whitePieces.length === 0 && this.queenPocketed) {
      this.endGame('white');
    } else if (blackPieces.length === 0 && this.queenPocketed) {
      this.endGame('black');
    }
  }

  private endGame(winner: 'white' | 'black'): void {
    this.scene.start('GameOver', {
      winner,
      whiteScore: this.whiteScore,
      blackScore: this.blackScore,
    });
  }
}
