import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

interface GameOverData {
  winner: 'white' | 'black';
  whiteScore: number;
  blackScore: number;
  isHumanWinner: boolean;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create(data: GameOverData): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Background gradient
    const bg = this.add.graphics();
    if (data.isHumanWinner) {
      // Victory gradient (green tones)
      bg.fillStyle(0x1a3d1a, 0.98);
    } else {
      // Defeat gradient (red tones)
      bg.fillStyle(0x3d1a1a, 0.98);
    }
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Emoji and message based on outcome
    const emoji = data.isHumanWinner ? '🏆' : '😔';
    const message = data.isHumanWinner ? 'YOU WIN!' : 'CPU WINS';
    const messageColor = data.isHumanWinner ? '#ffd700' : '#ff6666';
    
    // Trophy/emoji
    const emojiText = this.add.text(centerX, centerY - 180, emoji, {
      font: '80px Arial',
    });
    emojiText.setOrigin(0.5);
    
    // Add subtle animation to emoji
    this.tweens.add({
      targets: emojiText,
      y: centerY - 190,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Winner text
    const winnerText = this.add.text(centerX, centerY - 80, message, {
      font: 'bold 52px Arial',
      color: messageColor,
      stroke: '#000000',
      strokeThickness: 4,
    });
    winnerText.setOrigin(0.5);

    // Subtitle
    const subtitle = data.isHumanWinner 
      ? 'Congratulations! 🎉' 
      : 'Better luck next time!';
    const subtitleText = this.add.text(centerX, centerY - 30, subtitle, {
      font: '20px Arial',
      color: '#cccccc',
    });
    subtitleText.setOrigin(0.5);

    // Score panel
    const scorePanel = this.add.graphics();
    scorePanel.fillStyle(0x000000, 0.4);
    scorePanel.fillRoundedRect(centerX - 120, centerY + 10, 240, 80, 10);
    
    // Score display
    const yourScore = this.add.text(centerX - 60, centerY + 35, `You`, {
      font: '16px Arial',
      color: '#ffffff',
    });
    yourScore.setOrigin(0.5);
    
    const yourScoreNum = this.add.text(centerX - 60, centerY + 60, `${data.whiteScore}`, {
      font: 'bold 28px Arial',
      color: COLORS.whitePiece.toString(16).padStart(6, '0').replace(/^/, '#'),
    });
    yourScoreNum.setOrigin(0.5);
    
    const vsText = this.add.text(centerX, centerY + 50, 'vs', {
      font: '16px Arial',
      color: '#888888',
    });
    vsText.setOrigin(0.5);
    
    const cpuScore = this.add.text(centerX + 60, centerY + 35, `CPU`, {
      font: '16px Arial',
      color: '#ffffff',
    });
    cpuScore.setOrigin(0.5);
    
    const cpuScoreNum = this.add.text(centerX + 60, centerY + 60, `${data.blackScore}`, {
      font: 'bold 28px Arial',
      color: '#444444',
    });
    cpuScoreNum.setOrigin(0.5);

    // Play Again button
    const playAgainButton = this.add.graphics();
    playAgainButton.fillStyle(data.isHumanWinner ? 0x44aa44 : 0xaa4444);
    playAgainButton.fillRoundedRect(centerX - 100, centerY + 120, 200, 50, 10);
    
    const playAgainHitArea = this.add.rectangle(centerX, centerY + 145, 200, 50);
    playAgainHitArea.setInteractive({ useHandCursor: true });
    
    const playAgainText = this.add.text(centerX, centerY + 145, '🎮 PLAY AGAIN', {
      font: 'bold 18px Arial',
      color: '#ffffff',
    });
    playAgainText.setOrigin(0.5);

    playAgainHitArea.on('pointerover', () => {
      playAgainButton.clear();
      playAgainButton.fillStyle(data.isHumanWinner ? 0x55bb55 : 0xbb5555);
      playAgainButton.fillRoundedRect(centerX - 105, centerY + 117, 210, 56, 10);
    });

    playAgainHitArea.on('pointerout', () => {
      playAgainButton.clear();
      playAgainButton.fillStyle(data.isHumanWinner ? 0x44aa44 : 0xaa4444);
      playAgainButton.fillRoundedRect(centerX - 100, centerY + 120, 200, 50, 10);
    });

    playAgainHitArea.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.start('Game');
      });
    });

    // Menu button
    const menuButton = this.add.graphics();
    menuButton.fillStyle(0x444444);
    menuButton.fillRoundedRect(centerX - 100, centerY + 185, 200, 50, 10);
    
    const menuHitArea = this.add.rectangle(centerX, centerY + 210, 200, 50);
    menuHitArea.setInteractive({ useHandCursor: true });
    
    const menuText = this.add.text(centerX, centerY + 210, '🏠 MAIN MENU', {
      font: 'bold 18px Arial',
      color: '#ffffff',
    });
    menuText.setOrigin(0.5);

    menuHitArea.on('pointerover', () => {
      menuButton.clear();
      menuButton.fillStyle(0x555555);
      menuButton.fillRoundedRect(centerX - 105, centerY + 182, 210, 56, 10);
    });

    menuHitArea.on('pointerout', () => {
      menuButton.clear();
      menuButton.fillStyle(0x444444);
      menuButton.fillRoundedRect(centerX - 100, centerY + 185, 200, 50, 10);
    });

    menuHitArea.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.start('Menu');
      });
    });

    // Add confetti effect for winner
    if (data.isHumanWinner) {
      this.createConfetti();
    }

    // Fade in
    this.cameras.main.fadeIn(300);
  }

  private createConfetti(): void {
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffd700];
    
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const delay = Phaser.Math.Between(0, 1000);
      const color = Phaser.Utils.Array.GetRandom(colors);
      
      this.time.delayedCall(delay, () => {
        const confetti = this.add.graphics();
        confetti.fillStyle(color);
        confetti.fillRect(-4, -8, 8, 16);
        confetti.setPosition(x, -20);
        confetti.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
        
        this.tweens.add({
          targets: confetti,
          y: GAME_HEIGHT + 50,
          x: x + Phaser.Math.Between(-100, 100),
          rotation: confetti.rotation + Phaser.Math.FloatBetween(-5, 5),
          duration: Phaser.Math.Between(2000, 4000),
          ease: 'Sine.easeIn',
          onComplete: () => confetti.destroy(),
        });
      });
    }
  }
}
