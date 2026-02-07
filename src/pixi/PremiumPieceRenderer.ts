/**
 * PremiumPieceRenderer - Luxurious piece designs for carrom
 * 
 * Features:
 * - Black pieces with silver rings
 * - White/cream pieces with rings
 * - Red queen piece
 * - Striker with lightning bolt icon and golden glow
 * - Premium shadows and 3D effects
 */

import { Container, Graphics, BlurFilter } from 'pixi.js';

export type PieceType = 'white' | 'black' | 'queen' | 'striker';

export interface PieceConfig {
  type: PieceType;
  radius: number;
  x?: number;
  y?: number;
}

export class PremiumPieceRenderer {
  private colors = {
    // White piece
    whitePiece: 0xFAF8F5,
    whitePieceLight: 0xFFFFFF,
    whitePieceRing: 0xC0C0C0,
    whitePieceShadow: 0x8B8B8B,
    
    // Black piece
    blackPiece: 0x1A1A1A,
    blackPieceLight: 0x3A3A3A,
    blackPieceRing: 0x707070,
    blackPieceShadow: 0x000000,
    
    // Queen
    queenRed: 0xDC143C,
    queenRedLight: 0xFF3355,
    queenRing: 0xB22222,
    queenHighlight: 0xFF6B6B,
    
    // Striker
    strikerBody: 0xFFF8E7,
    strikerLight: 0xFFFFFF,
    strikerGold: 0xD4AF37,
    strikerGoldBright: 0xFFD700,
    strikerGlow: 0xFFD700,
  };

  public createPiece(config: PieceConfig): Container {
    switch (config.type) {
      case 'white':
        return this.createWhitePiece(config.radius, config.x || 0, config.y || 0);
      case 'black':
        return this.createBlackPiece(config.radius, config.x || 0, config.y || 0);
      case 'queen':
        return this.createQueenPiece(config.radius, config.x || 0, config.y || 0);
      case 'striker':
        return this.createStriker(config.radius, config.x || 0, config.y || 0);
      default:
        throw new Error(`Unknown piece type: ${config.type}`);
    }
  }

  private createWhitePiece(radius: number, x: number, y: number): Container {
    const container = new Container();
    container.position.set(x, y);
    
    const g = new Graphics();
    
    // Drop shadow
    g.circle(2, 2, radius);
    g.fill({ color: 0x000000, alpha: 0.4 });
    
    // Main body
    g.circle(0, 0, radius);
    g.fill({ color: this.colors.whitePiece });
    
    // Outer silver ring
    g.circle(0, 0, radius - 1);
    g.stroke({ color: this.colors.whitePieceRing, width: 2.5 });
    
    // Middle ring
    g.circle(0, 0, radius * 0.65);
    g.stroke({ color: this.colors.whitePieceRing, width: 1.5, alpha: 0.7 });
    
    // Inner ring
    g.circle(0, 0, radius * 0.35);
    g.stroke({ color: this.colors.whitePieceRing, width: 1, alpha: 0.5 });
    
    // 3D highlight (top-left)
    g.circle(-radius * 0.25, -radius * 0.25, radius * 0.3);
    g.fill({ color: this.colors.whitePieceLight, alpha: 0.5 });
    
    // Small bright spot
    g.circle(-radius * 0.3, -radius * 0.3, radius * 0.12);
    g.fill({ color: 0xFFFFFF, alpha: 0.6 });
    
    container.addChild(g);
    return container;
  }

  private createBlackPiece(radius: number, x: number, y: number): Container {
    const container = new Container();
    container.position.set(x, y);
    
    const g = new Graphics();
    
    // Drop shadow
    g.circle(2, 2, radius);
    g.fill({ color: 0x000000, alpha: 0.5 });
    
    // Main body
    g.circle(0, 0, radius);
    g.fill({ color: this.colors.blackPiece });
    
    // Outer silver/gray ring
    g.circle(0, 0, radius - 1);
    g.stroke({ color: this.colors.blackPieceRing, width: 2.5 });
    
    // Middle ring
    g.circle(0, 0, radius * 0.65);
    g.stroke({ color: this.colors.blackPieceRing, width: 1.5, alpha: 0.6 });
    
    // Inner ring
    g.circle(0, 0, radius * 0.35);
    g.stroke({ color: this.colors.blackPieceRing, width: 1, alpha: 0.4 });
    
    // 3D highlight (top-left) - subtle for black
    g.circle(-radius * 0.25, -radius * 0.25, radius * 0.28);
    g.fill({ color: this.colors.blackPieceLight, alpha: 0.4 });
    
    // Rim highlight
    g.arc(0, 0, radius - 2, -Math.PI * 0.7, -Math.PI * 0.2);
    g.stroke({ color: 0x5A5A5A, width: 1.5, alpha: 0.5 });
    
    container.addChild(g);
    return container;
  }

