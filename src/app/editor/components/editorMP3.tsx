
import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWavesurfer } from '@wavesurfer/react'
import { createClient } from '@/utils/supabase/client'
import { FixedSizeList as List } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import gsap from 'gsap';
import { useGSAP } from "@gsap/react";
import { keybindsType, editorMap } from "@/utils/helperTypes";
import { type User } from '@supabase/supabase-js'

import ReactPlayer from "react-player/youtube";

const barGradient = "linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 24%, rgba(255, 255, 255, 0.50) 24%, rgba(255, 255, 255, 0.50) 25%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 48.75%, rgba(255, 255, 255, 0.50) 48.75%, rgba(255, 255, 255, 0.50) 50%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 74%, rgba(255, 255, 255, 0.50) 74%, rgba(255, 255, 255, 0.50) 75%, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0) 100%) no-repeat scroll 0% 0% / 100% 100% padding-box border-box"
// const gameGradient = "linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 24%, rgba(255, 255, 255, 0.25) 24%, rgba(255, 255, 255, 0.25) 25%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 49.25%, rgba(255, 255, 255, 0.25) 49.25%, rgba(255, 255, 255, 0.25) 50%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 74%, rgba(255, 255, 255, 0.25) 74%, rgba(255, 255, 255, 0.25) 75%, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0) 100%) no-repeat scroll 0% 0% / 100% 100% padding-box border-box";
const formatTime = (seconds: number) => [seconds / 60, seconds % 60, (seconds % 1) * 100].map((v) => `0${Math.floor(v)}`.slice(-2)).join(':')

// Call this when settings are saved 
const getKeyMapping = (key : string) => {
  const res = [(key === "Spacebar") ? " " : key.charAt(0).toUpperCase() + key.slice(1), (key === "Spacebar") ? " " : key.charAt(0).toLowerCase() + key.slice(1)]
  return res
}

const formatDateFromMillis = (milliseconds : string) => {
  if (milliseconds === "0") return "Not Yet Saved";
  const date = new Date(milliseconds);

  const month = date.getMonth() + 1;  // getMonth() is zero-based, so add 1
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');  // ensures 2-digit format
  const minutes = date.getMinutes().toString().padStart(2, '0');  // ensures 2-digit format

  return `${month}/${day}/${year} ${hours}:${minutes}`;
}
// import Link from "next/link";

interface editorInterface {
  user: User | null,
  metadata : editorMap | null, //if null, that means a fresh map has to be made
  map_id: string,
  keybinds : keybindsType,
  songAudio: string,
  songFile : File,
  audioContextRef : AudioContext,
  audioBufferRef : AudioBuffer,
  clearMap : () => void;
  updateLocalMaps: () => void;
}

