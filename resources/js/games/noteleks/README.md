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
# Noteleks Game - Modular Architecture ## Overview The Noteleks game has been completely refactored from a monolithic structure to a modular,
component-based architecture using the Entity Component System (ECS) pattern with manager classes. ## Architecture ### Core Structure
```

resources/js/games/noteleks/
├── main-modular.js # Entry point
├── NoteleksGameModular.js # Main game class
├── config/
│ └── GameConfig.js # Centralized configuration
├── entities/
│ ├── GameObject.js # Base entity class
│ ├── Player.js # Player entity with components
│ └── Enemy.js # Enemy entity with components
├── components/
│ ├── HealthComponent.js # Health management
│ ├── MovementComponent.js # Movement and physics
│ ├── InputComponent.js # Input handling
│ ├── AttackComponent.js # Attack system
│ └── AIComponent.js # AI behavior
├── managers/
│ ├── AssetManager.js # Asset loading and management
│ ├── InputManager.js # Global input handling
│ ├── EnemyManager.js # Enemy spawning and lifecycle
│ └── PlatformManager.js # Platform generation
├── scenes/
│ └── GameScene.js # Main game scene
├── utils/
│ └── MathUtils.js # Mathematical utilities
└── factories/
└── GameObjectFactory.js # Object creation factory

```

## Key Features

### 1. Component-Based Entities
- **GameObject**: Base class with component management
- **Player**: Composed of health, movement, input, and attack components
- **Enemy**: Composed of health, movement, and AI components

### 2. Manager Pattern
- **AssetManager**: Centralized asset loading and caching
- **InputManager**: Global input state management
- **EnemyManager**: Enemy spawning, AI coordination, and collision handling
- **PlatformManager**: Dynamic platform generation

### 3. Configuration-Driven Design
- **GameConfig.js**: Single source of truth for all game settings
- Easily tweakable gameplay parameters
- Organized by system (player, enemies, weapons, UI, assets)

### 4. Modular Components
- **HealthComponent**: Damage handling and health management
- **MovementComponent**: Physics-based movement with platformer mechanics
- **InputComponent**: Keyboard input processing
- **AttackComponent**: Weapon firing and combat mechanics
- **AIComponent**: Enemy behavior and pathfinding

## Benefits of the New Architecture

1. **Maintainability**: Clear separation of concerns
2. **Extensibility**: Easy to add new entities, components, or managers
3. **Testability**: Isolated components can be tested independently
4. **Performance**: Efficient component-based updates
5. **Configuration**: Centralized settings for easy tweaking

## Usage

The game is now initialized through `main-modular.js` which creates a Phaser game instance with the modular architecture. All legacy files have been removed and the build system updated accordingly.

## Development

To add new features:
1. Create new components in the `components/` folder
2. Add new entities in the `entities/` folder using the GameObject base class
3. Create managers for complex systems in the `managers/` folder
4. Update GameConfig.js with new configuration options
5. Use the GameObjectFactory for consistent object creation

## Build System

The game is built using Vite and imported in the Laravel Blade template. The entry point is `main-modular.js` which initializes the entire modular system.
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
