import { useProgress } from "@react-three/drei"
import "./loadingScreen.css"
import { useEffect, useState } from "react"

interface loadingScreenInterface {
    loading : boolean, 
    setGameReady: () => void
}

export const LoadingScreen = ({loading, setGameReady} : loadingScreenInterface) => {
    const { progress } = useProgress()
    const [loaderClosed, setLoaderClosed] = useState<boolean>(false)
    // May need to come back to revise logic to account for loading supabase

    const loadingScreenStyle = {
        display: loaderClosed? "none" : "flex",
        opacity: loading? 1 : 0
    }

    useEffect(() => {
        if (progress >= 100) {
            setGameReady()
            setTimeout(() => {
                setLoaderClosed(true)
            }, 700) 
            // 500ms is length of opacity transition + 200 from gameready() timeout
        }
    }, [progress])

    return (
        <div id="loading_screen" style={loadingScreenStyle}>
            <div id="loading_bar" style={{width: `${progress}%`}}></div>
        </div>
    )
}