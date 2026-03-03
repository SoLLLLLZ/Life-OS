import { useEffect, useRef } from 'react'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import AlpineBackground from './components/AlpineBackground'

export default function App() {
  const { user, loading } = useAuth()
  const { accentColor, bpm } = useTheme()
  const bgRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pulseRef = useRef(false)

  useEffect(() => {
    if (animRef.current) clearInterval(animRef.current)
    const interval = (60 / bpm) * 1000
    animRef.current = setInterval(() => {
      if (!bgRef.current) return
      pulseRef.current = !pulseRef.current
      bgRef.current.style.opacity = pulseRef.current ? '0.4' : '0.85'
    }, interval / 2)
    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [bpm])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#050810',
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ fontFamily:"'Cinzel',serif", color:'rgba(180,210,230,0.5)',
        letterSpacing:'0.4em', fontSize:'14px' }}>LOADING...</span>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', position:'relative' }}>
      <AlpineBackground />
      <div ref={bgRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background:`radial-gradient(ellipse at 50% 100%,${accentColor}18 0%,transparent 60%)`,
        transition:'opacity 0.3s ease' }}/>
      <div style={{ position:'relative', zIndex:10 }}>
        {user ? <Dashboard /> : <Login />}
      </div>
    </div>
  )
}