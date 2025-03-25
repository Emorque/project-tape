import { keybindsType } from "@/utils/helperTypes"
import gsap from 'gsap';
import { useGSAP } from "@gsap/react";
import { useEffect, useState } from "react"

interface keybindsInterface {
  saveKeybinds : (newKeybinds : keybindsType | null) => void;
  clearKeybinds: () => void;
}

export const Keybinds = ({saveKeybinds, clearKeybinds} : keybindsInterface) => {   

  // Settings metadata
  const [singleNoteBtn, setSingleNoteBtn] = useState<string>("S")
  const [turnNoteBtn, setTurnNoteBtn] = useState<string>("K")

  const [decreaseSpdBtn, setDecreaseSpdBtn] = useState<string>("1")
  const [increaseSpdBtn, setIncreaseSpdBtn] = useState<string>("2")

  const [snapBtn, setSnapBtn] = useState<string>("Q")
  const [toggleMusicBtn, setToggleMusicBtn] = useState<string>("P")
  // Have a div pop up at the top with something like "Map saved locally". It goes away after 2 seconds, and during that two seconds, disable the save command
 
  const [disableMapping, setDisabedMapping] = useState<boolean>(false)
  const [disabledSave, setDisabedSave] = useState<boolean>(false)
  const [actionKey, setActionKey] = useState<string>("");


  const { contextSafe } = useGSAP();

  const keyError = contextSafe((btnRef: string) => {
    gsap.to(btnRef, {backgroundColor: "#c70000 ", yoyo: true, repeat: 1, duration:0.75})
    gsap.to("#mapping_error", {visibility: "visible", opacity: 1, yoyo: true, repeat: 1, duration:0.75})
  })

  const bottomAnimation = contextSafe((btn : string) => {
    gsap.to(btn, {visibility: "visible", opacity: 1, yoyo: true, repeat: 1, duration:0.75})
  })
  
  // Keybind Assignment 
  useEffect(() => {
    const handleKeyDown = (event: {key: string; repeat: boolean}) => {
      if (event.repeat) return;
      if (actionKey === "") return;
      if (disableMapping) return;
      
      const key = (event.key === " ") ? "Spacebar" : event.key.charAt(0).toUpperCase() + event.key.slice(1);

      if (actionKey === "Single") {
          if (key === turnNoteBtn || key === decreaseSpdBtn || key === increaseSpdBtn || key === snapBtn || key === toggleMusicBtn) {
              keyError("#singleNoteBtn");
              setDisabedMapping(true);
              setTimeout(() => {
                  setDisabedMapping(false)
              }, 1500)
              return
          }
          setSingleNoteBtn(key)
      }

      if (actionKey === "Turn") {
        if (key === singleNoteBtn || key === decreaseSpdBtn || key === increaseSpdBtn || key === snapBtn || key === toggleMusicBtn) {
          keyError("#turnNoteBtn");
              setDisabedMapping(true);
              setTimeout(() => {
                  setDisabedMapping(false)
              }, 1500)
              return
          }
          setTurnNoteBtn(key)
      }

      if (actionKey === "Decrease Spd") {
        if (key === singleNoteBtn || key === turnNoteBtn || key === increaseSpdBtn || key === snapBtn || key === toggleMusicBtn) {
          keyError("#decreaseSpdBtn");
              setDisabedMapping(true);
              setTimeout(() => {
                  setDisabedMapping(false)
              }, 1500)
              return
          }
          setDecreaseSpdBtn(key)
      }

      if (actionKey === "Increase Spd") {
        if (key === singleNoteBtn || key === turnNoteBtn || key === decreaseSpdBtn || key === snapBtn || key === toggleMusicBtn) {
          keyError("#increaseSpdBtn");
              setDisabedMapping(true);
              setTimeout(() => {
                  setDisabedMapping(false)
              }, 1500)
              return
          }
          setIncreaseSpdBtn(key)
      }

      if (actionKey === "Snap") {
        if (key === singleNoteBtn || key === turnNoteBtn || key === decreaseSpdBtn || key === increaseSpdBtn || key === toggleMusicBtn) {
          keyError("#snapBtn");
              setDisabedMapping(true);
              setTimeout(() => {
                  setDisabedMapping(false)
              }, 1500)
              return
          }
          setSnapBtn(key)
      }

      if (actionKey === "Music") {
        if (key === singleNoteBtn || key === turnNoteBtn || key === decreaseSpdBtn || key === increaseSpdBtn || key === snapBtn) {
          keyError("#toggleMusicBtn");
              setDisabedMapping(true);
              setTimeout(() => {
                  setDisabedMapping(false)
              }, 1500)
              return
          }
          setToggleMusicBtn(key)
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener on unmount
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [singleNoteBtn, turnNoteBtn, decreaseSpdBtn, increaseSpdBtn, snapBtn, toggleMusicBtn, actionKey, disableMapping])

  // Grabbing local
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

    setSingleNoteBtn(updatedKeybinds.sNote)
    setTurnNoteBtn(updatedKeybinds.tNote)
    setDecreaseSpdBtn(updatedKeybinds.decreaseSpd)
    setIncreaseSpdBtn(updatedKeybinds.increaseSpd)

    setSnapBtn(updatedKeybinds.snap)
    setToggleMusicBtn(updatedKeybinds.toggleMusic)

    localStorage.setItem("keybinds", JSON.stringify(updatedKeybinds))
  }, [])

  // Upload Keybinds
  const uploadKeybinds = () => {
    const newKeybinds : keybindsType = {
      sNote: singleNoteBtn,
      tNote: turnNoteBtn,
      decreaseSpd: decreaseSpdBtn,
      increaseSpd: increaseSpdBtn,
    
      snap: snapBtn,
      toggleMusic: toggleMusicBtn,
    }

    // Animation + Temporarily disable saving keybinds 
    setDisabedSave(true)
    bottomAnimation("#save_tooltip_text")
    setTimeout(() => {
      setDisabedSave(false)
    }, 1500)

    saveKeybinds(newKeybinds)
    localStorage.setItem("keybinds", JSON.stringify(newKeybinds))
  }

  // resetKeybinds
  const resetKeybinds = () => {
    const defaultKeybinds : keybindsType = {
      sNote: "Q",
      tNote: "W",
      decreaseSpd: "1",
      increaseSpd: "2",

      snap: "A",
      toggleMusic: "P",
    }
    setSingleNoteBtn(defaultKeybinds.sNote)
    setTurnNoteBtn(defaultKeybinds.tNote)
    setDecreaseSpdBtn(defaultKeybinds.decreaseSpd)
    setIncreaseSpdBtn(defaultKeybinds.increaseSpd)

    setSnapBtn(defaultKeybinds.snap)
    setToggleMusicBtn(defaultKeybinds.toggleMusic)

    // TODO: ANIMATION
    bottomAnimation("#reset_tooltip_text")

    setDisabedSave(true)
    setTimeout(() => {
      setDisabedSave(false)
    }, 500)
  }

  useEffect(() => {
    const handleKeyDown = (event: { key: string; repeat: boolean}) => {
      if (event.repeat) return;
      if (disableMapping) return;
      // Editor buttons
      // Buttons for the keybinds
      if (actionKey === "") return;
      setDisabedMapping(true)
      // This comes after what buttons are allowed in the editor
      console.log(event.key)
    }
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const newActionKey = (newKey: string) => {
    if (disableMapping) return;
    if (actionKey === newKey) {
        setActionKey("")
    }
    else {
        setActionKey(newKey)
    }
  }

  const singleNoteStyle =  {
    backgroundColor: (actionKey === "Single")? "#91a89a" : "#1a1a1a",
    color: (actionKey === "Single")? "#1d1d1d" : "#eaeaea"
  }
  const turnNoteStyle =  {
      backgroundColor: (actionKey === "Turn")? "#91a89a" : "#1a1a1a",
      color: (actionKey === "Turn")? "#1d1d1d" : "#eaeaea"
  }
  const lowerSpdStyle =  {
      backgroundColor: (actionKey === "Decrease Spd")? "#91a89a" : "#1a1a1a",
      color: (actionKey === "Decrease Spd")? "#1d1d1d" : "#eaeaea"
  }
  const raiseSpdStyle =  {
      backgroundColor: (actionKey === "Increase Spd")? "#91a89a" : "#1a1a1a",
      color: (actionKey === "Increase Spd")? "#1d1d1d" : "#eaeaea"
  }
  const snapStyle = {
      backgroundColor: (actionKey === "Snap")? "#91a89a" : "#1a1a1a",
      color: (actionKey === "Snap")? "#1d1d1d" : "#eaeaea"
  }
  const musicStyle = {
      backgroundColor: (actionKey === "Music")? "#91a89a" : "#1a1a1a",
      color: (actionKey === "Music")? "#1d1d1d" : "#eaeaea"
  }

  return (
    <div id="keybinds_page">
      <button id="keybinds_back_btn" onClick={() => {
        clearKeybinds()
        }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
          <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
        </svg>
      </button>
      <div id="keybinds_container">
        <h1>Editor Keybinds</h1>
        
        <div className="horizontal_div">
          <h2>Single Note</h2>
          <button id="singleNoteBtn" className="action_btn" style={singleNoteStyle} onClick={() => {newActionKey("Single")}}>{singleNoteBtn}</button>
        </div>

        <div className="horizontal_div">
          <h2>Turn Note</h2>
          <button id="turnNoteBtn" className="action_btn" style={turnNoteStyle} onClick={() => {newActionKey("Turn")}}>{turnNoteBtn}</button>
        </div>      
        
        <div className="horizontal_div">
          <h2>Lower Speed</h2>
          <button id="decreaseSpdBtn" className="action_btn" style={lowerSpdStyle} onClick={() => {newActionKey("Decrease Spd")}}>{decreaseSpdBtn}</button>
        </div>
        
        <div className="horizontal_div">
          <h2>Raise Speed</h2>
          <button id="increaseSpdBtn" className="action_btn" style={raiseSpdStyle} onClick={() => {newActionKey("Increase Spd")}}>{increaseSpdBtn}</button>
        </div>
        
        <div className="horizontal_div">  
          <h2>Toggle Snap</h2>
          <button id="snapBtn" className="action_btn" style={snapStyle} onClick={() => {newActionKey("Snap")}}>{snapBtn}</button>
        </div>

        <div className="horizontal_div">
          <h2>Toggle Music</h2>
          <button id="toggleMusicBtn" className="action_btn" style={musicStyle} onClick={() => {newActionKey("Music")}}>{toggleMusicBtn}
            
            <h2 id="mapping_error">Keybind Conflict</h2>
  
          </button>  
        </div>

      {/* TODO do the same setActionKey("") for gameplay Settings. Without it, you can still edit keybinds after saving. Not good UX */}
        <div id="save_reset_btns">
          <button className="bottom_btns" disabled={disabledSave} onClick={() => {setActionKey(""); uploadKeybinds()}}>
            Save Keybinds
            <div id="save_tooltip_text" className="bottom_tooltip_text">
              Keybinds Saved
            </div>
          </button>
          
          <button className="bottom_btns" disabled={disabledSave} onClick={() => {setActionKey("");resetKeybinds()}}>
            Reset Keybinds
            <div id="reset_tooltip_text" className="bottom_tooltip_text">
              Bindings Reset
            </div>
          </button>
        </div>
      </div>
    </div>
  )

}