
import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useWavesurfer } from '@wavesurfer/react'
import { FixedSizeList as List } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import gsap from 'gsap';
import { useGSAP } from "@gsap/react";
import { keybindsType, editorMap } from "@/utils/helperTypes";

const barGradient = "linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 24%, rgba(255, 255, 255, 0.50) 24%, rgba(255, 255, 255, 0.50) 25%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 48.75%, rgba(255, 255, 255, 0.50) 48.75%, rgba(255, 255, 255, 0.50) 50%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 74%, rgba(255, 255, 255, 0.50) 74%, rgba(255, 255, 255, 0.50) 75%, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0) 100%) no-repeat scroll 0% 0% / 100% 100% padding-box border-box"
const gameGradient = "linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 24%, rgba(255, 255, 255, 0.25) 24%, rgba(255, 255, 255, 0.25) 25%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 49.25%, rgba(255, 255, 255, 0.25) 49.25%, rgba(255, 255, 255, 0.25) 50%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 74%, rgba(255, 255, 255, 0.25) 74%, rgba(255, 255, 255, 0.25) 75%, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0) 100%) no-repeat scroll 0% 0% / 100% 100% padding-box border-box";
const formatTime = (seconds: number) => [seconds / 60, seconds % 60, (seconds % 1) * 100].map((v) => `0${Math.floor(v)}`.slice(-2)).join(':')

// Call this when settings are saved 
const getKeyMapping = (key : string) => {
  const res = [(key === "Spacebar") ? " " : key.charAt(0).toUpperCase() + key.slice(1), (key === "Spacebar") ? " " : key.charAt(0).toLowerCase() + key.slice(1)]
  return res
}

// import Link from "next/link";

interface editorInterface {
  metadata : editorMap | null, //if null, that means a fresh map has to be made
  map_id: string,
  keybinds : keybindsType,
  songAudio: string,
  hitsoundsRef: {play : () => void;}[];
  clearMap : () => void;
  updateLocalMaps: () => void;
}

