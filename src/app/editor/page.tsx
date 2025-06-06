'use client'

import "./editor.css";
import { Keybinds } from "./components/keybinds";
import { EditorYT } from "./components/editorYT";
import { EditorMP3 } from "./components/editorMP3";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import gsap from 'gsap';
import { useGSAP } from "@gsap/react";

import { editorMap, keybindsType, localStorageMaps, localStorageEditorMaps, oldEditorMap } from "@/utils/helperTypes";
import { type User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import Link from "next/link";
import { CreateBeatmap } from "./components/createBeatmap";

const formatDateFromMillis = (milliseconds : string) => {
  const date = new Date(milliseconds);

  const month = date.getMonth() + 1;  // getMonth() is zero-based, so add 1
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');  // ensures 2-digit format
  const minutes = date.getMinutes().toString().padStart(2, '0');  // ensures 2-digit format

  return `${month}/${day}/${year} ${hours}:${minutes}`;
}

function isOldEditorMap(obj: unknown): obj is oldEditorMap {
  if (typeof obj !== 'object' || obj === null) return false;

  const o = obj as Record<string, unknown>;
  return (
    typeof o.timestamp === 'number' &&
    typeof o.song_metadata === 'object' &&
    o.song_metadata !== null &&
    typeof o.background !== 'object' &&
    !Array.isArray(o.normal_notes) &&
    !Array.isArray(o.ex_notes) &&
    Array.isArray(o.song_notes)
  );
}

const MaxFileSize = 5.0 * 1024 * 1024; // 5.5MBs converting to Bytes which is what File type uses

export default function EditorPage() {
  const [localMaps, setLocalMaps] = useState<localStorageMaps>({})
  // const [username, setUsername] = useState<string | null>(null)
  const [editorActive, setEditorActive] = useState<boolean>(false);
  const [selectedMap, setSelectedMap] = useState<editorMap | null>(null)
  const [userKeybinds, setUserKeybinds] = useState<keybindsType | null>(null)
  const [menu, setMenu] = useState<string>("")
  const [selectedMapID, setMapID] = useState<string | null>(null)
  const [keybindsView, setKeybindsView] = useState<boolean>(false)
  const [promptVisible, setPromptVisible] = useState<boolean>(false)

  // Multiple Prompt states
  const [deletePromptVisible, setDeleteVisible] = useState<boolean>(false)
  const [disabledCreateButton, setDisabledCreateButton] = useState<boolean>(false) 
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileError, setAudioFileError] = useState<number>(0)  // 0 is no error, 1 is a file needed, 2 is exceeded map limit
  const [audioSource, setAudioSource] = useState<string>("")
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();
  }, [supabase]);

  // Get all maps from Local Storage
  useEffect(() => {
    // type localStorageMapsOld = Record<string, oldEditor | 
    const localMaps : localStorageEditorMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");
    // Clean up maps
    const sortedMaps : localStorageMaps = {}
    Object.entries(localMaps).map(([, map], index) => {
        if (isOldEditorMap(map)) {
          const updatedMap : editorMap = {
          timestamp: map.timestamp,
          song_metadata : {
            song_name: map.song_metadata.song_name,
            song_artist: map.song_metadata.song_artist,
            song_mapper: map.song_metadata.song_mapper,
            genre: map.song_metadata.genre,
            language: map.song_metadata.language,
            normal_notes: parseInt(map.song_metadata.note_count),
            ex_notes: 0,
            description: map.song_metadata.description,
            source: map.song_metadata.source,
            length: 0,
            difficulty: map.song_metadata.difficulty,
            mp3: map.song_metadata.mp3
          },
          background: [[map.song_metadata.ytID, map.song_metadata.ytStart, map.song_metadata.ytEnd]],
          normal_notes: map.song_notes,
          ex_notes: []
        }
        sortedMaps[index + 1] = updatedMap
      }
      else {
        sortedMaps[index + 1] = map
      }
    })
    setLocalMaps(sortedMaps)

    localStorage.setItem("localMaps", JSON.stringify(sortedMaps));
  }, [])

  // Get Keybinds from local Storage
  useEffect(() => {
    const localKeybinds = localStorage.getItem("keybinds");
    let defaultKeybinds: keybindsType
    if (!localKeybinds) {
      defaultKeybinds = {
        sNote: "1",
        tNote: "2",
        decreaseSpd: "9",
        increaseSpd: "0",

        snap: "Q",
        toggleMusic: "P",

        staffUp: "A",
        topStaffTop: "S",
        topStaffBottom: "D",
      
        staffDown: "L",
        bottomStaffTop: "J",
        bottomStaffBottom: "K",
      }
    }
    else {
      defaultKeybinds = JSON.parse(localKeybinds)
      if (!defaultKeybinds.staffUp) {
        defaultKeybinds.staffUp = "A"
        defaultKeybinds.topStaffTop = "S"
        defaultKeybinds.topStaffBottom = "D"
      
        defaultKeybinds.staffDown = "L"
        defaultKeybinds.bottomStaffTop = "J"
        defaultKeybinds.bottomStaffBottom = "K"
      }
    }

    setUserKeybinds(defaultKeybinds)
    localStorage.setItem("keybinds", JSON.stringify(defaultKeybinds))
  }, [])

  
  const handleNewKeybinds = (newKeybinds : keybindsType | null) => {
    setUserKeybinds(newKeybinds)
  }

  const { contextSafe } = useGSAP();

  const audioNeeded = contextSafe(() => {
    // gsap.to("#audio_input", {backgroundColor: "#df0000 ",color: "#000000", yoyo: true, repeat: 1, duration:0.75})
    gsap.to("#audio_tooltip_text", {color: "#df0000", yoyo: true, repeat: 1, duration:0.75})
  })

  const keybindsWrapperStyle = {
    visibility: (keybindsView)? "visible" : "hidden",
    opacity: (keybindsView)? 1 : 0,
    transition: 'opacity 0.5s ease, visibility 1s'
  } as React.CSSProperties

  const keybindsStyle = {
    left: (menu === "keybinds")? "0%" : "-100%",
    transition: 'left 1s ease'
  } as React.CSSProperties

  const promptStyle = {
    visibility: (promptVisible)? "visible" : "hidden",
    opacity: (promptVisible)? 1 : 0,
    transition: 'opacity 0.5s ease, visibility 1s'
  } as React.CSSProperties

  // TODO, may need to update visibility for these two styles to left like above style
  const editorStyle = {
    left: (menu === "Editor")? "0%" : "-100%",
    visibility: (menu === "Editor") ? "visible" : "hidden",
    transition: 'left 1s ease, visibility 1s'
  } as React.CSSProperties;

  const deleteStyle = {
    visibility: (menu === "Delete")? "visible" : "hidden",
    opacity: (menu === "Delete")? 1 : 0,
    transition: 'opacity 500ms ease, visibility 500ms'
  } as React.CSSProperties;

  const [audioURL, setAudioURL] = useState<string>("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    const loadAudio = async () => {
      const context = new AudioContext();
      audioContextRef.current = context;

      const response = await fetch('/hitsound.mp3');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);

      audioBufferRef.current = audioBuffer;
    };

    loadAudio();
  }, []);

  const audioChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MaxFileSize) {
      audioNeeded()
      setAudioFileError(1)
      setDisabledCreateButton(true);
      setTimeout(() => {
        setDisabledCreateButton(false)
      }, 1500)
      return;
    }
    else {
      setDisabledCreateButton(false);
      setAudioFileError(0)
      setAudioFile(file);
      setAudioURL(URL.createObjectURL(file)); 
    }   
  }, []);

  const clearEditor = () => {
    setMenu("")
    setTimeout(() => {
      setEditorActive(false)
      setSelectedMap(null)
      setMapID("")
      setDisabledCreateButton(false)
      setAudioSource("")
    }, 1000)
  }

  const updateMaps = () => {
    const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");
    setLocalMaps(localMaps)
    localStorage.setItem("localMaps", JSON.stringify(localMaps));
  }

  const handleCreateMapYT = (newMap : editorMap) => {
    const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");
    let highestMapId = 0
    for (const map_id in localMaps) {
      const id = parseInt(map_id)
      if (id > highestMapId) {
        highestMapId = id
      }
    }
    setMapID((highestMapId + 1).toString());
    setSelectedMap(newMap)
    setEditorActive(true)
    setAudioSource("YT")
    setTimeout(() => {
      setMenu("Editor")
      setPromptVisible(false)
    }, 500)
    setTimeout(() => {
      setKeybindsView(false)
    }, 1500)
  }

  const handleCreateMapMP3 = (fileURL : string, file : File) => {
    if (fileURL == "") {
      console.log("Audio must be set first")
      return;
    }
    const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");
    let highestMapId = 0
    for (const map_id in localMaps) {
      const id = parseInt(map_id)
      if (id > highestMapId) {
        highestMapId = id
      }
    }
    setMapID((highestMapId + 1).toString());
    setEditorActive(true)
    setAudioFile(file)
    setAudioURL(fileURL)
    setAudioSource("MP3")
    setTimeout(() => {
      setMenu("Editor")
      setPromptVisible(false)
    }, 500)
    setTimeout(() => {
      setKeybindsView(false)
    }, 1500)
    console.log("Map made")
  }

  const deleteMap = () => {
    const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");

    if (selectedMapID && selectedMapID in localMaps) {
      delete localMaps[selectedMapID]
      localStorage.setItem("localMaps", JSON.stringify(localMaps))
      setLocalMaps(localMaps)
    }
    else {
      console.log("Map not found")
    }
  }

  const closeKeybinds = () => {
    setMenu("")
    setTimeout(() => {
      setKeybindsView(false)
    }, 1000)
  }
  
  const createMapMainMenu = () => {
    // Limit Player to 10 maps
    const localMaps : localStorageEditorMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");
    const localMapsCount = Object.entries(localMaps)
    if (localMapsCount.length >= 5) {
      audioNeeded();
      setDisabledCreateButton(true)
      setAudioFileError(2)
      setTimeout(() => {
        setDisabledCreateButton(false)
        setAudioFileError(0)
      }, 1500)
      return;
    }
    setPromptVisible(true)
    setDisabledCreateButton(true)
  }

  const ytOffsetRef = useRef<HTMLInputElement>(null)
  const ytEndRef = useRef<HTMLInputElement>(null)
  const ytIDRef= useRef<HTMLInputElement>(null)
  const prevID = useRef<string>("")
  useEffect(() => {
    if (ytOffsetRef.current && ytEndRef.current && ytIDRef.current){
      ytOffsetRef.current.value = (0).toString()
      ytEndRef.current.value = (0).toString()
      ytIDRef.current.value = ""
      prevID.current =""
    }
  }, [])

  const handleExitCreate = () => {
    setPromptVisible(false)
    setDisabledCreateButton(false)
    setAudioSource("")
  }

  return (
    <div id="editor">
      <div id="beatmap_wrapper">
        <div id="audio_select">
          <Link href={"/"}>Back to Project Tape</Link>
          <h2 id="audio_tooltip_text">{(audioFileError === 1)? "Audio File exceeds 5MB" : (audioFileError === 2)? "5 Beatmap Limit" : "Enter Your Audio File"}{(audioFileError === 0) && <span> (For MP3 Beatmaps)</span>}</h2>
          <input id="audio_input" type="file" accept='audio/*' onChange={audioChange}/>
        </div>

        <div id="create_settings">
          <button id="create_btn" disabled={disabledCreateButton} onClick={() => {
            createMapMainMenu()
            }}>
            <div id="create_div">
              Create 
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-plus-lg" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
              </svg>
            </div>            
          </button>
          <button id="keybinds_btn" disabled={(menu == "keybinds")} onClick={() => {
            if (keybindsView) return;
            setMenu("keybinds")
            setKeybindsView(true);
            }}> 
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-gear-fill" viewBox="0 0 16 16">
              <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
            </svg>
          </button>
        </div>
          
        <div id="beatmap_container">
          {Object.entries(localMaps).map(([map_id, mapItem]) => {
            const editorMap = mapItem;
            
            if (!editorMap) {
              return (
                <div key={map_id}>
                  {/* TODO: someone may mess with local storage and mess up a map. In that case, allow for them to fix the error by removing the entry. Like removing a bookmarked song */}
                  Error Loading This Map. Please Reload Page.
                </div>
              )
            }

            const { timestamp, song_metadata } = editorMap;
            const hasMp3 = !(song_metadata?.mp3 === false);
            return (
              <div key={map_id} className={hasMp3? "beatmap mp3_map" : "beatmap yt_map"}>
                <div>
                  <h2><span>Title:</span> {song_metadata.song_name || 'Untitled Song'}</h2>
                  <h2><span>Artist:</span> {song_metadata.song_artist || "Untitled Artist"}</h2>  
                  <h4>Last Edited: {formatDateFromMillis(timestamp)}</h4>
                </div>
                
                <div className="beatmap_icons">
                  <button disabled={disabledCreateButton} onClick={() => {
                    if ((audioURL === "" || audioFileError !== 0) && hasMp3 ) {
                      setDisabledCreateButton(true)
                      setTimeout(() => {
                        setDisabledCreateButton(false)
                      }, 1500)
                      audioNeeded();
                      return
                    }
                    setSelectedMap(editorMap)
                    setMapID(map_id)
                    setEditorActive(true)
                    setAudioSource(hasMp3? "MP3" : "YT")
                    setDisabledCreateButton(true)
                    setTimeout(() => {
                      setMenu("Editor")
                    }, 500)
                    setTimeout(() => {
                      setKeybindsView(false)
                    }, 1500)
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-fill" viewBox="0 0 16 16">
                        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                      </svg>
                    </button>
                  <button onClick={() => {
                    setMenu("Delete")
                    setDeleteVisible(true)
                    setMapID(map_id)
                    setSelectedMap(editorMap)
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash3-fill" viewBox="0 0 16 16">
                      <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                    </svg>
                  </button>
                </div>
                
              </div>
            )
          })
          }
        </div>
      </div>

      <div id="prompt_wrapper" style={promptStyle}> 
        {promptVisible && 
          <CreateBeatmap createMapYT={handleCreateMapYT} createMapMP3={handleCreateMapMP3} exitCreateMap={handleExitCreate}/>
        }
      </div>
      
      <div id="delete_wrapper" style={deleteStyle}>
        {(deletePromptVisible) &&
          <div id="delete_div">
            <h2>You are going to delete the &quot;{selectedMap?.song_metadata.song_name}&quot; beatmap. Are you sure?</h2>
            <div id="delete_btns">
              <button onClick={() => {
                setMenu("")
                setTimeout(() => {
                  setDeleteVisible(false)
                }, 500)
              }}>No, Keep It</button>

              <button onClick={() => {
                deleteMap()
                setMenu("")
                setDeleteVisible(false)
              }}>Yes, Delete It</button>
            </div>
          </div>
        }
      </div>
      
      <div id="keybinds_wrapper" style={keybindsWrapperStyle}>
        <div id="keybinds_style" style={keybindsStyle}>
          {(keybindsView) && 
            <>
              <Keybinds saveKeybinds={handleNewKeybinds} clearKeybinds={closeKeybinds}/>
            </>
          }
        </div>
      </div>
      
      <div id="editor_wrapper" style={editorStyle}>
        {userKeybinds && editorActive && audioContextRef.current && audioBufferRef.current && selectedMapID && (audioSource === "YT") &&  
          <EditorYT user={user} metadata={selectedMap} map_id={selectedMapID} keybinds={userKeybinds} songFile={audioFile} audioContextRef={audioContextRef.current} audioBufferRef={audioBufferRef.current} clearMap={clearEditor} updateLocalMaps={updateMaps}/>  
        }
        {userKeybinds && editorActive && audioURL && audioFile && audioContextRef.current && audioBufferRef.current && selectedMapID && (audioSource === "MP3") &&  
          <EditorMP3 user={user} metadata={selectedMap} map_id={selectedMapID} keybinds={userKeybinds} songAudio={audioURL} songFile={audioFile} audioContextRef={audioContextRef.current} audioBufferRef={audioBufferRef.current} clearMap={clearEditor} updateLocalMaps={updateMaps}/>  
        }
      </div>

    </div>
  )
}