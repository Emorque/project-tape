'use client'

import { Canvas } from "@react-three/fiber";
import { CameraControls, Html } from '@react-three/drei';
import Link from 'next/link'
import { PSRoom } from "./components/Project-tape-scene"
import { Settings } from "./components/settings";
import "./page.css";
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { sMap, settingsType, ytBackgroundType } from "@/utils/helperTypes"

import { createClient } from '@/utils/supabase/client'
import { SongHtml } from "./components/songHtml";
import { type User } from '@supabase/supabase-js'
import { LoadingScreen } from "./components/loadingScreen";
import { Game } from "./components/game";

import PlausibleProvider from 'next-plausible'

const formatNotes = (notes : string[][]) => {
  const finalNotes : [number, string][] = [] 
  for (let i = 0; i < notes[0].length; i++) {
    // First Turn
    if (notes[0][i] === 'T') {
      finalNotes.push([i * 62.5, "FT"])
    }
    // First Left
    if (notes[0][i] === 'S') {
      finalNotes.push([i * 62.5, "FL"])
    }
    // First Right
    if (notes[1][i] === 'S') {
      finalNotes.push([i * 62.5, "FR"])
    }

    // First Turn
    if (notes[2][i] === 'T') {
      finalNotes.push([i * 62.5, "ST"])
    }
    // Second Left
    if (notes[2][i] === 'S') {
      finalNotes.push([i * 62.5, "SL"])
    }
    // Second Right
    if (notes[3][i] === 'S') {
      finalNotes.push([i * 62.5, "SR"])
    }
  }  
  return finalNotes;
}

