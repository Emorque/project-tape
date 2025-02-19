"use client";

// import Meyda, { MeydaFeaturesObject } from 'meyda';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import "./game.css";
import gsap from 'gsap';

interface gameInterface {
  gMap: [number,string][]
}

export const Game = ({gMap} : gameInterface) => {   
  // console.log("GAME LOADED", gMap)

  // Audio Sources
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null);

  // Game Visuals
  const gameWrapper = useRef<HTMLDivElement>(null);
  const firstSection = useRef<HTMLDivElement>(null);
  const secondSection = useRef<HTMLDivElement>(null);

  // Game controls
  const [scrollSpeed, setScrollSpeed] = useState<number>(1000);
  const [direction, setDirection] = useState<string>("Right");

  const [opacityEnabled, setOpacity] = useState<string>("On");

  // Stopwatch
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [stopwatchActive, setStopwatchActive] = useState<boolean>(false);
  const [stPaused, setStPaused] = useState<boolean>(true);
  const [time, setTime] = useState<number>(0);

  // Stats
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

      const handleEarlyInput = (
        direction: string
      ) => {
        const message = document.createElement('p');
        message.classList.add("message");
        if (direction === "right") {
          message.classList.add("rightMessage")
          message.classList.add("earlyRight");
        }
        else {
          message.classList.add("leftMessage")
          message.classList.add("earlyLeft");
        }
        message.textContent= "Early";
        if (gameWrapper.current) gameWrapper.current.appendChild(message);
        setTimeout(() => {
          if (gameWrapper.current) gameWrapper.current.removeChild(message);  
        }, 500);
      }

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
        message.style.backgroundColor = "green";
        // Check for "Perfect" hit
        if (timingList[0][0] + 75 >= time && time > timingList[0][0] - 75 && timingList[0][1] === note) {
          hitsoundsRef.current[hitsoundIndex].play();
          setHitsoundIndex((index) => (index + 1) % 3); 
          setScore((score) => score + 5); 
          setHitCount((count) => count + 1); 
          setTimingList((list) => list.slice(1)); 
      
          message.textContent = "Perfect";
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
          if (turnTiming.length > 0 && turnTiming[0][0] <= time + 150) {
            handleInput(turnTiming, setTurnTiming, firstHitsound, setFirstHitsound, "leftMessage", "FT")
          }
        }


        if (event.key === 'd' || event.key === 'D') {
          setRightBtnActive(true);
          if (rightBtnHold) return;
          setRightBtnHold(true);
          if (direction === "Right") return
          moveRight();
          if (turnTiming.length > 0 && turnTiming[0][0] <= time + 150) {
            handleInput(turnTiming, setTurnTiming, thirdHitsound, setThirdHitsound, "rightMessage", "ST")
          }
        }

        if (event.key === 'j' || event.key === 'J') {
          setLeftActionBtn(true);
          if (leftActionBtnHold) return;
          setLeftActionBtnHold(true);

          if (direction === 'Left') {
            if (leftTiming.length > 0) {
              if (leftTiming[0][0] <= time + 150) {
                handleInput(leftTiming, setLeftTiming, firstHitsound, setFirstHitsound, "leftMessage", "FL")
              }
              else if (leftTiming[0][0] <= time + 250){
                handleEarlyInput("left")
              }
            }
          }

          else {
            if (leftTiming.length > 0) {
              if (leftTiming[0][0] <= time + 150) {
                handleInput(leftTiming, setLeftTiming, thirdHitsound, setThirdHitsound, "rightMessage", "SL")
              }
              else if (leftTiming[0][0] <= time + 250) {
                handleEarlyInput("right")
              }
            }
          }
        }

        if (event.key === 'l' || event.key === 'L') {
          setRightActionBtn(true);
          if (rightActionBtnHold) return;
          setRightActionBtnHold(true);

          if (direction === 'Left') {
            if (rightTiming.length > 0) {
              if (rightTiming[0][0] <= time + 150) {
                handleInput(rightTiming, setRightTiming, secondHitsound, setSecondHitsound, "leftMessage", "FR")
              }
              else if (rightTiming[0][0] <= time + 250) {  
                handleEarlyInput("left")
              }
            }
          }

          else {
            if (rightTiming.length > 0) {
              if (rightTiming[0][0] <= time + 150){
                handleInput(rightTiming, setRightTiming, fourthHitsound, setFourthHitsound, "rightMessage", "SR")
              }
              else if (rightTiming[0][0] <= time + 250) {
                handleEarlyInput("right")
              }
            }
          }
        } 

        if (event.key === 'p' || event.key === "P") {
          if (resetBtnHold) return
          setResetBtnHold(true);
          customMap()
        }
        if (event.key === 'q' || event.key === "Q") {
          if (toggleBtnHold) return;
          setToggleBtnHold(true);
          toggleMap();
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

    const toggleMap = () => {
      const curves = document.querySelectorAll('.curve');
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play();
          setStopwatchActive(true);
          setStPaused(false);
          for (let i = 0; i < curves.length; i++) {
            (curves[i] as HTMLParagraphElement).style.animationPlayState = "running";
          }
        }
        else {
          audioRef.current.pause();
          setStopwatchActive(false);
          setStPaused(true);
          for (let i = 0; i < curves.length; i++) {
            (curves[i] as HTMLParagraphElement).style.animationPlayState = "paused";
          }
        }
      }
    }

    const customMap = () => {
      setAudioURL('https://9boushb4a7.ufs.sh/f/9Jv1QVILGRy4BnZDzY7GTJ0cX8hyuefiOLVSvntDKg5EZ1dl');

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      setTime(0);
      setStopwatchActive(false);
      setStPaused(true);
      setScore(0);
      setHitCount(0);
      setMissCount(0);
      setNoteCount(0);

      const tempHitsounds: { play: () => void; }[] = []
      for (let i = 0; i < 12; i++) {
        const hitsound  = new Audio('/hitsound.mp3'); // Needed for local 
        hitsound.volume = 1
        tempHitsounds.push(hitsound);
      } 
      hitsoundsRef.current = tempHitsounds;

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
        if (audioRef.current) {
          audioRef.current.play();
        }  
      }, scrollSpeed * 2)
      
      document.querySelectorAll(".curve").forEach(e => e.remove());
    }

    // Handle Curve Creation
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

    // Turn Notes
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

    // Handle Misses
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
        setTimingList((list) => list.slice(1));

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
              </div>


              <div>
              <div id='gameWrapper'>
                <br/>
                <div style={currentArea}> {direction} </div>
                <div >
                  <div ref={gameWrapper}  style={{display: 'flex', gap: 20, alignItems: 'flex-end', flexDirection: 'row', position: 'relative'}}>
                    <div id='gamecontainer-circle'>
                      <div className='click-Area caOne'></div>
                      <div className='click-Area caTwo'></div>
                      <div className='click-Area caThree'></div>
                      <div className='click-Area caFour'></div>

                      <div className='curve-section' style={firstSectionStyle} ref={firstSection}></div>
                      <div className='curve-section' style={secondSectionStyle} ref={secondSection}></div>
                    </div>
                    <div id='scoreline'></div>
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

            <audio src={audioURL ?? ""} controls={false} ref={audioRef} loop={false} />
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