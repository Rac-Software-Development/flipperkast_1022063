import React from 'react';
import { PlayerScore } from '../types';
import { Trophy } from 'lucide-react';

interface ScorePanelProps {
  players: PlayerScore[];
  currentPlayer: number;
  highScore: number;
  ballsRemaining: number;
  mqttConnected: boolean;
}

const ScorePanel: React.FC<ScorePanelProps> = ({
  players,
  currentPlayer,
  highScore,
  ballsRemaining,
  mqttConnected
}) => {
  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg w-full max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Flipperkast</h2>
        <div className="flex items-center">
          <Trophy className="text-yellow-400 mr-2" size={20} />
          <span className="font-bold">{highScore}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4 mb-4">
        {players.map(player => (
          <div 
            key={player.id}
            className={`p-2 rounded ${
              player.id === currentPlayer 
                ? 'bg-blue-600' 
                : 'bg-gray-700'
            }`}
          >
            <div className="text-sm">{player.name}</div>
            <div className="text-xl font-bold">{player.score}</div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <span className="mr-2">Ballen:</span>
          {[...Array(ballsRemaining)].map((_, i) => (
            <span key={i} className="inline-block w-4 h-4 bg-yellow-400 rounded-full mr-1"></span>
          ))}
        </div>
        
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            mqttConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm">
            {mqttConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScorePanel;