import InputHandler from '../managers/InputHandler.js';

describe('InputHandler', () => {
  it('should construct with a scene', () => {
    const mockScene = {
      input: { keyboard: { addKeys: jest.fn(() => ({})) } },
    };
    const handler = new InputHandler(mockScene);
    expect(handler.scene).toBe(mockScene);
  });

  it('should set up keys', () => {
    const mockScene = {
      input: { keyboard: { addKeys: jest.fn(() => ({ W: {}, S: {}, A: {}, D: {} })) } },
    };
    const handler = new InputHandler(mockScene);
    handler.setupKeys();
    expect(mockScene.input.keyboard.addKeys).toHaveBeenCalled();
  });
});
