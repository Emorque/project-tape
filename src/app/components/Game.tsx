"use client";

// import Meyda, { MeydaFeaturesObject } from 'meyda';
import React, { ChangeEvent, RefObject, useEffect, useRef, useState } from 'react';
import "./game.css";
import gsap from 'gsap';

interface gameInterface {
  gMap: [number,string][]
}

export const Game = ({gMap} : gameInterface) => {   
  
  // console.log("GAME LOADED", gMap)
  // Audio Sources
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const audioRefListening = useRef<HTMLAudioElement>(null);
  const audioRefSetting = useRef<HTMLAudioElement>(null);
  const editorAudioRef = useRef<HTMLAudioElement>(null);

  // Game Visuals
  const gameContainer = useRef<HTMLDivElement>(null);
  const scoreline = useRef<HTMLDivElement>(null);
  const gameWrapper = useRef<HTMLDivElement>(null);
  
  const circleOne = useRef<HTMLDivElement>(null);
  const circleTwo = useRef<HTMLDivElement>(null);
  const circleThree = useRef<HTMLDivElement>(null);
  const circleFour = useRef<HTMLDivElement>(null);

  const firstSection = useRef<HTMLDivElement>(null);
  const secondSection = useRef<HTMLDivElement>(null);

  // Game controls
  const [scrollSpeed, setScrollSpeed] = useState<number>(1000);

  const [direction, setDirection] = useState<string>("Right");

  const [usingCustomMap, setCustomMap] = useState<boolean>(false);
  const [usingEditorMap, setEditorMap] = useState<boolean>(false);
  const [opacityEnabled, setOpacity] = useState<string>("On");

  // Stopwatch
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [stopwatchActive, setStopwatchActive] = useState<boolean>(false);
  const [stPaused, setStPaused] = useState<boolean>(true);
  const [time, setTime] = useState<number>(0);

  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [hitCount, setHitCount] = useState<number>(0);
  const [missCount, setMissCount] = useState<number>(0);
  const [noteCount, setNoteCount] = useState<number>(0);

  // Custom Map
  const [leftBtnActive, setLeftBtnActive] = useState<boolean>(false);
  const [leftBtnHold, setLeftBtnHold] = useState<boolean>(false);

  const [rightBtnActive, setRightBtnActive] = useState<boolean>(false);
  const [rightBtnHold, setRightBtnHold] = useState<boolean>(false);

  const [leftActionBtnActive, setLeftActionBtn] = useState<boolean>(false);
  const [leftActionBtnHold, setLeftActionBtnHold] = useState<boolean>(false);
  const [rightActionBtnActive, setRightActionBtn] = useState<boolean>(false);
  const [rightActionBtnHold, setRightActionBtnHold] = useState<boolean>(false);

  const [leftTiming, setLeftTiming] = useState<[number,string][]>([])
  const [rightTiming, setRightTiming] = useState<[number,string][]>([])
  const [turnTiming, setTurnTiming] = useState<[number,string][]>([])

  const [leftNotes, setLeftNotes] = useState<[number,string][]>([])
  const [rightNotes, setRightNotes] = useState<[number,string][]>([])
  const [turnNotes, setTurnNotes] = useState<[number,string][]>([])

  const [firstHitsound, setFirstHitsound] = useState<number>(0);
  const [secondHitsound, setSecondHitsound] = useState<number>(0);
  const [thirdHitsound, setThirdHitsound] = useState<number>(0);
  const [fourthHitsound, setFourthHitsound] = useState<number>(0);

  const [toggleBtnHold, setToggleBtnHold] = useState<boolean>(false);
  const [resetBtnHold, setResetBtnHold] = useState<boolean>(false);

  // Styling States
  const [settingsDiv, setSettingsDiv] = useState<boolean>(false);

  const hitsoundsRef = useRef<{ play: () => void; }[]>([]);

  // Editor Map //Uncomment the below code to reintegrate user maps
  // const [editorMapExists, setEditorMapExists] = useState<boolean>(false); 
  const [editorURL, setEditorURL] = useState<string | null>(null)
  const [editorBtn, setEditorBtn] = useState<boolean>(false);
  // const [eMap, setEMap] = useState<[]>([])

    const editorChange = (e: ChangeEvent<HTMLInputElement>) => { 
      const file = e.target.files?.[0];
      if (!file) return;
      setEditorURL(URL.createObjectURL(file));
      setEditorBtn(true);
    }

    const playEditor = () => {
      setCustomMap(false);
      setEditorMap(true);
      
      if (audioRefSetting.current) {
        audioRefSetting.current.pause();
        audioRefSetting.current.currentTime = 0;
      }        
      if (audioRefListening.current) {
        audioRefListening.current.pause();
        audioRefListening.current.currentTime = 0;
      }
      if (editorAudioRef.current) {
        editorAudioRef.current.pause();
        editorAudioRef.current.currentTime = 0;
      }

      setTime(0);
      setStopwatchActive(false);
      setStPaused(true);
      setScore(0);
      // setHighScore(0);
      setHitCount(0);
      setMissCount(0);
      setNoteCount(0);

      const tempHitsounds: { play: () => void; }[] = []
      for (let i = 0; i < 12; i++) {
        // const hitsound  = new Audio('/testing_meyda/hitsound.mp3'); // Needed for github pages
        const hitsound  = new Audio('/hitsound.mp3'); // Needed for local 
        hitsound.volume = 1
        tempHitsounds.push(hitsound);
      } 
      hitsoundsRef.current = tempHitsounds;

      // const res = (eMap.sort((firstItem: [number,string], secondItem: [number,string]) => firstItem[0] - secondItem[0]))
      
      setTimeout(() => {
        setStopwatchActive(true);
        setStPaused(false);
      }, scrollSpeed)

      setTimeout(() => {
        if (editorAudioRef.current) {
          editorAudioRef.current.play();
        }  
      }, scrollSpeed * 2)
      
      document.querySelectorAll(".curve").forEach(e => e.remove());
    }

    useEffect(() => {

      if (stopwatchActive && !stPaused) {
        intervalRef.current = setInterval(() => {
          setTime((time) => time + 10);
        }, 10)}
      else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null
        };
      }
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null
        };
      }
      }, [stopwatchActive, stPaused]);

      const handleInput = (
        timingList: [number, string][],
        setTimingList: React.Dispatch<React.SetStateAction<[number, string][]>>,
        hitsoundIndex: number,
        setHitsoundIndex: React.Dispatch<React.SetStateAction<number>>,
        direction: string,
        note: string
      ) => {
        const message = document.createElement('p');
        message.classList.add("message");
        message.classList.add(direction);
      
        // Check for "Perfect" hit
        if (timingList[0][0] + 75 >= time && time > timingList[0][0] - 75 && timingList[0][1] === note) {
          hitsoundsRef.current[hitsoundIndex].play();
          setHitsoundIndex((index) => (index + 1) % 3); 
          setScore((score) => score + 5); 
          setHitCount((count) => count + 1); 
          setTimingList((list) => list.slice(1)); 
      
          message.textContent = "Perfect";
          message.style.backgroundColor = "green";
          if (gameWrapper.current) gameWrapper.current.appendChild(message);
          setTimeout(() => {
            if (gameWrapper.current) gameWrapper.current.removeChild(message);
          }, 500);
        }
      
        // Check for "Success" hit
        else if (timingList[0][0] + 150 >= time && time > timingList[0][0] - 150 && timingList[0][1] === note) {
          hitsoundsRef.current[hitsoundIndex].play();
          setHitsoundIndex((index) => (index + 1) % 3); 
          setScore((score) => score + 3); 
          setHitCount((count) => count + 1); 
          setTimingList((list) => list.slice(1)); 
      
          message.textContent = "Success";
          message.style.backgroundColor = "green";
          if (gameWrapper.current) gameWrapper.current.appendChild(message);
          setTimeout(() => {
            if (gameWrapper.current) gameWrapper.current.removeChild(message);
          }, 500);
        }
      };
    


    useEffect(() => {
      const handleKeyDown = (event: { key: string; }) => {
        if (event.key === 'a' || event.key === 'A') {
          setLeftBtnActive(true);
          if (leftBtnHold) return;
          setLeftBtnHold(true);
          if (direction === "Left") return
          moveLeft();
          if (turnTiming.length === 0) {
          }
          else {
            handleInput(turnTiming, setTurnTiming, firstHitsound, setFirstHitsound, "leftMessage", "FT")
          }
        }



        if (event.key === 'd' || event.key === 'D') {
          setRightBtnActive(true);
          if (rightBtnHold) return;
          setRightBtnHold(true);
          if (direction === "Right") return
          moveRight();
          if (turnTiming.length === 0) {
          }
          else {
            handleInput(turnTiming, setTurnTiming, thirdHitsound, setThirdHitsound, "rightMessage", "ST")
          }
        }

        if (event.key === 'j' || event.key === 'J') {
          setLeftActionBtn(true);
          if (leftActionBtnHold) return;
          setLeftActionBtnHold(true);

          if (direction === 'Left') {
            if (leftTiming.length === 0) {
            }
            else {
              if (time < leftTiming[0][0] - 150) {  
                const message = document.createElement('p');
                message.classList.add("message");
                message.classList.add("leftMessage")
                message.classList.add("earlyLeft");
                message.textContent= "Early";
                if (gameWrapper.current) gameWrapper.current.appendChild(message);
                setTimeout(() => {
                  if (gameWrapper.current) gameWrapper.current.removeChild(message);  
                }, 500);
              }
              handleInput(leftTiming, setLeftTiming, firstHitsound, setFirstHitsound, "leftMessage", "FL")
            }
          }

          else {
            if (leftTiming.length === 0) {
            }
            else {
              if (time < leftTiming[0][0] - 150) {
                const message = document.createElement('p');
                message.classList.add("message");
                message.classList.add("rightMessage")
                message.textContent= "Early";
                message.classList.add("earlyRight");
                if (gameWrapper.current) gameWrapper.current.appendChild(message);
                setTimeout(() => {
                  if (gameWrapper.current) gameWrapper.current.removeChild(message);  
                }, 500);
              }
  
              handleInput(leftTiming, setLeftTiming, thirdHitsound, setThirdHitsound, "rightMessage", "SL")
            }
          }
        }

        if (event.key === 'l' || event.key === 'L') {
          setRightActionBtn(true);
          if (rightActionBtnHold) return;
          setRightActionBtnHold(true);

          if (direction === 'Left') {
            if (rightTiming.length === 0) {
            }
            else {
              if (time < rightTiming[0][0] - 150) {  
                const message = document.createElement('p');
                message.classList.add("message");
                message.classList.add("leftMessage")
                message.classList.add("earlyLeft");
                message.textContent= "Early";
                if (gameWrapper.current) gameWrapper.current.appendChild(message);
                setTimeout(() => {
                  if (gameWrapper.current) gameWrapper.current.removeChild(message);  
                }, 500);
              }

              handleInput(rightTiming, setRightTiming, secondHitsound, setSecondHitsound, "leftMessage", "FR")
            }
          }

          else {
            if (rightTiming.length === 0) {
            }
            else {
              if (time < rightTiming[0][0] - 150) {  
                const message = document.createElement('p');
                message.classList.add("message");
                message.classList.add("rightMessage")
                message.textContent= "Early";
                message.classList.add("earlyRight");
                if (gameWrapper.current) gameWrapper.current.appendChild(message);
                setTimeout(() => {
                  if (gameWrapper.current) gameWrapper.current.removeChild(message);  
                }, 500);
              }

              handleInput(rightTiming, setRightTiming, fourthHitsound, setFourthHitsound, "rightMessage", "SR")
            }
          }
        } 

        if (event.key === 'p' || event.key === "P") {
          if (resetBtnHold) return
          setResetBtnHold(true);
          if (usingCustomMap) {
            customMap()
          }
          else if (usingEditorMap) {
            playEditor()
          }
        }
        if (event.key === 'q' || event.key === "Q") {
          if (toggleBtnHold) return;
          setToggleBtnHold(true);
          if (usingCustomMap) {
            toggleMap();
          }
          else if (usingEditorMap) {
            toggleEditor();
          }
        }
      }
      document.addEventListener('keydown', handleKeyDown);
  
      // Cleanup the event listener on unmount
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [time, direction, leftBtnHold, rightBtnHold, toggleBtnHold, resetBtnHold, leftTiming, rightTiming, turnTiming]);

    useEffect(() => {
      const handleKeyUp = (event: { key: string; }) => {
        if (event.key === 'a' || event.key === 'A') {
          setLeftBtnActive(false);
          setLeftBtnHold(false);
        }
        if (event.key === 'd' || event.key === 'D') {
          setRightBtnActive(false);
          setRightBtnHold(false);
        }
        if (event.key === 'j' || event.key === 'J') {
          setLeftActionBtn(false);
          setLeftActionBtnHold(false);
        }
        if (event.key === 'l' || event.key === 'L') {
          setRightActionBtn(false);
          setRightActionBtnHold(false);
        }
        if (event.key === 'q' || event.key === "Q") {
          setToggleBtnHold(false);
        }
        if (event.key === 'p' || event.key === "P") {
          setResetBtnHold(false);
        }
      }
      document.addEventListener('keyup', handleKeyUp);
  
      // Cleanup the event listener on unmount
      return () => {
        document.removeEventListener('keyup', handleKeyUp);
      };
    }, []);

    useEffect(() => {
      if (score > highScore) {
        setHighScore(score);  
      }
    }, [score, highScore]);


    const moveLeft = () => {
      gsap.to("#scoreline", {rotate: "45deg", duration: "0.2"}) // Duration can now be adjustable to user choice :). 0.5 seems to be the default
      setDirection("Left")
    }

    const moveRight = () => {
      gsap.to("#scoreline", {rotate: "-45deg", duration: "0.2"})
      setDirection("Right")
    }

    const firstSectionStyle = {
      opacity: ((direction === "Right") && (opacityEnabled === 'On'))? "0.60": "1",      
      transition: 'opacity 0.2s linear'
    }
    const secondSectionStyle = {
      opacity: ((direction === "Left") && (opacityEnabled === 'On'))? "0.60": "1",  
      transition: 'opacity 0.2s linear'
    }

    const leftBtnStyle = {
      backgroundColor: leftBtnActive? "grey" : "black",
      color: leftBtnActive? "black" : "white",
      padding: 5,
    }

    const rightBtnStyle = {
      backgroundColor: rightBtnActive? "grey" : "black",
      color: rightBtnActive? "black" : "white",
      padding: 5,
    }

    const leftActionBtnStyle = {
      backgroundColor: leftActionBtnActive? "grey" : "black",
      color: leftActionBtnActive? "black" : "white",
      padding: 5,
      width: "fit-content"
    }

    const rightActionBtnStyle = {
      backgroundColor: rightActionBtnActive? "grey" : "black",
      color: rightActionBtnActive? "black" : "white",
      padding: 5,
      width: "fit-content"
    }

    const currentArea = {
      backgroundColor: (direction === 'Right')? "rgba(182, 34, 34)" : "rgba(25, 86, 128)",
      width: "fit-content",
      color: "#eaeaea",
      padding: "5px 10px",
    }


    const toggleMap = () => {
      const curves = document.querySelectorAll('.curve');
      if (audioRefListening.current) {
        if (audioRefListening.current.paused) {
          audioRefListening.current.play();
          setStopwatchActive(true);
          setStPaused(false);
          for (let i = 0; i < curves.length; i++) {
            (curves[i] as HTMLParagraphElement).style.animationPlayState = "running";
          }
        }
        else {
          audioRefListening.current.pause();
          setStopwatchActive(false);
          setStPaused(true);
          for (let i = 0; i < curves.length; i++) {
            (curves[i] as HTMLParagraphElement).style.animationPlayState = "paused";
          }
        }
      }
    }

    const toggleEditor = () => {
      const curves = document.querySelectorAll('.curve');
      if (editorAudioRef.current) {
        if (editorAudioRef.current.paused) {
          editorAudioRef.current.play();
          setStopwatchActive(true);
          setStPaused(false);
          for (let i = 0; i < curves.length; i++) {
            (curves[i] as HTMLParagraphElement).style.animationPlayState = "running";
          }
        }
        else {
          editorAudioRef.current.pause();
          setStopwatchActive(false);
          setStPaused(true);
          for (let i = 0; i < curves.length; i++) {
            (curves[i] as HTMLParagraphElement).style.animationPlayState = "paused";
          }
        }
      }
    }


    const customMap = () => {
      setCustomMap(true);
      setEditorMap(false);
      setAudioURL('https://9boushb4a7.ufs.sh/f/9Jv1QVILGRy4BnZDzY7GTJ0cX8hyuefiOLVSvntDKg5EZ1dl');
      
      if (audioRefSetting.current) {
        audioRefSetting.current.pause();
        audioRefSetting.current.currentTime = 0;
      }        
      if (audioRefListening.current) {
        audioRefListening.current.pause();
        audioRefListening.current.currentTime = 0;
      }


      setTime(0);
      setStopwatchActive(false);
      setStPaused(true);
      setScore(0);
      // setHighScore(0);
      setHitCount(0);
      setMissCount(0);
      setNoteCount(0);

      const tempHitsounds: { play: () => void; }[] = []
      for (let i = 0; i < 12; i++) {
        // const hitsound  = new Audio('/testing_meyda/hitsound.mp3'); // Needed for github pages
        const hitsound  = new Audio('/hitsound.mp3'); // Needed for local 
        hitsound.volume = 1
        tempHitsounds.push(hitsound);
      } 
      hitsoundsRef.current = tempHitsounds;

      // const song: [number,string][] = [
      //   [1000, "FL"], [1000, "FR"],  [1430, "FL"], [1740, "FL"], [2070, "FL"], [2420, "FL"], [3690, "FL"], 
      //   [4370, "FL"], [4690, "FL"], [5030, "FL"], [6240, "FL"], [6580, "FL"], 
      //   [6880, "FL"], [7190, "FL"], [7500, "FL"], [7820, "FL"], [8130, "FL"], 
      //   [8450, "FL"], [9060, "FL"], [9390, "FL"], [9710, "FL"], [10050, "FL"], 
      //   [10370, "FL"], [10670, "FL"], [10940, "FL"], [11260, "FL"], [14120, "FL"], 
      //   [16660, "FL"], [21290, "FL"], [23230, "FL"], [23860, "FL"], [25060, "FL"], 
      //   [42220, "FL"], [42360, "FL"], [42700, "FL"], [43090, "FL"], [43470, "FL"], 
      //   [43600, "FL"], [43930, "FL"], [49150, "FL"], [49500, "FL"], [49810, "FL"], 
      //   [50120, "FL"], [50450, "FL"], [50770, "FL"], [51110, "FL"], [51390, "FL"], 
      //   [51720, "FL"], [52010, "FL"], [52150, "FL"], [52300, "FL"], [52430, "FL"], 
      //   [52750, "FL"], [53060, "FL"], [53410, "FL"], [53550, "FL"], [53690, "FL"], 
      //   [54820, "FL"], [57160, "FL"], [57320, "FL"], [57440, "FL"], [65660, "FL"], 
      //   [66010, "FL"], [66120, "FL"], [66440, "FL"], [66770, "FL"], [67110, "FL"], 
      //   [68870, "FL"], [69200, "FL"], [69510, "FL"], [69840, "FL"], [69980, "FL"], 
      //   [70230, "FL"], [70530, "FL"], [70820, "FL"], [71280, "FL"], [71600, "FL"], 
      //   [71880, "FL"], [72190, "FL"], [80030, "FL"], [82570, "FL"], [83220, "FL"], 
      //   [84500, "FL"], [85140, "FL"], [89690, "FL"], [89830, "FL"], [89990, "FL"], 
      //   [90660, "FL"], [91090, "FL"],
      //   [91480, "FL"], [91910, "FL"], [93150, "FL"], [93450, "FL"], [95000, "FL"],
      //   [95370, "FL"], [95540, "FL"], [95890, "FL"], [102830, "FL"], [102990, "FL"],
      //   [103570, "FL"], [103730, "FL"], [129490, "FL"], [129620, "FL"], [129950, "FL"],
      //   [132880, "FL"], [133200, "FL"], [135410, "FL"], [135740, "FL"], [136040, "FL"],
      //   [136360, "FL"], [136680, "FL"], [137010, "FL"], [142270, "FL"], [143270, "FL"],
      //   [143630, "FL"], [143790, "FL"], [143980, "FL"], [144160, "FL"], [145470, "FL"],
      //   [146110, "FL"], [146750, "FL"], [146900, "FL"], [147310, "FL"], [147650, "FL"],
      //   [148460, "FL"], [148650, "FL"], [151620, "FL"], [151780, "FL"], [151930, "FL"],
      //   [153040, "FL"], [154260, "FL"], [154510, "FL"], [155330, "FL"], [157770, "FL"],
      //   [160340, "FL"], [161620, "FL"], [164030, "FL"], [166810, "FL"], [167090, "FL"], 
      //   [167370, "FL"], [168940, "FL"], [169230, "FL"],
      //   [169550, "FL"], [170830, "FL"], [171130, "FL"], [171960, "FL"], [172350, "FL"],
      //   [173250, "FL"], [173390, "FL"], [173710, "FL"], [174390, "FL"], [178270, "FL"],
      //   [178680, "FL"], [178820, "FL"], [179500, "FL"], [179620, "FL"], [180620, "FL"],
      //   [198520, "FL"], [198700, "FL"], [200040, "FL"], [200180, "FL"], [200440, "FL"],
      //   [200560, "FL"], [201730, "FL"], [202220, "FL"], [202430, "FL"], [203180, "FL"],
      //   [203890, "FL"], [204000, "FL"], [204660, "FL"], [204810, "FL"], [205280, "FL"],
      //   [205590, "FL"], [207850, "FL"], [208110, "FL"], [208240, "FL"], [208560, "FL"],
      //   [208870, "FL"], [209040, "FL"], [209870, "FL"], [210080, "FL"], [210330, "FL"],
      //   [211680, "FL"], [228090, "FL"], [228390, "FL"], [228540, "FL"], [228680, "FL"],
      //   [228950, "FL"], [229100, "FL"], [229240, "FL"], [229380, "FL"], [231530, "FL"],
      //   [231650, "FL"], [231920, "FL"], [232050, "FL"], [232210, "FL"], [233310, "FL"],
      //   [233810, "FL"], [234260, "FL"], [234550, "FL"], [234670, "FL"], [234950, "FL"],
      //   [235060, "FL"], [235370, "FL"], [235480, "FL"], [235730, "FL"], [235860, "FL"],
      //   [236030, "FL"], [236810, "FL"], [236940, "FL"], [249870, "FL"], [249980, "FL"],
      //   [250300, "FL"], [250430, "FL"], [250740, "FL"], [250890, "FL"], [251050, "FL"],
      //   [251200, "FL"], [251370, "FL"], [251540, "FL"], [253180, "FL"], [259840, "FL"],
      //   [260770, "FL"], [262260, "FL"], [264180, "FL"], [266110, "FL"],
      //   [268010, "FL"], [269360, "FL"], [270840, "FL"], [271130, "FL"], [271270, "FL"],
      //   [280070, "FL"], [280620, "FL"], [281030, "FL"], [281780, "FL"], [282810, "FL"],
      //   [282960, "FL"], [283110, "FL"], [283400, "FL"], [283800, "FL"], [284860, "FL"],
      //   [285220, "FL"], [285930, "FL"], [286110, "FL"], [287220, "FL"], [287430, "FL"],
      //   [288320, "FL"], [289140, "FL"], [289570, "FL"], [291490, "FL"], [291940, "FL"],
      //   [292380, "FL"], [294280, "FL"], [294730, "FL"], [297960, "FL"], [298410, "FL"],
      //   [298710, "FL"], [299030, "FL"], [299150, "FL"], [299520, "FL"], [299910, "FL"],
      //   [300500, "FL"], [314740, "FL"], [315070, "FL"], [315220, "FL"], [315480, "FL"],
      //   [316230, "FL"], [316370, "FL"], [316690, "FL"], [317110, "FL"], [317580, "FL"], 
      //   [352050, "FL"], [352890, "FL"], [353200, "FL"], [354060, "FL"], [354330, "FL"],
      //   [355220, "FL"], [355520, "FL"], [356390, "FL"], [356690, "FL"], [357570, "FL"],
      //   [357870, "FL"], [358760, "FL"], [359060, "FL"], [359940, "FL"], [360250, "FL"],
      //   [361150, "FL"], [361440, "FL"], [362280, "FL"], [362590, "FL"], [363190, "FL"],



      //   [44390, "FR"], [44900, "FR"], [45010, "FR"], [45390, "FR"], [45500, "FR"],
      //   [45960, "FR"], [46070, "FR"], [46620, "FR"], [46920, "FR"], [47560, "FR"],
      //   [47910, "FR"], [48240, "FR"], [48560, "FR"], [48860, "FR"], [54020, "FR"],
      //   [54510, "FR"], [54660, "FR"], [55240, "FR"], [55550, "FR"], [55930, "FR"],
      //   [56040, "FR"], [56370, "FR"], [56680, "FR"], [57020, "FR"], [62220, "FR"],
      //   [62380, "FR"], [62530, "FR"], [62820, "FR"],   [92280, "FR"], [92610, "FR"], [92790, "FR"], [93840, "FR"], [94010, "FR"],
      //   [94280, "FR"], [94680, "FR"], [103140, "FR"], [103320, "FR"], [104800, "FR"],
      //   [105000, "FR"], [105310, "FR"], [105650, "FR"], [107580, "FR"], [107730, "FR"],
      //   [108070, "FR"], [108400, "FR"], [109540, "FR"], [109900, "FR"], [110770, "FR"],
      //   [111450, "FR"], [111760, "FR"], [111900, "FR"], [113040, "FR"], [113180, "FR"],
      //   [113350, "FR"], [113520, "FR"], [113670, "FR"], [113860, "FR"], [114020, "FR"],
      //   [115020, "FR"], [115330, "FR"], [115900, "FR"], [116220, "FR"], [116580, "FR"],
      //   [116940, "FR"], [117170, "FR"], [117340, "FR"], [117470, "FR"], [119620, "FR"],
      //   [119810, "FR"], [119980, "FR"], [120120, "FR"], [120500, "FR"], [120800, "FR"],
      //   [123250, "FR"], [130660, "FR"], [131010, "FR"], [131310, "FR"], [131630, "FR"],
      //   [131970, "FR"], [132250, "FR"], [133520, "FR"], [133830, "FR"], [134120, "FR"],
      //   [134440, "FR"], [134790, "FR"], [135100, "FR"], [137610, "FR"], [137930, "FR"],
      //   [138260, "FR"], [138550, "FR"], [142920, "FR"], [144430, "FR"], [144860, "FR"],
      //   [145790, "FR"], [146420, "FR"], [146580, "FR"], [147980, "FR"], [148300, "FR"],
      //   [148790, "FR"], [154920, "FR"], [155550, "FR"], [155780, "FR"], [157110, "FR"],
      //   [158370, "FR"], [167710, "FR"], [168060, "FR"], [168370, "FR"], [168710, "FR"],
      //   [169890, "FR"], [170050, "FR"], [170330, "FR"], [170650, "FR"], [171610, "FR"],
      //   [172730, "FR"], [173080, "FR"], [177400, "FR"], [177780, "FR"], [178090, "FR"], [179180, "FR"], [179350, "FR"],
      //   [179960, "FR"], [180280, "FR"], [181180, "FR"], [182520, "FR"], [182840, "FR"],
      //   [183360, "FR"], [183490, "FR"], [184680, "FR"], [185350, "FR"], [185650, "FR"],
      //   [186340, "FR"], [186500, "FR"], [187150, "FR"], [188240, "FR"], [188430, "FR"],
      //   [189100, "FR"], [189230, "FR"], [191090, "FR"], [218530, "FR"], [218930, "FR"],
      //   [219200, "FR"], [219320, "FR"], [219720, "FR"], [220010, "FR"], [220140, "FR"],
      //   [220390, "FR"], [221320, "FR"], [221560, "FR"], [221700, "FR"], [227840, "FR"],
      //   [229970, "FR"], [230470, "FR"], [230730, "FR"], [230840, "FR"], [231100, "FR"],
      //   [231230, "FR"], [232380, "FR"], [232500, "FR"], [236190, "FR"], [236510, "FR"],
      //   [236670, "FR"], [237600, "FR"], [238080, "FR"], [238220, "FR"], [240030, "FR"],
      //   [240300, "FR"], [240460, "FR"], [240650, "FR"], [242150, "FR"], [242260, "FR"],
      //   [242570, "FR"], [242670, "FR"], [243030, "FR"], [243150, "FR"], [243410, "FR"],
      //   [244640, "FR"], [251930, "FR"], [252250, "FR"], [252500, "FR"], [252690, "FR"],   [261790, "FR"], [263690, "FR"], [265620, "FR"], [267540, "FR"], [269230, "FR"],
      //   [272830, "FR"], [274300, "FR"], [290370, "FR"], [290870, "FR"], [293180, "FR"],
      //   [293880, "FR"], [295090, "FR"], [295560, "FR"], [296250, "FR"], [296600, "FR"],
      //   [297010, "FR"], [297130, "FR"], [297500, "FR"], [297800, "FR"], [307080, "FR"],
      //   [307540, "FR"], [307990, "FR"], [308270, "FR"], [308590, "FR"], [308720, "FR"],
      //   [309140, "FR"], [335840, "FR"], [336260, "FR"], [336680, "FR"], [337020, "FR"],
      //   [337890, "FR"], [338210, "FR"], [338650, "FR"], [339100, "FR"], [339420, "FR"],
      //   [340290, "FR"], [340600, "FR"], [341060, "FR"], [341470, "FR"], [341790, "FR"],
      //   [342080, "FR"], [342360, "FR"], [342670, "FR"], [342990, "FR"], [343270, "FR"],
      //   [343570, "FR"], [344160, "FR"], [344390, "FR"], [345260, "FR"], [345570, "FR"],
      //   [346480, "FR"], [346750, "FR"], [347630, "FR"], [347920, "FR"], [348810, "FR"],
      //   [349100, "FR"], [349980, "FR"], [350240, "FR"], [351170, "FR"], [351470, "FR"],
      //   [352350, "FR"], [352620, "FR"], [353510, "FR"], [353790, "FR"], [354640, "FR"],
      //   [354930, "FR"],



      //   [25290, "SL"], [26090, "SL"], [26440, "SL"], [26760, "SL"], [27590, "SL"],
      //   [27880, "SL"], [28190, "SL"], [28510, "SL"], [28830, "SL"], [29150, "SL"],
      //   [29520, "SL"], [29860, "SL"], [30550, "SL"], [30850, "SL"], [35440, "SL"],
      //   [35880, "SL"], [36210, "SL"], [36530, "SL"], [36880, "SL"], [37170, "SL"],
      //   [37510, "SL"], [37830, "SL"], [38150, "SL"], [38450, "SL"], [38780, "SL"],
      //   [39080, "SL"], [39380, "SL"], [39700, "SL"], [39840, "SL"], [40300, "SL"],
      //   [40620, "SL"], [57780, "SL"], [58120, "SL"], [58440, "SL"], [58570, "SL"],
      //   [58710, "SL"], [58860, "SL"], [59010, "SL"], [59160, "SL"], [59310, "SL"],
      //   [59450, "SL"], [59620, "SL"], [59780, "SL"], [59910, "SL"], [60240, "SL"],
      //   [60380, "SL"], [60530, "SL"], [60640, "SL"], [61000, "SL"], [61120, "SL"],
      //   [61440, "SL"], [61740, "SL"], [62070, "SL"], [63470, "SL"], [63620, "SL"],
      //   [63750, "SL"], [64100, "SL"], [64430, "SL"], [64590, "SL"], [64750, "SL"],
      //   [64920, "SL"], [65040, "SL"], [65340, "SL"], [98110, "SL"], [98260, "SL"], [98600, "SL"], [98950, "SL"], [100490, "SL"],
      //   [100830, "SL"], [101020, "SL"], [101370, "SL"], [101680, "SL"], [102430, "SL"],
      //   [102630, "SL"], [104410, "SL"], [106010, "SL"], [106180, "SL"], [106400, "SL"],
      //   [106610, "SL"], [106860, "SL"], [107200, "SL"], [108740, "SL"], [109020, "SL"],
      //   [109200, "SL"], [110270, "SL"], [110400, "SL"], [112460, "SL"], [112620, "SL"],
      //   [114240, "SL"], [114520, "SL"], [114660, "SL"], [117800, "SL"], [118120, "SL"],
      //   [118510, "SL"], [118650, "SL"], [118960, "SL"], [119290, "SL"], [121260, "SL"],
      //   [121610, "SL"], [122010, "SL"], [122420, "SL"], [122590, "SL"], [122730, "SL"],
      //   [122890, "SL"], [124790, "SL"], [124970, "SL"], [125140, "SL"], [125310, "SL"],
      //   [125490, "SL"], [125630, "SL"], [125980, "SL"], [126330, "SL"], [126760, "SL"],
      //   [126910, "SL"], [127070, "SL"], [127230, "SL"], [127400, "SL"], [127560, "SL"],
      //   [127720, "SL"], [140430, "SL"], [141370, "SL"], [141650, "SL"], [149280, "SL"],
      //   [149430, "SL"], [149800, "SL"], [149930, "SL"], [150840, "SL"], [151170, "SL"],   [174540, "SL"], [175580, "SL"], [175740, "SL"], [175850, "SL"], [176640, "SL"],
      //   [176840, "SL"], [177030, "SL"], [181680, "SL"], [182000, "SL"], [182140, "SL"],
      //   [183180, "SL"], [183870, "SL"], [184070, "SL"], [184190, "SL"], [185030, "SL"],
      //   [185800, "SL"], [185930, "SL"], [186660, "SL"], [187010, "SL"], [187540, "SL"],
      //   [187900, "SL"], [188800, "SL"], [189610, "SL"], [189760, "SL"], [190200, "SL"],
      //   [190810, "SL"], [192140, "SL"], [192450, "SL"], [192740, "SL"], [193080, "SL"],
      //   [194420, "SL"], [196330, "SL"], [196580, "SL"], [212070, "SL"], [212400, "SL"],
      //   [213720, "SL"], [213900, "SL"], [214020, "SL"], [215100, "SL"], [215370, "SL"],
      //   [216550, "SL"], [217540, "SL"], [217850, "SL"], [217990, "SL"], [223010, "SL"],
      //   [223130, "SL"], [223410, "SL"], [223520, "SL"], [223830, "SL"], [223960, "SL"],
      //   [225190, "SL"], [225300, "SL"], [225480, "SL"], [226130, "SL"], [238520, "SL"],
      //   [238660, "SL"], [238940, "SL"], [239240, "SL"], [239370, "SL"], [239590, "SL"],
      //   [239730, "SL"], [239870, "SL"], [241490, "SL"], [241860, "SL"], [243560, "SL"],
      //   [243700, "SL"], [243860, "SL"], [243990, "SL"], [244320, "SL"], [245320, "SL"],
      //   [245610, "SL"], [245940, "SL"], [246240, "SL"], [246380, "SL"], [246520, "SL"],
      //   [247680, "SL"], [247830, "SL"], [248000, "SL"], [253570, "SL"], [260290, "SL"], [261230, "SL"], [263220, "SL"], [265160, "SL"], [267060, "SL"],
      //   [268980, "SL"], [270210, "SL"], [271780, "SL"], [272330, "SL"], [275170, "SL"],
      //   [275340, "SL"], [275500, "SL"], [275780, "SL"], [276080, "SL"], [278310, "SL"],
      //   [278510, "SL"], [278740, "SL"], [279020, "SL"], [302760, "SL"], [305200, "SL"],
      //   [305610, "SL"], [305900, "SL"], [306240, "SL"], [306620, "SL"], [306760, "SL"],
      //   [313470, "SL"], [313840, "SL"], [313960, "SL"], [317880, "SL"], [318140, "SL"],
      //   [318270, "SL"], [318680, "SL"], [319060, "SL"], [322050, "SL"], [322630, "SL"],
      //   [322990, "SL"], [323550, "SL"], [323850, "SL"], [324210, "SL"], [326740, "SL"],
      //   [327160, "SL"], [327490, "SL"], [329840, "SL"], [331000, "SL"],
      //   [344660, "SL"], [344930, "SL"], [345880, "SL"], [346180, "SL"], [347040, "SL"],
      //   [347310, "SL"], [348220, "SL"], [348500, "SL"], [349380, "SL"], [349670, "SL"],
      //   [350570, "SL"], [350860, "SL"], [351760, "SL"],





      //   [2740, "SR"], [2900, "SR"], [3060, "SR"], [3210, "SR"], [5460, "SR"],
      //   [5610, "SR"], [5760, "SR"], [19200, "SR"], [22600, "SR"], [24500, "SR"],
      //   [25680, "SR"], [27050, "SR"], [27380, "SR"], [31170, "SR"], [31510, "SR"],
      //   [32180, "SR"], [32480, "SR"], [32790, "SR"], [33100, "SR"], [33410, "SR"],
      //   [33740, "SR"], [34030, "SR"], [34340, "SR"], [34670, "SR"], [34980, "SR"],
      //   [35260, "SR"], [41610, "SR"], [67460, "SR"], [67640, "SR"], [67770, "SR"],
      //   [67940, "SR"], [68260, "SR"], [68560, "SR"], [73710, "SR"], [74340, "SR"],
      //   [74960, "SR"], [75620, "SR"], [76260, "SR"], [77810, "SR"], [78060, "SR"],
      //   [78310, "SR"], [78470, "SR"], [78770, "SR"], [79380, "SR"], [82260, "SR"],
      //   [82880, "SR"], [83540, "SR"], [83850, "SR"], [84200, "SR"], [84840, "SR"],
      //   [85450, "SR"], [85770, "SR"], [86060, "SR"], [90340, "SR"], [90510, "SR"],  [96630, "SR"], [97290, "SR"], [97710, "SR"], [99380, "SR"], [99530, "SR"],
      //   [99830, "SR"], [100160, "SR"], [102070, "SR"], [102230, "SR"], [123560, "SR"],
      //   [123960, "SR"], [124110, "SR"], [124290, "SR"], [124440, "SR"], [124600, "SR"],
      //   [127890, "SR"], [128050, "SR"], [128220, "SR"], [128370, "SR"], [139210, "SR"],
      //   [139520, "SR"], [139820, "SR"], [140120, "SR"], [140750, "SR"], [141510, "SR"],
      //   [141840, "SR"], [149140, "SR"], [150220, "SR"], [150520, "SR"], [151470, "SR"],
      //   [152360, "SR"], [153360, "SR"], [153690, "SR"], [153850, "SR"], [154070, "SR"],   [174920, "SR"], [175250, "SR"], [176200, "SR"], [176350, "SR"], [176490, "SR"],
      //   [191460, "SR"], [191820, "SR"], [193370, "SR"], [193690, "SR"], [194010, "SR"],
      //   [195890, "SR"], [196720, "SR"], [196840, "SR"], [197110, "SR"], [197230, "SR"],
      //   [197420, "SR"], [199760, "SR"], [200890, "SR"], [201040, "SR"], [201230, "SR"],
      //   [201440, "SR"], [202680, "SR"], [202880, "SR"], [203640, "SR"], [204250, "SR"],
      //   [204370, "SR"], [205040, "SR"], [205980, "SR"], [206240, "SR"], [206500, "SR"],
      //   [207480, "SR"], [210580, "SR"], [210870, "SR"], [211290, "SR"], [211550, "SR"],
      //   [212520, "SR"], [212740, "SR"], [213060, "SR"], [215490, "SR"], [215760, "SR"],
      //   [215880, "SR"], [216190, "SR"], [216300, "SR"], [222280, "SR"], [224230, "SR"],
      //   [224490, "SR"], [226600, "SR"], [226890, "SR"], [227000, "SR"], [227260, "SR"],
      //   [227360, "SR"], [227690, "SR"], [246820, "SR"], [246970, "SR"], [247230, "SR"],
      //   [247380, "SR"], [247540, "SR"], [248220, "SR"], [248360, "SR"], [248640, "SR"],
      //   [248910, "SR"], [249150, "SR"], [253910, "SR"], [254160, "SR"], [254370, "SR"],
      //   [254640, "SR"], [254890, "SR"], [255040, "SR"], [262740, "SR"], [264680, "SR"], [266570, "SR"], [268500, "SR"], [269770, "SR"],
      //   [273320, "SR"], [277030, "SR"], [277290, "SR"], [277420, "SR"], [277680, "SR"],
      //   [277990, "SR"], [279920, "SR"], [280270, "SR"], [280800, "SR"], [281360, "SR"],
      //   [284710, "SR"], [285020, "SR"], [285560, "SR"], [287960, "SR"], [288810, "SR"],
      //   [290080, "SR"], [301080, "SR"], [301410, "SR"], [301550, "SR"], [301970, "SR"],
      //   [303440, "SR"], [303870, "SR"], [304260, "SR"], [304380, "SR"], [304730, "SR"],
      //   [309860, "SR"], [310060, "SR"], [310360, "SR"], [310670, "SR"], [310950, "SR"],
      //   [311080, "SR"], [311490, "SR"], [311880, "SR"], [312340, "SR"], [313010, "SR"],
      //   [319360, "SR"], [319650, "SR"], [320440, "SR"], [320660, "SR"], [321110, "SR"],
      //   [321460, "SR"], [321790, "SR"], [324480, "SR"], [325080, "SR"], [326230, "SR"],
      //   [331810, "SR"], [332210, "SR"], [332830, "SR"], [333390, "SR"], [333990, "SR"],   [355820, "SR"], [356100, "SR"], [356990, "SR"], [357280, "SR"], [358170, "SR"],
      //   [358440, "SR"], [359340, "SR"], [359660, "SR"], [360550, "SR"], [360850, "SR"],
      //   [361720, "SR"], [362010, "SR"], [362880, "SR"],



      //   [5310, "FT"], [11640, "FT"], [31850, "FT"], [40960, "FT"], [41910, "FT"],
      //   [46510, "FT"], [54370, "FT"], [67300, "FT"], [96790, "FT"], [111140, "FT"], [115780, "FT"], [123390, "FT"], [128740, "FT"],
      //   [138900, "FT"], [142600, "FT"], [152730, "FT"], [156440, "FT"], [174230, "FT"], [180770, "FT"], [190480, "FT"], [196180, "FT"], [207720, "FT"], [211940, "FT"],
      //   [222760, "FT"], [237090, "FT"], [241000, "FT"], [244990, "FT"], [253370, "FT"],   [302300, "FT"], [309500, "FT"], [314300, "FT"], [320200, "FT"], [323370, "FT"], [331420, "FT"], [334580, "FT"],


      //   [4040, "ST"], [8750, "ST"], [21940, "ST"], [30200, "ST"], [41260, "ST"], [54940, "ST"], [63150, "ST"], [91230, "ST"], [96230, "ST"], [104060, "ST"], [129080, "ST"], [130270, "ST"], [132570, "ST"], 
      //   [137300, "ST"], [145150, "ST"], [155080, "ST"], [162840, "ST"], [171430, "ST"],  [171790, "ST"], [178990, "ST"], [184540, "ST"], [198360, "ST"], [201950, "ST"], 
      //   [219600, "ST"], [228230, "ST"], [232830, "ST"], [249610, "ST"], [252950, "ST"],   [286650, "ST"], [292700, "ST"], [300310, "ST"], [315880, "ST"], [335490, "ST"], [343840, "ST"]
      // ]

      const res = (gMap.sort((firstItem: [number,string], secondItem: [number,string]) => firstItem[0] - secondItem[0]))

      const lTiming: [number,string][] = [];
      const rTiming: [number,string][] = [];
      const tTiming: [number,string][] = [];

      const lNotes: [number,string][] = [];
      const rNotes: [number,string][] = [];
      const tNotes: [number,string][] = [];

      for (let i = 0; i < res.length; i++) {
        if (res[i][1] === "FL" || res[i][1] === "SL") {
          lTiming.push([res[i][0] + scrollSpeed, res[i][1]])
          lNotes.push([res[i][0], res[i][1]])
        }
        else if (res[i][1] === "FR" || res[i][1] === "SR") {
          rTiming.push([res[i][0] + scrollSpeed, res[i][1]])
          rNotes.push([res[i][0], res[i][1]])
        }
        else if (res[i][1] === "FT" || res[i][1] === "ST") {
          tTiming.push([res[i][0] + scrollSpeed, res[i][1]])
          tNotes.push([res[i][0], res[i][1]])
        }
      }

      setLeftTiming(lTiming);
      setRightTiming(rTiming);
      setTurnTiming(tTiming);

      setLeftNotes(lNotes)
      setRightNotes(rNotes)
      setTurnNotes(tNotes)
      
      setTimeout(() => {
        setStopwatchActive(true);
        setStPaused(false);
      }, scrollSpeed)

      setTimeout(() => {
        if (audioRefListening.current) {
          audioRefListening.current.play();
        }  
      }, scrollSpeed * 2)
      
      document.querySelectorAll(".curve").forEach(e => e.remove());
    }

    const editorMap = () => {
      console.log("temp");
      // const mapString = localStorage.getItem('customMap')
      // let map; 
      // if (mapString) {
      //   map = JSON.parse(mapString);
      //   setEditorMapExists(true);
      //   setEMap(map);
      // }
      // else {
      //   alert("No Map Found.")
      // }
    }

    // Creating curves from new map format:
    // Left Notes
    useEffect(() => {
      if (leftNotes[0] && time === leftNotes[0][0]) {
        if (leftNotes[0][1] === "FL") {
          createCurve("curveOne", firstSection, "blueCurveAnime")
          setLeftNotes(list => list.slice(1));
        }
        if (leftNotes[0][1] === "SL") {
          createCurve("curveThree", secondSection, "blueCurveAnime")
          setLeftNotes(list => list.slice(1));
        }
      }   
    }, [time, leftNotes])

      // Right Notes
    useEffect(() => {
      if (rightNotes[0] && time === rightNotes[0][0]) {
        if (rightNotes[0][1] === "FR") {
          createCurve("curveTwo", firstSection, "redCurveAnime")
          setRightNotes(list => list.slice(1));
        }
        if (rightNotes[0][1] === "SR") {
          createCurve("curveFour", secondSection, "redCurveAnime")
          setRightNotes(list => list.slice(1));
        }
      }   
    }, [time, rightNotes])

    // Left Notes
    useEffect(() => {
      if (turnNotes[0] && time === turnNotes[0][0]) {
        if (turnNotes[0][1] === "FT") {
          createCurve("leftSpinCurve", firstSection, "spinCurveAnime")
          setTurnNotes(list => list.slice(1));
        }
        if (turnNotes[0][1] === "ST") {
          createCurve("rightSpinCurve", secondSection, "spinCurveAnime")
          setTurnNotes(list => list.slice(1));
        }
      }   
    }, [time, turnNotes])


    const createCurve = (curveClass : string, section: RefObject<HTMLDivElement>, curveAnime: string) => {
      setNoteCount(count => count + 1);
      const newEle = document.createElement('p');
      newEle.classList.add(curveClass)
      newEle.classList.add("curve")
      newEle.textContent= ""
      section.current?.appendChild(newEle);
      newEle.style.animation = `${curveAnime} ${scrollSpeed/1000}s linear`
      newEle.addEventListener("animationend", () => {
        section.current?.removeChild(newEle);
      })
    }

    useEffect(() => {
      if (leftTiming.length > 0 && leftTiming[0][0] < time - 150) {
        handleMiss(leftTiming, setLeftTiming);
      }
      if (rightTiming.length > 0 && rightTiming[0][0] < time - 150) {
        handleMiss(rightTiming, setRightTiming);
      }
      if (turnTiming.length > 0 && turnTiming[0][0] < time - 150) {
        handleMiss(turnTiming, setTurnTiming);
      }
    }, [time, leftTiming, rightTiming, turnTiming]);

    const handleMiss = (
      timingList: [number,string][], 
      setTimingList: React.Dispatch<React.SetStateAction<[number,string][]>>
    ) => {
      if (timingList.length > 0 && timingList[0][0] < time - 150) {
        if (score > 0) {
          setScore((score) => score - 1);
        }
        setMissCount((count) => count + 1);
        setTimingList((list) => list.slice(1)); // Functional update

        const message = document.createElement('p');
        message.classList.add("message");
        if (timingList[0][1] === "FL" || timingList[0][1] === "FR" || timingList[0][1] === "FT") {
          message.classList.add("leftMessage");
          message.classList.add("missedLeft");  
        }
        else  {
          message.classList.add("rightMessage");
          message.classList.add("missedRight");  
        }
        message.textContent= "missed";
        if (gameWrapper.current) gameWrapper.current.appendChild(message);
        setTimeout(() => {
          if (gameWrapper.current) gameWrapper.current.removeChild(message);  
        }, 500);
      }
    }

    const toggleOpacity = () => {
      if (opacityEnabled === "On") {
        setOpacity("Off")
      } 
      else {
        setOpacity("On")
      }
    }

    const homepageStyle = {
      opacity: settingsDiv? 0.25: 1
    }

    return (
        <>
          <div id='homepage'>
            <div style={homepageStyle}>
              <div style={{display: 'flex', flexDirection: 'column', gap: 15, paddingTop: 10, width: '50%', margin: '0 auto', alignItems: 'center'}}>
                <h1>Meyda Demo</h1>
                <p>Play a map from your own song, a custom made map, or your own map</p>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center'}}>
                  <button style={{padding: 2, width: "100%"}} onClick={customMap}>Play Custom Map</button>
                  <p>Dreams Don&apos;t Stop [Rhythm Doctor]</p>   
                </div>

                
                <div style={{display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center'}}>
                  <button id='editorBtn' onClick={editorMap} style={{padding: 2, width: "100%"}}>Play Your Editor Map</button>
                  {true &&
                  <>
                    <input type="file" accept='audio/*' onChange={editorChange}/>
                    <audio src={editorURL ?? ""} controls={false} ref={editorAudioRef} loop={false} />
                  </>
                  }
                  {editorBtn && 
                  <button style={{padding: 2, width: "100%"}} onClick={playEditor}>Play Custom Map</button>
                  }
                </div>
              </div>


              <div>
              <div id='gameWrapper'>
                <br/>
                <div style={currentArea}> {direction} </div>
                <div >
                  <div ref={gameWrapper}  style={{display: 'flex', gap: 20, alignItems: 'flex-end', flexDirection: 'row', position: 'relative'}}>
                    <div id='gamecontainer-circle' ref={gameContainer}>
                      <div className='click-Area caOne' ref={circleOne}></div>
                      <div className='click-Area caTwo' ref={circleTwo}></div>
                      <div className='click-Area caThree' ref={circleThree}></div>
                      <div className='click-Area caFour' ref={circleFour}></div>

                      <div className='curve-section' style={firstSectionStyle} ref={firstSection}></div>
                      <div className='curve-section' style={secondSectionStyle} ref={secondSection}></div>
                    </div>
                    <div id='scoreline' ref={scoreline}></div>
                  </div>
                  <div className='button-container'>
                    <div style={leftBtnStyle}>A</div>
                    <div style={rightBtnStyle}>D</div>
                  </div>
                  <div className='button-container'> 
                    <div style={leftActionBtnStyle}>J</div>
                    <div style={rightActionBtnStyle}>L</div>
                  </div>
                </div>
              </div>

            </div>

            <audio src={audioURL ?? ""} controls={false} ref={audioRefListening} loop={false} />
            <audio src={audioURL ?? ""} controls={false} ref={audioRefSetting} loop={false} />
            <audio src={audioURL ?? ""} controls={false} loop={false} />

          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: 5, textAlign: 'center', paddingTop: 10}}>
            <p>High Score: {highScore}</p>
            <p>Score: {score}</p>
            <p>Hit Count: {hitCount}</p>
            <p>Miss Count: {missCount}</p>
            <p>Note Count: {noteCount}</p>
          </div>

          <div id='titleDiv'>
            <div>
              <button onClick={() => {setSettingsDiv(!settingsDiv)}} id='settingsBtn'>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#eaeaea" className="bi bi-gear-fill" viewBox="0 0 16 16">
                  <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
                </svg>
              </button>
            </div>
            
          </div>

          {settingsDiv && 
            <div id='settingsDiv'>
              <div>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, paddingTop: 30, width: '80%', margin: '0 auto'}}>
                  <p>Press &quot;A&quot; to set the &quot;Active Area&quot; to Left. Rotating will hit a Purple Note</p>
                  <br/>
                  <p>Press &quot;D&quot; to set the &quot;Active Area&quot; to Right. Rotating will hit a Purple Note</p>
                  <br/>
                  <p>Press &quot;J&quot; to hit a Blue note reaching the edge of the current &quot;Active Area&quot;</p>
                  <br/>
                  <p>Press &quot;L&quot; to hit a Red note reaching the edge of the current &quot;Active Area&quot;</p>
                  <br/>
                  <p>Press &quot;Q&quot; to Play/Pause</p>
                  <br/>
                  <p>Press &quot;P&quot; to reset the track. Press after applying a new Scroll Speed</p>
                </div>
                <br/>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', gap: 10}}>
                    <button onClick={() => {setScrollSpeed(500)}}>500ms</button>
                    <button onClick={() => {setScrollSpeed(1000)}}>1000ms</button>
                    <button onClick={() => {setScrollSpeed(1500)}}>1500ms</button>
                    <button onClick={() => {setScrollSpeed(2000)}}>2000ms</button>
                  </div>
                    <p>Current Scroll Speed: {scrollSpeed / 1000}s</p>
                </div>
                <br/>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5}}>
                  <button style={{padding: 2}} onClick={toggleOpacity}>Opacity Change Set to {opacityEnabled}</button>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, paddingTop: 30, width: '80%', margin: '0 auto'}}>
                  <p>This project is a demo and a vertical slice of a project I am now working on now.</p>
                  <p>I will link the final project once completed. For now, please enjoy the demo!</p>
                </div>
              </div>
            </div>
            }

            <div style={{display: 'flex', justifyContent: 'center', paddingTop: 20, paddingBottom: 20}}>
              <a href='/testing_meyda/editor' style={{backgroundColor: 'rgb(250, 238, 223)', color: 'black', padding: 5}}>Visit Editor</a>  
            </div>
        </div>
    </>
    )
}