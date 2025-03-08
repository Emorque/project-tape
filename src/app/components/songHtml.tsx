import { useCallback, useEffect, useState } from "react"
import "./songHtml.css"
import { createClient } from '@/utils/supabase/client'
import { songType, mapMetadata, ranking } from "@/utils/helperTypes"

interface SongHtmlProps {
    songToPlay : (songID: string) => void
}

export const SongHtml = ({songToPlay} : SongHtmlProps) => {   
    const supabase = createClient()

    const [tab, setTab] = useState<string>("songs")
    const [songlist, setSongList] = useState<songType[]>([])
    const [songID, setSongID] = useState<string>("")
    const [songIndex, setSongIndex] = useState<number>(-1)
    const [selectedSong, setSelectedSong] = useState<mapMetadata>({
        bpm: 0,
        genre: "",
        source: "",
        language: "",
        note_count: 0,
        song_length: 0,
        description: ""
    })

    const [leaderboardList, setLeaderboardList] = useState<[string, ranking[]]>(["",[]])
    // const [bookmarkActive, setBookmarkActive] = useState<boolean>(false);
    // const [bookmarkSongs, setBookmarkSongs] = useState<[]>([])

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
          console.error('Song error:', error) // Only used for eslint
          alert('Error Loading Songs!')
        } finally {
          console.log('Loaded Songs')
        }
    }, [supabase])

    useEffect(() => {
        loadSongs()
    }, [supabase, loadSongs])

    const updateSong = useCallback(async (song_id : string, index: number) => {
        if (songID === song_id) return;
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
            setSongID(song_id)
            setSongIndex(index);
          }
        } catch (error) {
          console.error('Song error:', error) // Only used for eslint
          alert('Error Updating Song!')
        } finally {
          console.log('Updated Songs')
        }
    }, [supabase, songID])

    const playSong = () => {
        songToPlay(songID)
    }
    
    // const leaderboardList = [100,200,300,400,500,600,700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600]

    const toggleTab = () => {
        if (tab === "songs") {
            setTab("leaderboard")
            if (leaderboardList[0] !== songID) updateLeaderboard(songID)
        }
        else {
            setTab("songs")
        }
    }

    const updateLeaderboard = useCallback(async (song_id : string) => {
        try {
        const { data: leaderboard, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('song_id', song_id)
        .order('score', {ascending: false})
        // .limit(10)

        console.log("leader", song_id)
          if (error) {
            console.log(error)
            throw error
          }
    
          if (leaderboard) {
            console.log("id", song_id)
            console.log("leaderboard", leaderboard)
            setLeaderboardList([song_id, leaderboard])
          }
        } catch (error) {
          console.error('Leaderboard error:', error) // Only used for eslint
          alert('Error loading Leaderboard!')
        } finally {
          console.log('Loaded Leaderboard')
        }
    }, [supabase])

    const activateBookmark = () =>{
        // setBookmarkActive(true);
    }

    const deactiveBookmark = () => {
        // setBookmarkActive(false);
    }

    return (
        <div id="songHtml">
            <div id="account">
                <div>
                    
                </div>
            </div>
            <div id="content_container">
                <div id="tape_info">
                    <div id="tape">
                    </div>
                    
                    <button id="play_btn" onClick={playSong} disabled={selectedSong.note_count === 0}>
                        Load
                    </button>

                    <div id="data">
                        <div className="tooltip">
                            <p>{selectedSong.song_length}</p>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clock" viewBox="0 0 16 16">
                                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
                            </svg>
                            <div className="tooltip_text">
                                Song Length
                            </div>
                        </div>
                        
                        <div className="tooltip">
                            <p>{selectedSong.bpm}</p>
                            <svg fill="#000" height="16" width="16" viewBox="0 0 213.605 213.605"> <g id="SVGRepo_bgCarrier"></g><g id="SVGRepo_tracerCarrier"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M200.203,161.656L143.86,4.962C142.79,1.985,139.966,0,136.803,0h-60c-3.164,0-5.987,1.985-7.058,4.962L13.402,161.656 c-0.292,0.814-0.442,1.672-0.442,2.538v41.912c0,4.142,3.358,7.5,7.5,7.5h172.686c4.142,0,7.5-3.358,7.5-7.5v-41.912 C200.646,163.329,200.496,162.47,200.203,161.656z M82.076,15h49.453l50.949,141.694h-70.676v-4.861h7.5c2.761,0,5-2.239,5-5 s-2.239-5-5-5h-7.5v-7.36h7.5c2.761,0,5-2.239,5-5s-2.239-5-5-5h-7.5v-7.36h7.5c2.761,0,5-2.239,5-5s-2.239-5-5-5h-7.5v-7.361h7.5 c2.761,0,5-2.239,5-5s-2.239-5-5-5h-7.5V47.333c0-2.761-2.239-5-5-5s-5,2.239-5,5v42.418h-7.5c-2.761,0-5,2.239-5,5s2.239,5,5,5 h7.5v7.361h-7.5c-2.761,0-5,2.239-5,5s2.239,5,5,5h7.5v7.36h-7.5c-2.761,0-5,2.239-5,5s2.239,5,5,5h7.5v7.36h-7.5 c-2.761,0-5,2.239-5,5s2.239,5,5,5h7.5v4.861H31.127L82.076,15z M27.96,198.605v-26.912h157.686v26.912H27.96z"></path> </g> </g></svg>
                            <div className="tooltip_text">
                                Song BPM
                            </div>
                        </div>
                        
                        <div className="tooltip">
                            <p>{selectedSong.note_count}</p>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-cassette" viewBox="0 0 16 16">
                                <path d="M4 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2m9-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0M7 6a1 1 0 0 0 0 2h2a1 1 0 1 0 0-2z"/>
                                <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2zM1 3.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-.691l-1.362-2.724A.5.5 0 0 0 12 10H4a.5.5 0 0 0-.447.276L2.19 13H1.5a.5.5 0 0 1-.5-.5zM11.691 11l1 2H3.309l1-2z"/>
                            </svg>
                            <div className="tooltip_text">
                                Note Count
                            </div>
                        </div>
                    </div>
                    <div id="description_container">
                        {selectedSong.source && 
                        <div>
                            <a href={selectedSong.source} target="blank">Source</a>
                        </div>
                        }
                        {selectedSong.genre && selectedSong.language && 
                        <div id="genre_language">
                            <div>
                                <h2>Genre</h2>
                                <p>{selectedSong.genre}</p>
                            </div>
                            <div>
                                <h2>Language</h2>
                                <p>{selectedSong.language}</p>
                            </div>
                        </div>
                        }
                        {selectedSong.description && 
                        <div>
                            <h2>Description</h2>
                            <p>
                                {selectedSong.description}
                            </p>
                        </div>                        
                        }
                    </div>
                    <button id="leaderboard_btn" onClick={toggleTab} disabled={selectedSong.note_count === 0}>
                        {(tab === "songs")? "Leaderboard" : "Songs"}
                    </button>
                </div>
                <div id="songList_leaderboard">
                    <div id="song_list_container">
                        {(tab === "songs")
                        ?
                        <div className={"container"}>
                            <div id="bookmark_nav">
                                <button onClick={activateBookmark}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#000" className="bi bi-bookmark" viewBox="0 0 16 16">
                                        <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
                                    </svg>
                                </button>
                                <button onClick={deactiveBookmark}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#000" className="bi bi-globe" viewBox="0 0 16 16">
                                        <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472M3.82 11a13.7 13.7 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5zm6.853 3.472A7 7 0 0 0 13.745 12H11.91a9.3 9.3 0 0 1-.64 1.539 7 7 0 0 1-.597.933M8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855q.26-.487.468-1.068zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.7 13.7 0 0 1-.312 2.5m2.802-3.5a7 7 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7 7 0 0 0-3.072-2.472c.218.284.418.598.597.933M10.855 4a8 8 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4z"/>
                                    </svg>
                                </button>
                            </div>
                            <div id="song_list">
                                {songlist.map((song, index) => {
                                    return (
                                        <button key={index} className={(songIndex === index)? "song_btn active" : "song_btn"} onClick={() => {updateSong(song.song_id, index)}}>
                                            <div className="song_metadata">
                                                <h3>{song.song_metadata.song_name}</h3>
                                                <h4>by {song.song_metadata.song_artist}</h4>
                                                <p>mapped by {song.song_metadata.song_mapper}</p>
                                            </div>
                                        </button>                                    )
                                })}
                                {/* <div>
                                    hi
                                </div>
                                <div>
                                    hi
                                </div>                                <div>
                                    hi
                                </div>                                <div>
                                    hi
                                </div>                                <div>
                                    hi
                                </div>                                <div>
                                    hi
                                </div>                                <div>
                                    hi
                                </div>                                <div>
                                    hi
                                </div>                                <div>
                                    hi
                                </div>                                <div>
                                    hi
                                </div>                                <div>
                                    hi
                                </div>                                <div>
                                    hi
                                </div>                                <div>
                                    hi
                                </div>                                <div>
                                    hi
                                </div> */}
                            </div>
                        </div>
                        :
                        <div className={"container lb"}>
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
                                        // <button className="" key={index}>{index}: {player.player_id} - Score: {player.score} - Acc: {player.accuracy} - MC: {player.max_combo}</button>
                                    )
                                })}
                                    <tr>
                                        <th scope="row">{3}</th>
                                        <td>{233}</td>
                                        <td>{5435435}</td>
                                        <td>{43.12}</td>
                                        <td>{7945}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">{4}</th>
                                        <td>{233}</td>
                                        <td>{5435435}</td>
                                        <td>{43.12}</td>
                                        <td>{7945}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">{5}</th>
                                        <td>{233}</td>
                                        <td>{5435435}</td>
                                        <td>{43.12}</td>
                                        <td>{7945}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">{6}</th>
                                        <td>{233}</td>
                                        <td>{5435435}</td>
                                        <td>{43.12}</td>
                                        <td>{7945}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">{7}</th>
                                        <td>{233}</td>
                                        <td>{5435435}</td>
                                        <td>{43.12}</td>
                                        <td>{7945}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">{8}</th>
                                        <td>{233}</td>
                                        <td>{5435435}</td>
                                        <td>{43.12}</td>
                                        <td>{7945}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">{9}</th>
                                        <td>{233}</td>
                                        <td>{5435435}</td>
                                        <td>{43.12}</td>
                                        <td>{7945}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">{10}</th>
                                        <td>{233}</td>
                                        <td>{5435435}</td>
                                        <td>{43.12}</td>
                                        <td>{7945}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}