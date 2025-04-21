export type songType = {
  id: number,
  header: song_header,
};

export type bookmarkedSongs = {
  [song_id: string] : {song_header : song_header } 
}

export type song_header = {
  song_name: string,
  song_artist: string,
  song_mapper: string
}

export type mapMetadata = {
  name: string,
  genre: string,
  source: string,
  language: string,
  normal_notes: number,
  ex_notes: number,
  length: number,
  description: string,
}

export type sMap = [number,string][]

export type localStorageMaps = {
  [map_id: string] : editorMap
}

export type localStorageEditorMaps = {
  [map_id: string] : oldEditorMap | editorMap
}

export type oldEditorMap = {
  timestamp: string,
  song_metadata : oldEditor,
  background: ytBackgroundType,
  normal_notes: string[][],
  ex_notes: string[][],
  song_notes: string[][]
}

// Conisder a "last edited key, to help with ordering and it may be a useful bit of info for users"
export type editorMap = {
  timestamp: string,
  song_metadata : editorMetadata,
  background: ytBackgroundType,
  normal_notes: string[][],
  ex_notes: string[][]
}

export type oldEditor = {
  bpm: number,
  description: string,
  genre: string, 
  language: string, 
  note_count: string, 
  song_artist: string, 
  song_mapper: string, 
  song_name: string, 
  normal_notes: number,
  ex_notes: number
  source: string, 
  ytEnd: number, 
  ytID: string, 
  ytStart: number
}

export type editorMetadata = {
  song_name: string,
  song_artist: string,
  song_mapper: string,
  // bpm: number,
  genre: string,
  language: string,
  normal_notes: number,
  ex_notes: number,
  description: string,
  source: string,
  length: number,

  // background : ytBackgroundType

  // ytID: string,
  // ytStart: number,
  // ytEnd: number
}

export type ytBackgroundType = [ytID: string, ytStart: number,ytEnd: number][]
  
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

    offset: number,

    backgroundDim: number
}

export type keybindsType = {
  sNote: string,
  tNote: string,
  decreaseSpd: string,
  increaseSpd: string,

  snap: string,
  toggleMusic: string
}