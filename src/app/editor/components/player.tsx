import { useEffect, useRef, useState } from "react"
import ReactPlayer from "react-player/youtube";

interface PlayerInterface {
    ytID: string,
    initialOffset: number,
    intialEnd: number,
    updateTimestamp: (newOffset: number, newEnd: number) => void,
    closeYTPrompt: () => void
}

export const Player = ({ytID, initialOffset, intialEnd, updateTimestamp, closeYTPrompt} : PlayerInterface) => {
    const [ytOffset, setYTOffset] = useState<number>(initialOffset)
    const [ytEnd, setYTEnd] = useState<number>(intialEnd)
    const ytOffsetRef = useRef<HTMLInputElement>(null)
    const ytEndRef = useRef<HTMLInputElement>(null)
    const [videoDuration, setVideoDuration] = useState<number>(0)
    const [videoPlaying, setVideoPlaying] = useState<boolean>(false)
    const reactPlayerRefEdit = useRef<ReactPlayer | null>(null)

    useEffect(() => {
    if (ytOffsetRef.current && ytEndRef.current){
        ytOffsetRef.current.value = (initialOffset || 0).toString()
        ytEndRef.current.value = (intialEnd || 0).toString()
    }
    }, [])

    const [disableUpdate, setDisableUpdate] = useState<boolean>(false)

    const setTimestamps = () => {
    if (ytEndRef.current && ytOffsetRef.current) {
        if (parseInt(ytEndRef.current.value) === ytEnd && parseInt(ytOffsetRef.current.value) === ytOffset) return;
        const start = Math.min(Math.floor(parseInt(ytOffsetRef.current.value.replace(/[^0-9]/g, '') || "0")), videoDuration)
        const end = Math.min(Math.floor(parseInt(ytEndRef.current.value.replace(/[^0-9]/g, '')) || videoDuration), videoDuration)
        setYTOffset(start)
        setYTEnd(end)
        ytOffsetRef.current.value = start.toString();
        ytEndRef.current.value = end.toString()
        if (end - start < 60) {
            setDisabledUpdateButton(true)
        }
        else {
            setDisabledUpdateButton(false)
            setDisableUpdate(true)
            setTimeout(() => {
                setDisableUpdate(false)
            }, 1000)
        }
    }

    }
    const handleProgress = (state: {playedSeconds : number, played: number}) => {
        if (state.playedSeconds >= ytEnd) {
            setVideoPlaying(false)
          }
          if (!timelineSeeking) {
            const percent = ((state.playedSeconds - ytOffset)/ (ytEnd - ytOffset))
            setTimeline(percent)
          } 
    }

    const [disableUpdateButton, setDisabledUpdateButton] = useState<boolean>(false)

    const handleDuration = (duration : number) => {
        if (videoDuration !== 0) return;
        setVideoDuration(duration)
        // Theoretically, duration should never be < 60, since given the flow, can only reach editor with duration >= 60 
        if (duration < 60) {
            setDisabledUpdateButton(true)
          }
        else {
        setDisabledUpdateButton(false)
        }
    }


    const [timeline, setTimeline] = useState<number>(0)
    const [timelineSeeking, setTimelineSeeking] = useState<boolean>(false)
    const handleSeekMouseDown = () => {
        setTimelineSeeking(true)
    }
    const handleSeekChange = (e : React.ChangeEvent<HTMLInputElement>) => {
        setTimeline(parseFloat(e.target.value))
    }
    const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
        setTimelineSeeking(false)
        const target = e.target as HTMLInputElement; // Cast EventTarget to HTMLInputElement
        reactPlayerRefEdit.current?.seekTo((parseFloat(target.value) * (ytEnd - ytOffset)) + ytOffset)
    }

    return (
        <div id="yt_div">
            <button onClick={closeYTPrompt}>Close</button>
            <div className="metadata_div" style={{visibility: (videoDuration !== 0)? "visible" : "hidden"}}>
              <label htmlFor="ytOffset">Start Time:</label>
              <input 
                ref={ytOffsetRef}
                className="metadata_input"
                name="ytOffset" 
                id="ytOffset"
                type="number" 
                min={0}
                max={videoDuration}
              ></input>
            </div>

            <div className="metadata_div" style={{visibility: (videoDuration !== 0)? "visible" : "hidden"}}>
              <label htmlFor="ytEnd">End Time:</label>
              <input 
                ref={ytEndRef}
                className="metadata_input"
                name="ytEnd" 
                id="ytEnd"
                type="number" 
                min={0}
                max={videoDuration}
              ></input>
            </div>
            <br/>
            <button disabled={disableUpdate} onClick={() => setTimestamps()}>
                {disableUpdate? "Updated" : "Set Timestamps"}
            </button>
            <br/>
            <div id="timeline_slider_wrapper">
              <br/>
              <input
              id="timeline_slider"
              type="range"
              min={0} max={0.99999} step={'any'}
              value={timeline}
              onMouseDown={handleSeekMouseDown}
              onChange={handleSeekChange}
              onMouseUp={handleSeekMouseUp}
              >
              </input>
            </div>
            <br/>
            <ReactPlayer
                ref={reactPlayerRefEdit}
                url={`https://www.youtube-nocookie.com/watch?v=${ytID}?start=${ytOffset}?end=${ytEnd}&rel=0&nocookie=true&autoplay=0&modestbranding=1&nocookie=true&fs=0&enablejsapi=1&widgetid=1&aoriginsup=1&vf=1`} //&rel=0 means that "more videos" are locked to uploader's channel
                loop={false}
                controls={false}
                volume={100}
                muted={false}
                height={"100%"}
                width={"100%"}
                playing={videoPlaying}
                progressInterval={30}
                pip={false}
                light={false}
                playsinline={true}
                playbackRate={1}
                onPlay={() => {if (!videoPlaying) setVideoPlaying(true)}}
                onPause={() => {if (videoPlaying) setVideoPlaying(false)}}
                onProgress={handleProgress}
                onDuration={handleDuration}
                onEnded={() => setVideoPlaying(false)}
                config={{
                    playerVars: {
                    iv_load_policy: 3,
                    disablekb: 1
                    }
                }}
            />
            {ytEnd - ytOffset > 60 && 
            <button disabled={disableUpdateButton} onClick={() => updateTimestamp(ytOffset, ytEnd)}>
                Confirm
            </button>
            }
            {(ytEnd - ytOffset < intialEnd - initialOffset) && 
            <h2>Warning: Shorter videos will cut off end notes</h2>
            }
        </div>
    )
}