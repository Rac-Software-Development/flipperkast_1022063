export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface GameObjectProps {
  position: Position;
}

export interface BallProps extends GameObjectProps {
  velocity: Velocity;
  radius: number;
}

export interface FlipperProps extends GameObjectProps {
  length: number;
  width: number;
  angle: number;
  maxAngle: number;
  minAngle: number;
  isLeft: boolean;
}

export interface BumperProps extends GameObjectProps {
  radius: number;
  points: number;
}

export interface PointTriggerProps extends GameObjectProps {
  width: number;
  height: number;
  points: number;
}

export interface PlayerScore {
  id: number;
  score: number;
  name: string;
}

export interface GameState {
  currentPlayer: number;
  players: PlayerScore[];
  highScore: number;
  ballsRemaining: number;
  isPlaying: boolean;
}

export interface MQTTMessage {
  topic: string;
  message: any;
}