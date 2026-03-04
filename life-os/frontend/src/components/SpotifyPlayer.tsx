import { useState, useEffect, useRef } from 'react'
import api from '../api'
import { useTheme } from '../context/ThemeContext'
import type { SpotifyPlayback } from '../types'

interface Props { theme?: 'sunset' | 'tokyo' }

export default function SpotifyPlayer({ theme = 'tokyo' }: Props) {
  const { setAccentColor, setBpm } = useTheme()
  const [playback, setPlayback] = useState<SpotifyPlayback | null>(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rotation, setRotation] = useState(0)
  const rotRef = useRef(0)
  const animRef = useRef<number | null>(null)
  const lastRef = useRef<number | null>(null)
  const playingRef = useRef(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const n = theme === 'tokyo'

  const T = {
    cardBg:     n ? 'rgba(10,18,32,0.94)'       : 'rgba(255,255,255,0.90)',
    cardBorder: n ? 'rgba(180,210,230,0.12)'     : 'rgba(30,80,140,0.14)',
    text:       n ? '#e8eef5'                    : '#0f2040',
    textSub:    n ? 'rgba(180,210,230,0.65)'     : 'rgba(20,50,100,0.65)',
    textFaint:  n ? 'rgba(180,210,230,0.38)'     : 'rgba(20,50,100,0.55)',
    label:      n ? 'rgba(192,57,43,0.55)'       : 'rgba(140,20,10,0.75)',
    artist:     n ? 'rgba(212,160,23,0.7)'       : 'rgba(80,45,0,0.82)',
    progBg:     n ? 'rgba(180,210,230,0.09)'     : 'rgba(30,80,140,0.1)',
    btnBorder:  n ? 'rgba(180,210,230,0.15)'     : 'rgba(30,80,140,0.16)',
    btnColor:   n ? 'rgba(180,210,230,0.6)'      : 'rgba(20,50,100,0.75)',
    playBg:     n ? 'linear-gradient(135deg,rgba(192,57,43,0.38),rgba(212,160,23,0.22))' : 'linear-gradient(135deg,rgba(192,57,43,0.22),rgba(212,160,23,0.14))',
    playBorder: n ? 'rgba(192,57,43,0.42)'       : 'rgba(192,57,43,0.35)',
    playColor:  n ? '#e8eef5'                    : '#1a2535',
    connectFg:  n ? '#e8a090'                    : '#7f1d1d',
  }

  const fetchPlayback = async () => {
    try {
      const res = await api.get('/auth/spotify/current')
      setPlayback(res.data); playingRef.current = res.data.is_playing; setConnected(true)
    } catch { setConnected(false); setPlayback(null); playingRef.current = false }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchPlayback()
    pollRef.current = setInterval(fetchPlayback, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  useEffect(() => {
    const animate = (t: number) => {
      if (lastRef.current !== null && playingRef.current) {
        rotRef.current = (rotRef.current + (t - lastRef.current) * 0.05) % 360
        setRotation(rotRef.current)
      }
      lastRef.current = t
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [])

  useEffect(() => {
    if (!playback?.track?.album_art) return
    const img = new Image(); img.crossOrigin = 'anonymous'; img.src = playback.track.album_art
    img.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
        const ctx = c.getContext('2d'); if (!ctx) return
        ctx.drawImage(img,0,0)
        const d = ctx.getImageData(0,0,c.width,c.height).data
        let r=0,g=0,b=0,count=0
        for (let i=0;i<d.length;i+=20){r+=d[i];g+=d[i+1];b+=d[i+2];count++}
        setAccentColor(`rgb(${Math.floor(r/count)},${Math.floor(g/count)},${Math.floor(b/count)})`)
        setBpm(120)
      } catch(e){console.error(e)}
    }
  }, [playback?.track?.id])

  const handlePlay  = async () => { await api.post('/auth/spotify/play');     playingRef.current=true;  setTimeout(fetchPlayback,500)  }
  const handlePause = async () => { await api.post('/auth/spotify/pause');    playingRef.current=false; setTimeout(fetchPlayback,500)  }
  const handleNext  = async () => { await api.post('/auth/spotify/next');     setTimeout(fetchPlayback,1000) }
  const handlePrev  = async () => { await api.post('/auth/spotify/previous'); setTimeout(fetchPlayback,1000) }
  const fmt = (ms:number) => { const s=Math.floor(ms/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}` }

  const cardStyle: React.CSSProperties = {
    background: T.cardBg, border:`1px solid ${T.cardBorder}`,
    borderRadius:'10px', overflow:'hidden', position:'relative',
    backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
  }
  const topLine: React.CSSProperties = {
    position:'absolute', top:0, left:0, right:0, height:'1px',
    background:'linear-gradient(90deg,transparent,rgba(192,57,43,0.55),rgba(212,160,23,0.7),rgba(192,57,43,0.55),transparent)',
  }

  if (loading) return (
    <div style={{...cardStyle,padding:'20px',textAlign:'center'}}>
      <div style={topLine}/>
      <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'10px',color:T.textFaint,letterSpacing:'0.2em'}}>
        LOADING SPOTIFY...
      </span>
    </div>
  )

  if (!connected) return (
    <div style={{...cardStyle,padding:'24px',textAlign:'center'}}>
      <div style={topLine}/>
      <div style={{fontFamily:"'Crimson Pro',serif",fontStyle:'italic',fontSize:'14px',color:T.textSub,marginBottom:'14px'}}>
        Spotify not connected
      </div>
      <button onClick={()=>{const t=localStorage.getItem('token');window.location.href=`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/auth/spotify/login?token=${t}`}}
        style={{padding:'8px 20px',
          background:n?'linear-gradient(135deg,rgba(192,57,43,0.28),rgba(212,160,23,0.18))':'linear-gradient(135deg,rgba(192,57,43,0.16),rgba(212,160,23,0.1))',
          border:`1px solid ${T.playBorder}`,color:T.connectFg,borderRadius:'4px',cursor:'pointer',
          fontFamily:"'Rajdhani',sans-serif",fontSize:'12px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase' as const}}>
        Connect Spotify
      </button>
    </div>
  )

  if (!playback?.track) return (
    <div style={{...cardStyle,padding:'20px',textAlign:'center'}}>
      <div style={topLine}/>
      <div style={{fontFamily:"'Crimson Pro',serif",fontStyle:'italic',fontSize:'14px',color:T.textSub,marginBottom:'10px'}}>
        Nothing playing
      </div>
      <button onClick={handlePlay} style={{padding:'6px 16px',
        background:n?'rgba(192,57,43,0.15)':'rgba(192,57,43,0.1)',
        border:`1px solid ${T.playBorder}`,color:T.connectFg,borderRadius:'3px',cursor:'pointer',
        fontFamily:"'Rajdhani',sans-serif",fontSize:'11px',fontWeight:700,letterSpacing:'0.1em'}}>
        ▶ Resume
      </button>
    </div>
  )

  const { track, is_playing } = playback
  const progress = track.duration_ms > 0 ? (track.progress_ms / track.duration_ms) * 100 : 0

  return (
    <div style={cardStyle}>
      <div style={topLine}/>
      {track.album_art && (
        <div style={{ position:'absolute',inset:0,backgroundImage:`url(${track.album_art})`,
          backgroundSize:'cover',backgroundPosition:'center',filter:'blur(40px)',
          opacity:n?0.08:0.05 }}/>
      )}
      <div style={{ position:'relative',zIndex:1,padding:'16px',display:'flex',alignItems:'center',gap:'14px' }}>

        {/* Vinyl */}
        <div style={{ width:'80px',height:'80px',borderRadius:'50%',flexShrink:0,position:'relative',
          background:`radial-gradient(circle at 50% 50%,
            transparent 0%,transparent 18%,
            #100820 18.5%,#080510 22%,#100820 24%,#080510 29%,
            #100820 30%,#080510 37%,#100820 38%,#080510 46%,
            #100820 47%,#050308 100%)`,
          border:`1px solid ${n?'rgba(192,57,43,0.28)':'rgba(192,57,43,0.22)'}`,
          boxShadow:`0 0 14px rgba(192,57,43,0.14),0 4px 16px rgba(0,0,0,0.45)`,
          transform:`rotate(${rotation}deg)` }}>
          {track.album_art
            ? <img src={track.album_art} crossOrigin="anonymous" alt={track.album}
                style={{ position:'absolute',width:'28px',height:'28px',borderRadius:'50%',objectFit:'cover',
                  top:'50%',left:'50%',transform:'translate(-50%,-50%)',border:'1px solid rgba(212,160,23,0.35)' }}/>
            : <div style={{ position:'absolute',width:'28px',height:'28px',borderRadius:'50%',
                top:'50%',left:'50%',transform:'translate(-50%,-50%)',
                background:'linear-gradient(135deg,#8b0000,#d4a017)' }}/>}
          <div style={{ position:'absolute',width:'6px',height:'6px',borderRadius:'50%',
            top:'50%',left:'50%',transform:'translate(-50%,-50%)',
            background:'rgba(192,57,43,0.7)',boxShadow:'0 0 4px rgba(192,57,43,0.9)',zIndex:2 }}/>
        </div>

        {/* Info */}
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:'7px',
            color:T.label,letterSpacing:'0.3em',textTransform:'uppercase' as const,marginBottom:'3px' }}>
            ∴ Now Playing ∴
          </div>
          <div style={{ fontFamily:"'Cinzel',serif",fontSize:'14px',fontWeight:700,
            color:T.text,letterSpacing:'0.04em',
            whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{track.name}</div>
          <div style={{ fontFamily:"'Crimson Pro',serif",fontSize:'12px',fontStyle:'italic',
            color:T.artist,marginTop:'1px' }}>{track.artist}</div>
          <div style={{ marginTop:'8px' }}>
            <div style={{ height:'2px',background:T.progBg,overflow:'hidden' }}>
              <div style={{ height:'100%',width:`${progress}%`,
                background:'linear-gradient(90deg,#c0392b,#f5c842)',
                boxShadow:'0 0 6px rgba(192,57,43,0.45)',transition:'width 1s linear' }}/>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',
              fontFamily:"'Share Tech Mono',monospace",fontSize:'8px',
              color:T.textFaint,marginTop:'3px' }}>
              <span>{fmt(track.progress_ms)}</span><span>{fmt(track.duration_ms)}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display:'flex',alignItems:'center',gap:'8px',flexShrink:0 }}>
          {[
            { fn: handlePrev, icon:'⏮', big:false },
            { fn: is_playing ? handlePause : handlePlay, icon: is_playing ? '⏸' : '▶', big:true },
            { fn: handleNext, icon:'⏭', big:false },
          ].map(({ fn, icon, big }) => (
            <button key={icon} onClick={fn} style={{
              width:big?'40px':'30px', height:big?'40px':'30px', borderRadius:'50%',
              border:`1px solid ${big?T.playBorder:T.btnBorder}`,
              background:big?T.playBg:'transparent',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:big?'15px':'12px',
              color:big?T.playColor:T.btnColor,
              cursor:'pointer',
              boxShadow:big?'0 0 14px rgba(192,57,43,0.22)':'none',
              transition:'all 0.15s',
            }}>{icon}</button>
          ))}
        </div>
      </div>
    </div>
  )
}