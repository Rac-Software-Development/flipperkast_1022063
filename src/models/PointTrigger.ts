import { PointTriggerProps, Position } from '../types';

class PointTrigger {
  position: Position;
  width: number;
  height: number;
  points: number;
  
  constructor({ position, width, height, points }: PointTriggerProps) {
    this.position = position;
    this.width = width;
    this.height = height;
    this.points = points;
  }

  getPoints(): number {
    return this.points;
  }
}

export default PointTrigger;