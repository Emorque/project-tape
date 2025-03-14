'use client'

import { ChangeEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWavesurfer } from '@wavesurfer/react'
import { FixedSizeList as List } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";

import "./editor.css";
// import Link from "next/link";

const barGradient = "linear-gradient(rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 0) 29px, rgba(255, 255, 255, 0.50) 30px, rgba(255, 255, 255, 0.50) 30px, rgba(0, 0, 0, 0) 30px, rgba(0, 0, 0, 0) 59px, rgba(255, 255, 255, 0.50) 60px, rgba(255, 255, 255, 0.50) 60px, rgba(0, 0, 0, 0) 60px, rgba(0, 0, 0, 0) 89px, rgba(255, 255, 255, 0.50) 90px, rgba(255, 255, 255, 0.50) 90px, rgba(0, 0, 0, 0) 90px, rgba(0, 0, 0, 0) 119px) no-repeat scroll 0px 0px / 100% 100% padding-box border-box"
const gameGradient = "linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 24%, rgba(255, 255, 255, 0.25) 25%, rgba(255, 255, 255, 0.25) 25%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 49.50%, rgba(255, 255, 255, 0.25) 50%, rgba(255, 255, 255, 0.25) 50%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 74%, rgba(255, 255, 255, 0.25) 75%, rgba(255, 255, 255, 0.25) 75%, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0) 100%) no-repeat scroll 0% 0% / 100% 100% padding-box border-box";
const formatTime = (seconds: number) => [seconds / 60, seconds % 60, (seconds % 1) * 100].map((v) => `0${Math.floor(v)}`.slice(-2)).join(':')


