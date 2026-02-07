/**
 * PremiumBoardRenderer - A luxurious casino-quality carrom board using PixiJS
 * 
 * Features:
 * - Ornate golden Victorian scrollwork corner flourishes
 * - Rich mahogany/rosewood wood grain texture
 * - Intricate golden mandala center design
 * - Curved arrow baselines with golden circles
 * - Deep shadowed pockets
 * - Premium lighting and shadow effects
 */

import { Application, Container, Graphics, Text, FillGradient, TextStyle, BlurFilter } from 'pixi.js';

export interface BoardConfig {
  centerX: number;
  centerY: number;
  boardSize: number;
  pocketRadius: number;
}

export class PremiumBoardRenderer {
  private app: Application;
  private container: Container;
  private config: BoardConfig;
  
  // Colors matching premium reference
  private colors = {
    // Frame
    frameGold: 0xD4AF37,
    frameGoldLight: 0xF4D03F,
    frameGoldDark: 0x8B6914,
    frameGoldDeep: 0x6B4E0A,
    
    // Board surface - rich mahogany/rosewood
    boardDark: 0x5D2A1A,
    boardMid: 0x7B3D26,
    boardLight: 0x8B4533,
    boardHighlight: 0xA45D3F,
    
    // Golden accents
    gold: 0xD4AF37,
    goldBright: 0xFFD700,
    goldDark: 0xB8860B,
    
    // Pockets
    pocketBlack: 0x0A0605,
    pocketRing: 0x2D1810,
    
    // Pieces
    whitePiece: 0xFAF8F5,
    whitePieceRing: 0xC0C0C0,
    blackPiece: 0x1A1A1A,
    blackPieceRing: 0x404040,
    queenRed: 0xDC143C,
    queenRing: 0xB22222,
    
    // Striker
    strikerBody: 0xFFF8E7,
    strikerGlow: 0xFFD700,
  };

  constructor(app: Application, config: BoardConfig) {
    this.app = app;
    this.config = config;
    this.container = new Container();
    this.app.stage.addChild(this.container);
  }

  public async render(): Promise<void> {
    this.drawOuterFrame();
    this.drawBoardSurface();
    this.drawWoodGrainTexture();
    this.drawBoundaryLines();
    this.drawAllBaselines();
    this.drawDiagonalArrows();
    this.drawCenterMandala();
    this.drawSideMidpointCircles();
    this.drawPockets();
    // Draw flourishes last so they appear on top
    this.drawFrameCornerFlourishes();
  }

  private drawOuterFrame(): void {
    const g = new Graphics();
    const { centerX, centerY, boardSize } = this.config;
    const frameWidth = 35;
    const totalSize = boardSize + frameWidth * 2;
    const halfTotal = totalSize / 2;
    
    // Deep shadow behind frame
    g.roundRect(
      centerX - halfTotal - 6,
      centerY - halfTotal - 6,
      totalSize + 12,
      totalSize + 12,
      12
    );
    g.fill({ color: 0x000000, alpha: 0.5 });
    
    // Outer dark gold edge
    g.roundRect(
      centerX - halfTotal - 3,
      centerY - halfTotal - 3,
      totalSize + 6,
      totalSize + 6,
      10
    );
    g.fill({ color: this.colors.frameGoldDeep });
    
    // Main golden frame body
    g.roundRect(
      centerX - halfTotal,
      centerY - halfTotal,
      totalSize,
      totalSize,
      8
    );
    g.fill({ color: this.colors.frameGold });
    
    // Highlight on top-left edges
    g.roundRect(
      centerX - halfTotal + 3,
      centerY - halfTotal + 3,
      totalSize - 6,
      12,
      4
    );
    g.fill({ color: this.colors.frameGoldLight, alpha: 0.6 });
    
    g.roundRect(
      centerX - halfTotal + 3,
      centerY - halfTotal + 3,
      12,
      totalSize - 6,
      4
    );
    g.fill({ color: this.colors.frameGoldLight, alpha: 0.6 });
    
    // Shadow on bottom-right edges
    g.roundRect(
      centerX - halfTotal + 3,
      centerY + halfTotal - 15,
      totalSize - 6,
      12,
      4
    );
    g.fill({ color: this.colors.frameGoldDark, alpha: 0.7 });
    
    g.roundRect(
      centerX + halfTotal - 15,
      centerY - halfTotal + 3,
      12,
      totalSize - 6,
      4
    );
    g.fill({ color: this.colors.frameGoldDark, alpha: 0.7 });
    
    // Inner frame edge (beveled look)
    const innerOffset = frameWidth - 4;
    g.roundRect(
      centerX - halfTotal + innerOffset,
      centerY - halfTotal + innerOffset,
      totalSize - innerOffset * 2,
      totalSize - innerOffset * 2,
      4
    );
    g.stroke({ color: this.colors.frameGoldDark, width: 3 });
    
    this.container.addChild(g);
  }

