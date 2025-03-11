export type songType = {
  song_id: string,
  song_metadata: songMetadata,
};

export type bookmarkedSongs = {
  [song_id: string] : {song_metadata : songMetadata } 
}

export type songMetadata = {
  song_name: string,
  song_artist: string,
  song_mapper: string
}

export type mapMetadata = {
  song_name: string,
  bpm: number,
  genre: string,
  source: string,
  language: string,
  note_count: number,
  song_length: number,
  description: string
}

export type sMap = [number,string][]
  
export type ranking = {
  user_id: string,
  username: string,
  score: number,
  accuracy: number,
  max_combo: number,
}

export type settingsType = {
    lLane: string,
    rLane: string,
    lTurn: string,
    rTurn: string,

    pause: string,
    restart: string,

    scrollSpd: number,

    gpVolume: number,
    hsVolume: number,

    offset: number
}