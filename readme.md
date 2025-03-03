# Flipperkast Project (WP6) - Herkansingsopdracht

## Overview
This project is a digital flipperkast (pinball machine) simulation developed as part of the Real-Time System WP6 herkansingsopdracht (resit assignment) at Rotterdam Academy, Software Development. The game combines the classic flipperkast experience with modern technologies such as MQTT for real-time communication between components.

## Features
- **Realistic Physics**: Ball movement follows the principle "angle of incidence equals angle of reflection" ("hoek van inval is hoek van uitval")
- **Interactive Gameplay**: Control flippers to keep the ball in play and score points
- **Object-Oriented Design**: All game components (ball, flippers, bumpers, etc.) are modeled as separate classes
- **Real-Time Communication**: Using MQTT for score updates and game events
- **Multi-Player Support**: Up to 4 players with individual scoring
- **High Score Tracking**: Records and displays the highest score in the current session

## Game Components
1. **Ball**: A metal ball that bounces around the playing field according to physics principles
2. **Flippers**: Two controllable flippers at the bottom of the playing field
3. **Bumpers**: Obstacles that award points when hit and bounce the ball away
4. **Point Triggers**: Areas that award points when the ball passes through them
5. **Score Panel**: Displays current score, individual player scores, and high score

## Technical Architecture

### Core Components
The game is built on a clean object-oriented architecture with three main components:

1. **Game Objects**:
   - `Ball`: Handles position, velocity, and collision physics
   - `Flipper`: Handles rotation, activation, and impact on the ball
   - `Bumper`: Circular obstacles that award points on collision
   - `PointTrigger`: Rectangular areas that award points when passed through

2. **MQTT Communication**:
   - Uses HiveMQ as a broker for real-time communication
   - Publishes score updates and bumper hits to relevant topics
   - Subscribes to receive score updates from other components

3. **UI Components**:
   - Canvas-based rendering of the game field
   - Score panel to display game statistics
   - Visual indicators for MQTT connection status

### Physics Implementation
- Gravity effect on the ball
- Friction to slow down ball movement over time
- Collision detection and response for:
  - Walls
  - Circular bumpers
  - Rectangular point triggers
  - Rotating flippers

## How to Play
1. Press **SPACE** to launch the ball
2. Use **Z** to control the left flipper
3. Use **M** to control the right flipper
4. Try to hit bumpers and pass through point triggers to score points
5. Keep the ball in play as long as possible
6. Each player has 3 balls per turn

## Implementation Details

### Game Settings
```javascript
const GAME_WIDTH = 400;          // Width of the playing field
const GAME_HEIGHT = 600;         // Height of the playing field
const BALL_RADIUS = 10;          // Radius of the ball
const GRAVITY = 0.2;             // Gravity acting on the ball
const FRICTION = 0.01;           // Friction coefficient
```

### MQTT Configuration
```javascript
const MQTT_BROKER_URL = 'wss://583e2a89c70040a7aa40059267a627bc.s1.eu.hivemq.cloud:8884/mqtt';
const MQTT_CLIENT_ID = `pinball_game_${Math.random().toString(16).substring(2, 10)}`;
const MQTT_USERNAME = 'wp6flipper';
const MQTT_PASSWORD = 'Wp6Flipper2025@';
const MQTT_TOPIC_SCORE = 'pinball/score';
const MQTT_TOPIC_BUMPER_HIT = 'pinball/bumper';
```

## Development Approach
This project follows a Test Driven Development (TDD) approach:
1. Write tests that verify each function works as expected
2. Implement the actual code to pass those tests
3. Refactor as needed while maintaining test coverage

This approach ensures the flipperkast operates reliably and correctly.

## Project Requirements
This digital flipperkast was developed as part of the WP6 herkansingsopdracht (resit assignment). The implementation satisfies the following requirements:
- Object-oriented programming principles
- Real-time MQTT communication between components
- Physics-based ball movement and collisions
- Test Driven Development methodology
- Interactive graphical user interface

## Credits
This project was developed for the Real-Time System WP6 herkansingsopdracht at Rotterdam Academy, Software Development.

**Instructors**: 
- Robert Saunders (r.r.saunders@hr.nl)
- Gerard van Kruining (g.w.m.van.kruining@hr.nl)
- Bob Joziasse (b.joziasse@hr.nl)

**Version**: 1.1, 03-03-2025