import { BumperProps, Position } from '../types';

class Bumper {
  position: Position;
  radius: number;
  points: number;
  
  constructor({ position, radius, points }: BumperProps) {
    this.position = position;
    this.radius = radius;
    this.points = points;
  }

  getPoints(): number {
    return this.points;
  }
}

export default Bumper;