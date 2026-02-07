/**
 * AI Opponent for CarromMaster
 * Analyzes the board and makes strategic shots
 */

import { BOARD_SIZE, POCKET_RADIUS, PIECE_RADIUS, STRIKER_RADIUS } from '../config';

interface Position {
  x: number;
  y: number;
}

interface Piece {
  position: Position;
  type: 'white' | 'black' | 'queen';
  pocketed: boolean;
}

interface Shot {
  angle: number;
  power: number;
  score: number;
  targetPiece?: Piece;
  targetPocket?: Position;
}

export class CarromAI {
  private boardCenterX: number;
  private boardCenterY: number;
  private pockets: Position[];
  private difficulty: 'easy' | 'medium' | 'hard';

  constructor(
    boardCenterX: number,
    boardCenterY: number,
    pockets: Position[],
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ) {
    this.boardCenterX = boardCenterX;
    this.boardCenterY = boardCenterY;
    this.pockets = pockets;
    this.difficulty = difficulty;
  }

  /**
   * Calculate the best shot for the AI
   */
  calculateShot(
    strikerPos: Position,
    pieces: Piece[],
    aiColor: 'white' | 'black'
  ): { angle: number; power: number } {
    const possibleShots: Shot[] = [];

    // Get pieces that belong to the AI
    const myPieces = pieces.filter(p => p.type === aiColor && !p.pocketed);
    const opponentPieces = pieces.filter(p => p.type !== aiColor && p.type !== 'queen' && !p.pocketed);
    const queen = pieces.find(p => p.type === 'queen' && !p.pocketed);

    // Evaluate shots to each of our pieces towards each pocket
    for (const piece of myPieces) {
      for (const pocket of this.pockets) {
        const shot = this.evaluateShot(strikerPos, piece, pocket, pieces);
        if (shot) {
          possibleShots.push(shot);
        }
      }
    }

    // If queen is available and we have few pieces left, consider it
    if (queen && myPieces.length <= 3) {
      for (const pocket of this.pockets) {
        const shot = this.evaluateShot(strikerPos, queen as unknown as Piece, pocket, pieces);
        if (shot) {
          shot.score *= 0.8; // Slightly lower priority
          possibleShots.push(shot);
        }
      }
    }

    // Add some defensive shots (hit opponent pieces away from pockets)
    if (possibleShots.length < 3) {
      for (const piece of opponentPieces) {
        const shot = this.evaluateDefensiveShot(strikerPos, piece, pieces);
        if (shot) {
          possibleShots.push(shot);
        }
      }
    }

    // Sort by score
    possibleShots.sort((a, b) => b.score - a.score);

    // Apply difficulty-based randomness
    let selectedShot: Shot;
    
    if (possibleShots.length === 0) {
      // No good shots found, shoot randomly at center
      const angle = Math.atan2(
        this.boardCenterY - strikerPos.y,
        this.boardCenterX - strikerPos.x
      );
      return { angle, power: 0.5 };
    }

    switch (this.difficulty) {
      case 'easy':
        // Pick randomly from top 50% of shots, add randomness
        const easyIndex = Math.floor(Math.random() * Math.min(possibleShots.length, Math.ceil(possibleShots.length / 2)));
        selectedShot = possibleShots[easyIndex];
        selectedShot.angle += (Math.random() - 0.5) * 0.3; // Add angle error
        selectedShot.power *= 0.7 + Math.random() * 0.4; // Vary power
        break;
        
      case 'hard':
        // Almost always pick the best shot, minimal randomness
        selectedShot = possibleShots[0];
        selectedShot.angle += (Math.random() - 0.5) * 0.05;
        selectedShot.power *= 0.95 + Math.random() * 0.1;
        break;
        
      default: // medium
        // Pick from top 3, moderate randomness
        const medIndex = Math.floor(Math.random() * Math.min(possibleShots.length, 3));
        selectedShot = possibleShots[medIndex];
        selectedShot.angle += (Math.random() - 0.5) * 0.15;
        selectedShot.power *= 0.85 + Math.random() * 0.2;
    }

    return {
      angle: selectedShot.angle,
      power: Math.max(0.3, Math.min(1, selectedShot.power)),
    };
  }

