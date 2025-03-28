'use client'

import { Canvas } from "@react-three/fiber";
import { CameraControls, Html } from '@react-three/drei';
import Link from 'next/link'
import { PSRoom } from "./components/Project-tape-scene"
import { Tape } from "./components/tape";
import { Settings } from "./components/settings";
import "./page.css";
import { useCallback, useEffect, useRef, useState } from 'react';

import { sMap, settingsType } from "@/utils/helperTypes"

import { createClient } from '@/utils/supabase/client'
import { SongHtml } from "./components/songHtml";
import { type User } from '@supabase/supabase-js'


export default function Home() {
  const cameraRef = useRef<CameraControls | null>(null);
  const [playerView, setPlayerView] = useState<boolean>(false);
  const [songPlaying, setSongPlaying] = useState<boolean>(false)

  const[selectedSong, setSelectedSong] = useState<string | null>(null)
  const[gameMap, setGameMap] = useState<sMap | null>(null)
  const[menu, setMenu] = useState<string>("main_menu")
  const[userSettings, setUserSettings] = useState<settingsType | null>(null);
  const[settingsView, setSettingsView] = useState<boolean>(false);

  const [howtoView, setHowToView] = useState<boolean>(false);

  const [audioURL, setAudioURL] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioReady, setAudioReady] = useState<boolean>(false);

  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, } = await supabase.auth.getUser()
      setUser(user);
    };

    fetchUser();
  }, [supabase]);

  const handleGameMap = (currentSong : string | null) => { 
    setSelectedSong(currentSong);
    updateCamera([14,12,34,   14,12,26]); //Set back to Songs Div 
    setSongPlaying(false) 
    setGameMap(null);
  }

  const handleNewSettings = (newSettings: settingsType | null) => {
    setUserSettings(newSettings)
    // console.log(newSettings)
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
        // console.log("fefa", songMap.song_map)
        setGameMap(songMap.song_map)
        console.log(songMap.song_link)
        // setAudioURL(songMap.song_link);
        // downloadAudio()
        try {
          const {data : songFile, error : songFileError} = await supabase.storage.from("songs").download(songMap.song_link)
          if (songFileError) {
            throw songFileError
          } 
          const url = URL.createObjectURL(songFile)
          setAudioURL(url)
        }
        catch (error) {
          console.log("Error downloading Audio", error)
        }
      }
    } catch (error) {
      console.error('User error:', error) // Only used for eslint
      alert('Error loading user data!')
    } finally {
      console.log('loaded game_map and audio')
    }
  }, [supabase])

  useEffect(() => {
      const localSettings = localStorage.getItem("settings")
      let updateSettings : settingsType 
      if (!localSettings) {
        console.log("No Local Settings")
        updateSettings = {
            lLane: "J",
            rLane: "L",
            lTurn: "A",
            rTurn: "D",

            pause: "Q",
            restart: "P",

            scrollSpd: 1500,

            gpVolume: 1,
            hsVolume: 1,

            offset: 0
        }
      }
      else{
        updateSettings = JSON.parse(localSettings);
      }
      
      // Come back to fix in case some users delete/rename keys
      setUserSettings(updateSettings)
      localStorage.setItem("settings", JSON.stringify(updateSettings))

  }, [])

  const databaseStyle = {
    opacity: playerView ? 1 : 0, 
    visibility: playerView ? "visible" : "hidden",
    transition: 'opacity 1s ease, visibility 1s' 
  } as React.CSSProperties;
  
  const stageStyle = {
    opacity: songPlaying ? 1 : 0, 
    visibility: songPlaying ? "visible" : "hidden",
    transition: 'opacity 1s ease, visibility 1s'
  } as React.CSSProperties;

  const settingsStyle = {
    visibility: (menu === "settings_menu")? "visible" : "hidden",
    left: (menu === "settings_menu")? "0%" : "-100%",
    transition: 'left 1s ease, visibility 1s'
  } as React.CSSProperties

  const how_toStyle = {
    visibility: (menu === "how_to_menu")? "visible" : "hidden",
    left: (menu === "how_to_menu")? "0%" : "-100%",
    transition: 'left 1s ease, visibility 1s'
  } as React.CSSProperties

  const updateCamera = (newFocus: [number,number,number,number,number,number],) => {
    cameraRef.current?.setLookAt(newFocus[0], newFocus[1], newFocus[2], newFocus[3], newFocus[4], newFocus[5], true);
  }

  const handleSelectedSong = (songID: string) => {
    updateCamera([14,8,34,   14, 7, 26])
    setSongPlaying(true);
    setSelectedSong(songID); 
    getMap(songID);
  }

  const handleSongReady = () => {
    // Song is ready
    console.log("Song is Ready")
    setAudioReady(true)
  }

  const handleSongError = () => {
    console.log("Error Loading Song")
    setAudioReady(false);
  } 

  // useEffect(() => {
  //   console.log("Audio is Ready: ", audioReady)
  // }, [audioReady])
  const [username, setUsername] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)

  const getProfile = useCallback(async () => {
      if (!user) return; // Error without this. Likely because it would query profiles with a null id without it
      try {
          // setProfileLoading(true)
        const { data, error, status } = await supabase
          .from('profiles')
          .select(`username, avatar_url`)
          .eq('id', user?.id)
          .single()
  
        if (error && status !== 406) {
          console.log(error)
          throw error
        }
  
        if (data) {
          setUsername(data.username)
          setAvatarUrl(data.avatar_url)
        }
      } catch (error) {
          console.log(error);
          console.log("Unsigned User");
      //   alert('Error loading user data!')
      } finally {
          console.log("User loaded")
          // setProfileLoading(false)
      }
    }, [user, supabase])
  
    useEffect(() => {
      getProfile()
    }, [user, getProfile])

  return (
    <div id="canvasContainer">
{/*       
      {!(loading) && 
      <div id="temp_play_btn">
        <button onClick={(() => {
              updateCamera([14,8,34,   14, 7, 26])
              setSongPlaying(true);
        })}>
          Play
        </button>
      </div>
      }
       */}
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
            <SongHtml songToPlay={handleSelectedSong} username={username} avatar_url={avatar_url}/>
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

      <div id='menuOptions' className={(menu === "sub_menu")? "activeMenu" : "unactiveMenu"}>
        <button className="menuBtn" disabled={(menu !== "sub_menu")} onClick={() => {
          updateCamera([36,4,40,   32,4,38])
          setPlayerView(false)
          setMenu("main_menu")
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
              <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
            </svg>
          </button>

        <button className="menuBtn" disabled={(menu !== "sub_menu")} onClick={() => {
          updateCamera([14,12,34,   14,12,26]);
          setPlayerView(true);
          }}><h3>Play</h3>
        </button>
        <button className="menuBtn" disabled={(menu !== "sub_menu")} onClick={() => {
          updateCamera([4,8,34.7,   -1,7,34.7]);
          setPlayerView(true);
          }}><h3>Edit</h3>
        </button>
      </div>
      

      <div id='main_menu' className={(menu === "main_menu")? "activeMenu" : "unactiveMenu"}>
        <button className="cas_btn" disabled={(menu !== "main_menu")} onClick={() => {
          updateCamera([14,12,34,   14,12,26]);
          setPlayerView(true);
          setMenu("sub_menu")
          }}><h1>Play</h1>
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

        <button className="cas_btn" disabled={(menu !== "main_menu")} onClick={() => {
          updateCamera([4,8,34.7,   -1,7,34.7]);
          setPlayerView(true);
          setMenu("sub_menu")
          }}><h1>Edit</h1>
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


        {/* Once a formal tutorial stage is made, remove this button and associated states/styles */}
        <button className="cas_btn" disabled={(menu !== "main_menu")} onClick={() => {
          // updateCamera([4,8,34.5,   -1,7,34.5]);
          // setPlayerView(true);
          if (settingsView) return; //If not checked and settigns btn is clicked too soon, settings div doesn't load.
          setMenu("settings_menu")
          setSettingsView(true);
          }}><h1>Settings</h1>
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

        <button className="cas_btn" disabled={(menu !== "main_menu")} onClick={() => {
          if (howtoView) return; //If not checked and settigns btn is clicked too soon, settings div doesn't load.
          setMenu("how_to_menu")
          setHowToView(true);
          }}><h1>How To Play</h1>
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

      </div>


      <div id="settings_wrapper" style={settingsStyle}>
        {(settingsView) && 
        <>
          <button id="setting_back_btn" onClick={() => {
            setMenu("main_menu")
            setTimeout(() => {
              setSettingsView(false)
            }, 1000)
            }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
              <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
            </svg>
          </button>
          <Settings saveSettings={handleNewSettings}/>      
        </>
          }
      </div>

      <div id="how_to_wrapper" style={how_toStyle}>
        {(howtoView) && 
        <>
          <button id="setting_back_btn" onClick={() => {
            setMenu("main_menu")
            setTimeout(() => {
              setHowToView(false)
            }, 1000)
            }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
              <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
            </svg>
          </button>
          <div>
            <h1>View Settings to Refernece Keybinds</h1>
            <br/>
            <h1>A stage consists of 4 lanes</h1>
            <h2>Lanes 1-2 are in the Left Section <br/> Lanes 3-4 are in the Right Section.</h2>

            <h2>Press the Turn Key to set your side (Left or Right).</h2>
            <br/>

            <h2>Press the corresponding Left/Right button to hit the approaching note on that side.</h2>
            <h3>Ex: If a note is approaching Lane 3, set your side to Right and press the Left button.</h3>

            <br/>
            <br/>
            <h1>There is one more note called a &quot;Turn Note&quot;</h1>
            <h2>A Turn Note can only be hit with the Turn Key and when approaching from the opposite side.</h2>
            <h2>Ex: If a Turn Note is approaching the Left Side, set your side to Right, then hit the Left Turn Key when it approaches.</h2>
            <h2>All notes have the same timing window.</h2>

            <br/>
            <br/>

            <h1>There is a combo bar that fills near the bottom</h1>
            <h2>A combo bar fills at the bottom after each successful hit.</h2>
            <h2>After 20 hits, you enter Flow State, where points are doubled.</h2>
            <h2>You exit Flow State by missing a note or hitting too early.</h2>

            <br/>
            <br/>

            <h1>Green feedback is a Perfect Hit</h1>
            <h1>Blue feedback is a Normal Hit</h1>
            <h1>Yellow feedback is an Early Hit</h1>
            <h1>Shake feedback is a Missed Note</h1>
            <h1>Red feedback means Nothing</h1>
          </div>
        </>
          }
      </div>

      <audio 
        src={audioURL ?? ""} 
        controls={false} 
        ref={audioRef} 
        loop={false} 
        onCanPlayThrough={handleSongReady}
        onError={handleSongError}
      />
      
      <div id="songScreen" style={stageStyle}>
        {selectedSong && gameMap && songPlaying && userSettings && audioRef && audioReady && 
        <Tape gMap={gameMap} gameMapProp={handleGameMap} settings={userSettings} audioProp={audioRef} user={user} song_id={selectedSong} username={username}/>
        }
      </div>
    </div>
  );
}
