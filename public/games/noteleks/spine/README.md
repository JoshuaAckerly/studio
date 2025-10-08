# Noteleks Heroes Beyond Light - Spine 2D Animations

## 📁 File Structure

### Characters Folder (`/characters/`)
Put your player character Spine files here:
- `noteleks.json` - Animation data exported from Spine
- `noteleks.atlas` - Texture atlas file
- `noteleks.png` - Sprite sheet image

### Enemies Folder (`/enemies/`)
Put your enemy character Spine files here:
- `zombie.json`, `zombie.atlas`, `zombie.png` - Zombie enemy
- `ghoul.json`, `ghoul.atlas`, `ghoul.png` - Ghoul enemy
- Add more enemies as needed...

## 🎮 Expected Animation Names

The game code expects these animation names in your Spine files:

### Player Character (noteleks):
- `idle` - Standing still animation
- `run` - Running/walking animation
- `jump` - Jumping animation (optional)
- `attack` - Attack animation (optional)

### Enemies:
- `walk` - Walking toward player
- `idle` - Standing still
- `attack` - Attack animation (optional)
- `death` - Death animation (optional)

## 🔧 How to Enable

1. Upload your Spine files to the appropriate folders
2. Open the game in your browser
3. Click "Enable Spine Animations" button
4. Restart the game to see your animations!

## 🚨 File Export Settings

When exporting from Spine:
- **Format**: JSON
- **Atlas Format**: LibGDX
- **Image Format**: PNG
- **Premultiply Alpha**: Recommended for web
- **Scale**: 1.0 (or adjust based on your game size)