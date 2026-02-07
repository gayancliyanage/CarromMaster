/**
 * PixiCarromGame - Complete PixiJS-based carrom game with premium visuals
 * 
 * This is an alternative to the Phaser.js implementation with:
 * - Premium board rendering
 * - Luxurious piece designs
 * - Smooth animations
 * - Touch/mouse controls
 */

import { Application, Container, Graphics, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';
import { PremiumBoardRenderer, BoardConfig } from './PremiumBoardRenderer';
import { PremiumPieceRenderer, PieceType } from './PremiumPieceRenderer';

// Game configuration
const GAME_WIDTH = 450;
const GAME_HEIGHT = 800;
const BOARD_SIZE = 380;
const PIECE_RADIUS = 12;
const STRIKER_RADIUS = 16;
const POCKET_RADIUS = 18;

interface PieceData {
  container: Container;
  type: PieceType;
  vx: number;
  vy: number;
  x: number;
  y: number;
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
  
  // Game state
  private pieces: PieceData[] = [];
  private striker!: PieceData;
  private boardCenterX!: number;
  private boardCenterY!: number;
  private strikerBaseY!: number;
  
  // Controls
  private isAiming = false;
  private dragStart: { x: number; y: number } | null = null;
  private aimLine!: Graphics;
  private powerIndicator!: Graphics;
  
  // Physics
  private readonly FRICTION = 0.985;
  private readonly MAX_POWER = 25;
  
  // UI
  private gameContainer!: Container;
  private uiContainer!: Container;

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
    
    // Create pieces and striker
    this.createPieces();
    this.createStriker();
    
    // Setup input
    this.setupInput();
    
    // Setup UI
    this.createUI();
    
    // Start game loop
    this.app.ticker.add(this.update.bind(this));
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
    const queenContainer = this.pieceRenderer.createPiece({
      type: 'queen',
      radius: PIECE_RADIUS,
      x: queenX,
      y: queenY,
    });
    this.gameContainer.addChild(queenContainer);
    this.pieces.push({
      container: queenContainer,
      type: 'queen',
      vx: 0,
      vy: 0,
      x: queenX,
      y: queenY,
      pocketed: false,
      index: index++,
    });
    
    // Create inner ring pieces
    innerRing.forEach(pos => {
      const px = this.boardCenterX + pos.x;
      const py = this.boardCenterY + pos.y;
      const pieceContainer = this.pieceRenderer.createPiece({
        type: pos.color,
        radius: PIECE_RADIUS,
        x: px,
        y: py,
      });
      this.gameContainer.addChild(pieceContainer);
      this.pieces.push({
        container: pieceContainer,
        type: pos.color,
        vx: 0,
        vy: 0,
        x: px,
        y: py,
        pocketed: false,
        index: index++,
      });
    });
    
    // Create outer ring pieces
    outerRing.forEach(pos => {
      const px = this.boardCenterX + pos.x;
      const py = this.boardCenterY + pos.y;
      const pieceContainer = this.pieceRenderer.createPiece({
        type: pos.color,
        radius: PIECE_RADIUS,
        x: px,
        y: py,
      });
      this.gameContainer.addChild(pieceContainer);
      this.pieces.push({
        container: pieceContainer,
        type: pos.color,
        vx: 0,
        vy: 0,
        x: px,
        y: py,
        pocketed: false,
        index: index++,
      });
    });
  }

  private createStriker(): void {
    const strikerContainer = this.pieceRenderer.createPiece({
      type: 'striker',
      radius: STRIKER_RADIUS,
      x: this.boardCenterX,
      y: this.strikerBaseY,
    });
    this.gameContainer.addChild(strikerContainer);
    
    this.striker = {
      container: strikerContainer,
      type: 'striker',
      vx: 0,
      vy: 0,
      x: this.boardCenterX,
      y: this.strikerBaseY,
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
      Math.pow(pos.x - this.striker.x, 2) +
      Math.pow(pos.y - this.striker.y, 2)
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
    
    // Draw dotted aim line
    const lineLength = distance * 1.5;
    const dotSpacing = 8;
    
    for (let i = 0; i < lineLength; i += dotSpacing) {
      const startX = this.striker.x + Math.cos(angle) * i;
      const startY = this.striker.y + Math.sin(angle) * i;
      const endX = this.striker.x + Math.cos(angle) * (i + dotSpacing / 2);
      const endY = this.striker.y + Math.sin(angle) * (i + dotSpacing / 2);
      
      this.aimLine.moveTo(startX, startY);
      this.aimLine.lineTo(endX, endY);
    }
    this.aimLine.stroke({ color: 0x00FF88, width: 2, alpha: 0.8 });
    
    // Draw power indicator ring
    const indicatorColor = power > 0.7 ? 0xFF4444 : (power > 0.4 ? 0xFFAA00 : 0x44FF44);
    this.powerIndicator.circle(this.striker.x, this.striker.y, STRIKER_RADIUS + 5 + power * 15);
    this.powerIndicator.stroke({ color: indicatorColor, width: 3, alpha: 0.6 });
  }

  private shoot(pointerX: number, pointerY: number): void {
    if (!this.dragStart) return;
    
    const dx = this.dragStart.x - pointerX;
    const dy = this.dragStart.y - pointerY;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 100);
    
    if (distance < 10) return;
    
    const power = (distance / 100) * this.MAX_POWER;
    const angle = Math.atan2(dy, dx);
    
    this.striker.vx = Math.cos(angle) * power;
    this.striker.vy = Math.sin(angle) * power;
  }

  private isStrikerMoving(): boolean {
    const threshold = 0.1;
    return Math.abs(this.striker.vx) > threshold || Math.abs(this.striker.vy) > threshold;
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

  private update(ticker: { deltaTime: number }): void {
    const delta = ticker.deltaTime;
    
    // Update striker
    this.updatePiece(this.striker, delta);
    
    // Update all pieces
    this.pieces.forEach(piece => {
      if (!piece.pocketed) {
        this.updatePiece(piece, delta);
      }
    });
    
    // Check collisions
    this.checkCollisions();
    
    // Check pockets
    this.checkPockets();
    
    // Animate striker glow
    this.pieceRenderer.animateStrikerGlow(this.striker.container, delta);
  }

  private updatePiece(piece: PieceData, delta: number): void {
    // Apply velocity
    piece.x += piece.vx * delta * 0.1;
    piece.y += piece.vy * delta * 0.1;
    
    // Apply friction
    piece.vx *= this.FRICTION;
    piece.vy *= this.FRICTION;
    
    // Stop if very slow
    if (Math.abs(piece.vx) < 0.05 && Math.abs(piece.vy) < 0.05) {
      piece.vx = 0;
      piece.vy = 0;
    }
    
    // Boundary collision
    const playArea = BOARD_SIZE - 50;
    const halfPlay = playArea / 2;
    const minX = this.boardCenterX - halfPlay + 15;
    const maxX = this.boardCenterX + halfPlay - 15;
    const minY = this.boardCenterY - halfPlay + 15;
    const maxY = this.boardCenterY + halfPlay - 15;
    const radius = piece.type === 'striker' ? STRIKER_RADIUS : PIECE_RADIUS;
    
    if (piece.x - radius < minX) {
      piece.x = minX + radius;
      piece.vx *= -0.8;
    }
    if (piece.x + radius > maxX) {
      piece.x = maxX - radius;
      piece.vx *= -0.8;
    }
    if (piece.y - radius < minY) {
      piece.y = minY + radius;
      piece.vy *= -0.8;
    }
    if (piece.y + radius > maxY) {
      piece.y = maxY - radius;
      piece.vy *= -0.8;
    }
    
    // Update visual position
    piece.container.position.set(piece.x, piece.y);
  }

  private checkCollisions(): void {
    // Striker vs pieces
    this.pieces.forEach(piece => {
      if (piece.pocketed) return;
      this.resolveCollision(this.striker, STRIKER_RADIUS, piece, PIECE_RADIUS);
    });
    
    // Piece vs piece
    for (let i = 0; i < this.pieces.length; i++) {
      if (this.pieces[i].pocketed) continue;
      for (let j = i + 1; j < this.pieces.length; j++) {
        if (this.pieces[j].pocketed) continue;
        this.resolveCollision(this.pieces[i], PIECE_RADIUS, this.pieces[j], PIECE_RADIUS);
      }
    }
  }

  private resolveCollision(a: PieceData, radiusA: number, b: PieceData, radiusB: number): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = radiusA + radiusB;
    
    if (dist < minDist && dist > 0) {
      // Normalize
      const nx = dx / dist;
      const ny = dy / dist;
      
      // Separate
      const overlap = minDist - dist;
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;
      
      // Relative velocity
      const dvx = a.vx - b.vx;
      const dvy = a.vy - b.vy;
      
      // Relative velocity along collision normal
      const dvn = dvx * nx + dvy * ny;
      
      // Don't resolve if velocities are separating
      if (dvn > 0) return;
      
      // Collision response with restitution
      const restitution = 0.85;
      const massA = radiusA * radiusA;
      const massB = radiusB * radiusB;
      const totalMass = massA + massB;
      
      const impulse = -(1 + restitution) * dvn / totalMass;
      
      a.vx += impulse * massB * nx;
      a.vy += impulse * massB * ny;
      b.vx -= impulse * massA * nx;
      b.vy -= impulse * massA * ny;
    }
  }

  private checkPockets(): void {
    // Check striker
    for (const pocket of this.pockets) {
      const dist = Math.sqrt(
        Math.pow(this.striker.x - pocket.x, 2) +
        Math.pow(this.striker.y - pocket.y, 2)
      );
      if (dist < POCKET_RADIUS + STRIKER_RADIUS * 0.5) {
        this.resetStriker();
        break;
      }
    }
    
    // Check pieces
    this.pieces.forEach(piece => {
      if (piece.pocketed) return;
      
      for (const pocket of this.pockets) {
        const dist = Math.sqrt(
          Math.pow(piece.x - pocket.x, 2) +
          Math.pow(piece.y - pocket.y, 2)
        );
        if (dist < POCKET_RADIUS + PIECE_RADIUS * 0.5) {
          this.pocketPiece(piece, pocket);
          break;
        }
      }
    });
  }

  private resetStriker(): void {
    this.striker.x = this.boardCenterX;
    this.striker.y = this.strikerBaseY;
    this.striker.vx = 0;
    this.striker.vy = 0;
    this.striker.container.position.set(this.striker.x, this.striker.y);
  }

  private pocketPiece(piece: PieceData, pocket: { x: number; y: number }): void {
    piece.pocketed = true;
    piece.vx = 0;
    piece.vy = 0;
    
    // Animate into pocket
    const startScale = piece.container.scale.x;
    const animDuration = 300;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animDuration, 1);
      
      // Move toward pocket and shrink
      piece.container.position.set(
        piece.x + (pocket.x - piece.x) * progress,
        piece.y + (pocket.y - piece.y) * progress
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
    this.app.destroy(true);
  }
}

// Export factory function
export async function createPixiCarromGame(container: HTMLElement): Promise<PixiCarromGame> {
  const game = new PixiCarromGame();
  await game.init(container);
  return game;
}
