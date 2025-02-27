'use client'

import { Canvas } from "@react-three/fiber";
import { CameraControls, Html } from '@react-three/drei';
import Link from 'next/link'
import { PSRoom } from "./components/Project-tape-scene"
import { Tape } from "./components/tape";
import "./page.css";
import { useCallback, useEffect, useRef, useState } from 'react';

import { songType, sMap } from "@/utils/helperTypes"

import { createClient } from '@/utils/supabase/client'

interface SongSelectProps {
  focusProp: (newFocus : [number,number,number,number,number,number], songId : string) => void;
  songId: string
}

function SongSelect({focusProp, songId} : SongSelectProps) {
  const setCustomSong = () => {
    focusProp([14,8,34,   14,7,26], songId)
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
  const cameraRef = useRef<CameraControls | null>(null);
  const [playerView, setPlayerView] = useState<boolean>(false);
  const [songPlaying, setSongPlaying] = useState<boolean>(false)
  const [startVisible, setStartVisible] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [songs, setSongs] = useState<songType>([])

  const[selectedSong, setSelectedSong] = useState<string | null>(null)
  const[gameMap, setGameMap] = useState<sMap | null>(null)

  const supabase = createClient()

  const handleGameMap = (currentSong : string | null) => { 
    setSelectedSong(currentSong); 
    setSongPlaying(false) 
    setGameMap(null);
  }

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
    updateCamera(newFocus)
    setStartVisible(true)
    setSelectedSong(songId);
  }

  // Remove mouse controls with camera
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.mouseButtons = {left: 0, middle: 0, right: 0, wheel: 0}
      cameraRef.current.touches={ one: 0, three: 0, two: 0 }
    }
  })

  const updateCamera = (newFocus: [number,number,number,number,number,number],) => {
    cameraRef.current?.setLookAt(newFocus[0], newFocus[1], newFocus[2], newFocus[3], newFocus[4], newFocus[5], true);
  }

  return (
    <div id="canvasContainer">
      <Canvas id="canvas_id" camera={{ position: [36,4,40]}}>
        <pointLight color={'#ffd1b7'} position={[7,13,34]} intensity={200}/>
        <pointLight color={'#ffd1b7'} position={[34,13,34]} intensity={200}/>
        <PSRoom/>
        <Html 
        className="songHTML"
          position={[14,12,23]}
          transform
          occlude
          rotation={[Math.PI / 7, 0, 0]}
        >
          <div className="htmlDiv" style={databaseStyle}>
            <div>
              <p>Songs</p>
              {songs.map((song) => (
                <div key={song.song_id}>
                  <SongSelect focusProp={handleNewFocus} songId={song.song_id}/>
                </div>
              ))}
              {/* <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p>
              <p>Songs</p> */}
            </div>
          </div>
        </Html>

        <Html 
        className="editorHTML"
          position={[-1.5,7.8,34.73]}
          transform
          occlude
          rotation={[0, Math.PI /2, 0]}
        >
          <div className="htmlDiv" style={databaseStyle}>
            <Link href="/editor">Visit Editor</Link>
          </div>
        </Html>
        <CameraControls 
          ref={cameraRef}
          enabled={true}    
        />
      </Canvas>
      <div id='menuOptions'>
        <button onClick={() => {
          // setFocusPoint([18,2,20.5, -18, 5, 10]); //Way too large, ends up creating curves for setLookAt to adjust 
          updateCamera([36,4,40,   32,4,38])
          setPlayerView(false)
          setStartVisible(false);
          }}>Start</button>
        <button onClick={() => {
          updateCamera([4,8,34.5,   -1,7,34.5]);
          setPlayerView(true);
          setStartVisible(false);
          }}>Editor
        </button>
        <button onClick={() => {
          updateCamera([14,8,34,   14,11,26]);
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
        // <Game gMap={gameMap}/>
        <Tape gMap={gameMap} gameMapProp={handleGameMap}/>
        }
      </div>
    </div>
  );
}
