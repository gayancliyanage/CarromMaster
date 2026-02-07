import Phaser from 'phaser';
import { COLORS } from '../config';

/**
 * Particle Effects Manager for CarromMaster
 * Creates visual effects for collisions, pockets, and celebrations
 */

export class ParticleEffects {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Small sparks on piece collision
   */
  createCollisionSparks(x: number, y: number, intensity: number = 0.5): void {
    const count = Math.floor(5 + intensity * 10);
    const speed = 50 + intensity * 100;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (0.5 + Math.random() * 0.5) * speed;
      
      const spark = this.scene.add.circle(x, y, 2 + Math.random() * 2, 0xffff88);
      spark.setAlpha(0.8);

      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * velocity * 0.3,
        y: y + Math.sin(angle) * velocity * 0.3,
        alpha: 0,
        scale: 0.3,
        duration: 200 + Math.random() * 100,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  /**
   * Celebratory burst when piece enters pocket
   */
  createPocketBurst(x: number, y: number, pieceColor: 'white' | 'black' | 'queen'): void {
    // Determine colors based on piece
    let colors: number[];
    if (pieceColor === 'queen') {
      colors = [0xff4444, 0xff6666, 0xffaaaa, 0xffd700];
    } else if (pieceColor === 'white') {
      colors = [0xffffff, 0xffffcc, 0xffd700, 0xffee88];
    } else {
      colors = [0x444444, 0x666666, 0xffd700, 0xffee88];
    }

    // Ring burst
    const ring = this.scene.add.circle(x, y, 5, colors[0]);
    ring.setStrokeStyle(3, colors[0]);
    ring.setFillStyle(0, 0);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });

    // Particle burst
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 80 + Math.random() * 60;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 4;

      const particle = this.scene.add.circle(x, y, size, color);
      particle.setAlpha(0.9);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: 500 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }

    // Star burst
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const star = this.createStar(x, y, 8, 0xffd700);
      
      this.scene.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60,
        rotation: Math.PI,
        alpha: 0,
        scale: 0.5,
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  /**
   * Create a star shape
   */
  private createStar(x: number, y: number, size: number, color: number): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color);
    
    const points = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    
    graphics.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      
      if (i === 0) {
        graphics.moveTo(px, py);
      } else {
        graphics.lineTo(px, py);
      }
    }
    graphics.closePath();
    graphics.fillPath();
    
    graphics.setPosition(x, y);
    return graphics;
  }

  /**
   * Wall bounce impact effect
   */
  createWallImpact(x: number, y: number, normalAngle: number): void {
    const count = 8;
    const spread = Math.PI / 3;

    for (let i = 0; i < count; i++) {
      const angle = normalAngle - spread / 2 + (spread * i) / count;
      const speed = 30 + Math.random() * 40;

      const spark = this.scene.add.circle(x, y, 2, 0xffffff);
      spark.setAlpha(0.7);

      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.3,
        duration: 200,
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  /**
   * Striker power charging effect
   */
  createPowerCharge(x: number, y: number, power: number): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    
    // Pulsing ring based on power
    const color = power > 0.7 ? 0xff4444 : (power > 0.4 ? 0xffaa00 : 0x44ff44);
    const radius = 25 + power * 20;
    
    graphics.lineStyle(2, color, 0.5);
    graphics.strokeCircle(x, y, radius);
    
    return graphics;
  }

  /**
   * Turn change indicator
   */
  createTurnIndicator(x: number, y: number, isWhite: boolean): void {
    const color = isWhite ? COLORS.whitePiece : COLORS.blackPiece;
    
    // Glowing ring
    const ring = this.scene.add.circle(x, y, 30, color);
    ring.setAlpha(0.3);
    ring.setStrokeStyle(2, color);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });

    // Arrow pointing down
    const arrow = this.scene.add.triangle(x, y - 50, 0, 0, 10, -15, -10, -15, color);
    arrow.setAlpha(0);

    this.scene.tweens.add({
      targets: arrow,
      y: y - 30,
      alpha: 1,
      duration: 300,
      yoyo: true,
      repeat: 2,
      ease: 'Bounce.easeOut',
      onComplete: () => arrow.destroy(),
    });
  }

  /**
   * Victory celebration
   */
  createVictoryCelebration(centerX: number, centerY: number): void {
    // Confetti burst
    const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff, 0xffffff];
    
    for (let i = 0; i < 50; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const x = centerX + (Math.random() - 0.5) * 100;
      const y = centerY;
      const size = 4 + Math.random() * 6;
      
      const confetti = this.scene.add.rectangle(x, y, size, size * 2, color);
      confetti.setRotation(Math.random() * Math.PI);
      confetti.setAlpha(0);

      const targetX = x + (Math.random() - 0.5) * 300;
      const targetY = y - 100 - Math.random() * 200;

      this.scene.tweens.add({
        targets: confetti,
        x: targetX,
        y: targetY,
        rotation: Math.random() * Math.PI * 4,
        alpha: { from: 1, to: 0.8 },
        duration: 800 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: () => {
          // Fall down
          this.scene.tweens.add({
            targets: confetti,
            y: centerY + 400,
            alpha: 0,
            rotation: confetti.rotation + Math.PI * 2,
            duration: 1000 + Math.random() * 500,
            ease: 'Quad.easeIn',
            onComplete: () => confetti.destroy(),
          });
        },
      });
    }

    // Big star burst
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const star = this.createStar(centerX, centerY, 15, 0xffd700);
      star.setAlpha(0);

      this.scene.tweens.add({
        targets: star,
        x: centerX + Math.cos(angle) * 150,
        y: centerY + Math.sin(angle) * 150,
        rotation: Math.PI * 2,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.3 },
        duration: 1000,
        ease: 'Quad.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  /**
   * Foul indicator
   */
  createFoulEffect(x: number, y: number): void {
    // Red X
    const size = 40;
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(6, 0xff4444);
    graphics.beginPath();
    graphics.moveTo(x - size / 2, y - size / 2);
    graphics.lineTo(x + size / 2, y + size / 2);
    graphics.moveTo(x + size / 2, y - size / 2);
    graphics.lineTo(x - size / 2, y + size / 2);
    graphics.strokePath();
    graphics.setAlpha(0);

    this.scene.tweens.add({
      targets: graphics,
      alpha: 1,
      scale: 1.2,
      duration: 200,
      yoyo: true,
      repeat: 1,
      ease: 'Bounce.easeOut',
      onComplete: () => graphics.destroy(),
    });

    // Red ring
    const ring = this.scene.add.circle(x, y, 20, 0xff4444);
    ring.setAlpha(0.5);
    ring.setFillStyle(0, 0);
    ring.setStrokeStyle(3, 0xff4444);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }
}
