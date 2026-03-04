import { useState, useEffect } from 'react'
import type { Task } from '../types'

interface Props {
  tasks: Task[]
  theme: 'sunset' | 'tokyo'
  calView?: 'month' | 'week' | 'day'
}

interface StatCardProps {
  label: string; icon: string; value: number; sublabel: string
  trend: { text: string; type: 'up' | 'warn' | 'neutral' }
  color: 'red' | 'gold' | 'ice' | 'amber'; isNight: boolean
}

function StatCard({ label, icon, value, sublabel, trend, color, isNight }: StatCardProps) {
  const nc = {
    red:   { val: '#f0a090', glow: 'rgba(192,57,43,0.5)',  top: '#c0392b', bg: 'rgba(192,57,43,0.07)' },
    gold:  { val: '#f5c842', glow: 'rgba(240,192,64,0.4)', top: '#d4a017', bg: 'rgba(212,160,23,0.07)' },
    ice:   { val: '#b8d4e8', glow: 'rgba(123,168,196,0.5)',top: '#7ba8c4', bg: 'rgba(123,168,196,0.07)' },
    amber: { val: '#f5c842', glow: 'rgba(212,160,23,0.4)', top: '#d4a017', bg: 'rgba(212,160,23,0.06)' },
  }
  const dc = {
    red:   { val: '#7f1d1d', glow: 'rgba(127,29,29,0.18)', top: '#c0392b', bg: 'rgba(192,57,43,0.07)' },
    gold:  { val: '#78350f', glow: 'rgba(120,53,15,0.18)', top: '#b45309', bg: 'rgba(180,83,9,0.06)'  },
    ice:   { val: '#1e3a5f', glow: 'rgba(30,58,95,0.15)',  top: '#2563a8', bg: 'rgba(37,99,168,0.06)' },
    amber: { val: '#78350f', glow: 'rgba(120,53,15,0.18)', top: '#b45309', bg: 'rgba(180,83,9,0.06)'  },
  }
  const nt = {
    up:      { bg:'rgba(52,211,153,0.1)',  fg:'#34d399', br:'rgba(52,211,153,0.28)'  },
    warn:    { bg:'rgba(192,57,43,0.1)',   fg:'#f0a090', br:'rgba(192,57,43,0.28)'   },
    neutral: { bg:'rgba(180,210,230,0.07)',fg:'rgba(180,210,230,0.55)',br:'rgba(180,210,230,0.18)'},
  }
  const dt = {
    up:      { bg:'rgba(22,163,74,0.08)',  fg:'#14532d', br:'rgba(22,163,74,0.22)'   },
    warn:    { bg:'rgba(192,57,43,0.08)',  fg:'#7f1d1d', br:'rgba(192,57,43,0.22)'   },
    neutral: { bg:'rgba(30,80,140,0.07)',  fg:'rgba(30,60,110,0.55)',br:'rgba(30,80,140,0.18)'},
  }
  const c  = isNight ? nc[color] : dc[color]
  const ts = isNight ? nt[trend.type] : dt[trend.type]
  const cardBg     = isNight ? 'rgba(10,18,32,0.94)' : 'rgba(255,255,255,0.90)'
  const cardBorder = isNight ? 'rgba(180,210,230,0.12)' : 'rgba(30,80,140,0.14)'
  const subColor   = isNight ? 'rgba(180,210,230,0.5)' : 'rgba(20,50,100,0.65)'
  const lblColor   = isNight ? 'rgba(180,210,230,0.55)' : 'rgba(20,50,100,0.72)'

  return (
    <div style={{
      position:'relative', background:cardBg, border:`1px solid ${cardBorder}`,
      borderRadius:'12px', padding:'18px 20px',
      display:'flex', flexDirection:'column', justifyContent:'space-between',
      backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
      overflow:'hidden', transition:'all 0.3s',
    }}>
      <div style={{ position:'absolute',top:0,left:0,right:0,height:'2px',
        background:`linear-gradient(90deg,transparent,${c.top},transparent)`, opacity:0.75 }}/>
      <div style={{ position:'absolute',bottom:0,left:0,right:0,height:'60%',
        background:`radial-gradient(ellipse at 50% 100%,${c.bg},transparent 70%)` }}/>

      <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'8px',
        letterSpacing:'0.22em', color:lblColor, textTransform:'uppercase' as const,
        display:'flex', alignItems:'center', gap:'5px' }}>
        <span style={{ fontSize:'13px' }}>{icon}</span>{label}
      </div>

      <div style={{ position:'relative', zIndex:1 }}>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:'42px', fontWeight:900,
          lineHeight:1, color:c.val, textShadow:`0 0 22px ${c.glow}`, margin:'6px 0 3px' }}>
          {value}
        </div>
        <div style={{ fontFamily:"'Crimson Pro',serif", fontSize:'13px',
          fontStyle:'italic', color:subColor }}>{sublabel}</div>
      </div>

      <div style={{
        display:'inline-flex', alignItems:'center', gap:'3px',
        background:ts.bg, color:ts.fg, border:`1px solid ${ts.br}`,
        borderRadius:'2px', padding:'2px 8px',
        fontFamily:"'Share Tech Mono',monospace", fontSize:'8px',
        letterSpacing:'0.08em', marginTop:'8px', width:'fit-content',
      }}>{trend.text}</div>
    </div>
  )
}