  private drawFrameCornerFlourishes(): void {
    const { centerX, centerY, boardSize } = this.config;
    const frameWidth = 35;
    const totalSize = boardSize + frameWidth * 2;
    const halfTotal = totalSize / 2;
    
    // Position for each corner - inside the frame corners
    // Offset from corner to place the flourish center
    const offset = 50;
    const corners = [
      { x: centerX - halfTotal + offset, y: centerY - halfTotal + offset, rotation: 0 },           // Top-left
      { x: centerX + halfTotal - offset, y: centerY - halfTotal + offset, rotation: Math.PI / 2 }, // Top-right
      { x: centerX + halfTotal - offset, y: centerY + halfTotal - offset, rotation: Math.PI },     // Bottom-right
      { x: centerX - halfTotal + offset, y: centerY + halfTotal - offset, rotation: -Math.PI / 2 }, // Bottom-left
    ];
    
    corners.forEach(corner => {
      const flourish = this.createVictorianScrollwork(corner.x, corner.y, corner.rotation);
      flourish.scale.set(1.15); // Make flourishes larger
      this.container.addChild(flourish);
    });
  }

  private createVictorianScrollwork(cx: number, cy: number, rotation: number): Container {
    const container = new Container();
    container.position.set(cx, cy);
    container.rotation = rotation;
    
    const g = new Graphics();
    const gold = this.colors.frameGoldLight;
    const goldMid = this.colors.frameGold;
    const darkGold = this.colors.frameGoldDark;
    
    // === MAIN CORNER FLOURISH - Large ornate scrollwork ===
    
    // Primary large spiral curl (main flourish)
    g.moveTo(-5, 5);
    g.bezierCurveTo(-15, 0, -25, -10, -30, -25);
    g.bezierCurveTo(-32, -35, -25, -42, -15, -40);
    g.bezierCurveTo(-5, -38, 0, -30, -5, -22);
    g.bezierCurveTo(-10, -14, -18, -12, -22, -18);
    g.stroke({ color: gold, width: 3.5 });
    
    // Secondary spiral curl (mirrored on other axis)
    g.moveTo(5, -5);
    g.bezierCurveTo(0, -15, -10, -25, -25, -30);
    g.bezierCurveTo(-35, -32, -42, -25, -40, -15);
    g.bezierCurveTo(-38, -5, -30, 0, -22, -5);
    g.bezierCurveTo(-14, -10, -12, -18, -18, -22);
    g.stroke({ color: gold, width: 3.5 });
    
    // Outer decorative swirl 1
    g.moveTo(-8, -8);
    g.bezierCurveTo(-20, -5, -35, -15, -45, -30);
    g.bezierCurveTo(-50, -40, -45, -50, -35, -48);
    g.stroke({ color: goldMid, width: 2.5 });
    
    // Outer decorative swirl 2
    g.moveTo(-8, -8);
    g.bezierCurveTo(-5, -20, -15, -35, -30, -45);
    g.bezierCurveTo(-40, -50, -50, -45, -48, -35);
    g.stroke({ color: goldMid, width: 2.5 });
    
    // === LEAF/ACANTHUS PATTERNS ===
    
    // Large leaf 1 (pointing diagonally outward)
    this.drawAcanthusLeaf(g, -35, -35, Math.PI * 1.25, 18, gold, darkGold);
    
    // Large leaf 2 (pointing along X)
    this.drawAcanthusLeaf(g, -42, -20, Math.PI, 14, gold, darkGold);
    
    // Large leaf 3 (pointing along Y)
    this.drawAcanthusLeaf(g, -20, -42, Math.PI * 1.5, 14, gold, darkGold);
    
    // Small accent leaves
    this.drawAcanthusLeaf(g, -25, -15, Math.PI * 0.8, 8, gold, darkGold);
    this.drawAcanthusLeaf(g, -15, -25, Math.PI * 1.3, 8, gold, darkGold);
    
    // === SPIRAL TERMINATIONS (curled ends) ===
    
    // Spiral end 1
    g.moveTo(-48, -35);
    g.bezierCurveTo(-52, -30, -50, -25, -45, -27);
    g.bezierCurveTo(-42, -28, -43, -32, -46, -33);
    g.stroke({ color: gold, width: 2 });
    
    // Spiral end 2
    g.moveTo(-35, -48);
    g.bezierCurveTo(-30, -52, -25, -50, -27, -45);
    g.bezierCurveTo(-28, -42, -32, -43, -33, -46);
    g.stroke({ color: gold, width: 2 });
    
    // === CENTRAL ROSETTE ===
    
    // Center flower/rosette
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8 - Math.PI / 8;
      const innerR = 4;
      const outerR = 10;
      
      // Petal
      g.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      g.bezierCurveTo(
        Math.cos(angle - 0.3) * outerR, Math.sin(angle - 0.3) * outerR,
        Math.cos(angle + 0.3) * outerR, Math.sin(angle + 0.3) * outerR,
        Math.cos(angle) * innerR, Math.sin(angle) * innerR
      );
      g.fill({ color: gold, alpha: 0.7 });
      g.stroke({ color: darkGold, width: 1 });
    }
    
