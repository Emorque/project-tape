'use client'

import "./editor.css";
import { Keybinds } from "./components/keybinds";
import { Editor } from "./components/editor";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

import { editorMap, keybindsType, localStorageMaps } from "@/utils/helperTypes";

function formatDateFromMillis(milliseconds : string) {
  const date = new Date(milliseconds);

  const month = date.getMonth() + 1;  // getMonth() is zero-based, so add 1
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');  // ensures 2-digit format
  const minutes = date.getMinutes().toString().padStart(2, '0');  // ensures 2-digit format

  return `${month}/${day}/${year} ${hours}:${minutes}`;
}


export default function EditorPage() {
  const [localMaps, setLocalMaps] = useState<localStorageMaps>({})
  const [editorActive, setEditorActive] = useState<boolean>(false);
  const [selectedMap, setSelectedMap] = useState<editorMap | null>(null)
  const [userKeybinds, setUserKeybinds] = useState<keybindsType | null>(null)
  const [menu, setMenu] = useState<string>("")
  const [selectedMapID, setMapID] = useState<string | null>(null)
  const [keybindsView, setKeybindsView] = useState<boolean>(false)

  // Multiple Prompt states
  const [deletePromptVisible, setDeleteVisible] = useState<boolean>(false)

  // Get all maps from Local Storage
  useEffect(() => {
    const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");
    setLocalMaps(localMaps)
    localStorage.setItem("localMaps", JSON.stringify(localMaps));
  }, [])

  // Get Keybinds from local Storage
  useEffect(() => {
    const localKeybinds = localStorage.getItem("keybinds");
    let defaultKeybinds: keybindsType
    if (!localKeybinds) {
      console.log("No Local Keybinds")
      defaultKeybinds = {
        sNote: "Q",
        tNote: "W",
        decreaseSpd: "1",
        increaseSpd: "2",

        snap: "A",
        toggleMusic: "P",
      }
    }
    else {
      defaultKeybinds = JSON.parse(localKeybinds)
    }

    setUserKeybinds(defaultKeybinds)
    localStorage.setItem("keybinds", JSON.stringify(defaultKeybinds))
  }, [])

  
  const handleNewKeybinds = (newKeybinds : keybindsType | null) => {
    setUserKeybinds(newKeybinds)
  }

  const keybindsWrapperStyle = {
    visibility: (menu === "keybinds")? "visible" : "hidden",
    transition: 'visibility 1s'
  } as React.CSSProperties

  const keybindsStyle = {
    left: (menu === "keybinds")? "0%" : "-100%",
    transition: 'left 1s'
  } as React.CSSProperties


  // TODO, may need to update visibility for these two styles to left like above style
  const editorStyle = {
    right: (menu === "Editor")? "0%" : "-100%",
    visibility: (menu === "Editor") ? "visible" : "hidden",
    transition: 'right 1s ease, visibility 1s'
  } as React.CSSProperties;

  const deleteStyle = {
    visibility: (menu === "Delete")? "visible" : "hidden",
    opacity: (menu === "Delete")? 1 : 0,
    transition: 'opacity 500ms ease, visibility 500ms'
  } as React.CSSProperties;

  const [audioURL, setAudioURL] = useState<string>("");
  const hitsoundsRef = useRef<{ play: () => void; }[]>([]);

  useEffect(() => {
    const tempHitsounds: { play: () => void; }[] = []
    for (let i = 0; i < 12; i++) {
      const hitsound  = new Audio('/hitsound.mp3');
      hitsound.volume = 1
      tempHitsounds.push(hitsound);
    } 
    hitsoundsRef.current = tempHitsounds;
  }, [])

  const audioChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioURL(URL.createObjectURL(file));    
  }, []);

  const clearEditor = () => {
    setMenu("")
    setTimeout(() => {
      setEditorActive(false)
      setSelectedMap(null)
      setMapID("")
    }, 1000)
  }

  const updateMaps = () => {
    const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");
    setLocalMaps(localMaps)
    localStorage.setItem("localMaps", JSON.stringify(localMaps));
  }

  const newMap = () => {
    if (audioURL == "") {
      console.log("Audio must be set first")
      return;
    }
    const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");
    let highestMapId = 1
    for (const map_id in localMaps) {
      const id = parseInt(map_id)
      if (id > highestMapId) {
        highestMapId = id
      }
    }
    setMapID((highestMapId + 1).toString());
    setEditorActive(true)
    setTimeout(() => {
      setMenu("Editor")
    }, 500)
  }

  const deleteMap = () => {
    console.log(selectedMapID)
    const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");

    if (selectedMapID && selectedMapID in localMaps) {
      delete localMaps[selectedMapID]
      localStorage.setItem("localMaps", JSON.stringify(localMaps))
      console.log("Deleted", selectedMapID)
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

  return (
    <div id="editor">
      <div id="beatmap_wrapper">
        <div id="audio_select">
          <h3>Select your Audio File</h3>
          <input id="audio_input" type="file" accept='audio/*' onChange={audioChange}/>  
        </div>

        <div id="create_settings">
          <button id="create_btn" onClick={() => {newMap()}}>Create</button>
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
              console.log(mapItem)
              return (
                <div key={map_id}>
                  {/* TODO: someone may mess with local storage and mess up a map. In that case, allow for them to fix the error by removing the entry. Like removing a bookmarked song */}
                  Error Loading This Map. Please Remove
                </div>
              )
            }

            const { timestamp, song_metadata, song_notes } = editorMap;
            return (
              <div key={map_id} className="beatmap">
                <div>
                  <h2>{song_metadata.song_name || 'Untitled Song'}</h2>
                  <h2>Artist: {song_metadata.song_artist || "Untitled Artist"}</h2>  
                  <h4>Last Edited: {formatDateFromMillis(timestamp)}</h4>
                </div>
                
                <div>
                  <button onClick={() => {
                    if (audioURL == "") {
                      console.log("Audio must be set first")
                      return;
                    }
                    console.log(song_notes)
                    setSelectedMap(editorMap)
                    setMapID(map_id)
                    setEditorActive(true)
                    setTimeout(() => {
                      setMenu("Editor")
                    }, 500)
                    setTimeout(() => {
                      setKeybindsView(false)
                    }, 1500)
                    }}>Edit</button>
                  <button onClick={() => {
                    setMenu("Delete")
                    setDeleteVisible(true)
                    setMapID(map_id)
                    setSelectedMap(editorMap)
                  }}>Delete Beatmap
                  </button>
                </div>
                
              </div>
            )
          })
          }
        </div>
      </div>
      
      <div id="delete_wrapper" style={deleteStyle}>
        {(deletePromptVisible) &&
          <div id="delete_div">
            <h2>You are going to delete the &quot;{selectedMap?.song_metadata.song_name}&quot; beatmap. Are you sure?</h2>
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
        {userKeybinds && editorActive && audioURL && hitsoundsRef.current && selectedMapID && 
        <Editor metadata={selectedMap} map_id={selectedMapID} keybinds={userKeybinds} songAudio={audioURL} hitsoundsRef={hitsoundsRef.current} clearMap={clearEditor} updateLocalMaps={updateMaps}/>  
        }
      </div>
      
    </div>
  )
}