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
    this.drawFrameCornerFlourishes();
    this.drawBoardSurface();
    this.drawWoodGrainTexture();
    this.drawBoundaryLines();
    this.drawAllBaselines();
    this.drawDiagonalArrows();
    this.drawCenterMandala();
    this.drawSideMidpointCircles();
    this.drawPockets();
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
    
    // Position for each corner
    const corners = [
      { x: this.centerX - halfTotal + 25, y: this.centerY - halfTotal + 25, rotation: 0 },
      { x: this.centerX + halfTotal - 25, y: this.centerY - halfTotal + 25, rotation: Math.PI / 2 },
      { x: this.centerX + halfTotal - 25, y: this.centerY + halfTotal - 25, rotation: Math.PI },
      { x: this.centerX - halfTotal + 25, y: this.centerY + halfTotal - 25, rotation: -Math.PI / 2 },
    ];
    
    corners.forEach(corner => {
      this.drawVictorianScrollwork(corner.x, corner.y, corner.rotation);
    });
  }

  private drawVictorianScrollwork(cx: number, cy: number, rotation: number): void {
    const g = this.scene.add.graphics();
    const gold = this.colors.frameGoldLight;
    const darkGold = this.colors.frameGoldDark;
    
    // Transform for rotation
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    const transform = (x: number, y: number) => ({
      x: cx + x * cos - y * sin,
      y: cy + x * sin + y * cos
    });
    
    // Main spiral scroll
    g.lineStyle(2.5, gold, 1);
    g.beginPath();
    const p1 = transform(0, 0);
    const p2 = transform(15, -5);
    const p3 = transform(25, -15);
    const p4 = transform(20, -25);
    g.moveTo(p1.x, p1.y);
    
    // Draw bezier as line segments
    this.drawBezierCurve(g, p1, p2, p3, p4);
    g.strokePath();
    
    // Secondary scroll
    g.lineStyle(2, gold, 1);
    g.beginPath();
    const s1 = transform(5, 5);
    const s2 = transform(15, 10);
    const s3 = transform(30, 5);
    const s4 = transform(35, -5);
    g.moveTo(s1.x, s1.y);
    this.drawBezierCurve(g, s1, s2, s3, s4);
    g.strokePath();
    
    // Leaf/petal shapes
    for (let i = 0; i < 3; i++) {
      const angle = (i * 25 - 20) * Math.PI / 180;
      const dist = 15 + i * 8;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      const pt = transform(px, py);
      
      g.fillStyle(gold, 0.8);
      g.fillCircle(pt.x, pt.y, 3);
      g.lineStyle(1, darkGold, 1);
      g.strokeCircle(pt.x, pt.y, 3);
    }
    
    // Central rosette
    g.lineStyle(1.5, gold, 1);
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60) * Math.PI / 180;
      const pt1 = transform(0, 0);
      const pt2 = transform(Math.cos(angle) * 5, Math.sin(angle) * 5);
      g.beginPath();
      g.moveTo(pt1.x, pt1.y);
      g.lineTo(pt2.x, pt2.y);
      g.strokePath();
    }
    g.fillStyle(gold, 1);
    const center = transform(0, 0);
    g.fillCircle(center.x, center.y, 3);
    
    // Decorative dots
    const dotPositions = [
      { x: 25, y: -8 }, { x: 18, y: -22 }, { x: 35, y: -12 },
    ];
    dotPositions.forEach(pos => {
      const pt = transform(pos.x, pos.y);
      g.fillStyle(gold, 1);
      g.fillCircle(pt.x, pt.y, 2);
    });
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
    
    // Arrow positions - curved arrows pointing to corners
    const arrows = [
      { // Top-left
        startX: x - 75, startY: y - 75,
        endX: x - halfSize + 35, endY: y - halfSize + 35,
        curveX: x - halfSize + 60, curveY: y - 75
      },
      { // Top-right
        startX: x + 75, startY: y - 75,
        endX: x + halfSize - 35, endY: y - halfSize + 35,
        curveX: x + halfSize - 60, curveY: y - 75
      },
      { // Bottom-left
        startX: x - 75, startY: y + 75,
        endX: x - halfSize + 35, endY: y + halfSize - 35,
        curveX: x - halfSize + 60, curveY: y + 75
      },
      { // Bottom-right
        startX: x + 75, startY: y + 75,
        endX: x + halfSize - 35, endY: y + halfSize - 35,
        curveX: x + halfSize - 60, curveY: y + 75
      }
    ];
    
    g.lineStyle(2, this.colors.gold, 0.6);
    
    arrows.forEach(arrow => {
      // Draw quadratic curve
      g.beginPath();
      g.moveTo(arrow.startX, arrow.startY);
      
      // Approximate quadratic curve with line segments
      const steps = 20;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        const px = mt * mt * arrow.startX + 2 * mt * t * arrow.curveX + t * t * arrow.endX;
        const py = mt * mt * arrow.startY + 2 * mt * t * arrow.curveY + t * t * arrow.endY;
        g.lineTo(px, py);
      }
      g.strokePath();
      
      // Arrow head
      const angle = Math.atan2(arrow.endY - arrow.curveY, arrow.endX - arrow.curveX);
      const headLen = 8;
      const headAngle = 0.5;
      
      g.beginPath();
      g.moveTo(arrow.endX, arrow.endY);
      g.lineTo(
        arrow.endX - headLen * Math.cos(angle - headAngle),
        arrow.endY - headLen * Math.sin(angle - headAngle)
      );
      g.strokePath();
      
      g.beginPath();
      g.moveTo(arrow.endX, arrow.endY);
      g.lineTo(
        arrow.endX - headLen * Math.cos(angle + headAngle),
        arrow.endY - headLen * Math.sin(angle + headAngle)
      );
      g.strokePath();
      
      // Small circle at start of arrow
      g.fillStyle(this.colors.gold, 0.5);
      g.fillCircle(arrow.startX, arrow.startY, 5);
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