    // Center dot
    g.circle(0, 0, 4);
    g.fill({ color: gold });
    g.stroke({ color: darkGold, width: 1 });
    
    // === DECORATIVE DOTS AND ACCENTS ===
    
    const dotPositions = [
      { x: -30, y: -10, r: 2.5 },
      { x: -10, y: -30, r: 2.5 },
      { x: -40, y: -40, r: 3 },
      { x: -50, y: -25, r: 2 },
      { x: -25, y: -50, r: 2 },
      { x: -15, y: -15, r: 2 },
    ];
    
    dotPositions.forEach(pos => {
      g.circle(pos.x, pos.y, pos.r);
      g.fill({ color: gold });
    });
    
    // Small connecting curves
    g.moveTo(-20, -10);
    g.bezierCurveTo(-25, -8, -28, -12, -25, -18);
    g.stroke({ color: goldMid, width: 1.5 });
    
    g.moveTo(-10, -20);
    g.bezierCurveTo(-8, -25, -12, -28, -18, -25);
    g.stroke({ color: goldMid, width: 1.5 });
    
    container.addChild(g);
    return container;
  }
  
  private drawAcanthusLeaf(
    g: Graphics, 
    x: number, 
    y: number, 
    angle: number, 
    size: number,
    fillColor: number,
    strokeColor: number
  ): void {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    // Leaf shape with curves
    const tipX = x + cos * size;
    const tipY = y + sin * size;
    const leftX = x + Math.cos(angle + 0.6) * size * 0.5;
    const leftY = y + Math.sin(angle + 0.6) * size * 0.5;
    const rightX = x + Math.cos(angle - 0.6) * size * 0.5;
    const rightY = y + Math.sin(angle - 0.6) * size * 0.5;
    
    g.moveTo(x, y);
    g.bezierCurveTo(leftX, leftY, tipX - sin * 3, tipY + cos * 3, tipX, tipY);
    g.bezierCurveTo(tipX + sin * 3, tipY - cos * 3, rightX, rightY, x, y);
    g.fill({ color: fillColor, alpha: 0.6 });
    g.stroke({ color: strokeColor, width: 1.5 });
    
    // Center vein
    g.moveTo(x, y);
    g.lineTo(tipX * 0.85 + x * 0.15, tipY * 0.85 + y * 0.15);
    g.stroke({ color: strokeColor, width: 1, alpha: 0.7 });
  }

  private drawBoardSurface(): void {
    const g = new Graphics();
    const { centerX, centerY, boardSize } = this.config;
    const halfSize = boardSize / 2;
    
    // Main board - rich mahogany/rosewood
    g.rect(centerX - halfSize, centerY - halfSize, boardSize, boardSize);
    g.fill({ color: this.colors.boardMid });
    
    // Gradient effect from center (lighter) to edges (darker)
    // Lighter center area
    g.circle(centerX, centerY, boardSize * 0.4);
    g.fill({ color: this.colors.boardLight, alpha: 0.3 });
    
    // Subtle vignette effect on corners
    const cornerOffset = halfSize - 40;
    const corners = [
      [centerX - cornerOffset, centerY - cornerOffset],
      [centerX + cornerOffset, centerY - cornerOffset],
      [centerX - cornerOffset, centerY + cornerOffset],
      [centerX + cornerOffset, centerY + cornerOffset],
    ];
    corners.forEach(([x, y]) => {
      g.circle(x, y, 60);
      g.fill({ color: this.colors.boardDark, alpha: 0.3 });
    });
    
    this.container.addChild(g);
  }

  private drawWoodGrainTexture(): void {
    const g = new Graphics();
    const { centerX, centerY, boardSize } = this.config;
    const halfSize = boardSize / 2;
    
    // Horizontal wood grain lines
    for (let i = 0; i < 80; i++) {
      const y = centerY - halfSize + (boardSize / 80) * i;
      const amplitude = 0.5 + Math.random() * 0.5;
      const frequency = 0.02 + Math.random() * 0.02;
      const phase = Math.random() * Math.PI * 2;
      
      g.moveTo(centerX - halfSize, y);
      
      // Create wavy grain line
      for (let x = centerX - halfSize; x <= centerX + halfSize; x += 4) {
        const offset = Math.sin((x - centerX) * frequency + phase) * amplitude;
        g.lineTo(x, y + offset);
      }
      
      const alpha = 0.1 + Math.random() * 0.15;
      const color = Math.random() > 0.5 ? this.colors.boardDark : this.colors.boardHighlight;
      g.stroke({ color, width: 0.5, alpha });
    }
    
    // Add some knots/variations
    for (let i = 0; i < 5; i++) {
      const kx = centerX - halfSize * 0.7 + Math.random() * boardSize * 0.7;
      const ky = centerY - halfSize * 0.7 + Math.random() * boardSize * 0.7;
      
      // Avoid center mandala area
      if (Math.abs(kx - centerX) < 80 && Math.abs(ky - centerY) < 80) continue;
      
      g.ellipse(kx, ky, 8 + Math.random() * 6, 4 + Math.random() * 3);
      g.fill({ color: this.colors.boardDark, alpha: 0.3 });
    }
    
    this.container.addChild(g);
  }

  private drawBoundaryLines(): void {
    const g = new Graphics();
    const { centerX, centerY, boardSize } = this.config;
    const halfSize = boardSize / 2;
    
    // Outer boundary (close to frame)
    const outerInset = 15;
    g.rect(
      centerX - halfSize + outerInset,
      centerY - halfSize + outerInset,
      boardSize - outerInset * 2,
      boardSize - outerInset * 2
    );
    g.stroke({ color: this.colors.gold, width: 2.5, alpha: 0.9 });
    
    // Inner boundary (playing area)
    const innerInset = 45;
    g.rect(
      centerX - halfSize + innerInset,
      centerY - halfSize + innerInset,
      boardSize - innerInset * 2,
      boardSize - innerInset * 2
    );
    g.stroke({ color: this.colors.gold, width: 2, alpha: 0.7 });
    
    this.container.addChild(g);
  }

  private drawAllBaselines(): void {
    const g = new Graphics();
    const { centerX, centerY, boardSize } = this.config;
    const halfSize = boardSize / 2;
    const baseOffset = halfSize - 50;
    const lineHalfLength = 55;
    const circleRadius = 14;
    
    // Draw baseline for each side
    const sides = [
      { // Top
        startX: centerX - lineHalfLength, startY: centerY - baseOffset,
        endX: centerX + lineHalfLength, endY: centerY - baseOffset,
        midX: centerX, midY: centerY - baseOffset,
        vertical: false
      },
      { // Bottom
        startX: centerX - lineHalfLength, startY: centerY + baseOffset,
        endX: centerX + lineHalfLength, endY: centerY + baseOffset,
        midX: centerX, midY: centerY + baseOffset,
        vertical: false
      },
      { // Left
        startX: centerX - baseOffset, startY: centerY - lineHalfLength,
        endX: centerX - baseOffset, endY: centerY + lineHalfLength,
        midX: centerX - baseOffset, midY: centerY,
        vertical: true
      },
      { // Right
        startX: centerX + baseOffset, startY: centerY - lineHalfLength,
        endX: centerX + baseOffset, endY: centerY + lineHalfLength,
        midX: centerX + baseOffset, midY: centerY,
        vertical: true
      }
    ];
    
    sides.forEach(side => {
      // Main baseline
      g.moveTo(side.startX, side.startY);
      g.lineTo(side.endX, side.endY);
      g.stroke({ color: this.colors.gold, width: 2.5, alpha: 0.8 });
      
      // Circles at endpoints
      g.circle(side.startX, side.startY, circleRadius);
      g.stroke({ color: this.colors.gold, width: 2, alpha: 0.7 });
      g.circle(side.startX, side.startY, circleRadius - 4);
      g.fill({ color: this.colors.gold, alpha: 0.3 });
      
      g.circle(side.endX, side.endY, circleRadius);
      g.stroke({ color: this.colors.gold, width: 2, alpha: 0.7 });
      g.circle(side.endX, side.endY, circleRadius - 4);
      g.fill({ color: this.colors.gold, alpha: 0.3 });
    });
    
    this.container.addChild(g);
  }

  private drawDiagonalArrows(): void {
    const g = new Graphics();
    const { centerX, centerY, boardSize } = this.config;
    const halfSize = boardSize / 2;
    
    // Arrow positions - curved arrows pointing to corners with hook ends
    const arrows = [
      { // Top-left
        startX: centerX - 80, startY: centerY - 80,
        midX: centerX - halfSize + 75, midY: centerY - halfSize + 75,
        endX: centerX - halfSize + 45, endY: centerY - halfSize + 45,
        hookDir: { x: 1, y: 0 } // Hook curls right
      },
      { // Top-right
        startX: centerX + 80, startY: centerY - 80,
        midX: centerX + halfSize - 75, midY: centerY - halfSize + 75,
        endX: centerX + halfSize - 45, endY: centerY - halfSize + 45,
        hookDir: { x: 0, y: 1 } // Hook curls down
      },
      { // Bottom-left
        startX: centerX - 80, startY: centerY + 80,
        midX: centerX - halfSize + 75, midY: centerY + halfSize - 75,
        endX: centerX - halfSize + 45, endY: centerY + halfSize - 45,
        hookDir: { x: 0, y: -1 } // Hook curls up
      },
      { // Bottom-right
        startX: centerX + 80, startY: centerY + 80,
        midX: centerX + halfSize - 75, midY: centerY + halfSize - 75,
        endX: centerX + halfSize - 45, endY: centerY + halfSize - 45,
        hookDir: { x: -1, y: 0 } // Hook curls left
      }
    ];
    
    arrows.forEach(arrow => {
      // Main curved arrow path
      g.moveTo(arrow.startX, arrow.startY);
      g.quadraticCurveTo(arrow.midX, arrow.midY, arrow.endX, arrow.endY);
      g.stroke({ color: this.colors.gold, width: 2.5, alpha: 0.7 });
      
      // Hook/curl at the end (like a shepherd's crook)
      const hookSize = 12;
      const hookEndX = arrow.endX + arrow.hookDir.x * hookSize;
      const hookEndY = arrow.endY + arrow.hookDir.y * hookSize;
      const hookCtrlX = arrow.endX + arrow.hookDir.x * hookSize * 0.7 + arrow.hookDir.y * hookSize * 0.5;
      const hookCtrlY = arrow.endY + arrow.hookDir.y * hookSize * 0.7 - arrow.hookDir.x * hookSize * 0.5;
      
      g.moveTo(arrow.endX, arrow.endY);
      g.quadraticCurveTo(hookCtrlX, hookCtrlY, hookEndX, hookEndY);
      g.stroke({ color: this.colors.gold, width: 2.5, alpha: 0.7 });
      
      // Small filled circle at hook end
      g.circle(hookEndX, hookEndY, 3);
      g.fill({ color: this.colors.gold, alpha: 0.8 });
      
      // Circle at start of arrow
      g.circle(arrow.startX, arrow.startY, 6);
      g.stroke({ color: this.colors.gold, width: 2, alpha: 0.6 });
      g.circle(arrow.startX, arrow.startY, 3);
      g.fill({ color: this.colors.gold, alpha: 0.5 });
    });
    
    this.container.addChild(g);
  }

  private drawSideMidpointCircles(): void {
    const g = new Graphics();
    const { centerX, centerY, boardSize } = this.config;
    const halfSize = boardSize / 2;
    const offset = halfSize - 50; // Same as baseline offset
    const radius = 16;
    
    // Large golden circles at midpoints of each side
    const positions = [
      { x: centerX, y: centerY - offset },        // Top
      { x: centerX, y: centerY + offset },        // Bottom
      { x: centerX - offset, y: centerY },        // Left
      { x: centerX + offset, y: centerY },        // Right
    ];
    
    positions.forEach(pos => {
      // Outer glow
      g.circle(pos.x, pos.y, radius + 4);
      g.fill({ color: this.colors.goldBright, alpha: 0.2 });
      
      // Main circle
      g.circle(pos.x, pos.y, radius);
      g.stroke({ color: this.colors.gold, width: 3, alpha: 0.9 });
      
      // Inner circle
      g.circle(pos.x, pos.y, radius - 5);
      g.stroke({ color: this.colors.gold, width: 1.5, alpha: 0.6 });
      
      // Center dot
      g.circle(pos.x, pos.y, 3);
      g.fill({ color: this.colors.gold, alpha: 0.8 });
    });
    
    this.container.addChild(g);
  }

  private drawCenterMandala(): void {
    const { centerX, centerY } = this.config;
    const mandalaContainer = new Container();
    mandalaContainer.position.set(centerX, centerY);
    
    const g = new Graphics();
    
    // Outer ring with decorative pattern
    const outerRadius = 85;
    const innerRadius = 55;
    
    // Outermost golden ring
    g.circle(0, 0, outerRadius);
    g.stroke({ color: this.colors.gold, width: 3, alpha: 0.9 });
    
    // Second ring
    g.circle(0, 0, outerRadius - 8);
    g.stroke({ color: this.colors.gold, width: 1.5, alpha: 0.6 });
    
    // Draw lotus petals (16 petals)
    const petalCount = 16;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const nextAngle = ((i + 1) / petalCount) * Math.PI * 2;
      const midAngle = (angle + nextAngle) / 2;
      
      const innerR = innerRadius - 5;
      const outerR = outerRadius - 12;
      const peakR = outerR + 8;
      
      // Petal shape
      const x1 = Math.cos(angle) * innerR;
      const y1 = Math.sin(angle) * innerR;
      const x2 = Math.cos(nextAngle) * innerR;
      const y2 = Math.sin(nextAngle) * innerR;
      const cpx = Math.cos(midAngle) * peakR;
      const cpy = Math.sin(midAngle) * peakR;
      
      g.moveTo(x1, y1);
      g.quadraticCurveTo(cpx, cpy, x2, y2);
      g.stroke({ color: this.colors.gold, width: 1.5, alpha: 0.7 });
      
      // Petal center line
      g.moveTo(Math.cos(midAngle) * innerR, Math.sin(midAngle) * innerR);
      g.lineTo(Math.cos(midAngle) * (outerR - 5), Math.sin(midAngle) * (outerR - 5));
      g.stroke({ color: this.colors.gold, width: 1, alpha: 0.5 });
    }
    
    // Inner decorative ring
    g.circle(0, 0, innerRadius);
    g.stroke({ color: this.colors.gold, width: 2.5, alpha: 0.8 });
    
    // Inner petal layer (8 petals)
    const innerPetalCount = 8;
    for (let i = 0; i < innerPetalCount; i++) {
      const angle = (i / innerPetalCount) * Math.PI * 2;
      const nextAngle = ((i + 1) / innerPetalCount) * Math.PI * 2;
      const midAngle = (angle + nextAngle) / 2;
      
      const innerR = 25;
      const outerR = innerRadius - 5;
      
      const x1 = Math.cos(angle) * innerR;
      const y1 = Math.sin(angle) * innerR;
      const x2 = Math.cos(nextAngle) * innerR;
      const y2 = Math.sin(nextAngle) * innerR;
      const cpx = Math.cos(midAngle) * outerR;
      const cpy = Math.sin(midAngle) * outerR;
      
      g.moveTo(x1, y1);
      g.quadraticCurveTo(cpx, cpy, x2, y2);
      g.stroke({ color: this.colors.gold, width: 1.5, alpha: 0.6 });
    }
    
    // Center circle
    g.circle(0, 0, 25);
    g.stroke({ color: this.colors.gold, width: 2, alpha: 0.7 });
    
    // Innermost design - small radiating lines
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      g.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
      g.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
      g.stroke({ color: this.colors.gold, width: 1, alpha: 0.5 });
    }
    
    // Center dot
    g.circle(0, 0, 8);
    g.fill({ color: this.colors.gold, alpha: 0.4 });
    g.circle(0, 0, 4);
    g.fill({ color: this.colors.gold, alpha: 0.6 });
    
    mandalaContainer.addChild(g);
    this.container.addChild(mandalaContainer);
  }

  private drawPockets(): void {
    const { centerX, centerY, boardSize, pocketRadius } = this.config;
    const halfSize = boardSize / 2;
    const offset = halfSize - 12;
    
    const pockets = [
      { x: centerX - offset, y: centerY - offset },
      { x: centerX + offset, y: centerY - offset },
      { x: centerX - offset, y: centerY + offset },
      { x: centerX + offset, y: centerY + offset },
    ];
    
    pockets.forEach(pocket => {
      const g = new Graphics();
      
      // Outer decorative ring (wood frame around pocket)
      g.circle(pocket.x, pocket.y, pocketRadius + 12);
      g.fill({ color: this.colors.frameGoldDark, alpha: 0.6 });
      
      // Dark wood ring
      g.circle(pocket.x, pocket.y, pocketRadius + 8);
      g.fill({ color: this.colors.pocketRing });
      
      // Inner shadow ring
      g.circle(pocket.x, pocket.y, pocketRadius + 4);
      g.fill({ color: 0x150C08 });
      
      // Main pocket hole
      g.circle(pocket.x, pocket.y, pocketRadius);
      g.fill({ color: this.colors.pocketBlack });
      
      // Inner depth shadow (offset for 3D effect)
      g.circle(pocket.x + 2, pocket.y + 2, pocketRadius - 4);
      g.fill({ color: 0x000000, alpha: 0.8 });
      
      // Subtle highlight on edge
      g.arc(pocket.x - 4, pocket.y - 4, pocketRadius - 2, -Math.PI * 0.8, -Math.PI * 0.3);
      g.stroke({ color: 0x3D2817, width: 2, alpha: 0.4 });
      
      this.container.addChild(g);
    });
  }

  public getPockets(): { x: number; y: number }[] {
    const { centerX, centerY, boardSize } = this.config;
    const halfSize = boardSize / 2;
    const offset = halfSize - 12;
    
    return [
      { x: centerX - offset, y: centerY - offset },
      { x: centerX + offset, y: centerY - offset },
      { x: centerX - offset, y: centerY + offset },
      { x: centerX + offset, y: centerY + offset },
    ];
  }

  public getContainer(): Container {
    return this.container;
  }
}
