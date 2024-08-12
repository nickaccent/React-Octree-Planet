import { KeyboardControls } from '@react-three/drei';
import Experience from './Components/Experience';
import { GameContextProvider } from './Contexts/Game';
import { PlayerContextProvider } from './Contexts/Player';

function App() {
  const controls = [
    { name: 'up', keys: ['ArrowUp', 'KeyW'] },
    { name: 'down', keys: ['ArrowDown', 'KeyS'] },
    { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
    { name: 'right', keys: ['ArrowRight', 'KeyD'] },
    { name: 'back', keys: ['Comma'] },
    { name: 'forward', keys: ['Period'] },
    { name: 'cameraChange', keys: ['KeyC'] },
  ];

  return (
    <>
      <GameContextProvider>
        <PlayerContextProvider>
          <KeyboardControls map={controls}>
            <Experience />
          </KeyboardControls>
        </PlayerContextProvider>
      </GameContextProvider>
    </>
  );
}

export default App;
