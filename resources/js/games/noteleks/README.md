# Noteleks Heroes Beyond Light - Modular Structure

## Overview
The Noteleks game has been refactored from a single monolithic script into a clean, modular architecture with separate classes and responsibilities.

## File Structure

```
resources/js/games/noteleks/
├── main.js           # Entry point and DOM integration
├── NoteleksGame.js   # Game initialization and configuration
├── GameScene.js      # Main game scene logic
├── Player.js         # Player character management
├── Enemy.js          # Enemy types and AI behavior
├── WeaponManager.js  # Weapon/projectile system
└── GameUI.js         # User interface management
```

## Class Responsibilities

### `main.js` - GameMain Class
- Entry point for the entire game
- Handles DOM integration and button events
- Manages game lifecycle (initialization, cleanup)
- Error handling and user feedback

### `NoteleksGame.js` - NoteleksGame Class
- Phaser game configuration and setup
- Spine plugin integration
- Game instance management
- High-level game controls (pause, restart)

### `GameScene.js` - GameScene Class
- Main Phaser scene implementation
- Game loop and state management
- Collision detection setup
- Enemy spawning and progression
- Input handling coordination

### `Player.js` - Player Class
- Noteleks character implementation
- Movement and physics
- Spine 2D animation management
- Attack mechanics
- Damage handling and visual effects

### `Enemy.js` - Enemy Class
- Multiple enemy types (zombie, skeleton, ghost, boss)
- Individual AI behaviors per enemy type
- Health and damage systems
- Scoring on destruction

### `WeaponManager.js` - WeaponManager Class
- Weapon/projectile creation and management
- Multiple weapon types (dagger, fireball, arrow, magic_bolt)
- Hit detection and effects
- Weapon cleanup and optimization

### `GameUI.js` - GameUI Class
- Score and health display
- Health bar visualization
- Game over screen
- Pause screen
- DOM element synchronization

## Key Features

### Modular Design
- Clean separation of concerns
- Easy to extend and maintain
- Individual class testing possible
- Reusable components

### Enhanced Enemy System
- Multiple enemy types with unique behaviors
- Progressive difficulty based on score
- Boss enemies at higher scores
- Intelligent AI patterns

### Improved Weapon System
- Multiple weapon types
- Visual hit effects
- Proper cleanup and optimization
- Mouse/touch targeting support

### Professional UI Management
- In-game overlay UI
- Health bar with color coding
- Animated game over screen
- Proper pause functionality

### Error Handling
- Graceful fallbacks for missing assets
- User-friendly error messages
- Debug information for troubleshooting
- Spine animation error recovery

## Usage

The game now loads via ES6 modules through Vite:

```html
@vite('resources/js/games/noteleks/main.js')
```

All game logic is automatically initialized when the DOM loads, with proper cleanup on page unload.

## Development

### Adding New Enemy Types
1. Add new type to `Enemy.js` configuration objects
2. Implement AI behavior in `Enemy.js`
3. Add spawn logic in `GameScene.js`

### Adding New Weapons
1. Add weapon configuration to `WeaponManager.js`
2. Create placeholder texture in `GameScene.js`
3. Implement any special behavior

### Extending UI
1. Add new elements in `GameUI.js`
2. Update DOM template if needed
3. Handle state synchronization

## Benefits of Refactoring

1. **Maintainability**: Each class has a single responsibility
2. **Extensibility**: Easy to add new features without affecting existing code
3. **Debugging**: Isolated functionality makes issues easier to track down
4. **Performance**: Better memory management and cleanup
5. **Collaboration**: Multiple developers can work on different components
6. **Testing**: Individual classes can be unit tested

## Migration Notes

The refactored version maintains full backward compatibility with:
- Existing Spine 2D animations
- All game mechanics and controls
- DOM integration and button events
- Save/scoring system (when implemented)

All functionality from the original monolithic version has been preserved while gaining the benefits of modular architecture.