import { ChangeEvent, useCallback, useRef, useState } from "react"

import ReactPlayer from "react-player/youtube";
const MaxFileSize = 5.0 * 1024 * 1024; // 5.5MBs converting to Bytes which is what File type uses
import gsap from 'gsap';
import { useGSAP } from "@gsap/react";
import { editorMap } from "@/utils/helperTypes";

interface CreateBeatMapInterface  {
    createMapYT: (newMap : editorMap) => void,
    createMapMP3: (fileURL: string, file: File) => void;
    exitCreateMap : () => void
}

export const CreateBeatmap = ({createMapYT, createMapMP3, exitCreateMap} : CreateBeatMapInterface) => {

    // const [newMap, setNewMap] = useState<editorMap | null>(null)

    // ALl relevant data for a new map
    const [songName, setSongName] = useState<string>("")
    const [songArtist, setSongArtist] = useState<string>("")
    const [audioSource, setAudioSource] = useState<string>("YouTube")
    const [genre, setGenre] = useState<string>("")
    const [language, setLanguage] = useState<string>("")
    // const [noteCount, setNoteCount] = useState<number>(0)
    const [description, setDescription] = useState<string>("");
    const [source, setSource] = useState<string>("");
    const [difficulty, setDifficulty] = useState<number>(1)
    const [audioURL, setAudioURL] = useState<string>("");
    const [disableCreateButton, setDisabledCreateButton] = useState<boolean>(false)
    // const [disabledCreateButton, setDisabledCreateButton] = useState<boolean>(false) 

    // YT specific states
    const reactPlayerRef = useRef<ReactPlayer | null>(null)
    const [videoPlaying, setVideoPlaying] = useState<boolean>(false)
    const [ytOffset, setYTOffset] = useState<number>(0)
    const [ytEnd, setYTEnd] = useState<number>(0)
    const ytOffsetRef = useRef<HTMLInputElement>(null)
    const ytEndRef = useRef<HTMLInputElement>(null)
    const ytIDRef= useRef<HTMLInputElement>(null)
    const prevID = useRef<string>("")
    const [videoDuration, setVideoDuration] = useState<number>(0)
    const [ytBackground, setYTBackground] = useState<string>(""); //Fix to .ytbg

    // MP3 specific states
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioFileError, setAudioFileError] = useState<number>(0)

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
      reactPlayerRef.current?.seekTo((parseFloat(target.value) * (ytEnd - ytOffset)) + ytOffset)
    }

    
    const handleDuration = (duration : number) => {
    // Only call if a new YT video is provided
      if (ytIDRef.current && prevID.current !== ytIDRef.current.value && ytOffsetRef.current && ytEndRef.current) {
        prevID.current = ytIDRef.current.value
        ytOffsetRef.current.value = "0"
        ytEndRef.current.value = duration.toString()
        setYTOffset(0)
        setYTEnd(duration)
        setVideoDuration(duration)
        if (duration < 60) {
          setDisabledCreateButton(true)
        }
        else {
          setDisabledCreateButton(false)
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

    const [disableTimestamp, setDisableTimestamp] = useState<boolean>(false)

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
          setDisabledCreateButton(true)
        }
        else {
          setDisabledCreateButton(false)
          setDisableTimestamp(true)
          setTimeout(() => {
            setDisableTimestamp(false)
          }, 1000)
        }
      }
    }

    const audioChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MaxFileSize) {
            audioNeeded()
            setAudioFileError(1)
            return;
        }
        else {
            setAudioFileError(0)
            setAudioFile(file);
            setAudioURL(URL.createObjectURL(file)); 
        }   
    }, []);

    const { contextSafe } = useGSAP();

    const audioNeeded = contextSafe(() => {
        // gsap.to("#audio_input", {backgroundColor: "#df0000 ", yoyo: true, repeat: 1, duration:0.75})
        gsap.to("#audio_tooltip_text", {color: "#df0000", yoyo: true, repeat: 1, duration:0.75})
    })

    const submitMap = () => {
      if (audioSource === "YouTube") {
        createMapYT(
          {
              timestamp: new Date(Date.now()).toISOString(),
              song_metadata : 
              {
              song_name: songName,
              song_artist: songArtist,
              song_mapper: "",
              genre: genre,
              language: language,
              normal_notes: 0,
              ex_notes: 0,
              description: description,
              source: source,
              length: ytEnd - ytOffset,
              difficulty: [difficulty, 0],
              mp3: (audioSource === "YouTube")? false : true
              },
              background: [[ytBackground, ytOffset, ytEnd]],
              normal_notes: [],
              ex_notes: []
          }
        )
      }
      else {
        if (!audioFile) return;
        createMapMP3(
          audioURL, audioFile
        )
      }
    }

    return (
    <div id="prompt_div">
      <div id="prompt_content">
          <button onClick={exitCreateMap}>Go Back</button>
          <div className="metadata_inputs">
            <div className="metadata_div">
                <label htmlFor="songName">Title:</label>
                <input 
                className="metadata_input"
                name="songName" 
                id="songName"
                type="text" 
                value={songName}
                maxLength={50}
                onChange={(e) => setSongName(e.target.value)}
                ></input>
            </div>
            <div className="metadata_div">
              <label htmlFor="songArtist">Artist:</label>
              <input 
                className="metadata_input"
                name="songArtist" 
                id="songArtist"
                type="text" 
                value={songArtist}
                maxLength={20}
                onChange={(e) => setSongArtist(e.target.value)}
              ></input>
            </div>
            <div className="metadata_div">
              <label htmlFor="songSource">Source Link:</label>
              <input 
                className="metadata_input"
                name="songSource" 
                id="songSource"
                type="text" 
                value={source}
                maxLength={50}
                onChange={(e) => setSource(e.target.value)}
              ></input>
            </div>    
          </div>
          
          <div className="metadata_inputs">
            <div className="metadata_div">
              <label htmlFor="songGenre">Genre:</label>
              <input 
                className="metadata_input"
                name="songGenre" 
                id="songGenre"
                type="text" 
                value={genre}
                maxLength={20}
                onChange={(e) => setGenre(e.target.value)}
              ></input>
            </div>
            <div className="metadata_div">
              <label htmlFor="songLanguage">Language:</label>
              <input
                className="metadata_input" 
                name="songLanguage" 
                id="songLanguage"
                type="text" 
                value={language}
                maxLength={20}
                onChange={(e) => setLanguage(e.target.value)}
              ></input>
            </div>
            <div className="metadata_div">
              <label htmlFor="songDescription">Description:</label>
              <input 
                className="metadata_input"
                name="songDescription" 
                id="songDescription"
                type="text" 
                value={description}
                maxLength={100}
                onChange={(e) => setDescription(e.target.value)}
              ></input>
            </div>
            <div className="metadata_div">
              <label htmlFor="songDifficulty">Difficulty:</label>
              <select 
                className="metadata_input"
                name="songDifficulty" 
                id="songDifficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
              </select>
            </div> 
          </div>

        <br/>

        <div className="metadata_div">
          <label htmlFor="audio_source">Music Source</label>
          <select 
              className="metadata_input"
              name="audio_source" 
              id="audio_source"
              value={audioSource}
              onChange={(e) => {
                if (e.target.value === "YouTube") {
                  setAudioSource(e.target.value)
                  setAudioURL("")
                  setAudioFile(null)
                }
                else {
                  setAudioSource(e.target.value)
                  setYTBackground("")
                  setYTEnd(0)
                  setYTOffset(0)
                  setVideoDuration(0)
                  prevID.current = "" 
                }
              }}
            >
            <option value={"YouTube"}>YouTube</option>
            <option value={"MP3"}>MP3 (!Experimental!)</option>
          </select>
        </div>
        <br/>
        {audioSource === "YouTube" &&
        <>
          <div className="metadata_inputs">
            <div className="metadata_div">
              <label id="yt_id_label" htmlFor="ytBackground">Youtube ID:
              <div id="yt_id_info">A YouTube ID is 11 characters long, right after &apos;?v=&apos; on the URL</div>
              </label>
              <input 
                ref={ytIDRef}
                className="metadata_input"
                name="ytBackground" 
                id="ytBackground"
                type="text"
              ></input>
            </div>
            <button className="play_btn" onClick={() => {
              if (ytIDRef.current?.value === ytBackground) return; 
              setVideoDuration(0); 
              setYTBackground(ytIDRef.current?.value || "")
              }}>Set Youtube ID
            </button>
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
            {videoDuration !== 0 && <button className="timestamp_btn" disabled={disableTimestamp} onClick={() => setTimestamps()}>
              <div className="timestamp_info">60 Second Minimum Requried</div>
              {disableTimestamp? "Updated" : "Set Timestamps"}
              </button>}
          </div>
          
          {videoDuration !== 0 &&
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
          }
          <div id="react_player_div">
          <ReactPlayer
            ref={reactPlayerRef}
            // url={`https://www.youtube.com/watch?v=${ytBackground}?start=${ytOffset}?end=${ytEnd}&rel=0`} //&rel=0 means that "more videos" are locked to uploader's channel
            url={`https://www.youtube-nocookie.com/watch?v=${ytBackground}?start=${ytOffset}?end=${ytEnd}&rel=0&nocookie=true&autoplay=0&modestbranding=1&nocookie=true&fs=0&enablejsapi=1&widgetid=1&aoriginsup=1&vf=1`} //&rel=0 means that "more videos" are locked to uploader's channel
            loop={false}
            controls={false}
            volume={100}
            muted={false}
            height={"100%"}
            width={"100%"}
            playing={videoPlaying}
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
          </div>
          
        </>
        }
        {audioSource === "MP3" &&
          <div className="metadata_div">
          <label htmlFor="audio_input" id="audio_tooltip_text">{(audioFileError === 1)? "Audio File exceeds 5MB" : (audioFileError === 2)? "5 Beatmap Limit" : "Upload MP3" }</label>
          <input id="audio_input" type="file" accept='audio/*' onChange={audioChange}/>
          <br/>
          </div>
        }
        {((audioURL !== "" && audioSource === "MP3" && audioFileError === 0) || (ytBackground !== "" && audioSource === "YouTube" && (ytEnd - ytOffset >= 60))) &&
          <button disabled={disableCreateButton} onClick={submitMap}>
            Create
          </button>
        } 
      </div>          
    </div>
    )
}