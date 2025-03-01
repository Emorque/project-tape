export type songType = {
  song_id: string,
  song_metadata: songMetadata
};

type songMetadata = {
  song_name: string,
  song_artist: string,
  song_mapper: string
}

export type mapMetadata = {
  bpm: number,
  genre: string,
  source: string,
  language: string,
  note_count: number,
  song_length: number,
  description: string
}

export type sMap = [number,string][]
  