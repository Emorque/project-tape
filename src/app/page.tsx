'use client'

import { Canvas } from "@react-three/fiber";
import { CameraControls, Html } from '@react-three/drei';
import Link from 'next/link'
import { PSRoom } from "./components/Project-tape-scene"
import { Tape } from "./components/tape";
import "./page.css";
import { useCallback, useRef, useState } from 'react';

import { sMap } from "@/utils/helperTypes"

import { createClient } from '@/utils/supabase/client'
import { SongHtml } from "./components/songHtml";

export default function Home() {
  const cameraRef = useRef<CameraControls | null>(null);
  const [playerView, setPlayerView] = useState<boolean>(false);
  const [songPlaying, setSongPlaying] = useState<boolean>(false)

  const[selectedSong, setSelectedSong] = useState<string | null>(null)
  const[songLink, setSongLink] = useState<string | null>(null)
  const[gameMap, setGameMap] = useState<sMap | null>(null)

  const supabase = createClient()

  const handleGameMap = (currentSong : string | null) => { 
    setSelectedSong(currentSong); 
    setSongPlaying(false) 
    setGameMap(null);
  }

  const getMap = useCallback(async (selectedSong : string) => {
    console.log("called Supabase for Map")
    try {
      const { data: songMap, error, status } = await supabase
      .from('songs')
      .select('song_map, song_link')
      .eq('song_id', selectedSong)
      .single()

      if (error && status !== 406) {
        console.log(error)
        throw error
      }

      if (songMap) {
        console.log("hefuisfhbuirfbui")
        console.log("fefa", songMap.song_map)
        setGameMap(songMap.song_map)
        setSongLink(songMap.song_link)
      }
    } catch (error) {
      console.error('User error:', error) // Only used for eslint
      alert('Error loading user data!')
    } finally {
      console.log('loaded gameMap')
    }
  }, [supabase])

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

  const updateCamera = (newFocus: [number,number,number,number,number,number],) => {
    cameraRef.current?.setLookAt(newFocus[0], newFocus[1], newFocus[2], newFocus[3], newFocus[4], newFocus[5], true);
  }

  const handleSelectedSong = (songID: string) => {
    updateCamera([14,8,34,   14, 7, 26])
    setSelectedSong(songID); 
    setSongPlaying(true);
    getMap(songID);
  }
  
  // useEffect(() => {
  //   updateCamera([36,4,40,   32,4,38])
  // }, [])

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
          rotation={[0, 0, 0]}
        >
          <div className="htmlDiv" style={databaseStyle}>
            <SongHtml songToPlay={handleSelectedSong}/>
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
          touches={{one: 0, two: 0, three: 0}} //Both removes touch/mouse controls. Needed to get scroll on HTML to work
          mouseButtons={{left: 0, right: 0, wheel: 0, middle: 0}}
        />
      </Canvas>
      <div id='menuOptions'>
        <button className="menuBtn" onClick={() => {
          updateCamera([36,4,40,   32,4,38])
          setPlayerView(false)
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
              <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
            </svg>
          </button>
        <button className="menuBtn" onClick={() => {
          updateCamera([4,8,34.5,   -1,7,34.5]);
          setPlayerView(true);
          }}><p>Computer</p>
        </button>
        <button className="menuBtn" onClick={() => {
          updateCamera([14,12,34,   14,12,26]);
          setPlayerView(true);
          }}><p>Songs</p>
        </button>
        <button className="menuBtn" onClick={() => {
          updateCamera([4,8,34.5,   -1,7,34.5]);
          setPlayerView(true);
          }}><p>Settings</p>
        </button>
      </div>
      

      <div id='main_menu'>
        <div>
          <h1>Project Tape</h1>
        </div>
        <button className="cas_btn" onClick={() => {
          updateCamera([14,12,34,   14,12,26]);
          setPlayerView(true);
          }}><p>PLay</p>
          <div className="cas_bottom">
          </div>
          <div className="cas_bar">
            <div className="cas_circle">
              <span className="cas_teeth"></span>
              <span className="cas_teeth"></span>
              <span className="cas_teeth"></span>
            </div>
            <div className="cas_circle">
              <span className="cas_teeth"></span>
              <span className="cas_teeth"></span>
              <span className="cas_teeth"></span>
            </div>
          </div>
        </button>

        <button className="menu_btn" onClick={() => {
          updateCamera([36,4,40,   32,4,38])
          setPlayerView(false)
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
              <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
            </svg>
          </button>

        <button className="menu_btn" onClick={() => {
          updateCamera([14,12,34,   14,12,26]);
          setPlayerView(true);
          }}><p>PLay</p>
        </button>

        <button className="menu_btn" onClick={() => {
          updateCamera([4,8,34.5,   -1,7,34.5]);
          setPlayerView(true);
          }}><p>Edit</p>
        </button>

        <button className="menu_btn" onClick={() => {
          updateCamera([4,8,34.5,   -1,7,34.5]);
          setPlayerView(true);
          }}><p>Settings</p>
        </button>

      </div>


      <div id="songScreen" style={stageStyle}>
        {selectedSong && gameMap && songPlaying && songLink && 
        <Tape gMap={gameMap} sLink={songLink} gameMapProp={handleGameMap}/>
        }
      </div>
    </div>
  );
}
