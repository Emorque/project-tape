
import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
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
const gameGradient = "linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 24%, rgba(255, 255, 255, 0.25) 24%, rgba(255, 255, 255, 0.25) 25%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 49.25%, rgba(255, 255, 255, 0.25) 49.25%, rgba(255, 255, 255, 0.25) 50%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 74%, rgba(255, 255, 255, 0.25) 74%, rgba(255, 255, 255, 0.25) 75%, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0) 100%) no-repeat scroll 0% 0% / 100% 100% padding-box border-box";
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
  hitsoundsRef: {play : () => void;}[];
  clearMap : () => void;
  updateLocalMaps: () => void;
}

export const Editor = ({user, metadata, map_id, keybinds, songAudio, songFile, hitsoundsRef, clearMap, updateLocalMaps} : editorInterface) => {   
  const [songNotes, setSongNotes] = useState<string[][]>([])
  const [songLength, setSongLength] = useState<number>(0);    
  const [btn, setBtn] = useState<string>("Single Note");
  const [snapOn, setSnap] = useState<boolean>(true);

  const supabase = createClient()

  // All of the metadata
  // When setting metadata, like description, disable the other buttons being activiated. Like when pressing "P" for the description, don't play the song 
  const [songName, setSongName] = useState<string>(metadata?.song_metadata.song_name || "")
  const [songArtist, setSongArtist] = useState<string>(metadata?.song_metadata.song_artist || "")
  const [bpm, setBPM] = useState<number>(metadata?.song_metadata.bpm || 0)
  const [genre, setGenre] = useState<string>(metadata?.song_metadata.genre || "")
  const [language, setLanguage] = useState<string>(metadata?.song_metadata.language || "")
  const [noteCount, setNoteCount] = useState<number>(metadata?.song_metadata.note_count || 0)
  const [description, setDescription] = useState<string>(metadata?.song_metadata.description || "");
  const [source, setSource] = useState<string>(metadata?.song_metadata.source || "");
  const [ytBackground, setYTBackground] = useState<string>(metadata?.song_metadata.ytID || ""); //Fix to .ytbg
  const [timestamp, setTimestamp] = useState<string>(metadata?.timestamp || "0");
  const [deploymentMap, setDeploymentMap] = useState<editorMap | null>(null)
  const [deployMessage, setDeployMessage] = useState<string>("")

  const [ytOffset, setYTOffset] = useState<number>(metadata?.song_metadata.ytStart || 0)
  const [ytEnd, setYTEnd] = useState<number>(metadata?.song_metadata.ytEnd || 0)
  const ytOffsetRef = useRef<HTMLInputElement>(null)
  const ytEndRef = useRef<HTMLInputElement>(null)
  const ytIDRef= useRef<HTMLInputElement>(null)
  const prevID = useRef<string>("")

  useEffect(() => {
    if (ytOffsetRef.current && ytEndRef.current && ytIDRef.current){
      ytOffsetRef.current.value = (metadata?.song_metadata.ytStart || 0).toString()
      ytEndRef.current.value = (metadata?.song_metadata.ytEnd || 0).toString()
      ytIDRef.current.value = metadata?.song_metadata.ytID || ""
      prevID.current = metadata?.song_metadata.ytID || ""
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

  // String that will tell the user what fields of data are missing before deploying beatmap
  const [missingData, setMissingData] = useState<string>("")

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
    waveColor: '#0b7033',
    progressColor: 'rgb(87, 77, 97)',
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
        console.log("Please exit Inspect Mode. Project Tape is likely to crash if you edit with it open. Be sure to save your map often.")
      }
      console.log('Audio File', songFile)
    }
  }, [isReady])

  useEffect(() => {
    const handleKeyDown = (event: {key: string; repeat: boolean}) => {
      if (event.repeat) return;

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

      else if (event.key === keybindMappings.toggleMusic[0] || event.key === keybindMappings.toggleMusic[1]) {
        onPlayPause();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener on unmount
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [btn, pbRate, snapOn ])

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

  const changeNoteVer = (index: number, event: MouseEvent<HTMLParagraphElement>) => {
    if (isPlaying){ 
      console.log("Invalid")
      return;
    }
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
      songNotes[0][index] === 'T' ? "linear-gradient(135deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 33%, rgb(0, 0, 0) 33%,  rgb(0, 0, 0) 66%, rgb(184, 184, 184) 66%) no-repeat scroll 0% 0% / 25% 25% padding-box border-box, linear-gradient(225deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 35%, rgb(0, 0, 0) 35%, rgb(0, 0, 0) 67%, rgb(184, 184, 184) 67%) no-repeat scroll 0% 25% / 25% 25% padding-box border-box" : songNotes[0][index] === 'S' ? "linear-gradient(to bottom, rgb(184, 184, 184) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 25% 100% padding-box border-box" : "linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0% 0% / 25% 100% padding-box border-box",
      songNotes[1][index] === 'T' ? "linear-gradient(135deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 33%, rgb(0, 0, 0) 33%,  rgb(0, 0, 0) 66%, rgb(184, 184, 184) 66%) no-repeat scroll 33% 0% / 25% 25% padding-box border-box, linear-gradient(225deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 35%, rgb(0, 0, 0) 35%, rgb(0, 0, 0) 67%, rgb(184, 184, 184) 67%) no-repeat scroll 33% 25% / 25% 25% padding-box border-box" : songNotes[1][index] === 'S' ? "linear-gradient(to bottom, rgb(184, 184, 184) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 33.3% 0% / 25% 100% padding-box border-box" : "linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 33.3% 0% / 25% 100% padding-box border-box",
      songNotes[2][index] === 'T' ? "linear-gradient(45deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 33%, rgb(0, 0, 0) 33%,  rgb(0, 0, 0) 66%, rgb(184, 184, 184) 66%) no-repeat scroll 66% 0% / 25% 25% padding-box border-box, linear-gradient(315deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 33%, rgb(0, 0, 0) 33%, rgb(0, 0, 0) 67%, rgb(184, 184, 184) 67%) no-repeat scroll 66% 25% / 25% 25% padding-box border-box" : songNotes[2][index] === 'S' ? "linear-gradient(to bottom, rgb(184, 184, 184) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 66.6% 0% / 25% 100% padding-box border-box" : "linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 66.6% 0% / 25% 100% padding-box border-box",
      songNotes[3][index] === 'T' ? "linear-gradient(45deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 33%, rgb(0, 0, 0) 33%,  rgb(0, 0, 0) 66%, rgb(184, 184, 184) 66%) no-repeat scroll 99% 0% / 25% 25% padding-box border-box, linear-gradient(315deg, rgb(184, 184, 184) 0%, rgb(184, 184, 184) 33%, rgb(0, 0, 0) 33%, rgb(0, 0, 0) 67%, rgb(184, 184, 184) 67%) no-repeat scroll 99% 25% / 25% 25% padding-box border-box" : songNotes[3][index] === 'S' ? "linear-gradient(to bottom, rgb(184, 184, 184)50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 99.9% 0% / 25% 100% padding-box border-box" : "linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 99.9% 0% / 25% 100% padding-box border-box",
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
        bpm: bpm,
        genre: genre,
        language: language,
        note_count: noteCount,
        description: description,
        source : source,
        ytID: ytBackground,
        ytStart: ytOffset,
        ytEnd: ytEnd
      },
      song_notes : songNotes
    }
    localStorage.setItem("localMaps", JSON.stringify(localMaps));
    updateLocalMaps();
    console.log("Updated Map")
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
        bpm: bpm,
        genre: genre,
        language: language,
        note_count: noteCount,
        description: description,
        source : source
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
        song_mapper: user.user_metadata.username,
        bpm: bpm,
        genre: genre,
        language: language,
        note_count: noteCount,
        description: description,
        source : source
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

      let missingDataString = "Missing fields:"

      if (!localMaps[map_id].song_metadata.song_name) {
        missingDataString += " Song Name ,"
      }
      if (!localMaps[map_id].song_metadata.song_artist) {
        missingDataString += " Song Artist ,"
      }
      if (!localMaps[map_id].song_metadata.bpm) {
        missingDataString += " BPM ,"
      }
      if (!localMaps[map_id].song_metadata.genre) {
        missingDataString += " Genre ,"
      }
      if (!localMaps[map_id].song_metadata.language) {
        missingDataString += " Song Language ,"
      }
      if (!localMaps[map_id].song_metadata.note_count) {
        missingDataString += " Note Count ,"
      }
      if (!localMaps[map_id].song_metadata.source) {
        missingDataString += " YT Source ,"
      }

      if (missingDataString.length > 16) {
        setMissingData(missingDataString.slice(0, -1))
      }
      else {
        setDeploymentMap(localMaps[map_id])
        console.log("Deployment Map", localMaps[map_id])
      }

      console.log(isEqual)
      setMapSaved(isEqual)
      setPromptMenu("Deploy")
      setMenu(true)
    }
    else {
      setMapSaved(false)
      setPromptMenu("Deploy")
      setMenu(true)
    }
    console.log("Deploy Menu")
  }

  // const [beatmapUpload, setBeatmapUploading] = useState<boolean>(false)

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
      // console.log(timeDifference, oneDayInMilliseconds, currentTime.toString())
      if (timeDifference > oneDayInMilliseconds){
        localStorage.setItem("lastUpload", currentTime.toString())
        deployMap();
      }
      else {
        const remainingHours = Math.floor((oneDayInMilliseconds - timeDifference) / (3600 * 1000)); // Get hours
        const remainingMinutes = Math.floor(((oneDayInMilliseconds - timeDifference) % (3600 * 1000)) / (60 * 1000)); // Get minutes

        console.log("User has already uploaded a song in the last 24 hours.(LS)");
        setDeployMessage(`You Can Only Upload One Beatmap per Day. You Can Upload Again In ${remainingHours} Hours, ${remainingMinutes} Minutes.`)
        return;
      }
    }
    else {
      localStorage.setItem("lastUpload", currentTime.toString())
      deployMap();
    }
  }

  const deployMap = async () => {
    if (!songFile || !user || !deploymentMap) return;
    const localMaps = localStorage.getItem("localMaps");
    if (!localMaps) {
      setDeployMessage("Beatmap Not Saved. Unable To Deploy")
      console.log("Beatmap not saved. Unable to Deploy")
      return;
    }
    // const currentMap = JSON.parse(localMaps)
    console.log("deployMap")
    const current_metadata = deploymentMap.song_metadata
    const current_notes = deploymentMap.song_notes
    const song_metadata_upload = {
      "song_name" : current_metadata.song_name,
      "song_artist" : current_metadata.song_artist,
      "song_mapper" : user.user_metadata.username
    }

    const map_metadata_upload = {
      "bpm": current_metadata.bpm,
      "genre": current_metadata.genre,
      "source": current_metadata.source,
      "language": current_metadata.language,
      "song_name": current_metadata.song_name,
      "note_count": current_metadata.note_count,
      "description": current_metadata.description,
      "song_length": (songLength - 1) / 16
    }

    // console.log("SU", song_metadata_upload)
    // console.log("MU", map_metadata_upload)
    // return 
    const final_notes = formatNotes(current_notes)
    try {
      setDeployMessage("Beatmap Uploading...");

      const { data: recentUploads, error: uploadCheckError } = await supabase
      .from("pending_songs")
      .select("key")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Check for uploads in the last 24 hours

      if (uploadCheckError) {
        throw uploadCheckError;
      }

      if (recentUploads && recentUploads.length > 0) {
        console.log("User has already uploaded a song in the last 24 hours.");
        setDeployMessage("You Can Only Upload One Beatmap per Day.")
        return;
      }

      const file = songFile;
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${user.id}-${Math.random()}.${fileExt}`
      // user.id is needed with '/' because in my RLS, each user has their own folder, with the name {user.id}
      // so to be able to upload folders, that folder header with their id is needed to be included

      // Uploads song file to storage bucket
      const { error : songUploadError } = await supabase.storage.from('songs').upload(filePath, file);
      if (songUploadError) {
        throw songUploadError
      }

      const { error : beatmapUploadError, status } = await supabase
      .from('pending_songs')
      .insert([{
        'user_id' : user.id,
        'song_metadata' : song_metadata_upload,
        'map_metadata' : map_metadata_upload,
        "song_map" : final_notes,
        "song_link" : filePath
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
  }

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
    // if (listRef.current && isPlaying) {
    if (listRef.current) {
      listRef.current.scrollTo(currentTime * 256)
      // console.log("snap,useEffect", currentTime)
    }
  }, [currentTime])

  function scrollWindow(index : number)  {
    if (isPlaying) return;
    setTimeout(() => {
      if (wavesurfer && snapOn && listRef.current) {
        wavesurfer.setTime(index / 16)
        listRef.current.scrollTo(index * 16)
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
    console.log(event)
    if (isPlaying) return; // Prevent updates while playing
    if (wavesurfer) {
      const newTime = event.scrollOffset / 256;
      console.log("newTime", newTime)
      // Only update if the time has actually changed
      if (Math.abs(currentTime - newTime) > 0.03) {
        wavesurfer.setTime(newTime);
        console.log("updateTime", event.scrollOffset)
      }
    }
  }

  const singleBtnStyle = {
    backgroundColor: (btn === "Single Note")? "rgb(145, 168, 154)" : "#3a4447",
    color: (btn === "Single Note")? "#1a1a1a" : "rgb(145, 168, 154)"
  }
  
  const turnBtnStyle = {
    backgroundColor: (btn === "Turn Note")? "rgb(145, 168, 154)" : "#3a4447", 
    color: (btn === "Turn Note")? "#1a1a1a" : "rgb(145, 168, 154)"
  }
  const returnStyle = {
    visibility: (menu)? "visible" : "hidden",
    opacity: (menu)? 1 : 0,
    transition: 'opacity 500ms ease, visibility 500ms'
  } as React.CSSProperties

  const snapStyle= {
    backgroundColor: (snapOn)? "rgb(145, 168, 154)" : "#3a4447",
    color: (snapOn)? "#1a1a1a" : "rgb(145, 168, 154)"
  }

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

  const handleProgress = (state: any) => {
    if (state.playedSeconds >= ytEnd) {
      setVideoPlaying(false)
    }
  }

  const handleDuration = (duration: any) => {
    setVideoDuration(duration)
    if (ytIDRef.current && prevID.current !== ytIDRef.current.value && ytOffsetRef.current && ytEndRef.current) {
      prevID.current = ytIDRef.current.value
      ytOffsetRef.current.value = "0"
      ytEndRef.current.value = duration
      setYTOffset(0)
      setYTEnd(duration)
    }
  }

  return (
    <div id="editor_page">
      <div id="wave_bars">
        <div id="waveform_container" className={isPlaying? "no_scroll" : ""} ref={waveformRef}>
        </div>

        <div id="waveform_bars">
          <AutoSizer>
            {({height, width}) => (
              <List
              ref={vListRef}
              className={isPlaying? "no_scrollbar no_scroll" : "no_scrollbar"}
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
            <div>
              <label htmlFor="songName">Song Name:</label>
              <input 
                className="metadata_input"
                name="songName" 
                id="songName"
                type="text" 
                value={songName}
                onChange={(e) => setSongName(e.target.value)}
              ></input>
            </div>
            
            <div>
              <label htmlFor="songArtist">Song Artist:</label>
              <input 
                className="metadata_input"
                name="songArtist" 
                id="songArtist"
                type="text" 
                value={songArtist}
                onChange={(e) => setSongArtist(e.target.value)}
              ></input>
            </div>
           
            <div>
              <label htmlFor="songBPM">BPM:</label>
              <input 
                className="metadata_input"
                name="songBPM" 
                id="songBPM"
                type="number" 
                value={bpm}
                onChange={(e) => setBPM(parseInt(e.target.value))}
              ></input>
            </div>
           
            <div>
              <label htmlFor="songGenre">Genre:</label>
              <input 
                className="metadata_input"
                name="songGenre" 
                id="songGenre"
                type="text" 
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              ></input>
            </div>
            
            <div>
              <label htmlFor="songLanguage">Language:</label>
              <input
                className="metadata_input" 
                name="songLanguage" 
                id="songLanguage"
                type="text" 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              ></input>
            </div>
            
            <div>
              <label htmlFor="songDescription">Description:</label>
              <input 
                className="metadata_input"
                name="songDescription" 
                id="songDescription"
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></input>
            </div>

            <div>
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
            <label>Note Count: <br/>{noteCount}</label>
            <label>Last Updated: <br/>{formatDateFromMillis(timestamp)}</label>
            <br/>
            <div>
              <label htmlFor="ytBackground">Youtube ID:</label>
              <input 
                ref={ytIDRef}
                className="metadata_input"
                name="ytBackground" 
                id="ytBackground"
                type="text"
              ></input>
            </div>
            <button onClick={() => setYTBackground(ytIDRef.current?.value || "")}>Set Youtube ID</button>

            <div>
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

            <div>
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
            <button onClick={() => setTimestamps()}>Set Start/End Timestamps</button>
            <button onClick={() => setVideoPlaying(!videoPlaying)}>{videoPlaying? "Pause" : "Play"}</button>
            <button onClick={() => updatePlayerTime()}>Go To Start</button>
            <button onClick={() => setVideoMuted(!videoMuted)}>{videoMuted? "Unmute" : "Mute"}</button>
            
            <div id="youtube_frame">
              {/* <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${ytBackground}?si=1mZTLli-n2xhUurJ&amp;start=${ytOffset}&autoplay=1&mute=1`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
                >
              </iframe> */}
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
                    // cc_load_policy: 0, //Just setting it to 0 still puts the captions up. Opposite of the intent
                    disablekb: 1
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div id="hero_list">
          <div id="hero_editor">
            <div id="current_bar"></div>
            <AutoSizer>
              {({height, width}) => (
                <List
                ref={listRef}
                className={isPlaying? "scrollbar no_scroll" : "scrollbar"}
                height={height}
                itemCount={songLength}
                onScroll={
                  isPlaying? undefined : updateTime
                }
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
                <button style={{color: (pbRate === 1)? "#91a89a" : "#0b7033"}} className="playrate_btns" onClick={() => {updatePBRate(1)}}>1.00</button>
              </div>
            </div>
          </div>
          

          <button style={snapStyle} className="styledBtns" onClick={() => {setSnap(prevSnap => !prevSnap)}}>Snap {snapOn? "On" : "Off"}</button>
          <div id="notes">
            <button className="styledBtns" style={singleBtnStyle} onClick={() => {setBtn("Single Note")}}>Single Note</button>
            <button className="styledBtns" style={turnBtnStyle} onClick={() => {setBtn("Turn Note")}}>Turn Note</button>
          </div>
          <div id="save_return">
            <button disabled={disabledSave} className="styledBtns" id="beatmap_save_btn" onClick={() => {saveMap()}}>Save Locally
              <h2 id="beatmap_save_tooltip">Beatmap Saved</h2>
            </button>

            <button className="styledBtns" onClick={() => {closeEditor()}}>Return</button>
          </div>
          <button className="styledBtns" onClick={() => {verifyDeployment()}}>Deploy</button>
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