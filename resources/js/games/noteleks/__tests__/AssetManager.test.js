import AssetManager from '../utils/AssetManager';

describe('AssetManager', () => {
  let mockScene;

  beforeEach(() => {
    mockScene = {
      textures: { exists: jest.fn().mockReturnValue(false), get: jest.fn().mockReturnValue({ getSourceImage: jest.fn().mockReturnValue('img') }), addImage: jest.fn() },
      add: { graphics: jest.fn().mockReturnValue({ fillStyle: jest.fn(), fillRect: jest.fn(), generateTexture: jest.fn(), destroy: jest.fn() }) },
      load: { image: jest.fn(), once: jest.fn((event, cb) => cb()) },
      anims: { exists: jest.fn().mockReturnValue(false), create: jest.fn(), get: jest.fn().mockReturnValue({ frames: [{ textureKey: 'k', frame: { name: 'f' } }] }) }
    };
  });

  it('createPlaceholderTextures creates textures', () => {
    const config = { assets: { textures: { foo: { color: 0xff0000, width: 10, height: 20 } } } };
    AssetManager.createPlaceholderTextures(mockScene, config);
    expect(mockScene.add.graphics).toHaveBeenCalled();
  });

  it('queueAssetsFromManifest enqueues images and creates anims', () => {
    const manifest = { frameSequences: { '/foo/bar_': ['a.webp', 'b.webp'] } };
    AssetManager.queueAssetsFromManifest(mockScene, manifest);
    expect(mockScene.load.image).toHaveBeenCalled();
    expect(mockScene.anims.create).toHaveBeenCalled();
  });

  it('loadFrameSequence enqueues images and creates anim', () => {
    AssetManager.loadFrameSequence(mockScene, 'anim', '/foo/', 2);
    expect(mockScene.load.image).toHaveBeenCalled();
    expect(mockScene.anims.create).toHaveBeenCalled();
  });

  it('setupSpineData returns false', () => {
    expect(AssetManager.setupSpineData(mockScene)).toBe(false);
  });
});
