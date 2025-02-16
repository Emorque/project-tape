'use client'

import { Canvas } from "@react-three/fiber";
import { CameraControls, Html} from '@react-three/drei';
import Link from 'next/link'
import { Room } from "./components/Room"
import { Game } from "./components/Game"
import "./page.css";
import { useEffect, useRef, useState } from 'react';

interface CameraControlsProp {
  focus : [number,number,number, number,number,number]
  cameraRef: React.RefObject<CameraControls>
}

function CameraController({focus, cameraRef} : CameraControlsProp) {
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.mouseButtons = {left: 0, middle: 0, right: 0, wheel: 0}
      cameraRef.current.touches={ one: 0, three: 0, two: 0 }
      cameraRef.current.setLookAt(focus[0], focus[1], focus[2], focus[3], focus[4], focus[5], true);
    }
  }, [cameraRef, focus]);

  return (<CameraControls
    enabled={true}
    ref={cameraRef}
  />)
}

interface SongSelectProps {
  focusProp: (newFocus : [number,number,number,number,number,number]) => void;
}

function SongSelect({focusProp} : SongSelectProps) {
  const setCustomSong = () => {
    focusProp([15,20,0, 20, 15, 0])
  }

  return (
    <div>
      <div>
        <button onClick={setCustomSong}>Set Custom Song</button>
      </div>
    </div>
  )
}


export default function Home() {
  const cameraControlsRef = useRef<CameraControls>(null);
  const [focusPoint, setFocusPoint] = useState<[number, number, number, number, number, number]>([-20,30,30, 15, 10, 0])
  const [playerView, setPlayerView] = useState<boolean>(false);
  const [songPlaying, setSongPlaying] = useState<boolean>(false)
  const [startVisible, setStartVisible] = useState<boolean>(false);

  const databaseStyle = {
    opacity: playerView ? 1 : 0, 
    visibility: playerView ? "visible" : "hidden",
    transition: 'opacity 2s ease, visibility 2s' 
  } as React.CSSProperties;
  
  const stageStyle = {
    opacity: songPlaying ? 1 : 0, 
    visibility: songPlaying ? "visible" : "hidden",
    transition: 'opacity 2s ease, visibility 2s'
  } as React.CSSProperties;
  
  const startScreenStyle = {
    opacity: startVisible ? 1 : 0,
    visibility: startVisible ? "visible" : "hidden",
    transition: 'opacity 2s ease, visibility 2s'
  } as React.CSSProperties;

  const handleNewFocus = (newFocus: [number,number,number,number,number,number]) => { 
    setFocusPoint(newFocus) 
    setStartVisible(true)
  }

  return (
    <div id="canvasContainer">
      <Canvas>
        <ambientLight intensity={2} />
        <Room/>
        <Html 
        className="content"
          position={[30, 25, 10]}
          transform
          occlude
          rotation={[0, -Math.PI / 2, 0]}
        >
          <div className="annotation" style={databaseStyle}>
            <SongSelect focusProp={handleNewFocus}/>
          </div>
        </Html>

        <Html 
        className="content"
          position={[10, 25, -12]}
          transform
          occlude
          // rotation={[0, -Math.PI / 2, 0]}
        >
          <div className="annotation" style={databaseStyle}>
            {/* <Link></Link> */}
            <Link href="/editor">Visit Editor</Link>
          </div>
        </Html>
        <CameraController focus={focusPoint} cameraRef={cameraControlsRef}/>
      </Canvas>
      <div id='menuOptions'>
        <button onClick={() => {
          setFocusPoint([-20,30,30, 15, 10, 0]);
          setPlayerView(false)
          setStartVisible(false);
          }}>Start</button>
        <button onClick={() => {
          setFocusPoint([15,25,10, 20, 25, 10]);
          setPlayerView(true);
          setStartVisible(false);
          }}>Player
        </button>
        <button onClick={() => {
          setFocusPoint([10,25,10, 10, 25, -12]);
          setPlayerView(true);
          setStartVisible(false);
          
          }}>Editor
        </button>
      </div>
      <div id="startScreen" style={startScreenStyle}>
        <button onClick={() => {
          setSongPlaying(true);
          setStartVisible(false);          
          }}>Play Song</button>
      </div>
      <div id="songScreen" style={stageStyle}>
          <Game/>
          {/* <iframe   width={300}  height={200} src="https://emorque.github.io/testing_meyda/"></iframe> */}
      </div>
    </div>
  );
}
