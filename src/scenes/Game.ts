import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  BOARD_SIZE,
  BOARD_MARGIN,
  POCKET_RADIUS,
  PIECE_RADIUS,
  STRIKER_RADIUS,
  COLORS,
  FRICTION,
  FRICTION_AIR,
  RESTITUTION,
  STRIKER_MAX_POWER,
  INITIAL_POSITIONS,
} from '../config';

interface Piece extends MatterJS.BodyType {
  gameData?: {
    type: 'white' | 'black' | 'queen' | 'striker';
    pocketed: boolean;
  };
}

export class GameScene extends Phaser.Scene {
  private striker!: Piece;
  private pieces: Piece[] = [];
  private pockets: { x: number; y: number }[] = [];
  private isDragging = false;
  private dragStart: { x: number; y: number } | null = null;
  private aimLine!: Phaser.GameObjects.Graphics;
  private powerMeter!: Phaser.GameObjects.Graphics;
  private currentPlayer: 'white' | 'black' = 'white';
  private whiteScore = 0;
  private blackScore = 0;
  private queenPocketed = false;
  private strikerBaseY!: number;
  private boardCenterX!: number;
  private boardCenterY!: number;
  private isStrikerMoving = false;
  private scoreText!: Phaser.GameObjects.Text;
  private turnText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Game' });
  }

  create(): void {
    this.boardCenterX = GAME_WIDTH / 2;
    this.boardCenterY = GAME_HEIGHT / 2;
    this.strikerBaseY = this.boardCenterY + BOARD_SIZE / 2 - 60;

    // Reset game state
    this.pieces = [];
    this.whiteScore = 0;
    this.blackScore = 0;
    this.queenPocketed = false;
    this.currentPlayer = 'white';
    this.isStrikerMoving = false;

    // Create the board
    this.createBoard();

    // Create pockets
    this.createPockets();

    // Create pieces
    this.createPieces();

    // Create striker
    this.createStriker();

    // Create UI elements
    this.createUI();

    // Set up input
    this.setupInput();

    // Set up collision detection
    this.setupCollisions();

    // Fade in
    this.cameras.main.fadeIn(300);
  }

  private createBoard(): void {
    const graphics = this.add.graphics();
    const x = this.boardCenterX;
    const y = this.boardCenterY;
    const size = BOARD_SIZE;

    // Outer border
    graphics.fillStyle(COLORS.boardBorder);
    graphics.fillRoundedRect(x - size / 2 - 20, y - size / 2 - 20, size + 40, size + 40, 15);

    // Main board
    graphics.fillStyle(COLORS.board);
    graphics.fillRoundedRect(x - size / 2, y - size / 2, size, size, 10);

    // Inner playing area border
    graphics.lineStyle(3, COLORS.boardBorder);
    const innerSize = size - 60;
    graphics.strokeRoundedRect(x - innerSize / 2, y - innerSize / 2, innerSize, innerSize, 5);

    // Center circles
    graphics.lineStyle(2, COLORS.boardBorder);
    graphics.strokeCircle(x, y, 40);
    graphics.strokeCircle(x, y, 20);

    // Baselines (where striker is placed)
    graphics.lineStyle(2, COLORS.baseline);
    const baselineOffset = size / 2 - 60;
    
    // Bottom baseline (player 1)
    graphics.beginPath();
    graphics.moveTo(x - 100, y + baselineOffset);
    graphics.lineTo(x + 100, y + baselineOffset);
    graphics.strokePath();
    graphics.fillStyle(COLORS.baseline);
    graphics.fillCircle(x - 100, y + baselineOffset, 5);
    graphics.fillCircle(x + 100, y + baselineOffset, 5);

    // Top baseline (player 2)
    graphics.beginPath();
    graphics.moveTo(x - 100, y - baselineOffset);
    graphics.lineTo(x + 100, y - baselineOffset);
    graphics.strokePath();
    graphics.fillCircle(x - 100, y - baselineOffset, 5);
    graphics.fillCircle(x + 100, y - baselineOffset, 5);

    // Arrow indicators in corners
    this.drawCornerArrows(graphics, x, y, size);

    // Create board walls (physics boundaries)
    this.createWalls();
  }

  private drawCornerArrows(graphics: Phaser.GameObjects.Graphics, x: number, y: number, size: number): void {
    graphics.lineStyle(2, COLORS.boardBorder);
    const offset = size / 2 - 80;
    const arrowSize = 30;

    // Draw diagonal lines pointing to pockets
    const corners = [
      { cx: x - offset, cy: y - offset, dx: -1, dy: -1 },
      { cx: x + offset, cy: y - offset, dx: 1, dy: -1 },
      { cx: x - offset, cy: y + offset, dx: -1, dy: 1 },
      { cx: x + offset, cy: y + offset, dx: 1, dy: 1 },
    ];

    corners.forEach(({ cx, cy, dx, dy }) => {
      graphics.beginPath();
      graphics.moveTo(cx, cy);
      graphics.lineTo(cx + dx * arrowSize, cy + dy * arrowSize);
      graphics.strokePath();
    });
  }

  private createWalls(): void {
    const x = this.boardCenterX;
    const y = this.boardCenterY;
    const size = BOARD_SIZE - 30;
    const wallThickness = 20;
    const gapSize = POCKET_RADIUS * 2 + 10; // Gap for pockets

    const wallOptions = {
      isStatic: true,
      friction: FRICTION,
      restitution: RESTITUTION,
      label: 'wall',
    };

    // Create walls with gaps for pockets
    // Top wall (two segments)
    this.matter.add.rectangle(
      x - size / 4 - gapSize / 4, 
      y - size / 2, 
      size / 2 - gapSize, 
      wallThickness, 
      wallOptions
    );
    this.matter.add.rectangle(
      x + size / 4 + gapSize / 4, 
      y - size / 2, 
      size / 2 - gapSize, 
      wallThickness, 
      wallOptions
    );

    // Bottom wall (two segments)
    this.matter.add.rectangle(
      x - size / 4 - gapSize / 4, 
      y + size / 2, 
      size / 2 - gapSize, 
      wallThickness, 
      wallOptions
    );
    this.matter.add.rectangle(
      x + size / 4 + gapSize / 4, 
      y + size / 2, 
      size / 2 - gapSize, 
      wallThickness, 
      wallOptions
    );

    // Left wall (two segments)
    this.matter.add.rectangle(
      x - size / 2, 
      y - size / 4 - gapSize / 4, 
      wallThickness, 
      size / 2 - gapSize, 
      wallOptions
    );
    this.matter.add.rectangle(
      x - size / 2, 
      y + size / 4 + gapSize / 4, 
      wallThickness, 
      size / 2 - gapSize, 
      wallOptions
    );

    // Right wall (two segments)
    this.matter.add.rectangle(
      x + size / 2, 
      y - size / 4 - gapSize / 4, 
      wallThickness, 
      size / 2 - gapSize, 
      wallOptions
    );
    this.matter.add.rectangle(
      x + size / 2, 
      y + size / 4 + gapSize / 4, 
      wallThickness, 
      size / 2 - gapSize, 
      wallOptions
    );
  }

  private createPockets(): void {
    const x = this.boardCenterX;
    const y = this.boardCenterY;
    const offset = BOARD_SIZE / 2 - 30;

    this.pockets = [
      { x: x - offset, y: y - offset },
      { x: x + offset, y: y - offset },
      { x: x - offset, y: y + offset },
      { x: x + offset, y: y + offset },
    ];

    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.pocket);
    
    this.pockets.forEach(pocket => {
      graphics.fillCircle(pocket.x, pocket.y, POCKET_RADIUS);
    });
  }

  private createPieces(): void {
    const x = this.boardCenterX;
    const y = this.boardCenterY;

    // Create queen (red piece in center)
    this.createPiece(
      x + INITIAL_POSITIONS.queen.x,
      y + INITIAL_POSITIONS.queen.y,
      'queen',
      COLORS.queen
    );

    // Create white pieces
    INITIAL_POSITIONS.white.forEach(pos => {
      this.createPiece(x + pos.x, y + pos.y, 'white', COLORS.whitePiece);
    });

    // Create black pieces
    INITIAL_POSITIONS.black.forEach(pos => {
      this.createPiece(x + pos.x, y + pos.y, 'black', COLORS.blackPiece);
    });
  }

  private createPiece(x: number, y: number, type: 'white' | 'black' | 'queen', color: number): void {
    const radius = type === 'queen' ? PIECE_RADIUS : PIECE_RADIUS;
    
    const piece = this.matter.add.circle(x, y, radius, {
      friction: FRICTION,
      frictionAir: FRICTION_AIR,
      restitution: RESTITUTION,
      label: 'piece',
    }) as Piece;

    piece.gameData = { type, pocketed: false };
    this.pieces.push(piece);

    // Draw the piece
    const graphics = this.add.graphics();
    graphics.fillStyle(color);
    graphics.fillCircle(0, 0, radius);
    graphics.lineStyle(2, type === 'queen' ? 0xcc0000 : (type === 'white' ? 0xcccccc : 0x333333));
    graphics.strokeCircle(0, 0, radius);
    
    // Add inner decoration
    graphics.lineStyle(1, type === 'queen' ? 0xff6666 : (type === 'white' ? 0xeeeeee : 0x444444));
    graphics.strokeCircle(0, 0, radius * 0.6);

    const container = this.add.container(x, y, [graphics]);
    
    // Update container position each frame
    this.events.on('update', () => {
      if (!piece.gameData?.pocketed) {
        container.setPosition(piece.position.x, piece.position.y);
      }
    });
  }

  private createStriker(): void {
    const x = this.boardCenterX;
    const y = this.strikerBaseY;

    this.striker = this.matter.add.circle(x, y, STRIKER_RADIUS, {
      friction: FRICTION,
      frictionAir: FRICTION_AIR * 1.5,
      restitution: RESTITUTION,
      label: 'striker',
    }) as Piece;

    this.striker.gameData = { type: 'striker', pocketed: false };

    // Draw striker
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.striker);
    graphics.fillCircle(0, 0, STRIKER_RADIUS);
    graphics.lineStyle(3, 0xcc9900);
    graphics.strokeCircle(0, 0, STRIKER_RADIUS);
    graphics.lineStyle(2, 0xffee88);
    graphics.strokeCircle(0, 0, STRIKER_RADIUS * 0.5);

    const strikerContainer = this.add.container(x, y, [graphics]);
    
    this.events.on('update', () => {
      strikerContainer.setPosition(this.striker.position.x, this.striker.position.y);
    });

    // Create aim line (invisible initially)
    this.aimLine = this.add.graphics();
    this.powerMeter = this.add.graphics();
  }

  private createUI(): void {
    // Score display
    this.scoreText = this.add.text(GAME_WIDTH / 2, 25, '', {
      font: 'bold 20px Arial',
      color: '#ffffff',
    });
    this.scoreText.setOrigin(0.5);
    this.updateScoreDisplay();

    // Turn indicator
    this.turnText = this.add.text(GAME_WIDTH / 2, 55, '', {
      font: '16px Arial',
      color: '#888888',
    });
    this.turnText.setOrigin(0.5);
    this.updateTurnDisplay();

    // Back button
    const backButton = this.add.text(20, 20, '← Menu', {
      font: '16px Arial',
      color: '#888888',
    });
    backButton.setInteractive({ useHandCursor: true });
    backButton.on('pointerover', () => backButton.setColor('#ffffff'));
    backButton.on('pointerout', () => backButton.setColor('#888888'));
    backButton.on('pointerdown', () => this.scene.start('Menu'));
  }

  private updateScoreDisplay(): void {
    this.scoreText.setText(`White: ${this.whiteScore}  |  Black: ${this.blackScore}`);
  }

  private updateTurnDisplay(): void {
    const color = this.currentPlayer === 'white' ? '#ffffff' : '#888888';
    this.turnText.setText(`${this.currentPlayer.toUpperCase()}'s Turn`);
    this.turnText.setColor(color);
  }

  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isStrikerMoving) return;
      
      const distance = Phaser.Math.Distance.Between(
        pointer.x, pointer.y,
        this.striker.position.x, this.striker.position.y
      );

      if (distance < STRIKER_RADIUS * 2) {
        this.isDragging = true;
        this.dragStart = { x: pointer.x, y: pointer.y };
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !this.dragStart) return;
      this.drawAimLine(pointer);
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !this.dragStart) return;
      
      this.shoot(pointer);
      this.isDragging = false;
      this.dragStart = null;
      this.aimLine.clear();
      this.powerMeter.clear();
    });
  }

  private drawAimLine(pointer: Phaser.Input.Pointer): void {
    if (!this.dragStart) return;

    const dx = this.dragStart.x - pointer.x;
    const dy = this.dragStart.y - pointer.y;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 150);
    const angle = Math.atan2(dy, dx);
    const power = distance / 150;

    this.aimLine.clear();
    this.aimLine.lineStyle(2, COLORS.aimLine, 0.8);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.striker.position.x, this.striker.position.y);
    this.aimLine.lineTo(
      this.striker.position.x + Math.cos(angle) * distance * 2,
      this.striker.position.y + Math.sin(angle) * distance * 2
    );
    this.aimLine.strokePath();

    // Draw power meter
    this.powerMeter.clear();
    this.powerMeter.fillStyle(power > 0.7 ? 0xff4444 : (power > 0.4 ? 0xffaa00 : 0x44ff44));
    this.powerMeter.fillRect(
      this.striker.position.x - 25,
      this.striker.position.y + STRIKER_RADIUS + 10,
      50 * power,
      8
    );
    this.powerMeter.lineStyle(1, 0xffffff);
    this.powerMeter.strokeRect(
      this.striker.position.x - 25,
      this.striker.position.y + STRIKER_RADIUS + 10,
      50,
      8
    );
  }

  private shoot(pointer: Phaser.Input.Pointer): void {
    if (!this.dragStart) return;

    const dx = this.dragStart.x - pointer.x;
    const dy = this.dragStart.y - pointer.y;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 150);
    const power = (distance / 150) * STRIKER_MAX_POWER;
    const angle = Math.atan2(dy, dx);

    const velocityX = Math.cos(angle) * power;
    const velocityY = Math.sin(angle) * power;

    this.matter.body.setVelocity(this.striker, { x: velocityX, y: velocityY });
    this.isStrikerMoving = true;
  }

  private setupCollisions(): void {
    this.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      event.pairs.forEach(pair => {
        // Play collision sound here in the future
      });
    });
  }

  update(): void {
    // Check if all pieces have stopped moving
    if (this.isStrikerMoving) {
      const allStopped = this.checkAllStopped();
      if (allStopped) {
        this.isStrikerMoving = false;
        this.handleTurnEnd();
      }
    }

    // Check for pocketed pieces
    this.checkPockets();
  }

  private checkAllStopped(): boolean {
    const velocityThreshold = 0.1;

    // Check striker
    const strikerVel = this.striker.velocity;
    if (Math.abs(strikerVel.x) > velocityThreshold || Math.abs(strikerVel.y) > velocityThreshold) {
      return false;
    }

    // Check all pieces
    for (const piece of this.pieces) {
      if (piece.gameData?.pocketed) continue;
      const vel = piece.velocity;
      if (Math.abs(vel.x) > velocityThreshold || Math.abs(vel.y) > velocityThreshold) {
        return false;
      }
    }

    return true;
  }

  private checkPockets(): void {
    // Check striker
    this.pockets.forEach(pocket => {
      const strikerDist = Phaser.Math.Distance.Between(
        this.striker.position.x, this.striker.position.y,
        pocket.x, pocket.y
      );

      if (strikerDist < POCKET_RADIUS) {
        this.pocketStriker();
      }
    });

    // Check pieces
    this.pieces.forEach(piece => {
      if (piece.gameData?.pocketed) return;

      this.pockets.forEach(pocket => {
        const dist = Phaser.Math.Distance.Between(
          piece.position.x, piece.position.y,
          pocket.x, pocket.y
        );

        if (dist < POCKET_RADIUS) {
          this.pocketPiece(piece);
        }
      });
    });
  }

  private pocketStriker(): void {
    // Reset striker to baseline
    this.matter.body.setPosition(this.striker, {
      x: this.boardCenterX,
      y: this.strikerBaseY,
    });
    this.matter.body.setVelocity(this.striker, { x: 0, y: 0 });

    // Foul - could add penalty here
  }

  private pocketPiece(piece: Piece): void {
    if (!piece.gameData) return;

    piece.gameData.pocketed = true;
    
    // Move piece off screen
    this.matter.body.setPosition(piece, { x: -100, y: -100 });
    this.matter.body.setVelocity(piece, { x: 0, y: 0 });
    this.matter.body.setStatic(piece, true);

    // Update score
    if (piece.gameData.type === 'white') {
      if (this.currentPlayer === 'white') this.whiteScore++;
    } else if (piece.gameData.type === 'black') {
      if (this.currentPlayer === 'black') this.blackScore++;
    } else if (piece.gameData.type === 'queen') {
      this.queenPocketed = true;
    }

    this.updateScoreDisplay();
    this.checkWinCondition();
  }

  private handleTurnEnd(): void {
    // Reset striker position
    this.matter.body.setPosition(this.striker, {
      x: this.boardCenterX,
      y: this.currentPlayer === 'white' ? this.strikerBaseY : this.boardCenterY - BOARD_SIZE / 2 + 60,
    });
    this.matter.body.setVelocity(this.striker, { x: 0, y: 0 });

    // Switch turns
    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    this.updateTurnDisplay();
  }

  private checkWinCondition(): void {
    const whitePieces = this.pieces.filter(p => p.gameData?.type === 'white' && !p.gameData?.pocketed);
    const blackPieces = this.pieces.filter(p => p.gameData?.type === 'black' && !p.gameData?.pocketed);

    if (whitePieces.length === 0 && this.queenPocketed) {
      this.endGame('white');
    } else if (blackPieces.length === 0 && this.queenPocketed) {
      this.endGame('black');
    }
  }

  private endGame(winner: 'white' | 'black'): void {
    this.scene.start('GameOver', { 
      winner, 
      whiteScore: this.whiteScore, 
      blackScore: this.blackScore 
    });
  }
}
