import React, { useEffect, useRef, useState } from 'react';
import Ball from '../models/Ball';
import Flipper from '../models/Flipper';
import Bumper from '../models/Bumper';
import PointTrigger from '../models/PointTrigger';
import { GameState, Position } from '../types';
import { calculateReflection, checkCircleCollision, checkRectCollision, getCircleCollisionNormal } from '../utils/physics';
import mqttClient from '../services/MQTTClient';
import ScorePanel from './ScorePanel';

// Basis spelinstellingen
const GAME_WIDTH = 400;          // Breedte van het speelveld
const GAME_HEIGHT = 600;         // Hoogte van het speelveld
const BALL_RADIUS = 10;          // Straal van de bal
const GRAVITY = 0.2;             // Zwaartekracht die op de bal inwerkt
const FRICTION = 0.01;           // Wrijvingscoëfficiënt

// MQTT configuratie voor externe communicatie
const MQTT_BROKER_URL = 'wss://583e2a89c70040a7aa40059267a627bc.s1.eu.hivemq.cloud:8884/mqtt';
const MQTT_CLIENT_ID = `pinball_game_${Math.random().toString(16).substring(2, 10)}`; // Unieke client ID
const MQTT_USERNAME = 'wp6flipper';
const MQTT_PASSWORD = 'Wp6Flipper2025@';
const MQTT_TOPIC_SCORE = 'pinball/score';        // Topic voor score updates
const MQTT_TOPIC_BUMPER_HIT = 'pinball/bumper';  // Topic voor bumper hits

/**
 * Hoofdcomponent voor de flipperkast
 */
