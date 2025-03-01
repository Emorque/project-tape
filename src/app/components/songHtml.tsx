import { useCallback, useEffect, useState } from "react"
import "./songHtml.css"
import { createClient } from '@/utils/supabase/client'
import { songType, mapMetadata } from "@/utils/helperTypes"

export const SongHtml = () => {   
    const supabase = createClient()

    const [tab, setTab] = useState<string>("songs")
    const [songlist, setSongList] = useState<songType[]>([])
    const [selectedSong, setSelectedSong] = useState<mapMetadata>({
        bpm: 0,
        genre: "",
        source: "",
        language: "",
        note_count: 0,
        song_length: 0,
        description: ""
    })

    const loadSongs = useCallback(async () => {
        try {
        const { data: songs, error } = await supabase
        .from('songs')
        .select('song_id,song_metadata')
    
          if (error) {
            console.log(error)
            throw error
          }
    
          if (songs) {
            setSongList(songs)
            console.log(songs);
          }
        } catch (error) {
          console.error('User error:', error) // Only used for eslint
          alert('Error loading user data!')
        } finally {
          console.log('loaded songs')
        }
    }, [])

    useEffect(() => {
        loadSongs()
    }, [supabase])

    const updateSong = useCallback(async (song_id : string) => {
        try {
        const { data: song, error } = await supabase
        .from('songs')
        .select('map_metadata')
        .eq('song_id', song_id)
    
          if (error) {
            console.log(error)
            throw error
          }
    
          if (song) {
            setSelectedSong(song[0].map_metadata)
          }
        } catch (error) {
          console.error('User error:', error) // Only used for eslint
          alert('Error loading user data!')
        } finally {
          console.log('loaded songs')
        }
    }, [])

    const playSong = () => {
        console.log(selectedSong)
    }
    
    const leaderboardList = [100,200,300,400,500,600,700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600]

    const toggleTab = () => {
        if (tab === "songs") setTab("leaderboard")
        else setTab("songs")
    }

    return (
        <div id="songHtml">
            <div id="account">
            </div>
            <div id="content_container">
                <div id="tape_info">
                    <div id="tape">
                    </div>
                    
                    <button id="play_btn" onClick={playSong}>
                        Play
                    </button>

                    <div id="data">
                        <p>{selectedSong.song_length}</p>
                        <p>{selectedSong.bpm}</p>
                        <p>{selectedSong.note_count}</p>
                    </div>
                    <div id="description_container">
                        <div>
                            <p>Source</p>
                            <p>{selectedSong.source}</p>
                        </div>
                        <div id="genre_language">
                            <div>
                                <p>Genre</p>
                                <p>{selectedSong.genre}</p>
                            </div>
                            <div>
                                <p>Language</p>
                                <p>{selectedSong.language}</p>
                            </div>
                        </div>
                        <p>
                            {selectedSong.description}
                        </p>
                    </div>
                    <button id="leaderboard_btn" onClick={toggleTab}>
                        Leaderboard
                    </button>
                </div>
                <div id="songList_leaderboard">
                    <div id="song_list_container">
                        {(tab === "songs")
                        ?
                        <div className={"container"}>
                            <div id="bookmark_nav">
                            </div>
                            <div id="song_list">
                                {songlist.map((song, index) => {
                                    return (
                                        <div className="song_card" key={index}>
                                            <button onClick={() => {updateSong(song.song_id)}}>
                                                <div className="song_metadata">
                                                    <p>{song.song_metadata.song_name}</p>
                                                    <p>{song.song_metadata.song_artist}</p>
                                                    <p>{song.song_metadata.song_mapper}</p>
                                                </div>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        :
                        <div className={"container"}>
                            <div id="leaderboard_nav">
                            </div>
                            <div id="leaderboard">
                                {leaderboardList.map((num, index) => {
                                    return (
                                        <button className="leaderboard_card" key={index}>{index}: {num} </button>
                                    )
                                })}
                            </div>
                        </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}