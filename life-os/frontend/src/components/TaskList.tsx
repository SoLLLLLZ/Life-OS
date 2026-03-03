import { useState } from 'react'
import api from '../api'
import type { Task } from '../types'

interface Props {
  onTaskUpdate: () => void
  tasks: Task[]
  loading: boolean
  theme?: 'sunset' | 'tokyo'
}

export default function TaskList({ onTaskUpdate, tasks, loading, theme = 'tokyo' }: Props) {
  const [newTitle, setNewTitle] = useState('')
  const [newDue, setNewDue] = useState('')
  const [adding, setAdding] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string,boolean>>({ Later: true, 'No Due Date': true })
  const n = theme === 'tokyo'

  // Theme tokens
  const T = {
    text:        n ? '#e8eef5'                    : '#0f2040',
    textMid:     n ? 'rgba(220,235,245,0.92)'     : '#0a1a35',
    textSub:     n ? 'rgba(180,210,230,0.65)'     : 'rgba(20,50,100,0.78)',
    textFaint:   n ? 'rgba(180,210,230,0.38)'     : 'rgba(20,50,100,0.52)',
    inputBg:     n ? 'rgba(180,210,230,0.05)'     : 'rgba(30,80,140,0.05)',
    inputBorder: n ? 'rgba(180,210,230,0.15)'     : 'rgba(30,80,140,0.16)',
    taskBg:      n ? 'rgba(180,210,230,0.04)'     : 'rgba(30,80,140,0.04)',
    taskBorder:  n ? 'rgba(180,210,230,0.1)'      : 'rgba(30,80,140,0.11)',
    taskHoverBg: n ? 'rgba(192,57,43,0.07)'       : 'rgba(192,57,43,0.04)',
    taskHoverBr: n ? 'rgba(192,57,43,0.2)'        : 'rgba(192,57,43,0.16)',
    groupColor:  n ? 'rgba(212,160,23,0.75)'      : 'rgba(80,45,0,0.85)',
    groupLine:   n ? 'rgba(212,160,23,0.14)'      : 'rgba(100,65,0,0.14)',
    checkBorder: n ? 'rgba(180,210,230,0.28)'     : 'rgba(30,80,140,0.28)',
    collapseColor:n? 'rgba(192,57,43,0.45)'       : 'rgba(150,30,20,0.65)',
    plusBg:      n ? 'rgba(192,57,43,0.15)'       : 'rgba(192,57,43,0.1)',
    plusBorder:  n ? 'rgba(192,57,43,0.32)'       : 'rgba(192,57,43,0.26)',
  }
  const tags: Record<string,{bg:string;fg:string;br:string}> = n ? {
    gcal:       { bg:'rgba(123,168,196,0.14)', fg:'#b8d4e8', br:'rgba(123,168,196,0.24)' },
    gmail:      { bg:'rgba(192,57,43,0.14)',   fg:'#f0a090', br:'rgba(192,57,43,0.24)'   },
    gradescope: { bg:'rgba(212,160,23,0.14)',  fg:'#f5c842', br:'rgba(212,160,23,0.24)'  },
    manual:     { bg:'rgba(167,139,250,0.14)', fg:'#c4b5fd', br:'rgba(167,139,250,0.24)' },
  } : {
    gcal:       { bg:'rgba(30,100,180,0.09)',  fg:'#1e3a8a', br:'rgba(30,100,180,0.2)'   },
    gmail:      { bg:'rgba(180,30,30,0.09)',   fg:'#7f1d1d', br:'rgba(180,30,30,0.2)'    },
    gradescope: { bg:'rgba(160,100,0,0.09)',   fg:'#78350f', br:'rgba(160,100,0,0.2)'    },
    manual:     { bg:'rgba(109,40,217,0.09)',  fg:'#4c1d95', br:'rgba(109,40,217,0.2)'   },
  }
  const tagLabels: Record<string,string> = {
    manual:'Manual', gcal:'Calendar', gmail:'Gmail', gradescope:'Gradescope',
  }

  function groupTasks(tasks: Task[]) {
    const today = new Date(); today.setHours(0,0,0,0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1)
    const g: Record<string,Task[]> = { Today:[], Tomorrow:[], Later:[], 'No Due Date':[] }
    tasks.forEach(t => {
      if (t.status==='done') return
      if (!t.due_at) { g['No Due Date'].push(t); return }
      const d = new Date(t.due_at); d.setHours(0,0,0,0)
      if (d.getTime()===today.getTime()) g['Today'].push(t)
      else if (d.getTime()===tomorrow.getTime()) g['Tomorrow'].push(t)
      else g['Later'].push(t)
    })
    return g
  }

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      await api.post('/tasks/', {
        title: newTitle.trim(),
        due_at: newDue ? new Date(newDue).toISOString() : null,
      })
      setNewTitle(''); setNewDue(''); onTaskUpdate()
    }
    catch (e) { console.error(e) }
    finally { setAdding(false) }
  }

  const handleToggle = async (task: Task) => {
    try {
      if (task.status==='pending') await api.post(`/tasks/${task.id}/done`)
      else await api.patch(`/tasks/${task.id}`,{status:'pending'})
      onTaskUpdate()
    } catch(e) { console.error(e) }
  }

  const handleDelete = async (id: number) => {
    try { await api.delete(`/tasks/${id}`); onTaskUpdate() }
    catch(e) { console.error(e) }
  }

  const groups = groupTasks(tasks)

  return (
    <div>
      {/* Add task */}
      <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'14px' }}>
        <div style={{ display:'flex', gap:'6px' }}>
          <input type="text" value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key==='Enter' && handleAdd()}
            placeholder="Inscribe a new quest..."
            style={{
              flex:1, background:T.inputBg, border:`1px solid ${T.inputBorder}`,
              borderRadius:'4px', padding:'8px 12px',
              fontFamily:"'Rajdhani',sans-serif", fontSize:'13px', fontWeight:500,
              color:T.text, outline:'none', letterSpacing:'0.03em',
            }}
          />
          <button onClick={handleAdd} disabled={adding} style={{
            width:'36px', height:'36px', background:T.plusBg,
            border:`1px solid ${T.plusBorder}`, borderRadius:'4px',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'20px', color:'#c0392b', cursor:'pointer', lineHeight:1,
          }}>+</button>
        </div>
        <input type="datetime-local" value={newDue}
          onChange={e => setNewDue(e.target.value)}
          style={{
            background:T.inputBg, border:`1px solid ${T.inputBorder}`,
            borderRadius:'4px', padding:'6px 10px',
            fontFamily:"'Share Tech Mono',monospace", fontSize:'10px',
            color: newDue ? T.text : T.textFaint,
            outline:'none', colorScheme: n ? 'dark' : 'light',
          }}
        />
      </div>

      {loading ? (
        <div style={{ color:T.textFaint, textAlign:'center', padding:'32px 0',
          fontFamily:"'Crimson Pro',serif", fontStyle:'italic', fontSize:'15px' }}>
          Loading quests...
        </div>
      ) : Object.entries(groups).map(([group, list]) => {
        if (!list.length) return null
        const collapsible = group==='Later'||group==='No Due Date'
        const isCollapsed = collapsed[group] ?? false
        return (
          <div key={group} style={{ marginBottom:'14px' }}>
            <div onClick={() => collapsible && setCollapsed(p=>({...p,[group]:!p[group]}))}
              style={{ display:'flex', alignItems:'center', gap:'8px',
                marginBottom:'7px', cursor:collapsible?'pointer':'default' }}>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'9px',
                letterSpacing:'0.25em', color:T.groupColor, textTransform:'uppercase' as const }}>
                {group}
              </span>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'9px', color:T.textFaint }}>
                ({list.length})
              </span>
              <div style={{ flex:1, height:'1px', background:T.groupLine }}/>
              {collapsible && (
                <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'8px',
                  color:T.collapseColor, letterSpacing:'0.08em' }}>
                  {isCollapsed?'▼ show':'▲ hide'}
                </span>
              )}
            </div>

            {!isCollapsed && (
              <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                {list.map(task => {
                  const tag = tags[task.source] || tags.manual
                  return (
                    <div key={task.id}
                      style={{ display:'flex', alignItems:'center', gap:'8px',
                        padding:'9px 11px', background:T.taskBg,
                        border:`1px solid ${T.taskBorder}`, borderRadius:'4px',
                        transition:'all 0.15s', cursor:'default' }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLDivElement
                        el.style.background=T.taskHoverBg; el.style.borderColor=T.taskHoverBr }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLDivElement
                        el.style.background=T.taskBg; el.style.borderColor=T.taskBorder }}>

                      <button onClick={() => handleToggle(task)} style={{
                        width:'17px', height:'17px', borderRadius:'3px', flexShrink:0,
                        border:task.status==='done'?'none':`1.5px solid ${T.checkBorder}`,
                        background:task.status==='done'?'linear-gradient(135deg,#c0392b,#d4a017)':'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'9px', color:'white', cursor:'pointer',
                      }}>{task.status==='done'&&'✓'}</button>

                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:'13px', fontWeight:600,
                          color:task.status==='done'?T.textFaint:T.textMid,
                          textDecoration:task.status==='done'?'line-through':'none',
                          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                          letterSpacing:'0.02em' }}>{task.title}</div>
                        {task.due_at && (
                          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'9px',
                            color:T.textSub, marginTop:'1px' }}>
                            {new Date(task.due_at).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                          </div>
                        )}
                      </div>

                      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'8px',
                        padding:'2px 7px', borderRadius:'2px', flexShrink:0, letterSpacing:'0.05em',
                        background:tag.bg, color:tag.fg, border:`1px solid ${tag.br}` }}>
                        {tagLabels[task.source]||task.source}
                      </span>

                      {task.link_url && (
                        <button onClick={() => window.open(task.link_url!,'_blank')} style={{
                          fontSize:'13px', color:T.textFaint, background:'none', border:'none',
                          cursor:'pointer', flexShrink:0, transition:'color 0.15s' }}
                          onMouseEnter={e=>(e.currentTarget.style.color=T.textMid)}
                          onMouseLeave={e=>(e.currentTarget.style.color=T.textFaint)}>↗</button>
                      )}

                      <button onClick={() => handleDelete(task.id)} style={{
                        width:'22px', height:'22px', borderRadius:'3px', flexShrink:0,
                        background:'transparent',
                        border:`1px solid transparent`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'10px', color:T.textFaint, cursor:'pointer', transition:'all 0.15s' }}
                        onMouseEnter={e=>{
                          e.currentTarget.style.color='#c0392b'
                          e.currentTarget.style.background='rgba(192,57,43,0.1)'
                          e.currentTarget.style.borderColor='rgba(192,57,43,0.25)'
                        }}
                        onMouseLeave={e=>{
                          e.currentTarget.style.color=T.textFaint
                          e.currentTarget.style.background='transparent'
                          e.currentTarget.style.borderColor='transparent'
                        }}>✕</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}