export const Editor = ({metadata, map_id, keybinds, songAudio, hitsoundsRef, clearMap, updateLocalMaps} : editorInterface) => {   
  const [songNotes, setSongNotes] = useState<string[][]>([])
  const [songLength, setSongLength] = useState<number>(0);    
  const [btn, setBtn] = useState<string>("Single Note");
  const [playBtnHold, setPlayBtnHold] = useState<boolean>(false);
  const [snapOn, setSnap] = useState<boolean>(true);


  // All of the metadata
  // When setting metadata, like description, disable the other buttons being activiated. Like when pressing "P" for the description, don't play the song 
  // const [timestamp, setTimestamp] = useState<string>(metadata?.timestamp || "")
  const [songName, setSongName] = useState<string>(metadata?.song_metadata.song_name || "")
  const [songArtist, setSongArtist] = useState<string>(metadata?.song_metadata.song_artist || "")
  const [songMapper, setSongMapper] = useState<string>(metadata?.song_metadata.song_mapper || "")
  const [bpm, setBPM] = useState<number>(metadata?.song_metadata.bpm || 0)
  const [genre, setGenre] = useState<string>(metadata?.song_metadata.genre || "")
  const [language, setLanguage] = useState<string>(metadata?.song_metadata.language || "")
  const [noteCount, setNoteCount] = useState<number>(metadata?.song_metadata.note_count || 0)
  const [description, setDescription] = useState<string>(metadata?.song_metadata.description || "");

  // Multiple Prompt states
  const [menu, setMenu] = useState<string>("") // Used for 
  const [returnPromptVisible, setReturnPrompt] = useState<boolean>(false);
  const [mapSaved, setMapSaved] = useState<boolean>(true) 
  const [pbRate, setPbRate] = useState<number>(1)
  const [disabledSave, setDisabledSave] = useState<boolean>(false)


  const waveformRef = useRef<HTMLDivElement>(null);

  const keybindMappings = {
    sNote: getKeyMapping(keybinds.sNote),
    tNote: getKeyMapping(keybinds.tNote),
    decreaseSpd: getKeyMapping(keybinds.decreaseSpd),
    increaseSpd: getKeyMapping(keybinds.increaseSpd),
  
    snap: getKeyMapping(keybinds.snap),
    toggleMusic: getKeyMapping(keybinds.toggleMusic)
  }

  const { wavesurfer, isReady, isPlaying, currentTime} = useWavesurfer({
    container: waveformRef,
    url: songAudio,
    waveColor: 'rgba(63, 66, 221, 0.57)',
    progressColor: 'rgb(112, 62, 158)',
    cursorColor: 'rgb(223, 0, 0)',
    autoCenter: true,
    autoScroll: true,
    minPxPerSec: 256,
    height: 'auto', // reminder that this is not responsive. Height gets filled to div height only on intiailizing
    fillParent: true, // sets width to the width of the div
    hideScrollbar: false,
    dragToSeek: true,
  })

  // Set Stage depending on if a map was passed or if this is new
  useEffect(() => {
    if (isReady) {
      if (wavesurfer) {
        const duration = wavesurfer.getDuration()
        const tempNotes = Array.from({ length: 4 }, () => new Array(Math.floor(((duration) * 16) + 1)).fill(""));
        console.log(metadata)
        if (metadata) {
          for (let i = 0; i < metadata.song_notes[0].length; i++) {
            tempNotes[0][i] = metadata.song_notes[0][i]
            tempNotes[1][i] = metadata.song_notes[1][i]
            tempNotes[2][i] = metadata.song_notes[2][i]
            tempNotes[3][i] = metadata.song_notes[3][i]
          }
          setSongNotes(tempNotes)
          setSongLength((duration * 16) + 1);
        }
        else {
          setSongLength((duration * 16) + 1);
          setSongNotes(tempNotes);    
        }
        console.log("Please exit Inspect Mode. Performance degrades if music plays within inspector is open")
      }
    }
  }, [isReady])

  useEffect(() => {
    const handleKeyDown = (event: {key: string; repeat: boolean}) => {
      if (event.repeat) return;

      if (event.key === keybindMappings.sNote[0] || event.key === keybindMappings.sNote[1]) {
      }

      else if (event.key === keybindMappings.tNote[0] || event.key === keybindMappings.tNote[1]) {
      }
      
      else if (event.key === keybindMappings.decreaseSpd[0] || event.key === keybindMappings.decreaseSpd[1]) {
      }

      else if (event.key === keybindMappings.increaseSpd[0] || event.key === keybindMappings.increaseSpd[1]) {
      }

      else if (event.key === keybindMappings.snap[0] || event.key === keybindMappings.snap[1]) {
      }

      else if (event.key === keybindMappings.toggleMusic[0] || event.key === keybindMappings.toggleMusic[1]) {
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener on unmount
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [])

  // const onPlayPause = useCallback(() => {
  //   if (wavesurfer) {
  //     wavesurfer.playPause()
  //   }
  // }, [wavesurfer])
  const onPlayPause = () => {
    if (wavesurfer) {
      wavesurfer.playPause()
    }
    // wavesurfer && wavesurfer.playPause()
  }

  const listRef = useRef<List>(null);
  const vListRef = useRef<List>(null);
  
  const itemIndex = useMemo(() => {
    return Math.floor(currentTime * 16);
  }, [currentTime]);

  useEffect(() => {
    if (itemIndex && isPlaying){
      const offset : number = (itemIndex % 3)
      if (songNotes[0][itemIndex] === "S" || songNotes[0][itemIndex] === "T") {
        hitsoundsRef[0 + 3*offset].play();
      }
      if (songNotes[1][itemIndex] === "S") {
        hitsoundsRef[1 + 3*offset].play();
      }
      if (songNotes[2][itemIndex] === "S" || songNotes[2][itemIndex] === "T") {
        hitsoundsRef[2 + 3*offset].play();
      }
      if (songNotes[3][itemIndex] === "S") {
        hitsoundsRef[3 + 3*offset].play();
      }
    }
  }, [itemIndex, isPlaying]);

  useEffect(() => {
    const handleKeyDown = (event: { key: string; repeat: boolean}) => {
      if (event.repeat) return;
      // This comes after what buttons are allowed in the editor
      console.log(event.key)
      if (event.key === 'n' || event.key === 'N') {
        console.log(songNotes)
      }
      if (event.key === 'q' || event.key === 'Q') {
        if (playBtnHold) return
        setPlayBtnHold(true)
        onPlayPause();
      }
      if (isPlaying) return; // If spamming keys while play, big lag spike as the rerenders hurt transformations
      if (event.key === 's' || event.key === 'S') {
        setBtn("Single Note")
      }      
      // Used for helping to map songs
      if (event.key === 'k' || event.key === 'K') {
        // console.log(songNotes);
        setBtn("Turn Note");
      }      
    }
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, playBtnHold, songNotes]);


  useEffect(() => {
    const handleKeyUp = (event: { key: string; }) => {
      if (event.key === 'q' || event.key === 'Q') {
        setPlayBtnHold(false)
      }
    }
    document.addEventListener('keyup', handleKeyUp);

    // Cleanup the event listener on unmount
    return () => {
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const changeNoteVer = (index: number, event: MouseEvent<HTMLParagraphElement>) => {
    const hero_list_info = document.getElementById('hero_editor')?.getBoundingClientRect();
    let mousePlacement;
    let hero_width;
    if (hero_list_info) {
      mousePlacement = event.clientX - hero_list_info.left
      hero_width = hero_list_info.right - hero_list_info.left
    }

    if (!mousePlacement || !hero_width) return;
    const oneFourth = hero_width * (1/4)
    const twoFourths = hero_width * (2/4)
    const threeFourths = hero_width * (3/4)

    if (0 < mousePlacement && mousePlacement <= oneFourth) { // First Bar
      console.log("First Bar")
      if (songNotes[2][index] === "S" || songNotes[2][index] === "T" || songNotes[3][index] === "S") {
        return
      }
      if (btn === "Turn Note") {
        setDoubleNote(0, 1, index)
      }
      else {
        setNewNote(0, 1, index, "S");
      }
    }
    else if (oneFourth < mousePlacement && mousePlacement <= twoFourths) { // Second Bar
      console.log("Second Bar")
      if (songNotes[2][index] === "S" || songNotes[2][index] === "T" || songNotes[3][index] === "S") {
        return
      }
      if (btn === "Turn Note") {
        setDoubleNote(0, 1, index)
      }
      else {
        setNewNote(1, 0, index, "S");
      }
    }
    else if (twoFourths < mousePlacement && mousePlacement <= threeFourths) { // Third Bar
      console.log("Third Bar")
      if (songNotes[0][index] === "S" || songNotes[0][index] === "T" || songNotes[1][index] === "S") {
        return
      }
      if (btn === "Turn Note") {
        setDoubleNote(2, 3, index)
      }
      else {
        setNewNote(2, 3, index, "S");
      }
    }
    else if (threeFourths < mousePlacement && mousePlacement <= hero_width) { // Fourth Bar
      console.log("Fourth Bar")
      if (songNotes[0][index] === "S" || songNotes[0][index] === "T" || songNotes[1][index] === "S") {
        return
      }
      if (btn === "Turn Note") {
        setDoubleNote(2, 3, index)
      }
      else {
        setNewNote(3, 2, index, "S");
      }
    }
    scrollWindow(index) //This should now only shift if a note can be validly placed 
  };

  const setDoubleNote = (firstBar: number, secondBar: number, index: number) => {
    let difference = 0
    let selfDeletion = false
    const newNotes = songNotes.map((songBar, barIndex) => {
      if (barIndex === firstBar || barIndex === secondBar) {
        return songBar.map((n, nIndex) => {
          if (nIndex === index) {
            if (n === "T") {
              selfDeletion = true
              return ""
            }
            else if (n === "S") {
              difference -= 1
              return "T"
            }
            else {
              return "T"
            }
          }
          else {
            return n
          }
        })
      }
      else {
        return songBar
      }
    })
    if (selfDeletion) {
      setNoteCount(prevCount => prevCount - 1)
    }
    else {
      setNoteCount(prevCount => prevCount + difference + 1)
    }
    setSongNotes(newNotes)
  }  

  const setNewNote = (bar : number, otherBar: number, index:number, note:string) => {
    let difference = 0
    const newNotes = songNotes.map((songBar, barIndex) => {
      if (barIndex === bar) {
        return songBar.map((n, nIndex) => {
          if (nIndex === index) {
            if (n === note) {
              difference -= 1
              return ""
            }
            else if (n === "T") {
              return note
            }
            else {
              difference += 1
              return note
            }
          }
          else {
            return n
          }
        })
      }
      if (barIndex === otherBar) {
        return songBar.map((n, nIndex) => {
          if (nIndex === index) {
            if (n === "T") {
              return ""
            }
            else {
              return n
            }
          }
          else {
            return n
          }
        })
      }
      else {
        return songBar
      }
    })
    setSongNotes(newNotes)
    setNoteCount(prevCount => prevCount + difference)
  }

  const HRows = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const gameBarStyle =(index: number) => {

    const verticalGradients = [
      songNotes[0][index] === 'T' ? "linear-gradient(to bottom, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 25% 100% padding-box border-box" : songNotes[0][index] === 'S' ? "linear-gradient(to bottom, rgb(184, 184, 184) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 25% 100% padding-box border-box" : "linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 25% 100% padding-box border-box",
      songNotes[1][index] === 'T' ? "linear-gradient(to bottom, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 33.3% 0% / 25% 100% padding-box border-box" : songNotes[1][index] === 'S' ? "linear-gradient(to bottom, rgb(184, 184, 184) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 33.3% 0% / 25% 100% padding-box border-box" : "linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 33.3% 0% / 25% 100% padding-box border-box",
      songNotes[2][index] === 'T' ? "linear-gradient(to bottom, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 66.6% 0% / 25% 100% padding-box border-box" : songNotes[2][index] === 'S' ? "linear-gradient(to bottom, rgb(184, 184, 184) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 66.6% 0% / 25% 100% padding-box border-box" : "linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 66.6% 0% / 25% 100% padding-box border-box",
      songNotes[3][index] === 'T' ? "linear-gradient(to bottom, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 99.9% 0% / 25% 100% padding-box border-box" : songNotes[3][index] === 'S' ? "linear-gradient(to bottom, rgb(184, 184, 184)50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 99.9% 0% / 25% 100% padding-box border-box" : "linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 99.9% 0% / 25% 100% padding-box border-box",
    ];
  
    const updatedBG = `${gameGradient}, ${verticalGradients.join(", ")}`;
  
    return {
      background: updatedBG,
    };
  }
  
    return (
      <div
        className="hero_bar"
        onClick={(event) => changeNoteVer(index, event)}
        style={{ ...style, ...gameBarStyle(index) }} 
      >
      </div>
    );
  };

  const VRow = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const barStyle = (index: number) => {
      
      const horizontalGradients = [
        songNotes[0][index] === 'T' ? "linear-gradient(to right, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 100% 25% padding-box border-box" : songNotes[0][index] === 'S' ? "linear-gradient(to right, rgb(184, 184, 184) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 100% 25% padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 100% 25% padding-box border-box",
        songNotes[1][index] === 'T' ? "linear-gradient(to right, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 33.3% / 100% 25% padding-box border-box" : songNotes[1][index] === 'S' ? "linear-gradient(to right, rgb(184, 184, 184) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 33.3% / 100% 25% padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 33.3% / 100% 25% padding-box border-box",
        songNotes[2][index] === 'T' ? "linear-gradient(to right, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 66.6% / 100% 25% padding-box border-box" : songNotes[2][index] === 'S' ? "linear-gradient(to right, rgb(184, 184, 184) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 66.6% / 100% 25% padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 66.6% / 100% 25% padding-box border-box",
        songNotes[3][index] === 'T' ? "linear-gradient(to right, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 99.9% / 100% 25% padding-box border-box" : songNotes[3][index] === 'S' ? "linear-gradient(to right, rgb(184, 184, 184) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 99.9% / 100% 25% padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 99.9% / 100% 25% padding-box border-box",
      ];
    
      const updatedBG = `${barGradient}, ${horizontalGradients.join(", ")}`;
    
      return {
        background: updatedBG,
      };
    };
  
    return (
      <div
        className="waveform_bar"
        style={{ ...style, ...barStyle(index) }} 
      >
      </div>
    );
  };

  const saveMap = () => {
    const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");
    
    if (!map_id) {
      console.error("Map ID is not defined");
      return;
    }

    localMaps[map_id] = {
      timestamp : Date.now(),
      song_metadata : {
        song_name: songName,
        song_artist: songArtist,
        song_mapper: songMapper,
        bpm: bpm,
        genre: genre,
        language: language,
        note_count: noteCount,
        description: description
      },
      song_notes : songNotes
    }
    localStorage.setItem("localMaps", JSON.stringify(localMaps));
    updateLocalMaps();
    console.log("Updated Map")
    setDisabledSave(true)
    saveAnimation();
    setTimeout(()=> {
      setDisabledSave(false)
    }, 1500)
  }

  const closeEditor = () => {
    if (menu === "Return") {
      setMapSaved(false)
      setReturnPrompt(false)
      setMenu("")
      return
    };
    const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");

    const currentMap = {
      timestamp: metadata?.timestamp || "",
      song_metadata : {
        song_name: songName,
        song_artist: songArtist,
        song_mapper: songMapper,
        bpm: bpm,
        genre: genre,
        language: language,
        note_count: noteCount,
        description: description
      },
      song_notes : songNotes
    }

    if (map_id in localMaps) {
      console.log(localMaps[map_id])
      console.log(currentMap)
      const isEqual = JSON.stringify({
        song_metadata: currentMap.song_metadata,
        song_notes: currentMap.song_notes
      }) === JSON.stringify({
        song_metadata: localMaps[map_id].song_metadata,
        song_notes: localMaps[map_id].song_notes
      });
      
      console.log(isEqual)
      setMapSaved(isEqual)
      setReturnPrompt(true)
      setMenu("Return")
    }
    else {
      setMapSaved(false)
      setReturnPrompt(true)
      setMenu("Return")
    }

    // localStorage.setItem("localMaps", JSON.stringify(localMaps));
    console.log("Closed Editor")
  }

  // Scrolling Work:
  // useEffect(() => {
  //   if (wavesurfer) {
  //     const onScroll = () => {
  //       const scroll = wavesurfer.getScroll();
  //       // if (vListRef.current && scroll !== vListRef.current.state.scrollOffest) {
        
  //       if (vListRef.current) {
  //         vListRef.current.scrollTo(scroll)
  //         console.log("vList", scroll, vListRef.current)
  //         // console.log(scroll, vListRef.current.state.scrollOffest)
  //       }
  //     };
  //     wavesurfer.on('scroll', onScroll); // Update on manual scroll
  //     // wavesurfer.on('timeupdate', onScroll); // Update on playback

  //     return () => {
  //       wavesurfer.un('scroll', onScroll);
  //       // wavesurfer.un('timeupdate', onScroll); // Update on playback
  //     };
  //   }
  // }, [wavesurfer]);

  // const scrollPositionRef = useRef<number>(0);


  // useEffect(() => {
  //   if (wavesurfer) {
  //     const onScroll = () => {
  //       const scroll = wavesurfer.getScroll();
  
  //       // Prevent unnecessary updates if the scroll position hasn't changed
  //       if (vListRef.current && vListRef.current.state) {
  //         const state = vListRef.current.state as ListState;
  //         if (scroll !== state.scrollOffset) {
  //           vListRef.current.scrollTo(scroll);
  //           console.log("vList", scroll, state);
  //         }
  //       }
  //     };
  
  //     wavesurfer.on('scroll', onScroll); // Update on manual scroll
  //     // wavesurfer.on('timeupdate', onScroll); // Update on playback
  
  //     return () => {
  //       wavesurfer.un('scroll', onScroll);
  //       // wavesurfer.un('timeupdate', onScroll); // Update on playback
  //     };
  //   }
  // }, [wavesurfer]);
  const { contextSafe } = useGSAP();

  const saveAnimation = contextSafe(() => {
    gsap.to("#beatmap_save_tooltip", {visibility: "visible", opacity: 1, yoyo: true, repeat: 1, duration:0.75})
  })

  const scrollPositionRef = useRef<number>(0);

// Updated useEffect
  useEffect(() => {
    if (wavesurfer) {
      const onScroll = () => {
        const scroll = wavesurfer.getScroll();
        // Check if scroll position has changed before updating
        if (scroll !== scrollPositionRef.current) {
          scrollPositionRef.current = scroll;  // Update the scroll position in the ref
          if (vListRef.current) {
            vListRef.current.scrollTo(scroll);
            // console.log("vList", scroll);
          }
        }
      };

      wavesurfer.on('scroll', onScroll); // Listen for scroll events

      return () => {
        wavesurfer.un('scroll', onScroll); // Cleanup on component unmount
      };
    }
  }, [wavesurfer]);  // Only re-run the effect if `wavesurfer` changes

  useEffect(() => {
    if (listRef.current && isPlaying) {
      listRef.current.scrollTo(currentTime * 16 * 16)
      // console.log("snap,useEffect", currentTime)
    }
  }, [currentTime, isPlaying])

  function scrollWindow(index : number)  {
    setTimeout(() => {
      if (wavesurfer) {
        wavesurfer.setTime(index / 16)
        if (listRef.current && snapOn) listRef.current.scrollTo(index * 16)
        // console.log("scrollWindow")
      }
    }, 125)
  }
  
  const updatePBRate = (rate: number) => {
    if (wavesurfer) {
      wavesurfer.setPlaybackRate(rate);
      setPbRate(rate)
      // console.log("updatePBRate")
    }
  }

  const updateTime = (event: {scrollOffset: number}) => {
    // if (isPlaying) return;
    // if (wavesurfer) {
    //   wavesurfer.setTime(event.scrollOffset / 256)
    // } 
    if (isPlaying) return; // Prevent updates while playing
    if (wavesurfer) {
      const newTime = event.scrollOffset / 256;
      // Only update if the time has actually changed
      if (wavesurfer.getCurrentTime() !== newTime) {
        wavesurfer.setTime(newTime);
        // console.log("updateTime", event.scrollOffset)
      }
    }
  }

  const singleBtnStyle = {
    backgroundColor: (btn === "Single Note")? "rgb(145, 168, 154)" : "#3a4447" 
  }
  
  const turnBtnStyle = {
    backgroundColor: (btn === "Turn Note")? "rgb(145, 168, 154)" : "#3a4447" 
  }
  const returnStyle = {
    visibility: (menu === "Return")? "visible" : "hidden",
    opacity: (menu === "Return")? 1 : 0,
    transition: 'opacity 500ms ease, visibility 500ms'
  } as React.CSSProperties

  return (
    <div id="editor_page">
      <div id="wave_bars">
        <div id="waveform_container" ref={waveformRef}>
        </div>

        <div id="waveform_bars">
          <AutoSizer>
            {({height, width}) => (
              <List
              ref={vListRef}
              className="no_scrollbar"
              height={height} 
              itemCount={songLength} 
              itemSize={16} 
              layout="horizontal"
              width={width} 
              >
                {VRow}
              </List>
            )}
          </AutoSizer>
        </div>
      </div>

      <div id="hero_section">
        <div id="left_hero">
          <h2>{formatTime(currentTime)} <br/> Song Length: {formatTime((songLength- 1) / 16)}</h2>
          <div id="metadata_wrapper">
            <h1>Metadata: </h1>
            <label htmlFor="songName">Song Name:</label>
            <input 
              className="metadata_input"
              name="songName" 
              id="songName"
              type="text" 
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
            ></input>
            
            <label htmlFor="songArtist">Song Artist:</label>
            <input 
              className="metadata_input"
              name="songArtist" 
              id="songArtist"
              type="text" 
              value={songArtist}
              onChange={(e) => setSongArtist(e.target.value)}
            ></input>
            
            <label htmlFor="songMapper">Song Mapper:</label>
            <input 
              className="metadata_input"
              name="songMapper" 
              id="songMapper"
              type="text" 
              value={songMapper}
              onChange={(e) => setSongMapper(e.target.value)}
            ></input>
            
            <label htmlFor="songBPM">BPM:</label>
            <input 
              className="metadata_input"
              name="songBPM" 
              id="songBPM"
              type="number" 
              value={bpm}
              onChange={(e) => setBPM(parseInt(e.target.value))}
            ></input>
            
            <label htmlFor="songGenre">Genre:</label>
            <input 
              className="metadata_input"
              name="songGenre" 
              id="songGenre"
              type="text" 
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            ></input>
            
            <label htmlFor="songLanguage">Language:</label>
            <input
              className="metadata_input" 
              name="songLanguage" 
              id="songLanguage"
              type="text" 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            ></input>
            
            <label htmlFor="songDescription">Description:</label>
            <input 
              className="metadata_input"
              name="songDescription" 
              id="songDescription"
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></input>
            <h2>Note Count: <br/>{noteCount}</h2>
          </div>
          <button disabled={disabledSave} id="beatmap_save_btn" onClick={() => {saveMap()}}>Save Locally
            <h2 id="beatmap_save_tooltip">Beatmap Saved</h2>
          </button>

          <button onClick={() => {closeEditor()}}>Return</button>
        </div>

        <div id="hero_list">
          <div id="hero_editor">
            <div id="current_bar"></div>
            <AutoSizer>
              {({height, width}) => (
                <List
                ref={listRef}
                className="scrollbar"
                height={height}
                itemCount={songLength}
                onScroll={updateTime}
                itemSize={16} 
                width={width} 
                >
                  {HRows}
                </List>
              )}
            </AutoSizer>
          </div>
        </div>
        
        <div id="right_hero">
          <div id="play_speed">
            <button onClick={onPlayPause}>
              {isPlaying? 
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-pause-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0z"/>
              </svg>
              :<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-play-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445"/>
              </svg>
              }
            </button>
            <div id="pr_btn_container">
              <h2>Playback Rate</h2>
              <div>
                <button style={{color: (pbRate === 0.25)? "#91a89a" : "#0b7033"}} className="playrate_btns" onClick={() => {updatePBRate(0.25)}}>0.25</button>
                <button style={{color: (pbRate === 0.50)? "#91a89a" : "#0b7033"}} className="playrate_btns" onClick={() => {updatePBRate(0.50)}}>0.50</button>
                <button style={{color: (pbRate === 0.75)? "#91a89a" : "#0b7033"}} className="playrate_btns" onClick={() => {updatePBRate(0.75)}}>0.75</button>
                <button style={{color: (pbRate === 1)? "#91a89a" : "#0b7033"}} className="playrate_btns" onClick={() => {updatePBRate(1)}}>1</button>
              </div>
            </div>
          </div>
          

          <button className="styledBtns" onClick={() => {setSnap(prevSnap => !prevSnap)}}>Snap {snapOn? "On" : "Off"}</button>
          <div id="notes">
            <button className="styledBtns" style={singleBtnStyle} onClick={() => {setBtn("Single Note")}}>Single Note</button>
            <button className="styledBtns" style={turnBtnStyle} onClick={() => {setBtn("Turn Note")}}>Turn Note</button>
          </div>
          <button disabled={true} className="styledBtns">Deploy</button>
        </div>
      
      </div>
      {/* Change song_mapper to user when I pass into this component. If not logged in, have a note that says "Only registered accounts can upload maps to the internet" */}

      <div id="return_wrapper" style={returnStyle}>
        {(returnPromptVisible) && 
        <div id="return_div">
        
          <h2>You are about to exit the editor. Are you sure?</h2>
          <h3>{mapSaved? "All changes are Saved" : "You have Unsaved Changes"}</h3>
          <div id="editor_exit">
            <button onClick={() => {
              setMenu("")
              setTimeout(() => {
                setReturnPrompt(false)
              }, 500)
            }}>No, Return to Editor</button>
            <button onClick={() => {
              clearMap()
            }}>Yes, Exit the Editor</button>
          </div>  
          
        </div>
        }
      </div>
    </div>
  );

}