import Phaser from 'phaser';
import { BOARD_SIZE, POCKET_RADIUS, COLORS } from '../config';

/**
 * BoardRenderer - Premium casino-quality carrom board
 * 
 * Features:
 * - Ornate golden Victorian scrollwork corner flourishes
 * - Rich mahogany/rosewood wood grain texture
 * - Intricate golden mandala center design
 * - Curved arrow baselines with golden circles
 * - Deep shadowed pockets
 * - Premium lighting and shadow effects
 */
export class BoardRenderer {
  private scene: Phaser.Scene;
  private centerX: number;
  private centerY: number;
  private playArea: number;

  // Premium color palette
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
  };

  constructor(scene: Phaser.Scene, centerX: number, centerY: number) {
    this.scene = scene;
    this.centerX = centerX;
    this.centerY = centerY;
    this.playArea = BOARD_SIZE - 50;
  }

  public render(): void {
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
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const frameWidth = 35;
    const totalSize = this.playArea + frameWidth * 2;
    const halfTotal = totalSize / 2;
    
    // Deep shadow behind frame
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(
      x - halfTotal - 6,
      y - halfTotal - 6,
      totalSize + 12,
      totalSize + 12,
      12
    );
    
    // Outer dark gold edge
    g.fillStyle(this.colors.frameGoldDeep, 1);
    g.fillRoundedRect(
      x - halfTotal - 3,
      y - halfTotal - 3,
      totalSize + 6,
      totalSize + 6,
      10
    );
    
    // Main golden frame body
    g.fillStyle(this.colors.frameGold, 1);
    g.fillRoundedRect(
      x - halfTotal,
      y - halfTotal,
      totalSize,
      totalSize,
      8
    );
    
    // Highlight on top-left edges
    g.fillStyle(this.colors.frameGoldLight, 0.6);
    g.fillRoundedRect(
      x - halfTotal + 3,
      y - halfTotal + 3,
      totalSize - 6,
      12,
      4
    );
    g.fillRoundedRect(
      x - halfTotal + 3,
      y - halfTotal + 3,
      12,
      totalSize - 6,
      4
    );
    
    // Shadow on bottom-right edges
    g.fillStyle(this.colors.frameGoldDark, 0.7);
    g.fillRoundedRect(
      x - halfTotal + 3,
      y + halfTotal - 15,
      totalSize - 6,
      12,
      4
    );
    g.fillRoundedRect(
      x + halfTotal - 15,
      y - halfTotal + 3,
      12,
      totalSize - 6,
      4
    );
    
    // Inner frame edge (beveled look)
    const innerOffset = frameWidth - 4;
    g.lineStyle(3, this.colors.frameGoldDark);
    g.strokeRoundedRect(
      x - halfTotal + innerOffset,
      y - halfTotal + innerOffset,
      totalSize - innerOffset * 2,
      totalSize - innerOffset * 2,
      4
    );
  }

  private drawFrameCornerFlourishes(): void {
    const frameWidth = 35;
    const totalSize = this.playArea + frameWidth * 2;
    const halfTotal = totalSize / 2;
    
    // Position for each corner - offset from frame corner
    const offset = 50;
    const corners = [
      { x: this.centerX - halfTotal + offset, y: this.centerY - halfTotal + offset, rotation: 0 },           // Top-left
      { x: this.centerX + halfTotal - offset, y: this.centerY - halfTotal + offset, rotation: Math.PI / 2 }, // Top-right
      { x: this.centerX + halfTotal - offset, y: this.centerY + halfTotal - offset, rotation: Math.PI },     // Bottom-right
      { x: this.centerX - halfTotal + offset, y: this.centerY + halfTotal - offset, rotation: -Math.PI / 2 }, // Bottom-left
    ];
    
    corners.forEach(corner => {
      this.drawVictorianScrollwork(corner.x, corner.y, corner.rotation);
    });
  }

  private drawVictorianScrollwork(cx: number, cy: number, rotation: number): void {
    const g = this.scene.add.graphics();
    const gold = this.colors.frameGoldLight;
    const goldMid = this.colors.gold;
    const darkGold = this.colors.frameGoldDark;
    
    // Transform for rotation with scale
    const scale = 1.15;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    const transform = (x: number, y: number) => ({
      x: cx + (x * cos - y * sin) * scale,
      y: cy + (x * sin + y * cos) * scale
    });
    
    // === MAIN CORNER FLOURISH - Large ornate scrollwork ===
    
    // Primary large spiral curl
    g.lineStyle(3.5, gold, 1);
    g.beginPath();
    const sp1 = [transform(-5, 5), transform(-15, 0), transform(-25, -10), transform(-30, -25)];
    this.drawBezierCurve(g, sp1[0], sp1[1], sp1[2], sp1[3]);
    g.strokePath();
    
    g.beginPath();
    const sp2 = [transform(-30, -25), transform(-32, -35), transform(-25, -42), transform(-15, -40)];
    this.drawBezierCurve(g, sp2[0], sp2[1], sp2[2], sp2[3]);
    g.strokePath();
    
    g.beginPath();
    const sp3 = [transform(-15, -40), transform(-5, -38), transform(0, -30), transform(-5, -22)];
    this.drawBezierCurve(g, sp3[0], sp3[1], sp3[2], sp3[3]);
    g.strokePath();
    
    // Secondary spiral
    g.beginPath();
    const ss1 = [transform(5, -5), transform(0, -15), transform(-10, -25), transform(-25, -30)];
    this.drawBezierCurve(g, ss1[0], ss1[1], ss1[2], ss1[3]);
    g.strokePath();
    
    g.beginPath();
    const ss2 = [transform(-25, -30), transform(-35, -32), transform(-42, -25), transform(-40, -15)];
    this.drawBezierCurve(g, ss2[0], ss2[1], ss2[2], ss2[3]);
    g.strokePath();
    
    // Outer decorative swirls
    g.lineStyle(2.5, goldMid, 1);
    g.beginPath();
    const os1 = [transform(-8, -8), transform(-20, -5), transform(-35, -15), transform(-45, -30)];
    this.drawBezierCurve(g, os1[0], os1[1], os1[2], os1[3]);
    g.strokePath();
    
    g.beginPath();
    const os2 = [transform(-8, -8), transform(-5, -20), transform(-15, -35), transform(-30, -45)];
    this.drawBezierCurve(g, os2[0], os2[1], os2[2], os2[3]);
    g.strokePath();
    
    // === ACANTHUS LEAVES ===
    this.drawAcanthusLeaf(g, transform(-35, -35), Math.PI * 1.25 + rotation, 18, gold, darkGold);
    this.drawAcanthusLeaf(g, transform(-42, -20), Math.PI + rotation, 14, gold, darkGold);
    this.drawAcanthusLeaf(g, transform(-20, -42), Math.PI * 1.5 + rotation, 14, gold, darkGold);
    this.drawAcanthusLeaf(g, transform(-25, -15), Math.PI * 0.8 + rotation, 8, gold, darkGold);
    this.drawAcanthusLeaf(g, transform(-15, -25), Math.PI * 1.3 + rotation, 8, gold, darkGold);
    
    // === SPIRAL TERMINATIONS ===
    g.lineStyle(2, gold, 1);
    g.beginPath();
    const t1 = [transform(-48, -35), transform(-52, -30), transform(-50, -25), transform(-45, -27)];
    this.drawBezierCurve(g, t1[0], t1[1], t1[2], t1[3]);
    g.strokePath();
    
    g.beginPath();
    const t2 = [transform(-35, -48), transform(-30, -52), transform(-25, -50), transform(-27, -45)];
    this.drawBezierCurve(g, t2[0], t2[1], t2[2], t2[3]);
    g.strokePath();
    
    // === CENTRAL ROSETTE ===
    const center = transform(0, 0);
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8 - Math.PI / 8 + rotation;
      const innerR = 4 * scale;
      const outerR = 10 * scale;
      
      g.fillStyle(gold, 0.7);
      g.beginPath();
      g.arc(center.x, center.y, outerR, angle - 0.3, angle + 0.3, false);
      g.lineTo(center.x + Math.cos(angle) * innerR, center.y + Math.sin(angle) * innerR);
      g.closePath();
      g.fillPath();
      g.lineStyle(1, darkGold, 1);
      g.strokePath();
    }
    
    g.fillStyle(gold, 1);
    g.fillCircle(center.x, center.y, 4 * scale);
    g.lineStyle(1, darkGold, 1);
    g.strokeCircle(center.x, center.y, 4 * scale);
    
    // === DECORATIVE DOTS ===
    const dotPositions = [
      { x: -30, y: -10, r: 2.5 },
      { x: -10, y: -30, r: 2.5 },
      { x: -40, y: -40, r: 3 },
      { x: -50, y: -25, r: 2 },
      { x: -25, y: -50, r: 2 },
      { x: -15, y: -15, r: 2 },
    ];
    
    g.fillStyle(gold, 1);
    dotPositions.forEach(pos => {
      const pt = transform(pos.x, pos.y);
      g.fillCircle(pt.x, pt.y, pos.r * scale);
    });
    
    // Small connecting curves
    g.lineStyle(1.5, goldMid, 1);
    g.beginPath();
    const c1 = [transform(-20, -10), transform(-25, -8), transform(-28, -12), transform(-25, -18)];
    this.drawBezierCurve(g, c1[0], c1[1], c1[2], c1[3]);
    g.strokePath();
    
    g.beginPath();
    const c2 = [transform(-10, -20), transform(-8, -25), transform(-12, -28), transform(-18, -25)];
    this.drawBezierCurve(g, c2[0], c2[1], c2[2], c2[3]);
    g.strokePath();
  }
  
  private drawAcanthusLeaf(
    g: Phaser.GameObjects.Graphics,
    pos: {x: number, y: number},
    angle: number,
    size: number,
    fillColor: number,
    strokeColor: number
  ): void {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    const tipX = pos.x + cos * size;
    const tipY = pos.y + sin * size;
    
    g.fillStyle(fillColor, 0.6);
    g.beginPath();
    g.moveTo(pos.x, pos.y);
    
    // Draw leaf shape
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const bulge = Math.sin(t * Math.PI) * size * 0.3;
      const px = pos.x + cos * size * t - sin * bulge;
      const py = pos.y + sin * size * t + cos * bulge;
      g.lineTo(px, py);
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const bulge = Math.sin(t * Math.PI) * size * 0.3;
      const px = pos.x + cos * size * t + sin * bulge;
      const py = pos.y + sin * size * t - cos * bulge;
      g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    
    g.lineStyle(1.5, strokeColor, 1);
    g.strokePath();
    
    // Center vein
    g.lineStyle(1, strokeColor, 0.7);
    g.beginPath();
    g.moveTo(pos.x, pos.y);
    g.lineTo(tipX * 0.85 + pos.x * 0.15, tipY * 0.85 + pos.y * 0.15);
    g.strokePath();
  }

  private drawBezierCurve(
    g: Phaser.GameObjects.Graphics,
    p0: {x: number, y: number},
    p1: {x: number, y: number},
    p2: {x: number, y: number},
    p3: {x: number, y: number}
  ): void {
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      
      const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
      const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;
      
      if (i === 0) {
        g.moveTo(x, y);
      } else {
        g.lineTo(x, y);
      }
    }
  }

  private drawBoardSurface(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const size = this.playArea;
    const halfSize = size / 2;
    
    // Main board - rich mahogany/rosewood
    g.fillStyle(this.colors.boardMid, 1);
    g.fillRect(x - halfSize, y - halfSize, size, size);
    
    // Lighter center area gradient effect
    g.fillStyle(this.colors.boardLight, 0.3);
    g.fillCircle(x, y, size * 0.4);
    
    // Subtle vignette effect on corners
    const cornerOffset = halfSize - 40;
    const corners = [
      [x - cornerOffset, y - cornerOffset],
      [x + cornerOffset, y - cornerOffset],
      [x - cornerOffset, y + cornerOffset],
      [x + cornerOffset, y + cornerOffset],
    ];
    corners.forEach(([cx, cy]) => {
      g.fillStyle(this.colors.boardDark, 0.3);
      g.fillCircle(cx, cy, 60);
    });
  }

  private drawWoodGrainTexture(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const size = this.playArea;
    const halfSize = size / 2;
    
    // Horizontal wood grain lines
    for (let i = 0; i < 80; i++) {
      const lineY = y - halfSize + (size / 80) * i;
      const amplitude = 0.5 + Math.random() * 0.5;
      const frequency = 0.02 + Math.random() * 0.02;
      const phase = Math.random() * Math.PI * 2;
      
      const alpha = 0.1 + Math.random() * 0.15;
      const color = Math.random() > 0.5 ? this.colors.boardDark : this.colors.boardHighlight;
      g.lineStyle(0.5, color, alpha);
      
      g.beginPath();
      g.moveTo(x - halfSize, lineY);
      
      // Create wavy grain line
      for (let lx = x - halfSize; lx <= x + halfSize; lx += 4) {
        const offset = Math.sin((lx - x) * frequency + phase) * amplitude;
        g.lineTo(lx, lineY + offset);
      }
      g.strokePath();
    }
    
    // Add some knots/variations
    for (let i = 0; i < 5; i++) {
      const kx = x - halfSize * 0.7 + Math.random() * size * 0.7;
      const ky = y - halfSize * 0.7 + Math.random() * size * 0.7;
      
      // Avoid center mandala area
      if (Math.abs(kx - x) < 80 && Math.abs(ky - y) < 80) continue;
      
      g.fillStyle(this.colors.boardDark, 0.3);
      g.fillEllipse(kx, ky, 8 + Math.random() * 6, 4 + Math.random() * 3);
    }
  }

  private drawBoundaryLines(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const size = this.playArea;
    const halfSize = size / 2;
    
    // Outer boundary (close to frame)
    const outerInset = 15;
    g.lineStyle(2.5, this.colors.gold, 0.9);
    g.strokeRect(
      x - halfSize + outerInset,
      y - halfSize + outerInset,
      size - outerInset * 2,
      size - outerInset * 2
    );
    
    // Inner boundary (playing area)
    const innerInset = 45;
    g.lineStyle(2, this.colors.gold, 0.7);
    g.strokeRect(
      x - halfSize + innerInset,
      y - halfSize + innerInset,
      size - innerInset * 2,
      size - innerInset * 2
    );
  }

  private drawAllBaselines(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const size = this.playArea;
    const halfSize = size / 2;
    const baseOffset = halfSize - 50;
    const lineHalfLength = 55;
    const circleRadius = 14;
    
    // Draw baseline for each side
    const sides = [
      { // Top
        startX: x - lineHalfLength, startY: y - baseOffset,
        endX: x + lineHalfLength, endY: y - baseOffset,
      },
      { // Bottom
        startX: x - lineHalfLength, startY: y + baseOffset,
        endX: x + lineHalfLength, endY: y + baseOffset,
      },
      { // Left
        startX: x - baseOffset, startY: y - lineHalfLength,
        endX: x - baseOffset, endY: y + lineHalfLength,
      },
      { // Right
        startX: x + baseOffset, startY: y - lineHalfLength,
        endX: x + baseOffset, endY: y + lineHalfLength,
      }
    ];
    
    sides.forEach(side => {
      // Main baseline
      g.lineStyle(2.5, this.colors.gold, 0.8);
      g.beginPath();
      g.moveTo(side.startX, side.startY);
      g.lineTo(side.endX, side.endY);
      g.strokePath();
      
      // Circles at endpoints
      g.lineStyle(2, this.colors.gold, 0.7);
      g.strokeCircle(side.startX, side.startY, circleRadius);
      g.fillStyle(this.colors.gold, 0.3);
      g.fillCircle(side.startX, side.startY, circleRadius - 4);
      
      g.lineStyle(2, this.colors.gold, 0.7);
      g.strokeCircle(side.endX, side.endY, circleRadius);
      g.fillStyle(this.colors.gold, 0.3);
      g.fillCircle(side.endX, side.endY, circleRadius - 4);
    });
  }

  private drawDiagonalArrows(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const size = this.playArea;
    const halfSize = size / 2;
    
    // Arrow positions - curved arrows pointing to corners with hook ends
    const arrows = [
      { // Top-left
        startX: x - 80, startY: y - 80,
        midX: x - halfSize + 75, midY: y - halfSize + 75,
        endX: x - halfSize + 45, endY: y - halfSize + 45,
        hookDir: { x: 1, y: 0 }
      },
      { // Top-right
        startX: x + 80, startY: y - 80,
        midX: x + halfSize - 75, midY: y - halfSize + 75,
        endX: x + halfSize - 45, endY: y - halfSize + 45,
        hookDir: { x: 0, y: 1 }
      },
      { // Bottom-left
        startX: x - 80, startY: y + 80,
        midX: x - halfSize + 75, midY: y + halfSize - 75,
        endX: x - halfSize + 45, endY: y + halfSize - 45,
        hookDir: { x: 0, y: -1 }
      },
      { // Bottom-right
        startX: x + 80, startY: y + 80,
        midX: x + halfSize - 75, midY: y + halfSize - 75,
        endX: x + halfSize - 45, endY: y + halfSize - 45,
        hookDir: { x: -1, y: 0 }
      }
    ];
    
    arrows.forEach(arrow => {
      // Main curved arrow path
      g.lineStyle(2.5, this.colors.gold, 0.7);
      g.beginPath();
      g.moveTo(arrow.startX, arrow.startY);
      
      const steps = 20;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        const px = mt * mt * arrow.startX + 2 * mt * t * arrow.midX + t * t * arrow.endX;
        const py = mt * mt * arrow.startY + 2 * mt * t * arrow.midY + t * t * arrow.endY;
        g.lineTo(px, py);
      }
      g.strokePath();
      
      // Hook/curl at the end
      const hookSize = 12;
      const hookEndX = arrow.endX + arrow.hookDir.x * hookSize;
      const hookEndY = arrow.endY + arrow.hookDir.y * hookSize;
      const hookCtrlX = arrow.endX + arrow.hookDir.x * hookSize * 0.7 + arrow.hookDir.y * hookSize * 0.5;
      const hookCtrlY = arrow.endY + arrow.hookDir.y * hookSize * 0.7 - arrow.hookDir.x * hookSize * 0.5;
      
      g.beginPath();
      g.moveTo(arrow.endX, arrow.endY);
      for (let i = 1; i <= 10; i++) {
        const t = i / 10;
        const mt = 1 - t;
        const px = mt * mt * arrow.endX + 2 * mt * t * hookCtrlX + t * t * hookEndX;
        const py = mt * mt * arrow.endY + 2 * mt * t * hookCtrlY + t * t * hookEndY;
        g.lineTo(px, py);
      }
      g.strokePath();
      
      // Small filled circle at hook end
      g.fillStyle(this.colors.gold, 0.8);
      g.fillCircle(hookEndX, hookEndY, 3);
      
      // Circle at start of arrow
      g.lineStyle(2, this.colors.gold, 0.6);
      g.strokeCircle(arrow.startX, arrow.startY, 6);
      g.fillStyle(this.colors.gold, 0.5);
      g.fillCircle(arrow.startX, arrow.startY, 3);
    });
  }

  private drawSideMidpointCircles(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const size = this.playArea;
    const halfSize = size / 2;
    const offset = halfSize - 50; // Same as baseline offset
    const radius = 16;
    
    // Large golden circles at midpoints of each side
    const positions = [
      { x: x, y: y - offset },        // Top
      { x: x, y: y + offset },        // Bottom
      { x: x - offset, y: y },        // Left
      { x: x + offset, y: y },        // Right
    ];
    
    positions.forEach(pos => {
      // Outer glow
      g.fillStyle(this.colors.goldBright, 0.2);
      g.fillCircle(pos.x, pos.y, radius + 4);
      
      // Main circle
      g.lineStyle(3, this.colors.gold, 0.9);
      g.strokeCircle(pos.x, pos.y, radius);
      
      // Inner circle
      g.lineStyle(1.5, this.colors.gold, 0.6);
      g.strokeCircle(pos.x, pos.y, radius - 5);
      
      // Center dot
      g.fillStyle(this.colors.gold, 0.8);
      g.fillCircle(pos.x, pos.y, 3);
    });
  }

  private drawCenterMandala(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    
    // Outer ring with decorative pattern
    const outerRadius = 85;
    const innerRadius = 55;
    
    // Outermost golden ring
    g.lineStyle(3, this.colors.gold, 0.9);
    g.strokeCircle(x, y, outerRadius);
    
    // Second ring
    g.lineStyle(1.5, this.colors.gold, 0.6);
    g.strokeCircle(x, y, outerRadius - 8);
    
    // Draw lotus petals (16 petals)
    const petalCount = 16;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const nextAngle = ((i + 1) / petalCount) * Math.PI * 2;
      const midAngle = (angle + nextAngle) / 2;
      
      const innerR = innerRadius - 5;
      const outerR = outerRadius - 12;
      const peakR = outerR + 8;
      
      // Petal shape using quadratic curve
      const x1 = x + Math.cos(angle) * innerR;
      const y1 = y + Math.sin(angle) * innerR;
      const x2 = x + Math.cos(nextAngle) * innerR;
      const y2 = y + Math.sin(nextAngle) * innerR;
      const cpx = x + Math.cos(midAngle) * peakR;
      const cpy = y + Math.sin(midAngle) * peakR;
      
      g.lineStyle(1.5, this.colors.gold, 0.7);
      g.beginPath();
      g.moveTo(x1, y1);
      
      // Draw quadratic curve
      const steps = 10;
      for (let j = 1; j <= steps; j++) {
        const t = j / steps;
        const mt = 1 - t;
        const px = mt * mt * x1 + 2 * mt * t * cpx + t * t * x2;
        const py = mt * mt * y1 + 2 * mt * t * cpy + t * t * y2;
        g.lineTo(px, py);
      }
      g.strokePath();
      
      // Petal center line
      g.lineStyle(1, this.colors.gold, 0.5);
      g.beginPath();
      g.moveTo(x + Math.cos(midAngle) * innerR, y + Math.sin(midAngle) * innerR);
      g.lineTo(x + Math.cos(midAngle) * (outerR - 5), y + Math.sin(midAngle) * (outerR - 5));
      g.strokePath();
    }
    
    // Inner decorative ring
    g.lineStyle(2.5, this.colors.gold, 0.8);
    g.strokeCircle(x, y, innerRadius);
    
    // Inner petal layer (8 petals)
    const innerPetalCount = 8;
    for (let i = 0; i < innerPetalCount; i++) {
      const angle = (i / innerPetalCount) * Math.PI * 2;
      const nextAngle = ((i + 1) / innerPetalCount) * Math.PI * 2;
      const midAngle = (angle + nextAngle) / 2;
      
      const innerR = 25;
      const outerR = innerRadius - 5;
      
      const x1 = x + Math.cos(angle) * innerR;
      const y1 = y + Math.sin(angle) * innerR;
      const x2 = x + Math.cos(nextAngle) * innerR;
      const y2 = y + Math.sin(nextAngle) * innerR;
      const cpx = x + Math.cos(midAngle) * outerR;
      const cpy = y + Math.sin(midAngle) * outerR;
      
      g.lineStyle(1.5, this.colors.gold, 0.6);
      g.beginPath();
      g.moveTo(x1, y1);
      
      const steps = 10;
      for (let j = 1; j <= steps; j++) {
        const t = j / steps;
        const mt = 1 - t;
        const px = mt * mt * x1 + 2 * mt * t * cpx + t * t * x2;
        const py = mt * mt * y1 + 2 * mt * t * cpy + t * t * y2;
        g.lineTo(px, py);
      }
      g.strokePath();
    }
    
    // Center circle
    g.lineStyle(2, this.colors.gold, 0.7);
    g.strokeCircle(x, y, 25);
    
    // Innermost design - small radiating lines
    g.lineStyle(1, this.colors.gold, 0.5);
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      g.beginPath();
      g.moveTo(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8);
      g.lineTo(x + Math.cos(angle) * 22, y + Math.sin(angle) * 22);
      g.strokePath();
    }
    
    // Center dot
    g.fillStyle(this.colors.gold, 0.4);
    g.fillCircle(x, y, 8);
    g.fillStyle(this.colors.gold, 0.6);
    g.fillCircle(x, y, 4);
  }

  private drawPockets(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const halfSize = this.playArea / 2;
    const offset = halfSize - 12;
    const radius = POCKET_RADIUS;
    
    const pockets = [
      { px: x - offset, py: y - offset },
      { px: x + offset, py: y - offset },
      { px: x - offset, py: y + offset },
      { px: x + offset, py: y + offset },
    ];
    
    pockets.forEach(({ px, py }) => {
      // Outer decorative ring (wood frame around pocket)
      g.fillStyle(this.colors.frameGoldDark, 0.6);
      g.fillCircle(px, py, radius + 12);
      
      // Dark wood ring
      g.fillStyle(this.colors.pocketRing, 1);
      g.fillCircle(px, py, radius + 8);
      
      // Inner shadow ring
      g.fillStyle(0x150C08, 1);
      g.fillCircle(px, py, radius + 4);
      
      // Main pocket hole
      g.fillStyle(this.colors.pocketBlack, 1);
      g.fillCircle(px, py, radius);
      
      // Inner depth shadow (offset for 3D effect)
      g.fillStyle(0x000000, 0.8);
      g.fillCircle(px + 2, py + 2, radius - 4);
      
      // Subtle highlight on edge
      g.lineStyle(2, 0x3D2817, 0.4);
      g.beginPath();
      g.arc(px - 4, py - 4, radius - 2, -Math.PI * 0.8, -Math.PI * 0.3);
      g.strokePath();
    });
  }

  public getPockets(): { x: number; y: number }[] {
    const halfSize = this.playArea / 2;
    const offset = halfSize - 12;
    return [
      { x: this.centerX - offset, y: this.centerY - offset },
      { x: this.centerX + offset, y: this.centerY - offset },
      { x: this.centerX - offset, y: this.centerY + offset },
      { x: this.centerX + offset, y: this.centerY + offset },
    ];
  }
}
