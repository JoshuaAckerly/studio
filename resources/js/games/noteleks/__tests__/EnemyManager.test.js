import { EnemyManager } from '../managers/EnemyManager.js';

describe('EnemyManager', () => {
  it('should construct with a scene', () => {
    const mockScene = { cameras: { main: { width: 800, height: 600 } }, entityFactory: { createEnemy: jest.fn() }, gameUI: { getScore: jest.fn() } };
    const manager = new EnemyManager(mockScene);
    expect(manager.scene).toBe(mockScene);
  });

  it('should select an enemy type', () => {
    const mockScene = { cameras: { main: { width: 800, height: 600 } }, entityFactory: { createEnemy: jest.fn() }, gameUI: { getScore: jest.fn(() => 0) } };
    const manager = new EnemyManager(mockScene);
    const type = manager.selectEnemyType();
    expect(['zombie', 'skeleton', 'ghost']).toContain(type);
  });
});
