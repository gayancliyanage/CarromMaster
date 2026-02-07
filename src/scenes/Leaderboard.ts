import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { LeaderboardService, LeaderboardEntry } from '../services/LeaderboardService';

export class LeaderboardScene extends Phaser.Scene {
  private leaderboardService: LeaderboardService;

  constructor() {
    super({ key: 'Leaderboard' });
    this.leaderboardService = LeaderboardService.getInstance();
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;

    // Background
    this.createBackground();

    // Title
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x000000, 0.3);
    titleBg.fillRoundedRect(centerX - 120, 30, 240, 50, 10);

    const title = this.add.text(centerX, 55, '🏆 LEADERBOARD', {
      font: 'bold 28px Arial',
      color: '#ffd700',
    });
    title.setOrigin(0.5);

    // Leaderboard panel
    const panelY = 100;
    const panelHeight = GAME_HEIGHT - 200;
    
    const panel = this.add.graphics();
    panel.fillStyle(0x1a0a2e, 0.9);
    panel.fillRoundedRect(20, panelY, GAME_WIDTH - 40, panelHeight, 15);
    panel.lineStyle(2, 0x6644aa);
    panel.strokeRoundedRect(20, panelY, GAME_WIDTH - 40, panelHeight, 15);

    // Header row
    const headerY = panelY + 25;
    this.add.text(50, headerY, '#', { font: 'bold 14px Arial', color: '#888888' });
    this.add.text(80, headerY, 'NAME', { font: 'bold 14px Arial', color: '#888888' });
    this.add.text(GAME_WIDTH - 160, headerY, 'SCORE', { font: 'bold 14px Arial', color: '#888888' });
    this.add.text(GAME_WIDTH - 80, headerY, 'WINS', { font: 'bold 14px Arial', color: '#888888' });

    // Divider
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x444444);
    divider.beginPath();
    divider.moveTo(40, headerY + 25);
    divider.lineTo(GAME_WIDTH - 40, headerY + 25);
    divider.strokePath();

    // Get entries
    const entries = this.leaderboardService.getEntries();

    if (entries.length === 0) {
      const noData = this.add.text(centerX, panelY + panelHeight / 2, 'No scores yet!\nPlay a game to get on the board 🎮', {
        font: '18px Arial',
        color: '#666666',
        align: 'center',
      });
      noData.setOrigin(0.5);
    } else {
      // Display entries
      entries.forEach((entry, index) => {
        this.createEntryRow(entry, index, headerY + 45 + index * 45);
      });
    }

    // Back button
    const backBtn = this.add.rectangle(centerX, GAME_HEIGHT - 50, 160, 45, 0x4a4a6a);
    backBtn.setStrokeStyle(2, 0x6a6a8a);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setFillStyle(0x5a5a7a));
    backBtn.on('pointerout', () => backBtn.setFillStyle(0x4a4a6a));
    backBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(200);
      this.time.delayedCall(200, () => this.scene.start('Menu'));
    });

    const backText = this.add.text(centerX, GAME_HEIGHT - 50, '← BACK', {
      font: 'bold 18px Arial',
      color: '#ffffff',
    });
    backText.setOrigin(0.5);

    // Fade in
    this.cameras.main.fadeIn(200);
  }

  private createEntryRow(entry: LeaderboardEntry, index: number, y: number): void {
    const rank = index + 1;
    
    // Row background for top 3
    if (rank <= 3) {
      const rowBg = this.add.graphics();
      const colors = [0xffd700, 0xc0c0c0, 0xcd7f32]; // Gold, Silver, Bronze
      rowBg.fillStyle(colors[index], 0.15);
      rowBg.fillRoundedRect(30, y - 15, GAME_WIDTH - 60, 40, 8);
    }

    // Rank with medal emoji for top 3
    const rankText = rank <= 3 ? ['🥇', '🥈', '🥉'][index] : `${rank}`;
    const rankColor = rank <= 3 ? '#ffffff' : '#888888';
    this.add.text(50, y, rankText, { 
      font: rank <= 3 ? '20px Arial' : 'bold 16px Arial', 
      color: rankColor 
    }).setOrigin(0, 0.5);

    // Name
    const nameColor = rank === 1 ? '#ffd700' : '#ffffff';
    this.add.text(80, y, entry.name, {
      font: rank <= 3 ? 'bold 16px Arial' : '16px Arial',
      color: nameColor,
    }).setOrigin(0, 0.5);

    // Mode indicator
    const modeEmoji = entry.mode === 'cpu' ? '🤖' : '🌐';
    this.add.text(GAME_WIDTH - 200, y, modeEmoji, {
      font: '14px Arial',
    }).setOrigin(0.5);

    // Score
    this.add.text(GAME_WIDTH - 145, y, entry.score.toString(), {
      font: rank <= 3 ? 'bold 16px Arial' : '16px Arial',
      color: rank === 1 ? '#ffd700' : '#44ff44',
    }).setOrigin(0.5);

    // Wins
    this.add.text(GAME_WIDTH - 65, y, entry.wins.toString(), {
      font: '16px Arial',
      color: '#88aaff',
    }).setOrigin(0.5);
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    const steps = 20;
    for (let i = 0; i < steps; i++) {
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
}
