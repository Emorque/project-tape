// 'use client' taken out because of the gameMapProp. use client is now implied i think b/c parent has use client

import React, { RefObject, useEffect, useRef, useState } from 'react';
import "./tape.css";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { settingsType } from '@/utils/helperTypes';

interface gameInterface {
  gMap: [number,string][];
  gameMapProp: (currentSong: string | null) => void;
  settings: settingsType;
  audioProp: React.RefObject<HTMLAudioElement>
}

const getKeyMapping = (key : string) => {
    const res = [(key === "Spacebar") ? " " : key.charAt(0).toUpperCase() + key.slice(1), (key === "Spacebar") ? " " : key.charAt(0).toLowerCase() + key.slice(1)]
    return res
}

export const Tape = ({gMap, gameMapProp, settings, audioProp} : gameInterface) => {   
    const [gameState, setGameState] = useState<string>("Waiting"); //False is for paused/complete, True is when the song is playing
    
    // Game Visuals
    const lane_one = useRef<HTMLDivElement>(null);
    const lane_two = useRef<HTMLDivElement>(null);
    const lane_three = useRef<HTMLDivElement>(null);
    const lane_four = useRef<HTMLDivElement>(null);

    const buttonMappings = {
        leftLane : getKeyMapping(settings.lLane),
        rightLane : getKeyMapping(settings.rLane),
        leftTurn : getKeyMapping(settings.lTurn),
        rightTurn : getKeyMapping(settings.rTurn),
        pause: getKeyMapping(settings.pause),
        restart: getKeyMapping(settings.restart)
    }


    const combo_bar = useRef<HTMLDivElement>(null);
    // Game controls
    const scrollSpeed = settings.scrollSpd;
    const offset = settings.offset
    const [direction, setDirection] = useState<string>("Left");

    // Stopwatch
    const [stopwatchActive, setStopwatchActive] = useState<boolean>(false);
    const [stPaused, setStPaused] = useState<boolean>(true);
    const [time, setTime] = useState<number>(0);

    // End Screen
    const [endScreen, setEndScreen] = useState<boolean>(false);

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
    const leftNotes = useRef<[number,string][]>([])
    const rightNotes = useRef<[number,string][]>([])
    const turnNotes = useRef<[number,string][]>([])
    const [leftNoteIndex, setLeftNoteIndex] = useState<number>(0)
    const [rightNoteIndex, setRightNoteIndex] = useState<number>(0)
    const [turnNoteIndex, setTurnNoteIndex] = useState<number>(0)

    const leftTiming = useRef<[number,string][]>([])
    const rightTiming = useRef<[number,string][]>([])
    const turnTiming = useRef<[number,string][]>([])
    const [leftTimingIndex, setLeftTimingIndex] = useState<number>(0)
    const [rightTimingIndex, setRightTimingIndex] = useState<number>(0)
    const [turnTimingIndex, setTurnTimingIndex] = useState<number>(0)

    const [hitsoundIndex, setHitsoundIndex] = useState<number>(0);

    // Styling States
    const hitsoundsRef = useRef<{ play: () => void; }[]>([]);

    useEffect(() => {
        let animationFrameId: number;
        let lastTime: number | null = null;
    
        const updateTime = (currentTime: number) => {
            if (!lastTime) lastTime = currentTime; // Initialize lastTime on first frame
            const deltaTime = currentTime - lastTime; // Calculate time since last frame
            lastTime = currentTime;
    
            if (!stPaused) {
                setTime((prevTime) => prevTime + deltaTime); // Update elapsed time
            }
    
            animationFrameId = requestAnimationFrame(updateTime); // Call next frame
        };
    
        if (stopwatchActive) {
            animationFrameId = requestAnimationFrame(updateTime); // Start the timer
        }
    
        return () => cancelAnimationFrame(animationFrameId); // Clean up on unmount or pause
    }, [stopwatchActive, stPaused]);

    const { contextSafe } = useGSAP(); 

    const moveLeft = contextSafe(() => {
        gsap.to("#lane-selection", {left: "23%", duration: "0.2"});
        setDirection("Left");
    })

    const moveRight = contextSafe(() => {
        gsap.to("#lane-selection", {left: "73%", duration: "0.2"});
        setDirection("Right");
    })

    const exMode = contextSafe(() => {
        gsap.timeline()
        .to("#lane-selection", {transform: "scale(0.1)", duration: "0.15"})
        .to("#lane-selection", {transform: "scale(1)", duration: "0.15"})
        setMode("ex")
    })

    useEffect(() => {
        if (comboCount > maxCombo) {
            setMaxCombo(comboCount)
        }
    }, [comboCount])

    const handleInput = (
        timingList: [number, string][],
        setNoteIndex: React.Dispatch<React.SetStateAction<number>>,
        noteIndex: number,
        note: string
        ) => {
        // Check for "Perfect" hit
        if (timingList[noteIndex][0] + 75 >= time && time > timingList[noteIndex][0] - 75 && timingList[noteIndex][1] === note) {
            hitsoundsRef.current[hitsoundIndex].play();
            setHitsoundIndex((index) => (index + 1) % 12); 
            if (mode === "ex"){
                setScore((score) => score + 300);
            }
            else {
                setScore((score) => score + 150);
            }
            setPerfectCount((perfect) => perfect + 1);
            if (mode === "base" && comboCount === 19) exMode()
            setComboCount((combo) => combo + 1);
            if (combo_bar.current) combo_bar.current.style.transition = "width 1s ease";
            if (note === "FL") perfectAnimation("cOne")
            else if (note === "FR") perfectAnimation("cTwo")
            else if (note === "SL") perfectAnimation("cThree")
            else if (note === "SR") perfectAnimation("cFour")
            else if (note === "FT") {
                perfectAnimation("cOne")
                perfectAnimation("cTwo")
            }
            else if (note === "ST") {
                perfectAnimation("cThree")
                perfectAnimation("cFour")
            }
            setNoteIndex((index) => index + 1);
        }
        
        // Check for "Success" hit
        else if (timingList[noteIndex][0] + 150 >= time && time > timingList[noteIndex][0] - 150 && timingList[noteIndex][1] === note) {
            hitsoundsRef.current[hitsoundIndex].play();
            setHitsoundIndex((index) => (index + 1) % 12); 
            if (mode === "ex"){
                setScore((score) => score + 200);
            }
            else {
                setScore((score) => score + 100);
            }
            setOkayCount((okay) => okay + 1); 
            if (mode === "base" && comboCount === 19) exMode()
            setComboCount((combo) => combo + 1);
            if (combo_bar.current) combo_bar.current.style.transition = "width 0.5s ease";
            if (note === "FL") hitAnimation("cOne")
            else if (note === "FR") hitAnimation("cTwo")
            else if (note === "SL") hitAnimation("cThree")
            else if (note === "SR") hitAnimation("cFour")
            else if (note === "FT") {
                hitAnimation("cOne")
                hitAnimation("cTwo")
            }
            else if (note === "ST") {
                hitAnimation("cThree")
                hitAnimation("cFour")
            }
            setNoteIndex((index) => index + 1); 
        }
    };

    useEffect(() => {
        const handleKeyDown = (event: { key: string; repeat : boolean}) => {
            // console.log(buttonMappings)
            if (event.repeat) return;

            if (gameState === "End" || gameState === "Waiting") return;

            if (event.key === buttonMappings.pause[0]|| event.key === buttonMappings.pause[1]) {
                pauseMap();
            }
            if(gameState === "Paused") return; //If false, that means game is complete/paused

            if (event.key === buttonMappings.leftTurn[0] || event.key === buttonMappings.leftTurn[1]) {
                if (direction === "Left") return
                moveLeft();
                if (turnTimingIndex < turnTiming.current.length && turnTiming.current[turnTimingIndex][0] <= time + 150) {
                    handleInput(turnTiming.current, setTurnTimingIndex, turnTimingIndex, "FT")
                }
            }
    
            if (event.key === buttonMappings.rightTurn[0] || event.key === buttonMappings.rightTurn[1]) {
                if (direction === "Right") return
                moveRight();
                if (turnTimingIndex < turnTiming.current.length && turnTiming.current[turnTimingIndex][0] <= time + 150) {
                    handleInput(turnTiming.current, setTurnTimingIndex, turnTimingIndex, "ST")
                }
            }
    
            if (event.key === buttonMappings.leftLane[0] || event.key === buttonMappings.leftLane[1]) {
                if (direction === 'Left' && leftTimingIndex < leftTiming.current.length) {
                    if (leftTiming.current[leftTimingIndex][0] <= time + 150) {
                        handleInput(leftTiming.current, setLeftTimingIndex, leftTimingIndex, "FL")
                    }
                    else if (leftTiming.current[leftTimingIndex][0] <= time + 250){
                        setComboCount(0);
                        setMode("base");
                        earlyAnimation("cOne")
                    }
                }
                else if (direction === 'Right' && leftTimingIndex < leftTiming.current.length) {
                    if (leftTiming.current[leftTimingIndex][0] <= time + 150) {
                        handleInput(leftTiming.current, setLeftTimingIndex, leftTimingIndex, "SL")
                    }
                    else if (leftTiming.current[leftTimingIndex][0] <= time + 250) {
                        setComboCount(0);
                        setMode("base");
                        earlyAnimation("cThree")   
                    }
                }
            }
    
            if (event.key === buttonMappings.rightLane[0]|| event.key === buttonMappings.rightLane[1]) {
                if (direction === 'Left' && rightTimingIndex < rightTiming.current.length) {
                    if (rightTiming.current[rightTimingIndex][0] <= time + 150) {
                        handleInput(rightTiming.current, setRightTimingIndex, rightTimingIndex, "FR")
                    }
                    else if (rightTiming.current[rightTimingIndex][0] <= time + 250) {
                        setComboCount(0);
                        setMode("base");  
                        earlyAnimation("cTwo")
                    }
                }
        
                else if (direction === 'Right' && rightTimingIndex < rightTiming.current.length) {
                    if (rightTiming.current[rightTimingIndex][0] <= time + 150){
                        handleInput(rightTiming.current, setRightTimingIndex, rightTimingIndex, "SR")
                    }
                    else if (rightTiming.current[rightTimingIndex][0] <= time + 250) {
                        setComboCount(0);
                        setMode("base");
                        earlyAnimation("cFour")
                    }
                }
            } 
    
            if (event.key === buttonMappings.restart[0]|| event.key === buttonMappings.restart[1]) {
                restartMap()
            }
            if (event.key === 'f' || event.key === "F") { 
                if (audioProp.current) audioProp.current.currentTime = audioProp.current.currentTime + 30;
            }
        }
        document.addEventListener('keydown', handleKeyDown);
    
        // Cleanup the event listener on unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
        }, [time, direction, leftTimingIndex, rightTimingIndex, turnTimingIndex, hitsoundIndex, gameState]);
    
    const handleEnd = contextSafe(() => {
        gsap.to("#lane-container", {
            opacity: 0,
            duration: 1,
            onComplete: () => {
                setEndScreen(true)
                setGameState("End")
            }
        })
    })
    
    useEffect(() => {
        const audioReference = audioProp.current;
        audioReference?.addEventListener('ended', handleEnd);        
        return () => {
            audioReference?.removeEventListener('ended', handleEnd);
        }
    }, [])

    const resumeMap = () => {
        const curves = document.querySelectorAll('.bar');
        if (audioProp.current) {
            audioProp.current.play();
            setStopwatchActive(true);
            setStPaused(false);
            setGameState("Running");
            for (let i = 0; i < curves.length; i++) {
                (curves[i] as HTMLParagraphElement).style.animationPlayState = "running";
            }
        }
    }
    

    const pauseMap = () => {
        const curves = document.querySelectorAll('.bar');
        if (audioProp.current) {
            audioProp.current.pause();
            setStopwatchActive(false);
            setStPaused(true);
            setGameState("Paused"); //Pause game
            for (let i = 0; i < curves.length; i++) {
                (curves[i] as HTMLParagraphElement).style.animationPlayState = "paused";
            }
        }
    }

    // Start Map
    useEffect(() => {
        // console.log("Settings Loaded in Map", settings)
        
        const tempHitsounds: { play: () => void; }[] = []
        for (let i = 0; i < 12; i++) {
          const hitsound  = new Audio('/hitsound.mp3'); // Needed for local 
          hitsound.volume = settings.hsVolume
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
        leftTiming.current = lTiming;
        rightTiming.current = rTiming;
        turnTiming.current = tTiming;

        leftNotes.current = lNotes;
        rightNotes.current = rNotes;
        turnNotes.current = tNotes;

        setTimeout(() => {
            setStopwatchActive(true);
            setStPaused(false);
        }, scrollSpeed + offset + 3000)
    
        setTimeout(() => {
            if (audioProp.current) {
                audioProp.current.volume = settings.gpVolume
                audioProp.current.play();
                setGameState("Running")
            } 
        }, (scrollSpeed * 2) + offset + 3000)
    }, [])

    // Restart Map
    const restartMap = () => {
        if (audioProp.current) {
            audioProp.current.pause();
            audioProp.current.currentTime = 0;
        }
        setTime(0);
        setStopwatchActive(false);
        setStPaused(true);
        setScore(0);
        setMissCount(0);
        setPerfectCount(0);
        setOkayCount(0);
        setComboCount(0);
        setMaxCombo(0);
        setEndScreen(false);

        setLeftTimingIndex(0);
        setRightTimingIndex(0);
        setTurnTimingIndex(0);

        setLeftNoteIndex(0);
        setRightNoteIndex(0);
        setTurnNoteIndex(0);

        setGameState("Waiting")

        setTimeout(() => {
            setStopwatchActive(true);
            setStPaused(false);
          }, scrollSpeed + offset + 3000)
    
          setTimeout(() => {
            if (audioProp.current) {
                audioProp.current.play();
                setGameState("Running")
            } 
          }, (scrollSpeed * 2) + offset + 3000)

        gsap.to("#lane-container", {
            opacity: 1,
            duration: 1,
        }) //FIXXXXXX to a contextSafe. Have restart and first playing of a song be different functions. No need to reinitialize a lot of the stuff
        setMode("base");

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
        newBar.style.animation = `barAnime ${scrollSpeed}ms linear`
        const cleanup = () => {
            lane.current?.removeChild(newBar);
        }
        newBar.addEventListener("animationend", cleanup)
        return () => {
            newBar.removeEventListener("animationend", cleanup)
        }
    }

    // Handle Curve Creation
    // Left Notes
    useEffect(() => {
        if (leftNoteIndex < leftNotes.current.length && time >= leftNotes.current[leftNoteIndex][0]) {
            if (leftNotes.current[leftNoteIndex][1] === "FL") {
                createBar(lane_one, false)
                setLeftNoteIndex((index) => index + 1);
            }
            if (leftNotes.current[leftNoteIndex][1] === "SL") {
                createBar(lane_three, false)
                setLeftNoteIndex((index) => index + 1);
            }
        }   
    }, [time, leftNoteIndex])

    // Right Notes
    useEffect(() => {
        if (rightNoteIndex < rightNotes.current.length && time >= rightNotes.current[rightNoteIndex][0]) {
            if (rightNotes.current[rightNoteIndex][1] === "FR") {
                createBar(lane_two, false)
                setRightNoteIndex((index) => index + 1)
            }
            if (rightNotes.current[rightNoteIndex][1] === "SR") {
                createBar(lane_four, false);
                setRightNoteIndex((index) => index + 1);
            }
        }   
    }, [time, rightNoteIndex])

    // Turn Notes
    useEffect(() => {
        if (turnNoteIndex < turnNotes.current.length && time >= turnNotes.current[turnNoteIndex][0]) {
            if (turnNotes.current[turnNoteIndex][1] === "FT") {
                createBar(lane_one, true)
                setTurnNoteIndex((index) => index + 1)
            }
            if (turnNotes.current[turnNoteIndex][1] === "ST") {
                createBar(lane_three, true)
                setTurnNoteIndex((index) => index + 1)
            }
        }   
    }, [time, turnNoteIndex])

    // Handle Misses
    useEffect(() => {
        if (leftTimingIndex < leftTiming.current.length && leftTiming.current[leftTimingIndex][0] < time - 150) {
        handleMiss(leftTimingIndex, setLeftTimingIndex, leftTiming.current);
        }
        if (rightTimingIndex < rightTiming.current.length && rightTiming.current[rightTimingIndex][0] < time - 150) {
        handleMiss(rightTimingIndex, setRightTimingIndex, rightTiming.current);
        }
        if (turnTimingIndex < turnTiming.current.length && turnTiming.current[turnTimingIndex][0] < time - 150) {
        handleMiss(turnTimingIndex, setTurnTimingIndex, turnTiming.current);
        }
    }, [time, leftTimingIndex, rightTimingIndex, turnTimingIndex]);
    

    const handleMiss = (
        noteIndex: number, 
        setNoteIndex: React.Dispatch<React.SetStateAction<number>>,
        timingList: [number,string][]
    ) => {
        if (timingList[noteIndex][1] === "FL") missAnimation("cOne")
        else if (timingList[noteIndex][1] === "FR") missAnimation("cTwo")
        else if (timingList[noteIndex][1] === "SL") missAnimation("cThree")
        else if (timingList[noteIndex][1] === "SR") missAnimation("cFour")
        else if (timingList[noteIndex][1] === "FT") {
            missAnimation("cOne")
            missAnimation("cTwo")
        }
        else if (timingList[noteIndex][1] === "ST") {
            missAnimation("cThree")
            missAnimation("cFour")
        }
    
        setMissCount((count) => count + 1);
        setComboCount(0)
        if (combo_bar.current) combo_bar.current.style.transition = "none";
        setMode("base")
        setNoteIndex((index) => index + 1)
    }

    const player_style = {
        borderBottomColor: (mode === "ex")? "green" : "white"
    }

    const combo_style = {
        width: `${((Math.min(comboCount, 20))/20) * 100}%`
    }

    const missAnimation = contextSafe((circle : string) => {
        gsap.timeline()
        .to(`#${circle}`, {transform: "translateX(-10px)", duration: "0.1"})
        .to(`#${circle}`, {transform: "translateX(10px)", duration: "0.1"})
        .to(`#${circle}`, {transform: "translateX(0px)", duration: "0.1"})
    })

    const earlyAnimation = contextSafe((circle : string) => {
        if (circle === "cOne" || circle == "cThree") {
            gsap.timeline()
            .to(`#${circle}`, {transform: "rotate(-40deg) scale(0.8)", duration: "0.1"})
            .to(`#${circle}`, {transform: "rotate(0deg) scale(1)", duration: "0.1"})
        }
        else {
            gsap.timeline()
            .to(`#${circle}`, {transform: "rotate(40deg) scale(0.8)", duration: "0.1"})
            .to(`#${circle}`, {transform: "rotate(0deg) scale(1)", duration: "0.1"})
        }
    })

    const hitAnimation = contextSafe((circle : string) => {
        if (circle === "cOne" || circle == "cThree") {
            gsap.timeline()
            .to(`#${circle}`, {transform: "rotate(40deg) scale(1.2)", borderColor: "blue", duration: "0.1"})
            .to(`#${circle}`, {transform: "rotate(0deg) scale(1)", borderColor: "#eaeaea", duration: "0.1"})
        }
        else {
            gsap.timeline()
            .to(`#${circle}`, {transform: "rotate(-40deg) scale(1.2)", borderColor: "blue", duration: "0.1"})
            .to(`#${circle}`, {transform: "rotate(0deg) scale(1)", borderColor: "#eaeaea", duration: "0.1"})
        }
    })

    const perfectAnimation = contextSafe((circle : string) => {
        if (circle === "cOne" || circle == "cThree") {
            gsap.timeline()
            .to(`#${circle}`, {transform: "rotate(40deg) scale(1.2)", borderColor: "green", duration: "0.1"})
            .to(`#${circle}`, {transform: "rotate(0deg) scale(1)", borderColor: "#eaeaea", duration: "0.1"})
        }
        else {
            gsap.timeline()
            .to(`#${circle}`, {transform: "rotate(-40deg) scale(1.2)", borderColor: "green", duration: "0.1"})
            .to(`#${circle}`, {transform: "rotate(0deg) scale(1)", borderColor: "#eaeaea", duration: "0.1"})
        }
    })

    useGSAP(() => {
        if (endScreen) {
            gsap.to("#score_text", {
                innerText: score,
                duration: 2.5,
                snap: {
                    innerText: 1
                }
            })
            setTimeout(() => {
                const lilGuy = document.getElementById('lil_guy');
                if ((perfectCount + okayCount)/(perfectCount + okayCount + missCount) > 0.7){
                    lilGuy?.classList.add('happy');
                    gsap.to("#left_eye", {backgroundColor: "transparent", borderTopWidth: "2", duration: "0.3"});
                    gsap.to("#right_eye", {backgroundColor: "transparent", borderLeftWidth: "0", borderRightWidth: "0", borderBottomWidth: "0", duration: "0.3"});
                }
                else {
                    lilGuy?.classList.add('sad')
                    gsap.to("#left_eye", {backgroundColor: "transparent", borderBottomWidth: "2", duration: "0.3"});
                    gsap.to("#right_eye", {backgroundColor: "transparent", borderLeftWidth: "0", borderRightWidth: "0", borderTopWidth: "0", duration: "0.3"}); 
                }
            }, 3000)
        }
    }, [endScreen])

    return (
    <div>
        <div id='game-container'>
            <div id='lane-container'>
                <div ref={lane_one} className='lane lane-one'> <div id='cOne' className='circle'></div> </div>
                <div ref={lane_two} className='lane lane-two'> <div id='cTwo' className='circle'></div> </div>
                <div ref={lane_three} className='lane lane-three'> <div id='cThree' className='circle'></div> </div>
                <div ref={lane_four} className='lane lane-four'> <div id='cFour' className='circle'></div> </div>
                <div style={player_style} id='lane-selection'>
                    <div id='lane-selection-inner'></div>
                    {(mode === "ex") && 
                        <div id='ex-lane'></div>
                    }
                </div>
                <div id='combo-bar'>
                    <div style={combo_style} ref={combo_bar} id='combo-bar-fill'></div>
                </div>
            </div> 

            <div id='pause_wrapper' className={(gameState === "Paused")? "pause_active" : 'pause_unactive'}>
                <div id="pause_screen">
                    <button onClick={() => resumeMap()}>Resume</button>
                    <button onClick={() => restartMap()}>Retry</button>
                    <button onClick={() => {gameMapProp(null)}}>Main Menu</button>
                </div>
            </div>

            {gameState === "Waiting"? 
            <div id='waiting_wrapper'>
                <div id='countdown'>
                    <span>3</span>
                    <span>2</span>
                    <span>1</span>
                    <span>0</span>
                </div>
            </div>
            :
            <>
            </>
            }

            {endScreen && 
                <div id='end_screen_wrapper'>
                    <div>
                        <h1 id='score_text'>0</h1>
                    </div>
                    <div id='cassette-tape'>
                        <div id='lil_guy_container'>
                            <div id='lil_guy'>
                                <div className='eyes' id='left_eye'></div>
                                <div className='eyes' id='right_eye'></div>
                            </div>
                        </div>
                        <div id='inner-cassette'></div>
                    </div>
                    <div id='score_div'>
                        <div id='hit_stats'>
                            <div>
                                <h2>{perfectCount}</h2>
                                <h2>Perfect</h2>    
                            </div>
                            <div>
                                <h2>{okayCount}</h2>
                                <h2>Okay</h2>    
                            </div>
                            <div>
                                <h2>{missCount}</h2>
                                <h2>Miss</h2>    
                            </div>
                        </div>
                        <div>
                            <h2>{maxCombo}</h2>
                            <h2>Max Combo</h2>    
                        </div>
                    </div>
                    <div id='menu_div'>
                        <button onClick={restartMap} className='gameBtns'>Retry</button>
                        <button onClick={() => {gameMapProp(null)}} className='gameBtns'>Main Menu</button>
                    </div>
                </div>
            }
        </div>
    </div>
  )
}