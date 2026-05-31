/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { EffectsProvider } from './components/EffectsOverlay';
import { StarfieldBackground } from './components/StarfieldBackground';
import { StartScreen } from './components/StartScreen/StartScreen';
import { GameplayArena } from './components/Gameplay/GameplayArena';
import { StandingsArena } from './components/Gameplay/StandingsArena';

const AppContent: React.FC = () => {
  const { state } = useGame();

  return (
    <div className="relative w-full h-full min-h-screen text-slate-100 overflow-hidden font-sans">
      
      {/* 1. Procedural deep-space background backdrop */}
      <StarfieldBackground />

      {/* 2. Responsive UI router layers */}
      {state.gameEnded ? (
        <StandingsArena />
      ) : state.teams.length > 0 ? (
        <GameplayArena />
      ) : (
        <StartScreen onStartSession={() => {}} />
      )}

    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <EffectsProvider>
        <AppContent />
      </EffectsProvider>
    </GameProvider>
  );
}
