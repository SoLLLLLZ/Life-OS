import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import TaskList from '../components/TaskList'
import CalendarView from '../components/CalendarView'
import SpotifyPlayer from '../components/SpotifyPlayer'
import GreetingHero from '../components/GreetingHero'
import Settings from './Settings'
import api from '../api'
import type { Task, Theme } from '../types'

function FocusMode({ theme, accentColor, bpm }: { theme: Theme; accentColor: string; bpm: number }) {
  const isNight = theme === 'tokyo'
  const beatMs = 60000 / (bpm || 120)

  const bgBase = isNight
    ? 'radial-gradient(circle at 10% 0%, rgba(192,57,43,0.32), transparent 55%), radial-gradient(circle at 90% 100%, rgba(212,160,23,0.24), transparent 55%), radial-gradient(circle at 50% 80%, rgba(123,168,196,0.22), transparent 55%), #020510'
    : 'radial-gradient(circle at 0% 0%, rgba(192,57,43,0.18), transparent 55%), radial-gradient(circle at 100% 0%, rgba(212,160,23,0.22), transparent 55%), radial-gradient(circle at 50% 100%, rgba(123,168,196,0.18), transparent 55%), #f5f7ff'

  const textMain = isNight ? '#e8eef5' : '#0f2040'
  const textSoft = isNight ? 'rgba(180,210,230,0.65)' : 'rgba(20,50,100,0.7)'
  const ringColor = accentColor || (isNight ? '#c0392b' : '#7f1d1d')

  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [phase, setPhase] = useState<'focus' | 'break'>('focus')
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev > 1) return prev - 1
        // phase complete -> switch
        const nextPhase = phase === 'focus' ? 'break' : 'focus'
        setPhase(nextPhase)
        return nextPhase === 'focus' ? 25 * 60 : 5 * 60
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, phase])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  const ringStyle: React.CSSProperties = {
    width: 260,
    height: 260,
    borderRadius: '50%',
    border: `1px solid ${ringColor}`,
    boxShadow: `0 0 40px ${ringColor}55`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    background: isNight ? 'radial-gradient(circle at 50% 0%, #0b1020, #050814)' : 'radial-gradient(circle at 50% 0%, #ffffff, #eef3ff)',
    overflow: 'hidden',
  }

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 60px)', overflow: 'hidden', backgroundImage: bgBase }}>
      {/* Pulsing background orbs */}
      <div
        className="focus-orb"
        style={{
          top: '-10%',
          left: '-8%',
          width: 360,
          height: 360,
          background: `${accentColor}33`,
          animationDuration: `${beatMs * 2}ms`,
        }}
      />
      <div
        className="focus-orb focus-orb-slow"
        style={{
          bottom: '-18%',
          right: '-10%',
          width: 420,
          height: 420,
          background: `${accentColor || (isNight ? '#7ba8c4' : '#1e3a8a')}33`,
          animationDuration: `${beatMs * 3}ms`,
        }}
      />

      {/* Flying rails */}
      <div className="focus-rail" style={{ left: '10%', animationDuration: `${beatMs * 4}ms` }} />
      <div className="focus-rail" style={{ right: '12%', animationDuration: `${beatMs * 3.5}ms` }} />
      <div className="focus-rail focus-rail-soft" style={{ left: '50%', animationDuration: `${beatMs * 5}ms` }} />

      {/* Center Pomodoro */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ pointerEvents: 'auto', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: textSoft, marginBottom: 14 }}>
            {phase === 'focus' ? 'Focus Interval' : 'Rest Interval'}
          </div>
          <div style={ringStyle}>
            <div
              className="focus-ring"
              style={{
                borderColor: ringColor,
                animationDuration: `${beatMs}ms`,
              }}
            />
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 52, letterSpacing: '0.06em', color: textMain }}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 14, color: textSoft, marginTop: 6 }}>
                {phase === 'focus' ? 'Deep work — honor the quest.' : 'Retreat & breathe — the ink must dry.'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button
              onClick={() => setRunning(r => !r)}
              style={{
                padding: '7px 18px',
                borderRadius: 999,
                border: '1px solid rgba(192,57,43,0.5)',
                background: isNight ? 'rgba(192,57,43,0.28)' : 'rgba(192,57,43,0.12)',
                color: textMain,
                cursor: 'pointer',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {running ? 'Pause' : 'Begin Ritual'}
            </button>
            <button
              onClick={() => {
                setPhase('focus')
                setSecondsLeft(25 * 60)
                setRunning(false)
              }}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                border: '1px solid rgba(180,210,230,0.25)',
                background: isNight ? 'rgba(5,10,18,0.9)' : 'rgba(255,255,255,0.9)',
                color: textSoft,
                cursor: 'pointer',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Reset
            </button>
            <button
              onClick={() => {
                const nextPhase = phase === 'focus' ? 'break' : 'focus'
                setPhase(nextPhase)
                setSecondsLeft(nextPhase === 'focus' ? 25 * 60 : 5 * 60)
              }}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                border: '1px solid rgba(180,210,230,0.18)',
                background: 'transparent',
                color: textSoft,
                cursor: 'pointer',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Skip
            </button>
          </div>
        </div>
      </div>

      {/* Corner Spotify */}
      <div
        style={{
          position: 'fixed',
          right: 28,
          bottom: 28,
          width: 320,
          maxWidth: '90vw',
          zIndex: 40,
        }}
      >
        <SpotifyPlayer theme={theme} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { logout } = useAuth()
  const { theme, toggleTheme, accentColor, bpm } = useTheme()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [view, setView] = useState<'calendar'|'tasks'|'completed'>('calendar')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [showSettings, setShowSettings] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const n = theme === 'tokyo' // isNight

  // ── Theme tokens ──
  const T = {
    text:             n ? '#e8eef5'                    : '#0f2040',
    textMid:          n ? 'rgba(220,235,245,0.92)'     : 'rgba(15,32,64,0.88)',
    textSub:          n ? 'rgba(180,210,230,0.65)'     : 'rgba(20,50,100,0.75)',
    textFaint:        n ? 'rgba(180,210,230,0.4)'      : 'rgba(20,50,100,0.55)',
    cardBg:           n ? 'rgba(10,18,32,0.94)'        : 'rgba(255,255,255,0.90)',
    cardBorder:       n ? 'rgba(180,210,230,0.12)'     : 'rgba(30,80,140,0.14)',
    headerBg:         n ? 'rgba(3,5,10,0.96)'          : 'rgba(240,248,255,0.96)',
    headerBorder:     n ? 'rgba(180,210,230,0.08)'     : 'rgba(30,80,140,0.1)',
    accent:           n ? '#f0a090'                    : '#7f1d1d',
    accentBg:         n ? 'rgba(192,57,43,0.14)'       : 'rgba(192,57,43,0.08)',
    accentBorder:     n ? 'rgba(192,57,43,0.32)'       : 'rgba(192,57,43,0.28)',
    panelTitle:       n ? 'rgba(180,210,230,0.55)'     : 'rgba(20,50,100,0.75)',
    diamond:          n ? 'rgba(192,57,43,0.6)'        : 'rgba(150,30,20,0.65)',
    filterBg:         n ? 'rgba(180,210,230,0.04)'     : 'rgba(30,80,140,0.04)',
    filterBorder:     n ? 'rgba(180,210,230,0.1)'      : 'rgba(30,80,140,0.12)',
    activeFilterBg:   n ? 'rgba(192,57,43,0.12)'       : 'rgba(192,57,43,0.08)',
    activeFilterBr:   n ? 'rgba(192,57,43,0.32)'       : 'rgba(192,57,43,0.28)',
    activeFilterFg:   n ? '#f0a090'                    : '#7f1d1d',
    navActiveBg:      n ? 'rgba(192,57,43,0.12)'       : 'rgba(192,57,43,0.08)',
    navActiveBr:      n ? 'rgba(192,57,43,0.28)'       : 'rgba(192,57,43,0.26)',
    navActiveFg:      n ? '#f0a090'                    : '#7f1d1d',
    divider:          n ? 'rgba(180,210,230,0.08)'     : 'rgba(30,80,140,0.1)',
    taskBg:           n ? 'rgba(180,210,230,0.04)'     : 'rgba(30,80,140,0.04)',
    taskBorder:       n ? 'rgba(180,210,230,0.09)'     : 'rgba(30,80,140,0.1)',
    ghostBg:          n ? 'transparent'                : 'transparent',
    ghostBorder:      n ? 'rgba(180,210,230,0.14)'     : 'rgba(30,80,140,0.16)',
    ghostFg:          n ? 'rgba(180,210,230,0.55)'     : 'rgba(20,50,100,0.75)',
  }

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try { const r = await api.get('/tasks/'); setTasks(r.data) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleSyncAll = async () => {
    setSyncing(true)
    try { await api.post('/integrations/sync/all'); await fetchTasks() }
    catch(e) { console.error(e) }
    finally { setSyncing(false) }
  }

  const pending   = tasks.filter(t => t.status==='pending')
  const completed = tasks.filter(t => t.status==='done')
  const filtered  = sourceFilter==='all' ? pending : pending.filter(t => t.source===sourceFilter)
  const calendarTasks = sourceFilter==='all' ? tasks : tasks.filter(t => t.source===sourceFilter)

  const sectionHead = (label: string) => (
    <div style={{ fontFamily:"'Cinzel',serif", fontSize:'10px', fontWeight:600,
      letterSpacing:'0.3em', textTransform:'uppercase' as const,
      color:T.panelTitle, marginBottom:'14px',
      display:'flex', alignItems:'center', gap:'8px' }}>
      <span style={{ color:T.diamond, fontSize:'7px' }}>◆</span>
      {label}
      <span style={{ flex:1, height:'1px',
        background:`linear-gradient(90deg,${T.diamond.replace('0.6','0.25').replace('0.65','0.25')},transparent)` }}/>
    </div>
  )

  const card = (children: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`,
      borderRadius:'10px', padding:'20px',
      backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)', ...extra }}>
      {children}
    </div>
  )

  const ghostBtn = (label: string, onClick: ()=>void, disabled=false) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding:'6px 13px', fontFamily:"'Rajdhani',sans-serif",
      fontSize:'11px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' as const,
      background:T.ghostBg, border:`1px solid ${T.ghostBorder}`,
      color:T.ghostFg, borderRadius:'3px', cursor:'pointer', transition:'all 0.15s',
    }}>{label}</button>
  )

  const accentBtn = (label: string, onClick: ()=>void, disabled=false) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding:'6px 14px', fontFamily:"'Rajdhani',sans-serif",
      fontSize:'11px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' as const,
      background:T.accentBg, border:`1px solid ${T.accentBorder}`,
      color:T.accent, borderRadius:'3px', cursor:'pointer', transition:'all 0.15s',
    }}>{label}</button>
  )

  return (
    <div style={{ minHeight:'100vh', color:T.text }}>

      {/* ── HEADER ── */}
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 36px', height:'60px', background:T.headerBg,
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        borderBottom:`1px solid ${T.headerBorder}`,
        position:'sticky', top:0, zIndex:100 }}>
        <div style={{ position:'absolute',bottom:0,left:0,right:0,height:'1px',
          background:'linear-gradient(90deg,transparent,rgba(192,57,43,0.45),rgba(212,160,23,0.65),rgba(192,57,43,0.45),transparent)' }}/>

        {/* Logo */}
        <div>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:'18px', fontWeight:900,
            letterSpacing:'0.2em',
            background:'linear-gradient(90deg,#e8d5b0,#f5c842,#e8d5b0)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>LIFE OS</div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'7px',
            color:T.textFaint, letterSpacing:'0.3em', marginTop:'-2px' }}>
            ∴ CHRONICLE OF THOMAS ∴
          </div>
        </div>

        {/* Nav */}
        {!showSettings && (
          <div style={{ display:'flex', gap:'2px', padding:'3px',
            background:T.filterBg, border:`1px solid ${T.filterBorder}`, borderRadius:'5px' }}>
            {(['calendar','tasks','completed'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding:'5px 18px', fontFamily:"'Rajdhani',sans-serif",
                fontSize:'11px', fontWeight:700, letterSpacing:'0.12em',
                textTransform:'uppercase' as const, borderRadius:'3px',
                border:view===v?`1px solid ${T.navActiveBr}`:'1px solid transparent',
                background:view===v?T.navActiveBg:'transparent',
                color:view===v?T.navActiveFg:T.textSub,
                cursor:'pointer', transition:'all 0.2s',
              }}>
                {v==='calendar'?'⚔ Calendar':v==='tasks'?'☽ Tasks':`✦ Done (${completed.length})`}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          {!showSettings && (
            <>
              {accentBtn(syncing?'↻ Invoking...':'↻ Invoke Sync', handleSyncAll, syncing)}
              {ghostBtn(n?'☀ Day':'🌙 Night', toggleTheme)}
              {ghostBtn(focusMode ? '⧖ Exit Focus' : '◎ Focus', () => setFocusMode(f => !f))}
            </>
          )}
          {ghostBtn(showSettings?'← Return':'⚙ Forge', () => setShowSettings(p=>!p))}
          <div style={{ display:'flex', alignItems:'center', gap:'7px',
            padding:'4px 10px 4px 4px',
            background:T.filterBg, border:`1px solid ${T.filterBorder}`, borderRadius:'20px' }}>
            <div style={{ width:'26px',height:'26px',borderRadius:'50%',
              background:'linear-gradient(135deg,#c0392b,#d4a017)',
              border:'1px solid rgba(212,160,23,0.4)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontFamily:"'Cinzel',serif",fontSize:'10px',fontWeight:700,color:'white' }}>TZ</div>
            <span style={{ fontSize:'12px', fontWeight:600, color:T.textMid }}>Thomas</span>
          </div>
          <button onClick={logout} style={{ fontSize:'11px',color:T.textFaint,
            background:'none',border:'none',cursor:'pointer',letterSpacing:'0.05em',
            fontFamily:"'Rajdhani',sans-serif",fontWeight:600 }}>Exit</button>
        </div>
      </header>

      {showSettings ? <Settings /> : focusMode ? (
        <FocusMode theme={theme} accentColor={accentColor} bpm={bpm} />
      ) : (
        <>
          {/* ── GREETING HERO ── */}
          <GreetingHero tasks={tasks} theme={theme} />

          {/* ── FILTER BAR ── */}
          {view !== 'completed' && (
            <div style={{ display:'flex', gap:'6px', padding:'14px 36px 0', alignItems:'center' }}>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'8px',
                color:T.diamond, letterSpacing:'0.2em', marginRight:'4px' }}>// FILTER</span>
              {['all','gcal','gmail','gradescope','manual'].map(s => (
                <button key={s} onClick={() => setSourceFilter(s)} style={{
                  padding:'4px 12px', fontFamily:"'Rajdhani',sans-serif",
                  fontSize:'11px', fontWeight:700, letterSpacing:'0.08em',
                  textTransform:'uppercase' as const, borderRadius:'2px', cursor:'pointer',
                  border:sourceFilter===s?`1px solid ${T.activeFilterBr}`:`1px solid ${T.filterBorder}`,
                  background:sourceFilter===s?T.activeFilterBg:'transparent',
                  color:sourceFilter===s?T.activeFilterFg:T.textSub,
                  transition:'all 0.15s',
                }}>
                  {s==='all'?'All Realms':s==='gcal'?'🗓 Cal':s==='gmail'?'📧 Mail':s==='gradescope'?'📜 GS':'✏ Manual'}
                </button>
              ))}
            </div>
          )}

          {/* ── MAIN GRID ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 380px',
            gap:'14px', padding:'14px 36px 120px' }}>

            {/* LEFT */}
            <div>
              {view==='calendar' && card(
                <><div className={n?'':'cal-day-theme'}>{sectionHead('Schedule Matrix')}</div>
                  <div className={n?'':'cal-day-theme'}>
                    <CalendarView tasks={calendarTasks} onTaskUpdate={fetchTasks} theme={theme}/>
                  </div></>,
              )}
              {view==='tasks' && card(
                <>{sectionHead('Quest Log')}
                  <TaskList tasks={filtered} loading={loading} onTaskUpdate={fetchTasks} theme={theme}/></>,
              )}
              {view==='completed' && card(
                <>{sectionHead('Vanquished Quests')}
                  {completed.length===0 ? (
                    <p style={{ color:T.textFaint, textAlign:'center', padding:'40px 0',
                      fontFamily:"'Crimson Pro',serif", fontStyle:'italic', fontSize:'16px' }}>
                      No quests vanquished yet
                    </p>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                      {completed.map(task => (
                        <div key={task.id} style={{ display:'flex', alignItems:'center', gap:'10px',
                          padding:'9px 12px', background:T.taskBg,
                          border:`1px solid ${T.taskBorder}`, borderRadius:'4px' }}>
                          <div style={{ width:'16px',height:'16px',borderRadius:'3px',
                            background:'linear-gradient(135deg,#c0392b,#d4a017)',
                            display:'flex',alignItems:'center',justifyContent:'center',
                            fontSize:'9px',flexShrink:0,color:'white' }}>✓</div>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ fontFamily:"'Rajdhani',sans-serif",fontSize:'13px',fontWeight:600,
                              textDecoration:'line-through',color:T.textSub,
                              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{task.title}</div>
                            {task.due_at && (
                              <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:'9px',color:T.textFaint,marginTop:'2px' }}>
                                {new Date(task.due_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                              </div>
                            )}
                          </div>
                          <button onClick={async()=>{await api.patch(`/tasks/${task.id}`,{status:'pending'});fetchTasks()}}
                            style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:'8px',letterSpacing:'0.1em',
                              padding:'3px 8px',background:T.filterBg,border:`1px solid ${T.filterBorder}`,
                              color:T.textSub,borderRadius:'2px',cursor:'pointer' }}>UNDO</button>
                        </div>
                      ))}
                    </div>
                  )}</>,
              )}
            </div>

            {/* RIGHT */}
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              {view==='calendar' && (
                <div style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`,
                  borderRadius:'10px', overflow:'hidden', flex:1,
                  backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)' }}>
                  <div style={{ padding:'14px 16px 10px',
                    borderBottom:`1px solid ${T.divider}`,
                    display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontFamily:"'Cinzel',serif", fontSize:'10px', fontWeight:600,
                      letterSpacing:'0.25em', textTransform:'uppercase' as const, color:T.panelTitle,
                      display:'flex', alignItems:'center', gap:'6px' }}>
                      <span style={{ color:T.diamond, fontSize:'6px' }}>◆</span>Quest Log
                    </div>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:'9px', color:T.textFaint }}>{filtered.length} pending</span>
                  </div>
                  <div style={{ padding:'10px 14px' }}>
                    <TaskList tasks={filtered} loading={loading} onTaskUpdate={fetchTasks} theme={theme}/>
                  </div>
                </div>
              )}
              <SpotifyPlayer theme={theme}/>
            </div>
          </div>
        </>
      )}
    </div>
  )
}