  /**
   * Evaluate a potential shot towards a pocket
   */
  private evaluateShot(
    strikerPos: Position,
    targetPiece: Piece,
    pocket: Position,
    allPieces: Piece[]
  ): Shot | null {
    // Calculate angle from piece to pocket
    const pieceToPocketAngle = Math.atan2(
      pocket.y - targetPiece.position.y,
      pocket.x - targetPiece.position.x
    );

    // Calculate where striker needs to hit the piece
    // (opposite side from pocket direction)
    const hitPointX = targetPiece.position.x - Math.cos(pieceToPocketAngle) * (PIECE_RADIUS + STRIKER_RADIUS);
    const hitPointY = targetPiece.position.y - Math.sin(pieceToPocketAngle) * (PIECE_RADIUS + STRIKER_RADIUS);

    // Calculate angle from striker to hit point
    const shotAngle = Math.atan2(
      hitPointY - strikerPos.y,
      hitPointX - strikerPos.x
    );

    // Calculate distance
    const distance = Math.sqrt(
      Math.pow(hitPointX - strikerPos.x, 2) +
      Math.pow(hitPointY - strikerPos.y, 2)
    );

    // Check for obstacles in the path
    const hasObstacle = this.checkObstacles(
      strikerPos,
      { x: hitPointX, y: hitPointY },
      allPieces.filter(p => p !== targetPiece && !p.pocketed)
    );

    if (hasObstacle) {
      return null;
    }

    // Calculate score based on various factors
    let score = 100;

    // Closer shots are easier
    score -= distance * 0.1;

    // Pieces closer to pockets are better targets
    const pieceToPocketDist = Math.sqrt(
      Math.pow(pocket.x - targetPiece.position.x, 2) +
      Math.pow(pocket.y - targetPiece.position.y, 2)
    );
    score -= pieceToPocketDist * 0.2;

    // Straight line shots are easier
    const strikerToPieceAngle = Math.atan2(
      targetPiece.position.y - strikerPos.y,
      targetPiece.position.x - strikerPos.x
    );
    const angleDiff = Math.abs(this.normalizeAngle(shotAngle - pieceToPocketAngle));
    score -= angleDiff * 10;

    // Calculate required power
    const power = Math.min(1, distance / (BOARD_SIZE * 0.6));

    if (score < 20) {
      return null; // Shot is too difficult
    }

    return {
      angle: shotAngle,
      power,
      score,
      targetPiece,
      targetPocket: pocket,
    };
  }

  /**
   * Evaluate a defensive shot (pushing opponent pieces away)
   */
  private evaluateDefensiveShot(
    strikerPos: Position,
    targetPiece: Piece,
    allPieces: Piece[]
  ): Shot | null {
    // Find the nearest pocket to the opponent's piece
    let nearestPocket = this.pockets[0];
    let minDist = Infinity;

    for (const pocket of this.pockets) {
      const dist = Math.sqrt(
        Math.pow(pocket.x - targetPiece.position.x, 2) +
        Math.pow(pocket.y - targetPiece.position.y, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearestPocket = pocket;
      }
    }

    // If opponent piece is close to a pocket, push it away
    if (minDist > 80) {
      return null; // Piece isn't threatening
    }

    // Calculate angle to push piece away from pocket
    const awayAngle = Math.atan2(
      targetPiece.position.y - nearestPocket.y,
      targetPiece.position.x - nearestPocket.x
    );

    // Hit point on the piece
    const hitPointX = targetPiece.position.x - Math.cos(awayAngle) * (PIECE_RADIUS + STRIKER_RADIUS);
    const hitPointY = targetPiece.position.y - Math.sin(awayAngle) * (PIECE_RADIUS + STRIKER_RADIUS);

    const shotAngle = Math.atan2(
      hitPointY - strikerPos.y,
      hitPointX - strikerPos.x
    );

    const distance = Math.sqrt(
      Math.pow(hitPointX - strikerPos.x, 2) +
      Math.pow(hitPointY - strikerPos.y, 2)
    );

    // Check obstacles
    const hasObstacle = this.checkObstacles(
      strikerPos,
      { x: hitPointX, y: hitPointY },
      allPieces.filter(p => p !== targetPiece && !p.pocketed)
    );

    if (hasObstacle) {
      return null;
    }

    return {
      angle: shotAngle,
      power: Math.min(0.8, distance / (BOARD_SIZE * 0.5)),
      score: 30 + (80 - minDist) * 0.5, // Higher score for pieces closer to pockets
    };
  }

  /**
   * Check if there are obstacles between two points
   */
  private checkObstacles(
    from: Position,
    to: Position,
    pieces: Piece[]
  ): boolean {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return false;

    const nx = dx / distance;
    const ny = dy / distance;

    for (const piece of pieces) {
      // Project piece position onto the line
      const px = piece.position.x - from.x;
      const py = piece.position.y - from.y;
      
      const dot = px * nx + py * ny;
      
      // Check if piece is between from and to
      if (dot > STRIKER_RADIUS && dot < distance - PIECE_RADIUS) {
        // Calculate perpendicular distance
        const closestX = from.x + nx * dot;
        const closestY = from.y + ny * dot;
        
        const perpDist = Math.sqrt(
          Math.pow(piece.position.x - closestX, 2) +
          Math.pow(piece.position.y - closestY, 2)
        );

        if (perpDist < STRIKER_RADIUS + PIECE_RADIUS + 5) {
          return true; // Obstacle found
        }
      }
    }

    return false;
  }

  /**
   * Normalize angle to -PI to PI range
   */
  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  /**
   * Set AI difficulty
   */
  setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
  }
}
