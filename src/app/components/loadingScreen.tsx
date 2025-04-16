import { useProgress } from "@react-three/drei"
import "./loadingScreen.css"
import { useState } from "react"

interface loadingScreenInterface {
    loading : boolean, 
    setGameReady: () => void
}

export const LoadingScreen = ({loading, setGameReady} : loadingScreenInterface) => {
    const { progress } = useProgress()
    const [loaderClosed, setLoaderClosed] = useState<boolean>(false)
    // May need to come back to revise logic to account for loading supabase

    const loadingScreenStyle = {
        display: loading? "block" : "none",
        opacity: loaderClosed? 0 : 1
    }
    return (
        <div id="loading_screen" style={loadingScreenStyle}>
            <div id="loading_container">
                <h1>Project Tape</h1>
                <div id="loading_cas">
                    <div id="loading_wrapper">
                        <div className="l_left loading_eye">
                        </div>
                        <div className="eye_lids left_lid top_lid"></div>
                        <div className="eye_lids left_lid bottom_lid"></div>

                        <div className="eye_lids right_lid top_lid"></div>
                        <div className="eye_lids right_lid bottom_lid"></div>
                        <div className="l_right loading_eye">
                            <span className="cas_teeth_loading"></span>
                            <span className="cas_teeth_loading"></span>
                            <span className="cas_teeth_loading"></span>
                        </div>
                    </div>
                </div>
                {(progress >= 100) &&
                    <div id="loading_btn">
                        <h2>Click Start to Begin</h2>
                        <button disabled={progress < 100} onClick={() => {setLoaderClosed(true); setGameReady()}}>Start</button>
                    </div>
                }
            </div>
            <div id="loading_bar" style={{width: `${progress}%`}}></div>
        </div>
    )
}