import { useEffect, useState } from "react"
import "./settings.css"

type settingsType = {
    lAction: string,
    rAction: string,
    lTurn: string,
    rTurn: string,

    scrollSpd: number,

    gpVolume: number,
    hsVolume: number,

    offset: number
}


export const Settings = () => {   
    const [leftAction, setLeftAction] = useState<string | null>(null)
    const [rightAction, setRightAction] = useState<string | null>(null)
    const [leftTurn, setLeftTurn] = useState<string | null>(null)
    const [rightTurn, setRightTurn] = useState<string | null>(null)

    // const [actionKey, setActionKey] = useState<string>("")

    // const [scrollSpeed, setScrollSpeed] = useState<number>(1500)

    // const [gameplayVolume, setGameplayVolume] = useState<number>(1);
    // const [hitsoundVolume, setHitsoundVolume] = useState<number>(1);

    // const [offset, setOffset] = useState<number>(0);

    // Button Assigment
    useEffect(() => {
        const handleKeyDown = (event: {key: string; repeat: boolean}) => {
            if (event.repeat) return;
            // if (actionKey === "") return;
            
            
            // else if (actionKey === "LA") {
            //     if (event.key === rightAction || event.key === leftTurn || event.key === rightTurn) return;
            //     setLeftAction(event.key)
            // }
            
            
            console.log(event.key)
        }


        document.addEventListener('keydown', handleKeyDown);

        // Cleanup the event listener on unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [leftAction, rightAction, leftTurn, rightTurn])  

        // }, [leftAction, rightAction, leftTurn, rightTurn, actionKey])  


    // Grabbing local
    useEffect(() => {
        const localSettings = localStorage.getItem("settings")
        let updateSettings : settingsType 
        if (!localSettings) {
            console.log("no local settings")
            updateSettings = {
                lAction: "A",
                rAction: "D",
                lTurn: "J",
                rTurn: "L",

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
        
        setLeftAction(updateSettings.lAction);
        setRightAction(updateSettings.rAction);
        setLeftTurn(updateSettings.lTurn);
        setRightTurn(updateSettings.rTurn);

        // setScrollSpeed(updateSettings.scrollSpd);

        // setGameplayVolume(updateSettings.gpVolume);
        // setHitsoundVolume(updateSettings.hsVolume);

        // setOffset(updateSettings.offset)

        localStorage.setItem("settings", JSON.stringify(updateSettings))

    }, [])

    return (
        <div id="settings_container">
            <button>Go Back</button>
            <div className="settings_div">
                <h2>Button Mapping</h2>
                <div>
                    <h3>Left Action Button</h3>
                    <button>{leftAction}</button>
                </div>

                <div>
                    <h3>Right Action Button</h3>
                    <button>{rightAction}</button>
                </div>

                <div>
                    <h3>Left Turn Button</h3>
                    <button>{leftTurn}</button>
                </div>

                <div>
                    <h3>Right Turn Button</h3>
                    <button>{rightTurn}</button>
                </div>
            </div>

            <div className="settings_div">
                <h2>Set Scroll Time</h2>
                <div>
                    <button>500ms</button>
                    <button>1000ms</button>
                    <button>1500ms</button>
                    <button>2000ms</button>
                </div>
            </div>

            <div className="settings_div">
                <h2>Gameplay Music Volume</h2>
            </div>

            <div className="settings_div">
                <h2>Hitsound Volume</h2>
            </div>

            <div className="settings_div">
                <h2>Universal Offset</h2>

            </div>
        </div>
    )
}