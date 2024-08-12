import React, { createContext, useState, useMemo } from 'react';

export const PlayerContext = createContext(null);

export function PlayerContextProvider({ children }) {
  const [playerPosition, setPlayerPosition] = useState(null);
  const [controlCamera, setControlCamera] = useState(true);

  const playerContextProviderValue = useMemo(
    () => ({
      playerPosition,
      setPlayerPosition,
      controlCamera,
      setControlCamera,
    }),
    [playerPosition, setPlayerPosition, controlCamera, setControlCamera],
  );

  return (
    <PlayerContext.Provider value={playerContextProviderValue}>{children}</PlayerContext.Provider>
  );
}
