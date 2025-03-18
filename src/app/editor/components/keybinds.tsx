import { keybindsType } from "@/utils/helperTypes"
import { useEffect, useState } from "react"

export const Keybinds = () => {   

  // Settings metadata
  const [singleNoteBtn, setSingleNoteBtn] = useState<string>("S")
  const [turnNoteBtn, setTurnNoteBtn] = useState<string>("K")

  const [oneFourthSpeedBtn, setOneFourthSpeedBtn] = useState<string>("1")
  const [oneHalfSpeedBtn, setOneHalfSpeedBtn] = useState<string>("2")
  const [threeFourthSpeedBtn, setThreeFourthSpeedBtn] = useState<string>("3")
  const [fullSpeedBtn, setFullSpeedBtn] = useState<string>("4")

  const [snapBtn, setSnapBtn] = useState<string>("Q")
  const [toggleMusicBtn, setToggleMusicBtn] = useState<string>("P")
  // Have a div pop up at the top with something like "Map saved locally". It goes away after 2 seconds, and during that two seconds, disable the save command
  const [saveBtn, setSaveBtn] = useState<string>("U");

  const [disableMapping, setDisabedMapping] = useState<boolean>(false)
  const [disabledSave, setDisabedSave] = useState<boolean>(false)
  const [actionKey, setActionKey] = useState<string>("");


  // Grabbing local
  useEffect(() => {
    const localKeybinds = localStorage.getItem("keybinds");
    let updatedKeybinds: keybindsType
    if (!localKeybinds) {
      console.log("No Local Keybinds")
      updatedKeybinds = {
        sNote: "S",
        tNote: "T",
        oneFourthSpeed: "1",
        oneHalfSpeed: "2",
        threeFourthSpeed: "3",
        fullSpeed: "4",

        snap: "W",
        toggleMusic: "P",
        save: "Y"
      }
    }
    else {
      updatedKeybinds = JSON.parse(localKeybinds)
    }

    setSingleNoteBtn(updatedKeybinds.sNote)
    setTurnNoteBtn(updatedKeybinds.tNote)
    setOneFourthSpeedBtn(updatedKeybinds.oneFourthSpeed)
    setOneHalfSpeedBtn(updatedKeybinds.oneHalfSpeed)
    setThreeFourthSpeedBtn(updatedKeybinds.threeFourthSpeed)
    setFullSpeedBtn(updatedKeybinds.fullSpeed)

    setSnapBtn(updatedKeybinds.snap)
    setToggleMusicBtn(updatedKeybinds.toggleMusic)
    setSaveBtn(updatedKeybinds.save)

    localStorage.setItem("keybinds", JSON.stringify(updatedKeybinds))
  }, [])

  // Upload Keybinds
  const uploadKeybinds = () => {
    const newKeybinds : keybindsType = {
      sNote: singleNoteBtn,
      tNote: turnNoteBtn,
      oneFourthSpeed: oneFourthSpeedBtn,
      oneHalfSpeed: oneHalfSpeedBtn,
      threeFourthSpeed: threeFourthSpeedBtn,
      fullSpeed: fullSpeedBtn,
    
      snap: snapBtn,
      toggleMusic: toggleMusicBtn,
      save: saveBtn,
    }

    // Animation + Temporarily disable saving keybinds 
    setDisabedSave(true)
    setTimeout(() => {
      setDisabedSave(false)
    }, 1500)



    localStorage.setItem("keybinds", JSON.stringify(newKeybinds))
    // TO DO:
    // Params function to set keyinds to outer component
   // saveSettings(updateSettings)

  }

  // resetKeybinds
  const resetKeybinds = () => {
    const defaultKeybinds : keybindsType = {
      sNote: "S",
      tNote: "T",
      oneFourthSpeed: "1",
      oneHalfSpeed: "2",
      threeFourthSpeed: "3",
      fullSpeed: "4",

      snap: "W",
      toggleMusic: "P",
      save: "Y"
    }
    setSingleNoteBtn(defaultKeybinds.sNote)
    setTurnNoteBtn(defaultKeybinds.tNote)
    setOneFourthSpeedBtn(defaultKeybinds.oneFourthSpeed)
    setOneHalfSpeedBtn(defaultKeybinds.oneHalfSpeed)
    setThreeFourthSpeedBtn(defaultKeybinds.threeFourthSpeed)
    setFullSpeedBtn(defaultKeybinds.fullSpeed)

    setSnapBtn(defaultKeybinds.snap)
    setToggleMusicBtn(defaultKeybinds.toggleMusic)
    setSaveBtn(defaultKeybinds.save)

    // TODO: ANIMATION

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

  return (
    
    <div>
    <h2>Single Note Button</h2>
    <button onClick={() => {newActionKey("Single")}}>{singleNoteBtn}</button>

    <h2>Turn Note Button</h2>
    <button onClick={() => {newActionKey("Turn")}}>{turnNoteBtn}</button>

    <h2>0.25 Speed Button</h2>
    <button onClick={() => {newActionKey("0.25 Speed")}}>{oneFourthSpeedBtn}</button>

    <h2>0.50 Speed Button</h2>
    <button onClick={() => {newActionKey("0.50 Speed")}}>{oneHalfSpeedBtn}</button>

    <h2>0.75 Speed Button</h2>
    <button onClick={() => {newActionKey("0.75 Speed")}}>{threeFourthSpeedBtn}</button>

    <h2>1 Speed Button</h2>
    <button onClick={() => {newActionKey("FullSpeed")}}>{fullSpeedBtn}</button>

    <h2>Toggle Snapping Button</h2>
    <button onClick={() => {newActionKey("Snap")}}>{snapBtn}</button>
    
    <h2>Toggle Music Button</h2>
    <button onClick={() => {newActionKey("Music")}}>{toggleMusicBtn}</button>
    
    <h2>Save Map Button</h2>
    <button onClick={() => {newActionKey("Save")}}>{saveBtn}</button>
  
    <button disabled={disabledSave} onClick={() => {uploadKeybinds()}}>Save Keybinds</button>
    <button disabled={disabledSave} onClick={() => {resetKeybinds()}}>Reset Keybinds</button>
  </div>
  )

}