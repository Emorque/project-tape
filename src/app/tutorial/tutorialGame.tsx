// 'use client' taken out because of the gameMapProp. use client is now implied i think b/c parent has use client
import React, { RefObject, useEffect, useRef, useState } from 'react';
import '../components/game.css';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { settingsType } from '@/utils/helperTypes';
import Link from 'next/link';

interface gameInterface {
    gameMap: [number,string][];
    settings: settingsType;
    audioProp: React.RefObject<HTMLAudioElement>;
    gameLength: number;
}

const gameWhite = "#def0e5";
const missColor = "#db2e24";
const defaultColor = "#679798";
const hitColor = "#257eda";
const perfectColor = "#36c963"

const getKeyMapping = (key : string) => {
    const res = [(key === "Spacebar") ? " " : key.charAt(0).toUpperCase() + key.slice(1), (key === "Spacebar") ? " " : key.charAt(0).toLowerCase() + key.slice(1)]
    return res
}

const getComboMultiplier = (combo: number) => {
    if (combo < 10) {
        return 0
    }
    else if (combo >= 50) {
        return 0.5
    } 

    const tenthDigit = Math.floor(combo / 10) % 10
    return (Math.min(tenthDigit, 5))/10
}

export const TutorialGame = ({gameMap, settings, audioProp, gameLength } : gameInterface) => {   
    
    // console.log("Entered Tutorial")
    const { contextSafe } = useGSAP(); 

    const [gameState, setGameState] = useState<"Waiting" | "End" | "Running" | "Paused">("Waiting"); 
    const [songStarted, setSongStarted] = useState<boolean>(false)
    // Game Visuals
    const lane_one = useRef<HTMLDivElement>(null);
    const lane_two = useRef<HTMLDivElement>(null);
    const lane_three = useRef<HTMLDivElement>(null);
    const lane_four = useRef<HTMLDivElement>(null);

    // Settings
    const buttonMappings = {
        leftLane : getKeyMapping(settings.lLane),
        rightLane : getKeyMapping(settings.rLane),
        leftTurn : getKeyMapping(settings.lTurn),
        rightTurn : getKeyMapping(settings.rTurn),
        pause: getKeyMapping(settings.pause),
        restart: getKeyMapping(settings.restart)
    }
    const scrollSpeed = settings.scrollSpd;
    const offset = settings.offset

    const combo_bar = useRef<HTMLDivElement>(null);
    // Game States
    const [direction, setDirection] = useState<string>("Left");

    const [score, setScore] = useState<number>(0);
    const [perfectCount, setPerfectCount] = useState<number>(0);
    const [okayCount, setOkayCount] = useState<number>(0)
    const [missCount, setMissCount] = useState<number>(0);
    const [hp, setHP] = useState<number>(100);
    const [flow, setFlow] = useState<number>(0);

    const [flippedScreen, setFlippedScreen] = useState<boolean>(false)

    const [comboCount, setComboCount] = useState<number>(0);
    const [maxCombo, setMaxCombo] = useState<number>(0);
    const [flowState, setFlowState] = useState<boolean>(false)
    
    const flowStateAnimation = useRef(gsap.timeline({paused: true}))    
    const perfectTextTimeline = useRef(gsap.timeline({ paused: true }))
    const okayTextTimeline = useRef(gsap.timeline({ paused: true }))
    const missTextTimeline = useRef(gsap.timeline({ paused: true }))

    // const [songLength, setSongLength] = useState<number>(gameLength);

    useEffect(() => {        
        flowStateAnimation.current.to("#flow_bar_cover", {width: "15%", duration: 10, ease: "none", onComplete: () => {setFlowState(false)}})
        perfectTextTimeline.current
            .to(`#perfect_text`, { scale: "2", duration: "0.2" })
            .to(`#perfect_text`, { scale: "1.75", duration: "0.2" })
            .to(`#perfect_text`, { opacity: 0, duration: "0.2", delay: "3" });
        okayTextTimeline.current
            .to(`#okay_text`, {scale: "2", duration: "0.2"})
            .to(`#okay_text`, {scale: "1.75", duration: "0.2"})
            .to(`#okay_text`, {opacity: 0, duration: "0.2", delay: "3"})
        missTextTimeline.current
            .to(`#miss_text`, {scale: "2", duration: "0.2"})
            .to(`#miss_text`, {scale: "1.75", duration: "0.2"})
            .to(`#miss_text`, {opacity: 0, duration: "0.2", delay: "3"})
    }, [])

    const [hitsToRecover, setHitsToRecover] = useState<number>(0)

    useEffect(() => {
        if (comboCount > maxCombo) {
            setMaxCombo(comboCount)
        }
    }, [comboCount, maxCombo])

    // Screens
    const [endScreen, setEndScreen] = useState<boolean>(false);
    const [gameOverScreen, setGameOverScreen] = useState<boolean>(false);


    // Game Map
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

    // const [hitsoundIndex, setHitsoundIndex] = useState<number>(0);
    // const hitsoundsRef = useRef<{ play: () => void; }[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);

    // Score for Leaderboard    
    // States for YT Background(s) 
    const [backgroundDim, setBackgroundDim] = useState<number>(settings.backgroundDim || 0.5)
    // const [videoLoaded, setVideoLoaded] = useState<boolean>(false)
    // const [videoPlaying, setVideoPlaying] = useState<boolean>(true)
    // const reactPlayerRef = useRef<ReactPlayer | null>(null)

    // const [videoVisible, setVideoVisible] = useState<boolean>(false)
    // const handleProgress = (state: {playedSeconds : number}) => {
    //     if (songBackground && state.playedSeconds >= songBackground[0][2] - 1) {
    //         setVideoPlaying(false)
    //         setVideoVisible(false)
    //     }
    // }

    // States to check whether player has left the tab 
    const [tabActive, setTabActive] = useState<boolean>(true)

    useEffect(() => {
        const handleTabChange = () => {
            setTabActive(!document.hidden)
        }

        document.addEventListener('visibilitychange', handleTabChange)
        return () => {
            document.removeEventListener('visibilitychange', handleTabChange)
        }
    }, [])

    useEffect(() => {
        if (!tabActive && gameState !== "Paused" && gameState !== "End" && tutorialStep !== 10) {
            pauseMap()
        }
    }, [tabActive, gameState])

    // Stopwatch
    const [stopwatchActive, setStopwatchActive] = useState<boolean>(false);
    const [stPaused, setStPaused] = useState<boolean>(true);
    const [time, setTime] = useState<number>(0);
    
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

    // All animations
    const moveLeft = contextSafe(() => {
        const tl = gsap.timeline();
    
        tl.to("#lil_game_guy", {
            top: "25%",
            transform: "scaleY(0.8) translateY(-50%)",
            duration: 0.2,
            ease: "power1.out"
        })
        .to("#lil_game_guy", {
            transform: "scaleY(1) translateY(-50%)",
            duration: 0.2,
            ease: "power1.in"
        }, "<");
    
        tl.to("#game_left_eye", { top: "0%", duration: 0.2 }, 0)
          .to("#game_left_eye", { top: "30%", duration: 0.2 }, 0.2);
    
        tl.to("#game_right_eye", { top: "-5%", duration: 0.2 }, 0)
          .to("#game_right_eye", { top: "20%", duration: 0.2 }, 0.2);
    
        setDirection("Left");
    });
    

    const moveRight = contextSafe(() => {
        const tl = gsap.timeline();

        tl.to("#lil_game_guy", {
            top: "75%",
            transform: "scaleY(0.8) translateY(-50%)",
            duration: 0.2,
            ease: "power1.out"
        })
        .to("#lil_game_guy", {
            transform: "scaleY(1) translateY(-50%)",
            duration: 0.2,
            ease: "power1.in"
        }, "<");

        tl.to("#game_left_eye", { top: "60%", duration: 0.2 }, 0)
        .to("#game_left_eye", { top: "30%", duration: 0.2 }, 0.2);

        tl.to("#game_right_eye", { top: "45%", duration: 0.2 }, 0)
        .to("#game_right_eye", { top: "20%", duration: 0.2 }, 0.2);

        setDirection("Right");
    });

    const defaultAnimation = contextSafe((circle : string) => {
        gsap.timeline()
        .to(`#${circle}`, {borderColor: defaultColor, duration: "0.1"})
        .to(`#${circle}`, {borderColor: gameWhite, duration: "0.1"})
    })

    const missAnimation = contextSafe((circle : string) => {
        gsap.timeline()
        .to(`#${circle}`, {rotation: "-=90", borderColor: missColor, duration: "0.1"})
        .to(`#${circle}`, {borderColor: gameWhite, duration: "0.1"})
        
        gsap.timeline()
        .to("#bc_left", {transform: "scale(0.95)", duration: "0.1"})
        .to("#bc_left", {transform: "scale(1)", duration: "0.1"})

        gsap.set(`#miss_text`, {opacity: 1})
        gsap.set(`#okay_text`, {opacity: 0})
        gsap.set(`#perfect_text`, {opacity: 0})

        missTextTimeline.current.restart();
    })

    const hitAnimation = contextSafe((circle : string) => {
        gsap.timeline()
        .to(`#${circle}`, {rotation: "+=40", borderColor: hitColor, duration: "0.1"})
        .to(`#${circle}`, {borderColor: gameWhite, duration: "0.1"})

        gsap.set(`#miss_text`, {opacity: 0})
        gsap.set(`#okay_text`, {opacity: 1})
        gsap.set(`#perfect_text`, {opacity: 0})

        okayTextTimeline.current.restart(); 

        gsap.timeline()
        .to("#bc_right", {transform: "scale(1.05)", duration: "0.1"})
        .to("#bc_right", {transform: "scale(1)", duration: "0.1"})
    })


    const perfectAnimation = contextSafe((circle : string) => {
        gsap.timeline()
        .to(`#${circle}`, {rotation: "+=40", borderColor: perfectColor, duration: "0.1"})
        .to(`#${circle}`, {borderColor: gameWhite, duration: "0.1"})
        gsap.set(`#miss_text`, {opacity: 0})
        gsap.set(`#okay_text`, {opacity: 0})
        gsap.set(`#perfect_text`, {opacity: 1})

        perfectTextTimeline.current.restart();

        gsap.timeline()
        .to("#bc_right", {transform: "scale(1.05)", duration: "0.1"})
        .to("#bc_right", {transform: "scale(1)", duration: "0.1"})
    })

    const startingAnimation = contextSafe(() => {
        gsap.to("#lil_game_guy", {transform: "translateY(-50%) translateX(0%)", opacity: "1", duration: "2", delay: "1"})
        gsap.timeline()
        .to("#game_left_eye", {left: "15%", transform: "scaleY(0)", duration: "0.2", delay: "1"})
        .to("#game_left_eye", {transform: "scaleY(1)", duration: "0.2", delay:"1.5"})
        .to("#game_left_eye", {transform: "scaleY(0)", duration: "0.2"})
        .to("#game_left_eye", {transform: "scaleY(1)", duration: "0.2"})
        .to("#game_left_eye", {transform: "scaleY(0)", duration: "0.2"})
        .to("#game_left_eye", {transform: "scaleY(1)", duration: "0.2"})
        .to("#game_left_eye", {left: "25%", duration: "0.5"})

        gsap.timeline()
        .to("#game_right_eye", {right: "10%", transform: "scaleY(0)", duration: "0.2", delay: "1"})
        .to("#game_right_eye", {transform: "scaleY(1)", duration: "0.2", delay:"1.5"})
        .to("#game_right_eye", {transform: "scaleY(0)", duration: "0.2"})
        .to("#game_right_eye", {transform: "scaleY(1)", duration: "0.2"})
        .to("#game_right_eye", {transform: "scaleY(0)", duration: "0.2"})
        .to("#game_right_eye", {transform: "scaleY(1)", duration: "0.2"})
        .to("#game_right_eye", {right: "5%", duration: "0.5"})
    })

    const handleInput = (
        timingList: [number, string][],
        setNoteIndex: React.Dispatch<React.SetStateAction<number>>,
        noteIndex: number,
        note: string
        ) => {
        // Check for "Perfect" hit
        if (timingList[noteIndex][0] + 75 >= time && time > timingList[noteIndex][0] - 75 && timingList[noteIndex][1] === note) {
            const context = audioContextRef.current;
            const buffer = audioBufferRef.current;
            if (context && buffer) {
                const source = context.createBufferSource();
                source.buffer = buffer;
                const gainNode = context.createGain();
                gainNode.gain.value = settings.hsVolume;
                source.connect(gainNode)
                gainNode.connect(context.destination);
                source.start(0);
            }

            const baseScore = (note === "FT" || note === "ST")? 250 : 200
            // base score * (1 + combo multiplier) * (1 + bonues) //flowstate bonus is 0.5, timingBonus is 1 for perfect, and 0.5 for okay 
            if (flowState){
                setScore((score) => score + Math.floor(baseScore * (1 + getComboMultiplier(comboCount)) * (1 + 0.5)));
            }
            else {
                setScore((score) => score + Math.floor(baseScore * (1 + getComboMultiplier(comboCount)) * (1)));
            }
            setPerfectCount((perfect) => perfect + 1);
            setComboCount((combo) => combo + 1);
            // if (combo_bar.current) combo_bar.current.style.transition = "width 1s ease";
            if (note === "FL") perfectAnimation("lc_one")
            else if (note === "FR") perfectAnimation("lc_two")
            else if (note === "SL") perfectAnimation("lc_three")
            else if (note === "SR") perfectAnimation("lc_four")
            else if (note === "FT") {
                perfectAnimation("lc_one")
                perfectAnimation("lc_two")
            }
            else if (note === "ST") {
                perfectAnimation("lc_three")
                perfectAnimation("lc_four")
            }
            if (flow >= 98 && !flowState) {
                setFlowState(true)
                setFlow(0)
                flowStateAnimation.current.restart()
            } 
            else if (!flowState) {
                setFlow(prevFlow => Math.min(prevFlow + 1, 100))
            }

            if (hitsToRecover >= 4) {
                setHP(prevHP => Math.min(prevHP + 1, 100))
                setHitsToRecover(0)
            }
            else {
                setHitsToRecover(prevHit => prevHit + 1)
            }
            setNoteIndex((index) => index + 1);
        }
        
        // Check for "Success" hit
        else if (timingList[noteIndex][0] + 150 >= time && time > timingList[noteIndex][0] - 150 && timingList[noteIndex][1] === note) {
            const context = audioContextRef.current;
            const buffer = audioBufferRef.current;
            if (context && buffer) {
                const source = context.createBufferSource();
                source.buffer = buffer;
                const gainNode = context.createGain();
                gainNode.gain.value = settings.hsVolume;
                source.connect(gainNode)
                gainNode.connect(context.destination);
                source.start(0);
            }
            const baseScore = (note === "FT" || note === "ST")? 250 : 200
            // base score * (1 + combo multiplier) * (1 + bonues) //flowstate bonus is 0.5, timingBonus is 1 for perfect, and -0.5 for okay 
            if (flowState){
                setScore((score) => score + Math.floor(baseScore * (1 + getComboMultiplier(comboCount)) * (1 + 0.5 - 0.5)));
            }
            else {
                setScore((score) => score + Math.floor(baseScore * (1 + getComboMultiplier(comboCount)) * (1 - 0.5)));
            }
            setOkayCount((okay) => okay + 1); 
            setComboCount((combo) => combo + 1);
            if (combo_bar.current) combo_bar.current.style.transition = "width 0.5s ease";
            if (note === "FL") hitAnimation("lc_one")
            else if (note === "FR") hitAnimation("lc_two")
            else if (note === "SL") hitAnimation("lc_three")
            else if (note === "SR") hitAnimation("lc_four")
            else if (note === "FT") {
                hitAnimation("lc_one")
                hitAnimation("lc_two")
            }
            else if (note === "ST") {
                hitAnimation("lc_three")
                hitAnimation("lc_four")
            }
            if (flow >= 99 && !flowState) {
                setFlowState(true)
                setFlow(0)
                flowStateAnimation.current.restart()
            } 
            else if (!flowState) {
                setFlow(prevFlow => Math.min(prevFlow + 1, 100))
            }
            if (hitsToRecover >= 4) {
                setHP(prevHP => Math.min(prevHP + 1, 100))
                setHitsToRecover(0)
            }
            else {
                setHitsToRecover(prevHit => prevHit + 1)
            }
            setNoteIndex((index) => index + 1); 
        }
    };

    useEffect(() => {
        const handleKeyDown = (event: { key: string; repeat : boolean}) => {
            if (event.repeat) return;

            if (gameState === "End" || gameState === "Waiting") return;

            if ((event.key === buttonMappings.pause[0]|| event.key === buttonMappings.pause[1]) && songStarted) {
                if ((turnTiming.current.length > 0 && rightTiming.current.length > 0 && leftTiming.current.length > 0) && (time === turnTiming.current[turnTimingIndex][0] || time === rightTiming.current[rightTimingIndex][0] || leftTiming.current[leftTimingIndex][0])) {
                    setTimeout(()=> {
                        pauseMap()
                    }, 1) //Might help in preventing instances where player pauses on frame a bar is created (its animation won't be paused)
                }
                else {
                    pauseMap()
                }
            }
            if(gameState === "Paused") return; //If false, that means game is complete/paused

            if (event.key === buttonMappings.leftTurn[0] || event.key === buttonMappings.leftTurn[1]) {
                if (direction === "Left") return
                moveLeft();
                if (turnTimingIndex < turnTiming.current.length && turnTiming.current[turnTimingIndex][0] <= time + 150) {
                    handleInput(turnTiming.current, setTurnTimingIndex, turnTimingIndex, "FT")
                }
            }
    
            else if (event.key === buttonMappings.rightTurn[0] || event.key === buttonMappings.rightTurn[1]) {
                if (direction === "Right") return
                moveRight();
                if (turnTimingIndex < turnTiming.current.length && turnTiming.current[turnTimingIndex][0] <= time + 150) {
                    handleInput(turnTiming.current, setTurnTimingIndex, turnTimingIndex, "ST")
                }
            }
    
            else if (event.key === buttonMappings.leftLane[0] || event.key === buttonMappings.leftLane[1]) {
                if (direction === 'Left' && leftTimingIndex < leftTiming.current.length) {
                    checkFirstLane()
                }
                else if (direction === 'Right' && leftTimingIndex < leftTiming.current.length) {
                    checkThirdLane()
                }
                const context = audioContextRef.current;
                const buffer = audioBufferRef.current;
                if (context && buffer) {
                    const source = context.createBufferSource();
                    source.buffer = buffer;
                    const gainNode = context.createGain();
                    gainNode.gain.value = settings.hsVolume;
                    source.connect(gainNode)
                    gainNode.connect(context.destination);
                    source.start(0);
                }    
                return;
            }
    
            else if (event.key === buttonMappings.rightLane[0]|| event.key === buttonMappings.rightLane[1]) {
                if (direction === 'Left' && rightTimingIndex < rightTiming.current.length) {
                    checkSecondLane()                               
                }
        
                else if (direction === 'Right' && rightTimingIndex < rightTiming.current.length) {
                    checkFourthLane()    
                }
                const context = audioContextRef.current;
                const buffer = audioBufferRef.current;
                if (context && buffer) {
                    const source = context.createBufferSource();
                    source.buffer = buffer;
                    const gainNode = context.createGain();
                    gainNode.gain.value = settings.hsVolume;
                    source.connect(gainNode)
                    gainNode.connect(context.destination);
                    source.start(0);
                }
                return
            } 
    
            if (event.key === buttonMappings.restart[0]|| event.key === buttonMappings.restart[1]) {
                restartMap()
            }
        }
        document.addEventListener('keydown', handleKeyDown);
    
        // Cleanup the event listener on unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [time, direction, leftTimingIndex, rightTimingIndex, turnTimingIndex, gameState, songStarted]);
    
    const [tutorialStep, setTutorialStep] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>(0)

    useEffect(() => {
        if (time > (6000) && tutorialStep === 1) {
            setTutorialStep(2)
        }
        else if (time > 17000 && tutorialStep === 2){
            setTutorialStep(3)
        }
        else if (time > 27000 && tutorialStep === 3){
            setTutorialStep(4)
        }
        else if (time > 39000 && tutorialStep === 4){
            setTutorialStep(5)
        }
        else if (time > 46500 && tutorialStep === 5){
            setTutorialStep(6)
        }
        else if (time > 61500 && tutorialStep === 6){
            setTutorialStep(7)
        }
        else if (time > 66000 && tutorialStep === 7){
            setFlow(0)
            setFlowState(true)
            flowStateAnimation.current.restart()
            setTutorialStep(8)
        }
        else if (time > 67000 && tutorialStep === 8){
            setTutorialStep(9)
        }
    }, [time, tutorialStep])



    // TODO: Remove this handleEnd and replace this by adding 1 or 2 classes in css file and adjusting class list for lane-container based on states
    const handleEnd = () => {
        setTutorialStep(10)
        // setVideoVisible(false)
        // setVideoPlaying(false)
        setStopwatchActive(false)
    }

    // const gameOver = () => {
    //     gsap.to("#lane_container", {
    //         opacity: 0,
    //         duration: 1,
    //         onComplete: () => {
    //             setGameState("End")
    //             setGameOverScreen(true)
    //             setStopwatchActive(false)
    //             setVideoVisible(false)
    //             setVideoPlaying(false)
    //         }
    //     })
    // }

    // Ends the game once the audio file ends 
    // I don't think ytAudio check needed here
    useEffect(() => {
        const audioReference = audioProp.current;
        audioReference?.addEventListener('ended', handleEnd);        
        return () => {
            audioReference?.removeEventListener('ended', handleEnd);
        }
    }, [])

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
                gsap.set("#gear_container", {transform: "scale(0)"})
            }, 3000)
        }
    }, [endScreen])

    const resumeMap = () => {
        const curves = document.querySelectorAll('.bar');
        if (audioProp.current) {
            audioProp.current.play();
        }
        if (flowState) {
            flowStateAnimation.current.play()
        }
        // if (reactPlayerRef.current){
        //     setVideoPlaying(true)
        // }
        setStopwatchActive(true);
        setStPaused(false);
        setGameState("Running");
        for (let i = 0; i < curves.length; i++) {
            (curves[i] as HTMLParagraphElement).style.animationPlayState = "running";
        }
    }
    

    const pauseMap = () => {
        const curves = document.querySelectorAll('.bar');
        if (audioProp.current) {
            audioProp.current.pause();
        }
        if (flowState) {
            flowStateAnimation.current.pause()
        }
        // if (reactPlayerRef.current){
        //     setVideoPlaying(false)
        // }
        setStopwatchActive(false);
        setStPaused(true);
        setGameState("Paused"); //Pause game
        for (let i = 0; i < curves.length; i++) {
            (curves[i] as HTMLParagraphElement).style.animationPlayState = "paused";
        }
    }

    // Start Map
    useEffect(() => {
        const loadAudio = async () => {
            const context = new AudioContext();
            audioContextRef.current = context;
        
            const response = await fetch('/hitsound.mp3');
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await context.decodeAudioData(arrayBuffer);
        
            audioBufferRef.current = audioBuffer;
        };
      
        loadAudio();

        const res = (gameMap.sort((firstItem: [number,string], secondItem: [number,string]) => firstItem[0] - secondItem[0]))
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
        startingAnimation()
        
        if (offset >= 0) {
            setTimeout(() => {
                if (audioProp.current) {
                    audioProp.current.currentTime = 0;
                    audioProp.current.volume = settings.gpVolume
                    audioProp.current.play();
                }
                setSongStarted(true)
            }, ((scrollSpeed * 2) + 3000 + offset))
    
            setTimeout(() => {
                setStopwatchActive(true);
                setStPaused(false);
                setGameState("Running")
                setTutorialStep(1)
            }, scrollSpeed + 3000)
        }
        else {
            setTimeout(() => {
                if (audioProp.current) {
                    audioProp.current.currentTime = 0;
                    audioProp.current.volume = settings.gpVolume
                    audioProp.current.play();
                }
                setSongStarted(true)
            }, ((scrollSpeed * 2) + 3000))
    
            setTimeout(() => {
                setStopwatchActive(true);
                setStPaused(false);
            }, scrollSpeed + 3000 - offset)
            
            setTimeout(() => {
                setGameState("Running")
                setTutorialStep(1)
            }, scrollSpeed + 3000)
        }
    }, [])

    // Restart Map
    const restartMap = () => {
        if (audioProp.current) {
            audioProp.current.pause();
            audioProp.current.currentTime = 0;
            setSongStarted(false)
        }

        setStopwatchActive(false);
        setStPaused(true);
        setTime(0);
        setScore(0);
        setMissCount(0);
        setPerfectCount(0);
        setOkayCount(0);
        setComboCount(0);
        setMaxCombo(0);
        setEndScreen(false);
        setGameOverScreen(false)
        setTutorialStep(0)

        setHP(100)
        setFlow(0)

        setHitsToRecover(0)

        // setScoreUploading(true)

        setLeftTimingIndex(0);
        setRightTimingIndex(0);
        setTurnTimingIndex(0);

        setLeftNoteIndex(0);
        setRightNoteIndex(0);
        setTurnNoteIndex(0);

        setGameState("Waiting")

        if (offset >= 0) {
            setTimeout(() => {
                if (audioProp.current) {
                    audioProp.current.currentTime = 0;
                    audioProp.current.volume = settings.gpVolume
                    audioProp.current.play();
                    setSongStarted(true)
                }
                // if (reactPlayerRef.current && songBackground) {
                //     setVideoPlaying(true)
                //     setVideoVisible(true)
                // }
            }, ((scrollSpeed * 2) + 3000 + offset))
    
            setTimeout(() => {
                setStopwatchActive(true);
                setStPaused(false);
                setGameState("Running")
                setTutorialStep(1)
            }, scrollSpeed + 3000)
        }
        else {
            setTimeout(() => {
                if (audioProp.current) {
                    audioProp.current.currentTime = 0;
                    audioProp.current.volume = settings.gpVolume
                    audioProp.current.play();
                    setSongStarted(true)
                }
            }, ((scrollSpeed * 2) + 3000))
    
            setTimeout(() => {
                setStopwatchActive(true);
                setStPaused(false);
            }, scrollSpeed + 3000 - offset)
            
            setTimeout(() => {
                setGameState("Running")
                setTutorialStep(1)
            }, scrollSpeed + 3000)
        }

        // Same here, just tie the animation to a class for lane-container's classlist 
        gsap.set("#okay_text", {opacity: 0})
        gsap.set("#perfect_text", {opacity: 0})
        gsap.set("#miss_text", {opacity: 0})
        gsap.to("#lane_container", {
            opacity: 1,
            duration: 1,
        }) //FIXXXXXX to a contextSafe. Have restart and first playing of a song be different functions. No need to reinitialize a lot of the stuff
        if (flowState) {
            gsap.to("#flow_bar_cover", {width: "15%", duration: 1, onComplete: () => {setFlowState(false)}})
        }
        document.querySelectorAll(".bar").forEach(e => e.remove());

    }

    const createBar = (lane: RefObject<HTMLDivElement>, turnNote : boolean) => {
        const newBar = document.createElement('div');
        newBar.classList.add("bar")
        if (turnNote) {
            const laneClass = (lane === lane_one)? "left" : "right";
            newBar.classList.add(laneClass);
            newBar.style.animation = `barAnime ${scrollSpeed}ms linear 1, ${laneClass}Animation ${scrollSpeed}ms linear 1`
        }
        else {
            newBar.style.animation = `barAnime ${scrollSpeed}ms linear 1`
        }
        if (lane.current) {
            lane.current.appendChild(newBar);
        }
        const cleanup = () => {
            if (lane.current && lane.current.contains(newBar)) {
                lane.current.removeChild(newBar);
            }
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
        if (timingList[noteIndex][1] === "FL") missAnimation("lc_one")
        else if (timingList[noteIndex][1] === "FR") missAnimation("lc_two")
        else if (timingList[noteIndex][1] === "SL") missAnimation("lc_three")
        else if (timingList[noteIndex][1] === "SR") missAnimation("lc_four")
        else if (timingList[noteIndex][1] === "FT") {
            missAnimation("lc_one")
            missAnimation("lc_two")
        }
        else if (timingList[noteIndex][1] === "ST") {
            missAnimation("lc_two")
            missAnimation("lc_four")
        }
    
        setMissCount((count) => count + 1);
        setComboCount(0)
        if (hp <= 1) {
            setHP(1)
        }
        setHP(prevHP => prevHP -= 2)
        if (combo_bar.current) combo_bar.current.style.transition = "none";
        setNoteIndex((index) => index + 1)
    }

    const checkFirstLane = () => {
        if (leftTiming.current[leftTimingIndex][1] === "FL" && leftTiming.current[leftTimingIndex][0] <= time + 150) {
            handleInput(leftTiming.current, setLeftTimingIndex, leftTimingIndex, "FL")
            return;
        }
        else {
            defaultAnimation("lc_one")
        }
    }

    const checkSecondLane = () => {
        if (rightTiming.current[rightTimingIndex][1] === "FR" && rightTiming.current[rightTimingIndex][0] <= time + 150) {
            handleInput(rightTiming.current, setRightTimingIndex, rightTimingIndex, "FR")
            return
        }
        else {
            defaultAnimation("lc_two")
        }      
    }

    const checkThirdLane = () => {
        if (leftTiming.current[leftTimingIndex][1] === "SL" && leftTiming.current[leftTimingIndex][0] <= time + 150) {
            handleInput(leftTiming.current, setLeftTimingIndex, leftTimingIndex, "SL")
            return
        }
        else {
            defaultAnimation("lc_three")
        }
    }

    const checkFourthLane = () => {
        if (rightTiming.current[rightTimingIndex][1] === "SR" && rightTiming.current[rightTimingIndex][0] <= time + 150){
            handleInput(rightTiming.current, setRightTimingIndex, rightTimingIndex, "SR")
            return
        }
        else {
            defaultAnimation("lc_four")
        }    
    }

    return (
    <div>
        <div id='game_container'>
            {(!endScreen || !gameOverScreen) && 
            <button id='pause_btn' onClick={pauseMap} disabled={(gameState === "End") || (gameState === "Paused")} style={{opacity: (gameState === "End")? 0 : 1 }}>
              {(gameState === "Paused")? 
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-pause-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0z"/>
              </svg>
              :<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-play-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445"/>
              </svg>
              }
            </button>
            }

            <div id='progress_bar' style={{width: `${(time/(gameLength * 1000)) * 100}%`, opacity: (gameState === "End")? 0 : 1 }}></div>
            <div id='stats_div' style={{opacity: (gameState === "End")? 0 : 1 }}>
                <h1 id='score_text'>{score}</h1>
                {(comboCount > 5) && <h1 id="combo_text">{comboCount} Combo</h1>}
            </div>
            <div id='lane_container' className={flippedScreen? "flipped" : "unflipped"}>
                <div id='text_wrapper' style={{transform: flippedScreen? "scaleX(-1)" : ""}}>
                    <h1 className='hit_text' id='perfect_text'>Perfect</h1>
                    <h1 className='hit_text' id='okay_text'>Okay</h1>
                    <h1 className='hit_text' id='miss_text'>Miss</h1>
                </div>
            
                <div id='lil_game_guy'>
                    <div id='flow_crown' style={{opacity: flowState? 1 : 0}}></div>
                    <div id='game_left_eye' className="loading_eye"></div>
                    <div id='game_right_eye' className={(flowState && (gameState !== "Paused"))? "loading_eye flow_eye" : "loading_eye"}>
                        <span className="lane_circle_teeth"></span>
                        <span className="lane_circle_teeth"></span>
                        <span className="lane_circle_teeth"></span>
                    </div>
                </div>
                <div className='lane_section'>
                    <div ref={lane_one} className='lane lane-one'> 
                    <div className='lane_circle_tape lct_left'></div>
                        <div id='lc_one' className='lane_circle'>
                            <span className="lane_circle_teeth"></span>
                            <span className="lane_circle_teeth"></span>
                            <span className="lane_circle_teeth"></span>
                        </div>
                    </div>
                    <div ref={lane_two} className='lane lane-two'>  
                        <div className='lane_circle_tape lct_right'></div>
                        <div id='lc_two' className='lane_circle'>
                            <span className="lane_circle_teeth"></span>
                            <span className="lane_circle_teeth"></span>
                            <span className="lane_circle_teeth"></span>
                        </div>
                    </div>    
                </div>
                <div className='lane_section'>
                    <div ref={lane_three} className='lane lane-three'>  
                        <div className='lane_circle_tape lct_left'></div>
                        <div id='lc_three' className='lane_circle'>
                            <span className="lane_circle_teeth"></span>
                            <span className="lane_circle_teeth"></span>
                            <span className="lane_circle_teeth"></span>
                        </div>
                    </div>
                    <div ref={lane_four} className='lane lane-four'>
                        <div className='lane_circle_tape lct_right'></div>
                        <div id='lc_four' className='lane_circle'>
                            <span className="lane_circle_teeth"></span>
                            <span className="lane_circle_teeth"></span>
                            <span className="lane_circle_teeth"></span>
                        </div>
                    </div>    
                </div>
            </div> 

            <div id='boombox' style={{opacity: (gameState === "End")? 0 : 1 }}>
                {/* Because state changes happen while end/game over screen pop opp, hp state could be in the negatives. Using Math._ is a good way to clamp values for the player */}
                <p id='hp_count'>{Math.max(hp, 0)}/100</p>
                <p id='flow_count' style={{opacity: flowState? "0" : 1}}>{Math.min(flow, 100)}/100</p>
                <div id='bc_left' className='boombox_circle'></div>
                <div id="bc_right" className='boombox_circle'></div>
                <div id='hp_container'>
                    <div id='hp_bar' style={{width: `${(hp / 100) * 85}%`}}></div>
                </div>
                <div id='flow_container'>
                    <div id='flow_bar' style={{width: `${15 + (flow / 100) * 85}%`}}></div>
                    <div id='flow_bar_cover' style={{opacity: flowState? 1 : 0}}></div>
                </div>
            </div>

            <div id='tutorial_div_wrapper' className={tutorialStep === 10? "final_screen" : "not_final"}>
                <div id='tutorial_divs'>
                    {(tutorialStep < 4 || tutorialStep === 5 || tutorialStep === 7 || tutorialStep === 8|| tutorialStep === 10) &&<div className='tutorial_bg'></div>}
                    <div className={tutorialStep === 1? "tutorial_div active_tutorial" : "tutorial_div unactive_tutorial"}>
                        <h1>Welcome to Project Tape!</h1>
                        <h2>Project Tape is a web-based Rhythm Game, where you can create, play, and share songs with anyone!</h2>
                        <br/>
                        <div className='hori_div'>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-music-note" viewBox="0 0 16 16">
                                <path d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2"/>
                                <path fillRule="evenodd" d="M9 3v10H8V3z"/>
                                <path d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5z"/>
                            </svg>
                            <h2>Connected - Hydelic</h2>
                        </div>
                    </div>

                    <div className={tutorialStep === 2? "tutorial_div active_tutorial" : "tutorial_div unactive_tutorial"}>
                        <h1>How to Play:</h1>
                        <h2>Each song features a Top Deck and a Bottom Deck. Spin between them
                            using the <span>A</span> and <span>D</span> keys respectively.</h2>
                        <h2>Each Deck has a Top Lane (<span>J</span> Key) and a Bottom Lane (<span>L</span> Key).
                        </h2>
                        <h2>You can <span>only</span> hit the notes of your current Deck.</h2>
                        <div className='hori_div'>
                            <img src='/cas.svg'/>
                            <h2>&apos;s position indicates your current Deck.</h2>
                        </div>
                        <br/>
                    </div>

                    <div className={tutorialStep === 3? "tutorial_div active_tutorial" : "tutorial_div unactive_tutorial"}>
                        <h1>Scoring:</h1>
                        <h2>Notes appear from the right, matching the song&apos;s rhythm. When a note reaches the left white line
                             of your current Deck, hit the corresponding lane key (<span>J</span> and <span>L</span>). 
                        </h2>
                        <div className='scoring_demo'>
                            <div>
                            <div className='demo_bar'>
                                <div className='lane_circle_tape lct_left'></div>
                                <div className='lane_circle_tape lct_left'></div>
                                <div className='lane_circle'>
                                    <span className="lane_circle_teeth"></span>
                                    <span className="lane_circle_teeth"></span>
                                    <span className="lane_circle_teeth"></span>
                                </div>
                            </div>
                            <div className='demo_bar'>
                                <div className='lane_circle_tape lct_right'></div>
                                <div className='lane_circle'>
                                    <span className="lane_circle_teeth"></span>
                                    <span className="lane_circle_teeth"></span>
                                    <span className="lane_circle_teeth"></span>
                                </div>
                            </div>
                            </div>
                            
                            <div className='demo_note_bar'>
                            </div>
                            <div className='demo_note_bar'>
                            </div>
                        </div>
                        <h2 className='perfect'>Perfect Range</h2>
                        <h2 className='okay'>Okay Range</h2>
                        <br/>
                    </div>

                    <div className={tutorialStep === 5? "tutorial_div active_tutorial" : "tutorial_div unactive_tutorial"}>
                        <h1>Spin Notes:</h1>
                        <div className='scoring_demo_turn'>
                            <div className='demo_turn_bar'></div>
                            <div className='demo_turn_bar'></div>
                        </div>
                        <h2>Hit Spin Notes with the corresponding Spin key (<span>A</span> or <span>D</span>) as they reach the white line.</h2>
                        <h2>A Spin Note only registers if you spin from the <span>opposite</span> Deck.</h2>
                        <br/>
                    </div>

                    <div className={(tutorialStep === 7 || tutorialStep === 8)? "tutorial_div active_tutorial" : "tutorial_div unactive_tutorial"}>
                        <h1>More:</h1>
                        <div className='hori_div'>
                            <h2>
                                <span>Flow</span>: Hit enough notes, and<img id='shrink_cas' src='/cas.svg'/>
                               will enter &quot;Flow&quot;, which grants bonus points. Let&apos;s try it!</h2>
                        </div>
                        <h2><span className='green_span'>HP</span>: Missing too many notes leads to Game Over.</h2>
                        <br/>
                    </div>

                    <div className={(tutorialStep === 10)? "tutorial_div active_tutorial" : "tutorial_div unactive_tutorial"}>
                        <h1>That&apos;s All!</h1>
                        <h2>You should now be able to play any song!</h2>
                        <h2>Songs are rated from 1 - 6 in difficulty:</h2>
                        <div className='hori_div split_it'>
                            {[1,2,3,4,5,6].map((difficulty) => {
                                return (
                                    <div className="tutorial_spinner" key={`${difficulty} spinner`}>
                                        <span className={((difficulty) >= 5 )? "cas_teeth active_teeth" : ((difficulty) >= 2)? "cas_teeth half_active_teeth" : "unactive_teeth"}></span>
                                        <span className={((difficulty) === 6 )? "cas_teeth active_teeth" : ((difficulty) >= 3)? "cas_teeth half_active_teeth" : "unactive_teeth"}></span>
                                        <span className={((difficulty) >= 4 )?"cas_teeth active_teeth" : "cas_teeth half_active_teeth"}></span>
                                    </div>
                                )
                            })}
                        </div>
                        <div id='tutorial_end'>
                            <Link href={"/"}>Go Back to the Game</Link>
                            <button onClick={restartMap}>Restart the Tutorial</button>
                        </div>
                        <br/>
                    </div>
                    
                </div>
            </div>

            <div id='pause_wrapper' className={(gameState === "Paused")? "pause_active" : 'pause_unactive'}>
                <div id="pause_screen">
                    <label id='bg_label' htmlFor='bg_slider'>Background Dim</label>
                    <input 
                        id='bg_slider'
                        className="slider-dim"
                        type="range"
                        min={0}
                        max={0.9}
                        value={backgroundDim}
                        onChange={e => setBackgroundDim(parseFloat(e.target.value))}
                        step={0.1}
                    ></input>
                    <button onClick={() => resumeMap()}>Resume</button>
                    <button onClick={() => restartMap()}>Retry</button>
                    <button onClick={() => setFlippedScreen(!flippedScreen)}>Flip Screen</button>
                    {/* <button onClick={() => setFlippedBackground(!flippedBackground)}>Flip Background</button> */}
                    <Link href={"/"}>Close Tutorial</Link>
                </div>
            </div>

            {gameState === "Waiting"? 
            <div id='waiting_wrapper'>
                {/* {songBackground && <p id='yt_info'>Video Background Powered by Youtube. Video copyright belongs to respective owners.</p>} */}
                    <span>3</span>
                    <span>2</span>
                    <span>1</span>
                    <span></span>
            </div>
            :
            <>
            </>
            }

            {/* {endScreen && 
                <div id='end_screen_wrapper'>
                    <div>
                        <h1 id='score_text'>0</h1>
                    </div>
                    <div id='cassette-tape'>
                        <div id='lil_guy_container'>
                            <div id='lil_guy'>
                                <div className='eyes' id='left_eye'></div>
                                <div className='eyes' id='right_eye'>
                                    <div id='gear_container'>
                                        <span className="cas_teeth_loading"></span>
                                        <span className="cas_teeth_loading"></span>
                                        <span className="cas_teeth_loading"></span>
                                    </div>
                                </div>
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
                    <div id='scoreUpload_menu'>
                        <div id='menu_div'>
                            </div>
                        <h2>{scoreUploading? "Checking server..." : leaderboardText}</h2>
                    </div>                    
                </div>
            } */}

            {/* {gameOverScreen && 
                <div id='game_over_screen_wrapper'>
                    <div id="game_over_screen">
                        <h1>Game Over</h1>
                        <button onClick={() => restartMap()}>Retry</button>
                        <button onClick={() => {closeGame(usingLocalMap)}}>Main Menu</button>
                    </div>
                </div>
            } */}
        </div>
    </div>
  )
}