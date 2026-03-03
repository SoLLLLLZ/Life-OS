export interface Task {
  id: number
  user_id: number
  source: 'manual' | 'gcal' | 'gmail' | 'gradescope'
  source_id: string | null
  title: string
  description: string | null
  due_at: string | null
  end_at: string | null
  link_url: string | null
  status: 'pending' | 'done'
  priority: number
  created_at: string
  updated_at: string
}

export interface SpotifyTrack {
  id: string
  name: string
  artist: string
  album: string
  album_art: string | null
  duration_ms: number
  progress_ms: number
}

export interface SpotifyPlayback {
  is_playing: boolean
  track: SpotifyTrack | null
  device: string | null
  volume: number | null
}

export interface User {
  id: number
  email: string
  name: string | null
}

export type Theme = 'sunset' | 'tokyo'