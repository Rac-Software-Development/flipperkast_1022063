import { Position, Velocity } from '../types';

export const calculateReflection = (
  velocity: Velocity,
  normal: Position
): Velocity => {
  const normalLength = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
  const normalizedNormal = {
    x: normal.x / normalLength,
    y: normal.y / normalLength,
  };

  const dotProduct = 
    velocity.x * normalizedNormal.x + 
    velocity.y * normalizedNormal.y;

  return {
    x: velocity.x - 2 * dotProduct * normalizedNormal.x,
    y: velocity.y - 2 * dotProduct * normalizedNormal.y,
  };
};

export const checkCircleCollision = (
  ballPos: Position,
  ballRadius: number,
  bumperPos: Position,
  bumperRadius: number
): boolean => {
  const dx = ballPos.x - bumperPos.x;
  const dy = ballPos.y - bumperPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance <= ballRadius + bumperRadius;
};

export const checkRectCollision = (
  ballPos: Position,
  ballRadius: number,
  rectPos: Position,
  rectWidth: number,
  rectHeight: number
): boolean => {
  const closestX = Math.max(rectPos.x, Math.min(ballPos.x, rectPos.x + rectWidth));
  const closestY = Math.max(rectPos.y, Math.min(ballPos.y, rectPos.y + rectHeight));
  
  const dx = ballPos.x - closestX;
  const dy = ballPos.y - closestY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < ballRadius;
};


export const getCircleCollisionNormal = (
  ballPos: Position,
  bumperPos: Position
): Position => {
  return {
    x: ballPos.x - bumperPos.x,
    y: ballPos.y - bumperPos.y,
  };
};


export const applyGravity = (velocity: Velocity, gravity: number): Velocity => {
  return {
    x: velocity.x,
    y: velocity.y + gravity,
  };
};


export const applyFriction = (velocity: Velocity, friction: number): Velocity => {
  return {
    x: velocity.x * (1 - friction),
    y: velocity.y * (1 - friction),
  };
};