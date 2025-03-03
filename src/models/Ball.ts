import { BallProps, Position, Velocity } from '../types';
import { applyGravity, applyFriction } from '../utils/physics';

class Ball {
  position: Position;
  velocity: Velocity;
  radius: number;
  
  constructor({ position, velocity, radius }: BallProps) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
  }

  update(deltaTime: number, gravity: number, friction: number): void {
    this.velocity = applyGravity(this.velocity, gravity * deltaTime);
    
    this.velocity = applyFriction(this.velocity, friction * deltaTime);
    
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  setVelocity(velocity: Velocity): void {
    this.velocity = velocity;
  }

  reset(position: Position, velocity: Velocity): void {
    this.position = position;
    this.velocity = velocity;
  }
}

export default Ball;