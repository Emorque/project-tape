
import { ChangeEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWavesurfer } from '@wavesurfer/react'
import { FixedSizeList as List } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";

import { keybindsType } from "@/utils/helperTypes";

const barGradient = "linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 24%, rgba(255, 255, 255, 0.50) 25%, rgba(255, 255, 255, 0.50) 25%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 49.50%, rgba(255, 255, 255, 0.50) 50%, rgba(255, 255, 255, 0.50) 50%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 74%, rgba(255, 255, 255, 0.50) 75%, rgba(255, 255, 255, 0.50) 75%, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0) 100%) no-repeat scroll 0% 0% / 100% 100% padding-box border-box"
const gameGradient = "linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 24%, rgba(255, 255, 255, 0.25) 25%, rgba(255, 255, 255, 0.25) 25%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 49.50%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.25) 50%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 74%, rgba(255, 255, 255, 0.25) 75%, rgba(255, 255, 255, 0.25) 75%, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0) 100%) no-repeat scroll 0% 0% / 100% 100% padding-box border-box";
const formatTime = (seconds: number) => [seconds / 60, seconds % 60, (seconds % 1) * 100].map((v) => `0${Math.floor(v)}`.slice(-2)).join(':')

// Call this when settings are saved 
const getKeyMapping = (key : string) => {
  const res = [(key === "Spacebar") ? " " : key.charAt(0).toUpperCase() + key.slice(1), (key === "Spacebar") ? " " : key.charAt(0).toLowerCase() + key.slice(1)]
  return res
}

// import Link from "next/link";

interface editorInterface {
  keybinds : keybindsType
}

