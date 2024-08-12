import React, { createContext, useState, useMemo, useRef, useEffect } from 'react';
import TaskQueue from '../Utilities/TaskQueue';

export const GameContext = createContext(null);

export function GameContextProvider({ children }) {
  const [gameState, setGameState] = useState('start');
  const workersPool = useRef([]);
  const taskQueueRef = useRef(new TaskQueue(8)); // Initialize with desired worker count
  const [distanceToPlanets, setDistanceToPlanets] = useState([]);

  const gameContextProviderValue = useMemo(
    () => ({
      gameState,
      setGameState,
      taskQueue: taskQueueRef.current,
      distanceToPlanets,
      setDistanceToPlanets,
    }),
    [gameState, setGameState, distanceToPlanets, taskQueueRef.current, setDistanceToPlanets],
  );

  useEffect(() => {
    // Initialize workers
    workersPool.current = taskQueueRef.current.workerPool;
  }, []);

  return <GameContext.Provider value={gameContextProviderValue}>{children}</GameContext.Provider>;
}
