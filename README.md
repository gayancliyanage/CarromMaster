# 🎯 CarromMaster

A cross-platform Carrom board game built with modern web technologies.

![Carrom Board](https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Carrom_board.jpg/300px-Carrom_board.jpg)

## 🎮 About

Carrom is a popular tabletop game originating from South Asia. Players flick a striker disc to pocket carrom men (similar to billiards/pool).

## 🚀 Tech Stack

- **[Phaser 3](https://phaser.io/)** — 2D game framework
- **[Matter.js](https://brm.io/matter-js/)** — Physics engine (built into Phaser)
- **[Vite](https://vitejs.dev/)** — Build tool
- **[Capacitor](https://capacitorjs.com/)** — Native mobile packaging
- **TypeScript** — Type safety

## 📱 Platforms

- 🌐 **Web** — Any modern browser
- 📱 **iOS** — iPhone & iPad
- 🤖 **Android** — Phones & tablets
- 🖥️ **Desktop** — Windows, macOS, Linux

## 🎯 Features

### MVP (v0.1)
- [ ] Realistic physics (friction, collisions, pockets)
- [ ] Touch & mouse controls
- [ ] Single player mode
- [ ] Basic AI opponent
- [ ] Sound effects

### Future
- [ ] Online multiplayer
- [ ] Local multiplayer (pass & play)
- [ ] Tournament mode
- [ ] Customizable boards & pieces
- [ ] Leaderboards

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Build for mobile
npm run build:mobile
```

### Mobile Development
```bash
# iOS (requires macOS + Xcode)
npm run ios

# Android (requires Android Studio)
npm run android
```

## 🎲 Game Rules

1. **Objective**: Pocket all your carrom men (black or white) before your opponent
2. **Striker**: Use the striker to hit carrom men into corner pockets
3. **Queen**: The red piece (queen) must be "covered" by pocketing another piece immediately after
4. **Fouls**: Pocketing the striker, crossing the baseline, etc. result in penalties

## 📁 Project Structure

```
CarromMaster/
├── src/
│   ├── main.ts           # Entry point
│   ├── config.ts         # Game configuration
│   ├── scenes/
│   │   ├── Boot.ts       # Asset loading
│   │   ├── Menu.ts       # Main menu
│   │   ├── Game.ts       # Main gameplay
│   │   └── GameOver.ts   # End screen
│   ├── objects/
│   │   ├── Board.ts      # Carrom board
│   │   ├── Piece.ts      # Carrom men & queen
│   │   ├── Striker.ts    # Player striker
│   │   └── Pocket.ts     # Corner pockets
│   ├── physics/
│   │   └── CarromPhysics.ts
│   └── utils/
│       └── helpers.ts
├── public/
│   └── assets/
│       ├── images/
│       └── audio/
├── index.html
└── package.json
```

## 📄 License

MIT License — feel free to use, modify, and distribute.

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.
