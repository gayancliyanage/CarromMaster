import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' });
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Background
    this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

    // Title
    const title = this.add.text(centerX, 150, '🎯 CarromMaster', {
      font: 'bold 48px Arial',
      color: '#ffffff',
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(centerX, 210, 'The Classic Board Game', {
      font: '24px Arial',
      color: '#888888',
    });
    subtitle.setOrigin(0.5);

    // Draw a mini carrom board preview
    this.drawMiniBoard(centerX, centerY - 30);

    // Play button
    const playButton = this.add.rectangle(centerX, centerY + 180, 200, 60, COLORS.striker);
    playButton.setInteractive({ useHandCursor: true });
    
    const playText = this.add.text(centerX, centerY + 180, 'PLAY', {
      font: 'bold 28px Arial',
      color: '#000000',
    });
    playText.setOrigin(0.5);

    // Button hover effects
    playButton.on('pointerover', () => {
      playButton.setScale(1.05);
      playText.setScale(1.05);
    });

    playButton.on('pointerout', () => {
      playButton.setScale(1);
      playText.setScale(1);
    });

    playButton.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('Game');
      });
    });

    // Instructions
    const instructions = this.add.text(centerX, GAME_HEIGHT - 100, 
      'Drag to aim • Release to strike\nPocket all your pieces to win!', {
      font: '16px Arial',
      color: '#666666',
      align: 'center',
    });
    instructions.setOrigin(0.5);

    // Version
    const version = this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.1.0', {
      font: '12px Arial',
      color: '#444444',
    });
    version.setOrigin(1, 1);

    // Fade in
    this.cameras.main.fadeIn(300);
  }

  private drawMiniBoard(x: number, y: number): void {
    const size = 200;
    const graphics = this.add.graphics();

    // Board background
    graphics.fillStyle(COLORS.board);
    graphics.fillRoundedRect(x - size / 2, y - size / 2, size, size, 10);

    // Border
    graphics.lineStyle(4, COLORS.boardBorder);
    graphics.strokeRoundedRect(x - size / 2, y - size / 2, size, size, 10);

    // Pockets (corners)
    graphics.fillStyle(COLORS.pocket);
    const pocketOffset = size / 2 - 15;
    graphics.fillCircle(x - pocketOffset, y - pocketOffset, 12);
    graphics.fillCircle(x + pocketOffset, y - pocketOffset, 12);
    graphics.fillCircle(x - pocketOffset, y + pocketOffset, 12);
    graphics.fillCircle(x + pocketOffset, y + pocketOffset, 12);

    // Center pieces preview
    graphics.fillStyle(COLORS.queen);
    graphics.fillCircle(x, y, 8);
    
    graphics.fillStyle(COLORS.whitePiece);
    graphics.fillCircle(x, y - 20, 6);
    graphics.fillCircle(x + 20, y, 6);
    
    graphics.fillStyle(COLORS.blackPiece);
    graphics.fillCircle(x - 20, y, 6);
    graphics.fillCircle(x, y + 20, 6);
  }
}