export default function GreetingHero({ tasks, theme, calView = 'week' }: Props) {
  const [time, setTime] = useState(new Date())
  const isNight = theme === 'tokyo'

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])

  const hour = time.getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  const today = new Date(); today.setHours(0,0,0,0)
  const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7)

  const dueToday    = tasks.filter(t => { if(!t.due_at||t.status==='done') return false; const d=new Date(t.due_at); d.setHours(0,0,0,0); return d.getTime()===today.getTime() }).length
  const dueThisWeek = tasks.filter(t => { if(!t.due_at||t.status==='done') return false; const d=new Date(t.due_at); return d>=today&&d<=weekEnd }).length
  // Gradescope pending count filtered to the current calendar view window
  const gsWindowEnd = new Date(today)
  if (calView === 'day') {
    gsWindowEnd.setDate(gsWindowEnd.getDate() + 1)
  } else if (calView === 'week') {
    gsWindowEnd.setDate(gsWindowEnd.getDate() + 7)
  } else {
    gsWindowEnd.setMonth(gsWindowEnd.getMonth() + 1)
  }
  const gradescope = tasks.filter(t => {
    if (t.source !== 'gradescope' || t.status !== 'pending') return false
    if (!t.due_at) return false // no due date = no window to place it
    const d = new Date(t.due_at)
    return d >= today && d <= gsWindowEnd
  }).length

  // Vanquished: count completed tasks within the calendar's current view window
  const vanquishedWindowStart = new Date(today)
  const vanquishedWindowEnd   = new Date(today)
  if (calView === 'day') {
    // just today
    vanquishedWindowEnd.setDate(vanquishedWindowEnd.getDate() + 1)
  } else if (calView === 'week') {
    // last 7 days through next 7 days (current week context)
    vanquishedWindowStart.setDate(vanquishedWindowStart.getDate() - 7)
    vanquishedWindowEnd.setDate(vanquishedWindowEnd.getDate() + 7)
  } else {
    // month: last 30 days through end of month
    vanquishedWindowStart.setDate(vanquishedWindowStart.getDate() - 30)
    vanquishedWindowEnd.setMonth(vanquishedWindowEnd.getMonth() + 1)
  }
  const completed = tasks.filter(t => {
    if (t.status !== 'done') return false
    if (!t.due_at) return calView === 'month' // tasks without dates count in month view only
    const d = new Date(t.due_at)
    return d >= vanquishedWindowStart && d <= vanquishedWindowEnd
  }).length

  const vanquishedSublabel = calView === 'day' ? 'today' : calView === 'week' ? 'this week' : 'this month'

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const timeStr = time.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
  const dateStr = `${days[time.getDay()].toUpperCase()} · ${months[time.getMonth()].toUpperCase()} ${time.getDate()} · ${time.getFullYear()}`

  const cardBg     = isNight ? 'rgba(10,18,32,0.94)' : 'rgba(255,255,255,0.90)'
  const cardBorder = isNight ? 'rgba(180,210,230,0.12)' : 'rgba(30,80,140,0.14)'
  const eyebrowColor = isNight ? 'rgba(192,57,43,0.55)' : 'rgba(192,57,43,0.65)'
  const timeColor    = isNight ? 'rgba(180,210,230,0.5)'  : 'rgba(20,50,100,0.7)'
  const headingColor = isNight ? '#e8eef5' : '#0f2040'
  const subColor     = isNight ? 'rgba(180,210,230,0.65)' : 'rgba(20,50,100,0.8)'
  const badgeBg      = isNight ? 'rgba(180,210,230,0.05)' : 'rgba(30,80,140,0.06)'
  const badgeBorder  = isNight ? 'rgba(180,210,230,0.12)' : 'rgba(30,80,140,0.14)'
  const badgeColor   = isNight ? 'rgba(180,210,230,0.5)'  : 'rgba(20,50,100,0.65)'

  return (
    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:'14px', padding:'24px 36px 0' }}>
      <div style={{ position:'relative', background:cardBg, border:`1px solid ${cardBorder}`,
        borderRadius:'12px', padding:'24px 28px',
        backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)', overflow:'hidden' }}>
        <div style={{ position:'absolute',top:0,left:0,right:0,height:'2px',
          background:'linear-gradient(90deg,transparent,rgba(192,57,43,0.65),rgba(212,160,23,0.85),rgba(192,57,43,0.65),transparent)' }}/>

        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'8px',
          color:eyebrowColor, letterSpacing:'0.3em', textTransform:'uppercase' as const,
          marginBottom:'5px', display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ color:eyebrowColor, fontSize:'7px' }}>◈</span>Live Chronicle
        </div>
        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'10px',
          color:timeColor, letterSpacing:'0.12em', marginBottom:'8px' }}>
          {dateStr} · {timeStr}
        </div>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:'26px', fontWeight:700,
          lineHeight:1.2, letterSpacing:'0.02em', color:headingColor }}>
          {greeting},<br/>
          <span style={{ background:'linear-gradient(90deg,#c8a060,#f5c842)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Thomas.</span>
        </div>
        <div style={{ fontFamily:"'Crimson Pro',serif", fontSize:'15px', fontStyle:'italic',
          color:subColor, marginTop:'10px', lineHeight:1.5 }}>
          {dueToday > 0
            ? <span>You have <strong style={{ color:'#c0392b', fontStyle:'normal', fontWeight:600 }}>{dueToday} quest{dueToday!==1?'s':''}</strong> due today.</span>
            : <span>All quests conquered for today.</span>}
        </div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'6px',
          background:badgeBg, border:`1px solid ${badgeBorder}`,
          borderRadius:'3px', padding:'5px 12px', marginTop:'14px',
          fontFamily:"'Share Tech Mono',monospace", fontSize:'9px',
          color:badgeColor, letterSpacing:'0.12em' }}>
          <span style={{ width:'5px',height:'5px',borderRadius:'50%',background:'#c0392b',
            boxShadow:'0 0 6px rgba(192,57,43,0.8)', display:'inline-block',
            animation:'greetBlink 2s ease-in-out infinite' }}/>
          SPRING 2026 · WEEK 8
        </div>
        <style>{`@keyframes greetBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
      </div>

      <StatCard label="Due Today"  icon="🔥" value={dueToday}    sublabel="quests pending" color="red"   isNight={isNight}
        trend={dueToday>3?{text:'⚠ urgent',type:'warn'}:{text:'→ on track',type:'neutral'}}/>
      <StatCard label="This Week"  icon="⚔"  value={dueThisWeek} sublabel="tasks & events" color="gold"  isNight={isNight}
        trend={{text:'→ steady',type:'neutral'}}/>
      <StatCard label="Vanquished" icon="✦"  value={completed}   sublabel={vanquishedSublabel} color="ice"   isNight={isNight}
        trend={{text:'↑ great work',type:'up'}}/>
      <StatCard label="Gradescope" icon="📜" value={gradescope}  sublabel={calView === 'day' ? 'due today' : calView === 'week' ? 'due this week' : 'due this month'} color="amber" isNight={isNight}
        trend={gradescope>0?{text:'⚠ pending',type:'warn'}:{text:'✓ clear',type:'up'}}/>
    </div>
  )
}