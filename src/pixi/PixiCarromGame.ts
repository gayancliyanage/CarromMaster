/**
 * PixiCarromGame - Complete PixiJS-based carrom game with Matter.js physics
 * 
 * This is an alternative to the Phaser.js implementation with:
 * - Matter.js physics for realistic piece movement
 * - Premium board rendering
 * - Luxurious piece designs
 * - Smooth animations
 * - Touch/mouse controls
 */

import { Application, Container, Graphics, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';
import { PremiumBoardRenderer, BoardConfig } from './PremiumBoardRenderer';
import { PremiumPieceRenderer, PieceType } from './PremiumPieceRenderer';
import Matter from 'matter-js';

// Game configuration
const GAME_WIDTH = 450;
const GAME_HEIGHT = 800;
const BOARD_SIZE = 380;
const PIECE_RADIUS = 12;
const STRIKER_RADIUS = 16;
const POCKET_RADIUS = 18;

// Physics settings (matching Phaser version)
const FRICTION = 0.03;
const FRICTION_AIR = 0.015;
const RESTITUTION = 0.85;
const STRIKER_MAX_POWER = 22;

interface PieceData {
  container: Container;
  body: Matter.Body;
  type: PieceType;
  pocketed: boolean;
  index: number;
}

interface Position {
  x: number;
  y: number;
  color: 'white' | 'black';
}

export class PixiCarromGame {
  private app!: Application;
  private boardRenderer!: PremiumBoardRenderer;
  private pieceRenderer!: PremiumPieceRenderer;
  private pockets: { x: number; y: number }[] = [];
  
  // Matter.js physics
  private engine!: Matter.Engine;
  private world!: Matter.World;
  
  // Game state
  private pieces: PieceData[] = [];
  private striker!: PieceData;
  private boardCenterX!: number;
  private boardCenterY!: number;
  private strikerBaseY!: number;
  
  // Board boundaries
  private boardLeft!: number;
  private boardRight!: number;
  private boardTop!: number;
  private boardBottom!: number;
  
  // Controls
  private isAiming = false;
  private dragStart: { x: number; y: number } | null = null;
  private aimLine!: Graphics;
  private powerIndicator!: Graphics;
  
  // UI
  private gameContainer!: Container;
  private uiContainer!: Container;
  
  // Audio
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initialize async
  }

  public async init(container: HTMLElement): Promise<void> {
    // Create PixiJS application
    this.app = new Application();
    await this.app.init({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x1a0808,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    container.appendChild(this.app.canvas);
    
    // Scale to fit container
    this.resizeToFit(container);
    window.addEventListener('resize', () => this.resizeToFit(container));
    
    this.boardCenterX = GAME_WIDTH / 2;
    this.boardCenterY = GAME_HEIGHT / 2 - 30;
    this.strikerBaseY = this.boardCenterY + BOARD_SIZE / 2 - 45;
    
    // Calculate board boundaries
    const playArea = BOARD_SIZE - 50;
    const halfPlay = playArea / 2;
    this.boardLeft = this.boardCenterX - halfPlay + 15;
    this.boardRight = this.boardCenterX + halfPlay - 15;
    this.boardTop = this.boardCenterY - halfPlay + 15;
    this.boardBottom = this.boardCenterY + halfPlay - 15;
    
    // Initialize Matter.js physics engine
    this.initPhysics();
    
    // Create containers
    this.gameContainer = new Container();
    this.uiContainer = new Container();
    this.app.stage.addChild(this.gameContainer);
    this.app.stage.addChild(this.uiContainer);
    
    // Draw background gradient
    this.drawBackground();
    
    // Initialize renderers
    this.pieceRenderer = new PremiumPieceRenderer();
    
    const boardConfig: BoardConfig = {
      centerX: this.boardCenterX,
      centerY: this.boardCenterY,
      boardSize: BOARD_SIZE,
      pocketRadius: POCKET_RADIUS,
    };
    
    this.boardRenderer = new PremiumBoardRenderer(this.app, boardConfig);
    await this.boardRenderer.render();
    this.pockets = this.boardRenderer.getPockets();
    
    // Move board to game container
    this.gameContainer.addChild(this.boardRenderer.getContainer());
    
    // Create aim line and power indicator
    this.aimLine = new Graphics();
    this.powerIndicator = new Graphics();
    this.gameContainer.addChild(this.aimLine);
    this.gameContainer.addChild(this.powerIndicator);
    
    // Create physics walls
    this.createWalls();
    
    // Create pieces and striker
    this.createPieces();
    this.createStriker();
    
    // Setup input
    this.setupInput();
    
    // Setup UI
    this.createUI();
    
    // Initialize audio
    this.initAudio();
    
    // Start game loop
    this.app.ticker.add(this.update.bind(this));
  }
  
  private initPhysics(): void {
    // Create Matter.js engine with no gravity (top-down view)
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
    });
    this.world = this.engine.world;
    
    // Setup collision events
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => {
        const labelA = pair.bodyA.label;
        const labelB = pair.bodyB.label;
        
        if (labelA === 'wall' || labelB === 'wall') {
          this.playSound('wall');
        } else if ((labelA.startsWith('piece') || labelA === 'striker') && 
                   (labelB.startsWith('piece') || labelB === 'striker')) {
          this.playSound('hit');
        }
      });
    });
  }
  
  private createWalls(): void {
    const cx = this.boardCenterX;
    const cy = this.boardCenterY;
    const playArea = BOARD_SIZE - 50;
    const halfBoard = playArea / 2;
    const wallThickness = 20;
    const pocketGap = POCKET_RADIUS + 10;
    
    const wallOptions: Matter.IBodyDefinition = {
      isStatic: true,
      friction: 0.05,
      restitution: RESTITUTION,
      label: 'wall',
    };
    
    const sideLength = halfBoard * 2;
    const segmentLen = (sideLength - pocketGap * 2) / 2;
    
    // Top walls (left and right of center)
    Matter.Composite.add(this.world, 
      Matter.Bodies.rectangle(cx - segmentLen / 2 - pocketGap / 2, cy - halfBoard, segmentLen, wallThickness, wallOptions));
    Matter.Composite.add(this.world, 
      Matter.Bodies.rectangle(cx + segmentLen / 2 + pocketGap / 2, cy - halfBoard, segmentLen, wallThickness, wallOptions));
    
    // Bottom walls
    Matter.Composite.add(this.world, 
      Matter.Bodies.rectangle(cx - segmentLen / 2 - pocketGap / 2, cy + halfBoard, segmentLen, wallThickness, wallOptions));
    Matter.Composite.add(this.world, 
      Matter.Bodies.rectangle(cx + segmentLen / 2 + pocketGap / 2, cy + halfBoard, segmentLen, wallThickness, wallOptions));
    
    // Left walls
    Matter.Composite.add(this.world, 
      Matter.Bodies.rectangle(cx - halfBoard, cy - segmentLen / 2 - pocketGap / 2, wallThickness, segmentLen, wallOptions));
    Matter.Composite.add(this.world, 
      Matter.Bodies.rectangle(cx - halfBoard, cy + segmentLen / 2 + pocketGap / 2, wallThickness, segmentLen, wallOptions));
    
    // Right walls
    Matter.Composite.add(this.world, 
      Matter.Bodies.rectangle(cx + halfBoard, cy - segmentLen / 2 - pocketGap / 2, wallThickness, segmentLen, wallOptions));
    Matter.Composite.add(this.world, 
      Matter.Bodies.rectangle(cx + halfBoard, cy + segmentLen / 2 + pocketGap / 2, wallThickness, segmentLen, wallOptions));
    
    // Corner blockers to guide pieces into pockets
    const cornerOffset = halfBoard - 5;
    const blockerSize = 15;
    const corners = [
      { x: cx - cornerOffset, y: cy - cornerOffset, angle: Math.PI / 4 },
      { x: cx + cornerOffset, y: cy - cornerOffset, angle: -Math.PI / 4 },
      { x: cx - cornerOffset, y: cy + cornerOffset, angle: -Math.PI / 4 },
      { x: cx + cornerOffset, y: cy + cornerOffset, angle: Math.PI / 4 },
    ];
    
    corners.forEach(corner => {
      Matter.Composite.add(this.world, 
        Matter.Bodies.rectangle(
          corner.x + Math.cos(corner.angle + Math.PI) * 12,
          corner.y + Math.sin(corner.angle + Math.PI) * 12,
          blockerSize, 
          wallThickness / 2,
          { ...wallOptions, angle: corner.angle }
        ));
    });
  }

  private resizeToFit(container: HTMLElement): void {
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const scale = Math.min(
      containerWidth / GAME_WIDTH,
      containerHeight / GAME_HEIGHT
    );
    
    this.app.canvas.style.width = `${GAME_WIDTH * scale}px`;
    this.app.canvas.style.height = `${GAME_HEIGHT * scale}px`;
  }

  private drawBackground(): void {
    const bg = new Graphics();
    
    // Create gradient effect with multiple rectangles
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.floor(74 + (26 - 74) * t);
      const g = Math.floor(32 + (8 - 32) * t);
      const b = Math.floor(32 + (8 - 32) * t);
      const color = (r << 16) | (g << 8) | b;
      
      bg.rect(0, (GAME_HEIGHT / steps) * i, GAME_WIDTH, GAME_HEIGHT / steps + 1);
      bg.fill({ color });
    }
    
    this.gameContainer.addChild(bg);
  }

  private createPieces(): void {
    // Initial positions - hexagonal pattern
    const innerRing: Position[] = [
      { x: 0, y: -26, color: 'white' },
      { x: 22.5, y: -13, color: 'black' },
      { x: 22.5, y: 13, color: 'white' },
      { x: 0, y: 26, color: 'black' },
      { x: -22.5, y: 13, color: 'white' },
      { x: -22.5, y: -13, color: 'black' },
    ];
    
    const outerRing: Position[] = [
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
    ];
    
    let index = 0;
    
    // Create queen at center
    const queenX = this.boardCenterX;
    const queenY = this.boardCenterY;
    this.createPiece(queenX, queenY, 'queen', index++);
    
    // Create inner ring pieces
    innerRing.forEach(pos => {
      const px = this.boardCenterX + pos.x;
      const py = this.boardCenterY + pos.y;
      this.createPiece(px, py, pos.color, index++);
    });
    
    // Create outer ring pieces
    outerRing.forEach(pos => {
      const px = this.boardCenterX + pos.x;
      const py = this.boardCenterY + pos.y;
      this.createPiece(px, py, pos.color, index++);
    });
  }
  
  private createPiece(x: number, y: number, type: PieceType, index: number): void {
    // Create visual container
    const pieceContainer = this.pieceRenderer.createPiece({
      type,
      radius: PIECE_RADIUS,
      x,
      y,
    });
    this.gameContainer.addChild(pieceContainer);
    
    // Create Matter.js body
    const body = Matter.Bodies.circle(x, y, PIECE_RADIUS, {
      friction: FRICTION,
      frictionAir: FRICTION_AIR,
      restitution: RESTITUTION,
      label: `piece_${type}_${index}`,
      density: 0.001,
    });
    
    Matter.Composite.add(this.world, body);
    
    this.pieces.push({
      container: pieceContainer,
      body,
      type,
      pocketed: false,
      index,
    });
  }

  private createStriker(): void {
    const x = this.boardCenterX;
    const y = this.strikerBaseY;
    
    // Create visual container
    const strikerContainer = this.pieceRenderer.createPiece({
      type: 'striker',
      radius: STRIKER_RADIUS,
      x,
      y,
    });
    this.gameContainer.addChild(strikerContainer);
    
    // Create Matter.js body
    const body = Matter.Bodies.circle(x, y, STRIKER_RADIUS, {
      friction: FRICTION,
      frictionAir: FRICTION_AIR * 1.2, // Striker has slightly more air friction
      restitution: RESTITUTION,
      label: 'striker',
      density: 0.002, // Striker is heavier
    });
    
    Matter.Composite.add(this.world, body);
    
    this.striker = {
      container: strikerContainer,
      body,
      type: 'striker',
      pocketed: false,
      index: -1,
    };
  }

  private setupInput(): void {
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    
    this.app.stage.on('pointerdown', this.onPointerDown.bind(this));
    this.app.stage.on('pointermove', this.onPointerMove.bind(this));
    this.app.stage.on('pointerup', this.onPointerUp.bind(this));
    this.app.stage.on('pointerupoutside', this.onPointerUp.bind(this));
  }

  private onPointerDown(event: FederatedPointerEvent): void {
    if (this.isStrikerMoving()) return;
    
    const pos = event.global;
    const dist = Math.sqrt(
      Math.pow(pos.x - this.striker.body.position.x, 2) +
      Math.pow(pos.y - this.striker.body.position.y, 2)
    );
    
    if (dist < STRIKER_RADIUS * 3) {
      this.isAiming = true;
      this.dragStart = { x: pos.x, y: pos.y };
    }
  }

  private onPointerMove(event: FederatedPointerEvent): void {
    if (!this.isAiming || !this.dragStart || this.isStrikerMoving()) return;
    
    const pos = event.global;
    this.drawAimLine(pos.x, pos.y);
  }

  private onPointerUp(event: FederatedPointerEvent): void {
    if (!this.isAiming || !this.dragStart) return;
    
    const pos = event.global;
    this.shoot(pos.x, pos.y);
    
    this.isAiming = false;
    this.dragStart = null;
    this.aimLine.clear();
    this.powerIndicator.clear();
  }

  private drawAimLine(pointerX: number, pointerY: number): void {
    if (!this.dragStart) return;
    
    const dx = this.dragStart.x - pointerX;
    const dy = this.dragStart.y - pointerY;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 100);
    const angle = Math.atan2(dy, dx);
    const power = distance / 100;
    
    // Clear previous
    this.aimLine.clear();
    this.powerIndicator.clear();
    
    const strikerX = this.striker.body.position.x;
    const strikerY = this.striker.body.position.y;
    
    // Draw dotted aim line
    const lineLength = distance * 1.5;
    const dotSpacing = 8;
    
    for (let i = 0; i < lineLength; i += dotSpacing) {
      const startX = strikerX + Math.cos(angle) * i;
      const startY = strikerY + Math.sin(angle) * i;
      const endX = strikerX + Math.cos(angle) * (i + dotSpacing / 2);
      const endY = strikerY + Math.sin(angle) * (i + dotSpacing / 2);
      
      this.aimLine.moveTo(startX, startY);
      this.aimLine.lineTo(endX, endY);
    }
    this.aimLine.stroke({ color: 0x00FF88, width: 2, alpha: 0.8 });
    
    // Draw power indicator ring
    const indicatorColor = power > 0.7 ? 0xFF4444 : (power > 0.4 ? 0xFFAA00 : 0x44FF44);
    this.powerIndicator.circle(strikerX, strikerY, STRIKER_RADIUS + 5 + power * 15);
    this.powerIndicator.stroke({ color: indicatorColor, width: 3, alpha: 0.6 });
  }

  private shoot(pointerX: number, pointerY: number): void {
    if (!this.dragStart) return;
    
    const dx = this.dragStart.x - pointerX;
    const dy = this.dragStart.y - pointerY;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 100);
    
    if (distance < 10) return;
    
    const power = (distance / 100) * STRIKER_MAX_POWER;
    const angle = Math.atan2(dy, dx);
    
    const velocityX = Math.cos(angle) * power;
    const velocityY = Math.sin(angle) * power;
    
    // Apply velocity to striker body
    Matter.Body.setVelocity(this.striker.body, { x: velocityX, y: velocityY });
    
    this.playSound('shoot');
  }

  private isStrikerMoving(): boolean {
    const threshold = 0.1;
    const vel = this.striker.body.velocity;
    return Math.abs(vel.x) > threshold || Math.abs(vel.y) > threshold;
  }
  
  private checkAllStopped(): boolean {
    const threshold = 0.1;
    
    // Check striker
    const strikerVel = this.striker.body.velocity;
    if (Math.abs(strikerVel.x) > threshold || Math.abs(strikerVel.y) > threshold) {
      return false;
    }
    
    // Check all pieces
    for (const piece of this.pieces) {
      if (piece.pocketed) continue;
      const vel = piece.body.velocity;
      if (Math.abs(vel.x) > threshold || Math.abs(vel.y) > threshold) {
        return false;
      }
    }
    
    return true;
  }

  private createUI(): void {
    // Title
    const titleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xFFD700,
    });
    
    const title = new Text({ text: '⚜ Carrom Master ⚜', style: titleStyle });
    title.anchor.set(0.5, 0);
    title.position.set(GAME_WIDTH / 2, 15);
    this.uiContainer.addChild(title);
    
    // Instructions
    const instructionStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xCCCCCC,
    });
    
    const instructions = new Text({ 
      text: 'Drag from striker to aim & shoot', 
      style: instructionStyle 
    });
    instructions.anchor.set(0.5, 0);
    instructions.position.set(GAME_WIDTH / 2, GAME_HEIGHT - 35);
    this.uiContainer.addChild(instructions);
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

  private update(ticker: { deltaTime: number }): void {
    // Update Matter.js physics engine
    // deltaTime is in frames (60fps), convert to ms
    const delta = ticker.deltaTime * (1000 / 60);
    Matter.Engine.update(this.engine, delta);
    
    // Sync visual positions with physics bodies
    this.syncVisuals();
    
    // Constrain pieces to board boundaries
    this.constrainPieces();
    
    // Check pockets
    this.checkPockets();
    
    // Check if all pieces stopped and reset striker if needed
    if (this.checkAllStopped() && this.striker.pocketed) {
      this.resetStriker();
    }
    
    // Animate striker glow
    this.pieceRenderer.animateStrikerGlow(this.striker.container, ticker.deltaTime);
  }
  
  private syncVisuals(): void {
    // Sync striker
    this.striker.container.position.set(
      this.striker.body.position.x,
      this.striker.body.position.y
    );
    
    // Sync all pieces
    this.pieces.forEach(piece => {
      if (!piece.pocketed) {
        piece.container.position.set(
          piece.body.position.x,
          piece.body.position.y
        );
      }
    });
  }
  
  private constrainPieces(): void {
    const padding = 5;
    const minX = this.boardLeft + padding;
    const maxX = this.boardRight - padding;
    const minY = this.boardTop + padding;
    const maxY = this.boardBottom - padding;
    
    // Constrain striker
    const sx = this.striker.body.position.x;
    const sy = this.striker.body.position.y;
    if (sx < minX || sx > maxX || sy < minY || sy > maxY) {
      Matter.Body.setPosition(this.striker.body, {
        x: Math.max(minX, Math.min(maxX, sx)),
        y: Math.max(minY, Math.min(maxY, sy)),
      });
      const vel = this.striker.body.velocity;
      Matter.Body.setVelocity(this.striker.body, {
        x: sx < minX || sx > maxX ? -vel.x * 0.7 : vel.x,
        y: sy < minY || sy > maxY ? -vel.y * 0.7 : vel.y,
      });
    }
    
    // Constrain pieces
    this.pieces.forEach(piece => {
      if (piece.pocketed) return;
      const px = piece.body.position.x;
      const py = piece.body.position.y;
      if (px < minX || px > maxX || py < minY || py > maxY) {
        Matter.Body.setPosition(piece.body, {
          x: Math.max(minX, Math.min(maxX, px)),
          y: Math.max(minY, Math.min(maxY, py)),
        });
        const vel = piece.body.velocity;
        Matter.Body.setVelocity(piece.body, {
          x: px < minX || px > maxX ? -vel.x * 0.7 : vel.x,
          y: py < minY || py > maxY ? -vel.y * 0.7 : vel.y,
        });
      }
    });
  }

  private checkPockets(): void {
    // Check striker
    for (const pocket of this.pockets) {
      const dist = Math.sqrt(
        Math.pow(this.striker.body.position.x - pocket.x, 2) +
        Math.pow(this.striker.body.position.y - pocket.y, 2)
      );
      if (dist < POCKET_RADIUS + STRIKER_RADIUS * 0.5) {
        this.pocketStriker();
        break;
      }
    }
    
    // Check pieces
    this.pieces.forEach(piece => {
      if (piece.pocketed) return;
      
      for (const pocket of this.pockets) {
        const dist = Math.sqrt(
          Math.pow(piece.body.position.x - pocket.x, 2) +
          Math.pow(piece.body.position.y - pocket.y, 2)
        );
        if (dist < POCKET_RADIUS + PIECE_RADIUS * 0.5) {
          this.pocketPiece(piece, pocket);
          break;
        }
      }
    });
  }
  
  private pocketStriker(): void {
    this.playSound('pocket');
    this.striker.pocketed = true;
    
    // Stop striker and move it out of play temporarily
    Matter.Body.setVelocity(this.striker.body, { x: 0, y: 0 });
    Matter.Body.setPosition(this.striker.body, { x: -100, y: -100 });
    this.striker.container.visible = false;
  }

  private resetStriker(): void {
    this.striker.pocketed = false;
    Matter.Body.setPosition(this.striker.body, {
      x: this.boardCenterX,
      y: this.strikerBaseY,
    });
    Matter.Body.setVelocity(this.striker.body, { x: 0, y: 0 });
    this.striker.container.position.set(this.boardCenterX, this.strikerBaseY);
    this.striker.container.visible = true;
  }

  private pocketPiece(piece: PieceData, pocket: { x: number; y: number }): void {
    piece.pocketed = true;
    
    // Stop the body and make it static
    Matter.Body.setVelocity(piece.body, { x: 0, y: 0 });
    Matter.Body.setPosition(piece.body, { x: -100, y: -100 });
    Matter.Body.setStatic(piece.body, true);
    
    this.playSound('pocket');
    
    // Animate into pocket
    const startX = piece.container.position.x;
    const startY = piece.container.position.y;
    const startScale = piece.container.scale.x;
    const animDuration = 300;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animDuration, 1);
      
      // Move toward pocket and shrink
      piece.container.position.set(
        startX + (pocket.x - startX) * progress,
        startY + (pocket.y - startY) * progress
      );
      piece.container.scale.set(startScale * (1 - progress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        piece.container.visible = false;
      }
    };
    
    animate();
    
    // Create pocket effect
    this.createPocketEffect(pocket.x, pocket.y, piece.type);
  }

  private createPocketEffect(x: number, y: number, type: PieceType): void {
    const colors: Record<PieceType, number> = {
      white: 0xFFFFFF,
      black: 0x1A1A1A,
      queen: 0xDC143C,
      striker: 0xFFD700,
    };
    
    const color = colors[type];
    
    // Particle burst
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const particle = new Graphics();
      particle.circle(0, 0, 4);
      particle.fill({ color });
      particle.position.set(x, y);
      this.gameContainer.addChild(particle);
      
      // Animate outward and fade
      const startTime = Date.now();
      const duration = 400;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        particle.position.set(
          x + Math.cos(angle) * 40 * progress,
          y + Math.sin(angle) * 40 * progress
        );
        particle.alpha = 1 - progress;
        particle.scale.set(1 - progress * 0.7);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.gameContainer.removeChild(particle);
        }
      };
      
      animate();
    }
    
    // Golden ring expansion
    const ring = new Graphics();
    ring.circle(x, y, 10);
    ring.stroke({ color: 0xFFD700, width: 4 });
    this.gameContainer.addChild(ring);
    
    const ringStartTime = Date.now();
    const ringDuration = 400;
    
    const animateRing = () => {
      const elapsed = Date.now() - ringStartTime;
      const progress = Math.min(elapsed / ringDuration, 1);
      
      ring.clear();
      ring.circle(x, y, 10 + 30 * progress);
      ring.stroke({ color: 0xFFD700, width: 4, alpha: 1 - progress });
      
      if (progress < 1) {
        requestAnimationFrame(animateRing);
      } else {
        this.gameContainer.removeChild(ring);
      }
    };
    
    animateRing();
  }

  public destroy(): void {
    // Clear Matter.js world
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);
    
    // Destroy PixiJS app
    this.app.destroy(true);
  }
}

// Export factory function
export async function createPixiCarromGame(container: HTMLElement): Promise<PixiCarromGame> {
  const game = new PixiCarromGame();
  await game.init(container);
  return game;
}
