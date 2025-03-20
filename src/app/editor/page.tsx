'use client'

import "./editor.css";
import { Keybinds } from "./components/keybinds";
import { Editor } from "./components/editor";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

import { editorMap, keybindsType, localStorageMaps } from "@/utils/helperTypes";

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

  const keybindsStyle = {
    visibility: (menu === "keybinds")? "visible" : "hidden",
    left: (menu === "keybinds")? "0%" : "-100%",
    transition: 'left 1s ease, visibility 1s'
  } as React.CSSProperties


  // TODO, may need to update visibility for these two styles to left like above style
  const editorStyle = {
    opacity: editorActive ? 1 : 0, 
    visibility: editorActive ? "visible" : "hidden",
    transition: 'opacity 1s ease, visibility 1s'
  } as React.CSSProperties;

  const deleteStyle = {
    opacity: deletePromptVisible ? 1 : 0, 
    visibility: deletePromptVisible ? "visible" : "hidden",
    transition: 'opacity 1s ease, visibility 1s'
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
    setEditorActive(false)
    setSelectedMap(null)
    setMapID("")
  }

  const updateMaps = () => {
    const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");
    setLocalMaps(localMaps)
    localStorage.setItem("localMaps", JSON.stringify(localMaps));
  }

  const newMap = () => {
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

  return (
    <div id="editor_wrapper">
      <button disabled={(menu == "keybinds")} onClick={() => {
        if (keybindsView) return;
        setMenu("keybinds")
        setKeybindsView(true);
      }}> 
      Keybinds
      </button>
      <h3>Select your Audio File</h3>
      <input type="file" accept='audio/*' onChange={audioChange}/>
      <button onClick={() => {newMap()}}>Create a new Map</button>

      <div>
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

          const { song_metadata, song_notes } = editorMap;
          return (
            <div key={map_id}>
              <h2>{song_metadata.song_name || 'Untitled Song'}</h2>
              <p>Artist: {song_metadata.song_artist}</p>
              <p>BPM: {song_metadata.bpm}</p>
              <p>Genre: {song_metadata.genre}</p>
              <p>Language: {song_metadata.language}</p>
              <p>Note Count: {song_metadata.note_count}</p>
              <p>Description: {song_metadata.description}</p>
            
              <button onClick={() => {
                console.log(song_notes)
                setSelectedMap(editorMap)
                setMapID(map_id)
                setEditorActive(true)
                }}>Song {parseInt(map_id)}</button>
              <button onClick={() => {
                setMenu("Delete")
                setDeleteVisible(true)
                setMapID(map_id)
              }}>Delete Beatmap</button>
            </div>
          )
        })
        }

      </div>
      
      <div id="delete_wrapper" style={deleteStyle}>
        {(deletePromptVisible) &&
          <div>
            <h2>Are you sure you to delete this map?</h2>
            <button onClick={() => {
              deleteMap()
              }}>Yes</button>
            <button onClick={() => {
              setMenu("")
              setTimeout(() => {
                setDeleteVisible(false)
              }, 1000)
            }}>No</button>
          </div>
        }
      </div>
      
      <div id="keybinds_wrapper" style={keybindsStyle}>
        {(keybindsView) && 
          <>
            <button id="keybinds_back_btn" onClick={() => {
              setMenu("")
              setTimeout(() => {
                setKeybindsView(false)
              }, 1000)
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
                <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
              </svg>
            </button>
            <Keybinds saveKeybinds={handleNewKeybinds}/>
          </>
        }
      </div>
      
      <div id="editorScreen" style={editorStyle}>
        {userKeybinds && editorActive && audioURL && hitsoundsRef.current && selectedMapID && 
        <Editor metadata={selectedMap} map_id={selectedMapID} keybinds={userKeybinds} songAudio={audioURL} hitsoundsRef={hitsoundsRef.current} clearMap={clearEditor} updateLocalMaps={updateMaps}/>  
        }
      </div>
      
    </div>
  )
}