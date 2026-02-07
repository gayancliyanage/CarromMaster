import Phaser from 'phaser';
import { BOARD_SIZE, POCKET_RADIUS, COLORS } from '../config';

export class BoardRenderer {
  private scene: Phaser.Scene;
  private centerX: number;
  private centerY: number;
  private playArea: number;

  constructor(scene: Phaser.Scene, centerX: number, centerY: number) {
    this.scene = scene;
    this.centerX = centerX;
    this.centerY = centerY;
    this.playArea = BOARD_SIZE - 50;
  }

  public render(): void {
    this.drawFrame();
    this.drawBoardSurface();
    this.drawWoodGrain();
    this.drawBoundaryLines();
    this.drawCornerCircles();
    this.drawAllBaselines();
    this.drawDiagonalArrows();
    this.drawCenterCircles();
    this.drawPockets();
  }

  private drawFrame(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const frameWidth = 24;
    const totalSize = this.playArea + frameWidth * 2;
    
    // Outer dark gold shadow
    g.fillStyle(0x6b5010, 1);
    g.fillRoundedRect(
      x - totalSize / 2 - 3,
      y - totalSize / 2 - 3,
      totalSize + 6,
      totalSize + 6,
      8
    );
    
    // Main golden frame
    g.fillStyle(0xc9a227, 1);
    g.fillRoundedRect(
      x - totalSize / 2,
      y - totalSize / 2,
      totalSize,
      totalSize,
      6
    );
    
    // Inner frame gradient - lighter top/left
    g.fillStyle(0xdbb84d, 0.6);
    g.fillRoundedRect(
      x - totalSize / 2 + 2,
      y - totalSize / 2 + 2,
      totalSize - 4,
      8,
      4
    );
    g.fillRoundedRect(
      x - totalSize / 2 + 2,
      y - totalSize / 2 + 2,
      8,
      totalSize - 4,
      4
    );
    
    // Darker bottom/right edge
    g.fillStyle(0x8b6914, 0.6);
    g.fillRoundedRect(
      x - totalSize / 2 + 2,
      y + totalSize / 2 - 10,
      totalSize - 4,
      8,
      4
    );
    g.fillRoundedRect(
      x + totalSize / 2 - 10,
      y - totalSize / 2 + 2,
      8,
      totalSize - 4,
      4
    );
  }

  private drawBoardSurface(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const size = this.playArea;
    
    // Main board surface - warm cream wood
    g.fillStyle(0xdec89a, 1);
    g.fillRect(x - size / 2, y - size / 2, size, size);
    
    // Subtle color variation for realism
    g.fillStyle(0xe8d4a8, 0.5);
    g.fillRect(x - size / 2, y - size / 2, size / 2, size);
  }

  private drawWoodGrain(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const size = this.playArea;
    const halfSize = size / 2;
    
    // Horizontal grain lines
    g.lineStyle(1, 0xc9b896, 0.3);
    for (let i = 0; i < 50; i++) {
      const lineY = y - halfSize + (size / 50) * i;
      // Slightly wavy lines for natural wood look
      g.beginPath();
      g.moveTo(x - halfSize, lineY);
      for (let j = 0; j <= 10; j++) {
        const lineX = x - halfSize + (size / 10) * j;
        const offset = Math.sin(i * 0.5 + j * 0.3) * 0.5;
        g.lineTo(lineX, lineY + offset);
      }
      g.strokePath();
    }
    
    // Subtle vertical variation
    g.lineStyle(1, 0xd4c4a0, 0.15);
    for (let i = 0; i < 25; i++) {
      const lineX = x - halfSize + (size / 25) * i;
      g.beginPath();
      g.moveTo(lineX, y - halfSize);
      g.lineTo(lineX, y + halfSize);
      g.strokePath();
    }
  }

  private drawBoundaryLines(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const size = this.playArea;
    
    // Outer boundary (close to frame)
    const outerInset = 12;
    g.lineStyle(2.5, 0x8b6914, 0.8);
    g.strokeRect(
      x - size / 2 + outerInset,
      y - size / 2 + outerInset,
      size - outerInset * 2,
      size - outerInset * 2
    );
    
    // Inner boundary
    const innerInset = 38;
    g.lineStyle(2, 0x8b6914, 0.6);
    g.strokeRect(
      x - size / 2 + innerInset,
      y - size / 2 + innerInset,
      size - innerInset * 2,
      size - innerInset * 2
    );
  }