export default function Editor() {
  const [audioURL, setAudioURL] = useState<string>("")
  const [songLength, setSongLength] = useState<number>(0);    
  const [btn, setBtn] = useState<string>("Single Note");
  const [songNotes, setSongNotes] = useState<string[][]>([]);
  const [playBtnHold, setPlayBtnHold] = useState<boolean>(false);

  const waveformRef = useRef<HTMLDivElement>(null);
  const hitsoundsRef = useRef<{ play: () => void; }[]>([]);

  const { wavesurfer, isReady, isPlaying, currentTime } = useWavesurfer({
    container: waveformRef,
    url: audioURL,
    waveColor: 'rgba(138, 138, 19, 0.37)',
    progressColor: 'rgb(58, 49, 49)',
    cursorColor: 'rgb(250, 93, 93)',
    autoCenter: true,
    autoScroll: true,
    minPxPerSec: 256,
    height: 120,
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
    //   const hitsound  = new Audio('/testing_meyda/hitsound.mp3'); // Needed for github pages
      const hitsound  = new Audio('/hitsound.mp3'); // Needed for local 
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
      // const duration = wavesurfer.getDuration()
      const onScroll = () => {
        const scroll = wavesurfer.getScroll();
        if (vListRef.current) {
          vListRef.current.scrollToItem(scroll/16, 'start')
        }
        if (listRef.current) {
          console.log(currentTime)
          listRef.current.scrollToItem(currentTime/16, 'start')
        }
      };

      wavesurfer.on('timeupdate', onScroll); // Update on playback
      wavesurfer.on('scroll', onScroll); // Update on manual scroll

      return () => {
        wavesurfer.un('timeupdate', onScroll);
        wavesurfer.un('scroll', onScroll);
      };
    }
  }, [wavesurfer, currentTime]);

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
    if (listRef.current) {
      listRef.current.scrollToItem(itemIndex, 'start');
    }
    if (itemIndex){
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
  }, [itemIndex]);

  useEffect(() => {
    const handleKeyDown = (event: { key: string; }) => {
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
  }, [isPlaying, playBtnHold]);


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

  // const changeNoteHor = (index: number, event: MouseEvent<HTMLParagraphElement>) => {
  //   const mousePlacement = event.clientY - (document.getElementById('vBars-Container')?.getBoundingClientRect().top as number)
  //   if (0 < mousePlacement && mousePlacement <= 30) { // First Bar
  //     if (songNotes[2][index] === "S" || songNotes[2][index] === "T" || songNotes[3][index] === "S") {
  //       return
  //     }
  //     if (btn === "Turn Note") {
  //       setDoubleNote(0, 1, index)
  //     }
  //     else {
  //       setNewNote(0, 1, index, "S");
  //     }
  //   }
  //   else if (0 < mousePlacement && mousePlacement <= 60) { // Second Bar
  //     if (songNotes[2][index] === "S" || songNotes[2][index] === "T" || songNotes[3][index] === "S") {
  //       return
  //     }
  //     if (btn === "Turn Note") {
  //       setDoubleNote(0, 1, index)
  //     }
  //     else {
  //       setNewNote(1, 0, index, "S");
  //     }
  //   }
  //   else if (0 < mousePlacement && mousePlacement <= 90) { // Third Bar
  //     if (songNotes[0][index] === "S" || songNotes[0][index] === "T" || songNotes[1][index] === "S") {
  //       return
  //     }
  //     if (btn === "Turn Note") {
  //       setDoubleNote(2, 3, index)
  //     }
  //     else {
  //       setNewNote(2, 3, index, "S");
  //     }
  //   }
  //   else if (0 < mousePlacement && mousePlacement <= 120) { // Fourth Bar
  //     if (songNotes[0][index] === "S" || songNotes[0][index] === "T" || songNotes[1][index] === "S") {
  //       return
  //     }
  //     if (btn === "Turn Note") {
  //       setDoubleNote(2, 3, index)
  //     }
  //     else {
  //       setNewNote(3, 2, index, "S");
  //     }
  //   }
  // }

  const changeNoteVer = (index: number, event: MouseEvent<HTMLParagraphElement>) => {
    const hero_list_info = document.getElementById('hero_list')?.getBoundingClientRect();
    let mousePlacement;
    let hero_width;
    if (hero_list_info) {
      mousePlacement = event.clientX - hero_list_info.left
      hero_width = hero_list_info.right - hero_list_info.left
    }
    const temp = event.clientX - (document.getElementById('hero_list')?.getBoundingClientRect().left as number)
    // const hero_width = document.getElementById('hero_list')?.getBoundingClientRect();
    // console.log(hero_width)

    console.log(mousePlacement);
    console.log(temp)
    console.log(hero_width)



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
  };

  const setDoubleNote = (firstBar: number, secondBar: number, index: number) => {
    const newNotes = songNotes.map((songBar, barIndex) => {
      if (barIndex === firstBar || barIndex === secondBar) {
        return songBar.map((n, nIndex) => {
          if (nIndex === index) {
            if (n === "T") {
              return ""
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
    setSongNotes(newNotes)
  }  

  const setNewNote = (bar : number, otherBar: number, index:number, note:string) => {
    const newNotes = songNotes.map((songBar, barIndex) => {
      if (barIndex === bar) {
        return songBar.map((n, nIndex) => {
          if (nIndex === index) {
            if (n === note) {
              return ""
            }
            else {
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
      <p
        className="v-bar"
        onClick={(event) => changeNoteVer(index, event)}
        style={{ ...style, ...gameBarStyle(index) }} 
      >
      </p>
    );
  };

  const VRow = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const barStyle = (index: number) => {
      
      const horizontalGradients = [
        songNotes[0][index] === 'T' ? "linear-gradient(to right, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0px 0px / 100% 29px padding-box border-box" : songNotes[0][index] === 'S' ? "linear-gradient(to right, rgb(25, 87, 128) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0px 0px / 100% 29px padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0px 0px / 100% 29px padding-box border-box",
        songNotes[1][index] === 'T' ? "linear-gradient(to right, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0px 30px / 100% 29px padding-box border-box" : songNotes[1][index] === 'S' ? "linear-gradient(to right, rgb(182, 34, 34) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0px 30px / 100% 29px padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0px 30px / 100% 29px padding-box border-box",
        songNotes[2][index] === 'T' ? "linear-gradient(to right, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0px 60px / 100% 29px padding-box border-box" : songNotes[2][index] === 'S' ? "linear-gradient(to right, rgb(25, 87, 128) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0px 60px / 100% 29px padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0px 60px / 100% 29px padding-box border-box",
        songNotes[3][index] === 'T' ? "linear-gradient(to right, rgb(104, 61, 81) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0px 90px / 100% 29px padding-box border-box" : songNotes[3][index] === 'S' ? "linear-gradient(to right, rgb(182, 34, 34) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0px 90px / 100% 29px padding-box border-box" : "linear-gradient(to right, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 50%) no-repeat scroll 0px 90px / 100% 29px padding-box border-box",
      ];
    
      const updatedBG = `${barGradient}, ${horizontalGradients.join(", ")}`;
    
      return {
        background: updatedBG,
      };
    };
  
    return (
      <p
        className="i-bar"
        // onClick={(event) => changeNoteHor(index, event)}
        style={{ ...style, ...barStyle(index) }} 
      >
      </p>
    );
  };

  const updatePBRate = (rate: number) => {
    if (wavesurfer) {
      wavesurfer.setPlaybackRate(rate);
    }
  }

  const roundNote = (note: number) => {
    return Math.round(note / 10) * 10
  }

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
  
  return (
    <div id="editor_page">
      <br/>
      <div id="wave_bars">
        <div id="waveform-Container" ref={waveformRef}>
        </div>

        <div id="vBars-Container">
          <AutoSizer disableHeight>
            {({width}) => (
              <List
              ref={vListRef}
              className="hideScrollbar2"
              height={120} 
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

      
      <br/>
      <br/>
      
      <div id="hero_section">
        <div id="left_hero">
          <div>
            <button>Single Note</button>
            <button>Turn Note</button>
          </div>
          <button>Return</button>
        </div>
        <div id="hero_list">
          <AutoSizer disableHeight>
            {({width}) => (
              <List
              ref={listRef}
              className="scrollbar"
              height={500}
              itemCount={songLength}
              itemSize={16} 
              width={width} 
              >
                {HRows}
              </List>
            )}
          </AutoSizer>
        </div>
        
        <div id="right_hero">
          <button>Settings</button>
          <div>
            <button>Deploy</button>
            <button>Metadata</button>
          </div>
        </div>
      </div>

      <div id="song_controls">
        <p>{formatTime(currentTime)}</p>
        <div id="timeline"></div>
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
      </div>

      {/* <div id="gameContainer" >
        <List
          ref={listRef}
          className="scrollbar"
          height={500}
          itemCount={songLength}
          itemSize={16} 
          width={400} 
        >
          {HRows}
        </List>
      </div> */}
{/* 
      <div id="divWrapper">
        <div className="divContainer">
          <p>Current time:</p>

          <p>&quot;Q&quot; to Toggle</p>
        </div>

        <div className="divContainer">
          <p>Current Button:</p>
          <p>{btn}</p>
          <p>&quot;S&quot; for a Single Note</p>
          <p>&quot;K&quot; for a Turn Note</p>
        </div>

        <div className="divContainer">
          <p>Set Playrate</p>
          
        </div>
      </div> */}

      <br/>
      
      {/* {isReady &&
      <div id="exportDiv">
        <button onClick={exportMap}>Export Map</button>
        <Link href="./">Go Back</Link>
      </div>
      } */}
      <div style={{display: 'flex', gap: 20, flexDirection: 'column', alignItems: 'center', padding: 20}}>
          <input type="file" accept='audio/*' onChange={audioChange}/>
      </div>
    </div>
    
  );
}