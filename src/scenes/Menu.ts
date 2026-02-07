import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { NetworkManager } from '../network/NetworkManager';

export class MenuScene extends Phaser.Scene {
  private networkManager: NetworkManager;
  private statusText!: Phaser.GameObjects.Text;
  private inputContainer!: Phaser.GameObjects.Container;
  private showingJoinInput = false;
  private waitingContainer!: Phaser.GameObjects.Container;
  private isWaiting = false;
  private htmlInput: HTMLInputElement | null = null;
  private currentGameCode = '';

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
    this.removeHtmlInput();

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
    const buttonStartY = centerY + 120;
    const buttonSpacing = 48;

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

    // Leaderboard Button
    this.createButton(centerX, buttonStartY + buttonSpacing * 3, '🏆 LEADERBOARD', 0x9944aa, () => {
      this.cameras.main.fadeOut(200);
      this.time.delayedCall(200, () => this.scene.start('Leaderboard'));
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
    const version = this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 15, 'v0.3.1', {
      font: '11px Arial',
      color: '#553377',
    });
    version.setOrigin(1, 1);

    // Fade in
    this.cameras.main.fadeIn(300);

    // Clean up on scene shutdown
    this.events.on('shutdown', () => {
      this.removeHtmlInput();
    });
  }

  private removeHtmlInput(): void {
    if (this.htmlInput) {
      this.htmlInput.remove();
      this.htmlInput = null;
    }
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
    this.inputContainer.setDepth(100);

    // Background overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    overlay.setInteractive(new Phaser.Geom.Rectangle(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT), Phaser.Geom.Rectangle.Contains);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a4a);
    panel.fillRoundedRect(-140, -120, 280, 240, 15);
    panel.lineStyle(2, 0x6644aa);
    panel.strokeRoundedRect(-140, -120, 280, 240, 15);

    // Title
    const title = this.add.text(0, -90, '🔗 Enter Game Code', {
      font: 'bold 18px Arial',
      color: '#ffffff',
    });
    title.setOrigin(0.5);

    // Instructions
    const instructions = this.add.text(0, -55, 'Ask your friend for the 4-letter code', {
      font: '12px Arial',
      color: '#aaaaaa',
    });
    instructions.setOrigin(0.5);

    // Input placeholder (visual only - real input is HTML)
    const inputBox = this.add.graphics();
    inputBox.fillStyle(0x1a0a2e);
    inputBox.fillRoundedRect(-100, -35, 200, 55, 8);
    inputBox.lineStyle(2, 0x6644aa);
    inputBox.strokeRoundedRect(-100, -35, 200, 55, 8);

    // Tap to type hint
    const tapHint = this.add.text(0, -7, 'Tap here to type', {
      font: '16px Arial',
      color: '#666666',
    });
    tapHint.setOrigin(0.5);
    tapHint.setName('tapHint');

    // Make input area tappable
    const inputHitArea = this.add.zone(0, -7, 200, 55);
    inputHitArea.setInteractive({ useHandCursor: true });
    inputHitArea.on('pointerdown', () => this.focusHtmlInput());

    // Join button - using rectangle for better hit detection
    const joinBtn = this.add.rectangle(0, 62, 160, 45, 0x44aa44);
    joinBtn.setStrokeStyle(2, 0x66cc66);
    joinBtn.setInteractive({ useHandCursor: true });
    joinBtn.on('pointerdown', () => this.joinGame());
    
    const joinText = this.add.text(0, 62, '✓ JOIN GAME', {
      font: 'bold 16px Arial',
      color: '#ffffff',
    });
    joinText.setOrigin(0.5);

    // Cancel button - using rectangle for better hit detection
    const cancelBtn = this.add.rectangle(0, 117, 120, 35, 0x664444);
    cancelBtn.setStrokeStyle(1, 0x886666);
    cancelBtn.setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerdown', () => this.hideJoinInput());
    
    const cancelText = this.add.text(0, 117, '✕ Cancel', {
      font: '14px Arial',
      color: '#ffffff',
    });
    cancelText.setOrigin(0.5);

    this.inputContainer.add([
      overlay, panel, title, instructions, inputBox, tapHint, 
      inputHitArea, joinBtn, joinText, cancelBtn, cancelText
    ]);
  }

