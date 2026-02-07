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
import { NetworkManager, GameMessage } from '../network/NetworkManager';

interface Piece extends MatterJS.BodyType {
  gameData?: {
    type: 'white' | 'black' | 'queen' | 'striker';
    pocketed: boolean;
    graphics?: Phaser.GameObjects.Container;
    index?: number;
  };
}

type PlayerColor = 'white' | 'black';
type GameMode = 'cpu' | 'multiplayer-host' | 'multiplayer-guest';

interface TurnResult {
  pocketedOwn: boolean;
  pocketedOpponent: boolean;
  pocketedQueen: boolean;
  pocketedStriker: boolean;
  piecesThisTurn: ('white' | 'black' | 'queen')[];
}

interface GameData {
  mode: GameMode;
}

export class GameScene extends Phaser.Scene {
  private striker!: Piece;
  private pieces: Piece[] = [];
  private pockets: { x: number; y: number }[] = [];
  private isAiming = false;
  private dragStart: { x: number; y: number } | null = null;
  private aimLine!: Phaser.GameObjects.Graphics;
  private powerIndicator!: Phaser.GameObjects.Graphics;
  private currentPlayer: PlayerColor = 'white';
  private myColor: PlayerColor = 'white';
  private whiteScore = 0;
  private blackScore = 0;
  private queenPocketed = false;
  private queenCovered = false;
  private queenPocketedBy: PlayerColor | null = null;
  private needsCover = false;
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
  private turnResult!: TurnResult;
  private turnIndicator!: Phaser.GameObjects.Container;
  private messageText!: Phaser.GameObjects.Text;
  private isOpponentTurn = false;
  private aiThinkingDelay = 800;
  private gameMode: GameMode = 'cpu';
  private networkManager: NetworkManager;

  constructor() {
    super({ key: 'Game' });
    this.networkManager = NetworkManager.getInstance();
  }

  init(data: GameData): void {
    this.gameMode = data?.mode || 'cpu';
  }

  create(): void {
    this.boardCenterX = GAME_WIDTH / 2;
    this.boardCenterY = GAME_HEIGHT / 2 - 30;
    this.strikerBaseY = this.boardCenterY + BOARD_SIZE / 2 - 35;

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
    this.queenCovered = false;
    this.queenPocketedBy = null;
    this.needsCover = false;
    this.currentPlayer = 'white';
    this.isStrikerMoving = false;
    this.isOpponentTurn = false;
    this.resetTurnResult();

    // Set player color based on mode
    if (this.gameMode === 'multiplayer-guest') {
      this.myColor = 'black';
    } else {
      this.myColor = 'white';
    }

    // Setup network handlers for multiplayer
    if (this.gameMode.startsWith('multiplayer')) {
      this.setupNetworkHandlers();
    }

    this.initAudio();
    this.createBackground();
    this.createBoard();
    this.createPockets();
    this.createPieces();
    this.createStrikerSlider();
    this.createStriker();
    this.createUI();
    this.setupInput();
    this.setupCollisions();

    this.aimLine = this.add.graphics();
    this.powerIndicator = this.add.graphics();

    this.cameras.main.fadeIn(300);

    // Initial turn setup
    this.updateStrikerPosition();
    
    if (this.gameMode === 'cpu') {
      this.showMessage('Your turn! (White)');
    } else if (this.gameMode === 'multiplayer-host') {
      this.showMessage('Your turn! (White)');
    } else {
      this.isOpponentTurn = true;
      this.showMessage("Opponent's turn (White)");
    }
  }

  private setupNetworkHandlers(): void {
    this.networkManager.removeAllListeners();
    
    this.networkManager.onMessage((message: GameMessage) => {
      this.handleNetworkMessage(message);
    });

    this.networkManager.onDisconnect(() => {
      this.showMessage('Opponent disconnected!', 5000);
      this.time.delayedCall(2000, () => {
        this.scene.start('Menu');
      });
    });
  }

  private handleNetworkMessage(message: GameMessage): void {
    switch (message.type) {
      case 'shot':
        // Opponent made a shot
        this.executeRemoteShot(message.strikerX, message.velocityX, message.velocityY);
        break;
      case 'turn-end':
        // Turn ended, update state
        this.currentPlayer = message.nextPlayer;
        this.updateStrikerPosition();
        this.isOpponentTurn = this.currentPlayer !== this.myColor;
        this.updateTurnIndicator();
        break;
    }
  }

  private executeRemoteShot(strikerX: number, velocityX: number, velocityY: number): void {
    // Position striker
    this.strikerSliderX = strikerX;
    this.matter.body.setPosition(this.striker, {
      x: strikerX,
      y: this.strikerBaseY,
    });
    this.strikerGraphics.setPosition(strikerX, this.strikerBaseY);
    this.strikerSlider.setX(strikerX);

    // Execute shot
    this.matter.body.setVelocity(this.striker, { x: velocityX, y: velocityY });
    this.isStrikerMoving = true;
    this.resetTurnResult();
    this.playSound('shoot');
  }

