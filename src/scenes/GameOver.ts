import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

interface GameOverData {
  winner: 'white' | 'black';
  whiteScore: number;
  blackScore: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create(data: GameOverData): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Background
    this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 0.95);

    // Winner text
    const winnerColor = data.winner === 'white' ? '#ffffff' : '#888888';
    const winnerText = this.add.text(centerX, centerY - 100, `${data.winner.toUpperCase()} WINS!`, {
      font: 'bold 48px Arial',
      color: winnerColor,
    });
    winnerText.setOrigin(0.5);

    // Trophy emoji
    const trophy = this.add.text(centerX, centerY - 180, '🏆', {
      font: '72px Arial',
    });
    trophy.setOrigin(0.5);

    // Final score
    const scoreText = this.add.text(centerX, centerY, 
      `Final Score\nWhite: ${data.whiteScore}  |  Black: ${data.blackScore}`, {
      font: '24px Arial',
      color: '#888888',
      align: 'center',
    });
    scoreText.setOrigin(0.5);

    // Play Again button
    const playAgainButton = this.add.rectangle(centerX, centerY + 100, 200, 50, COLORS.striker);
    playAgainButton.setInteractive({ useHandCursor: true });
    
    const playAgainText = this.add.text(centerX, centerY + 100, 'PLAY AGAIN', {
      font: 'bold 20px Arial',
      color: '#000000',
    });
    playAgainText.setOrigin(0.5);

    playAgainButton.on('pointerover', () => {
      playAgainButton.setScale(1.05);
      playAgainText.setScale(1.05);
    });

    playAgainButton.on('pointerout', () => {
      playAgainButton.setScale(1);
      playAgainText.setScale(1);
    });

    playAgainButton.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.start('Game');
      });
    });

    // Menu button
    const menuButton = this.add.rectangle(centerX, centerY + 170, 200, 50, 0x444444);
    menuButton.setInteractive({ useHandCursor: true });
    
    const menuText = this.add.text(centerX, centerY + 170, 'MAIN MENU', {
      font: 'bold 20px Arial',
      color: '#ffffff',
    });
    menuText.setOrigin(0.5);

    menuButton.on('pointerover', () => {
      menuButton.setScale(1.05);
      menuText.setScale(1.05);
    });

    menuButton.on('pointerout', () => {
      menuButton.setScale(1);
      menuText.setScale(1);
    });

    menuButton.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.start('Menu');
      });
    });

    // Fade in
    this.cameras.main.fadeIn(300);
  }
}
