const fs = require('fs');
const code = fs.readFileSync('src/game/entities/enemy/Enemy.ts', 'utf8');
const newCode = code.replace(/updateAI\(dt: number, game: GameState\) \{[\s\S]*?\}\n/, `updateAI(dt: number, game: GameState) {
    const dir = math.normalize(math.sub(game.player.pos, this.pos));
    const desiredVel = math.mul(dir, this.speed);
    
    // Smooth but snappy interpolation to remove sluggish delay
    this.vel = math.lerpVector(this.vel, desiredVel, dt * 10);
  }\n`);
fs.writeFileSync('src/game/entities/enemy/Enemy.ts', newCode);