export const Editor = ({keybinds} : editorInterface) => {   
const [audioURL, setAudioURL] = useState<string>("")
  const [songLength, setSongLength] = useState<number>(0);    
  const [btn, setBtn] = useState<string>("Single Note");
  const [songNotes, setSongNotes] = useState<string[][]>([]);
  const [playBtnHold, setPlayBtnHold] = useState<boolean>(false);
  const [snapOn, setSnap] = useState<boolean>(true);

  // All of the metadata
  // When setting metadata, like description, disable the other buttons being activiated. Like when pressing "P" for the description, don't play the song 
  const [songName, setSongName] = useState<string>("")
  const [songArtist, setSongArtist] = useState<string>("")
  const [songMapper, setSongMapper] = useState<string>("")
  const [bpm, setBPM] = useState<number>(0)
  const [genre, setGenre] = useState<string>("")
  const [language, setLanguage] = useState<string>("")
  const [noteCount, setNoteCount] = useState<number>(0)
  const [description, setDescription] = useState<string>("");

  const waveformRef = useRef<HTMLDivElement>(null);
  const hitsoundsRef = useRef<{ play: () => void; }[]>([]);

  const keybindMappings = {
    sNote: getKeyMapping(keybinds.sNote),
    tNote: getKeyMapping(keybinds.tNote),
    decreaseSpd: getKeyMapping(keybinds.decreaseSpd),
    increaseSpd: getKeyMapping(keybinds.increaseSpd),
  
    snap: getKeyMapping(keybinds.snap),
    toggleMusic: getKeyMapping(keybinds.toggleMusic)
  }

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


  const { wavesurfer, isReady, isPlaying, currentTime } = useWavesurfer({
    container: waveformRef,
    url: audioURL,
    waveColor: 'rgba(138, 138, 19, 0.37)',
    progressColor: 'rgb(58, 49, 49)',
    cursorColor: 'rgb(250, 93, 93)',
    autoCenter: true,
    autoScroll: true,
    minPxPerSec: 256,
    height: 'auto', // reminder that this is not responsive. Height gets filled to div height only on intiailizing
    fillParent: true, // sets width to the width of the div
    hideScrollbar: false,
    dragToSeek: true,
  })

  // This must be done in a "main menu" page
  const audioChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioURL(URL.createObjectURL(file));    
    const tempHitsounds: { play: () => void; }[] = []
    for (let i = 0; i < 12; i++) {
      const hitsound  = new Audio('/hitsound.mp3');
      hitsound.volume = 1
      tempHitsounds.push(hitsound);
    } 
    hitsoundsRef.current = tempHitsounds;
  }, []);

  const onPlayPause = useCallback(() => {
    if (wavesurfer) {
      wavesurfer.playPause()
    }
  }, [wavesurfer])

  useEffect(() => {
    if (wavesurfer) {
      const onScroll = () => {
        const scroll = wavesurfer.getScroll();
        if (vListRef.current) {
          vListRef.current.scrollTo(scroll)
        }
      };

      // wavesurfer.on('timeupdate', onScroll); // Update on playback
      wavesurfer.on('scroll', onScroll); // Update on manual scroll

      return () => {
        // wavesurfer.un('timeupdate', onScroll);
        wavesurfer.un('scroll', onScroll);
      };
    }
  }, [wavesurfer]);

  useEffect(() => {
    if (listRef.current && snapOn) {
      listRef.current.scrollTo(currentTime * 16 * 16)
    }
  }, [currentTime, snapOn])
  

  const listRef = useRef<List>(null);
  const vListRef = useRef<List>(null);

  useEffect(() => {
    if (wavesurfer){
      const duration = wavesurfer.getDuration()
      setSongLength((duration * 16) + 1);
      setSongNotes(Array.from({ length: 4 }, () => new Array(Math.floor(((duration) * 16) + 1)).fill("")));
      }
  }, [isReady])

  const itemIndex = useMemo(() => {
    return Math.floor(currentTime * 16);
  }, [currentTime]);

  useEffect(() => {
    if (itemIndex && isPlaying){
      const offset : number = (itemIndex % 3)
      if (songNotes[0][itemIndex] === "S" || songNotes[0][itemIndex] === "T") {
        hitsoundsRef.current[0 + 3*offset].play();
      }
      if (songNotes[1][itemIndex] === "S") {
        hitsoundsRef.current[1 + 3*offset].play();
      }
      if (songNotes[2][itemIndex] === "S" || songNotes[2][itemIndex] === "T") {
        hitsoundsRef.current[2 + 3*offset].play();
      }
      if (songNotes[3][itemIndex] === "S") {
        hitsoundsRef.current[3 + 3*offset].play();
      }
    }
  }, [itemIndex, isPlaying]);

  // const saveSettings = () => {

  // }

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

  function scrollWindow(index : number)  {
    setTimeout(() => {
      if (wavesurfer) {
        wavesurfer.setTime(index / 16)
      }
    }, 125)
  }

  const changeNoteVer = (index: number, event: MouseEvent<HTMLParagraphElement>) => {
    const hero_list_info = document.getElementById('hero_list')?.getBoundingClientRect();
    let mousePlacement;
    let hero_width;
    if (hero_list_info) {
      mousePlacement = event.clientX - hero_list_info.left
      hero_width = hero_list_info.right - hero_list_info.left
    }
    // const temp = event.clientX - (document.getElementById('hero_list')?.getBoundingClientRect().left as number)
    // console.log(mousePlacement);
    // console.log(temp)
    // console.log(hero_width)

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
      songNotes[0][index] === 'T' ? "linear-gradient(to bottom, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 25% 100% padding-box border-box" : songNotes[0][index] === 'S' ? "linear-gradient(to bottom, rgb(25, 87, 128) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 25% 100% padding-box border-box" : "linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 25% 100% padding-box border-box",
      songNotes[1][index] === 'T' ? "linear-gradient(to bottom, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 33.3% 0% / 25% 100% padding-box border-box" : songNotes[1][index] === 'S' ? "linear-gradient(to bottom, rgb(182, 34, 34) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 33.3% 0% / 25% 100% padding-box border-box" : "linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 33.3% 0% / 25% 100% padding-box border-box",
      songNotes[2][index] === 'T' ? "linear-gradient(to bottom, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 66.6% 0% / 25% 100% padding-box border-box" : songNotes[2][index] === 'S' ? "linear-gradient(to bottom, rgb(25, 87, 128) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 66.6% 0% / 25% 100% padding-box border-box" : "linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 66.6% 0% / 25% 100% padding-box border-box",
      songNotes[3][index] === 'T' ? "linear-gradient(to bottom, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 99.9% 0% / 25% 100% padding-box border-box" : songNotes[3][index] === 'S' ? "linear-gradient(to bottom, rgb(182, 34, 34) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 99.9% 0% / 25% 100% padding-box border-box" : "linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 99.9% 0% / 25% 100% padding-box border-box",
    ];
  
    const updatedBG = `${gameGradient}, ${verticalGradients.join(", ")}`;
  
    return {
      background: updatedBG,
    };
  }
  
    return (
      <div
        className="v-bar"
        onClick={(event) => changeNoteVer(index, event)}
        style={{ ...style, ...gameBarStyle(index) }} 
      >
      </div>
    );
  };

  const VRow = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const barStyle = (index: number) => {
      
      const horizontalGradients = [
        songNotes[0][index] === 'T' ? "linear-gradient(to right, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 100% 25% padding-box border-box" : songNotes[0][index] === 'S' ? "linear-gradient(to right, rgb(25, 87, 128) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 100% 25% padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 100% 25% padding-box border-box",
        songNotes[1][index] === 'T' ? "linear-gradient(to right, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 33.3% / 100% 25% padding-box border-box" : songNotes[1][index] === 'S' ? "linear-gradient(to right, rgb(182, 34, 34) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 33.3% / 100% 25% padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 33.3% / 100% 25% padding-box border-box",
        songNotes[2][index] === 'T' ? "linear-gradient(to right, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 66.6% / 100% 25% padding-box border-box" : songNotes[2][index] === 'S' ? "linear-gradient(to right, rgb(25, 87, 128) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 66.6% / 100% 25% padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 66.6% / 100% 25% padding-box border-box",
        songNotes[3][index] === 'T' ? "linear-gradient(to right, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 99.9% / 100% 25% padding-box border-box" : songNotes[3][index] === 'S' ? "linear-gradient(to right, rgb(182, 34, 34) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 99.9% / 100% 25% padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 99.9% / 100% 25% padding-box border-box",
      ];
    
      const updatedBG = `${barGradient}, ${horizontalGradients.join(", ")}`;
    
      return {
        background: updatedBG,
      };
    };
  
    return (
      <div
        className="i-bar"
        style={{ ...style, ...barStyle(index) }} 
      >
      </div>
    );
  };

  const updatePBRate = (rate: number) => {
    if (wavesurfer) {
      wavesurfer.setPlaybackRate(rate);
    }
  }

  // const roundNote = (note: number) => {
  //   return Math.round(note / 10) * 10
  // }

  // const exportMap = () => {
  //   const exportedMap = []
  //   for (let i = 0; i < songNotes[0].length; i++) {
  //     if (songNotes[0][i] === "S") {
  //       exportedMap.push([roundNote(i * 62.5), "FL"])
  //     }
  //     else if (songNotes[0][i] === "T") {
  //       exportedMap.push([roundNote(i * 62.5), "FT"])
  //     }
  //     if (songNotes[1][i] === "S") {
  //       exportedMap.push([roundNote(i * 62.5), "FR"])
  //     }
  //     if (songNotes[2][i] === "S") {
  //       exportedMap.push([roundNote(i * 62.5), "SL"])
  //     }
  //     else if (songNotes[2][i] === "T") {
  //       exportedMap.push([roundNote(i * 62.5), "ST"])
  //     }
  //     if (songNotes[3][i] === "S") {
  //       exportedMap.push([roundNote(i * 62.5), "SR"])
  //     }
  //   }
  //   localStorage.setItem("customMap", JSON.stringify(exportedMap))
  //   if (localStorage.getItem("customMap")) {
  //     alert("Map saved locally")
  //   }
  // }

  // const handleTimeChange = (event : React.ChangeEvent<HTMLInputElement>) => {
  //   console.log("hi", event);
  //   if (wavesurfer) {
  //     wavesurfer.setTime(parseFloat(event.target.value) / 16)
  //   }
  // }

  const updateTime = (event: {scrollOffset: number}) => {
    if (isPlaying) return;
    console.log("updateTime", event.scrollOffset)
    if (wavesurfer) {
      wavesurfer.setTime(event.scrollOffset / 256)
    } 
  }

  const singleBtnStyle = {
    backgroundColor: (btn === "Single Note")? "green" : "red" 
  }
  
  const turnBtnStyle = {
    backgroundColor: (btn === "Turn Note")? "green" : "red" 
  }



  return (
    <div id="editor_page">
      <div id="wave_bars">
        <div id="waveform-Container" ref={waveformRef}>
        </div>

        <div id="vBars-Container">
          <AutoSizer>
            {({height, width}) => (
              <List
              ref={vListRef}
              className="hideScrollbar2"
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
        <p>{formatTime(currentTime)}</p>
        <p>Note Count: {noteCount}</p>
        <input type="file" accept='audio/*' onChange={audioChange}/>
          <div>
            <button style={singleBtnStyle} onClick={() => {setBtn("Single Note")}}>Single Note</button>
            <button style={turnBtnStyle} onClick={() => {setBtn("Turn Note")}}>Turn Note</button>
          </div>
          <button>Return</button>
        </div>

        <div id="hero_list">
          <div id="list_wrapper">
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
          <button onClick={onPlayPause} style={{ minWidth: '5em' }}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <div>
            <p>Playback Rate</p>
            <div>
              <button onClick={() => {updatePBRate(0.25)}}>0.25</button>
              <button onClick={() => {updatePBRate(0.50)}}>0.50</button>
              <button onClick={() => {updatePBRate(0.75)}}>0.75</button>
              <button onClick={() => {updatePBRate(1)}}>1</button>
            </div>
          </div>
        </div>
          <button>Settings</button>
          <div>
            <button>Deploy</button>
            <button>Metadata</button>
          </div>
          <button>Save Locally</button>
          <button onClick={() => {setSnap(true)}}>Enable Snapping</button>
          <button onClick={() => {setSnap(false)}}>Disable Snapping</button>
        </div>
      </div>

      <div id="song_controls">

      </div>

      <div id="all_metadata">
        <label htmlFor="songName">Song Name</label>
        <input 
          name="songName" 
          id="songName"
          type="text" 
          value={songName}
          onChange={(e) => setSongName(e.target.value)}
        ></input>
        
        <label htmlFor="songArtist">Song Artist</label>
        <input 
          name="songArtist" 
          id="songArtist"
          type="text" 
          value={songArtist}
          onChange={(e) => setSongArtist(e.target.value)}
        ></input>
        
        <label htmlFor="songMapper">Song Mapper</label>
        <input 
          name="songMapper" 
          id="songMapper"
          type="text" 
          value={songMapper}
          onChange={(e) => setSongMapper(e.target.value)}
        ></input>
        
        <label htmlFor="songBPM">Song BPM</label>
        <input 
          name="songBPM" 
          id="songBPM"
          type="number" 
          value={bpm}
          onChange={(e) => setBPM(parseInt(e.target.value))}
        ></input>
        
        <label htmlFor="songGenre">Song Genre</label>
        <input 
          name="songGenre" 
          id="songGenre"
          type="text" 
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        ></input>
        
        <label htmlFor="songLanguage">Song Language</label>
        <input 
          name="songLanguage" 
          id="songLanguage"
          type="text" 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        ></input>
        
        <label htmlFor="songDescription">Song Description</label>
        <input 
          name="songDescription" 
          id="songDescription"
          type="text" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></input>

        <p>Song Length: {formatTime((songLength- 1) / 16)}</p>
        
        {/* Change song_mapper to user when I pass into this component. If not logged in, have a note that says "Only registered accounts can upload maps to the internet" */}
      </div>
    </div>
  );

}