export default function Home() {
  const cameraRef = useRef<CameraControls | null>(null);
  // const [playerView, setPlayerView] = useState<boolean>(false);
  const [songPlaying, setSongPlaying] = useState<boolean>(false)

  const [selectedSong, setSelectedSong] = useState<number | null>(null)
  const [gameMap, setGameMap] = useState<sMap | null>(null)
  const [songBackground, setSongBackground] = useState<ytBackgroundType | null>(null)
  const [menu, setMenu] = useState<string>("main_menu")
  const [htmlDiv, setHTMLDiv] = useState<string>("")
  const [userSettings, setUserSettings] = useState<settingsType | null>(null);
  const [settingsView, setSettingsView] = useState<boolean>(false);

  const [howtoView, setHowToView] = useState<boolean>(false);

  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [ytAudio, setYTAudio] = useState<boolean>(false)
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioReady, setAudioReady] = useState<boolean>(false);
  const [songLength, setSongLength] = useState<number>(0)

  const [verifiedSong, setVerifiedSong] = useState<boolean>(false)

  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, } = await supabase.auth.getUser()
      setUser(user);
    };

    fetchUser();
  }, [supabase]);

  const handleGameExit = (local : boolean) => { 
    setSelectedSong(null);
    updateCamera([14,12,34,   14,12,26], true); //Set back to Songs Div 
    setSongPlaying(false)
    if (local) {
      setUsingLocalMap(false) // might not even need this if usingLocalMap gets set on Play press on songHTML
    } 
    setGameMap(null);
  }

  const handleNewSettings = (newSettings: settingsType | null) => {
    setUserSettings(newSettings)
  }

  const getMap = useCallback(async (selectedSong : number, verified: boolean) => {
    // console.log("called Supabase for Map")
    try {
      // TODO: add loading state hear, if loading is true for too long, have the user return back to songHTML
      // setMapLoading(true)
      let songMap, error, status;
      if (verified) {
        ({ data: songMap, error, status } = await supabase
        .from('verified_songs')
        .select('normal_map, audio_link')
        .eq('id', selectedSong)
        .single())
      }
      else {
        ({ data: songMap, error, status } = await supabase
          .from('pending_songs')
          .select('normal_map, audio_link')
          .eq('id', selectedSong)
          .single())
      }


      if (error && status !== 406) {
        console.log(error)
        throw error
      }

      if (songMap) {
        setGameMap(songMap.normal_map)
        console.log("gameMapSupabase")
        if (songMap.audio_link.startsWith("https://www.youtube.com/watch?v=")) {
          setYTAudio(true)
        }
        else {
          setYTAudio(false)
          try {
            const {data : songFile, error : songFileError} = await supabase.storage.from("songs").download(songMap.audio_link)
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
      }
    } catch (error) {
      console.error('User error:', error) // Only used for eslint
      alert('Error loading user data!')
    } finally {
      // console.log('loaded game_map and audio')
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

            offset: 0,

            backgroundDim: 0.5,
            mobileControls: false
        }
      }
      else{
        updateSettings = JSON.parse(localSettings);
      }
      // Come back to fix in case some users delete/rename keys
      setUserSettings(updateSettings)
      localStorage.setItem("settings", JSON.stringify(updateSettings))

  }, [])

  const songDivStyle = {
    visibility: (htmlDiv === "songDiv")? "visible" : "hidden",
    }as React.CSSProperties;
  
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

  const updateCamera = (newFocus: [number,number,number,number,number,number], animate: boolean) => {
    cameraRef.current?.setLookAt(newFocus[0], newFocus[1], newFocus[2], newFocus[3], newFocus[4], newFocus[5], animate);
  }

  // Local Songs 
  const [usingLocalMap, setUsingLocalMap] = useState<boolean>(false);

  const handleSelectedSong = (songID: number, song_background : ytBackgroundType | null, verified: boolean, gameLength: number) => {
    // updateCamera([14,8,34,   14, 7, 26], true)
    setSongPlaying(true);
    setSelectedSong(songID); 
    getMap(songID, verified);
    setUsingLocalMap(false)
    setSongBackground(song_background)
    setVerifiedSong(verified)
    setSongLength(gameLength)
    // console.log("handled", song_background)
  }

  const handleLocalMap = (song_url: string, song_notes: string[][], song_background: ytBackgroundType | null, gameLength: number) => {
    // updateCamera([14,8,34,   14, 7, 26], true)
    setSongPlaying(true);
    if (song_url.startsWith("https://www.youtube.com/watch?v=")) {
      setYTAudio(true)
    }
    else {
      setYTAudio(false)
      setAudioURL(song_url)
    }
    setGameMap(formatNotes(song_notes))
    setUsingLocalMap(true)
    setVerifiedSong(false)
    setSongBackground(song_background)
    setSongLength(gameLength)
  }

  const handleSongReady = () => {
    // Song is ready
    console.log("Song is Ready")
    setAudioReady(true)
  }

  const handleSongError = () => {
    // console.log("Error Loading Song")
    setAudioReady(false);
  } 

  const [avatar_url, setAvatarUrl] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)

  const getProfile = useCallback(async () => {
      if (!user) return; // Error without this. Likely because it would query profiles with a null id without it
      try {
          // setProfileLoading(true)
        const { data, error, status } = await supabase
          .from('profiles')
          .select(`avatar_url, role`)
          .eq('id', user?.id)
          .single()
  
        if (error && status !== 406) {
          console.log(error)
          throw error
        }
  
        if (data) {
          setRole(data.role)
          setAvatarUrl(data.avatar_url)
        }
      } catch (error) {
          console.log(error);
          console.log("Unsigned User");
      } 
    }, [user, supabase])
  
    useEffect(() => {
      getProfile()
    }, [user, getProfile])

  const [gameLoading, setGameLoading] = useState<boolean>(true)
  const setStage = () => {
    setTimeout(() => {
      updateCamera([36,4,40,   32,4,38], false)
      setGameLoading(false)
    }, 200)
  }

  const backtoMainMenu = () => {
    setMenu("main_menu")
    setHTMLDiv("")
    setTimeout(() => {
      updateCamera([36,4,40,   32,4,38], true)
    }, 400)
  }

  const gotoEditMenu = (from_main_menu: boolean) => {
    if (htmlDiv === "editDiv") return;
    if (from_main_menu) {
      setMenu("sub_menu")
      updateCamera([3,7.7,34.75,   -1,7.7,34.75], true);
      setTimeout(() => {
        // setPlayerView(true);
        setHTMLDiv("editDiv")
      }, 750)
    }
    else {
      setHTMLDiv("")
      setTimeout(() => {
        updateCamera([3,7.7,34.75,   -1,7.7,34.75], true);
      }, 300)
      setTimeout(() => {
        // setPlayerView(true);
        setHTMLDiv("editDiv")
      }, 900) 
    }
  }

  const gotoSongMenu = (from_main_menu: boolean) => {
    if (htmlDiv === "songDiv") return;
    if (from_main_menu) {
      setMenu("sub_menu")
      updateCamera([14,12,34,   14,12,26], true);
      setTimeout(() => {
        // setPlayerView(true);
        setHTMLDiv("songDiv")
      }, 750)
    }

    else {
      setHTMLDiv("")
      setTimeout(() => {
        updateCamera([14,12,34,   14,12,26], true);
      }, 300)
      setTimeout(() => {
        // setPlayerView(true);
        setHTMLDiv("songDiv")
      }, 900) 
    }
  }


  
  const [fullscreen, setFullscreen] = useState<boolean>(false)

  const toggleFullScreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
          setFullscreen(true)
      }
      else if (document.exitFullscreen) {
          document.exitFullscreen()
          setFullscreen(false)
      }
  }
  
  return (
    <PlausibleProvider domain="project-tape.vercel.app">
    <div id="canvasContainer">
      <Canvas id="canvas_id" style={{ background: "black" }} camera={{ position: [36,4,40]}}>
        <Suspense fallback={null}>
          {/* <pointLight color={'#ffd1b7'} position={[7,13,34]} intensity={200}/> */}
          {/* <pointLight color={'#ffd1b7'} position={[34,13,34]} intensity={200}/> */}
          <PSRoom/>
          <Html 
          className="editorHTML"
            position={[-1.5,7.7,34.74]}
            transform
            occlude
            rotation={[0, Math.PI /2, 0]}
          >
            {/* <div className="htmlDiv" style={editDivStyle}> */}
              <div id="editHTML" className={htmlDiv === "editDiv"? "activeHTML" : "inactiveHTML"}>
                <Link href="/editor">Visit Editor</Link>
              </div>
            {/* </div> */}
          </Html>
          <CameraControls 
            ref={cameraRef}
            enabled={true} 
            touches={{one: 0, two: 0, three: 0}} //Both removes touch/mouse controls. Needed to get scroll on HTML to work
            mouseButtons={{left: 0, right: 0, wheel: 0, middle: 0}}
          />
        </Suspense>
      </Canvas>

      <div className="htmlDiv" style={songDivStyle}>
        <div id="songHTML" className={htmlDiv === "songDiv"? "activeHTML" : "inactiveHTML"}>
          <SongHtml songToPlay={handleSelectedSong} playLocalSong={handleLocalMap} user={user} role={role} avatar_url={avatar_url}/>
        </div>
      </div>

      <LoadingScreen loading={gameLoading} setGameReady={setStage}/>
      
      <div id='menuOptions' className={(menu === "sub_menu")? "activeMenu" : "unactiveMenu"}>
        <button className="menuBtn" disabled={(menu !== "sub_menu") || (htmlDiv === "")} onClick={() => {
          // setPlayerView(false)
          backtoMainMenu()
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
              <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
            </svg>
          </button>

        <button className="menuBtn" disabled={(menu !== "sub_menu") || (htmlDiv === "")} onClick={() => {
          gotoSongMenu(false)
          }}><h3>Play</h3>
        </button>
        <button className="menuBtn" disabled={(menu !== "sub_menu") || (htmlDiv === "")} onClick={() => {
          gotoEditMenu(false)
          }}><h3>Edit</h3>
        </button>
      </div>
      

      <div id='main_menu' className={(menu === "main_menu")? "activeMenu" : "unactiveMenu"}>
        <button className="cas_btn" disabled={(menu !== "main_menu")} onClick={() => {
          gotoSongMenu(true)
          }}><h1>Play</h1>
          <div className="cas_bottom">
          </div>
          <div className="cas_bar menu">
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
          gotoEditMenu(true)
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
        <div id="settings_header">
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

            <button id="fullscreen_btn" onClick={toggleFullScreen}>{(fullscreen)? 
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-fullscreen-exit" viewBox="0 0 16 16">
                <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5m5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5M0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5m10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0z"/>
              </svg>
              : 
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-fullscreen" viewBox="0 0 16 16">
                <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5M.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5"/>
              </svg>
            }</button>
        </div>
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
            <Link href={"/tutorial"}>Play Tutorial</Link>
            <h1>View Settings to Reference Keybinds</h1>
            <br/>
            <h1>Each stage consists of 4 lanes.</h1>
            <h2>Lanes 1-2 are on the Top Staff. <br/> Lanes 3-4 are on the Bottom Staff.</h2>

            <h2>Press the Up/Down Button to switch your current Staff.</h2>
            <br/>

            <h2>Press the corresponding Top/Bottom Lane button to hit the approaching note on that Staff.</h2>
            <h3>Ex: If a note is approaching Lane 3, go to the Bottom Staff and press the Top Lane Button.</h3>

            <br/>
            <br/>
            <h1>There is one more note called a &quot;Turn Note&quot;</h1>
            <h2>A Turn Note can only be hit with the Up/Down Button and when approaching from the opposite Staff.</h2>
            <h2>Ex: If a Turn Note is approaching the Top Staff, start from the Bottom Staff, then press the Up Button when it approaches.</h2>
            <h2>All notes have the same timing window.</h2>

            <br/>
            <br/>

            <h1>There is a combo bar that fills near the bottom.</h1>
            <h2>A combo bar fills at the bottom after each successful hit.</h2>
            <h2>Once filled, you&quot;ll enter &quot;Flow State&quot;.</h2>
            <h2>While in flow state, you earn more points.</h2>
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
        {gameMap && songPlaying && userSettings && audioRef && (audioReady || ytAudio) && 
        <Game gameMap={gameMap} closeGame={handleGameExit} settings={userSettings} audioProp={audioRef} ytAudio={ytAudio} gameLength={songLength} user={user} song_id={selectedSong} songBackground={songBackground} verified={verifiedSong} usingLocalMap={usingLocalMap}/>
        }
      </div>
    </div>
    </PlausibleProvider>
  );
}
