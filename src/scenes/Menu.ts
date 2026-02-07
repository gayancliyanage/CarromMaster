import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { NetworkManager } from '../network/NetworkManager';

export class MenuScene extends Phaser.Scene {
  private networkManager: NetworkManager;
  private statusText!: Phaser.GameObjects.Text;
  private codeInput = '';
  private inputText!: Phaser.GameObjects.Text;
  private inputContainer!: Phaser.GameObjects.Container;
  private showingJoinInput = false;
  private waitingContainer!: Phaser.GameObjects.Container;
  private isWaiting = false;

  constructor() {
    super({ key: 'Menu' });
    this.networkManager = NetworkManager.getInstance();
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Check for join code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    if (joinCode) {
      this.handleJoinFromURL(joinCode);
    }

    // Clear any previous network state
    this.networkManager.disconnect();
    this.networkManager.removeAllListeners();
    this.showingJoinInput = false;
    this.isWaiting = false;

    // Purple gradient background
    this.createBackground();

    // Title
    const titleShadow = this.add.text(centerX + 2, 72, '🎯 CarromMaster', {
      font: 'bold 32px Arial',
      color: '#000000',
    });
    titleShadow.setOrigin(0.5);
    titleShadow.setAlpha(0.3);

    const title = this.add.text(centerX, 70, '🎯 CarromMaster', {
      font: 'bold 32px Arial',
      color: '#ffffff',
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(centerX, 105, 'The Classic Board Game', {
      font: '14px Arial',
      color: '#b388ff',
    });
    subtitle.setOrigin(0.5);

    // Draw mini board
    this.drawMiniBoard(centerX, centerY - 60);

    // Buttons
    const buttonStartY = centerY + 140;
    const buttonSpacing = 55;

    // VS CPU Button
    this.createButton(centerX, buttonStartY, '🤖 VS CPU', 0x4a90d9, () => {
      this.startGame('cpu');
    });

    // Create Game Button (Host)
    this.createButton(centerX, buttonStartY + buttonSpacing, '🎮 CREATE GAME', 0x44aa44, () => {
      this.createMultiplayerGame();
    });

    // Join Game Button
    this.createButton(centerX, buttonStartY + buttonSpacing * 2, '🔗 JOIN GAME', 0xaa8844, () => {
      this.showJoinInput();
    });

    // Status text
    this.statusText = this.add.text(centerX, GAME_HEIGHT - 60, '', {
      font: '14px Arial',
      color: '#88ff88',
      align: 'center',
    });
    this.statusText.setOrigin(0.5);

    // Create join input (hidden initially)
    this.createJoinInput(centerX, centerY);

    // Create waiting overlay (hidden initially)
    this.createWaitingOverlay(centerX, centerY);

    // Version
    const version = this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 15, 'v0.3.0', {
      font: '11px Arial',
      color: '#553377',
    });
    version.setOrigin(1, 1);

    // Fade in
    this.cameras.main.fadeIn(300);
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    color: number,
    onClick: () => void
  ): void {
    const buttonWidth = 180;
    const buttonHeight = 45;

    const button = this.add.graphics();
    button.fillStyle(color);
    button.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, 10);
    
    // Highlight
    button.fillStyle(0xffffff, 0.2);
    button.fillRoundedRect(x - buttonWidth / 2 + 5, y - buttonHeight / 2 + 3, buttonWidth - 10, buttonHeight / 3, 6);

    const buttonText = this.add.text(x, y, text, {
      font: 'bold 16px Arial',
      color: '#ffffff',
    });
    buttonText.setOrigin(0.5);

    const hitArea = this.add.zone(x, y, buttonWidth, buttonHeight);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      button.setScale(1.05);
      buttonText.setScale(1.05);
    });

    hitArea.on('pointerout', () => {
      button.setScale(1);
      buttonText.setScale(1);
    });

    hitArea.on('pointerdown', onClick);
  }

  private createJoinInput(x: number, y: number): void {
    this.inputContainer = this.add.container(x, y);
    this.inputContainer.setVisible(false);

    // Background overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a4a);
    panel.fillRoundedRect(-140, -100, 280, 200, 15);
    panel.lineStyle(2, 0x6644aa);
    panel.strokeRoundedRect(-140, -100, 280, 200, 15);

    // Title
    const title = this.add.text(0, -70, 'Enter Game Code', {
      font: 'bold 18px Arial',
      color: '#ffffff',
    });
    title.setOrigin(0.5);

    // Input box
    const inputBox = this.add.graphics();
    inputBox.fillStyle(0x1a0a2e);
    inputBox.fillRoundedRect(-100, -30, 200, 50, 8);
    inputBox.lineStyle(2, 0x4422aa);
    inputBox.strokeRoundedRect(-100, -30, 200, 50, 8);

    // Input text
    this.inputText = this.add.text(0, -5, '____', {
      font: 'bold 28px Courier',
      color: '#ffffff',
      letterSpacing: 8,
    });
    this.inputText.setOrigin(0.5);

    // Join button
    const joinBtn = this.add.graphics();
    joinBtn.fillStyle(0x44aa44);
    joinBtn.fillRoundedRect(-60, 40, 120, 40, 8);
    
    const joinText = this.add.text(0, 60, 'JOIN', {
      font: 'bold 16px Arial',
      color: '#ffffff',
    });
    joinText.setOrigin(0.5);

    const joinHit = this.add.zone(0, 60, 120, 40);
    joinHit.setInteractive({ useHandCursor: true });
    joinHit.on('pointerdown', () => this.joinGame());

    // Cancel button
    const cancelText = this.add.text(0, 110, '✕ Cancel', {
      font: '14px Arial',
      color: '#aa6666',
    });
    cancelText.setOrigin(0.5);
    cancelText.setInteractive({ useHandCursor: true });
    cancelText.on('pointerdown', () => this.hideJoinInput());

    this.inputContainer.add([overlay, panel, title, inputBox, this.inputText, joinBtn, joinText, joinHit, cancelText]);

    // Keyboard input
    if (this.input && this.input.keyboard) {
      this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
        if (!this.showingJoinInput) return;
        
        if (event.key === 'Backspace') {
          this.codeInput = this.codeInput.slice(0, -1);
        } else if (event.key === 'Enter' && this.codeInput.length === 4) {
          this.joinGame();
        } else if (/^[A-Za-z0-9]$/.test(event.key) && this.codeInput.length < 4) {
          this.codeInput += event.key.toUpperCase();
        }
        
        this.updateInputDisplay();
      });
    }
  }

  private createWaitingOverlay(x: number, y: number): void {
    this.waitingContainer = this.add.container(x, y);
    this.waitingContainer.setVisible(false);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);

    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a4a);
    panel.fillRoundedRect(-150, -130, 300, 260, 15);
    panel.lineStyle(2, 0x44aa44);
    panel.strokeRoundedRect(-150, -130, 300, 260, 15);

    const waitingTitle = this.add.text(0, -100, '🎮 Game Created!', {
      font: 'bold 20px Arial',
      color: '#44ff44',
    });
    waitingTitle.setOrigin(0.5);

    const waitingMsg = this.add.text(0, -60, 'Share this code:', {
      font: '14px Arial',
      color: '#cccccc',
    });
    waitingMsg.setOrigin(0.5);

    const codeBox = this.add.graphics();
    codeBox.fillStyle(0x1a0a2e);
    codeBox.fillRoundedRect(-80, -45, 160, 55, 8);

    const codeText = this.add.text(0, -17, '', {
      font: 'bold 32px Courier',
      color: '#ffd700',
    });
    codeText.setOrigin(0.5);
    codeText.setName('codeText');

    const orText = this.add.text(0, 25, 'or share link:', {
      font: '12px Arial',
      color: '#888888',
    });
    orText.setOrigin(0.5);

    const linkText = this.add.text(0, 50, '', {
      font: '11px Arial',
      color: '#6688ff',
      wordWrap: { width: 280 },
    });
    linkText.setOrigin(0.5);
    linkText.setName('linkText');

    const copyBtn = this.add.graphics();
    copyBtn.fillStyle(0x4466aa);
    copyBtn.fillRoundedRect(-50, 70, 100, 30, 6);

    const copyText = this.add.text(0, 85, '📋 Copy Link', {
      font: '12px Arial',
      color: '#ffffff',
    });
    copyText.setOrigin(0.5);
    copyText.setName('copyText');

    const copyHit = this.add.zone(0, 85, 100, 30);
    copyHit.setInteractive({ useHandCursor: true });
    copyHit.on('pointerdown', () => this.copyLink());

    const waitStatus = this.add.text(0, 115, '⏳ Waiting for opponent...', {
      font: '14px Arial',
      color: '#ffaa00',
    });
    waitStatus.setOrigin(0.5);
    waitStatus.setName('waitStatus');

    const cancelWait = this.add.text(0, 145, '✕ Cancel', {
      font: '14px Arial',
      color: '#aa6666',
    });
    cancelWait.setOrigin(0.5);
    cancelWait.setInteractive({ useHandCursor: true });
    cancelWait.on('pointerdown', () => this.cancelWaiting());

    this.waitingContainer.add([
      overlay, panel, waitingTitle, waitingMsg, codeBox, codeText,
      orText, linkText, copyBtn, copyText, copyHit, waitStatus, cancelWait
    ]);
  }

  private updateInputDisplay(): void {
    const display = this.codeInput.padEnd(4, '_').split('').join(' ');
    this.inputText.setText(display);
  }

  private showJoinInput(): void {
    this.showingJoinInput = true;
    this.codeInput = '';
    this.updateInputDisplay();
    this.inputContainer.setVisible(true);
  }

  private hideJoinInput(): void {
    this.showingJoinInput = false;
    this.inputContainer.setVisible(false);
    this.codeInput = '';
  }

  private async createMultiplayerGame(): Promise<void> {
    this.statusText.setText('Creating game...');
    
    try {
      const gameId = await this.networkManager.createGame();
      this.showWaitingScreen(gameId);
      
      // Listen for opponent connection
      this.networkManager.onConnect(() => {
        const waitStatus = this.waitingContainer.getByName('waitStatus') as Phaser.GameObjects.Text;
        if (waitStatus) {
          waitStatus.setText('✅ Opponent connected!');
          waitStatus.setColor('#44ff44');
        }
        
        // Start game after short delay
        this.time.delayedCall(1000, () => {
          this.startGame('multiplayer-host');
        });
      });
    } catch (error) {
      this.statusText.setText('Failed to create game. Try again.');
      console.error(error);
    }
  }

  private showWaitingScreen(gameId: string): void {
    this.isWaiting = true;
    this.waitingContainer.setVisible(true);
    
    const codeText = this.waitingContainer.getByName('codeText') as Phaser.GameObjects.Text;
    if (codeText) codeText.setText(gameId);
    
    const linkText = this.waitingContainer.getByName('linkText') as Phaser.GameObjects.Text;
    if (linkText) linkText.setText(this.networkManager.getShareableLink());
  }

  private cancelWaiting(): void {
    this.isWaiting = false;
    this.waitingContainer.setVisible(false);
    this.networkManager.disconnect();
    this.statusText.setText('');
  }

  private copyLink(): void {
    const link = this.networkManager.getShareableLink();
    navigator.clipboard.writeText(link).then(() => {
      const copyText = this.waitingContainer.getByName('copyText') as Phaser.GameObjects.Text;
      if (copyText) {
        copyText.setText('✅ Copied!');
        this.time.delayedCall(2000, () => {
          copyText.setText('📋 Copy Link');
        });
      }
    });
  }

  private async joinGame(): Promise<void> {
    if (this.codeInput.length !== 4) {
      this.statusText.setText('Enter a 4-character code');
      return;
    }

    this.hideJoinInput();
    this.statusText.setText('Connecting...');

    try {
      await this.networkManager.joinGame(this.codeInput);
      this.statusText.setText('Connected! Starting game...');
      
      this.time.delayedCall(500, () => {
        this.startGame('multiplayer-guest');
      });
    } catch (error) {
      this.statusText.setText('Could not connect. Check the code.');
      console.error(error);
    }
  }

  private async handleJoinFromURL(code: string): Promise<void> {
    // Clear the URL parameter
    window.history.replaceState({}, '', window.location.pathname);
    
    this.statusText?.setText('Connecting to game...');
    
    try {
      await this.networkManager.joinGame(code);
      this.time.delayedCall(500, () => {
        this.startGame('multiplayer-guest');
      });
    } catch (error) {
      this.statusText?.setText('Game not found. It may have expired.');
      console.error(error);
    }
  }

  private startGame(mode: 'cpu' | 'multiplayer-host' | 'multiplayer-guest'): void {
    this.cameras.main.fadeOut(300);
    this.time.delayedCall(300, () => {
      this.scene.start('Game', { mode });
    });
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    const steps = 30;
    
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

  private drawMiniBoard(x: number, y: number): void {
    const size = 180;
    const graphics = this.add.graphics();

    graphics.fillStyle(COLORS.boardFrame);
    graphics.fillRoundedRect(x - size / 2 - 8, y - size / 2 - 8, size + 16, size + 16, 6);

    graphics.fillStyle(COLORS.boardBorder);
    graphics.fillRoundedRect(x - size / 2 - 4, y - size / 2 - 4, size + 8, size + 8, 4);

    graphics.fillStyle(COLORS.board);
    graphics.fillRect(x - size / 2, y - size / 2, size, size);

    graphics.lineStyle(1, COLORS.boardDark, 0.2);
    for (let i = 0; i < 12; i++) {
      const lineY = y - size / 2 + (size / 12) * i;
      graphics.beginPath();
      graphics.moveTo(x - size / 2, lineY);
      graphics.lineTo(x + size / 2, lineY);
      graphics.strokePath();
    }

    graphics.lineStyle(1.5, COLORS.boardDark, 0.3);
    graphics.strokeRect(x - size / 2 + 12, y - size / 2 + 12, size - 24, size - 24);

    graphics.lineStyle(1.5, COLORS.boardDark, 0.2);
    graphics.strokeCircle(x, y, 30);
    graphics.strokeCircle(x, y, 18);

    const pocketOffset = size / 2 - 10;
    const pockets = [
      { px: x - pocketOffset, py: y - pocketOffset },
      { px: x + pocketOffset, py: y - pocketOffset },
      { px: x - pocketOffset, py: y + pocketOffset },
      { px: x + pocketOffset, py: y + pocketOffset },
    ];

    pockets.forEach(({ px, py }) => {
      graphics.fillStyle(COLORS.pocketRing);
      graphics.fillCircle(px, py, 10);
      graphics.fillStyle(COLORS.pocket);
      graphics.fillCircle(px, py, 8);
    });

    // Queen
    graphics.fillStyle(COLORS.queen);
    graphics.fillCircle(x, y, 6);

    // Some pieces
    const radius = 14;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      graphics.fillStyle(i % 2 === 0 ? COLORS.whitePiece : COLORS.blackPiece);
      graphics.fillCircle(px, py, 5);
    }
  }
}