  private resetTurnResult(): void {
    this.turnResult = {
      pocketedOwn: false,
      pocketedOpponent: false,
      pocketedQueen: false,
      pocketedStriker: false,
      piecesThisTurn: [],
    };
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
          oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.1);
          break;
        case 'wall':
          oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
          oscillator.type = 'sine';
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.15);
          break;
        case 'pocket':
          oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
          oscillator.type = 'sine';
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.3);
          break;
        case 'shoot':
          oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.08);
          gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
          oscillator.type = 'triangle';
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + 0.08);
          break;
      }
    } catch (e) {}
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    const steps = 20;
    for (let i = 0; i < steps; i++) {
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

    graphics.fillStyle(COLORS.boardFrame);
    graphics.fillRoundedRect(x - playArea / 2 - frameWidth, y - playArea / 2 - frameWidth, playArea + frameWidth * 2, playArea + frameWidth * 2, 4);
    graphics.fillStyle(COLORS.board);
    graphics.fillRect(x - playArea / 2, y - playArea / 2, playArea, playArea);

    graphics.lineStyle(1, 0xddd5c0, 0.5);
    for (let i = 0; i < 30; i++) {
      const lineY = y - playArea / 2 + (playArea / 30) * i;
      graphics.beginPath();
      graphics.moveTo(x - playArea / 2, lineY);
      graphics.lineTo(x + playArea / 2, lineY);
      graphics.strokePath();
    }

    const outerInset = 12;
    graphics.lineStyle(2.5, 0x000000, 1);
    graphics.strokeRect(x - playArea / 2 + outerInset, y - playArea / 2 + outerInset, playArea - outerInset * 2, playArea - outerInset * 2);

    const innerInset = 32;
    graphics.lineStyle(2, 0x000000, 1);
    graphics.strokeRect(x - playArea / 2 + innerInset, y - playArea / 2 + innerInset, playArea - innerInset * 2, playArea - innerInset * 2);

    const redCircleRadius = 5;
    const cornerOffset = playArea / 2 - innerInset;
    graphics.fillStyle(0xdc3545);
    graphics.fillCircle(x - cornerOffset, y - cornerOffset, redCircleRadius);
    graphics.fillCircle(x + cornerOffset, y - cornerOffset, redCircleRadius);
    graphics.fillCircle(x - cornerOffset, y + cornerOffset, redCircleRadius);
    graphics.fillCircle(x + cornerOffset, y + cornerOffset, redCircleRadius);
    graphics.fillCircle(x, y - cornerOffset, redCircleRadius);
    graphics.fillCircle(x, y + cornerOffset, redCircleRadius);
    graphics.fillCircle(x - cornerOffset, y, redCircleRadius);
    graphics.fillCircle(x + cornerOffset, y, redCircleRadius);

    this.drawCenterDesign(graphics, x, y);
    this.drawCornerLines(graphics, x, y, size);
    this.drawBaselines(graphics, x, y, size);
    this.createWalls();
  }

  private drawCenterDesign(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
    graphics.lineStyle(2, 0x000000, 0.8);
    graphics.strokeCircle(x, y, 60);
    graphics.lineStyle(1.5, 0x000000, 0.6);
    graphics.strokeCircle(x, y, 45);

    const outerRadius = 40;
    const innerRadius = 15;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      const nextAngle = angle + Math.PI / 8;
      const prevAngle = angle - Math.PI / 8;
      graphics.fillStyle(i % 2 === 0 ? 0xdc3545 : 0x1a1a1a);
      graphics.beginPath();
      graphics.moveTo(x, y);
      graphics.lineTo(x + Math.cos(prevAngle) * innerRadius, y + Math.sin(prevAngle) * innerRadius);
      graphics.lineTo(x + Math.cos(angle) * outerRadius, y + Math.sin(angle) * outerRadius);
      graphics.lineTo(x + Math.cos(nextAngle) * innerRadius, y + Math.sin(nextAngle) * innerRadius);
      graphics.closePath();
      graphics.fillPath();
    }
    graphics.fillStyle(0xdc3545);
    graphics.fillCircle(x, y, 8);
    graphics.fillStyle(0x000000);
    graphics.fillCircle(x, y, 3);
  }

  private drawCornerLines(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
    const offset = size / 2 - 50;
    const lineLength = 35;
    graphics.lineStyle(2, COLORS.boardDark, 0.5);
    const corners = [
      { cx: x - offset, cy: y - offset, angle: Math.PI * 1.25 },
      { cx: x + offset, cy: y - offset, angle: Math.PI * 1.75 },
      { cx: x - offset, cy: y + offset, angle: Math.PI * 0.75 },
      { cx: x + offset, cy: y + offset, angle: Math.PI * 0.25 },
    ];
    corners.forEach(({ cx, cy, angle }) => {
      graphics.beginPath();
      graphics.moveTo(cx, cy);
      graphics.lineTo(cx + Math.cos(angle) * lineLength, cy + Math.sin(angle) * lineLength);
      graphics.strokePath();
      graphics.fillStyle(COLORS.boardDark, 0.5);
      graphics.fillCircle(cx, cy, 4);
    });
  }

  private drawBaselines(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
    const baselineOffset = size / 2 - 35;
    const baselineWidth = 120;
    graphics.lineStyle(2, COLORS.boardDark, 0.6);
    graphics.beginPath();
    graphics.moveTo(x - baselineWidth / 2, y + baselineOffset);
    graphics.lineTo(x + baselineWidth / 2, y + baselineOffset);
    graphics.strokePath();
    graphics.fillStyle(COLORS.boardDark, 0.6);
    graphics.fillCircle(x - baselineWidth / 2, y + baselineOffset, 5);
    graphics.fillCircle(x + baselineWidth / 2, y + baselineOffset, 5);
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
    const halfBoard = playArea / 2;
    const wallThickness = 20;
    const pocketGap = POCKET_RADIUS + 10;
    const wallOptions = { isStatic: true, friction: 0.05, restitution: 0.85, label: 'wall' };
    const sideLength = halfBoard * 2;
    const segmentLen = (sideLength - pocketGap * 2) / 2;

    this.matter.add.rectangle(cx - segmentLen / 2 - pocketGap / 2, cy - halfBoard, segmentLen, wallThickness, wallOptions);
    this.matter.add.rectangle(cx + segmentLen / 2 + pocketGap / 2, cy - halfBoard, segmentLen, wallThickness, wallOptions);
    this.matter.add.rectangle(cx - segmentLen / 2 - pocketGap / 2, cy + halfBoard, segmentLen, wallThickness, wallOptions);
    this.matter.add.rectangle(cx + segmentLen / 2 + pocketGap / 2, cy + halfBoard, segmentLen, wallThickness, wallOptions);
    this.matter.add.rectangle(cx - halfBoard, cy - segmentLen / 2 - pocketGap / 2, wallThickness, segmentLen, wallOptions);
    this.matter.add.rectangle(cx - halfBoard, cy + segmentLen / 2 + pocketGap / 2, wallThickness, segmentLen, wallOptions);
    this.matter.add.rectangle(cx + halfBoard, cy - segmentLen / 2 - pocketGap / 2, wallThickness, segmentLen, wallOptions);
    this.matter.add.rectangle(cx + halfBoard, cy + segmentLen / 2 + pocketGap / 2, wallThickness, segmentLen, wallOptions);

    const cornerOffset = halfBoard - 5;
    const blockerSize = 15;
    const corners = [
      { x: cx - cornerOffset, y: cy - cornerOffset, angle: Math.PI / 4 },
      { x: cx + cornerOffset, y: cy - cornerOffset, angle: -Math.PI / 4 },
      { x: cx - cornerOffset, y: cy + cornerOffset, angle: -Math.PI / 4 },
      { x: cx + cornerOffset, y: cy + cornerOffset, angle: Math.PI / 4 },
    ];
    corners.forEach(corner => {
      this.matter.add.rectangle(
        corner.x + Math.cos(corner.angle + Math.PI) * 12,
        corner.y + Math.sin(corner.angle + Math.PI) * 12,
        blockerSize, wallThickness / 2,
        { ...wallOptions, angle: corner.angle }
      );
    });
  }

  private createPockets(): void {
    const x = this.boardCenterX;
    const y = this.boardCenterY;
    const playArea = BOARD_SIZE - 50;
    const offset = playArea / 2 - 5;
    this.pockets = [
      { x: x - offset, y: y - offset },
      { x: x + offset, y: y - offset },
      { x: x - offset, y: y + offset },
      { x: x + offset, y: y + offset },
    ];
    const graphics = this.add.graphics();
    this.pockets.forEach(pocket => {
      graphics.fillStyle(COLORS.pocketHighlight, 0.6);
      graphics.fillCircle(pocket.x, pocket.y, POCKET_RADIUS + 8);
      graphics.fillStyle(COLORS.pocketRing);
      graphics.fillCircle(pocket.x, pocket.y, POCKET_RADIUS + 4);
      graphics.fillStyle(COLORS.pocket);
      graphics.fillCircle(pocket.x, pocket.y, POCKET_RADIUS);
      graphics.fillStyle(0x000000, 0.5);
      graphics.fillCircle(pocket.x + 2, pocket.y + 2, POCKET_RADIUS - 3);
    });
  }

  private createPieces(): void {
    const x = this.boardCenterX;
    const y = this.boardCenterY;
    let index = 0;
    this.createPiece(x, y, 'queen', index++);
    INITIAL_POSITIONS.innerRing.forEach(pos => {
      this.createPiece(x + pos.x, y + pos.y, pos.color as 'white' | 'black', index++);
    });
    INITIAL_POSITIONS.outerRing.forEach(pos => {
      this.createPiece(x + pos.x, y + pos.y, pos.color as 'white' | 'black', index++);
    });
  }

  private createPiece(x: number, y: number, type: 'white' | 'black' | 'queen', index: number): void {
    const radius = PIECE_RADIUS;
    const piece = this.matter.add.circle(x, y, radius, {
      friction: FRICTION,
      frictionAir: FRICTION_AIR,
      restitution: RESTITUTION,
      label: 'piece',
      density: 0.001,
    }) as Piece;
    piece.gameData = { type, pocketed: false, index };
    this.pieces.push(piece);

    const container = this.add.container(x, y);
    piece.gameData.graphics = container;

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
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillCircle(2, 2, radius);
    graphics.fillStyle(mainColor);
    graphics.fillCircle(0, 0, radius);
    graphics.lineStyle(2, ringColor);
    graphics.strokeCircle(0, 0, radius - 1);
    graphics.lineStyle(1.5, ringColor);
    graphics.strokeCircle(0, 0, radius * 0.6);
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

    const track = this.add.graphics();
    track.fillStyle(COLORS.sliderTrack, 0.8);
    track.fillRoundedRect(this.boardCenterX - sliderWidth / 2, sliderY - 12, sliderWidth, 24, 12);
    track.fillStyle(0x000000, 0.3);
    track.fillRoundedRect(this.boardCenterX - sliderWidth / 2 + 4, sliderY - 8, sliderWidth - 8, 16, 8);

    this.strikerSlider = this.add.container(this.strikerSliderX, sliderY);
    const thumbGraphics = this.add.graphics();
    thumbGraphics.fillStyle(COLORS.strikerRing);
    thumbGraphics.fillCircle(0, 0, 18);
    thumbGraphics.fillStyle(COLORS.sliderThumb);
    thumbGraphics.fillCircle(0, 0, 14);
    thumbGraphics.fillStyle(COLORS.strikerStar);
    this.drawStar(thumbGraphics, 0, 0, 5, 6, 3);
    this.strikerSlider.add(thumbGraphics);
    this.strikerSlider.setInteractive(new Phaser.Geom.Circle(0, 0, 20), Phaser.Geom.Circle.Contains);

    this.input.setDraggable(this.strikerSlider);
    this.strikerSlider.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      if (this.isStrikerMoving || this.isOpponentTurn) return;
      const newX = Phaser.Math.Clamp(dragX, this.sliderMinX, this.sliderMaxX);
      this.strikerSlider.x = newX;
      this.strikerSliderX = newX;
      this.matter.body.setPosition(this.striker, { x: newX, y: this.strikerBaseY });
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
      if (i === 0) graphics.moveTo(x, y);
      else graphics.lineTo(x, y);
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
    this.strikerGraphics = this.add.container(x, y);
    const graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 0.3);
    graphics.fillCircle(2, 2, STRIKER_RADIUS);
    graphics.fillStyle(COLORS.striker);
    graphics.fillCircle(0, 0, STRIKER_RADIUS);
    graphics.lineStyle(3, COLORS.strikerRing);
    graphics.strokeCircle(0, 0, STRIKER_RADIUS - 2);
    graphics.fillStyle(COLORS.strikerStar);
    this.drawStar(graphics, 0, 0, 5, 8, 4);
    graphics.fillStyle(0xffffff, 0.4);
    graphics.fillCircle(-STRIKER_RADIUS * 0.3, -STRIKER_RADIUS * 0.3, STRIKER_RADIUS * 0.25);
    this.strikerGraphics.add(graphics);
  }

  private createUI(): void {
    const panelY = 50;
    
    const isHost = this.gameMode !== 'multiplayer-guest';
    const youLabel = isHost ? 'You (White)' : 'You (Black)';
    const opponentLabel = this.gameMode === 'cpu' ? 'CPU' : (isHost ? 'Opponent' : 'Opponent (White)');
    
    this.createPlayerPanel(60, panelY, youLabel, true, this.myColor);
    this.createPlayerPanel(GAME_WIDTH - 60, panelY, opponentLabel, false, this.myColor === 'white' ? 'black' : 'white');
    
    this.turnIndicator = this.add.container(GAME_WIDTH / 2, panelY);
    this.updateTurnIndicator();

    this.messageText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '', {
      font: 'bold 16px Arial',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 12, y: 6 },
    });
    this.messageText.setOrigin(0.5);
    this.messageText.setVisible(false);

    const backButton = this.add.text(20, 20, '✕', { font: 'bold 24px Arial', color: '#ffffff' });
    backButton.setInteractive({ useHandCursor: true });
    backButton.on('pointerdown', () => {
      if (this.gameMode.startsWith('multiplayer')) {
        this.networkManager.disconnect();
      }
      this.scene.start('Menu');
    });

    // Show game mode indicator
    if (this.gameMode.startsWith('multiplayer')) {
      const modeText = this.add.text(GAME_WIDTH / 2, 20, '🌐 Online Match', {
        font: '12px Arial',
        color: '#44ff44',
      });
      modeText.setOrigin(0.5);
    }
  }

  private updateTurnIndicator(): void {
    this.turnIndicator.removeAll(true);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.4);
    bg.fillRoundedRect(-50, -18, 100, 36, 8);
    const isMyTurn = this.currentPlayer === this.myColor;
    const turnText = this.add.text(0, 0, isMyTurn ? '🎯 Your Turn' : '⏳ Opponent', {
      font: 'bold 14px Arial',
      color: isMyTurn ? '#44ff44' : '#ff8844',
    });
    turnText.setOrigin(0.5);
    this.turnIndicator.add([bg, turnText]);
  }

  private showMessage(text: string, duration = 2000): void {
    this.messageText.setText(text);
    this.messageText.setVisible(true);
    this.messageText.setAlpha(1);
    this.tweens.add({
      targets: this.messageText,
      alpha: 0,
      delay: duration - 500,
      duration: 500,
      onComplete: () => this.messageText.setVisible(false),
    });
  }

  private createPlayerPanel(x: number, y: number, name: string, isMe: boolean, color: PlayerColor): void {
    const container = this.add.container(x, y);
    const avatarBg = this.add.graphics();
    avatarBg.fillStyle(COLORS.boardBorder);
    avatarBg.fillRoundedRect(-25, -25, 50, 50, 8);
    const avatar = this.add.graphics();
    avatar.fillStyle(isMe ? 0x4a90d9 : 0xd94a4a);
    avatar.fillRoundedRect(-22, -22, 44, 44, 6);
    const emoji = this.add.text(0, -5, isMe ? '😊' : (this.gameMode === 'cpu' ? '🤖' : '👤'), { font: '24px Arial' });
    emoji.setOrigin(0.5);
    const nameText = this.add.text(0, 40, name, { font: '12px Arial', color: '#ffffff' });
    nameText.setOrigin(0.5);
    const pieceColor = color === 'white' ? COLORS.whitePiece : COLORS.blackPiece;
    const pieceRing = color === 'white' ? COLORS.whitePieceRing : COLORS.blackPieceRing;
    const pieceIcon = this.add.graphics();
    pieceIcon.fillStyle(pieceColor);
    pieceIcon.fillCircle(0, 60, 10);
    pieceIcon.lineStyle(2, pieceRing);
    pieceIcon.strokeCircle(0, 60, 10);
    container.add([avatarBg, avatar, emoji, nameText, pieceIcon]);
  }

  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isStrikerMoving || this.isOpponentTurn) return;
      const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.striker.position.x, this.striker.position.y);
      if (distance < STRIKER_RADIUS * 3) {
        this.isAiming = true;
        this.dragStart = { x: pointer.x, y: pointer.y };
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isAiming || !this.dragStart || this.isStrikerMoving || this.isOpponentTurn) return;
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

    this.powerIndicator.clear();
    const indicatorColor = power > 0.7 ? 0xff4444 : (power > 0.4 ? 0xffaa00 : 0x44ff44);
    this.powerIndicator.lineStyle(3, indicatorColor, 0.6);
    this.powerIndicator.strokeCircle(this.striker.position.x, this.striker.position.y, STRIKER_RADIUS + 5 + power * 15);
  }

  private shoot(pointer: Phaser.Input.Pointer): void {
    if (!this.dragStart) return;
    const dx = this.dragStart.x - pointer.x;
    const dy = this.dragStart.y - pointer.y;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 100);
    if (distance < 10) return;

    const power = (distance / 100) * STRIKER_MAX_POWER;
    const angle = Math.atan2(dy, dx);
    const velocityX = Math.cos(angle) * power;
    const velocityY = Math.sin(angle) * power;

    // Send shot to opponent in multiplayer
    if (this.gameMode.startsWith('multiplayer')) {
      this.networkManager.send({
        type: 'shot',
        strikerX: this.strikerSliderX,
        velocityX,
        velocityY,
      });
    }

    this.matter.body.setVelocity(this.striker, { x: velocityX, y: velocityY });
    this.isStrikerMoving = true;
    this.resetTurnResult();
    this.playSound('shoot');
  }

  private setupCollisions(): void {
    this.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      event.pairs.forEach(pair => {
        const labelA = (pair.bodyA as any).label;
        const labelB = (pair.bodyB as any).label;
        if (labelA === 'wall' || labelB === 'wall') {
          this.playSound('wall');
        } else if ((labelA === 'piece' || labelA === 'striker') && (labelB === 'piece' || labelB === 'striker')) {
          this.playSound('hit');
        }
      });
    });
  }

  private createPocketEffect(x: number, y: number, color: number): void {
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
    this.pieces.forEach(piece => {
      if (piece.gameData?.graphics && !piece.gameData.pocketed) {
        piece.gameData.graphics.setPosition(piece.position.x, piece.position.y);
      }
    });
    if (this.strikerGraphics) {
      this.strikerGraphics.setPosition(this.striker.position.x, this.striker.position.y);
    }
    this.constrainPieces();
    if (this.isStrikerMoving) {
      if (this.checkAllStopped()) {
        this.isStrikerMoving = false;
        this.handleTurnEnd();
      }
    }
    this.checkPockets();
  }

  private constrainPieces(): void {
    const padding = 5;
    const minX = this.boardLeft + padding;
    const maxX = this.boardRight - padding;
    const minY = this.boardTop + padding;
    const maxY = this.boardBottom - padding;

    const sx = this.striker.position.x;
    const sy = this.striker.position.y;
    if (sx < minX || sx > maxX || sy < minY || sy > maxY) {
      this.matter.body.setPosition(this.striker, {
        x: Phaser.Math.Clamp(sx, minX, maxX),
        y: Phaser.Math.Clamp(sy, minY, maxY),
      });
      const vel = this.striker.velocity;
      this.matter.body.setVelocity(this.striker, {
        x: sx < minX || sx > maxX ? -vel.x * 0.7 : vel.x,
        y: sy < minY || sy > maxY ? -vel.y * 0.7 : vel.y,
      });
    }

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
    if (Math.abs(strikerVel.x) > threshold || Math.abs(strikerVel.y) > threshold) return false;
    for (const piece of this.pieces) {
      if (piece.gameData?.pocketed) continue;
      const vel = piece.velocity;
      if (Math.abs(vel.x) > threshold || Math.abs(vel.y) > threshold) return false;
    }
    return true;
  }

  private checkPockets(): void {
    for (const pocket of this.pockets) {
      const dist = Phaser.Math.Distance.Between(this.striker.position.x, this.striker.position.y, pocket.x, pocket.y);
      if (dist < POCKET_RADIUS + 14) {
        this.pocketStriker();
        break;
      }
    }
    this.pieces.forEach(piece => {
      if (piece.gameData?.pocketed) return;
      for (const pocket of this.pockets) {
        const dist = Phaser.Math.Distance.Between(piece.position.x, piece.position.y, pocket.x, pocket.y);
        if (dist < POCKET_RADIUS + 16) {
          this.pocketPiece(piece, pocket);
          break;
        }
      }
    });
  }

  private pocketStriker(): void {
    this.playSound('pocket');
    this.turnResult.pocketedStriker = true;
    this.matter.body.setPosition(this.striker, { x: this.strikerSliderX, y: this.strikerBaseY });
    this.matter.body.setVelocity(this.striker, { x: 0, y: 0 });
  }

  private pocketPiece(piece: Piece, pocket: { x: number; y: number }): void {
    if (!piece.gameData) return;
    piece.gameData.pocketed = true;
    const type = piece.gameData.type;
    if (type !== 'striker') this.turnResult.piecesThisTurn.push(type);
    if (type === 'queen') this.turnResult.pocketedQueen = true;
    else if (type === this.currentPlayer) this.turnResult.pocketedOwn = true;
    else if (type === 'white' || type === 'black') this.turnResult.pocketedOpponent = true;

    this.playSound('pocket');
    let color = 0xffffff;
    if (type === 'queen') color = COLORS.queen;
    else if (type === 'white') color = COLORS.whitePiece;
    else color = COLORS.blackPiece;
    this.createPocketEffect(pocket.x, pocket.y, color);

    if (piece.gameData.graphics) {
      this.tweens.add({
        targets: piece.gameData.graphics,
        x: pocket.x,
        y: pocket.y,
        scaleX: 0,
        scaleY: 0,
        duration: 300,
        ease: 'Quad.easeIn',
        onComplete: () => { if (piece.gameData?.graphics) piece.gameData.graphics.setVisible(false); },
      });
    }
    this.matter.body.setPosition(piece, { x: -100, y: -100 });
    this.matter.body.setVelocity(piece, { x: 0, y: 0 });
    this.matter.body.setStatic(piece, true);
  }

  private handleTurnEnd(): void {
    this.matter.body.setPosition(this.striker, { x: this.strikerSliderX, y: this.strikerBaseY });
    this.matter.body.setVelocity(this.striker, { x: 0, y: 0 });

    const result = this.turnResult;
    let continuesTurn = false;
    let message = '';

    if (result.pocketedStriker) {
      message = 'Foul! Striker pocketed.';
      this.returnPieceAsPenalty();
    }

    if (result.pocketedQueen && !this.queenCovered) {
      this.queenPocketed = true;
      this.queenPocketedBy = this.currentPlayer;
      this.needsCover = true;
      const ownPiecesThisTurn = result.piecesThisTurn.filter(t => t === this.currentPlayer);
      if (ownPiecesThisTurn.length > 0) {
        this.queenCovered = true;
        this.needsCover = false;
        if (this.currentPlayer === 'white') this.whiteScore += 3;
        else this.blackScore += 3;
        message = 'Queen covered! +3 points';
        continuesTurn = true;
      } else {
        message = 'Queen pocketed! Cover it next.';
        continuesTurn = true;
      }
    } else if (this.needsCover && this.queenPocketedBy === this.currentPlayer) {
      const ownPiecesThisTurn = result.piecesThisTurn.filter(t => t === this.currentPlayer);
      if (ownPiecesThisTurn.length > 0) {
        this.queenCovered = true;
        this.needsCover = false;
        if (this.currentPlayer === 'white') this.whiteScore += 3;
        else this.blackScore += 3;
        message = 'Queen covered! +3 points';
        continuesTurn = true;
      } else {
        this.returnQueenToCenter();
        this.queenPocketed = false;
        this.queenPocketedBy = null;
        this.needsCover = false;
        message = 'Failed to cover! Queen returns.';
      }
    } else if (!result.pocketedStriker) {
      if (result.pocketedOwn && !result.pocketedOpponent) {
        const count = result.piecesThisTurn.filter(t => t === this.currentPlayer).length;
        if (this.currentPlayer === 'white') this.whiteScore += count;
        else this.blackScore += count;
        message = `+${count}! Continue.`;
        continuesTurn = true;
      } else if (result.pocketedOpponent) {
        message = 'Pocketed opponent piece.';
      }
    }

    if (this.checkWinCondition()) return;
    if (message) this.showMessage(message);

    if (!continuesTurn || result.pocketedStriker) {
      this.switchTurn();
    } else {
      this.updateTurnIndicator();
      if (this.gameMode === 'cpu' && this.currentPlayer !== this.myColor) {
        this.scheduleAITurn();
      }
    }
  }

  private returnPieceAsPenalty(): void {
    const pocketedPiece = this.pieces.find(p => p.gameData?.type === this.currentPlayer && p.gameData?.pocketed);
    if (pocketedPiece && pocketedPiece.gameData) {
      pocketedPiece.gameData.pocketed = false;
      this.matter.body.setStatic(pocketedPiece, false);
      const offset = (Math.random() - 0.5) * 40;
      this.matter.body.setPosition(pocketedPiece, { x: this.boardCenterX + offset, y: this.boardCenterY + offset });
      if (pocketedPiece.gameData.graphics) {
        pocketedPiece.gameData.graphics.setVisible(true);
        pocketedPiece.gameData.graphics.setScale(1);
        pocketedPiece.gameData.graphics.setPosition(this.boardCenterX + offset, this.boardCenterY + offset);
      }
      if (this.currentPlayer === 'white') this.whiteScore = Math.max(0, this.whiteScore - 1);
      else this.blackScore = Math.max(0, this.blackScore - 1);
    }
  }

  private returnQueenToCenter(): void {
    const queen = this.pieces.find(p => p.gameData?.type === 'queen');
    if (queen && queen.gameData) {
      queen.gameData.pocketed = false;
      this.matter.body.setStatic(queen, false);
      this.matter.body.setPosition(queen, { x: this.boardCenterX, y: this.boardCenterY });
      if (queen.gameData.graphics) {
        queen.gameData.graphics.setVisible(true);
        queen.gameData.graphics.setScale(1);
        queen.gameData.graphics.setPosition(this.boardCenterX, this.boardCenterY);
      }
    }
  }

  private updateStrikerPosition(): void {
    if (this.currentPlayer === 'white') {
      this.strikerBaseY = this.boardCenterY + BOARD_SIZE / 2 - 35;
    } else {
      this.strikerBaseY = this.boardCenterY - BOARD_SIZE / 2 + 35;
    }
    this.matter.body.setPosition(this.striker, { x: this.strikerSliderX, y: this.strikerBaseY });
    this.strikerGraphics.setPosition(this.strikerSliderX, this.strikerBaseY);
    const sliderY = this.strikerBaseY + (this.currentPlayer === 'white' ? 50 : -50);
    this.strikerSlider.setY(sliderY);
  }

  private switchTurn(): void {
    const nextPlayer: PlayerColor = this.currentPlayer === 'white' ? 'black' : 'white';
    this.currentPlayer = nextPlayer;
    this.updateStrikerPosition();
    this.isOpponentTurn = this.currentPlayer !== this.myColor;
    this.updateTurnIndicator();

    // Notify opponent in multiplayer
    if (this.gameMode.startsWith('multiplayer')) {
      this.networkManager.send({ type: 'turn-end', nextPlayer });
    }

    if (this.gameMode === 'cpu' && this.currentPlayer !== this.myColor) {
      this.scheduleAITurn();
    } else if (!this.isOpponentTurn) {
      this.showMessage('Your turn!');
    } else if (this.gameMode.startsWith('multiplayer')) {
      this.showMessage("Opponent's turn");
    }
  }

  private scheduleAITurn(): void {
    this.showMessage('CPU thinking...', 1500);
    this.time.delayedCall(this.aiThinkingDelay, () => this.executeAITurn());
  }

  private executeAITurn(): void {
    const aiPieces = this.pieces.filter(p => p.gameData?.type === 'black' && !p.gameData?.pocketed);
    const queen = this.pieces.find(p => p.gameData?.type === 'queen' && !p.gameData?.pocketed);
    if (aiPieces.length === 0 && (!queen || this.queenCovered)) {
      this.switchTurn();
      return;
    }
    const bestShot = this.calculateBestAIShot(aiPieces, queen);
    if (bestShot) {
      this.strikerSliderX = Phaser.Math.Clamp(bestShot.strikerX, this.sliderMinX, this.sliderMaxX);
      this.matter.body.setPosition(this.striker, { x: this.strikerSliderX, y: this.strikerBaseY });
      this.strikerGraphics.setPosition(this.strikerSliderX, this.strikerBaseY);
      this.strikerSlider.setX(this.strikerSliderX);
      this.time.delayedCall(300, () => {
        this.matter.body.setVelocity(this.striker, { x: bestShot.velocityX, y: bestShot.velocityY });
        this.isStrikerMoving = true;
        this.resetTurnResult();
        this.playSound('shoot');
      });
    } else {
      this.executeRandomAIShot();
    }
  }

  private calculateBestAIShot(aiPieces: Piece[], queen: Piece | undefined): { strikerX: number; velocityX: number; velocityY: number; score: number } | null {
    let bestShot: { strikerX: number; velocityX: number; velocityY: number; score: number } | null = null;
    const targets: Piece[] = [...aiPieces];
    if (queen && !this.queenCovered) {
      if (this.needsCover && this.queenPocketedBy === 'black') targets.unshift(...aiPieces);
      else if (aiPieces.length <= 3) targets.push(queen);
    }
    const strikerPositions = [this.boardCenterX - 60, this.boardCenterX - 30, this.boardCenterX, this.boardCenterX + 30, this.boardCenterX + 60];
    for (const strikerX of strikerPositions) {
      for (const target of targets) {
        for (const pocket of this.pockets) {
          const shot = this.evaluateShot(strikerX, target, pocket);
          if (shot && (!bestShot || shot.score > bestShot.score)) bestShot = shot;
        }
      }
    }
    return bestShot;
  }

  private evaluateShot(strikerX: number, target: Piece, pocket: { x: number; y: number }): { strikerX: number; velocityX: number; velocityY: number; score: number } | null {
    const strikerY = this.strikerBaseY;
    const targetX = target.position.x;
    const targetY = target.position.y;
    const targetToPocketAngle = Math.atan2(pocket.y - targetY, pocket.x - targetX);
    const hitPointX = targetX - Math.cos(targetToPocketAngle) * (PIECE_RADIUS + STRIKER_RADIUS);
    const hitPointY = targetY - Math.sin(targetToPocketAngle) * (PIECE_RADIUS + STRIKER_RADIUS);
    const strikerToHitAngle = Math.atan2(hitPointY - strikerY, hitPointX - strikerX);
    const distanceToHit = Phaser.Math.Distance.Between(strikerX, strikerY, hitPointX, hitPointY);
    if (this.isPathBlocked(strikerX, strikerY, hitPointX, hitPointY, target)) return null;
    const distanceToPocket = Phaser.Math.Distance.Between(targetX, targetY, pocket.x, pocket.y);
    let score = 100 - distanceToHit * 0.1 - distanceToPocket * 0.2;
    if (target.gameData?.type === 'queen') score -= 20;
    const power = Math.min(distanceToHit / 200, 0.8) * STRIKER_MAX_POWER;
    return { strikerX, velocityX: Math.cos(strikerToHitAngle) * power, velocityY: Math.sin(strikerToHitAngle) * power, score };
  }

  private isPathBlocked(startX: number, startY: number, endX: number, endY: number, targetPiece: Piece): boolean {
    for (const piece of this.pieces) {
      if (piece === targetPiece || piece.gameData?.pocketed) continue;
      const px = piece.position.x;
      const py = piece.position.y;
      const dist = this.pointToLineDistance(px, py, startX, startY, endX, endY);
      if (dist < PIECE_RADIUS + STRIKER_RADIUS) {
        const dotProduct = (px - startX) * (endX - startX) + (py - startY) * (endY - startY);
        const lineLength = Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2);
        const t = dotProduct / lineLength;
        if (t > 0.1 && t < 0.9) return true;
      }
    }
    return false;
  }

  private pointToLineDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D, lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : -1;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
  }

  private executeRandomAIShot(): void {
    this.strikerSliderX = Phaser.Math.FloatBetween(this.sliderMinX, this.sliderMaxX);
    this.matter.body.setPosition(this.striker, { x: this.strikerSliderX, y: this.strikerBaseY });
    this.strikerGraphics.setPosition(this.strikerSliderX, this.strikerBaseY);
    this.strikerSlider.setX(this.strikerSliderX);
    const aiPieces = this.pieces.filter(p => p.gameData?.type === 'black' && !p.gameData?.pocketed);
    if (aiPieces.length === 0) { this.switchTurn(); return; }
    const target = Phaser.Utils.Array.GetRandom(aiPieces);
    const angle = Math.atan2(target.position.y - this.strikerBaseY, target.position.x - this.strikerSliderX);
    const power = Phaser.Math.FloatBetween(0.4, 0.7) * STRIKER_MAX_POWER;
    this.time.delayedCall(300, () => {
      this.matter.body.setVelocity(this.striker, { x: Math.cos(angle) * power, y: Math.sin(angle) * power });
      this.isStrikerMoving = true;
      this.resetTurnResult();
      this.playSound('shoot');
    });
  }

  private checkWinCondition(): boolean {
    const whitePieces = this.pieces.filter(p => p.gameData?.type === 'white' && !p.gameData?.pocketed);
    const blackPieces = this.pieces.filter(p => p.gameData?.type === 'black' && !p.gameData?.pocketed);
    if (whitePieces.length === 0 && (this.queenCovered || !this.queenPocketed)) {
      if (this.queenPocketed && !this.queenCovered) return false;
      this.endGame('white');
      return true;
    } else if (blackPieces.length === 0 && (this.queenCovered || !this.queenPocketed)) {
      if (this.queenPocketed && !this.queenCovered) return false;
      this.endGame('black');
      return true;
    }
    return false;
  }

  private endGame(winner: 'white' | 'black'): void {
    if (this.gameMode.startsWith('multiplayer')) {
      this.networkManager.disconnect();
    }
    const loserPiecesLeft = winner === 'white'
      ? this.pieces.filter(p => p.gameData?.type === 'black' && !p.gameData?.pocketed).length
      : this.pieces.filter(p => p.gameData?.type === 'white' && !p.gameData?.pocketed).length;
    const finalWhiteScore = winner === 'white' ? this.whiteScore + loserPiecesLeft : this.whiteScore;
    const finalBlackScore = winner === 'black' ? this.blackScore + loserPiecesLeft : this.blackScore;
    this.scene.start('GameOver', {
      winner,
      whiteScore: finalWhiteScore,
      blackScore: finalBlackScore,
      isHumanWinner: winner === this.myColor,
      mode: this.gameMode,
    });
  }
}
