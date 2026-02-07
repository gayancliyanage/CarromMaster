import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' });
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Purple gradient background
    this.createBackground();

    // Title with glow effect
    const titleShadow = this.add.text(centerX + 2, 102, '🎯 CarromMaster', {
      font: 'bold 32px Arial',
      color: '#000000',
    });
    titleShadow.setOrigin(0.5);
    titleShadow.setAlpha(0.3);

    const title = this.add.text(centerX, 100, '🎯 CarromMaster', {
      font: 'bold 32px Arial',
      color: '#ffffff',
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(centerX, 140, 'The Classic Board Game', {
      font: '16px Arial',
      color: '#b388ff',
    });
    subtitle.setOrigin(0.5);

    // Draw premium mini board preview
    this.drawMiniBoard(centerX, centerY - 20);

    // Play button with premium styling
    const playButtonY = centerY + 180;
    
    // Button glow
    const buttonGlow = this.add.graphics();
    buttonGlow.fillStyle(0xffd700, 0.3);
    buttonGlow.fillRoundedRect(centerX - 85, playButtonY - 28, 170, 56, 28);
    
    // Button background
    const playButton = this.add.graphics();
    playButton.fillStyle(0xffd700);
    playButton.fillRoundedRect(centerX - 80, playButtonY - 25, 160, 50, 25);
    
    // Button gradient overlay
    playButton.fillStyle(0xffeb3b, 0.5);
    playButton.fillRoundedRect(centerX - 75, playButtonY - 22, 150, 20, 12);

    const playText = this.add.text(centerX, playButtonY, '▶  PLAY', {
      font: 'bold 22px Arial',
      color: '#1a0a2e',
    });
    playText.setOrigin(0.5);

    // Interactive zone
    const playZone = this.add.zone(centerX, playButtonY, 160, 50);
    playZone.setInteractive({ useHandCursor: true });

    playZone.on('pointerover', () => {
      playButton.setScale(1.05);
      playText.setScale(1.05);
      buttonGlow.setAlpha(0.5);
    });

    playZone.on('pointerout', () => {
      playButton.setScale(1);
      playText.setScale(1);
      buttonGlow.setAlpha(0.3);
    });

    playZone.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('Game');
      });
    });

    // Instructions
    const instructions = this.add.text(centerX, GAME_HEIGHT - 80,
      'Drag striker to aim\nRelease to shoot', {
        font: '14px Arial',
        color: '#8866aa',
        align: 'center',
      });
    instructions.setOrigin(0.5);

    // Version
    const version = this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 15, 'v0.2.0', {
      font: '11px Arial',
      color: '#553377',
    });
    version.setOrigin(1, 1);

    // Fade in
    this.cameras.main.fadeIn(300);
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    const steps = 30;
    
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

  private drawMiniBoard(x: number, y: number): void {
    const size = 220;
    const graphics = this.add.graphics();

    // Board frame
    graphics.fillStyle(COLORS.boardFrame);
    graphics.fillRoundedRect(x - size / 2 - 10, y - size / 2 - 10, size + 20, size + 20, 8);

    // Gold border
    graphics.fillStyle(COLORS.boardBorder);
    graphics.fillRoundedRect(x - size / 2 - 5, y - size / 2 - 5, size + 10, size + 10, 6);

    // Board surface
    graphics.fillStyle(COLORS.board);
    graphics.fillRect(x - size / 2, y - size / 2, size, size);

    // Wood grain
    graphics.lineStyle(1, COLORS.boardDark, 0.1);
    for (let i = 0; i < 15; i++) {
      const lineY = y - size / 2 + (size / 15) * i;
      graphics.beginPath();
      graphics.moveTo(x - size / 2, lineY);
      graphics.lineTo(x + size / 2, lineY);
      graphics.strokePath();
    }

    // Inner border
    graphics.lineStyle(2, COLORS.boardDark, 0.4);
    graphics.strokeRect(x - size / 2 + 15, y - size / 2 + 15, size - 30, size - 30);

    // Center circles
    graphics.lineStyle(2, COLORS.boardDark, 0.3);
    graphics.strokeCircle(x, y, 40);
    graphics.strokeCircle(x, y, 25);
    graphics.strokeCircle(x, y, 12);

    // Pockets
    const pocketOffset = size / 2 - 12;
    const pocketPositions = [
      { px: x - pocketOffset, py: y - pocketOffset },
      { px: x + pocketOffset, py: y - pocketOffset },
      { px: x - pocketOffset, py: y + pocketOffset },
      { px: x + pocketOffset, py: y + pocketOffset },
    ];

    pocketPositions.forEach(({ px, py }) => {
      graphics.fillStyle(COLORS.pocketHighlight, 0.6);
      graphics.fillCircle(px, py, 16);
      graphics.fillStyle(COLORS.pocketRing);
      graphics.fillCircle(px, py, 13);
      graphics.fillStyle(COLORS.pocket);
      graphics.fillCircle(px, py, 10);
    });

    // Center pieces preview (flower pattern)
    // Queen
    graphics.fillStyle(COLORS.queen);
    graphics.fillCircle(x, y, 8);
    graphics.lineStyle(1, COLORS.queenRing);
    graphics.strokeCircle(x, y, 8);

    // Inner ring
    const innerRadius = 18;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
      const px = x + Math.cos(angle) * innerRadius;
      const py = y + Math.sin(angle) * innerRadius;
      const color = i % 2 === 0 ? COLORS.whitePiece : COLORS.blackPiece;
      const ringColor = i % 2 === 0 ? COLORS.whitePieceRing : COLORS.blackPieceRing;
      
      graphics.fillStyle(color);
      graphics.fillCircle(px, py, 6);
      graphics.lineStyle(1, ringColor);
      graphics.strokeCircle(px, py, 6);
    }

    // Outer ring (partial)
    const outerRadius = 35;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
      const px = x + Math.cos(angle) * outerRadius;
      const py = y + Math.sin(angle) * outerRadius;
      const color = i % 2 === 0 ? COLORS.whitePiece : COLORS.blackPiece;
      const ringColor = i % 2 === 0 ? COLORS.whitePieceRing : COLORS.blackPieceRing;
      
      graphics.fillStyle(color);
      graphics.fillCircle(px, py, 5);
      graphics.lineStyle(1, ringColor);
      graphics.strokeCircle(px, py, 5);
    }

    // Striker at bottom
    const strikerY = y + size / 2 - 25;
    graphics.fillStyle(0x000000, 0.2);
    graphics.fillCircle(x + 2, strikerY + 2, 10);
    graphics.fillStyle(COLORS.striker);
    graphics.fillCircle(x, strikerY, 10);
    graphics.lineStyle(2, COLORS.strikerRing);
    graphics.strokeCircle(x, strikerY, 8);
  }
}
