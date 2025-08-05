import { GameConfig } from '../config/GameConfig.js';

describe('GameConfig', () => {
  it('should have correct default player health', () => {
    expect(GameConfig.player.health).toBe(100);
    expect(GameConfig.player.maxHealth).toBe(100);
  });

  it('should have double jump enabled', () => {
    expect(GameConfig.player.doubleJumpEnabled).toBe(true);
  });
});
