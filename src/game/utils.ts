import { Vector2 } from './types';

export const math = {
  add: (v1: Vector2, v2: Vector2): Vector2 => ({ x: v1.x + v2.x, y: v1.y + v2.y }),
  sub: (v1: Vector2, v2: Vector2): Vector2 => ({ x: v1.x - v2.x, y: v1.y - v2.y }),
  mul: (v: Vector2, scalar: number): Vector2 => ({ x: v.x * scalar, y: v.y * scalar }),
  div: (v: Vector2, scalar: number): Vector2 => ({ x: v.x / scalar, y: v.y / scalar }),
  mag: (v: Vector2): number => Math.sqrt(v.x * v.x + v.y * v.y),
  normalize: (v: Vector2): Vector2 => {
    const m = math.mag(v);
    return m === 0 ? { x: 0, y: 0 } : math.div(v, m);
  },
  dist: (v1: Vector2, v2: Vector2): number => math.mag(math.sub(v1, v2)),
  lerp: (a: number, b: number, t: number) => a + (b - a) * t,
  lerpVector: (a: Vector2, b: Vector2, t: number): Vector2 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }),
  randomRange: (min: number, max: number) => Math.random() * (max - min) + min,
};

export const checkCollision = (p1: Vector2, r1: number, p2: Vector2, r2: number) => {
  return math.dist(p1, p2) < (r1 + r2);
};

let _id = 0;
export const uid = () => `id_${_id++}`;
