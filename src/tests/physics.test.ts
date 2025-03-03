import { describe, it, expect } from 'vitest';
import { 
  calculateReflection, 
  checkCircleCollision, 
  checkRectCollision,
  getCircleCollisionNormal,
  applyGravity,
  applyFriction
} from '../utils/physics';

describe('Physics Utilities', () => {
  describe('calculateReflection', () => {
    it('should correctly calculate reflection vector when hitting a horizontal surface', () => {
      const velocity = { x: 0, y: 5 };
      const normal = { x: 0, y: -1 }; 
      
      const result = calculateReflection(velocity, normal);
      
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(-5);
    });
    
    it('should correctly calculate reflection vector when hitting a vertical surface', () => {
      const velocity = { x: 5, y: 0 };
      const normal = { x: -1, y: 0 }; 
      
      const result = calculateReflection(velocity, normal);
      
      expect(result.x).toBeCloseTo(-5);
      expect(result.y).toBeCloseTo(0);
    });
    
    it('should correctly calculate reflection vector when hitting at an angle', () => {
      const velocity = { x: 3, y: 4 };
      const normal = { x: -1, y: 0 }; 
      
      const result = calculateReflection(velocity, normal);
      
      expect(result.x).toBeCloseTo(-3);
      expect(result.y).toBeCloseTo(4);
    });
  });
  
  describe('checkCircleCollision', () => {
    it('should detect collision when circles overlap', () => {
      const ballPos = { x: 10, y: 10 };
      const ballRadius = 5;
      const bumperPos = { x: 15, y: 10 };
      const bumperRadius = 5;
      
      const result = checkCircleCollision(ballPos, ballRadius, bumperPos, bumperRadius);
      
      expect(result).toBe(true);
    });
    
    it('should not detect collision when circles do not overlap', () => {
      const ballPos = { x: 10, y: 10 };
      const ballRadius = 5;
      const bumperPos = { x: 25, y: 10 };
      const bumperRadius = 5;
      
      const result = checkCircleCollision(ballPos, ballRadius, bumperPos, bumperRadius);
      
      expect(result).toBe(false);
    });
    
    it('should detect collision when circles touch', () => {
      const ballPos = { x: 10, y: 10 };
      const ballRadius = 5;
      const bumperPos = { x: 20, y: 10 };
      const bumperRadius = 5;
      
      const result = checkCircleCollision(ballPos, ballRadius, bumperPos, bumperRadius);
      
      expect(result).toBe(true);
    });
  });
  
  describe('checkRectCollision', () => {
    it('should detect collision when ball overlaps rectangle', () => {
      const ballPos = { x: 10, y: 10 };
      const ballRadius = 5;
      const rectPos = { x: 5, y: 5 };
      const rectWidth = 10;
      const rectHeight = 10;
      
      const result = checkRectCollision(ballPos, ballRadius, rectPos, rectWidth, rectHeight);
      
      expect(result).toBe(true);
    });
    
    it('should not detect collision when ball does not overlap rectangle', () => {
      const ballPos = { x: 25, y: 25 };
      const ballRadius = 5;
      const rectPos = { x: 5, y: 5 };
      const rectWidth = 10;
      const rectHeight = 10;
      
      const result = checkRectCollision(ballPos, ballRadius, rectPos, rectWidth, rectHeight);
      
      expect(result).toBe(false);
    });
  });
  
  describe('getCircleCollisionNormal', () => {
    it('should return the correct normal vector', () => {
      const ballPos = { x: 15, y: 10 };
      const bumperPos = { x: 10, y: 10 };
      
      const result = getCircleCollisionNormal(ballPos, bumperPos);
      
      expect(result.x).toBe(5);
      expect(result.y).toBe(0);
    });
  });
  
  describe('applyGravity', () => {
    it('should increase y velocity by gravity value', () => {
      const velocity = { x: 3, y: 4 };
      const gravity = 0.5;
      
      const result = applyGravity(velocity, gravity);
      
      expect(result.x).toBe(3);
      expect(result.y).toBe(4.5);
    });
  });
  
  describe('applyFriction', () => {
    it('should reduce velocity by friction factor', () => {
      const velocity = { x: 10, y: 10 };
      const friction = 0.1;
      
      const result = applyFriction(velocity, friction);
      
      expect(result.x).toBe(9);
      expect(result.y).toBe(9);
    });
  });
});