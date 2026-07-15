const fs = require('fs');
const code = fs.readFileSync('src/game/entities/enemy/EliteEnemy.ts', 'utf8');
const newCode = code.replace(/    \/\/ Steering force: desired_velocity - current_velocity[\s\S]*?    if \(currentSpeed > this\.speed \* 1\.5\) \{\n       this\.vel = math\.lerpVector\(this\.vel, desiredVel, dt \* 5\);\n    \}/, `    // Smooth but snappy interpolation to remove sluggish delay
    this.vel = math.lerpVector(this.vel, desiredVel, dt * 10);`);
fs.writeFileSync('src/game/entities/enemy/EliteEnemy.ts', newCode);
