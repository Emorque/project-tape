'use client'

import { Canvas } from "@react-three/fiber";
import { CameraControls, Html} from '@react-three/drei';
import Link from 'next/link'
import { Room } from "./components/Room"
import { Game } from "./components/Game"
import "./page.css";
import { useCallback, useEffect, useRef, useState } from 'react';

import { createClient } from '@/utils/supabase/client'

type songType = {
  mapper_metadata: object,
  song_id: string,
  song_metadata: object
}[];

type sMap = [number,string][]

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
  focusProp: (newFocus : [number,number,number,number,number,number], songId : string) => void;
  songId: string
}

function SongSelect({focusProp, songId} : SongSelectProps) {
  const setCustomSong = () => {
    focusProp([15,20,0, 20, 15, 0], songId)
  }

  return (
    <div>
      <div>
        <button onClick={setCustomSong}>Set Custom Song: ${songId}</button>
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

  const [loading, setLoading] = useState<boolean>(false);
  const [songs, setSongs] = useState<songType>([])

  const[selectedSong, setSelectedSong] = useState<string | null>(null)
  const[gameMap, setGameMap] = useState<sMap | null>(null)
  // Supabase:
  const supabase = createClient()

  const handlePlay = () => {
    if (selectedSong) {
      setSongPlaying(true);
      setStartVisible(false);          
      getMap(selectedSong);
    }
    else {
      alert('no song selected')
    }
  }

  const getMap = useCallback(async (selectedSong : string) => {
    console.log("called Supabase for Map", loading)
    try {
      const { data: songMap, error, status } = await supabase
      .from('songs')
      .select('song_map')
      .eq('song_id', selectedSong)
      .single()

      if (error && status !== 406) {
        console.log(error)
        throw error
      }

      if (songMap) {
        setGameMap(songMap.song_map)
      }
    } catch (error) {
      console.error('User error:', error) // Only used for eslint
      alert('Error loading user data!')
    } finally {
      console.log('loaded', gameMap)
    }
  }, [])

  const getSongs  = useCallback(async () => {
    console.log("called Supabase for Songs")
    try {
      setLoading(true)

      const { data: songs, error, status } = await supabase
      .from('songs')
      .select('song_id, song_metadata, mapper_metadata')

      if (error && status !== 406) {
        console.log(error)
        throw error
      }

      if (songs) {
        setSongs(songs)
      }
    } catch (error) {
      console.error('User error:', error) // Only used for eslint
      alert('Error loading user data!')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    getSongs()
  }, [getSongs])

  useEffect(() =>{
    console.log(songs)
  }, [songs])

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

  const handleNewFocus = (newFocus: [number,number,number,number,number,number], songId: string) => { 
    setFocusPoint(newFocus) 
    setStartVisible(true)
    setSelectedSong(songId);
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
            <div>
              <p>Songs</p>
              {songs.map((song) => (
                <div key={song.song_id}>
                  <SongSelect focusProp={handleNewFocus} songId={song.song_id}/>
                </div>
              ))}
            </div>
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
          setFocusPoint([10,25,10, 10, 25, -12]);
          setPlayerView(true);
          setStartVisible(false);
          
          }}>Editor
        </button>
        <button onClick={() => {
          setFocusPoint([15,25,10, 20, 25, 10]);
          setPlayerView(true);
          setStartVisible(false);
          }}>Player
        </button>
      </div>
      <div id="startScreen" style={startScreenStyle}>
        <button onClick={handlePlay}>Play Song</button>
      </div>
      <div id="songScreen" style={stageStyle}>
        {selectedSong && gameMap &&
        <Game gMap={gameMap}/>
        }
        
      </div>
    </div>
  );
}