const PinballGame: React.FC = () => {
  // Referentie naar het canvas-element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);         // Voor het bijhouden van de animation frame request
  const lastTimeRef = useRef<number>(0);        // Voor het berekenen van de delta tijd
  
  // Game state met informatie over spelers, scores en spelstatus
  const [gameState, setGameState] = useState<GameState>({
    currentPlayer: 1,                  // Actieve speler
    players: [                         // Spelerslijst
      { id: 1, score: 0, name: 'Speler 1' },
      { id: 2, score: 0, name: 'Speler 2' },
      { id: 3, score: 0, name: 'Speler 3' },
      { id: 4, score: 0, name: 'Speler 4' }
    ],
    highScore: 0,                     // Hoogste score in de huidige sessie
    ballsRemaining: 3,                // Aantal ballen dat de huidige speler nog heeft
    isPlaying: false                  // Geeft aan of het spel actief is
  });
  
  // MQTT verbindingsstatus
  const [mqttConnected, setMqttConnected] = useState<boolean>(false);
  
  // Initialisatie van de bal
  const ballRef = useRef<Ball>(new Ball({
    position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 100 },  // Startpositie
    velocity: { x: 0, y: 0 },                               // Beginsnelheid (stilstand)
    radius: BALL_RADIUS
  }));
  
  // Initialisatie van de linker flipper
  const leftFlipperRef = useRef<Flipper>(new Flipper({
    position: { x: GAME_WIDTH / 4, y: GAME_HEIGHT - 50 },  // Positie
    length: 80,                                            // Lengte
    width: 10,                                             // Breedte
    angle: Math.PI / 6,                                    // Beginhoek
    maxAngle: Math.PI / 6,                                 // Maximale hoek
    minAngle: -Math.PI / 6,                                // Minimale hoek
    isLeft: true                                           // Dit is de linker flipper
  }));
  
  // Initialisatie van de rechter flipper
  const rightFlipperRef = useRef<Flipper>(new Flipper({
    position: { x: (GAME_WIDTH * 3) / 4, y: GAME_HEIGHT - 50 }, // Positie
    length: 80,                                                 // Lengte
    width: 10,                                                  // Breedte
    angle: Math.PI - Math.PI / 6,                               // Beginhoek
    maxAngle: Math.PI + Math.PI / 6,                            // Maximale hoek
    minAngle: Math.PI - Math.PI / 6,                            // Minimale hoek
    isLeft: false                                               // Dit is de rechter flipper
  }));
  
  // Initialisatie van de bumpers (obstakels die punten geven bij botsing)
  const bumpersRef = useRef<Bumper[]>([
    new Bumper({ position: { x: GAME_WIDTH / 4, y: GAME_HEIGHT / 4 }, radius: 20, points: 10 }),
    new Bumper({ position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 3 }, radius: 20, points: 10 }),
    new Bumper({ position: { x: (GAME_WIDTH * 3) / 4, y: GAME_HEIGHT / 4 }, radius: 20, points: 10 })
  ]);
  
  // Initialisatie van de point triggers (gebieden die punten geven wanneer de bal erdoorheen gaat)
  const pointTriggersRef = useRef<PointTrigger[]>([
    new PointTrigger({ position: { x: GAME_WIDTH / 4, y: GAME_HEIGHT / 2 }, width: 40, height: 10, points: 5 }),
    new PointTrigger({ position: { x: (GAME_WIDTH * 3) / 4, y: GAME_HEIGHT / 2 }, width: 40, height: 10, points: 5 })
  ]);
  
  // Status van de flippers (actief of niet)
  const leftFlipperActiveRef = useRef<boolean>(false);
  const rightFlipperActiveRef = useRef<boolean>(false);
  
  // Verbinding maken met MQTT broker bij component mount
  useEffect(() => {
    // Verbinding maken met de MQTT broker
    mqttClient.connect(MQTT_BROKER_URL, MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD);
    mqttClient.onConnectionChange(setMqttConnected);
    
    // Abonneren op relevante topics
    mqttClient.subscribe(MQTT_TOPIC_SCORE);
    mqttClient.subscribe(MQTT_TOPIC_BUMPER_HIT);
    
    // Handler voor inkomende berichten
    mqttClient.onMessage((message) => {
      if (message.topic === MQTT_TOPIC_SCORE) {
        updateScore(message.message.playerId, message.message.points);
      }
    });
    
    // Opruimen bij unmount
    return () => {
      mqttClient.disconnect();
    };
  }, []);
  
  // Event listeners voor toetsenbordinvoer
  useEffect(() => {
    // Handler voor toets indrukken
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'z' || e.key === 'Z') {
        leftFlipperActiveRef.current = true;  // Activeer linker flipper
      } else if (e.key === 'm' || e.key === 'M') {
        rightFlipperActiveRef.current = true;  // Activeer rechter flipper
      } else if (e.key === ' ' && !gameState.isPlaying) {
        startGame();  // Start het spel als spatie wordt ingedrukt en het spel niet al actief is
      }
    };
    
    // Handler voor toets loslaten
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'z' || e.key === 'Z') {
        leftFlipperActiveRef.current = false;  // Deactiveer linker flipper
      } else if (e.key === 'm' || e.key === 'M') {
        rightFlipperActiveRef.current = false;  // Deactiveer rechter flipper
      }
    };

    // Event listeners toevoegen
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  
    // Event listeners verwijderen bij unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); 
  
  // De hoofdgame loop die elke frame wordt uitgevoerd
  const gameLoop = (time: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = time;
    }
    
    // Bereken de verstreken tijd sinds de laatste frame
    const deltaTime = (time - lastTimeRef.current) / 16; // Normaliseren naar 60fps
    lastTimeRef.current = time;
    
    // Update de spelstatus alleen als het spel actief is
    if (gameState.isPlaying) {
      updateGame(deltaTime);
    }
    
    // Altijd het spel renderen, ook als het niet actief is
    renderGame();
    
    // Volgende frame aanvragen
    requestRef.current = requestAnimationFrame(gameLoop);
  };
  
  // Start de game loop wanneer de component wordt gemount
  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState.isPlaying]);
  
  /**
   * Update de spelstatus voor de huidige frame
   * @param deltaTime Tijd verstreken sinds laatste frame (genormaliseerd)
   */
  const updateGame = (deltaTime: number) => {
    const ball = ballRef.current;
    const leftFlipper = leftFlipperRef.current;
    const rightFlipper = rightFlipperRef.current;
    
    // Update de flipper status op basis van invoer
    if (leftFlipperActiveRef.current) {
      leftFlipper.activate(deltaTime);  // Beweeg de linker flipper omhoog
    } else {
      leftFlipper.deactivate(deltaTime);  // Beweeg de linker flipper terug
    }
    
    if (rightFlipperActiveRef.current) {
      rightFlipper.activate(deltaTime);  // Beweeg de rechter flipper omhoog
    } else {
      rightFlipper.deactivate(deltaTime);  // Beweeg de rechter flipper terug
    }
    
    // Controleer op botsingen
    checkFlipperCollisions(ball);     // Botsingen met flippers
    checkBumperCollisions(ball);      // Botsingen met bumpers
    checkPointTriggerCollisions(ball); // Botsingen met punt triggers
    
    // Update de balpositie op basis van fysica
    ball.update(deltaTime, GRAVITY, FRICTION);
    
    // Controleer op botsingen met muren
    checkWallCollisions(ball);
    
    // Controleer of de bal is verloren (onder het speelveld)
    if (ball.position.y > GAME_HEIGHT + ball.radius) {
      handleBallLost();
    }
  };
  
  /**
   * Controleer en verwerk botsingen met de wanden van het speelveld
   */
  const checkWallCollisions = (ball: Ball) => {
    const { position, velocity, radius } = ball;
    
    // Linker wand
    if (position.x - radius < 0) {
      position.x = radius;  // Plaats de bal op de rand
      ball.setVelocity(calculateReflection(velocity, { x: 1, y: 0 }));  // Reflecteer horizontaal
    } 
    // Rechter wand
    else if (position.x + radius > GAME_WIDTH) {
      position.x = GAME_WIDTH - radius;  // Plaats de bal op de rand
      ball.setVelocity(calculateReflection(velocity, { x: -1, y: 0 }));  // Reflecteer horizontaal
    }
    
    // Bovenkant
    if (position.y - radius < 0) {
      position.y = radius;  // Plaats de bal op de rand
      ball.setVelocity(calculateReflection(velocity, { x: 0, y: 1 }));  // Reflecteer verticaal
    }
    // Geen botsingscontrole voor de onderkant - bal kan daar verloren gaan
  };
  
  /**
   * Controleer en verwerk botsingen met bumpers
   */
  const checkBumperCollisions = (ball: Ball) => {
    const bumpers = bumpersRef.current;
    
    for (const bumper of bumpers) {
      // Controleer of er een botsing is tussen de bal en de bumper
      if (checkCircleCollision(
        ball.position,
        ball.radius,
        bumper.position,
        bumper.radius
      )) {
        // Bereken de normale vector van de botsing
        const normal = getCircleCollisionNormal(ball.position, bumper.position);
        
        // Reflecteer de snelheid van de bal
        ball.setVelocity(calculateReflection(ball.velocity, normal));
        
        // Voeg punten toe voor het raken van de bumper
        addPoints(bumper.getPoints());
        
        // Publiceer de botsing via MQTT
        mqttClient.publish(MQTT_TOPIC_BUMPER_HIT, {
          bumperId: bumpers.indexOf(bumper),
          points: bumper.getPoints()
        });
      }
    }
  };
  
  /**
   * Controleer en verwerk botsingen met punt triggers
   */
  const checkPointTriggerCollisions = (ball: Ball) => {
    const pointTriggers = pointTriggersRef.current;
    
    for (const trigger of pointTriggers) {
      // Controleer of er een botsing is tussen de bal en de trigger
      if (checkRectCollision(
        ball.position,
        ball.radius,
        trigger.position,
        trigger.width,
        trigger.height
      )) {
        // Voeg punten toe voor het passeren van de trigger
        addPoints(trigger.getPoints());
        
        // Publiceer de punten via MQTT
        mqttClient.publish(MQTT_TOPIC_SCORE, {
          playerId: gameState.currentPlayer,
          points: trigger.getPoints()
        });
      }
    }
  };

  /**
   * Creëer een rechthoek die een flipper representeert voor botsingsdetectie
   */
  const createFlipperRectangle = (flipper: Flipper) => {
    const endpoints = flipper.getEndpoints();
    const angle = flipper.angle;
    const width = flipper.length;
    const height = flipper.width * 2;
    
    return {
      position: endpoints.start,
      width,
      height,
      angle
    };
  };

  /**
   * Controleer op botsing tussen een rechthoek en een cirkel
   * Houdt rekening met rotatie van de rechthoek
   */
  const rectCircleCollision = (
    rect: { position: Position; width: number; height: number; angle: number },
    circlePos: Position,
    circleRadius: number
  ) => {
    // Vertaal de cirkel naar het coördinatensysteem van de rechthoek
    const translatedX = circlePos.x - rect.position.x;
    const translatedY = circlePos.y - rect.position.y;
    
    // Roteer de cirkel om de oorsprong van het coördinatensysteem van de rechthoek
    const rotatedX = translatedX * Math.cos(-rect.angle) - translatedY * Math.sin(-rect.angle);
    const rotatedY = translatedX * Math.sin(-rect.angle) + translatedY * Math.cos(-rect.angle);
    
    // Vind het dichtstbijzijnde punt op de rechthoek tot de cirkel
    const closestX = Math.max(0, Math.min(rotatedX, rect.width));
    const closestY = Math.max(-rect.height/2, Math.min(rotatedY, rect.height/2));
    
    // Bereken de afstand tussen dit punt en het middelpunt van de cirkel
    const distanceX = rotatedX - closestX;
    const distanceY = rotatedY - closestY;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    
    // Er is een botsing als de afstand kleiner is dan de straal van de cirkel
    return distanceSquared <= (circleRadius * circleRadius);
  };
  
  /**
   * Controleer en verwerk botsingen met flippers
   */
  const checkFlipperCollisions = (ball: Ball) => {
    const leftFlipper = leftFlipperRef.current;
    const rightFlipper = rightFlipperRef.current;
    
    // Maak rechthoeken die de flippers representeren
    const leftRect = createFlipperRectangle(leftFlipper);
    const rightRect = createFlipperRectangle(rightFlipper);
    
    // Controleer botsing met linker flipper
    if (rectCircleCollision(leftRect, ball.position, ball.radius)) {
      // Bereken de normaalvector op basis van de hoek van de flipper
      const normal = {
        x: Math.sin(leftFlipper.angle),
        y: -Math.cos(leftFlipper.angle)
      };
      
      // Extra snelheid als de flipper actief is
      const flipperSpeed = leftFlipperActiveRef.current ? 10 : 0;
      const restitution = 1.2;  // Vermenigvuldigingsfactor voor de snelheid na botsing
      
      // Bereken de nieuwe snelheid van de bal
      const speed = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y);
      const newVelocity = {
        x: -ball.velocity.x * restitution + flipperSpeed * Math.cos(leftFlipper.angle),
        y: -ball.velocity.y * restitution + flipperSpeed * Math.sin(leftFlipper.angle)
      };
      
      // Verplaats de bal een beetje weg van de flipper om vastzitten te voorkomen
      ball.position.x += normal.x * 2;
      ball.position.y += normal.y * 2;
      
      // Pas de nieuwe snelheid toe
      ball.setVelocity(newVelocity);
    }
    
    // Controleer botsing met rechter flipper (vergelijkbare logica)
    if (rectCircleCollision(rightRect, ball.position, ball.radius)) {
      const normal = {
        x: Math.sin(rightFlipper.angle),
        y: -Math.cos(rightFlipper.angle)
      };
      
      const flipperSpeed = rightFlipperActiveRef.current ? 10 : 0;
      const restitution = 1.2; 
      
      const newVelocity = {
        x: -ball.velocity.x * restitution + flipperSpeed * Math.cos(rightFlipper.angle),
        y: -ball.velocity.y * restitution + flipperSpeed * Math.sin(rightFlipper.angle)
      };
      
      ball.position.x += normal.x * 2;
      ball.position.y += normal.y * 2;
      
      ball.setVelocity(newVelocity);
    }
  };
  
  /**
   * Render het hele spel op het canvas
   */
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Maak het canvas leeg
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Teken de achtergrond
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Teken de randen van het speelveld
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Teken de bumpers
    const bumpers = bumpersRef.current;
    ctx.fillStyle = '#FF5722';  // Oranje kleur voor bumpers
    for (const bumper of bumpers) {
      ctx.beginPath();
      ctx.arc(bumper.position.x, bumper.position.y, bumper.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Teken de punt triggers
    const pointTriggers = pointTriggersRef.current;
    ctx.fillStyle = '#4CAF50';  // Groene kleur voor punt triggers
    for (const trigger of pointTriggers) {
      ctx.fillRect(
        trigger.position.x,
        trigger.position.y,
        trigger.width,
        trigger.height
      );
    }
    
    // Teken de flippers
    ctx.fillStyle = '#2196F3';  // Blauwe kleur voor flippers
    
    // Linker flipper
    const leftFlipper = leftFlipperRef.current;
    const leftEndpoints = leftFlipper.getEndpoints();
    ctx.save();
    ctx.translate(leftEndpoints.start.x, leftEndpoints.start.y);
    ctx.rotate(leftFlipper.angle);
    ctx.fillRect(0, -leftFlipper.width, leftFlipper.length, leftFlipper.width * 2); 
    ctx.restore();
    
    // Rechter flipper
    const rightFlipper = rightFlipperRef.current;
    const rightEndpoints = rightFlipper.getEndpoints();
    ctx.save();
    ctx.translate(rightEndpoints.start.x, rightEndpoints.start.y);
    ctx.rotate(rightFlipper.angle);
    ctx.fillRect(0, -rightFlipper.width, rightFlipper.length, rightFlipper.width * 2); 
    ctx.restore();
    
    // Teken de bal
    const ball = ballRef.current;
    ctx.fillStyle = '#FFC107';  // Gele kleur voor de bal
    ctx.beginPath();
    ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Toon instructies als het spel niet actief is
    if (!gameState.isPlaying) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';  // Semi-transparante zwarte overlay
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FFF';  // Witte tekst
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Druk op SPATIE om de bal te lanceren', canvas.width / 2, canvas.height / 2);
      ctx.fillText('Z - Linkerflipper, M - Rechterflipper', canvas.width / 2, canvas.height / 2 + 30);
    }
  };
  
  /**
   * Start een nieuw spel door de bal te resetten en het spel actief te maken
   */
  const startGame = () => {
    // Reset de bal met een willekeurige horizontale snelheid
    ballRef.current.reset(
      { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 100 },  // Startpositie
      { x: (Math.random() - 0.5) * 5, y: -10 }     // Startsnelheid (licht willekeurig horizontaal, omhoog)
    );
    
    // Update de spelstatus
    setGameState(prev => ({
      ...prev,
      isPlaying: true
    }));
  };
  
  /**
   * Verwerk het verlies van een bal
   */
  const handleBallLost = () => {
    setGameState(prev => {
      // Verminder het aantal resterende ballen
      const newBallsRemaining = prev.ballsRemaining - 1;
      
      // Als er geen ballen meer over zijn
      if (newBallsRemaining <= 0) {
        // Ga naar de volgende speler
        const nextPlayer = prev.currentPlayer % prev.players.length + 1;
        
        return {
          ...prev,
          currentPlayer: nextPlayer,
          ballsRemaining: 3,        // Reset het aantal ballen
          isPlaying: false          // Stop het spel
        };
      }
      
      // Als er nog ballen over zijn
      return {
        ...prev,
        ballsRemaining: newBallsRemaining,
        isPlaying: false            // Stop het spel, wacht op spatie om te herstarten
      };
    });
  };
  
  /**
   * Voeg punten toe aan de huidige speler
   */
  const addPoints = (points: number) => {
    setGameState(prev => {
      // Kopieer de spelerlijst om te wijzigen
      const updatedPlayers = [...prev.players];
      const playerIndex = prev.currentPlayer - 1;
      
      // Update de score van de huidige speler
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        score: updatedPlayers[playerIndex].score + points
      };
      
      // Update de high score indien nodig
      const newHighScore = Math.max(
        prev.highScore,
        updatedPlayers[playerIndex].score
      );
      
      return {
        ...prev,
        players: updatedPlayers,
        highScore: newHighScore
      };
    });
  };
  
  /**
   * Update de score voor een specifieke speler (gebruikt voor MQTT berichten)
   */
  const updateScore = (playerId: number, points: number) => {
    // Controleer of de speler-id geldig is
    if (playerId < 1 || playerId > gameState.players.length) return;
    
    setGameState(prev => {
      // Kopieer de spelerlijst om te wijzigen
      const updatedPlayers = [...prev.players];
      const playerIndex = playerId - 1;
      
      // Update de score van de speler
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        score: updatedPlayers[playerIndex].score + points
      };
      
      // Update de high score indien nodig
      const newHighScore = Math.max(
        prev.highScore,
        updatedPlayers[playerIndex].score
      );
      
      return {
        ...prev,
        players: updatedPlayers,
        highScore: newHighScore
      };
    });
  };
  
  // Render de componenten
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      {/* Score panel bovenaan */}
      <div className="mb-4">
        <ScorePanel 
          players={gameState.players}
          currentPlayer={gameState.currentPlayer}
          highScore={gameState.highScore}
          ballsRemaining={gameState.ballsRemaining}
          mqttConnected={mqttConnected}
        />
      </div>
      
      {/* Canvas voor de flipperkast */}
      <div className="relative border-4 border-gray-700 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="bg-gray-800"
        />
      </div>
      
      {/* Besturings- en statusinformatie onderaan */}
      <div className="mt-4 text-white text-center">
        <p>Besturing: Z - Linker flipper, M - Rechter flipper, SPATIE - Lanceer bal</p>
        <p className="mt-2">
          MQTT Status: {mqttConnected ? (
            <span className="text-green-500">Connected</span>
          ) : (
            <span className="text-red-500">Disconnected</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default PinballGame;