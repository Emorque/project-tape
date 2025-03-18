'use client'

import "./editor.css";
import { Keybinds } from "./components/keybinds";
import { Editor } from "./components/editor";
import { useEffect, useState } from "react";

import { editorMap, keybindsType } from "@/utils/helperTypes";

export default function EditorPage() {
  const [localMaps, setLocalMaps] = useState<editorMap[]>([])
  const [editorActive, setEditorActive] = useState<boolean>(false);
  const [userKeybinds, setUserKeybinds] = useState<keybindsType | null>(null)
  const [menu, setMenu] = useState<string>("")
  const [keybindsView, setKeybindsView] = useState<boolean>(false)

  // Get all maps from Local Storage

  useEffect(() => {
    const localMaps = localStorage.getItem("localMaps");
    let updatedMaps : editorMap[]
    if (!localMaps) {
      console.log("No Local Maps")
      updatedMaps = []
    }
    else {
      updatedMaps = []
    }
    
    setLocalMaps(updatedMaps)
  })

  // Get Keybinds from local Storage
  useEffect(() => {
    const localKeybinds = localStorage.getItem("keybinds");
    let updatedKeybinds: keybindsType
    if (!localKeybinds) {
      console.log("No Local Keybinds")
      updatedKeybinds = {
        sNote: "Q",
        tNote: "W",
        decreaseSpd: "1",
        increaseSpd: "2",

        snap: "A",
        toggleMusic: "P",
      }
    }
    else {
      updatedKeybinds = JSON.parse(localKeybinds)
    }

    setUserKeybinds(updatedKeybinds)
    localStorage.setItem("keybinds", JSON.stringify(updatedKeybinds))
  }, [])

  
  const handleNewKeybinds = (newKeybinds : keybindsType | null) => {
    setUserKeybinds(newKeybinds)
  }

  const keybindsStyle = {
    visibility: (menu === "keybinds")? "visible" : "hidden",
    left: (menu === "keybinds")? "0%" : "-100%",
    transition: 'left 1s ease, visibility 1s'
  } as React.CSSProperties

  const editorStyle = {
    opacity: editorActive ? 1 : 0, 
    visibility: editorActive ? "visible" : "hidden",
    transition: 'opacity 1s ease, visibility 1s'
  } as React.CSSProperties;

  return (
    <div id="editor_wrapper">
      <button disabled={(menu == "keybinds")} onClick={() => {
        if (keybindsView) return;
        setMenu("keybinds")
        setKeybindsView(true);
      }}> 
      Keybinds
      </button>

      <div>
        {localMaps.map((mapItem, index) => {
          const { song_metadata, song_notes } = mapItem;

          return (
            <div key={index}>
              <h2>{song_metadata.song_name}</h2>
              <p>Artist: {song_metadata.song_artist}</p>
              <p>BPM: {song_metadata.bpm}</p>
              <p>Genre: {song_metadata.genre}</p>
              <p>Language: {song_metadata.language}</p>
              <p>Note Count: {song_metadata.note_count}</p>
              <p>Description: {song_metadata.description}</p>
            
              <button onClick={() => {
                console.log(song_notes)
                setEditorActive(true)
                }}></button>
            </div>
          )
        })
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
        {userKeybinds && editorActive && 
        <Editor keybinds={userKeybinds}/>  
        }
      </div>
      
    </div>
  )
}