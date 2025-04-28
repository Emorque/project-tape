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
  const [singleNoteBtn, setSingleNoteBtn] = useState<string>("1")
  const [turnNoteBtn, setTurnNoteBtn] = useState<string>("2")

  const [decreaseSpdBtn, setDecreaseSpdBtn] = useState<string>("9")
  const [increaseSpdBtn, setIncreaseSpdBtn] = useState<string>("0")

  const [snapBtn, setSnapBtn] = useState<string>("Q")
  const [toggleMusicBtn, setToggleMusicBtn] = useState<string>("P")

  const [staffUpBtn, setStaffUpBtn] = useState<string>("A");
  const [topStaffTopBtn, setTopStaffTopBtn] = useState<string>("S");
  const [topStaffBottomBtn, setTopStaffBottomBtn] = useState<string>("D");
  
  const [staffDownBtn, setStaffDownBtn] = useState<string>("L");
  const [bottomStaffTopBtn, setBottomStaffTopBtn] = useState<string>("J");
  const [bottomStaffBottomBtn, setBottomStaffBottomBtn] = useState<string>("K");

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
  

  const compareKeys = (key: string, btn: string) => {
    const musicControlButtons = {
      "singleNoteBtn" : singleNoteBtn,
      "turnNoteBtn" : turnNoteBtn,
      "decreaseSpdBtn": decreaseSpdBtn,
      "increaseSpdBtn" : increaseSpdBtn,
      "snapBtn" : snapBtn,
      "toggleMusicBtn" : toggleMusicBtn,

      "staffUpBtn" : staffUpBtn, 
      "topStaffTopBtn" : topStaffTopBtn, 
      "topStaffBottomBtn" : topStaffBottomBtn, 
      "staffDownBtn" : staffDownBtn, 
      "bottomStaffTopBtn" : bottomStaffTopBtn, 
      "bottomStaffBottomBtn" : bottomStaffBottomBtn
    };

    for (const [musicBtn, value] of Object.entries(musicControlButtons)) {
      if (btn === musicBtn) {
        continue
      }
      if (key === value) {
        return true
      }
    }
    return false
  }

  // Keybind Assignment 
  useEffect(() => {
    const handleKeyDown = (event: {key: string; repeat: boolean}) => {
      if (event.repeat) return;
      if (actionKey === "") return;
      if (disableMapping) return;
      
      const key = (event.key === " ") ? "Spacebar" : event.key.charAt(0).toUpperCase() + event.key.slice(1);

      if (actionKey === "Single") {
          if (compareKeys(key, "singleNoteBtn")){
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
        if (compareKeys(key, "turnNoteBtn")){
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
        if (compareKeys(key, "decreaseSpdBtn")){
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
        if (compareKeys(key, "increaseSpdBtn")){
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
        if (compareKeys(key, "snapBtn")){
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
        if (compareKeys(key, "toggleMusicBtn")){
          keyError("#toggleMusicBtn");
              setDisabedMapping(true);
              setTimeout(() => {
                  setDisabedMapping(false)
              }, 1500)
              return
          }
          setToggleMusicBtn(key)
      }

      if (actionKey === "StaffUp") {
        if (compareKeys(key, "staffUpBtn")){
          keyError("#staffUpBtn");
              setDisabedMapping(true);
              setTimeout(() => {
                  setDisabedMapping(false)
              }, 1500)
              return
          }
          setStaffUpBtn(key)
      }

      if (actionKey === "TopStaffTop") {
        if (compareKeys(key, "topStaffTopBtn")){
          keyError("#topStaffTopBtn");
              setDisabedMapping(true);
              setTimeout(() => {
                  setDisabedMapping(false)
              }, 1500)
              return
          }
          setTopStaffTopBtn(key)
      }

      if (actionKey === "TopStaffBottom") {
        if (compareKeys(key, "topStaffBottomBtn")){
          keyError("#topStaffBottomBtn");
              setDisabedMapping(true);
              setTimeout(() => {
                  setDisabedMapping(false)
              }, 1500)
              return
          }
          setTopStaffBottomBtn(key)
      }

      if (actionKey === "StaffDown") {
        if (compareKeys(key, "staffDownBtn")){
          keyError("#staffDownBtn");
              setDisabedMapping(true);
              setTimeout(() => {
                  setDisabedMapping(false)
              }, 1500)
              return
          }
          setStaffDownBtn(key)
      }

      if (actionKey === "BottomStaffTop") {
        if (compareKeys(key, "bottomStaffTopBtn")){
          keyError("#bottomStaffTopBtn");
              setDisabedMapping(true);
              setTimeout(() => {
                  setDisabedMapping(false)
              }, 1500)
              return
          }
          setBottomStaffTopBtn(key)
      }

      if (actionKey === "BottomStaffBottom") {
        if (compareKeys(key, "bottomStaffBottomBtn")){
          keyError("#bottomStaffBottomBtn");
              setDisabedMapping(true);
              setTimeout(() => {
                  setDisabedMapping(false)
              }, 1500)
              return
          }
          setBottomStaffBottomBtn(key)
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener on unmount
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [singleNoteBtn, turnNoteBtn, decreaseSpdBtn, increaseSpdBtn, snapBtn, toggleMusicBtn, actionKey, disableMapping,
    staffUpBtn, topStaffTopBtn, topStaffBottomBtn, staffDownBtn, bottomStaffTopBtn, bottomStaffBottomBtn
  ])

  // Grabbing local
  useEffect(() => {
    const localKeybinds = localStorage.getItem("keybinds");
    let updatedKeybinds: keybindsType
    if (!localKeybinds) {
      console.log("No Local Keybinds")
      updatedKeybinds = {
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
      updatedKeybinds = JSON.parse(localKeybinds)
    }

    setSingleNoteBtn(updatedKeybinds.sNote)
    setTurnNoteBtn(updatedKeybinds.tNote)
    setDecreaseSpdBtn(updatedKeybinds.decreaseSpd)
    setIncreaseSpdBtn(updatedKeybinds.increaseSpd)

    setSnapBtn(updatedKeybinds.snap)
    setToggleMusicBtn(updatedKeybinds.toggleMusic)

    setStaffUpBtn(updatedKeybinds.staffUp || "A")
    setTopStaffTopBtn(updatedKeybinds.topStaffTop || "S")
    setTopStaffBottomBtn(updatedKeybinds.topStaffBottom || "D")

    setStaffDownBtn(updatedKeybinds.staffDown || "L")
    setBottomStaffTopBtn(updatedKeybinds.bottomStaffTop || "J") 
    setBottomStaffBottomBtn(updatedKeybinds.bottomStaffBottom || "K")

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

      staffUp: staffUpBtn,
      topStaffTop: topStaffTopBtn,
      topStaffBottom: topStaffBottomBtn,
    
      staffDown: staffDownBtn,
      bottomStaffTop: bottomStaffTopBtn,
      bottomStaffBottom: bottomStaffBottomBtn,
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
    setSingleNoteBtn(defaultKeybinds.sNote)
    setTurnNoteBtn(defaultKeybinds.tNote)
    setDecreaseSpdBtn(defaultKeybinds.decreaseSpd)
    setIncreaseSpdBtn(defaultKeybinds.increaseSpd)

    setSnapBtn(defaultKeybinds.snap)
    setToggleMusicBtn(defaultKeybinds.toggleMusic)

    setStaffUpBtn(defaultKeybinds.staffUp)
    setTopStaffTopBtn(defaultKeybinds.topStaffTop)
    setTopStaffBottomBtn(defaultKeybinds.topStaffBottom)

    setStaffDownBtn(defaultKeybinds.staffDown)
    setBottomStaffTopBtn(defaultKeybinds.bottomStaffTop)
    setBottomStaffBottomBtn(defaultKeybinds.bottomStaffBottom)

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

  const staffUpStyle = {
      backgroundColor: (actionKey === "StaffUp")? "#91a89a" : "#1a1a1a",
      color: (actionKey === "StaffUp")? "#1d1d1d" : "#eaeaea"
  }

  const topStaffTopStyle = {
    backgroundColor: (actionKey === "TopStaffTop")? "#91a89a" : "#1a1a1a",
    color: (actionKey === "TopStaffTop")? "#1d1d1d" : "#eaeaea"
  }

  const topStaffBottomStyle = {
    backgroundColor: (actionKey === "TopStaffBottom")? "#91a89a" : "#1a1a1a",
    color: (actionKey === "TopStaffBottom")? "#1d1d1d" : "#eaeaea"
  }

  const staffDownStyle = {
    backgroundColor: (actionKey === "StaffDown")? "#91a89a" : "#1a1a1a",
    color: (actionKey === "StaffDown")? "#1d1d1d" : "#eaeaea"
  }

  const bottomStaffTopStyle = {
    backgroundColor: (actionKey === "BottomStaffTop")? "#91a89a" : "#1a1a1a",
    color: (actionKey === "BottomStaffTop")? "#1d1d1d" : "#eaeaea"
  }

  const bottomStaffBottomStyle = {
    backgroundColor: (actionKey === "BottomStaffBottom")? "#91a89a" : "#1a1a1a",
    color: (actionKey === "StaffUp")? "#1d1d1d" : "#eaeaea"
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
          </button>  
        </div>

        <br/>
        <h1>Play Along Keybinds</h1>
        <div className="horizontal_div">
          <h2>Staff Up Key</h2>
          <button id="staffUpBtn" className="action_btn" style={staffUpStyle} onClick={() => {newActionKey("StaffUp")}}>
            {staffUpBtn}
          </button>  
        </div>

        <div className="horizontal_div">
          <h2>Top Staff Top Key</h2>
          <button id="topStaffTopBtn" className="action_btn" style={topStaffTopStyle} onClick={() => { newActionKey("TopStaffTop");}}>
            {topStaffTopBtn}
          </button>
        </div>

        <div className="horizontal_div">
          <h2>Top Staff Bottom Key</h2>
          <button id="topStaffBottomBtn" className="action_btn" style={topStaffBottomStyle} onClick={() => { newActionKey("TopStaffBottom");}}>
            {topStaffBottomBtn}          </button>
        </div>

        <div className="horizontal_div">
          <h2>Staff Down Key</h2>
          <button id="staffDownBtn" className="action_btn" style={staffDownStyle} onClick={() => { newActionKey("StaffDown");}}>
            {staffDownBtn}
          </button>
        </div>

        <div className="horizontal_div">
          <h2>Bottom Staff Top Key</h2>
          <button id="bottomStaffTopBtn" className="action_btn" style={bottomStaffTopStyle} onClick={() => { newActionKey("BottomStaffTop");}}>
            {bottomStaffTopBtn}
          </button>
        </div>

        <div className="horizontal_div">
          <h2>Bottom Staff Bottom Key</h2>
          <button id="bottomStaffBottomBtn" className="action_btn" style={bottomStaffBottomStyle} onClick={() => { newActionKey("BottomStaffBottom");}}>
            {bottomStaffBottomBtn}
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