  private createHtmlInput(): void {
    if (this.htmlInput) return;

    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate position based on game scaling
    const scaleX = rect.width / GAME_WIDTH;
    const scaleY = rect.height / GAME_HEIGHT;
    const inputX = rect.left + (GAME_WIDTH / 2 - 90) * scaleX;
    const inputY = rect.top + (GAME_HEIGHT / 2 - 30) * scaleY;
    const inputWidth = 180 * scaleX;
    const inputHeight = 45 * scaleY;

    this.htmlInput = document.createElement('input');
    this.htmlInput.type = 'text';
    this.htmlInput.maxLength = 4;
    this.htmlInput.placeholder = 'CODE';
    this.htmlInput.autocomplete = 'off';
    this.htmlInput.autocapitalize = 'characters';
    this.htmlInput.style.cssText = `
      position: fixed;
      left: ${inputX}px;
      top: ${inputY}px;
      width: ${inputWidth}px;
      height: ${inputHeight}px;
      font-size: ${24 * scaleY}px;
      font-family: monospace;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 8px;
      background: #2a1a4a;
      border: 2px solid #8866cc;
      border-radius: 8px;
      color: #ffffff;
      outline: none;
      z-index: 1000;
    `;

    this.htmlInput.addEventListener('input', () => {
      if (this.htmlInput) {
        this.htmlInput.value = this.htmlInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const tapHint = this.inputContainer.getByName('tapHint') as Phaser.GameObjects.Text;
        if (tapHint) {
          tapHint.setVisible(this.htmlInput.value.length === 0);
        }
      }
    });

    this.htmlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && this.htmlInput && this.htmlInput.value.length === 4) {
        this.joinGame();
      }
    });

    document.body.appendChild(this.htmlInput);
  }

  private focusHtmlInput(): void {
    if (!this.htmlInput) {
      this.createHtmlInput();
    }
    if (this.htmlInput) {
      this.htmlInput.focus();
      const tapHint = this.inputContainer.getByName('tapHint') as Phaser.GameObjects.Text;
      if (tapHint) {
        tapHint.setVisible(false);
      }
    }
  }

  private createWaitingOverlay(x: number, y: number): void {
    this.waitingContainer = this.add.container(x, y);
    this.waitingContainer.setVisible(false);
    this.waitingContainer.setDepth(100);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.9);
    overlay.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    overlay.setInteractive(new Phaser.Geom.Rectangle(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT), Phaser.Geom.Rectangle.Contains);

    const panel = this.add.graphics();
    panel.fillStyle(0x1a3d1a);
    panel.fillRoundedRect(-150, -160, 300, 320, 15);
    panel.lineStyle(3, 0x44aa44);
    panel.strokeRoundedRect(-150, -160, 300, 320, 15);

    const waitingTitle = this.add.text(0, -130, '🎮 Game Created!', {
      font: 'bold 22px Arial',
      color: '#44ff44',
    });
    waitingTitle.setOrigin(0.5);

    const shareLabel = this.add.text(0, -90, 'Share this code with a friend:', {
      font: '14px Arial',
      color: '#cccccc',
    });
    shareLabel.setOrigin(0.5);

    // Code display box
    const codeBox = this.add.graphics();
    codeBox.fillStyle(0x0a1a0a);
    codeBox.fillRoundedRect(-90, -70, 180, 60, 10);
    codeBox.lineStyle(2, 0x44aa44);
    codeBox.strokeRoundedRect(-90, -70, 180, 60, 10);

    const codeText = this.add.text(0, -40, '----', {
      font: 'bold 36px Courier',
      color: '#ffd700',
      letterSpacing: 10,
    });
    codeText.setOrigin(0.5);
    codeText.setName('codeText');

    // Copy Code button - using rectangle for better hit detection
    const copyCodeBtn = this.add.rectangle(0, 24, 140, 38, 0x4466aa);
    copyCodeBtn.setStrokeStyle(2, 0x6688cc);
    copyCodeBtn.setInteractive({ useHandCursor: true });
    copyCodeBtn.on('pointerdown', () => this.copyCode());
    
    const copyCodeText = this.add.text(0, 24, '📋 Copy Code', {
      font: 'bold 14px Arial',
      color: '#ffffff',
    });
    copyCodeText.setOrigin(0.5);
    copyCodeText.setName('copyCodeText');

    // Or divider
    const orText = this.add.text(0, 55, '— or —', {
      font: '12px Arial',
      color: '#666666',
    });
    orText.setOrigin(0.5);

    // Share/Copy Link button
    const hasShareAPI = !!navigator.share;
    const copyLinkBtn = this.add.rectangle(0, 94, 140, 38, 0x6644aa);
    copyLinkBtn.setStrokeStyle(2, 0x8866cc);
    copyLinkBtn.setInteractive({ useHandCursor: true });
    copyLinkBtn.on('pointerdown', () => this.shareOrCopyLink());
    
    const copyLinkText = this.add.text(0, 94, hasShareAPI ? '📤 Share' : '🔗 Copy Link', {
      font: 'bold 14px Arial',
      color: '#ffffff',
    });
    copyLinkText.setOrigin(0.5);
    copyLinkText.setName('copyLinkText');

    // Status
    const waitStatus = this.add.text(0, 135, '⏳ Waiting for opponent...', {
      font: '14px Arial',
      color: '#ffaa00',
    });
    waitStatus.setOrigin(0.5);
    waitStatus.setName('waitStatus');

    // Cancel button - using rectangle for better hit detection
    const cancelBtn = this.add.rectangle(0, 177, 120, 35, 0x664444);
    cancelBtn.setStrokeStyle(1, 0x886666);
    cancelBtn.setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerdown', () => this.cancelWaiting());

    const cancelWait = this.add.text(0, 177, '✕ Cancel', {
      font: '14px Arial',
      color: '#ffffff',
    });
    cancelWait.setOrigin(0.5);

    this.waitingContainer.add([
      overlay, panel, waitingTitle, shareLabel, codeBox, codeText,
      copyCodeBtn, copyCodeText,
      orText,
      copyLinkBtn, copyLinkText,
      waitStatus, cancelBtn, cancelWait
    ]);
  }

  private showJoinInput(): void {
    this.showingJoinInput = true;
    this.inputContainer.setVisible(true);
    // Create HTML input with slight delay for DOM to be ready
    this.time.delayedCall(100, () => {
      this.createHtmlInput();
    });
  }

  private hideJoinInput(): void {
    this.showingJoinInput = false;
    this.inputContainer.setVisible(false);
    this.removeHtmlInput();
  }

  private async createMultiplayerGame(): Promise<void> {
    this.statusText.setText('Creating game...');
    
    try {
      const gameId = await this.networkManager.createGame();
      this.currentGameCode = gameId;
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
    this.statusText.setText('');
    
    const codeText = this.waitingContainer.getByName('codeText') as Phaser.GameObjects.Text;
    if (codeText) codeText.setText(gameId);
  }

  private cancelWaiting(): void {
    this.isWaiting = false;
    this.waitingContainer.setVisible(false);
    this.networkManager.disconnect();
    this.statusText.setText('');
    this.currentGameCode = '';
  }

  private copyCode(): void {
    const code = this.currentGameCode;
    if (!code) return;

    this.copyToClipboard(code).then((success) => {
      const copyCodeText = this.waitingContainer.getByName('copyCodeText') as Phaser.GameObjects.Text;
      if (copyCodeText) {
        copyCodeText.setText(success ? '✅ Copied!' : '❌ Failed');
        this.time.delayedCall(2000, () => {
          copyCodeText.setText('📋 Copy Code');
        });
      }
    });
  }

  private shareOrCopyLink(): void {
    const link = this.networkManager.getShareableLink();
    const code = this.currentGameCode;
    
    // Try native share first (works great on mobile)
    if (navigator.share) {
      navigator.share({
        title: 'CarromMaster Game',
        text: `Join my Carrom game! Code: ${code}`,
        url: link,
      }).then(() => {
        const copyLinkText = this.waitingContainer.getByName('copyLinkText') as Phaser.GameObjects.Text;
        if (copyLinkText) {
          copyLinkText.setText('✅ Shared!');
          this.time.delayedCall(2000, () => {
            copyLinkText.setText('📤 Share');
          });
        }
      }).catch((err) => {
        // User cancelled or share failed - fallback to copy
        if (err.name !== 'AbortError') {
          this.copyLink();
        }
      });
    } else {
      this.copyLink();
    }
  }

  private copyLink(): void {
    const link = this.networkManager.getShareableLink();
    const hasShareAPI = !!navigator.share;
    
    this.copyToClipboard(link).then((success) => {
      const copyLinkText = this.waitingContainer.getByName('copyLinkText') as Phaser.GameObjects.Text;
      if (copyLinkText) {
        copyLinkText.setText(success ? '✅ Copied!' : '❌ Failed');
        this.time.delayedCall(2000, () => {
          copyLinkText.setText(hasShareAPI ? '📤 Share' : '🔗 Copy Link');
        });
      }
    });
  }

  private async copyToClipboard(text: string): Promise<boolean> {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // Fallback for older browsers / iOS
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        return true;
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      return false;
    }
  }

  private async joinGame(): Promise<void> {
    const code = this.htmlInput?.value?.toUpperCase() || '';
    
    if (code.length !== 4) {
      this.statusText.setText('Enter a 4-character code');
      return;
    }

    this.hideJoinInput();
    this.statusText.setText('Connecting...');

    try {
      await this.networkManager.joinGame(code);
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
    
    // Wait for scene to be fully ready
    this.time.delayedCall(500, async () => {
      this.statusText?.setText('Connecting to game...');
      
      try {
        await this.networkManager.joinGame(code);
        this.statusText?.setText('Connected!');
        this.time.delayedCall(500, () => {
          this.startGame('multiplayer-guest');
        });
      } catch (error) {
        this.statusText?.setText('Game not found. It may have expired.');
        console.error(error);
      }
    });
  }

  private startGame(mode: 'cpu' | 'multiplayer-host' | 'multiplayer-guest'): void {
    this.removeHtmlInput();
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