export const EditorMP3 = ({user, metadata, map_id, keybinds, songAudio, songFile, audioContextRef , audioBufferRef, clearMap, updateLocalMaps} : editorInterface) => {   
  const [songNotes, setSongNotes] = useState<string[][]>([])
  const [songLength, setSongLength] = useState<number>(0);    
  const [btn, setBtn] = useState<string>("Single Note");
  const [snapOn, setSnap] = useState<boolean>(false);
  const [keybindsActive, setKeybinds] = useState<boolean>(true);

  const supabase = createClient()

  // All of the metadata
  // When setting metadata, like description, disable the other buttons being activiated. Like when pressing "P" for the description, don't play the song 
  const [songName, setSongName] = useState<string>(metadata?.song_metadata.song_name || "")
  const [songArtist, setSongArtist] = useState<string>(metadata?.song_metadata.song_artist || "")
  // const [bpm, setBPM] = useState<number>(metadata?.song_metadata.bpm || 0)
  const [genre, setGenre] = useState<string>(metadata?.song_metadata.genre || "")
  const [language, setLanguage] = useState<string>(metadata?.song_metadata.language || "")
  const [noteCount, setNoteCount] = useState<number>(metadata?.song_metadata.normal_notes || 0)
  const [description, setDescription] = useState<string>(metadata?.song_metadata.description || "");
  const [source, setSource] = useState<string>(metadata?.song_metadata.source || "");
  const [difficulty, setDifficulty] = useState<number>(  metadata?.song_metadata?.difficulty?.[0] ?? 1  )
  const [usingMP3, setUsingMP3] = useState<boolean>(metadata?.song_metadata.mp3 || true)
  const [ytBackground, setYTBackground] = useState<string>(metadata?.background[0][0] || ""); //Fix to .ytbg
  const [timestamp, setTimestamp] = useState<string>(metadata?.timestamp || "0");
  const [deploymentMap, setDeploymentMap] = useState<editorMap | null>(null)
  const [deployMessage, setDeployMessage] = useState<string>("")

  const [ytOffset, setYTOffset] = useState<number>(metadata?.background[0][1] || 0)
  const [ytEnd, setYTEnd] = useState<number>(metadata?.background[0][2] || 0)
  const ytOffsetRef = useRef<HTMLInputElement>(null)
  const ytEndRef = useRef<HTMLInputElement>(null)
  const ytIDRef= useRef<HTMLInputElement>(null)
  const prevID = useRef<string>("")

  useEffect(() => {
    if (ytOffsetRef.current && ytEndRef.current && ytIDRef.current){
      ytOffsetRef.current.value = (metadata?.background[0][1] || 0).toString()
      ytEndRef.current.value = (metadata?.background[0][2] || 0).toString()
      ytIDRef.current.value = metadata?.background[0][0] || ""
      prevID.current = metadata?.background[0][0] || ""
    }
  }, [])

  // DeploymentMap used to be set when deployment menu is set. Draw it from local storage
  // Fail safe if a user edits the map from local storage. I don't want to send those changes to supabase

  // Multiple Prompt states
  const [menu, setMenu] = useState<boolean>(false) // Used for 
  const [promptMenu, setPromptMenu] = useState<string>("");
  const [mapSaved, setMapSaved] = useState<boolean>(true) 
  const [pbRate, setPbRate] = useState<number>(1)
  const [disabledSave, setDisabledSave] = useState<boolean>(false)
  const [playingAlong, setPlayingAlong] = useState<boolean>(false);

  // String that will tell the user what fields of data are missing before deploying beatmap
  const [missingData, setMissingData] = useState<string>("")

  const waveformRef = useRef<HTMLDivElement>(null);

  const keybindMappings = {
    sNote: getKeyMapping(keybinds.sNote),
    tNote: getKeyMapping(keybinds.tNote),
    decreaseSpd: getKeyMapping(keybinds.decreaseSpd),
    increaseSpd: getKeyMapping(keybinds.increaseSpd),
  
    snap: getKeyMapping(keybinds.snap),
    toggleMusic: getKeyMapping(keybinds.toggleMusic),

    staffUp: getKeyMapping(keybinds.staffUp),
    topStaffTop: getKeyMapping(keybinds.topStaffTop),
    topStaffBottom: getKeyMapping(keybinds.topStaffBottom),
  
    staffDown: getKeyMapping(keybinds.staffDown),
    bottomStaffTop: getKeyMapping(keybinds.bottomStaffTop),
    bottomStaffBottom: getKeyMapping(keybinds.bottomStaffBottom),
  }

  const { wavesurfer, isReady, isPlaying, currentTime} = useWavesurfer({
    container: waveformRef,
    url: songAudio,
    waveColor: '#0b7033',
    progressColor: 'rgb(87, 77, 97)',
    cursorWidth: 2,
    autoCenter: false,
    autoScroll: false,
    minPxPerSec: 256,
    height: 'auto', // reminder that this is not responsive. Height gets filled to div height only on intiailizing
    fillParent: true, // sets width to the width of the div
    hideScrollbar: true,
    dragToSeek: true,
  })

  // Set Stage depending on if a map was passed or if this is new
  useEffect(() => {
    if (isReady) {
      if (wavesurfer) {
        const duration = wavesurfer.getDuration()
        const tempNotes = Array.from({ length: 4 }, () => new Array(Math.floor(((duration) * 16) + 1)).fill(""));
        if (metadata) {
          for (let i = 0; i < metadata.normal_notes[0].length; i++) {
            tempNotes[0][i] = metadata.normal_notes[0][i]
            tempNotes[1][i] = metadata.normal_notes[1][i]
            tempNotes[2][i] = metadata.normal_notes[2][i]
            tempNotes[3][i] = metadata.normal_notes[3][i]
          }
          setSongNotes(tempNotes)
          setSongLength((duration * 16) + 1);
        }
        else {
          setSongLength((duration * 16) + 1);
          setSongNotes(tempNotes);    
        }
        console.log("Please exit Inspect Mode. Project Tape is likely to crash if you edit with it open. Be sure to save your map often.")
      }
    }
  }, [isReady])

  
  const itemIndex = useMemo(() => {
    return (Math.floor(currentTime * 16) + 1);
  }, [currentTime]);

  useEffect(() => {
    if (itemIndex == null || !isPlaying) return;
  
    const context = audioContextRef;
    const buffer = audioBufferRef;
    if (!context || !buffer) return;
  
    // Indices of songNotes rows that require playback
    const rowsToCheck = [0, 1, 2, 3];
    
    rowsToCheck.forEach(row => {
      const note = songNotes[row][itemIndex];
      if (
        (row === 0 && (note === "S" || note === "T")) ||
        (row === 1 && note === "S") ||
        (row === 2 && (note === "S" || note === "T")) ||
        (row === 3 && note === "S")
      ) {
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);
      }
    });
  }, [itemIndex, isPlaying]);

  useEffect(() => {
    const handleKeyDown = (event: {key: string; repeat: boolean}) => {
      if (event.repeat) return;
      if (!keybindsActive) return;

      if (playingAlong) {
        if (event.key === keybindMappings.staffUp[0] || event.key === keybindMappings.staffUp[1]) {
          if (songNotes[2][itemIndex] === "S" || songNotes[2][itemIndex] === "T" || songNotes[3][itemIndex] === "S") {
            return
          }
          setDoubleNote(0, 1, itemIndex)
        }
  
        else if (event.key === keybindMappings.topStaffTop[0] || event.key === keybindMappings.topStaffTop[1]) {
          if (songNotes[2][itemIndex] === "S" || songNotes[2][itemIndex] === "T" || songNotes[3][itemIndex] === "S") {
            return
          }
          setNewNote(0, 1, itemIndex, "S");
        }
        else if (event.key === keybindMappings.topStaffBottom[0] || event.key === keybindMappings.topStaffBottom[1]) {
          if (songNotes[2][itemIndex] === "S" || songNotes[2][itemIndex] === "T" || songNotes[3][itemIndex] === "S") {
            return
          }
          setNewNote(1, 0, itemIndex, "S");
        }
        else if (event.key === keybindMappings.staffDown[0] || event.key === keybindMappings.staffDown[1]) {
          if (songNotes[0][itemIndex] === "S" || songNotes[0][itemIndex] === "T" || songNotes[1][itemIndex] === "S") {
            return
          }
          setDoubleNote(2, 3, itemIndex)
        }
        else if (event.key === keybindMappings.bottomStaffTop[0] || event.key === keybindMappings.bottomStaffTop[1]) {
          if (songNotes[0][itemIndex] === "S" || songNotes[0][itemIndex] === "T" || songNotes[1][itemIndex] === "S") {
            return
          }
          setNewNote(2, 3, itemIndex, "S");
        }
        else if (event.key === keybindMappings.bottomStaffBottom[0] || event.key === keybindMappings.bottomStaffBottom[1]) {
          if (songNotes[0][itemIndex] === "S" || songNotes[0][itemIndex] === "T" || songNotes[1][itemIndex] === "S") {
            return
          }
          setNewNote(3, 2, itemIndex, "S");
        }
      }

      else {
        if (event.key === keybindMappings.sNote[0] || event.key === keybindMappings.sNote[1]) {
          setBtn("Single Note")
        }
  
        else if (event.key === keybindMappings.tNote[0] || event.key === keybindMappings.tNote[1]) {
          setBtn("Turn Note")
        }
        
        else if (event.key === keybindMappings.decreaseSpd[0] || event.key === keybindMappings.decreaseSpd[1]) {
          updatePBRate(Math.max(0.25, pbRate - 0.25))
        }
  
        else if (event.key === keybindMappings.increaseSpd[0] || event.key === keybindMappings.increaseSpd[1]) {
          updatePBRate(Math.min(1, pbRate + 0.25))
        }
  
        else if (event.key === keybindMappings.snap[0] || event.key === keybindMappings.snap[1]) {
          setSnap(prevSnap => !prevSnap)
        }
      }
      if (event.key === keybindMappings.toggleMusic[0] || event.key === keybindMappings.toggleMusic[1]) {
        onPlayPause();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener on unmount
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pbRate, keybindsActive, playingAlong, itemIndex, songNotes])
  
  
  useEffect(() => {
    const handleUserLeave = (event: BeforeUnloadEvent) => {
      const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");

      let isMapSaved = false;
      const currentMap = {
        timestamp: metadata?.timestamp || "",
        song_metadata : {
          song_name: songName,
          song_artist: songArtist,
          song_mapper: user?.user_metadata.username || "",
          genre: genre,
          length: Math.floor((songLength- 1) / 16),
          language: language,
          normal_notes: noteCount,
          ex_notes: 0,
          description: description,
          source : source,
          mp3: usingMP3
        },
        background: [[ytBackground, ytOffset, ytEnd]],
        normal_notes : songNotes,
        ex_notes: []
      }
      if (map_id in localMaps) {
        const isEqual = JSON.stringify({
          song_metadata: currentMap.song_metadata,
          song_notes: currentMap.normal_notes,
          background: currentMap.background
        }) === JSON.stringify({
          song_metadata: localMaps[map_id].song_metadata,
          song_notes: localMaps[map_id].normal_notes,
          background: localMaps[map_id].background
        });
        isMapSaved = isEqual
      }
      else {
        isMapSaved = false
      }
        
      if (!isMapSaved) {
        event.preventDefault()
        event.returnValue = true
      }
    }

    window.addEventListener('beforeunload', handleUserLeave);

    // Cleanup the event listener on unmount
    return () => {
        window.removeEventListener('beforeunload', handleUserLeave);
    };
  }, [metadata, songName, songArtist, user, genre, songLength, language, noteCount, description, source, ytBackground, ytOffset, ytEnd, map_id, songNotes, usingMP3])

  const onPlayPause = () => {
    if (wavesurfer) {
      wavesurfer.playPause()
      if (reactPlayerRef.current && !isPlaying) {
        reactPlayerRef.current.seekTo(wavesurfer.getCurrentTime() + ytOffset)
        setVideoPlaying(true)
      }
      else if (isPlaying) {
        setVideoPlaying(false)
      }
    }
  }

  const vListRef = useRef<List>(null);
  
  const changeNoteHor = (index: number, event: MouseEvent<HTMLParagraphElement>) => {
    if (isPlaying){ 
      return;
    }
    const hero_list_info = document.getElementById('waveform_bars')?.getBoundingClientRect();
    let mousePlacement;
    let hero_height;
    if (hero_list_info) {
      mousePlacement = event.clientY - hero_list_info.top
      hero_height = hero_list_info.bottom - hero_list_info.top
    }

    if (!mousePlacement || !hero_height) return;
    const oneFourth = hero_height * (1/4)
    const twoFourths = hero_height * (2/4)
    const threeFourths = hero_height * (3/4)

    // const mousePlacement = event.clientY - (document.getElementById('vBars-Container')?.getBoundingClientRect().top as number)
    if (0 < mousePlacement && mousePlacement <= oneFourth) { // First Bar
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
    else if (threeFourths < mousePlacement && mousePlacement <= hero_height) { // Fourth Bar
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
   }

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

  const VRow = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const barStyle = (index: number) => {

      const horizontalGradients = [
        songNotes[0][index] === 'T' ? "linear-gradient(135deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 33%, rgb(0, 0, 0) 33%,  rgb(0, 0, 0) 66%, rgb(184, 184, 184) 66%) no-repeat scroll 0% 0% / 25% 25% padding-box border-box, linear-gradient(225deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 33%, rgb(0, 0, 0) 33%, rgb(0, 0, 0) 66%, rgb(184, 184, 184) 66%) no-repeat scroll 25% 0% / 25% 25% padding-box border-box" : songNotes[0][index] === 'S' ? "linear-gradient(to right, rgb(184, 184, 184) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 100% 25% padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 100% 25% padding-box border-box",
        songNotes[1][index] === 'T' ? "linear-gradient(135deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 33%, rgb(0, 0, 0) 33%, rgb(0, 0, 0) 66%, rgb(184, 184, 184) 66%) no-repeat scroll 0% 33% / 25% 25% padding-box border-box, linear-gradient(225deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 33%, rgb(0, 0, 0) 33%, rgb(0, 0, 0) 66%, rgb(184, 184, 184) 66%) no-repeat scroll 25% 33% / 25% 25% padding-box border-box" : songNotes[1][index] === 'S' ? "linear-gradient(to right, rgb(184, 184, 184) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 33.3% / 100% 25% padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 33.3% / 100% 25% padding-box border-box",
        songNotes[2][index] === 'T' ? "linear-gradient(45deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 33%, rgb(0, 0, 0) 33%,  rgb(0, 0, 0) 66%, rgb(184, 184, 184) 66%) no-repeat scroll 0% 66% / 25% 25% padding-box border-box, linear-gradient(315deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 33%, rgb(0, 0, 0) 33%, rgb(0, 0, 0) 66%, rgb(184, 184, 184) 66%) no-repeat scroll 25% 66% / 25% 25% padding-box border-box" : songNotes[2][index] === 'S' ? "linear-gradient(to right, rgb(184, 184, 184) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 66.6% / 100% 25% padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 66.6% / 100% 25% padding-box border-box",
        songNotes[3][index] === 'T' ? "linear-gradient(45deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 33%, rgb(0, 0, 0) 33%,  rgb(0, 0, 0) 66%, rgb(184, 184, 184) 66%) no-repeat scroll 0% 99% / 25% 25% padding-box border-box, linear-gradient(315deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 33%, rgb(0, 0, 0) 33%, rgb(0, 0, 0) 66%, rgb(184, 184, 184) 66%) no-repeat scroll 25% 99% / 25% 25% padding-box border-box" : songNotes[3][index] === 'S' ? "linear-gradient(to right, rgb(184, 184, 184) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 99.9% / 100% 25% padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 99.9% / 100% 25% padding-box border-box",
      ];
    
      const updatedBG = `${barGradient}, ${horizontalGradients.join(", ")}`;
    
      return {
        background: updatedBG,
      };
    };
  
    return (
      <div
        className="waveform_bar"
        onClick={(event) => changeNoteHor(index, event)}
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
        song_mapper: user?.user_metadata.username || "",
        genre: genre,
        length: Math.floor((songLength- 1) / 16),
        language: language,
        normal_notes: noteCount,
        ex_notes: 0,
        description: description,
        source : source,
        difficulty: [difficulty, 0],
        mp3: usingMP3
      },
      background: [[ytBackground, ytOffset, ytEnd]],
      normal_notes : songNotes,
      ex_notes: []
    }
    localStorage.setItem("localMaps", JSON.stringify(localMaps));
    updateLocalMaps();
    setDisabledSave(true)
    setTimestamp(localMaps[map_id].timestamp)
    saveAnimation();
    setTimeout(()=> {
      setDisabledSave(false)
    }, 1500)
  }

  const closeEditor = () => {
    if (menu) {
      setMapSaved(false)
      setPromptMenu("")
      setMenu(false)
      return
    };
    const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");
    const currentMap = {
      timestamp: metadata?.timestamp || "",
      song_metadata : {
        song_name: songName,
        song_artist: songArtist,
        song_mapper: user?.user_metadata.username || "",
        genre: genre,
        length: Math.floor((songLength- 1) / 16),
        language: language,
        normal_notes: noteCount,
        ex_notes: 0,
        description: description,
        source : source,
        difficulty: [difficulty, 0],
        mp3: usingMP3
      },
      background: [[ytBackground, ytOffset, ytEnd]],
      normal_notes : songNotes,
      ex_notes: []
    }
    if (map_id in localMaps) {
      const isEqual = JSON.stringify({
        song_metadata: currentMap.song_metadata,
        song_notes: currentMap.normal_notes,
        background: currentMap.background
      }) === JSON.stringify({
        song_metadata: localMaps[map_id].song_metadata,
        song_notes: localMaps[map_id].normal_notes,
        background: localMaps[map_id].background
      });

      setMapSaved(isEqual)
      setPromptMenu("Exit")
      setMenu(true)
    }
    else {
      setMapSaved(false)
      setPromptMenu("Exit")
      setMenu(true)
    }

    // localStorage.setItem("localMaps", JSON.stringify(localMaps));
    console.log("Closed Editor")
  }

  const verifyDeployment = () => {
    if (menu || !user) {
      setMapSaved(false)
      setPromptMenu("")
      setMenu(false)
      return
    };
    const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");
    const currentMap = {
      timestamp: metadata?.timestamp || "",
      song_metadata : {
        song_name: songName,
        song_artist: songArtist,
        song_mapper: user?.user_metadata.username || "",
        genre: genre,
        length: Math.floor((songLength- 1) / 16),
        language: language,
        normal_notes: noteCount,
        ex_notes: 0,
        description: description,
        source : source,
        difficulty: [difficulty, 0],
        mp3: usingMP3
      },
      background: [[ytBackground, ytOffset, ytEnd]],
      normal_notes : songNotes,
      ex_notes: []
    }
    if (map_id in localMaps) {
      const isEqual = JSON.stringify({
        song_metadata: currentMap.song_metadata,
        song_notes: currentMap.normal_notes,
        background: currentMap.background
      }) === JSON.stringify({
        song_metadata: localMaps[map_id].song_metadata,
        song_notes: localMaps[map_id].normal_notes,
        background: localMaps[map_id].background
      });

      let missingDataString = "Missing fields:"

      if (!localMaps[map_id].song_metadata.song_name) {
        missingDataString += " Song Name ,"
      }
      if (!localMaps[map_id].song_metadata.song_artist) {
        missingDataString += " Song Artist ,"
      }
      if (!localMaps[map_id].song_metadata.genre) {
        missingDataString += " Genre ,"
      }
      if (!localMaps[map_id].song_metadata.language) {
        missingDataString += " Song Language ,"
      }
      if (!localMaps[map_id].song_metadata.normal_notes) {
        missingDataString += " Note Count ,"
      }
      if (!localMaps[map_id].song_metadata.source) {
        missingDataString += " Audio Source ,"
      }
      if (!localMaps[map_id].song_metadata.difficulty) {
        missingDataString += " Difficulty ,"
      }

      if (missingDataString.length > 16) {
        setMissingData(missingDataString.slice(0, -1))
      }
      else {
        setDeploymentMap(localMaps[map_id])
      }

      setMapSaved(isEqual)
      setPromptMenu("Deploy")
      setMenu(true)
    }
    else {
      setMapSaved(false)
      setPromptMenu("Deploy")
      setMenu(true)
    }
  }
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

  const canUserUpload = () => {
    if (missingData !== "" || !deploymentMap || !user) return;
    // setLinkLoading(true);
    const currentTime = Date.now()
    const oneDayInMilliseconds = 24 * 3600 * 1000; // 1 day = 24 hours * 3600 seconds/hour * 1000 milliseconds/second
    const lastUpload = localStorage.getItem("lastUpload")
    if (lastUpload) {
      const timeDifference = currentTime - parseInt(lastUpload);
      if (timeDifference > oneDayInMilliseconds){
        localStorage.setItem("lastUpload", currentTime.toString())
        deployMap();
      }
      else {
        const remainingHours = Math.floor((oneDayInMilliseconds - timeDifference) / (3600 * 1000)); // Get hours
        const remainingMinutes = Math.floor(((oneDayInMilliseconds - timeDifference) % (3600 * 1000)) / (60 * 1000)); // Get minutes

        setDeployMessage(`You Can Only Upload One Beatmap per Day. You Can Upload Again In ${remainingHours} Hours, ${remainingMinutes} Minutes.`)
        return;
      }
    }
    else {
      localStorage.setItem("lastUpload", currentTime.toString())
      deployMap();
    }
  }

  const deployMap = useCallback( async () => {
    if (!songFile || !user || !deploymentMap) return;
    const localMaps = localStorage.getItem("localMaps");
    if (!localMaps) {
      setDeployMessage("Beatmap Not Saved. Unable To Deploy")
      return;
    }
    // const currentMap = JSON.parse(localMaps)
    const current_metadata = deploymentMap.song_metadata
    const current_notes = deploymentMap.normal_notes
    const song_metadata_upload = {
      "song_name" : current_metadata.song_name,
      "song_artist" : current_metadata.song_artist,
      "song_mapper" : user.user_metadata.username,
      "difficulty": current_metadata.difficulty
    }

    const map_metadata_upload = {
      "genre": current_metadata.genre,
      "source": current_metadata.source,
      "language": current_metadata.language,
      "name": current_metadata.song_name,
      "normal_notes": current_metadata.normal_notes,
      "ex_notes": 0,
      "description": current_metadata.description,
      "length": Math.floor((songLength - 1) / 16),
      "difficulty" : current_metadata.difficulty
    }

    const final_notes = formatNotes(current_notes)
    try {
      setDeployMessage("Beatmap Uploading...");

      const { data: recentUploads, error: uploadCheckError } = await supabase
      .from("pending_songs")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Check for uploads in the last 24 hours

      if (uploadCheckError) {
        throw uploadCheckError;
      }

      if (recentUploads && recentUploads.length > 0) {
        setDeployMessage("You Can Only Upload One Beatmap per Day.")
        return;
      }

      let filePath : string;
      if (usingMP3) { //Upload file is user chooses too
        const file = songFile;
        const fileExt = file.name.split('.').pop()
        filePath = `${user.id}/${user.id}-${Math.random()}.${fileExt}`
        // user.id is needed with '/' because in my RLS, each user has their own folder, with the name {user.id}
        // so to be able to upload folders, that folder header with their id is needed to be included
        
        // Uploads song file to storage bucket if user chooses to upload mp3
        const { error : songUploadError } = await supabase.storage.from('songs').upload(filePath, file);
        if (songUploadError) {
          throw songUploadError
        }
      }
      else {
        filePath = `https://www.youtube.com/watch?v=${ytBackground}`
      }

      const { error : beatmapUploadError, status } = await supabase
      .from('pending_songs')
      .insert([{
        'user_id' : user.id,
        'header' : song_metadata_upload,
        'metadata' : map_metadata_upload,
        'background': [[ytBackground, ytOffset, ytEnd]],
        "normal_map" : final_notes,
        "audio_link" : filePath
      }])

      if (beatmapUploadError && status === 403) {
        setDeployMessage("You Can Only Upload One Beatmap per Day.");
        throw (beatmapUploadError)
      }
      else if (beatmapUploadError && status === 406) {
        setDeployMessage("Error Uploading Beatmap. Try Again Later");
        throw (beatmapUploadError)
        // return;
      }
      setDeployMessage("Beatmap Successfully Uploaded & Ready for Review. The Review Process is ~1 day.")
    }
    catch (error) {
      console.log("Error Uploading Beatmap", error)
    }
  }, [user, supabase, songFile, deploymentMap, ytBackground, ytOffset, ytEnd])

  const { contextSafe } = useGSAP();

  const saveAnimation = contextSafe(() => {
    gsap.to("#beatmap_save_tooltip", {visibility: "visible", opacity: 1, yoyo: true, repeat: 1, duration:0.75})
  })

  useEffect(() => {
    if (vListRef.current) {
      vListRef.current.scrollTo(currentTime * 256)
    }
    wavesurfer?.setScrollTime(Math.max(0, currentTime - (1 / 16)))
  }, [currentTime])

  function scrollWindow(index : number)  {
    if (isPlaying) return;
    setTimeout(() => {
      if (wavesurfer && snapOn && vListRef.current) {
        wavesurfer.setTime(index / 16)
      }
    }, 125)
  }
  
  const updatePBRate = (rate: number) => {
    if (wavesurfer) {
      wavesurfer.setPlaybackRate(rate);
      setPbRate(rate)
    }
  }

  const updateTime = (event: {scrollOffset: number}) => {
    if (isPlaying) return; // Prevent updates while playing
    if (wavesurfer) {
      const newTime = event.scrollOffset / 256;
      // Only update if the time has actually changed
      // if (Math.abs(currentTime - newTime) > 0.03) {
      if (Math.abs(currentTime - newTime) > 0.03) {
        wavesurfer.setTime(newTime);
      }
    }
  }

  const returnStyle = {
    visibility: (menu)? "visible" : "hidden",
    opacity: (menu)? 1 : 0,
    transition: 'opacity 500ms ease, visibility 500ms'
  } as React.CSSProperties

  const [videoPlaying, setVideoPlaying] = useState<boolean>(false)
  const [videoMuted, setVideoMuted] = useState<boolean>(true)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const reactPlayerRef = useRef<ReactPlayer | null>(null)
  const updatePlayerTime = () => {
    if (reactPlayerRef.current) {
      reactPlayerRef.current.seekTo(ytOffset);
      setVideoPlaying(true)
    }
  }

  const setTimestamps = () => {
    if (ytEndRef.current && ytOffsetRef.current) {
      const start = Math.min(Math.floor(parseInt(ytOffsetRef.current.value.replace(/[^0-9]/g, '') || "0")), videoDuration)
      const end = Math.min(Math.floor(parseInt(ytEndRef.current.value.replace(/[^0-9]/g, '')) || videoDuration), videoDuration)
      setYTOffset(start)
      setYTEnd(end)
      ytOffsetRef.current.value = start.toString();
      ytEndRef.current.value = end.toString()
    }
  }

  const handleProgress = (state: {playedSeconds : number}) => {
    if (state.playedSeconds >= ytEnd) {
      setVideoPlaying(false)
    }
  }

  const handleDuration = (duration : number) => {
    setVideoDuration(duration)
    if (ytIDRef.current && prevID.current !== ytIDRef.current.value && ytOffsetRef.current && ytEndRef.current) {
      prevID.current = ytIDRef.current.value
      ytOffsetRef.current.value = "0"
      ytEndRef.current.value = duration.toString()
      setYTOffset(0)
      setYTEnd(duration)
    }
  }

  const playAlong = () => {
    setPlayingAlong(!playingAlong)
  }

  return (
    <div id="editor_page">
      <div className="editor_header">
        <h2 id="fixed_time"><span>{formatTime(currentTime)}</span>/ {formatTime((songLength- 1) / 16)}</h2>
        <button className={keybindsActive? "active_btn" : "inactive_btn"} onClick={() => {setKeybinds(!keybindsActive)}}>Keybinds</button>
          <button className={snapOn? "active_btn" : "inactive_btn"} onClick={() => {setSnap(prevSnap => !prevSnap)}}>Snap</button>
          <div id="notes">
            <button className={(btn === "Single Note")? "active_btn" : "inactive_btn"} onClick={() => {setBtn("Single Note")}}>S Note</button>
            <button className={(btn === "Turn Note")? "active_btn" : "inactive_btn"} onClick={() => {setBtn("Turn Note")}}>T Note</button>
          </div>
      </div>
      <div id="wave_bars">
        <div id="waveform_container" ref={waveformRef}>
        </div>
        <div id="waveform_bars">
          <AutoSizer>
            {({height, width}) => (
              <List
              ref={vListRef}
              className={isPlaying? "no_scroll" : ""}
              height={height} 
              itemCount={songLength} 
              itemSize={16} 
              layout="horizontal"
              width={width} 
              onScroll={updateTime}
              >
                {VRow}
              </List>
            )}
          </AutoSizer>
        </div>
      </div>

      <div id="metadata_section">
        <div className="editor_header">
          <h2>Last Updated: {formatDateFromMillis(timestamp)}</h2>
          <h2>Notes: {noteCount}</h2>
        </div>

        <div id="metadata_video">
          <div id="metadata_wrapper">
            <div className="metadata_inputs">
              <div className="metadata_div">
                  <label htmlFor="songName">Title:</label>
                  <input 
                    className="metadata_input"
                    name="songName" 
                    id="songName"
                    type="text" 
                    value={songName}
                    maxLength={50}
                    onChange={(e) => setSongName(e.target.value)}
                  ></input>
                </div>
              <div className="metadata_div">
                <label htmlFor="songArtist">Artist:</label>
                <input 
                  className="metadata_input"
                  name="songArtist" 
                  id="songArtist"
                  type="text" 
                  value={songArtist}
                  maxLength={20}
                  onChange={(e) => setSongArtist(e.target.value)}
                ></input>
              </div>

              <div className="metadata_div">
                <label htmlFor="songGenre">Genre:</label>
                <input 
                  className="metadata_input"
                  name="songGenre" 
                  id="songGenre"
                  type="text" 
                  value={genre}
                  maxLength={20}
                  onChange={(e) => setGenre(e.target.value)}
                ></input>
              </div>
              
              <div className="metadata_div">
                <label htmlFor="songLanguage">Language:</label>
                <input
                  className="metadata_input" 
                  name="songLanguage" 
                  id="songLanguage"
                  type="text" 
                  value={language}
                  maxLength={20}
                  onChange={(e) => setLanguage(e.target.value)}
                ></input>
              </div>
              
              <div className="metadata_div">
                <label htmlFor="songDescription">Description:</label>
                <input 
                  className="metadata_input"
                  name="songDescription" 
                  id="songDescription"
                  type="text" 
                  value={description}
                  maxLength={100}
                  onChange={(e) => setDescription(e.target.value)}
                ></input>
              </div>

              <div className="metadata_div">
                <label htmlFor="songSource">Source Link:</label>
                <input 
                  className="metadata_input"
                  name="songSource" 
                  id="songSource"
                  type="text" 
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                ></input>
              </div>       

              <div className="metadata_div">
                <label htmlFor="songDifficulty">Difficulty:</label>
                <select 
                  className="metadata_input"
                  name="songDifficulty" 
                  id="songDifficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseInt(e.target.value))}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                  <option value={6}>6</option>
                </select>
              </div> 

              <div className="metadata_div">
                <label id="mp3_label" htmlFor="usingMP3">Deploy w/ MP3:
                  <div id="mp3_info">Select &quot;No&quot; if MP3 is same as YT Video</div>
                </label>
                <select 
                  className="metadata_input"
                  name="usingMP3" 
                  id="usingMP3"
                  value={usingMP3? "Yes" : "No"}
                  onChange={(e) => setUsingMP3(e.target.value === 'Yes')}
                >
                  <option value={'Yes'}>Yes</option>
                  <option value={'No'}>No</option>
                </select>
              </div> 
            </div>
            

            <div className="metadata_inputs">
              <div className="metadata_div">
                <label id="yt_id_label" htmlFor="ytBackground">Youtube ID:
                  <div id="yt_id_info">A YouTube ID is 11 characters long, right after &apos;?v=&apos; on the URL</div>
                </label>
                <input 
                  ref={ytIDRef}
                  className="metadata_input"
                  name="ytBackground" 
                  id="ytBackground"
                  type="text"
                ></input>
              </div>
                <div className="metadata_div" style={{visibility: (videoDuration !== 0)? "visible" : "hidden"}}>
                <label htmlFor="ytOffset">Start at Second:</label>
                <input 
                  ref={ytOffsetRef}
                  className="metadata_input"
                  name="ytOffset" 
                  id="ytOffset"
                  type="number" 
                  min={0}
                  max={videoDuration}
                ></input>
              </div>

              <div className="metadata_div" style={{visibility: (videoDuration !== 0)? "visible" : "hidden"}}>
                <label htmlFor="ytEnd">End at Second:</label>
                <input 
                  ref={ytEndRef}
                  className="metadata_input"
                  name="ytEnd" 
                  id="ytEnd"
                  type="number" 
                  min={0}
                  max={videoDuration}
                ></input>
              </div>
              
              <div className="metadata_inputs">
                <button className="play_btn" onClick={() => {
                  if (ytIDRef.current?.value === ytBackground) return; 
                  setVideoDuration(0); 
                  setYTBackground(ytIDRef.current?.value || "")
                  }}>Set Youtube ID</button>
                {videoDuration !== 0 &&
                <>
                  <button onClick={() => setTimestamps()}>Set Timestamps</button>
                  <button onClick={() => updatePlayerTime()}>Go To Start</button>
                  <button onClick={() => setVideoMuted(!videoMuted)}>{videoMuted? "Unmute" : "Mute"}</button>
                </>
                }              
              </div>
            </div>
          </div>
          <div id="youtube_frame" style={{height: (videoDuration !== 0)? "100%" : "0", width: (videoDuration !== 0)? "100%" : "0"}}>
            <ReactPlayer
              ref={reactPlayerRef}
              // url={`https://www.youtube.com/watch?v=${ytBackground}?start=${ytOffset}?end=${ytEnd}&rel=0`} //&rel=0 means that "more videos" are locked to uploader's channel
              url={`https://www.youtube-nocookie.com/watch?v=${ytBackground}?start=${ytOffset}?end=${ytEnd}&rel=0&nocookie=true&autoplay=0&modestbranding=1&nocookie=true&fs=0&enablejsapi=1&widgetid=1&aoriginsup=1&vf=1`} //&rel=0 means that "more videos" are locked to uploader's channel
              loop={false}
              controls={false}
              volume={100}
              muted={videoMuted}
              height={"100%"}
              width={"100%"}
              playing={videoPlaying}
              pip={false}
              light={false}
              playsinline={true}
              playbackRate={pbRate}
              onProgress={handleProgress}
              onDuration={handleDuration}
              onEnded={() => setVideoPlaying(false)}
              config={{
                playerVars: {
                  iv_load_policy: 3,
                  disablekb: 1
                }
              }}
            />
          </div>
        </div>
      </div>

      <div id="editor_footer">
        <div className="footer_div">
          <button disabled={disabledSave} className="styledBtns" id="beatmap_save_btn" onClick={() => {saveMap()}}>Save
            <h2 id="beatmap_save_tooltip">Beatmap Saved</h2>
          </button>

          <button className="styledBtns" onClick={() => {closeEditor()}}>Return</button>
        </div>

        <div className="footer_div">
        <button className="play_btn" onClick={onPlayPause}>
          {isPlaying? 
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" className="bi bi-pause-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
            <path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0z"/>
          </svg>
          :<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" className="bi bi-play-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
            <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445"/>
          </svg>
          }
        </button>
          <div id="speed_cas" onClick={() => {
            if (pbRate === 1) {
              updatePBRate(0.25)
            }
            else {
              updatePBRate(pbRate + 0.25)
            }
            }}>
            <span className={(pbRate === 0.25 || pbRate === 0.50)? "speed_teeth teeth_half_active" : "speed_teeth teeth_active"}></span>
            <span className={(pbRate === 0.25)? "speed_teeth teeth_unactive" : (pbRate === 1)? "speed_teeth teeth_active" : "speed_teeth teeth_half_active"}></span>
            <div id="current_speed">Current Speed: {pbRate}x</div>
          </div>
        </div>


        <div className="footer_div">
          <button onClick={playAlong} className="play_btn" id="play_along">
          {playingAlong? 
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" className="bi bi-keyboard-fill" viewBox="0 0 16 16">
              <path d="M0 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm13 .25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5a.25.25 0 0 0-.25.25M2.25 8a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 3 8.75v-.5A.25.25 0 0 0 2.75 8zM4 8.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 5 8.75v-.5A.25.25 0 0 0 4.75 8h-.5a.25.25 0 0 0-.25.25M6.25 8a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 7 8.75v-.5A.25.25 0 0 0 6.75 8zM8 8.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 9 8.75v-.5A.25.25 0 0 0 8.75 8h-.5a.25.25 0 0 0-.25.25M13.25 8a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25zm0 2a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25zm-3-2a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h1.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25zm.75 2.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5a.25.25 0 0 0-.25.25M11.25 6a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25zM9 6.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5A.25.25 0 0 0 9.75 6h-.5a.25.25 0 0 0-.25.25M7.25 6a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 8 6.75v-.5A.25.25 0 0 0 7.75 6zM5 6.25v.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 6 6.75v-.5A.25.25 0 0 0 5.75 6h-.5a.25.25 0 0 0-.25.25M2.25 6a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h1.5A.25.25 0 0 0 4 6.75v-.5A.25.25 0 0 0 3.75 6zM2 10.25v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25h-.5a.25.25 0 0 0-.25.25M4.25 10a.25.25 0 0 0-.25.25v.5c0 .138.112.25.25.25h5.5a.25.25 0 0 0 .25-.25v-.5a.25.25 0 0 0-.25-.25z"/>
            </svg>
            :
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" className="bi bi-keyboard" viewBox="0 0 16 16">
              <path d="M14 5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM2 4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
              <path d="M13 10.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm0-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-5 0A.25.25 0 0 1 8.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 8 8.75zm2 0a.25.25 0 0 1 .25-.25h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5a.25.25 0 0 1-.25-.25zm1 2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-5-2A.25.25 0 0 1 6.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 6 8.75zm-2 0A.25.25 0 0 1 4.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 4 8.75zm-2 0A.25.25 0 0 1 2.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 2 8.75zm11-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-2 0a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-2 0A.25.25 0 0 1 9.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 9 6.75zm-2 0A.25.25 0 0 1 7.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 7 6.75zm-2 0A.25.25 0 0 1 5.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 5 6.75zm-3 0A.25.25 0 0 1 2.25 6h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5A.25.25 0 0 1 2 6.75zm0 4a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm2 0a.25.25 0 0 1 .25-.25h5.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-5.5a.25.25 0 0 1-.25-.25z"/>
            </svg>
          }
            <div id="play_along_info">Play Along: {playingAlong? "Enabled" : "Disabled"}</div>
          </button>
          <button disabled={!user} className="styledBtns" onClick={() => {verifyDeployment()}}>Deploy</button>
        </div>
      </div>
      {/* Change song_mapper to user when I pass into this component. If not logged in, have a note that says "Only registered accounts can upload maps to the internet" */}

      <div id="return_wrapper" style={returnStyle}>
        {(promptMenu === "Exit" || promptMenu === "Deploy") && 
        <div id="return_div">
          {(promptMenu === "Exit")?
          <>
            <h2>You are about to exit the editor. Are you sure?</h2>
            <h3>{mapSaved? "All changes are Saved" : "You have Unsaved Changes"}</h3>
            <div id="editor_exit">
              <button onClick={() => {
                setMenu(false)
                setTimeout(() => {
                  setPromptMenu("")
                }, 500)
              }}>No, Return to Editor</button>
              <button onClick={() => {
                clearMap()
              }}>Yes, Exit the Editor</button>
            </div>  
          </>
          :
          <>
            <h2>You are about to deploy your beatmap. Are you sure?</h2>
            <h3>{mapSaved? "All changes are Saved" : "You have Unsaved Changes"}</h3> 
            <h3>{missingData}</h3> 
            <div id="editor_exit">
              <button onClick={() => {
                setMenu(false)
                setTimeout(() => {
                  setPromptMenu("")
                  setMissingData("")
                  setDeployMessage("")
                  setDeploymentMap(null)
                }, 500)
              }}>No, Return to Editor</button>
              {(missingData === "" && deploymentMap && user) && 
                <button disabled={deployMessage!==""} onClick={() => {
                  canUserUpload()
                }}>Yes, Deploy my Beatmap</button>
              }
            </div>
            {(deployMessage !== "") && 
              <h2>{deployMessage}</h2>
            }
            {!user && 
            <h2>You must be logged in before submititng a beatmap</h2>
            }  
          </>
          }
        </div>
        }
      </div>
    </div>
  );

}