  private createQueenPiece(radius: number, x: number, y: number): Container {
    const container = new Container();
    container.position.set(x, y);
    
    const g = new Graphics();
    
    // Drop shadow (slightly larger for emphasis)
    g.circle(2, 2, radius + 1);
    g.fill({ color: 0x000000, alpha: 0.45 });
    
    // Main body - rich red
    g.circle(0, 0, radius);
    g.fill({ color: this.colors.queenRed });
    
    // Outer darker ring
    g.circle(0, 0, radius - 1);
    g.stroke({ color: this.colors.queenRing, width: 2.5 });
    
    // Middle decorative ring
    g.circle(0, 0, radius * 0.65);
    g.stroke({ color: this.colors.queenRing, width: 1.5, alpha: 0.7 });
    
    // Inner ring
    g.circle(0, 0, radius * 0.35);
    g.stroke({ color: this.colors.queenRing, width: 1, alpha: 0.5 });
    
    // 3D highlight
    g.circle(-radius * 0.25, -radius * 0.25, radius * 0.3);
    g.fill({ color: this.colors.queenRedLight, alpha: 0.45 });
    
    // Small bright spot
    g.circle(-radius * 0.3, -radius * 0.3, radius * 0.1);
    g.fill({ color: this.colors.queenHighlight, alpha: 0.5 });
    
    container.addChild(g);
    return container;
  }

  private createStriker(radius: number, x: number, y: number): Container {
    const container = new Container();
    container.position.set(x, y);
    
    // Glow effect layer (behind main striker)
    const glowContainer = new Container();
    const glowGraphics = new Graphics();
    
    // Outer glow rings
    glowGraphics.circle(0, 0, radius + 15);
    glowGraphics.fill({ color: this.colors.strikerGlow, alpha: 0.1 });
    
    glowGraphics.circle(0, 0, radius + 10);
    glowGraphics.fill({ color: this.colors.strikerGlow, alpha: 0.15 });
    
    glowGraphics.circle(0, 0, radius + 5);
    glowGraphics.fill({ color: this.colors.strikerGlow, alpha: 0.2 });
    
    glowContainer.addChild(glowGraphics);
    
    // Apply blur filter for glow effect
    const blurFilter = new BlurFilter();
    blurFilter.blur = 8;
    glowContainer.filters = [blurFilter];
    
    container.addChild(glowContainer);
    
    // Main striker graphics
    const g = new Graphics();
    
    // Drop shadow
    g.circle(3, 3, radius);
    g.fill({ color: 0x000000, alpha: 0.4 });
    
    // Main body - cream/ivory
    g.circle(0, 0, radius);
    g.fill({ color: this.colors.strikerBody });
    
    // Outer golden ring
    g.circle(0, 0, radius - 1);
    g.stroke({ color: this.colors.strikerGold, width: 3 });
    
    // Inner decorative golden ring
    g.circle(0, 0, radius * 0.7);
    g.stroke({ color: this.colors.strikerGold, width: 2, alpha: 0.6 });
    
    // Draw lightning bolt icon in center
    this.drawLightningBolt(g, 0, 0, radius * 0.5);
    
    // 3D highlight
    g.circle(-radius * 0.25, -radius * 0.25, radius * 0.25);
    g.fill({ color: this.colors.strikerLight, alpha: 0.4 });
    
    // Bright spot
    g.circle(-radius * 0.3, -radius * 0.3, radius * 0.1);
    g.fill({ color: 0xFFFFFF, alpha: 0.5 });
    
    container.addChild(g);
    return container;
  }

  private drawLightningBolt(g: Graphics, cx: number, cy: number, size: number): void {
    // Lightning bolt shape
    const points = [
      { x: cx - size * 0.1, y: cy - size * 0.9 },
      { x: cx + size * 0.4, y: cy - size * 0.1 },
      { x: cx + size * 0.05, y: cy - size * 0.1 },
      { x: cx + size * 0.3, y: cy + size * 0.9 },
      { x: cx - size * 0.2, y: cy + size * 0.15 },
      { x: cx + size * 0.1, y: cy + size * 0.15 },
    ];
    
    g.moveTo(points[0].x, points[0].y);
    g.lineTo(points[1].x, points[1].y);
    g.lineTo(points[2].x, points[2].y);
    g.lineTo(points[3].x, points[3].y);
    g.lineTo(points[4].x, points[4].y);
    g.lineTo(points[5].x, points[5].y);
    g.closePath();
    g.fill({ color: this.colors.strikerGoldBright, alpha: 0.9 });
    g.stroke({ color: this.colors.strikerGold, width: 1, alpha: 0.8 });
  }

  /**
   * Create animated glow effect for striker
   */
  public animateStrikerGlow(container: Container, delta: number): void {
    // The glow container is the first child
    const glowContainer = container.getChildAt(0) as Container;
    if (glowContainer) {
      // Pulse the glow alpha
      const time = Date.now() / 1000;
      const pulse = 0.7 + Math.sin(time * 3) * 0.3;
      glowContainer.alpha = pulse;
    }
  }
}
