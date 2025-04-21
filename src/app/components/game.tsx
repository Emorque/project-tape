// 'use client' taken out because of the gameMapProp. use client is now implied i think b/c parent has use client

    // Things to add: combo bar div with "flow" meter
    // Visible score and combo 
    // Update UI to best match something like Taiko

import React, { MouseEvent,RefObject, useCallback, useEffect, useRef, useState } from 'react';
import "./game.css";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { settingsType, ytBackgroundType } from '@/utils/helperTypes';
import { type User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import ReactPlayer from "react-player/youtube";

interface gameInterface {
    gameMap: [number,string][];
    closeGame: (local : boolean) => void;
    settings: settingsType;
    audioProp: React.RefObject<HTMLAudioElement>;
    user : User | null;
    song_id: number | null;
    songBackground: ytBackgroundType | null;
    verified: boolean;
    usingLocalMap: boolean
}

const gameWhite = "#def0e5"

const getKeyMapping = (key : string) => {
    const res = [(key === "Spacebar") ? " " : key.charAt(0).toUpperCase() + key.slice(1), (key === "Spacebar") ? " " : key.charAt(0).toLowerCase() + key.slice(1)]
    return res
}

const getAccuracy = (perfect: number, okay: number, miss: number) => {
    const total = perfect + okay + miss;
    const accuracy = ((perfect + okay) / total) * 100
    return accuracy.toFixed(2)
}

export const Game = ({gameMap, closeGame, settings, audioProp, user, song_id, songBackground, verified, usingLocalMap} : gameInterface) => {   
    const supabase = createClient() // Maybe both of these can work outside of the Game function
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

    const [songLength, setSongLength] = useState<number>(0);

    useEffect(() => {
        flowStateAnimation.current.to("#flow_bar_cover", {width: "15%", duration: 10, ease: "none", onComplete: () => {setFlowState(false)}})
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

    const [hitsoundIndex, setHitsoundIndex] = useState<number>(0);
    const hitsoundsRef = useRef<{ play: () => void; }[]>([]);

    // Score for Leaderboard
    const [scoreUploading, setScoreUploading] = useState<boolean>(true)
    const [leaderboardText, setLeadboardText] = useState<string>("Loading")
    
    // States for YT Background(s) 
    const [backgroundDim, setBackgroundDim] = useState<number>(settings.backgroundDim || 0.5)
    const [videoLoaded, setVideoLoaded] = useState<boolean>(false)
    const [videoPlaying, setVideoPlaying] = useState<boolean>(true)
    const reactPlayerRef = useRef<ReactPlayer | null>(null)

    const [videoVisible, setVideoVisible] = useState<boolean>(false)
    const handleProgress = (state: {playedSeconds : number}) => {
        if (songBackground && state.playedSeconds >= songBackground[0][2] - 5) {
            setVideoPlaying(false)
            setVideoVisible(false)
        }
    }

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
        if (!tabActive && gameState !== "Paused") {
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

    // Everything to do with Supabase, only executed if selectedSong and usingLocalMap is false
    const uploadScore = useCallback(async () => {
        if (!song_id || usingLocalMap) {
            setLeadboardText("Leaderboard Not Supported for Local Songs")
            setScoreUploading(false);
            return;
        }
        if (!user && gameState === "End") {
            setLeadboardText("You need to be logged in to upload scores")
            setScoreUploading(false);
            return;
        }
        if (gameState === "End" && !verified) {
            setLeadboardText("Leaderboard not available for pending songs")
            setScoreUploading(false);
            return;
        }
        if (!user || gameState !== "End") return; // Error without this. Likely because it would query profiles with a null id without it
        try {
            setScoreUploading(true)

            const { data, error, status } = await supabase
            .from('leaderboard')
            .select(`score`)
            .eq('user_id', user?.id)
            .eq('song_id', song_id)
            .single()
    
            if (error && status !== 406) {
                console.log("Error obtaining leaderboard score", error)
                throw error
            }
    
            if (data) {
                if (data.score < score) {
                    try {
                        const { error : uploadError } = await supabase
                        .from('leaderboard')
                        .update({ score: score })
                        .eq('user_id', user?.id)
                        .eq('song_id', song_id)

                        if (uploadError) {
                            console.log("upload Error", uploadError)
                            throw error
                        }
                    }
                    catch (uploadError) {
                        console.log("Error Updating Score", uploadError)
                    }
                    finally {
                        setLeadboardText("Updated Score to Leaderboard")
                    }
                }
                else {
                    setLeadboardText(`Your Previous Score: ${data.score}`)
                }
            }
            else if (error && error.code === "PGRST116") {
                console.log("This row with these ids don't exist")
                try {
                    const { error : insertError } = await supabase
                    .from('leaderboard')
                    .insert([
                    { 'song_id' : song_id, 'user_id': user?.id, 
                        'score': score, 
                        'accuracy': getAccuracy(perfectCount, okayCount, missCount), 
                        'username' : user.user_metadata.username, 
                        'max_combo': maxCombo},
                    ])
    
                    if (insertError) {
                        console.log("Error inserting score", insertError);
                        throw insertError
                    }
                }                
                catch (insertError) {
                    console.log("Error inserting new score to leaderboard", insertError)
                }
                finally {
                    setLeadboardText("Score Uploaded to Leaderboard")
                }
            }
        } catch (error) {
            console.log("Caught leaderboard error", error);
        } finally {
            console.log("Leaderboard Score Complete")
            setScoreUploading(false)
        }
    }, [user, supabase, gameState, perfectCount, okayCount, missCount, score, maxCombo, song_id, verified]);
    
    
    // Remove use Effect and just tie the uploadScore function to be called once song ends 
    useEffect(() => {
        uploadScore()
    }, [user, verified, uploadScore])

    // All animations
    const moveLeft = contextSafe(() => {
        gsap.timeline()
        .to("#lil_game_guy", {top: "25%", transform: " scaleY(0.8) translateY(-50%)", duration: "0.2"})
        .to("#lil_game_guy", {transform: " scaleY(1) translateY(-50%)", duration: "0.2"})
        gsap.timeline()
        .to("#game_left_eye", {top: "0%", duration: "0.2"})
        .to("#game_left_eye", {top: "30%", duration: "0.2"})
        gsap.timeline()
        .to("#game_right_eye", {top: "-5%", duration: "0.2"})
        .to("#game_right_eye", {top: "20%", duration: "0.2"})

        setDirection("Left");
    })

    const moveRight = contextSafe(() => {
        gsap.timeline()
        .to("#lil_game_guy", {top: "75%", transform: " scaleY(0.8) translateY(-50%)", duration: "0.2"})
        .to("#lil_game_guy", {transform: " scaleY(1) translateY(-50%)", duration: "0.2"})
        gsap.timeline()
        .to("#game_left_eye", {top: "60%", duration: "0.2"})
        .to("#game_left_eye", {top: "30%", duration: "0.2"})
        gsap.timeline()
        .to("#game_right_eye", {top: "45%", duration: "0.2"})
        .to("#game_right_eye", {top: "20%", duration: "0.2"})
        setDirection("Right");
    })

    const missAnimation = contextSafe((circle : string) => {
        gsap.timeline()
        .to(`#${circle}`, {rotation: "-=90", borderColor: "red", duration: "0.1"})
        .to(`#${circle}`, {borderColor: gameWhite, duration: "0.1"})
        gsap.timeline()
        .to("#bc_left", {transform: "scale(0.95)", duration: "0.1"})
        .to("#bc_left", {transform: "scale(1)", duration: "0.1"})
    })

    const defaultAnimation = contextSafe((circle : string) => {
        gsap.timeline()
        .to(`#${circle}`, {borderColor: "#707070", duration: "0.1"})
        .to(`#${circle}`, {borderColor: gameWhite, duration: "0.1"})
    })

    const hitAnimation = contextSafe((circle : string) => {
        if (circle === "lc_one" || circle == "lc_three") {
            gsap.timeline()
            .to(`#${circle}`, {rotation: "+=40", borderColor: "blue", duration: "0.1"})
            .to(`#${circle}`, {borderColor: gameWhite, duration: "0.1"})
        }
        else {
            gsap.timeline()
            .to(`#${circle}`, {rotation: "+=40", borderColor: "blue", duration: "0.1"})
            .to(`#${circle}`, {borderColor: gameWhite, duration: "0.1"})
        }
        gsap.timeline()
        .to("#bc_right", {transform: "scale(1.05)", duration: "0.1"})
        .to("#bc_right", {transform: "scale(1)", duration: "0.1"})
    })

    const perfectAnimation = contextSafe((circle : string) => {
        if (circle === "lc_one" || circle == "lc_three") {
            gsap.timeline()
            .to(`#${circle}`, {rotation: "+=40", borderColor: "green", duration: "0.1"})
            .to(`#${circle}`, {borderColor: gameWhite, duration: "0.1"})
        }
        else {
            gsap.timeline()
            .to(`#${circle}`, {rotation: "+=40", borderColor: "green", duration: "0.1"})
            .to(`#${circle}`, {borderColor: gameWhite, duration: "0.1"})
        }
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
            hitsoundsRef.current[hitsoundIndex].play();
            setHitsoundIndex((index) => (index + 1) % 12); 
            if (flowState){
                setScore((score) => score + 300);
            }
            else {
                setScore((score) => score + 150);
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
                // setFlow(100)
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
            hitsoundsRef.current[hitsoundIndex].play();
            setHitsoundIndex((index) => (index + 1) % 12); 
            if (flowState){
                setScore((score) => score + 200);
            }
            else {
                setScore((score) => score + 100);
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
                // setFlow(100)
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

    const enterFlowState = () => {

    }

    useEffect(() => {
        const handleKeyDown = (event: { key: string; repeat : boolean}) => {
            if (event.repeat) return;

            if (gameState === "End" || gameState === "Waiting") return;

            if ((event.key === buttonMappings.pause[0]|| event.key === buttonMappings.pause[1]) && songStarted) {
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
                hitsoundsRef.current[hitsoundIndex].play();
                setHitsoundIndex((index) => (index + 1) % 12);       
                return;
            }
    
            else if (event.key === buttonMappings.rightLane[0]|| event.key === buttonMappings.rightLane[1]) {
                if (direction === 'Left' && rightTimingIndex < rightTiming.current.length) {
                    checkSecondLane()                               
                }
        
                else if (direction === 'Right' && rightTimingIndex < rightTiming.current.length) {
                    checkFourthLane()    
                }
                hitsoundsRef.current[hitsoundIndex].play();
                setHitsoundIndex((index) => (index + 1) % 12); 
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
        }, [time, direction, leftTimingIndex, rightTimingIndex, turnTimingIndex, hitsoundIndex, gameState, songStarted]);
    


    // TODO: Remove this handleEnd and replace this by adding 1 or 2 classes in css file and adjusting class list for lane-container based on states
    const handleEnd = contextSafe(() => {
        gsap.to("#lane_container", {
            opacity: 0,
            duration: 1,
            onComplete: () => {
                setEndScreen(true)
                setGameState("End")
                setVideoVisible(false)
                setVideoPlaying(false)
            }
        })
    })
    
    const gameOver = () => {
        gsap.to("#lane_container", {
            opacity: 0,
            duration: 1,
            onComplete: () => {
                setGameState("End")
                setGameOverScreen(true)
                setStopwatchActive(false)
                setVideoVisible(false)
                setVideoPlaying(false)
            }
        })
    }

    // Ends the game once the audio file ends 
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
            }, 3000)
        }
    }, [endScreen])

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
        if (flowState) {
            flowStateAnimation.current.play()
        }
        if (reactPlayerRef.current){
            setVideoPlaying(true)
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
        if (flowState) {
            flowStateAnimation.current.pause()
        }
        console.log(flowStateAnimation.current)
        // flowStateAnimation.current.paused(true)
        if (reactPlayerRef.current){
            setVideoPlaying(false)
        }
    }

    // Start Map
    useEffect(() => {
        const tempHitsounds: { play: () => void; }[] = []
        for (let i = 0; i < 12; i++) {
          const hitsound  = new Audio('/hitsound.mp3'); // Needed for local 
          hitsound.volume = settings.hsVolume
          tempHitsounds.push(hitsound);
        } 
        hitsoundsRef.current = tempHitsounds;

        const res = (gameMap.sort((firstItem: [number,string], secondItem: [number,string]) => firstItem[0] - secondItem[0]))
        // console.log(res)
        // console.log()
        setSongLength(res[res.length - 1][0])

        // setSongLength(res[-1])
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
                    setSongStarted(true)
                }
                if (reactPlayerRef.current && songBackground) {
                    reactPlayerRef.current.seekTo(songBackground[0][1])
                    setVideoVisible(true)
                    setVideoLoaded(true)
                }
            }, ((scrollSpeed * 2) + 3000 + offset))
    
            setTimeout(() => {
                setStopwatchActive(true);
                setStPaused(false);
                setGameState("Running")
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
                if (reactPlayerRef.current && songBackground) {
                    reactPlayerRef.current.seekTo(songBackground[0][1])
                    setVideoVisible(true)
                    setVideoLoaded(true)
                }
            }, ((scrollSpeed * 2) + 3000))
    
            setTimeout(() => {
                setStopwatchActive(true);
                setStPaused(false);
            }, scrollSpeed + 3000 - offset)
            
            setTimeout(() => {
                setGameState("Running")
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
        if (reactPlayerRef.current && songBackground) {
            reactPlayerRef.current.seekTo(songBackground[0][1])
            setVideoPlaying(false)
            setVideoVisible(false)
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
                if (reactPlayerRef.current && songBackground) {
                    setVideoPlaying(true)
                    setVideoVisible(true)
                }
            }, ((scrollSpeed * 2) + 3000 + offset))
    
            setTimeout(() => {
                setStopwatchActive(true);
                setStPaused(false);
                setGameState("Running")
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
                if (reactPlayerRef.current && songBackground) {
                    setVideoPlaying(true)
                    setVideoVisible(true)
                }
            }, ((scrollSpeed * 2) + 3000))
    
            setTimeout(() => {
                setStopwatchActive(true);
                setStPaused(false);
            }, scrollSpeed + 3000 - offset)
            
            setTimeout(() => {
                setGameState("Running")
            }, scrollSpeed + 3000)
        }

        // Same here, just tie the animation to a class for lane-container's classlist 
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
            gameOver();
        }
        setHP(prevHP => prevHP -= 2)
        if (combo_bar.current) combo_bar.current.style.transition = "none";
        setNoteIndex((index) => index + 1)
    }

    const circleContainerRef = useRef<HTMLDivElement>(null)
    const handleFirstLane = () => {
        if (direction === 'Left' && leftTimingIndex < leftTiming.current.length) {
            checkFirstLane()
        }
    }

    const handleSecondLane = () => {
        if (direction === 'Left' && rightTimingIndex < rightTiming.current.length) {
            checkSecondLane()              
        }
    }

    const handleThirdLane = () => {
        if (direction === 'Right' && leftTimingIndex < leftTiming.current.length) {
            checkThirdLane()
        }
    }

    const handleFourthLane = () => {
        if (direction === 'Right' && rightTimingIndex < rightTiming.current.length) {
            checkFourthLane()
        }
    }

    const handleLeftTurn = () => {
        if (direction === "Left") return
        moveLeft();
        if (turnTimingIndex < turnTiming.current.length && turnTiming.current[turnTimingIndex][0] <= time + 150) {
            handleInput(turnTiming.current, setTurnTimingIndex, turnTimingIndex, "FT")
        }
    }

    const handleRightTurn = () => {
        if (direction === "Right") return
        moveRight();
        if (turnTimingIndex < turnTiming.current.length && turnTiming.current[turnTimingIndex][0] <= time + 150) {
            handleInput(turnTiming.current, setTurnTimingIndex, turnTimingIndex, "ST")
        }
    }

    // const handleCircleContainer = (event : MouseEvent<HTMLDivElement>) => { //React. not needed because imported at the top
    //     if (!circleContainerRef.current) return
    //     const circleContainerInfo = circleContainerRef.current.getBoundingClientRect();
    //     const mousePlacement = event.clientX - circleContainerInfo.left
    //     const containerWidth = circleContainerInfo.right - circleContainerInfo.left

    //     if (!mousePlacement || !containerWidth) return;
    //     const oneFourth = containerWidth * (1/4)
    //     const twoFourths = containerWidth * (2/4)
    //     const threeFourths = containerWidth * (3/4)
        
    //     if (0 < mousePlacement && mousePlacement <= oneFourth) { // First Bar
    //         console.log("First Circle")
    //         if (direction === 'Left' && leftTimingIndex < leftTiming.current.length) {
    //             checkFirstLane()
    //         }
    //       }
    //       else if (oneFourth < mousePlacement && mousePlacement <= twoFourths) { // Second Bar
    //         console.log("Second Circle")
    //         if (direction === 'Left' && rightTimingIndex < rightTiming.current.length) {
    //             checkSecondLane()              
    //         }
    //       }
    //       else if (twoFourths < mousePlacement && mousePlacement <= threeFourths) { // Third Bar
    //         console.log("Third Circle")
    //         if (direction === 'Right' && leftTimingIndex < leftTiming.current.length) {
    //             checkThirdLane()
    //         }
    //       }
    //       else if (threeFourths < mousePlacement && mousePlacement <= containerWidth) { // Fourth Bar
    //         console.log("Fourth Circle")
    //         if (direction === 'Right' && rightTimingIndex < rightTiming.current.length) {
    //             checkFourthLane()
    //         }
    //       }
    // }

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
        {songBackground && 
        <div id='video_visible' style={{opacity: videoVisible? (1 - backgroundDim) : 0}} className={videoLoaded? "showBackground" : "hideBackground"} >
            {/* <div id='yt-cover'> */}
            {/* </div> */}
            // https://www.youtube-nocookie.com/embed/eh1r0ZpTrXo?controls=0&rel=0&playsinline=1&disablekb=1&autoplay=0&modestbranding=1&nocookie=true&fs=0&enablejsapi=1&origin=https%3A%2F%2Frhythm-plus.com&widgetid=1&forigin=https%3A%2F%2Frhythm-plus.com%2Fgame%2FGyLLbFGVGXJ9TagPGE5dur&aoriginsup=1&vf=1 i found a secret

            {/* <ReactPlayer
                ref={reactPlayerRef}
                
                url={`https://www.youtube-nocookie.com/watch?v=${songBackground[0][0]}?start=${songBackground[0][1]}&end=${songBackground[0][2]}&rel=0&nocookie=true`} //&rel=0 means that "more videos" are locked to uploader's channel
                loop={false}
                controls={false}
                volume={100}
                muted={true}
                height={"100%"}
                width={"100%"}
                playing={videoPlaying}
                pip={false}
                light={false}
                playsinline={true}
                onProgress={handleProgress}
                config={{
                    playerVars: {
                        iv_load_policy: 3,
                        disablekb: 1
                    }
                }}
            /> */}
        </div>
        }
        {/* <div id='game-container'>
            {!endScreen && 
            <button id='tapePauseBtn' onClick={pauseMap}>
              {(gameState === "Paused")? 
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
            }
            <div id='lane-container'>
                <div onClick={handleFirstLane} ref={lane_one} className='lane lane-one'> <div id='cOne' className='circle'></div> </div>
                <div onClick={handleSecondLane} ref={lane_two} className='lane lane-two'> <div id='cTwo' className='circle'></div> </div>
                <div onClick={handleThirdLane} ref={lane_three} className='lane lane-three'> <div id='cThree' className='circle'></div> </div>
                <div onClick={handleFourthLane} ref={lane_four} className='lane lane-four'> <div id='cFour' className='circle'></div> </div>
                <div ref={circleContainerRef} onClick={handleCircleContainer} id='circle-container'></div>
                <div style={player_style} id='lane-selection'>
                    <div id='lane-selection-inner'></div>
                    {flowState && 
                        <div id='ex-lane'></div>
                    }
                </div>
                <div id='turnBtns_container'>
                    <div onClick={handleLeftTurn} className='turnBtn'>{"<<"}</div>
                    <div onClick={handleRightTurn} className='turnBtn'>{">>"}</div>
                </div>
                <div id='combo-bar'>
                    <div style={combo_style} ref={combo_bar} id='combo-bar-fill'></div>
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
                        max={1}
                        value={backgroundDim}
                        onChange={e => setBackgroundDim(parseFloat(e.target.value))}
                        step={0.1}
                    ></input>
                    <button onClick={() => resumeMap()}>Resume</button>
                    <button onClick={() => restartMap()}>Retry</button>
                    <button onClick={() => {closeGame(usingLocalMap)}}>Main Menu</button>
                </div>
            </div>

            {gameState === "Waiting"? 
            <div id='waiting_wrapper'>
                {songBackground && <p id='yt_info'>Video Background Powered by Youtube. Video copyright belongs to respective owners.</p>}
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
                    <div id='scoreUpload_menu'>
                        <div id='menu_div'>
                            <button onClick={restartMap} className='gameBtns'>Retry</button>
                            <button onClick={() => {closeGame(usingLocalMap)}} className='gameBtns'>Main Menu</button>
                        </div>
                        <h2>{scoreUploading? "Checking server..." : leaderboardText}</h2>
                    </div>                    
                </div>
            }
        </div> */}
        <div id='game_container'>
            {(!endScreen || !gameOverScreen) && 
            <button id='pause_btn' onClick={pauseMap}>
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

            <div id='progress_bar' style={{width: `${(time/songLength) * 100}%`}}></div>
            <div id='stats_div'>
                <h1 id='score_text'>{score}</h1>
                {(comboCount > 5) && <h1 id="combo_text">{comboCount} Combo</h1>}
            </div>
            <div id='lane_container' className={flippedScreen? "flipped" : "unflipped"}>
                <div id='lil_game_guy'>
                    <div id='flow_crown' style={{opacity: flowState? 1 : 0}}></div>
                    <div id='game_left_eye' className="loading_eye"></div>
                    <div id='game_right_eye' className={(flowState && (gameState !== "Paused"))? "loading_eye flow_eye" : "loading_eye"}>
                        <span className="cas_teeth_loading"></span>
                        <span className="cas_teeth_loading"></span>
                        <span className="cas_teeth_loading"></span>
                    </div>
                </div>
                <div className='lane_section'>
                    <div onClick={handleFirstLane} ref={lane_one} className='lane lane-one'> 
                    <div className='lane_circle_tape lct_left'></div>
                        <div id='lc_one' className='lane_circle'>
                            <span className="cas_teeth_loading"></span>
                            <span className="cas_teeth_loading"></span>
                            <span className="cas_teeth_loading"></span>
                        </div>
                    </div>
                    <div onClick={handleSecondLane} ref={lane_two} className='lane lane-two'>  
                        <div className='lane_circle_tape lct_right'></div>
                        <div id='lc_two' className='lane_circle'>
                            <span className="cas_teeth_loading"></span>
                            <span className="cas_teeth_loading"></span>
                            <span className="cas_teeth_loading"></span>
                        </div>
                    </div>    
                </div>
                <div className='lane_section'>
                    <div onClick={handleThirdLane} ref={lane_three} className='lane lane-three'>  
                        <div className='lane_circle_tape lct_left'></div>
                        <div id='lc_three' className='lane_circle'>
                            <span className="cas_teeth_loading"></span>
                            <span className="cas_teeth_loading"></span>
                            <span className="cas_teeth_loading"></span>
                        </div>
                    </div>
                    <div onClick={handleFourthLane} ref={lane_four} className='lane lane-four'>
                        <div className='lane_circle_tape lct_right'></div>
                        <div id='lc_four' className='lane_circle'>
                            <span className="cas_teeth_loading"></span>
                            <span className="cas_teeth_loading"></span>
                            <span className="cas_teeth_loading"></span>
                        </div>
                    </div>    
                </div>

                
                {/* <div ref={circleContainerRef} onClick={handleCircleContainer} id='circle-container'></div> */}
                {/* <div style={player_style} id='lane-selection'>
                    <div id='lane-selection-inner'></div>
                    {flowState && 
                        <div id='ex-lane'></div>
                    }
                </div> */}
                {/* <div id='turnBtns_container'>
                    <div onClick={handleLeftTurn} className='turnBtn'>{"<<"}</div>
                    <div onClick={handleRightTurn} className='turnBtn'>{">>"}</div>
                </div> */}
                {/* <div id='combo-bar'>
                    <div style={combo_style} ref={combo_bar} id='combo-bar-fill'></div>
                </div> */}
            </div> 

            <div id='boombox'>
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

            <div id='pause_wrapper' className={(gameState === "Paused")? "pause_active" : 'pause_unactive'}>
                <div id="pause_screen">
                    <label id='bg_label' htmlFor='bg_slider'>Background Dim</label>
                    <input 
                        id='bg_slider'
                        className="slider-dim"
                        type="range"
                        min={0}
                        max={1}
                        value={backgroundDim}
                        onChange={e => setBackgroundDim(parseFloat(e.target.value))}
                        step={0.1}
                    ></input>
                    <button onClick={() => resumeMap()}>Resume</button>
                    <button onClick={() => restartMap()}>Retry</button>
                    <button onClick={() => setFlippedScreen(!flippedScreen)}>Flip Screen</button>
                    <button onClick={() => {closeGame(usingLocalMap)}}>Main Menu</button>
                </div>
            </div>

            {gameState === "Waiting"? 
            <div id='waiting_wrapper'>
                {songBackground && <p id='yt_info'>Video Background Powered by Youtube. Video copyright belongs to respective owners.</p>}
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
                    <div id='scoreUpload_menu'>
                        <div id='menu_div'>
                            <button onClick={restartMap} className='gameBtns'>Retry</button>
                            <button onClick={() => {closeGame(usingLocalMap)}} className='gameBtns'>Main Menu</button>
                        </div>
                        <h2>{scoreUploading? "Checking server..." : leaderboardText}</h2>
                    </div>                    
                </div>
            }

            {gameOverScreen && 
                <div id='game_over_screen_wrapper'>
                    <div id="game_over_screen">
                        <h1>Game Over</h1>
                        <button onClick={() => restartMap()}>Retry</button>
                        <button onClick={() => {closeGame(usingLocalMap)}}>Main Menu</button>
                    </div>
                </div>
            }
        </div>
    </div>
  )
}