  private drawCornerCircles(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const size = this.playArea;
    const offset = size / 2 - 55;
    
    g.lineStyle(1.5, 0x8b6914, 0.5);
    g.strokeCircle(x - offset, y - offset, 12);
    g.strokeCircle(x + offset, y - offset, 12);
    g.strokeCircle(x - offset, y + offset, 12);
    g.strokeCircle(x + offset, y + offset, 12);
  }

  private drawAllBaselines(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const size = this.playArea;
    const baseOffset = size / 2 - 42;
    const lineLength = 90;
    const circleRadius = 12;
    
    // Helper to draw baseline with circles
    const drawBaseline = (
      startX: number, startY: number,
      endX: number, endY: number,
      midX: number, midY: number
    ) => {
      // Line
      g.lineStyle(2, 0x8b6914, 0.6);
      g.beginPath();
      g.moveTo(startX, startY);
      g.lineTo(endX, endY);
      g.strokePath();
      
      // Circles at ends and middle
      g.lineStyle(2, 0x8b6914, 0.5);
      g.strokeCircle(startX, startY, circleRadius);
      g.strokeCircle(endX, endY, circleRadius);
      g.strokeCircle(midX, midY, circleRadius);
    };
    
    // Top baseline
    drawBaseline(
      x - lineLength / 2, y - baseOffset,
      x + lineLength / 2, y - baseOffset,
      x, y - baseOffset
    );
    
    // Bottom baseline  
    drawBaseline(
      x - lineLength / 2, y + baseOffset,
      x + lineLength / 2, y + baseOffset,
      x, y + baseOffset
    );
    
    // Left baseline
    drawBaseline(
      x - baseOffset, y - lineLength / 2,
      x - baseOffset, y + lineLength / 2,
      x - baseOffset, y
    );
    
    // Right baseline
    drawBaseline(
      x + baseOffset, y - lineLength / 2,
      x + baseOffset, y + lineLength / 2,
      x + baseOffset, y
    );
  }

  private drawDiagonalArrows(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const size = this.playArea;
    
    // Arrow positions - from inner area toward corners
    const innerOffset = 70;
    const outerOffset = size / 2 - 25;
    
    g.lineStyle(2, 0x8b6914, 0.5);
    
    // Top-left arrow
    g.beginPath();
    g.moveTo(x - innerOffset, y - innerOffset);
    g.lineTo(x - outerOffset, y - outerOffset);
    g.strokePath();
    
    // Top-right arrow
    g.beginPath();
    g.moveTo(x + innerOffset, y - innerOffset);
    g.lineTo(x + outerOffset, y - outerOffset);
    g.strokePath();
    
    // Bottom-left arrow
    g.beginPath();
    g.moveTo(x - innerOffset, y + innerOffset);
    g.lineTo(x - outerOffset, y + outerOffset);
    g.strokePath();
    
    // Bottom-right arrow
    g.beginPath();
    g.moveTo(x + innerOffset, y + innerOffset);
    g.lineTo(x + outerOffset, y + outerOffset);
    g.strokePath();
  }

  private drawCenterCircles(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    
    // Outer circle
    g.lineStyle(2.5, 0x8b6914, 0.7);
    g.strokeCircle(x, y, 72);
    
    // Inner circle
    g.lineStyle(2, 0x8b6914, 0.5);
    g.strokeCircle(x, y, 48);
  }

  private drawPockets(): void {
    const g = this.scene.add.graphics();
    const x = this.centerX;
    const y = this.centerY;
    const offset = this.playArea / 2 - 8;
    const radius = POCKET_RADIUS;
    
    const pockets = [
      { px: x - offset, py: y - offset },
      { px: x + offset, py: y - offset },
      { px: x - offset, py: y + offset },
      { px: x + offset, py: y + offset },
    ];
    
    pockets.forEach(({ px, py }) => {
      // Outer highlight ring
      g.fillStyle(0x5a4030, 0.9);
      g.fillCircle(px, py, radius + 5);
      
      // Dark wood ring
      g.fillStyle(0x3d2817, 1);
      g.fillCircle(px, py, radius + 2);
      
      // Black hole
      g.fillStyle(0x0a0604, 1);
      g.fillCircle(px, py, radius);
      
      // Inner depth shadow (offset for 3D effect)
      g.fillStyle(0x000000, 0.6);
      g.fillCircle(px + 1, py + 1, radius - 3);
    });
  }

  public getPockets(): { x: number; y: number }[] {
    const offset = this.playArea / 2 - 8;
    return [
      { x: this.centerX - offset, y: this.centerY - offset },
      { x: this.centerX + offset, y: this.centerY - offset },
      { x: this.centerX - offset, y: this.centerY + offset },
      { x: this.centerX + offset, y: this.centerY + offset },
    ];
  }
}
