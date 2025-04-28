import { ChangeEvent, useCallback, useEffect, useState } from "react"
import "./songHtml.css"
import { createClient } from '@/utils/supabase/client'
import { songType, mapMetadata, ranking, bookmarkedSongs, song_header, localStorageMaps, editorMetadata, ytBackgroundType } from "@/utils/helperTypes"
import Link from 'next/link'
import HomeAvatar from "./home_avatar"
import { type User } from '@supabase/supabase-js'

import gsap from 'gsap';
import { useGSAP } from "@gsap/react";

interface SongHtmlProps {
    songToPlay : (songID: number, song_background: ytBackgroundType | null, verified: boolean, songLength: number) => void,
    playLocalSong: (song_url: string, song_notes: string[][], song_background: ytBackgroundType | null, songLength: number) => void,
    user: User | null,
    role : string | null,
    avatar_url : string | null
}

const MaxFileSize = 5.0 * 1024 * 1024;

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60); // Get minutes by dividing by 60
    const remainingSeconds = seconds % 60; // Get remaining seconds

    // Format minutes and seconds to always have two digits
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}
const supabase = createClient()

export const SongHtml = ({songToPlay, playLocalSong, user, role, avatar_url} : SongHtmlProps) => {   
    const [tab, setTab] = useState<string>("songs")
    const [songlist, setSongList] = useState<songType[]>([])
    const [pendingSongList, setPendingSongList] = useState<songType[]>([])
    const [localMapsList, setLocalMapsList] = useState<localStorageMaps>({})
    const [songID, setSongID] = useState<number | null>(null)
    const [pendingID, setPendingID] = useState<number | null>(null)
    const [localID, setLocalID] = useState<number | null>(null)
    const [YTAudio, setYTAudio] = useState<boolean>(false)
    
    const [songBackground, setSongBackground] = useState<ytBackgroundType | null>(null)
    const [selectedSong, setSelectedSong] = useState<mapMetadata>({
        name: "",
        genre: "",
        source: "",
        language: "",
        normal_notes: 0,
        ex_notes: 0,
        length: 0,
        description: "",
        difficulty: [1,0],
    })

    const [songLoading, setSongLoading] = useState<boolean>(true);

    const [leaderboardList, setLeaderboardList] = useState<[number, ranking[]]>([0,[]])
    const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(true);
    
    const [currentMenu, setMenu] = useState<string>("Global");
    const [bookmarkedSongs, setBookmarkSongs] = useState<bookmarkedSongs>({});


    const loadSongs = useCallback(async () => {
        try {
        
        const { data: songs, error } = await supabase
        .from('verified_songs')
        .select('id,header')
    
          if (error) {
            console.log(error)
            throw error
          }
    
          if (songs) {
            setSongList(songs)
          }
        } catch (error) {
          console.error('Song error:', error) // Only used for eslint
          alert('Error Loading Songs!')
        } 
        // finally {
        //   console.log('Loaded Songs')
        // }
    }, [supabase])

    useEffect(() => {
        loadSongs()
    }, [supabase, loadSongs])

    const loadPendingSongs = useCallback(async () => {
        if (role !== "owner") return;
        try {
        const { data: songs, error } = await supabase
        .from('pending_songs')
        .select('id,header')
    
          if (error) {
            console.log(error)
            throw error
          }
    
          if (songs) {
            setPendingSongList(songs)
          }
        } catch (error) {
          console.error('Song error:', error) // Only used for eslint
          alert('Error Loading Songs!')
        } 
        finally {
        //   console.log('Loaded Pending Songs')
        }
    }, [role, supabase])

    useEffect(() => {
        loadPendingSongs()
    }, [role, supabase, loadPendingSongs])

    const updateSong = useCallback(async (song_id : number, verified: boolean) => {
        if (songID === song_id) return;
        else if (pendingID === song_id) return;
        try {
            setSongLoading(true)
            let song, error;
            if (verified) {
                ({ data: song, error } = await supabase
                .from('verified_songs')
                .select('metadata, background')
                .eq('id', song_id)
                .single())
            }
            else {
                ({ data: song, error } = await supabase
                .from('pending_songs')
                .select('metadata, background')
                .eq('id', song_id)
                .single())
            }

        
            if (error) {
                console.log(error)
                throw error
            }
        
            if (song) {
                setSelectedSong(song.metadata)
                if (verified){
                    setSongID(song_id)
                    setPendingID(null)
                }
                else {
                    setSongID(null)
                    setPendingID(song_id)
                }
                setLocalID(null)
                setUsingLocalMap(false);
                if (song.background) {
                    setSongBackground(song.background)
                }
                else {
                    setSongBackground(null)
                }
            }
        } catch (error) {
            console.error('Song error:', error) // Only used for eslint
            alert('Error Updating Song!')
        } finally {
            // console.log('Updated Songs')
            setSongLoading(false)
        }
    }, [supabase, songID, pendingID])

    const toggleTab = () => {
        if (tab === "songs") {
            setTab("leaderboard")
            if (songID && leaderboardList[0] !== songID) updateLeaderboard(songID)
        }
        else {
            setTab("songs")
        }
    }

    // TODO: make leaderboard have a loading component
    const updateLeaderboard = useCallback(async (song_id : number) => {
        try {
        setLeaderboardLoading(true)
        const { data: leaderboard, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('song_id', song_id)
        .order('score', {ascending: false})
        .limit(10)

        // console.log("leader", song_id)
          if (error) {
            console.log(error)
            throw error
          }
    
          if (leaderboard) {
            setLeaderboardList([song_id, leaderboard])
          }
        } catch (error) {
          console.error('Leaderboard error:', error) // Only used for eslint
        //   alert('Error loading Leaderboard!')
        } finally {
          console.log('Loaded Leaderboard')
          setLeaderboardLoading(false);
        }
    }, [supabase])

    useEffect(() => {
        const local_songs = JSON.parse(localStorage.getItem("bookmarked_songs") || "{}");
        setBookmarkSongs(local_songs)
    }, [])

    const activateBookmark = () =>{
        setMenu("Bookmark");
    }

    const activateGlobalList = () => {
        setMenu("Global");
    }

    const activateLocalMaps = () => {
        setMenu("Local")
    }

    const activePendingList = () => {
        setMenu("Pending")
    }

    const bookmarkSong = (song_id: number, song_header: song_header) => {
        const isBookmarked = bookmarkedSongs.hasOwnProperty(song_id);
      
        // Get the existing local_songs from localStorage
        const local_songs = JSON.parse(localStorage.getItem("bookmarked_songs") || "{}");
      
        if (isBookmarked) {
          delete local_songs[song_id];
          setBookmarkSongs((prevState) => {
            const updatedState = { ...prevState };
            delete updatedState[song_id]; // Remove from state and local
            return updatedState;
          });
        } else {
          local_songs[song_id] = { song_header };
      
          setBookmarkSongs((prevState) => ({
            ...prevState,
            [song_id]:  { song_header }, 
          }));
        }
        console.log(local_songs)
        localStorage.setItem("bookmarked_songs", JSON.stringify(local_songs));
    }

    const { contextSafe } = useGSAP();

    const audioNeeded = contextSafe(() => {
        gsap.to("#audio_input", {backgroundColor: "#df0000", color: "#1a1a1a", yoyo: true, repeat: 1, duration:0.75})
        gsap.to("#audio_tooltip_text", {color: "#df0000", yoyo: true, repeat: 1, duration:0.75})
      })

    // Local Songs 
    
    const [usingLocalMap, setUsingLocalMap] = useState<boolean>(false);
    const [audioFileError, setAudioFileError] = useState<boolean>(false)
    const [disabledLocalMap, setDisabledLocalMap] = useState<boolean>(false) 
    const [audioURL, setAudioURL] = useState<string>("");
    const [localNotes, setLocalNotes] = useState<string[][]>([]);

    const audioChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MaxFileSize) {
            audioNeeded()
            setAudioFileError(true)
            setDisabledLocalMap(true);
            return;
        }
        else {
            setDisabledLocalMap(false);
            setAudioFileError(false)
            setAudioURL(URL.createObjectURL(file)); 
        }   
    }, []);

    useEffect(() => {
        const localMaps = JSON.parse(localStorage.getItem("localMaps") || "{}");
        setLocalMapsList(localMaps)
        localStorage.setItem("localMaps", JSON.stringify(localMaps));
    }, [])

    const updateLocalSong = (song_metadata : editorMetadata) => {

        const extractedMapMetata: mapMetadata = {
            name: song_metadata.song_name || "Untitled Song",
            genre: song_metadata.genre || " ",
            source: song_metadata.source || " ",
            language: song_metadata.language || " ",
            normal_notes: song_metadata.normal_notes || 0,
            ex_notes: 0,
            length: song_metadata.length || 0, // TODO: add song_length as a key in editorMetadata and update editor save
            description: song_metadata.description || " ",
            difficulty: song_metadata.difficulty || [1,0]
        }
        setSelectedSong(extractedMapMetata)
        setUsingLocalMap(true);
        setSongID(0)
    }

    return (
        <div id="songHtml">
            <div id="songHTML_header">
                <div id="account_nav">
                    <HomeAvatar
                        url={avatar_url}
                        size={40}
                    />
                    <div id="user_info">
                        {(user && (typeof(avatar_url) === 'string'))?
                        <>
                        <h3>{user.user_metadata.username}</h3>
                        <Link href={"/account"}>Visit Account</Link>
                        <form action="/auth/signout" method="post">
                            <button className="button block" type="submit">
                                Sign Out
                            </button>
                        </form>   
                        </>
                        :
                        <>
                            <Link href="/login">Sign In/Up</Link>
                        </>
                        }
                    </div>
                </div>
                <div id="search_container">
                    {/* Search */}
                </div>
                <div id="bookmark_nav">
                    <button onClick={activateGlobalList}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#000" className="bi bi-globe" viewBox="0 0 16 16">
                            <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472M3.82 11a13.7 13.7 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5zm6.853 3.472A7 7 0 0 0 13.745 12H11.91a9.3 9.3 0 0 1-.64 1.539 7 7 0 0 1-.597.933M8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855q.26-.487.468-1.068zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.7 13.7 0 0 1-.312 2.5m2.802-3.5a7 7 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7 7 0 0 0-3.072-2.472c.218.284.418.598.597.933M10.855 4a8 8 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4z"/>
                        </svg>
                    </button>

                    <button onClick={activateBookmark}>
                        {(currentMenu === "Bookmark")? 
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="000" className="bi bi-bookmark-fill" viewBox="0 0 16 16">
                            <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"/>
                        </svg>
                        :
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#000" className="bi bi-bookmark" viewBox="0 0 16 16">
                            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
                        </svg>
                        }
                    </button>

                    <button onClick={activateLocalMaps}>
                        {(currentMenu === "Local")? 
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#000" className="bi bi-house-gear-fill" viewBox="0 0 16 16">
                            <path d="M7.293 1.5a1 1 0 0 1 1.414 0L11 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l2.354 2.353a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708z"/>
                            <path d="M11.07 9.047a1.5 1.5 0 0 0-1.742.26l-.02.021a1.5 1.5 0 0 0-.261 1.742 1.5 1.5 0 0 0 0 2.86 1.5 1.5 0 0 0-.12 1.07H3.5A1.5 1.5 0 0 1 2 13.5V9.293l6-6 4.724 4.724a1.5 1.5 0 0 0-1.654 1.03"/>
                            <path d="m13.158 9.608-.043-.148c-.181-.613-1.049-.613-1.23 0l-.043.148a.64.64 0 0 1-.921.382l-.136-.074c-.561-.306-1.175.308-.87.869l.075.136a.64.64 0 0 1-.382.92l-.148.045c-.613.18-.613 1.048 0 1.229l.148.043a.64.64 0 0 1 .382.921l-.074.136c-.306.561.308 1.175.869.87l.136-.075a.64.64 0 0 1 .92.382l.045.149c.18.612 1.048.612 1.229 0l.043-.15a.64.64 0 0 1 .921-.38l.136.074c.561.305 1.175-.309.87-.87l-.075-.136a.64.64 0 0 1 .382-.92l.149-.044c.612-.181.612-1.049 0-1.23l-.15-.043a.64.64 0 0 1-.38-.921l.074-.136c.305-.561-.309-1.175-.87-.87l-.136.075a.64.64 0 0 1-.92-.382ZM12.5 14a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
                        </svg>
                        :
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#000" className="bi bi-house-gear" viewBox="0 0 16 16">
                            <path d="M7.293 1.5a1 1 0 0 1 1.414 0L11 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l2.354 2.353a.5.5 0 0 1-.708.708L8 2.207l-5 5V13.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 2 13.5V8.207l-.646.647a.5.5 0 1 1-.708-.708z"/>
                            <path d="M11.886 9.46c.18-.613 1.048-.613 1.229 0l.043.148a.64.64 0 0 0 .921.382l.136-.074c.561-.306 1.175.308.87.869l-.075.136a.64.64 0 0 0 .382.92l.149.045c.612.18.612 1.048 0 1.229l-.15.043a.64.64 0 0 0-.38.921l.074.136c.305.561-.309 1.175-.87.87l-.136-.075a.64.64 0 0 0-.92.382l-.045.149c-.18.612-1.048.612-1.229 0l-.043-.15a.64.64 0 0 0-.921-.38l-.136.074c-.561.305-1.175-.309-.87-.87l.075-.136a.64.64 0 0 0-.382-.92l-.148-.044c-.613-.181-.613-1.049 0-1.23l.148-.043a.64.64 0 0 0 .382-.921l-.074-.136c-.306-.561.308-1.175.869-.87l.136.075a.64.64 0 0 0 .92-.382zM14 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0"/>
                        </svg>
                        }
                    </button>

                    {role === "owner" &&
                        <button onClick={activePendingList}>
                            {(currentMenu === "Pending")? 
                            <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="#000" className="bi bi-question-diamond-fill" viewBox="0 0 16 16">
                                <path d="M9.05.435c-.58-.58-1.52-.58-2.1 0L.436 6.95c-.58.58-.58 1.519 0 2.098l6.516 6.516c.58.58 1.519.58 2.098 0l6.516-6.516c.58-.58.58-1.519 0-2.098zM5.495 6.033a.237.237 0 0 1-.24-.247C5.35 4.091 6.737 3.5 8.005 3.5c1.396 0 2.672.73 2.672 2.24 0 1.08-.635 1.594-1.244 2.057-.737.559-1.01.768-1.01 1.486v.105a.25.25 0 0 1-.25.25h-.81a.25.25 0 0 1-.25-.246l-.004-.217c-.038-.927.495-1.498 1.168-1.987.59-.444.965-.736.965-1.371 0-.825-.628-1.168-1.314-1.168-.803 0-1.253.478-1.342 1.134-.018.137-.128.25-.266.25zm2.325 6.443c-.584 0-1.009-.394-1.009-.927 0-.552.425-.94 1.01-.94.609 0 1.028.388 1.028.94 0 .533-.42.927-1.029.927"/>
                            </svg>
                            :
                            <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="#000" className="bi bi-question-diamond" viewBox="0 0 16 16">
                                <path d="M6.95.435c.58-.58 1.52-.58 2.1 0l6.515 6.516c.58.58.58 1.519 0 2.098L9.05 15.565c-.58.58-1.519.58-2.098 0L.435 9.05a1.48 1.48 0 0 1 0-2.098zm1.4.7a.495.495 0 0 0-.7 0L1.134 7.65a.495.495 0 0 0 0 .7l6.516 6.516a.495.495 0 0 0 .7 0l6.516-6.516a.495.495 0 0 0 0-.7L8.35 1.134z"/>
                                <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/>
                            </svg>
                            }
                        </button>
                    }
                </div>
            </div>

            <div id="songHTML_content">
                <div id="song_collection">
                        <div className={"container"}>
                            {/* Global List */}
                            <div className={(currentMenu === "Global")? "song_list active_list" : "song_list"}>
                                {songlist.map((song : songType, index) => {
                                    return (
                                        <button key={index} className={(song.id === songID)? "song_btn active" : "song_btn"} onClick={() => {updateSong(song.id, true)}}>
                                            <div className="song_metadata">
                                                <div id="title_bookmark">
                                                    <h2>{song.header.song_name}</h2>
                                                    <div onClick={(e) => {
                                                        e.stopPropagation(); 
                                                        bookmarkSong(song.id, song.header)}}
                                                        >
                                                        {((song.id) in bookmarkedSongs) ? 
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="000" className="bi bi-bookmark-fill" viewBox="0 0 16 16">
                                                            <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"/>
                                                        </svg>
                                                        :
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#000" className="bi bi-bookmark" viewBox="0 0 16 16">
                                                            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
                                                        </svg>
                                                        }
                                                    </div>
                                                </div>
                                                <h3>by {song.header.song_artist}</h3>
                                                <h4>mapped by {song.header.song_mapper}</h4>
                                                <div className="song_spinner">
                                                    <span className={((song.header.difficulty?.[0] ?? 0) >= 5 )? "cas_teeth active_teeth" : ((song.header.difficulty?.[0] ?? 0) >= 2)? "cas_teeth half_active_teeth" : "unactive_teeth"}></span>
                                                    <span className={((song.header.difficulty?.[0] ?? 0) === 6 )? "cas_teeth active_teeth" : ((song.header.difficulty?.[0] ?? 0) >= 3)? "cas_teeth half_active_teeth" : "unactive_teeth"}></span>
                                                    <span className={((song.header.difficulty?.[0] ?? 0) >= 4 )?"cas_teeth active_teeth" : "cas_teeth half_active_teeth"}></span>
                                                </div>
                                            </div>
                                        </button>                                    
                                    )
                                })}
                            </div>

                            {/* Bookmarked Songs List */}
                            <div className={(currentMenu === "Bookmark")? "song_list active_list" : "song_list"}>
                                {Object.entries(bookmarkedSongs).map(([song_id, metadata]) => {
                                    return (
                                        <button key={song_id} className={(parseInt(song_id) === songID)? "song_btn active" : "song_btn"} onClick={() => {updateSong(parseInt(song_id), true)}}>
                                            <div className="song_metadata">
                                                <div id="title_bookmark">
                                                    <h2>{metadata.song_header.song_name}</h2>
                                                    <div onClick={(e) => {
                                                        e.stopPropagation(); 
                                                        bookmarkSong(parseInt(song_id), metadata.song_header)}}
                                                        >
                                                        {((song_id) in bookmarkedSongs) ? 
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="000" className="bi bi-bookmark-fill" viewBox="0 0 16 16">
                                                            <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"/>
                                                        </svg>
                                                        :
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#000" className="bi bi-bookmark" viewBox="0 0 16 16">
                                                            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
                                                        </svg>
                                                        }
                                                    </div>
                                                </div>
                                                <h3>by {metadata.song_header.song_artist}</h3>
                                                <h4>mapped by {metadata.song_header.song_mapper}</h4>
                                                <div className="song_spinner">
                                                    <span className={((metadata.song_header.difficulty?.[0] ?? 0) >= 5 )? "cas_teeth active_teeth" : ((metadata.song_header.difficulty?.[0] ?? 0) >= 2)? "cas_teeth half_active_teeth" : "unactive_teeth"}></span>
                                                    <span className={((metadata.song_header.difficulty?.[0] ?? 0) === 6 )? "cas_teeth active_teeth" : ((metadata.song_header.difficulty?.[0] ?? 0) >= 3)? "cas_teeth half_active_teeth" : "unactive_teeth"}></span>
                                                    <span className={((metadata.song_header.difficulty?.[0] ?? 0) >= 4 )?"cas_teeth active_teeth" : "cas_teeth half_active_teeth"}></span>
                                                </div>
                                            </div>
                                        </button>                                    
                                    )
                                })}
                            </div>

                            {/* Local Maps List */}
                            <div className={(currentMenu === "Local")? "local_songs_wrapper active_list" : "local_songs_wrapper"}>
                                <div id="audio_select">
                                    <h2 id="audio_tooltip_text">{(audioFileError)? "Audio File exceeds 5MB" : "Enter Your Audio File" }</h2>
                                    <input id="audio_input" type="file" accept='audio/*' onChange={audioChange}/>
                                </div>
                                <div id="localSongs_list">
                                    {Object.entries(localMapsList).map(([map_id, mapItem]) => {
                                        const editorMap = mapItem;
                                        const { song_metadata, normal_notes, background } = editorMap;
                                        const hasMp3 = !(song_metadata?.mp3 === false);
                                        return (
                                            <button key={map_id} className={(localID === parseInt(map_id))? "song_btn active" : "song_btn"} onClick={() => {
                                                    setLocalNotes(normal_notes);
                                                    updateLocalSong(song_metadata)
                                                    setSongLoading(false)
                                                    setLocalID(parseInt(map_id))
                                                    setSongID(null)
                                                    setYTAudio(!hasMp3);                                                    
                                                    if (background) {
                                                        setSongBackground(background)
                                                    }
                                                }}>
                                                <div className="song_metadata">
                                                    <h2>{song_metadata.song_name || 'Untitled Song'}</h2>
                                                    <h3>by {song_metadata.song_artist || "Untitled Artist"}</h3>
                                                    <div className="song_spinner">
                                                        <span className={((song_metadata.difficulty?.[0] ?? 0) >= 5 )? "cas_teeth active_teeth" : ((song_metadata.difficulty?.[0] ?? 0) >= 2)? "cas_teeth half_active_teeth" : "unactive_teeth"}></span>
                                                        <span className={((song_metadata.difficulty?.[0] ?? 0) === 6 )? "cas_teeth active_teeth" : ((song_metadata.difficulty?.[0] ?? 0) >= 3)? "cas_teeth half_active_teeth" : "unactive_teeth"}></span>
                                                        <span className={((song_metadata.difficulty?.[0] ?? 0) >= 4 )?"cas_teeth active_teeth" : "cas_teeth half_active_teeth"}></span>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Pending Song List */}
                            {(role === "owner") && 
                            <div className={(currentMenu === "Pending")? "song_list active_list" : "song_list"}>
                            {pendingSongList.map((song : songType, index) => {
                                return (
                                    <button key={index} className={(song.id === pendingID)? "song_btn active" : "song_btn"} onClick={() => {updateSong(song.id, false)}}>
                                        <div className="song_metadata">
                                            <div id="title_bookmark">
                                                <h3>{song.header.song_name}</h3>
                                                <div onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    bookmarkSong(song.id, song.header)}}
                                                    >
                                                    {((song.id) in bookmarkedSongs) ? 
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="000" className="bi bi-bookmark-fill" viewBox="0 0 16 16">
                                                        <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"/>
                                                    </svg>
                                                    :
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#000" className="bi bi-bookmark" viewBox="0 0 16 16">
                                                        <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
                                                    </svg>
                                                    }
                                                </div>
                                            </div>
                                            <h4>by {song.header.song_artist}</h4>
                                            <p>mapped by {song.header.song_mapper}</p>
                                        </div>
                                    </button>                                    
                                )
                            })}
                            </div>
                            }
                            
                        </div>
                    </div>

                <div id="song_info">
                {songLoading? 
                    <div className="song_loading">
                        <div className="cas_bar">
                            <div className="cas_circle">
                                <span className="cas_teeth"></span>
                                <span className="cas_teeth"></span>
                                <span className="cas_teeth"></span>
                            </div>
                            <div className="cas_circle">
                                <span className="cas_teeth"></span>
                                <span className="cas_teeth"></span>
                                <span className="cas_teeth"></span>
                            </div>
                        </div>
                    </div>             
                    :
                    <div id="info_wrapper">
                        <h1 id="song_title"> 
                            {songLoading? "" : selectedSong.name}
                        </h1>
                        <div id="song_btns">
                        {usingLocalMap? 
                                <button id="" onClick={() => {
                                    if (YTAudio) {
                                        playLocalSong(selectedSong.source, localNotes, songBackground, selectedSong.length)
                                    }
                                    else if (audioURL) {
                                        playLocalSong(audioURL, localNotes, songBackground, selectedSong.length)
                                    }
                                    else {
                                        audioNeeded()
                                    }
                                    }} disabled={disabledLocalMap}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-play-circle-fill" viewBox="0 0 16 16">
                                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M6.79 5.093A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814z"/>
                                    </svg>
                                </button>
                                :
                                <button id="" onClick={() => {if (songID) {
                                        songToPlay(songID, songBackground, true, selectedSong.length); 
                                    }
                                    else if (pendingID) {
                                        songToPlay(pendingID, songBackground, false, selectedSong.length); 
                                    }
                                    }}
                                    disabled={selectedSong.normal_notes === 0 || songLoading || (!songID && !pendingID)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-play-circle-fill" viewBox="0 0 16 16">
                                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M6.79 5.093A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814z"/>
                                    </svg>
                                </button>
                        }
                        {!usingLocalMap && 
                            <button id="" onClick={toggleTab} disabled={selectedSong.normal_notes === 0 || songLoading}>
                                {(tab === "songs")? 
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-bar-chart-fill" viewBox="0 0 16 16">
                                    <path d="M1 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm5-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm5-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z"/>
                                </svg>                                
                                : 
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-info-square" viewBox="0 0 16 16">
                                    <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
                                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                                </svg>
                                }
                            </button>
                        }

                    </div>
                    {(tab === "songs")
                    ?
                    <div id="description_container">
                        <div id="description_header">
                            <div className="description_spinner">
                                <span className={((selectedSong.difficulty?.[0] ?? 0) >= 5 )? "cas_teeth active_teeth" : ((selectedSong.difficulty?.[0] ?? 0) >= 2)? "cas_teeth half_active_teeth" : "unactive_teeth"}></span>
                                <span className={((selectedSong.difficulty?.[0] ?? 0) === 6 )? "cas_teeth active_teeth" : ((selectedSong.difficulty?.[0] ?? 0) >= 3)? "cas_teeth half_active_teeth" : "unactive_teeth"}></span>
                                <span className={((selectedSong.difficulty?.[0] ?? 0) >= 4 )?"cas_teeth active_teeth" : "cas_teeth half_active_teeth"}></span>    
                            </div>
                            <div id="data">
                                <div className="tooltip_wrapper">
                                    <div className="tooltip">
                                        <h3>{songLoading? "0:00" : formatTime(selectedSong.length)}</h3>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-clock" viewBox="0 0 16 16">
                                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
                                        </svg>
                                        <h3 className="tooltip_text">
                                            Song Length
                                        </h3>
                                    </div>
                                </div>

                                <div className="tooltip_wrapper">                        
                                    <div className="tooltip">
                                        <h3>{songLoading? "0" : selectedSong.normal_notes}</h3>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-cassette" viewBox="0 0 16 16">
                                            <path d="M4 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2m9-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 6a1 1 0 0 0 0 2h2a1 1 0 1 0 0-2z"/>
                                            <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2zM1 3.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-.691l-1.362-2.724A.5.5 0 0 0 12 10H4a.5.5 0 0 0-.447.276L2.19 13H1.5a.5.5 0 0 1-.5-.5zM11.691 11l1 2H3.309l1-2z"/>
                                        </svg>
                                        <h3 className="tooltip_text">
                                            Note Count
                                        </h3>
                                    </div>
                                </div>
                            </div>
                            <div className="description_spinner">
                                <span className={((selectedSong.difficulty?.[0] ?? 0) >= 5 )? "cas_teeth active_teeth" : ((selectedSong.difficulty?.[0] ?? 0) >= 2)? "cas_teeth half_active_teeth" : "unactive_teeth"}></span>
                                <span className={((selectedSong.difficulty?.[0] ?? 0) === 6 )? "cas_teeth active_teeth" : ((selectedSong.difficulty?.[0] ?? 0) >= 3)? "cas_teeth half_active_teeth" : "unactive_teeth"}></span>
                                <span className={((selectedSong.difficulty?.[0] ?? 0) >= 4 )?"cas_teeth active_teeth" : "cas_teeth half_active_teeth"}></span>    
                            </div>
                        </div>

                        

                        {selectedSong.source && 
                            <div id="source_links">
                                <a href={selectedSong.source} target="blank">Source</a>
                                {songBackground && songBackground[0][0] !== "" &&  
                                <a href={`https://www.youtube.com/watch?v=${songBackground[0]}`} target="blank">Background Source</a>
                                }
                            </div>
                            }
                            {selectedSong.genre && selectedSong.language && 
                            <div id="genre_language">
                                <div>
                                    <h1>Genre:</h1>
                                    <h2>{selectedSong.genre}</h2>
                                </div>
                                <div>
                                    <h1>Language:</h1>
                                    <h2>{selectedSong.language}</h2>
                                </div>
                            </div>
                            }
                            {selectedSong.description && 
                            <div>
                                <h1>Description:</h1>
                                <h2>
                                    {selectedSong.description}
                                </h2>
                            </div>                        
                            }
                    </div>
                    :
                        <div className={"container lb"}>
                            {leaderboardLoading?
                                 <div className="cas_loading">
                                    <div className="cas_bar">
                                        <div className="cas_circle">
                                        <span className="cas_teeth"></span>
                                        <span className="cas_teeth"></span>
                                        <span className="cas_teeth"></span>
                                        </div>
                                        <div className="cas_circle">
                                        <span className="cas_teeth"></span>
                                        <span className="cas_teeth"></span>
                                        <span className="cas_teeth"></span>
                                        </div>
                                    </div>
                                </div>
                                :
                                <table id="leaderboard">
                                <thead>
                                    <tr>
                                        <th scope="col">Rank</th>
                                        <th scope="col">Player</th>
                                        <th scope="col">Score</th>
                                        <th scope="col">Acc.</th>
                                        <th scope="col">Max Combo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {leaderboardList[1].map((player, index) => {
                                    return (
                                        <tr key={index}>
                                            <th scope="row">{index + 1}</th>
                                            <td>{player.username}</td>
                                            <td>{player.score}</td>
                                            <td>{player.accuracy}</td>
                                            <td>{player.max_combo}</td>
                                        </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            }
                        </div>
                        }
                </div>
                }
                </div>
            </div>
        </div>
    )
}