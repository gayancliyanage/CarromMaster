import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { LeaderboardService } from '../services/LeaderboardService';

interface GameOverData {
  winner: 'white' | 'black';
  whiteScore: number;
  blackScore: number;
  isHumanWinner: boolean;
  mode?: 'cpu' | 'multiplayer-host' | 'multiplayer-guest';
}

export class GameOverScene extends Phaser.Scene {
  private leaderboardService: LeaderboardService;
  private nameInput: HTMLInputElement | null = null;
  private gameData!: GameOverData;
  private nameEntryContainer!: Phaser.GameObjects.Container;
  private showingNameEntry = false;

  constructor() {
    super({ key: 'GameOver' });
    this.leaderboardService = LeaderboardService.getInstance();
  }

  create(data: GameOverData): void {
    this.gameData = data;
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(data.isHumanWinner ? 0x1a3d1a : 0x3d1a1a, 0.98);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const emoji = data.isHumanWinner ? '🏆' : '😔';
    const message = data.isHumanWinner ? 'YOU WIN!' : 'CPU WINS';
    const messageColor = data.isHumanWinner ? '#ffd700' : '#ff6666';
    
    const emojiText = this.add.text(centerX, centerY - 180, emoji, { font: '80px Arial' });
    emojiText.setOrigin(0.5);
    
    this.tweens.add({
      targets: emojiText,
      y: centerY - 190,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const winnerText = this.add.text(centerX, centerY - 80, message, {
      font: 'bold 52px Arial',
      color: messageColor,
      stroke: '#000000',
      strokeThickness: 4,
    });
    winnerText.setOrigin(0.5);

    const subtitle = data.isHumanWinner ? 'Congratulations! 🎉' : 'Better luck next time!';
    this.add.text(centerX, centerY - 30, subtitle, {
      font: '20px Arial',
      color: '#cccccc',
    }).setOrigin(0.5);

    // Score panel
    const scorePanel = this.add.graphics();
    scorePanel.fillStyle(0x000000, 0.4);
    scorePanel.fillRoundedRect(centerX - 120, centerY + 10, 240, 80, 10);
    
    this.add.text(centerX - 60, centerY + 35, 'You', { font: '16px Arial', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(centerX - 60, centerY + 60, `${data.whiteScore}`, {
      font: 'bold 28px Arial',
      color: '#f5f5dc',
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY + 50, 'vs', { font: '16px Arial', color: '#888888' }).setOrigin(0.5);
    
    this.add.text(centerX + 60, centerY + 35, 'CPU', { font: '16px Arial', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(centerX + 60, centerY + 60, `${data.blackScore}`, {
      font: 'bold 28px Arial',
      color: '#444444',
    }).setOrigin(0.5);

    // If winner, show name entry prompt
    if (data.isHumanWinner) {
      this.createNameEntry(centerX, centerY);
      this.createConfetti();
    } else {
      this.createButtons(centerX, centerY);
    }

    this.cameras.main.fadeIn(300);

    this.events.on('shutdown', () => {
      this.removeHtmlInput();
    });
  }

  private createNameEntry(centerX: number, centerY: number): void {
    this.nameEntryContainer = this.add.container(centerX, centerY + 130);
    this.showingNameEntry = true;

    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a4a, 0.95);
    panel.fillRoundedRect(-140, -20, 280, 130, 12);
    panel.lineStyle(2, 0xffd700);
    panel.strokeRoundedRect(-140, -20, 280, 130, 12);

    const prompt = this.add.text(0, -5, '⭐ Enter your name for the leaderboard!', {
      font: 'bold 13px Arial',
      color: '#ffd700',
    });
    prompt.setOrigin(0.5);

    // Input area (visual)
    const inputBg = this.add.graphics();
    inputBg.fillStyle(0x1a0a2e);
    inputBg.fillRoundedRect(-100, 15, 200, 40, 8);
    inputBg.lineStyle(2, 0x6644aa);
    inputBg.strokeRoundedRect(-100, 15, 200, 40, 8);

    const inputHint = this.add.text(0, 35, 'Tap to type', {
      font: '14px Arial',
      color: '#666666',
    });
    inputHint.setOrigin(0.5);
    inputHint.setName('inputHint');

    const inputHitArea = this.add.zone(0, 35, 200, 40);
    inputHitArea.setInteractive({ useHandCursor: true });
    inputHitArea.on('pointerdown', () => this.focusHtmlInput());

    // Save button
    const saveBtn = this.add.rectangle(0, 85, 120, 35, 0x44aa44);
    saveBtn.setStrokeStyle(2, 0x66cc66);
    saveBtn.setInteractive({ useHandCursor: true });
    saveBtn.on('pointerdown', () => this.saveScore());

    const saveText = this.add.text(0, 85, '✓ SAVE', {
      font: 'bold 14px Arial',
      color: '#ffffff',
    });
    saveText.setOrigin(0.5);

    // Skip button
    const skipText = this.add.text(120, 85, 'Skip →', {
      font: '12px Arial',
      color: '#888888',
    });
    skipText.setOrigin(0.5);
    skipText.setInteractive({ useHandCursor: true });
    skipText.on('pointerdown', () => this.skipNameEntry());

    this.nameEntryContainer.add([panel, prompt, inputBg, inputHint, inputHitArea, saveBtn, saveText, skipText]);

    // Auto-focus after a short delay
    this.time.delayedCall(500, () => {
      this.createHtmlInput();
    });
  }

  private createHtmlInput(): void {
    if (this.nameInput) return;

    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / GAME_WIDTH;
    const scaleY = rect.height / GAME_HEIGHT;
    
    const inputX = rect.left + (GAME_WIDTH / 2 - 95) * scaleX;
    const inputY = rect.top + (GAME_HEIGHT / 2 + 140) * scaleY;
    const inputWidth = 190 * scaleX;
    const inputHeight = 35 * scaleY;

    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.maxLength = 12;
    this.nameInput.placeholder = 'Your name';
    this.nameInput.autocomplete = 'off';
    this.nameInput.style.cssText = `
      position: fixed;
      left: ${inputX}px;
      top: ${inputY}px;
      width: ${inputWidth}px;
      height: ${inputHeight}px;
      font-size: ${16 * scaleY}px;
      font-family: Arial, sans-serif;
      text-align: center;
      background: #2a1a4a;
      border: 2px solid #8866cc;
      border-radius: 8px;
      color: #ffffff;
      outline: none;
      z-index: 1000;
    `;

    this.nameInput.addEventListener('input', () => {
      const inputHint = this.nameEntryContainer.getByName('inputHint') as Phaser.GameObjects.Text;
      if (inputHint && this.nameInput) {
        inputHint.setVisible(this.nameInput.value.length === 0);
      }
    });

    this.nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveScore();
      }
    });

    document.body.appendChild(this.nameInput);
  }

  private focusHtmlInput(): void {
    if (!this.nameInput) {
      this.createHtmlInput();
    }
    if (this.nameInput) {
      this.nameInput.focus();
      const inputHint = this.nameEntryContainer.getByName('inputHint') as Phaser.GameObjects.Text;
      if (inputHint) inputHint.setVisible(false);
    }
  }

  private removeHtmlInput(): void {
    if (this.nameInput) {
      this.nameInput.remove();
      this.nameInput = null;
    }
  }

  private saveScore(): void {
    const name = this.nameInput?.value?.trim() || 'Player';
    const score = this.gameData.whiteScore;
    const mode = this.gameData.mode?.startsWith('multiplayer') ? 'multiplayer' : 'cpu';
    
    const rank = this.leaderboardService.addEntry(name, score, mode as 'cpu' | 'multiplayer');
    
    this.removeHtmlInput();
    this.showingNameEntry = false;
    this.nameEntryContainer.destroy();
    
    // Show rank message
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    
    const rankMsg = this.add.text(centerX, centerY + 130, `🎉 You're #${rank} on the leaderboard!`, {
      font: 'bold 18px Arial',
      color: '#ffd700',
      backgroundColor: '#00000088',
      padding: { x: 15, y: 8 },
    });
    rankMsg.setOrigin(0.5);

    this.time.delayedCall(1000, () => {
      this.createButtons(centerX, centerY);
    });
  }

  private skipNameEntry(): void {
    this.removeHtmlInput();
    this.showingNameEntry = false;
    this.nameEntryContainer.destroy();
    this.createButtons(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  }

  private createButtons(centerX: number, centerY: number): void {
    const buttonY = this.showingNameEntry ? centerY + 260 : centerY + 170;

    // Play Again button
    const playColor = this.gameData.isHumanWinner ? 0x44aa44 : 0xaa4444;
    const playAgainBtn = this.add.rectangle(centerX, buttonY, 200, 50, playColor);
    playAgainBtn.setStrokeStyle(2, this.gameData.isHumanWinner ? 0x66cc66 : 0xcc6666);
    playAgainBtn.setInteractive({ useHandCursor: true });
    playAgainBtn.on('pointerover', () => playAgainBtn.setFillStyle(this.gameData.isHumanWinner ? 0x55bb55 : 0xbb5555));
    playAgainBtn.on('pointerout', () => playAgainBtn.setFillStyle(playColor));
    playAgainBtn.on('pointerdown', () => {
      this.removeHtmlInput();
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => this.scene.start('Game', { mode: 'cpu' }));
    });

    this.add.text(centerX, buttonY, '🎮 PLAY AGAIN', {
      font: 'bold 18px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Leaderboard button
    const lbBtn = this.add.rectangle(centerX, buttonY + 60, 200, 45, 0x6644aa);
    lbBtn.setStrokeStyle(2, 0x8866cc);
    lbBtn.setInteractive({ useHandCursor: true });
    lbBtn.on('pointerover', () => lbBtn.setFillStyle(0x7755bb));
    lbBtn.on('pointerout', () => lbBtn.setFillStyle(0x6644aa));
    lbBtn.on('pointerdown', () => {
      this.removeHtmlInput();
      this.cameras.main.fadeOut(200);
      this.time.delayedCall(200, () => this.scene.start('Leaderboard'));
    });

    this.add.text(centerX, buttonY + 60, '🏆 LEADERBOARD', {
      font: 'bold 16px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Menu button
    const menuBtn = this.add.rectangle(centerX, buttonY + 115, 200, 45, 0x444444);
    menuBtn.setStrokeStyle(2, 0x666666);
    menuBtn.setInteractive({ useHandCursor: true });
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x555555));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x444444));
    menuBtn.on('pointerdown', () => {
      this.removeHtmlInput();
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => this.scene.start('Menu'));
    });

    this.add.text(centerX, buttonY + 115, '🏠 MAIN MENU', {
      font: 'bold 16px Arial',
      color: '#ffffff',
    }).setOrigin(0.5);
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
