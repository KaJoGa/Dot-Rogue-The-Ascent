const fs = require('fs');
const code = fs.readFileSync('src/game/entities/enemy/Boss.ts', 'utf8');
const newCode = code.replace(/         const desiredVel = math\.mul\(dir, this\.speed\);\n         let steering = math\.sub\(desiredVel, this\.vel\);[\s\S]*?         if \(currentSpeed > this\.speed \* 1\.5\) \{\n             this\.vel = math\.lerpVector\(this\.vel, desiredVel, dt \* 5\);\n         \}/, `         const desiredVel = math.mul(dir, this.speed);
         // Smooth but snappy interpolation to remove sluggish delay
         this.vel = math.lerpVector(this.vel, desiredVel, dt * 10);`);
fs.writeFileSync('src/game/entities/enemy/Boss.ts', newCode);
