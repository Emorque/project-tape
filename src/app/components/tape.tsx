"use client";

import React, { RefObject, useEffect, useRef, useState } from 'react';
import "./tape.css";
import gsap from 'gsap';

interface gameInterface {
  gMap: [number,string][]
}

export const Tape = ({gMap} : gameInterface) => {   

    const [audioURL, setAudioURL] = useState<string | null>(null)
    const audioRef = useRef<HTMLAudioElement>(null);
    // const videoRef = useRef<HTMLIFrameElement>(null);

    // Game Visuals
    const lane_one = useRef<HTMLDivElement>(null);
    const lane_two = useRef<HTMLDivElement>(null);
    const lane_three = useRef<HTMLDivElement>(null);
    const lane_four = useRef<HTMLDivElement>(null);
    const combo_bar = useRef<HTMLDivElement>(null);
    const scoreRef = useRef<HTMLParagraphElement>(null);
    // Game controls
    const [scrollSpeed, setScrollSpeed] = useState<number>(1500); //Make this adjustable in some settings page and get the speed here (Zustand)?
    const [direction, setDirection] = useState<string>("Left");

    // Stopwatch
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [stopwatchActive, setStopwatchActive] = useState<boolean>(false);
    const [stPaused, setStPaused] = useState<boolean>(true);
    const [time, setTime] = useState<number>(0);

    // End Screen
    const [endScreen, setEndScreen] = useState<boolean>(true);

    // Stats
    const [score, setScore] = useState<number>(0);
    const [perfectCount, setPerfectCount] = useState<number>(0);
    const [okayCount, setOkayCount] = useState<number>(0)
    const [missCount, setMissCount] = useState<number>(0);
    
    // Combo Stats
    const [comboCount, setComboCount] = useState<number>(0);
    const [maxCombo, setMaxCombo] = useState<number>(0);
    const [mode, setMode] = useState<string>("base")

    // Custom Map
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


    // Styling States
    const hitsoundsRef = useRef<{ play: () => void; }[]>([]);

    useEffect(() => {
        if (stopwatchActive && !stPaused) {
            intervalRef.current = setInterval(() => {
                setTime((time) => time + 10);
            }, 10)
        }
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

    const moveLeft = () => {
        gsap.to("#lane-selection", {left: "23%", duration: "0.2"})
        setDirection("Left")
    }
    
    const moveRight = () => {
        gsap.to("#lane-selection", {left: "73%", duration: "0.2"})
        setDirection("Right")
    }

    const handleEarlyInput = ( direction: string ) => {
        console.log(direction)
        // Animate the circles 
      }
    
    // useEffect(() => {
    //     if (score > highScore) {
    //         setHighScore(score);  
    //     }
    // }, [score, highScore]);

    const handleInput = (
        timingList: [number, string][],
        setTimingList: React.Dispatch<React.SetStateAction<[number, string][]>>,
        hitsoundIndex: number,
        setHitsoundIndex: React.Dispatch<React.SetStateAction<number>>,
        note: string
        ) => {
        // Check for "Perfect" hit
        if (timingList[0][0] + 75 >= time && time > timingList[0][0] - 75 && timingList[0][1] === note) {
            hitsoundsRef.current[hitsoundIndex].play();
            setHitsoundIndex((index) => (index + 1) % 3); 
            setScore((score) => score + 5); 
            setPerfectCount((perfect) => perfect + 1);
            if (mode === "base") {
                if (comboCount === 20 ) {
                    setMode("ex")
                }
                setComboCount((combo) => combo + 1);
                if (comboCount > maxCombo) setMaxCombo(comboCount);
            }
            if (combo_bar.current) combo_bar.current.style.transition = "width 1s ease";
            setTimingList((list) => list.slice(1));
        }
        
        // Check for "Success" hit
        else if (timingList[0][0] + 150 >= time && time > timingList[0][0] - 150 && timingList[0][1] === note) {
            hitsoundsRef.current[hitsoundIndex].play();
            setHitsoundIndex((index) => (index + 1) % 3); 
            setScore((score) => score + 3); 
            setOkayCount((okay) => okay + 1); 
            if (mode === "base") {
                if (comboCount > 19 ) { //Ex happens at 20
                    setMode("ex")
                }
                else {
                    setComboCount((combo) => combo + 1);
                }
            }
            if (combo_bar.current) combo_bar.current.style.transition = "width 0.5s ease";
            setTimingList((list) => list.slice(1)); 
        }
        };

    useEffect(() => {
        const handleKeyDown = (event: { key: string; repeat : boolean}) => {
            if (event.repeat) return;
            if (event.key === 'a' || event.key === 'A') {
                if (direction === "Left") return
                moveLeft();
                if (turnTiming.length > 0 && turnTiming[0][0] <= time + 150) {
                    handleInput(turnTiming, setTurnTiming, firstHitsound, setFirstHitsound, "FT")
                }
            }
    
    
            if (event.key === 'd' || event.key === 'D') {
                if (direction === "Right") return
                moveRight();
                if (turnTiming.length > 0 && turnTiming[0][0] <= time + 150) {
                    handleInput(turnTiming, setTurnTiming, thirdHitsound, setThirdHitsound, "ST")
                }
            }
    
            if (event.key === 'j' || event.key === 'J') {
                if (direction === 'Left') {
                    if (leftTiming.length > 0) {
                        if (leftTiming[0][0] <= time + 150) {
                            handleInput(leftTiming, setLeftTiming, firstHitsound, setFirstHitsound, "FL")
                        }
                        else if (leftTiming[0][0] <= time + 250){
                            handleEarlyInput("left")
                        }
                    }
                }
        
                else {
                    if (leftTiming.length > 0) {
                        if (leftTiming[0][0] <= time + 150) {
                            handleInput(leftTiming, setLeftTiming, thirdHitsound, setThirdHitsound, "SL")
                        }
                        else if (leftTiming[0][0] <= time + 250) {
                            handleEarlyInput("right")
                        }
                    }
                }
            }
    
            if (event.key === 'l' || event.key === 'L') {
                if (direction === 'Left') {
                    if (rightTiming.length > 0) {
                    if (rightTiming[0][0] <= time + 150) {
                        handleInput(rightTiming, setRightTiming, secondHitsound, setSecondHitsound, "FR")
                    }
                    else if (rightTiming[0][0] <= time + 250) {  
                        handleEarlyInput("left")
                    }
                    }
                }
        
                else {
                    if (rightTiming.length > 0) {
                        if (rightTiming[0][0] <= time + 150){
                            handleInput(rightTiming, setRightTiming, fourthHitsound, setFourthHitsound, "SR")
                        }
                        else if (rightTiming[0][0] <= time + 250) {
                            handleEarlyInput("right")
                        }
                    }
                }
            } 
    
            if (event.key === 'p' || event.key === "P") {
                customMap()
            }
            if (event.key === 'f' || event.key === "F") {
                if (audioRef.current) audioRef.current.currentTime = audioRef.current.currentTime + 10;
            }
            if (event.key === 'q' || event.key === "Q") {
                toggleMap();
            }
        }
        document.addEventListener('keydown', handleKeyDown);
    
        // Cleanup the event listener on unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
        // }, [time, direction, leftBtnHold, rightBtnHold, toggleBtnHold, resetBtnHold, leftTiming, rightTiming, turnTiming]);
        }, [time, direction, leftTiming, rightTiming, turnTiming]);
    
    useEffect(() => {
        const handleEnd = () => {
            setEndScreen(true)
        }

        audioRef.current?.addEventListener('ended', handleEnd);
        
        return () => {
            audioRef.current?.removeEventListener('ended', handleEnd);
        }

    }, [])
    

    const toggleMap = () => {
        const curves = document.querySelectorAll('.bar');
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
        setMissCount(0);
        setPerfectCount(0);
        setOkayCount(0);
        setComboCount(0);
        setMode("base");
  
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
        //   if (videoRef.current) {
        //     videoRef.current.play();
        //   }
        }, scrollSpeed * 2)
        
        document.querySelectorAll(".bar").forEach(e => e.remove());
    }

    const createBar = (lane: RefObject<HTMLDivElement>, turnNote : boolean) => {
        const newBar = document.createElement('div');
        newBar.classList.add("bar")
        if (turnNote) {
            if (lane === lane_one) newBar.classList.add("left");
            else newBar.classList.add("right")            
        }
        lane.current?.appendChild(newBar);
        newBar.style.animation = `barAnime ${scrollSpeed/1000}s linear`
        newBar.addEventListener("animationend", () => {
            lane.current?.removeChild(newBar);
        })
    }

    // Handle Curve Creation
    // Left Notes
    useEffect(() => {
        if (leftNotes[0] && time === leftNotes[0][0]) {
        if (leftNotes[0][1] === "FL") {
            createBar(lane_one, false)
            setLeftNotes(list => list.slice(1));
        }
        if (leftNotes[0][1] === "SL") {
            createBar(lane_three, false)
            setLeftNotes(list => list.slice(1));
        }
        }   
    }, [time, leftNotes])

    // Right Notes
    useEffect(() => {
        if (rightNotes[0] && time === rightNotes[0][0]) {
        if (rightNotes[0][1] === "FR") {
            createBar(lane_two, false)
            setRightNotes(list => list.slice(1));
        }
        if (rightNotes[0][1] === "SR") {
            createBar(lane_four, false)
            setRightNotes(list => list.slice(1));
        }
        }   
    }, [time, rightNotes])

    // Turn Notes
    useEffect(() => {
        if (turnNotes[0] && time === turnNotes[0][0]) {
        if (turnNotes[0][1] === "FT") {
            createBar(lane_one, true)
            setTurnNotes(list => list.slice(1));
        }
        if (turnNotes[0][1] === "ST") {
            createBar(lane_three, true)
            setTurnNotes(list => list.slice(1));
        }
        }   
    }, [time, turnNotes])

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
        console.log("Missed")
        if (timingList.length > 0 && timingList[0][0] < time - 150) {
            if (score > 0) {
                setScore((score) => score - 1);
            }
            if (combo_bar.current) combo_bar.current.style.transition = "none";
            setMissCount((count) => count + 1);
            setComboCount(0)
            setMode("base")
            setTimingList((list) => list.slice(1));
        }
    }

    const player_style = {
        borderBottomColor: (mode === "ex")? "blue" : "red"
    }

    const combo_style = {
        width: `${((Math.min(comboCount, 20))/20) * 100}%`
    }

    useEffect(() => {
        if (endScreen){
            gsap.to(".score_text", {
                content: 0,
                value: score,
                
            })

        }
    }, [endScreen])

    return (
    <div>
        <button onClick={customMap}>Play</button>
        <div style={{position: 'absolute'}}>
            <p>{comboCount}</p>
        </div>
        <div id='game-container'>
            
            <div id='lane-container'>
                <div ref={lane_one} className='lane lane-one'></div>
                <div ref={lane_two} className='lane lane-two'></div>
                <div ref={lane_three} className='lane lane-three'></div>
                <div ref={lane_four} className='lane lane-four'></div>
                <div style={player_style} id='lane-selection'></div>
                <div id='combo-bar'>
                    <div style={combo_style} ref={combo_bar} id='combo-bar-fill'></div>
                </div>
            </div>
        </div>
        
        <audio src={audioURL ?? ""} controls={false} ref={audioRef} loop={false} />
        {/* <iframe 
            ref={videoRef}
            id='yt_embed'
            width="560" 
            height="315" 
            src="https://www.youtube-nocookie.com/embed/N3kjewFAklE?si=P4TbPblnO3i04rSB&amp;controls=0" 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope;" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen>
        </iframe>         */}
            {endScreen &&             
            <div id='end_screen_wrapper'>
                <div>
                    <p id='score_text' ref={scoreRef}>0</p>
                </div>
                <div id='cassette-tape'>
                    <div id='inner-cassette'></div>
                </div>
                <div id='score_div'>
                    <div>
                        <p>{perfectCount}</p>
                        <p>Perfect</p>    
                    </div>
                    <div>
                        <p>{okayCount}</p>
                        <p>Okay</p>    
                    </div>
                    <div>
                        <p>{missCount}</p>
                        <p>Miss</p>    
                    </div>
                    <div>
                        <p>{maxCombo}</p>
                        <p>Max Combo</p>    
                    </div>
                </div>
            </div>
        }
    </div>
  )
}