import { PlatformManager } from '../managers/PlatformManager.js';

describe('PlatformManager', () => {
  it('should construct with a scene', () => {
    const mockScene = {
      cameras: { main: { width: 800, height: 600 } },
      entityFactory: { createPlatform: jest.fn() },
    };
    const manager = new PlatformManager(mockScene);
    expect(manager.scene).toBe(mockScene);
  });

  it('should create ground platforms', () => {
    const mockScene = {
      cameras: { main: { width: 800, height: 600 } },
      entityFactory: { createPlatform: jest.fn() },
      physics: { add: { staticGroup: jest.fn(() => ({ add: jest.fn() })) } },
    };
    const manager = new PlatformManager(mockScene);
    manager.platforms = { add: jest.fn() };
    manager.createPlatforms();
    expect(mockScene.entityFactory.createPlatform).toHaveBeenCalled();
  });
});
