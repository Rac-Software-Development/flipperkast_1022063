import { FlipperProps, Position } from '../types';

class Flipper {
  position: Position;
  length: number;
  width: number;
  angle: number;
  maxAngle: number;
  minAngle: number;
  isLeft: boolean;
  rotationSpeed: number = 0.3; 
  lastAngle: number; 

  constructor({ position, length, width, angle, maxAngle, minAngle, isLeft }: FlipperProps) {
    this.position = position;
    this.length = length;
    this.width = width;
    this.angle = angle;
    this.lastAngle = angle; 
    this.maxAngle = maxAngle;
    this.minAngle = minAngle;
    this.isLeft = isLeft;
  }

  activate(deltaTime: number): void {
    this.lastAngle = this.angle; 
    const targetAngle = this.isLeft ? this.minAngle : this.maxAngle;
    this.rotateTowards(targetAngle, deltaTime);
  }
  
  deactivate(deltaTime: number): void {
    this.lastAngle = this.angle; 
    const targetAngle = this.isLeft ? this.maxAngle : this.minAngle; 
    this.rotateTowards(targetAngle, deltaTime);
  }
  
  private rotateTowards(targetAngle: number, deltaTime: number): void {
    const angleChange = 5 * deltaTime;
  
    if (Math.abs(this.angle - targetAngle) <= angleChange) {
      this.angle = targetAngle;
    } else if (this.angle < targetAngle) {
      this.angle += angleChange;
    } else {
      this.angle -= angleChange;
    }
  }
  
  getEndpoints(): { start: Position, end: Position } {
    const startX = this.position.x;
    const startY = this.position.y;
    
    const endX = startX + this.length * Math.cos(this.angle);
    const endY = startY + this.length * Math.sin(this.angle);
    
    return {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY }
    };
  }
  
  getPreviousEndpoints(): { start: Position, end: Position } {
    const startX = this.position.x;
    const startY = this.position.y;
    
    const endX = startX + this.length * Math.cos(this.lastAngle);
    const endY = startY + this.length * Math.sin(this.lastAngle);
    
    return {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY }
    };
  }
}

export default Flipper;