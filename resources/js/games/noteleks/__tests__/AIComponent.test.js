import AIComponent from '../components/AIComponent';


describe('AIComponent', () => {
  let ai;
  let mockGameObject;
  let mockMovement;
  let mockTarget;

  beforeEach(() => {
    mockMovement = {
      moveRight: jest.fn(),
      moveLeft: jest.fn(),
      stopHorizontal: jest.fn(),
      jump: jest.fn(),
      isOnGround: jest.fn().mockReturnValue(true),
      speed: 0
    };
    mockGameObject = {
      getComponent: jest.fn().mockImplementation(name => name === 'movement' ? mockMovement : null),
      getPosition: jest.fn().mockReturnValue({ x: 0, y: 0 })
    };
    mockTarget = {
      getPosition: jest.fn().mockReturnValue({ x: 100, y: 0 })
    };
    ai = new AIComponent('zombie');
    ai.gameObject = mockGameObject;
    ai.setTarget(mockTarget);
  });

  it('initializes with config values', () => {
    expect(ai.aiType).toBe('zombie');
    expect(typeof ai.speed).toBe('number');
    expect(typeof ai.detectionRange).toBe('number');
  });

  it('setTarget and getTarget work', () => {
    expect(ai.getTarget()).toBe(mockTarget);
    const newTarget = { getPosition: jest.fn() };
    ai.setTarget(newTarget);
    expect(ai.getTarget()).toBe(newTarget);
  });

  it('getDistanceToTarget returns correct distance', () => {
    mockGameObject.getPosition.mockReturnValue({ x: 0, y: 0 });
    mockTarget.getPosition.mockReturnValue({ x: 3, y: 4 });
    expect(ai.getDistanceToTarget()).toBe(5);
  });

  it('setDetectionRange and setSpeed update values', () => {
    ai.setDetectionRange(123);
    expect(ai.detectionRange).toBe(123);
    ai.setSpeed(456);
    expect(ai.speed).toBe(456);
    expect(mockMovement.speed).toBe(456);
  });

  it('getTargetPosition handles various target types', () => {
    // getPosition method
    expect(ai.getTargetPosition()).toEqual({ x: 100, y: 0 });
    // sprite property
    ai.setTarget({ sprite: { x: 1, y: 2 } });
    expect(ai.getTargetPosition()).toEqual({ x: 1, y: 2 });
    // direct x/y
    ai.setTarget({ x: 5, y: 6 });
    expect(ai.getTargetPosition()).toEqual({ x: 5, y: 6 });
    // null
    ai.setTarget(null);
    expect(ai.getTargetPosition()).toBeNull();
  });

  it('stun and getIsStunned work', () => {
    ai.stun(100);
    expect(ai.getIsStunned()).toBe(true);
  });

  it('update does nothing if disabled or no target', () => {
    ai.enabled = false;
    ai.update(16);
    ai.enabled = true;
    ai.setTarget(null);
    ai.update(16);
    // Should not throw or call movement
  });

  it('update does not move if stunned', () => {
    ai.isStunned = true;
    ai.stunEndTime = Date.now() + 10000;
    ai.update(16);
    expect(mockMovement.moveRight).not.toHaveBeenCalled();
  });

  it('update chases target if in range', () => {
    ai.detectionRange = 200;
    mockGameObject.getPosition.mockReturnValue({ x: 0, y: 0 });
    mockTarget.getPosition.mockReturnValue({ x: 100, y: 0 });
    ai.update(16);
    expect(mockMovement.moveRight).toHaveBeenCalled();
  });

  it('update stops if target out of range', () => {
    ai.detectionRange = 10;
    mockGameObject.getPosition.mockReturnValue({ x: 0, y: 0 });
    mockTarget.getPosition.mockReturnValue({ x: 100, y: 0 });
    ai.update(16);
    expect(mockMovement.stopHorizontal).toHaveBeenCalled();
  });

  it('chaseTarget jumps if target is above', () => {
    ai.detectionRange = 200;
    mockGameObject.getPosition.mockReturnValue({ x: 0, y: 100 });
    mockTarget.getPosition.mockReturnValue({ x: 0, y: 0 });
    ai.update(16);
    expect(mockMovement.jump).toHaveBeenCalled();
  });
});
