import { describe, it, expect, beforeEach } from 'vitest';
import Ball from '../models/Ball';
import { BallProps } from '../types';

describe('Ball', () => {
  let ball: Ball;
  const initialProps: BallProps = {
    position: { x: 100, y: 100 },
    velocity: { x: 5, y: 5 },
    radius: 10
  };
  
  beforeEach(() => {
    ball = new Ball(initialProps);
  });
  
  it('should initialize with the correct properties', () => {
    expect(ball.position).toEqual(initialProps.position);
    expect(ball.velocity).toEqual(initialProps.velocity);
    expect(ball.radius).toBe(initialProps.radius);
  });
  
  it('should update position based on velocity', () => {
    const deltaTime = 1;
    const gravity = 0;
    const friction = 0;
    
    ball.update(deltaTime, gravity, friction);
    
    expect(ball.position.x).toBe(105);
    expect(ball.position.y).toBe(105);
  });
  
  it('should apply gravity to velocity', () => {
    const deltaTime = 1;
    const gravity = 0.5;
    const friction = 0;
    
    ball.update(deltaTime, gravity, friction);
    
    expect(ball.velocity.x).toBe(5);
    expect(ball.velocity.y).toBe(5.5);
  });
  
  it('should apply friction to velocity', () => {
    const deltaTime = 1;
    const gravity = 0;
    const friction = 0.1;
    
    ball.update(deltaTime, gravity, friction);
    
    expect(ball.velocity.x).toBe(4.5);
    expect(ball.velocity.y).toBe(4.5);
  });
  
  it('should set velocity correctly', () => {
    const newVelocity = { x: 10, y: -5 };
    
    ball.setVelocity(newVelocity);
    
    expect(ball.velocity).toEqual(newVelocity);
  });
  
  it('should reset position and velocity correctly', () => {
    const newPosition = { x: 200, y: 200 };
    const newVelocity = { x: 0, y: 0 };
    
    ball.reset(newPosition, newVelocity);
    
    expect(ball.position).toEqual(newPosition);
    expect(ball.velocity).toEqual(newVelocity);
  });
});