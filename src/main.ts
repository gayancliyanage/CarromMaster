import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene } from './scenes/Boot';
import { MenuScene } from './scenes/Menu';
import { GameScene } from './scenes/Game';
import { GameOverScene } from './scenes/GameOver';

// Add scenes to config
const config: Phaser.Types.Core.GameConfig = {
  ...gameConfig,
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
};

// Create the game
const game = new Phaser.Game(config);

// Handle window resize
window.addEventListener('resize', () => {
  game.scale.refresh();
});

export default game;
