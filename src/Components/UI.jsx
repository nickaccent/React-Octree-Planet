import React, { useContext, useEffect, useState } from 'react';
import { GameContext } from '../Contexts/Game';

const UI = () => {
  const { gameState, setGameState } = useContext(GameContext);
  const [loadingSlide, setLoadingSlide] = useState(true);

  useEffect(() => {
    setLoadingSlide(true);
    if (gameState !== 'loading') {
      const timeout = setTimeout(() => {
        setLoadingSlide(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [gameState]);

  return (
    <>
      <div
        className={`fixed z-30 top-0 left-0 right-0 h-screen bg-accent flex flex-col items-center justify-center gap-1 text-5xl pointer-events-none transition-transform duration-500
      ${loadingSlide ? '' : 'translate-x-[100%]'}
      `}
      >
        {gameState == 'menu' ? '' : ''}
        LOD Planet Loading!
      </div>
    </>
  );
};

export default UI;
