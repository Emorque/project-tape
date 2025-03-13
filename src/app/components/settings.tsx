import { useEffect, useState } from "react"
import "./settings.css"
import { settingsType } from "@/utils/helperTypes";
import gsap from 'gsap';
import { useGSAP } from "@gsap/react";

interface settingsInterface {
    saveSettings : (newSettings: settingsType | null) => void;
}

export const Settings = ({saveSettings} : settingsInterface) => {   
    const [leftAction, setLeftAction] = useState<string>("A")
    const [rightAction, setRightAction] = useState<string>("D")
    const [leftTurn, setLeftTurn] = useState<string>("J")
    const [rightTurn, setRightTurn] = useState<string>("L")
    const [pauseBtn, setPauseBtn] = useState<string>("Q")
    const [restartBtn, setRestartBtn] = useState<string>("P")
    const [actionKey, setActionKey] = useState<string>("")
    
    const [disableMapping, setDisabedMapping] = useState<boolean>(false)
    const [disabledSave, setDisabedSave] = useState<boolean>(false)

    const [scrollSpeed, setScrollSpeed] = useState<number>(1500);
    const [gameplayVolume, setGameplayVolume] = useState<number>(1);
    const [hitsoundVolume, setHitsoundVolume] = useState<number>(1);

    const [offset, setOffset] = useState<number | null>(0);

    const { contextSafe } = useGSAP(); // we can pass in a config object as the 1st parameter to make scoping simple

    const keyError = contextSafe((btnRef: string) => {
        gsap.to(btnRef, {backgroundColor: "#c70000 ", yoyo: true, repeat: 1, duration:0.75})
        gsap.to("#mapping_error", {visibility: "visible", opacity: 1, yoyo: true, repeat: 1, duration:0.75})
    })

    const bottomAnimation = contextSafe((btn : string) => {
        gsap.to(btn, {visibility: "visible", opacity: 1, yoyo: true, repeat: 1, duration:0.75})
    })

    // Button Assigment
    useEffect(() => {
        const handleKeyDown = (event: {key: string; repeat: boolean}) => {
            if (event.repeat) return;
            if (actionKey === "") return;
            if (disableMapping) return;
            
            const key = (event.key === " ") ? "Spacebar" : event.key.charAt(0).toUpperCase() + event.key.slice(1);
            
            // console.log(actionKey)

            if (actionKey === "LL") {
                if (key === rightAction || key === leftTurn || key === rightTurn || key === pauseBtn || key === restartBtn) {
                    // alert("Cannot Have Same Key")
                    keyError("#leftLaneBtn");
                    setDisabedMapping(true);
                    setTimeout(() => {
                        setDisabedMapping(false)
                    }, 1500)
                    return
                }
                // console.log("key", key)
                setLeftAction(key)
            }

            if (actionKey === "RL") {
                if (key === leftAction || key === leftTurn || key === rightTurn || key === pauseBtn || key === restartBtn) {
                    keyError("#rightLaneBtn");
                    setDisabedMapping(true);
                    setTimeout(() => {
                        setDisabedMapping(false)
                    }, 1500)
                    return
                }
                // console.log("key", key)
                setRightAction(key)
            }

            if (actionKey === "LT") {
                if (key === leftAction || key === rightAction || key === rightTurn || key === pauseBtn || key === restartBtn) {
                    keyError("#leftTurnBtn");
                    setDisabedMapping(true);
                    setTimeout(() => {
                        setDisabedMapping(false)
                    }, 1500)
                    return
                }
                // console.log("key", key)
                setLeftTurn(key)
            }

            if (actionKey === "RT") {
                if (key === leftAction || key === rightAction || key === leftTurn || key === pauseBtn || key === restartBtn) {
                    keyError("#rightTurnBtn");
                    setDisabedMapping(true);
                    setTimeout(() => {
                        setDisabedMapping(false)
                    }, 1500)
                    return
                }
                // console.log("key", key)
                setRightTurn(key)
            }

            if (actionKey === "Pause") {
                if (key === leftAction || key === rightAction || key === leftTurn || key === rightTurn || key === restartBtn) {
                    keyError("#pauseBtn");
                    setDisabedMapping(true);
                    setTimeout(() => {
                        setDisabedMapping(false)
                    }, 1500)
                    return
                }
                // console.log("key", key)
                setPauseBtn(key)
            }

            if (actionKey === "Restart") {
                if (key === leftAction || key === rightAction || key === leftTurn || key === rightTurn || key === pauseBtn) {
                    keyError("#restartBtn");
                    setDisabedMapping(true);
                    setTimeout(() => {
                        setDisabedMapping(false)
                    }, 1500)
                    return
                }
                // console.log("key", key)
                setRestartBtn(key)
            }
        }


        document.addEventListener('keydown', handleKeyDown);

        // Cleanup the event listener on unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [leftAction, rightAction, leftTurn, rightTurn, pauseBtn, restartBtn, actionKey, disableMapping])  


    // Grabbing local
    useEffect(() => {
        const localSettings = localStorage.getItem("settings")
        let updateSettings : settingsType 
        if (!localSettings) {
            console.log("No Local Settings")
            updateSettings = {
                lLane: "J",
                rLane: "L",
                lTurn: "A",
                rTurn: "D",
                
                pause: "Q",
                restart: "P",

                scrollSpd: 1500,

                gpVolume: 1,
                hsVolume: 1,

                offset: 0
            }
        }
        else{
            updateSettings = JSON.parse(localSettings);
        }
        
        // Come back to fix in case some users delete/rename keys
        
        setLeftAction(updateSettings.lLane);
        setRightAction(updateSettings.rLane);
        setLeftTurn(updateSettings.lTurn);
        setRightTurn(updateSettings.rTurn);

        setPauseBtn(updateSettings.pause);
        setRestartBtn(updateSettings.restart);

        setScrollSpeed(updateSettings.scrollSpd);

        setGameplayVolume(updateSettings.gpVolume);
        setHitsoundVolume(updateSettings.hsVolume);

        setOffset(updateSettings.offset)

        saveSettings(updateSettings)

        localStorage.setItem("settings", JSON.stringify(updateSettings))

    }, [])

    const handleGameplayVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // console.log(event.target.value)
        setGameplayVolume(parseFloat(event.target.value))
    }

    const handleHitsoundVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // console.log(event.target.value)
        setHitsoundVolume(parseFloat(event.target.value))
    }

    const handleScrollSpdChange = (event : React.ChangeEvent<HTMLInputElement>) => {
        // console.log(event.target.value)
        setScrollSpeed(parseInt(event.target.value))
    }


    const addOffset = (offsetToAdd: number) => {
        const prevOff = (offset)? offset : 0 
        setOffset(prevOff + offsetToAdd <= -2000 ? -2000 : prevOff + offsetToAdd);
    };

    const handleOffsetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (value === '') {
            setOffset(null);
        } else {
            const numericValue = value.replace(/[^0-9\-]/g, ''); // Allowing '-' for negative numbers and only numeric values
            setOffset(parseInt(numericValue, 10)); // Base 10
        }
    }
    

    const newActionKey = (newKey: string) => {
        if (disableMapping) return;
        if (actionKey === newKey) {
            setActionKey("")
        }
        else {
            setActionKey(newKey)
        }
    }

    const uploadSettings = () => {
        const stateOffset = offset ?? 0;
        const boundedOffset = Math.max(-2000, Math.min(2000, stateOffset))
        const newSettings :settingsType = {
            lLane: leftAction,
            rLane: rightAction,
            lTurn: leftTurn,
            rTurn: rightTurn,

            pause: pauseBtn,
            restart: restartBtn,

            scrollSpd: scrollSpeed,
            
            gpVolume: gameplayVolume,
            hsVolume: hitsoundVolume,

            offset: boundedOffset
        }
        setOffset(boundedOffset)
        bottomAnimation("#save_tooltip_text")
        setDisabedSave(true)
        setTimeout(() => {
            setDisabedSave(false)
        }, 1500)
        localStorage.setItem("settings", JSON.stringify(newSettings))
        saveSettings(newSettings);
    }

    const resetSettings = () => {
        const defaultSettings :settingsType = {
            lLane: "J",
            rLane: "L",
            lTurn: "A",
            rTurn: "D",
            
            pause: "Q",
            restart: "P",

            scrollSpd: 1500,

            gpVolume: 1,
            hsVolume: 1,

            offset: 0
        }

        setLeftAction(defaultSettings.lLane);
        setRightAction(defaultSettings.rLane);
        setLeftTurn(defaultSettings.lTurn);
        setRightTurn(defaultSettings.rTurn);

        setPauseBtn(defaultSettings.pause);
        setRestartBtn(defaultSettings.restart);

        setScrollSpeed(defaultSettings.scrollSpd);

        setGameplayVolume(defaultSettings.gpVolume);
        setHitsoundVolume(defaultSettings.hsVolume);

        setOffset(defaultSettings.offset)

        bottomAnimation("#reset_tooltip_text")

        setDisabedSave(true)
        setTimeout(() => {
            setDisabedSave(false)
        }, 500)
    }

    const leftLaneStyle =  {
        backgroundColor: (actionKey === "LL")? "#91a89a" : "#1a1a1a",
        color: (actionKey === "LL")? "#1d1d1d" : "#eaeaea"
    }
    const rightLaneStyle =  {
        backgroundColor: (actionKey === "RL")? "#91a89a" : "#1a1a1a",
        color: (actionKey === "RL")? "#1d1d1d" : "#eaeaea"
    }
    const leftTurnStyle =  {
        backgroundColor: (actionKey === "LT")? "#91a89a" : "#1a1a1a",
        color: (actionKey === "LT")? "#1d1d1d" : "#eaeaea"
    }
    const rightTurnStyle =  {
        backgroundColor: (actionKey === "RT")? "#91a89a" : "#1a1a1a",
        color: (actionKey === "RT")? "#1d1d1d" : "#eaeaea"
    }
    const pauseBtnStyle = {
        backgroundColor: (actionKey === "Pause")? "#91a89a" : "#1a1a1a",
        color: (actionKey === "Pause")? "#1d1d1d" : "#eaeaea"
    }
    const restartBtnStyle = {
        backgroundColor: (actionKey === "Restart")? "#91a89a" : "#1a1a1a",
        color: (actionKey === "Restart")? "#1d1d1d" : "#eaeaea"
    }

    return (
        <div id="settings_container">
            <div className="settings_div">
                <h1>Button Mapping</h1>
                <div className="setting_tooltip_text">
                    Set Keybinds
                </div>

                <div className="horizontal_div">                    
                    <h2>Left Turn Button</h2>
                    <button id="leftTurnBtn" className="action_btn" style={leftTurnStyle} onClick={() => {
                        newActionKey("LT")
                    }}>{leftTurn}</button>
                </div>

                <div className="horizontal_div">                    
                    <h2>Right Turn Button</h2>
                    <button id="rightTurnBtn" className="action_btn" style={rightTurnStyle} onClick={() => {
                        newActionKey("RT")
                    }}>{rightTurn}
                    </button>
                </div>

                <div className="horizontal_div">
                    <h2>Left Lane Button</h2>
                    <button id="leftLaneBtn" className="action_btn" style={leftLaneStyle} onClick={() => {
                        newActionKey("LL")
                    }}>{leftAction}</button>
                </div>

                <div className="horizontal_div">                    
                    <h2>Right Lane Button</h2>
                    <button id="rightLaneBtn" className="action_btn" style={rightLaneStyle} onClick={() => {
                        newActionKey("RL")
                    }}>{rightAction}</button>
                </div>

                <div className="horizontal_div">                    
                    <h2>Pause Button</h2>
                    <button id="pauseBtn" className="action_btn" style={pauseBtnStyle} onClick={() => {
                        newActionKey("Pause")
                    }}>{pauseBtn}
                    </button>
                </div>

                <div className="horizontal_div">                    
                    <h2>Restart Button</h2>
                    <button id="restartBtn" className="action_btn" style={restartBtnStyle} onClick={() => {
                        newActionKey("Restart")
                    }}>{restartBtn}

                    <h2 id="mapping_error">Keybind Conflict</h2>

                    </button>
                </div>
            </div>

            <div className="settings_div">
                <h1>Scroll Speed</h1>
                <div className="setting_tooltip_text">
                    Adjust the speed between note appearance and click                
                </div>
                <div className="slider_div">
                    <h1 className="subtitle">{scrollSpeed} ms</h1>
                    <input 
                        className="slider"
                        type="range"
                        min={100}
                        max={2000}
                        value={scrollSpeed}
                        onChange={handleScrollSpdChange}
                        step={100}
                    ></input>
                </div>
            </div>

            <div className="settings_div">
                <h1>Gameplay Music Volume</h1>
                <div className="setting_tooltip_text">
                    Adjust Music Volume                
                </div>
                <div className="slider_div">
                    <h1 className="subtitle">{gameplayVolume}</h1>
                    <input 
                        className="slider"
                        type="range"
                        min={0}
                        max={1}
                        value={gameplayVolume}
                        onChange={handleGameplayVolumeChange}
                        step={0.1}
                    ></input>
                </div>
                
            </div>

            <div className="settings_div">
                <h1>Hitsound Volume</h1>
                <div className="setting_tooltip_text">
                    Adjust Hitsound Volume            
                </div>
                <div className="slider_div">
                    <h1>{hitsoundVolume}</h1>
                    <input 
                        className="slider"
                        type="range"
                        min={0}
                        max={1}
                        value={hitsoundVolume}
                        onChange={handleHitsoundVolumeChange}
                        step={0.1}
                    ></input>
                </div>

            </div>

            <div className="settings_div">
                <h1>Universal Offset</h1>
                <div className="setting_tooltip_text">
                    Positive Offset for music to start later / Negative Offest for music to start earlier (ms)
                </div>
                <div id="offset_div">
                    <div>
                        <button onClick={() => addOffset(-10)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" className="bi bi-chevron-double-left" viewBox="0 0 16 16">
                                <path d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
                                <path d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
                            </svg>
                        </button>

                        <button onClick={() => addOffset(-1)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" className="bi bi-chevron-left" viewBox="0 0 16 16">
                                <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
                            </svg>
                        </button>
                    </div>
                    
                    <input
                        min={-2000}
                        max={2000}
                        type="number"
                        inputMode="numeric"
                        value={offset?? ""}
                        onChange={handleOffsetChange}
                    >
                    </input>

                    <div>
                        <button onClick={() => addOffset(1)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" className="bi bi-chevron-right" viewBox="0 0 16 16">
                                <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
                            </svg>
                        </button>

                        <button onClick={() => addOffset(10)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" className="bi bi-chevron-double-right" viewBox="0 0 16 16">
                                <path d="M3.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L9.293 8 3.646 2.354a.5.5 0 0 1 0-.708"/>
                                <path d="M7.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L13.293 8 7.646 2.354a.5.5 0 0 1 0-.708"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div id="save_reset_btns">
                <button className="bottom_btns" disabled={disabledSave} onClick={() => uploadSettings()}>
                    Save Settings
                    <div id="save_tooltip_text" className="bottom_tooltip_text">
                        Settings Saved
                    </div>
                </button>

                <button className="bottom_btns" disabled={disabledSave} onClick={() => resetSettings()}>
                    Reset All Bindings
                    <div id="reset_tooltip_text" className="bottom_tooltip_text">
                        Bindings Reset
                    </div>
                </button>
            </div>

            <br/>
        </div>
    )
}