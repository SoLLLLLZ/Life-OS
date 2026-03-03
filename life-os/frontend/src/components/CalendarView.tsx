import { useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, EventDropArg, EventClickArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import api from '../api'
import type { Task } from '../types'

const SUNSET_PALETTE = [
  { bg: 'rgba(192,57,43,0.25)',  border: '#c0392b', text: '#e8a090' },
  { bg: 'rgba(212,160,23,0.2)',  border: '#d4a017', text: '#e8c85a' },
  { bg: 'rgba(123,168,196,0.2)', border: '#7ba8c4', text: '#b8d4e8' },
  { bg: 'rgba(167,139,250,0.2)', border: '#a78bfa', text: '#c4b5fd' },
  { bg: 'rgba(52,211,153,0.15)', border: '#34d399', text: '#6ee7b7' },
  { bg: 'rgba(251,146,60,0.2)',  border: '#fb923c', text: '#fcd34d' },
]

function getEventStyle(source: string, title: string, theme: string) {
  const p = SUNSET_PALETTE
  if (source === 'manual')     return { backgroundColor: 'rgba(167,139,250,0.2)', borderColor: '#a78bfa', textColor: '#c4b5fd' }
  if (source === 'gmail')      return { backgroundColor: 'rgba(192,57,43,0.2)',   borderColor: '#c0392b', textColor: '#e8a090' }
  if (source === 'gradescope') return { backgroundColor: 'rgba(212,160,23,0.2)',  borderColor: '#d4a017', textColor: '#e8c85a' }
  const hash = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const c = p[hash % p.length]
  return { backgroundColor: c.bg, borderColor: c.border, textColor: c.text }
}

interface TaskModal {
  mode: 'create' | 'edit' | 'view'
  task?: Task
  start?: string
  end?: string
}

interface Props {
  tasks: Task[]
  onTaskUpdate: () => void
  theme: 'sunset' | 'tokyo'
}

export default function CalendarView({ tasks, onTaskUpdate, theme }: Props) {
  const [modal, setModal] = useState<TaskModal | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')
  const [saving, setSaving] = useState(false)
  const calRef = useRef<any>(null)
  const n = theme === 'tokyo'

  const T = {
    modalBg:     n ? 'rgba(8,14,24,0.98)'         : 'rgba(245,250,255,0.98)',
    modalBorder: n ? 'rgba(180,210,230,0.15)'      : 'rgba(30,80,140,0.18)',
    text:        n ? '#e8eef5'                     : '#0f2040',
    textSub:     n ? 'rgba(180,210,230,0.65)'      : 'rgba(20,50,100,0.65)',
    textFaint:   n ? 'rgba(180,210,230,0.4)'       : 'rgba(20,50,100,0.4)',
    inputBg:     n ? 'rgba(180,210,230,0.06)'      : 'rgba(30,80,140,0.05)',
    inputBorder: n ? 'rgba(180,210,230,0.18)'      : 'rgba(30,80,140,0.18)',
    labelColor:  n ? 'rgba(180,210,230,0.5)'       : 'rgba(20,50,100,0.6)',
    cancelBg:    n ? 'rgba(180,210,230,0.07)'      : 'rgba(30,80,140,0.06)',
    cancelBr:    n ? 'rgba(180,210,230,0.15)'      : 'rgba(30,80,140,0.16)',
    cancelFg:    n ? 'rgba(180,210,230,0.6)'       : 'rgba(20,50,100,0.6)',
    saveBg:      n ? 'rgba(192,57,43,0.2)'         : 'rgba(192,57,43,0.12)',
    saveBr:      n ? 'rgba(192,57,43,0.38)'        : 'rgba(192,57,43,0.3)',
    saveFg:      n ? '#f0a090'                     : '#7f1d1d',
    deleteBg:    n ? 'rgba(192,57,43,0.1)'         : 'rgba(192,57,43,0.07)',
    deleteBr:    n ? 'rgba(192,57,43,0.25)'        : 'rgba(192,57,43,0.2)',
    deleteFg:    n ? 'rgba(240,100,80,0.8)'        : 'rgba(150,30,20,0.8)',
    overlay:     'rgba(0,0,0,0.65)',
  }

  const events = tasks
    .filter(t => t.due_at)
    .map(t => {
      const style = getEventStyle(t.source, t.title, theme)
      const start = t.due_at!
      const end = t.end_at || null
      const isDateOnly = !start.includes('T')
      return {
        id: String(t.id),
        title: t.title,
        start,
        ...(isDateOnly ? {} : end ? { end } : {
          end: new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString(),
        }),
        allDay: isDateOnly,
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        textColor: n ? style.textColor : '#0f2040',
        extendedProps: { task: t },
        classNames: t.status === 'done' ? ['fc-done-event'] : [],
      }
    })

  const toLocalInput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const year = d.getFullYear()
    const month = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const hours = pad(d.getHours())
    const minutes = pad(d.getMinutes())
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // ── Click/drag on empty time slot = open create modal at that exact time ──
  const handleDateSelect = (arg: DateSelectArg) => {
    const startStr = toLocalInput(arg.start)
    const endStr   = toLocalInput(arg.end)
    setFormTitle('')
    setFormStart(startStr)
    setFormEnd(endStr)
    setModal({ mode: 'create', start: startStr, end: endStr })
    // keep selection highlight until user acts; do not unselect here
  }

  // ── Click on existing event = show details / edit ──
  const handleEventClick = (arg: EventClickArg) => {
    const task: Task = arg.event.extendedProps.task
    setFormTitle(task.title)
    setFormStart(task.due_at ? task.due_at.slice(0, 16) : '')
    setFormEnd(task.end_at ? task.end_at.slice(0, 16) : '')
    setModal({ mode: 'view', task })
  }

  // ── Drag event to new time ──
  const handleEventDrop = async (arg: EventDropArg) => {
    const task: Task = arg.event.extendedProps.task
    const newStart = arg.event.startStr
    const newEnd = arg.event.endStr
    try {
      await api.patch(`/tasks/${task.id}`, { due_at: newStart, end_at: newEnd })
      onTaskUpdate()
    } catch(e) {
      console.error(e)
      arg.revert()
    }
  }

  // ── Resize event (changes end time — we ignore end for now, just update start) ──
  const handleEventResize = async (arg: EventResizeDoneArg) => {
    const task: Task = arg.event.extendedProps.task
    const newStart = arg.event.startStr
    const newEnd = arg.event.endStr
    try {
      await api.patch(`/tasks/${task.id}`, { due_at: newStart, end_at: newEnd })
      onTaskUpdate()
    } catch(e) {
      console.error(e)
      arg.revert()
    }
  }

  // ── Save new task from modal ──
  const handleCreate = async () => {
    if (!formTitle.trim()) return
    setSaving(true)
    try {
      await api.post('/tasks/', {
        title: formTitle.trim(),
        // send local datetime strings so backend stores naive datetimes
        due_at: formStart || null,
        end_at: formEnd || null,
      })
      onTaskUpdate()
      setModal(null)
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  // ── Save edits from modal ──
  const handleSaveEdit = async () => {
    if (!modal?.task || !formTitle.trim()) return
    setSaving(true)
    try {
      await api.patch(`/tasks/${modal.task.id}`, {
        title: formTitle.trim(),
        due_at: formStart || null,
        end_at: formEnd || null,
      })
      onTaskUpdate()
      setModal(null)
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  // ── Delete from modal ──
  const handleDelete = async () => {
    if (!modal?.task) return
    setSaving(true)
    try {
      await api.delete(`/tasks/${modal.task.id}`)
      onTaskUpdate()
      setModal(null)
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: '4px', padding: '8px 12px',
    fontFamily: "'Rajdhani', sans-serif", fontSize: '14px', fontWeight: 500,
    color: T.text, outline: 'none', letterSpacing: '0.02em',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: "'Share Tech Mono', monospace", fontSize: '8px',
    letterSpacing: '0.2em', color: T.labelColor,
    textTransform: 'uppercase', display: 'block', marginBottom: '5px',
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Modal overlay */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: T.overlay,
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={{ background: T.modalBg, border: `1px solid ${T.modalBorder}`,
            borderRadius: '12px', padding: '28px', width: '420px',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

            {/* Top accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              borderRadius: '12px 12px 0 0',
              background: 'linear-gradient(90deg,transparent,rgba(192,57,43,0.6),rgba(212,160,23,0.8),rgba(192,57,43,0.6),transparent)' }}/>

            {/* Modal title */}
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '12px', fontWeight: 600,
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: T.textFaint, marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'rgba(192,57,43,0.6)', fontSize: '8px' }}>◆</span>
              {modal.mode === 'create' ? 'Inscribe Quest' : modal.mode === 'edit' ? 'Edit Quest' : 'Quest Details'}
              <button onClick={() => setModal(null)} style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: T.textFaint, cursor: 'pointer', fontSize: '16px', lineHeight: 1,
              }}>×</button>
            </div>

            {/* Source badge (view/edit mode) */}
            {modal.task && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace", fontSize: '8px',
                  padding: '3px 10px', borderRadius: '2px', letterSpacing: '0.08em',
                  background: modal.task.source === 'manual' ? 'rgba(167,139,250,0.14)'
                    : modal.task.source === 'gmail' ? 'rgba(192,57,43,0.14)'
                    : modal.task.source === 'gradescope' ? 'rgba(212,160,23,0.14)'
                    : 'rgba(123,168,196,0.14)',
                  color: modal.task.source === 'manual' ? '#c4b5fd'
                    : modal.task.source === 'gmail' ? '#f0a090'
                    : modal.task.source === 'gradescope' ? '#f5c842'
                    : '#b8d4e8',
                  border: `1px solid ${modal.task.source === 'manual' ? 'rgba(167,139,250,0.25)'
                    : modal.task.source === 'gmail' ? 'rgba(192,57,43,0.25)'
                    : modal.task.source === 'gradescope' ? 'rgba(212,160,23,0.25)'
                    : 'rgba(123,168,196,0.25)'}`,
                }}>
                  {modal.task.source.toUpperCase()}
                </span>
              </div>
            )}

            {/* Title field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Quest Title</label>
              {modal.mode === 'view' && modal.task?.source !== 'manual' ? (
                <div style={{ ...inputStyle, cursor: 'default', opacity: 0.8 }}>{formTitle}</div>
              ) : (
                <input type="text" value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (modal.mode === 'create' ? handleCreate() : handleSaveEdit())}
                  autoFocus style={inputStyle} placeholder="Name this quest..."/>
              )}
            </div>

            {/* Date/time fields */}
            <div style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr', rowGap: '10px' }}>
              <div>
                <label style={labelStyle}>Start</label>
                {modal.mode === 'view' && modal.task?.source !== 'manual' ? (
                  <div style={{ ...inputStyle, cursor: 'default', opacity: 0.8 }}>
                    {formStart ? new Date(formStart).toLocaleString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    }) : 'No start set'}
                  </div>
                ) : (
                  <input type="datetime-local" value={formStart}
                    onChange={e => setFormStart(e.target.value)}
                    style={{ ...inputStyle, colorScheme: n ? 'dark' : 'light' }}/>
                )}
              </div>

              <div>
                <label style={labelStyle}>End</label>
                {modal.mode === 'view' && modal.task?.source !== 'manual' ? (
                  <div style={{ ...inputStyle, cursor: 'default', opacity: 0.8 }}>
                    {formEnd ? new Date(formEnd).toLocaleString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    }) : 'No end set'}
                  </div>
                ) : (
                  <input type="datetime-local" value={formEnd}
                    onChange={e => setFormEnd(e.target.value)}
                    style={{ ...inputStyle, colorScheme: n ? 'dark' : 'light' }}/>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {/* Delete button (only for manual tasks or in edit mode) */}
              {modal.task && (modal.task.source === 'manual' || modal.mode === 'edit') && (
                <button onClick={handleDelete} disabled={saving} style={{
                  marginRight: 'auto', padding: '8px 14px',
                  fontFamily: "'Rajdhani', sans-serif", fontSize: '11px',
                  fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: T.deleteBg, border: `1px solid ${T.deleteBr}`,
                  color: T.deleteFg, borderRadius: '3px', cursor: 'pointer',
                }}>Delete</button>
              )}

              {/* Edit toggle (view → edit for manual tasks from other sources too) */}
              {modal.mode === 'view' && modal.task && (
                <button onClick={() => setModal({ ...modal, mode: 'edit' })} style={{
                  padding: '8px 14px',
                  fontFamily: "'Rajdhani', sans-serif", fontSize: '11px',
                  fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: T.cancelBg, border: `1px solid ${T.cancelBr}`,
                  color: T.cancelFg, borderRadius: '3px', cursor: 'pointer',
                }}>Edit</button>
              )}

              {/* Link button */}
              {modal.task?.link_url && (
                <button onClick={() => window.open(modal.task!.link_url!, '_blank')} style={{
                  padding: '8px 14px',
                  fontFamily: "'Rajdhani', sans-serif", fontSize: '11px',
                  fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: T.cancelBg, border: `1px solid ${T.cancelBr}`,
                  color: T.cancelFg, borderRadius: '3px', cursor: 'pointer',
                }}>↗ Open</button>
              )}

              <button onClick={() => setModal(null)} style={{
                padding: '8px 14px',
                fontFamily: "'Rajdhani', sans-serif", fontSize: '11px',
                fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                background: T.cancelBg, border: `1px solid ${T.cancelBr}`,
                color: T.cancelFg, borderRadius: '3px', cursor: 'pointer',
              }}>Cancel</button>

              {modal.mode !== 'view' && (
                <button
                  onClick={modal.mode === 'create' ? handleCreate : handleSaveEdit}
                  disabled={saving || !formTitle.trim()} style={{
                    padding: '8px 18px',
                    fontFamily: "'Rajdhani', sans-serif", fontSize: '11px',
                    fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    background: T.saveBg, border: `1px solid ${T.saveBr}`,
                    color: T.saveFg, borderRadius: '3px', cursor: 'pointer',
                  }}>
                  {saving ? 'Saving...' : modal.mode === 'create' ? '+ Add Quest' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar CSS */}
      <style>{`
        .fc { color: ${n ? '#e8eef5' : '#0f2040'}; font-family: 'Rajdhani', sans-serif !important; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: ${n ? 'rgba(180,210,230,0.07)' : 'rgba(30,80,140,0.08)'} !important; }
        .fc-theme-standard .fc-scrollgrid { border-color: ${n ? 'rgba(180,210,230,0.07)' : 'rgba(30,80,140,0.08)'} !important; }
        .fc-scrollgrid { background: transparent !important; }
        .fc-col-header-cell-cushion { color: ${n ? 'rgba(180,210,230,0.65)' : 'rgba(20,50,100,0.7)'} !important; text-decoration: none !important; font-family: 'Share Tech Mono', monospace !important; font-size: 9px !important; letter-spacing: 0.12em !important; text-transform: uppercase !important; }
        .fc-daygrid-day-number { color: ${n ? 'rgba(180,210,230,0.5)' : 'rgba(20,50,100,0.55)'} !important; text-decoration: none !important; }
        .fc-day-today { background: rgba(192,57,43,0.04) !important; }
        .fc-day-today .fc-col-header-cell-cushion { color: ${n ? 'rgba(192,57,43,0.85)' : 'rgba(150,30,20,0.85)'} !important; }
        .fc-button { background: ${n ? 'rgba(180,210,230,0.07)' : 'rgba(30,80,140,0.07)'} !important; border: 1px solid ${n ? 'rgba(180,210,230,0.16)' : 'rgba(30,80,140,0.18)'} !important; color: ${n ? 'rgba(180,210,230,0.7)' : 'rgba(20,50,100,0.7)'} !important; font-family: 'Rajdhani', sans-serif !important; font-size: 11px !important; font-weight: 700 !important; letter-spacing: 0.08em !important; border-radius: 3px !important; padding: 4px 12px !important; text-transform: uppercase !important; }
        .fc-button:hover { background: ${n ? 'rgba(180,210,230,0.14)' : 'rgba(30,80,140,0.14)'} !important; color: ${n ? 'white' : 'rgba(10,30,70,0.95)'} !important; }
        .fc-button-active, .fc-button-active:focus { background: rgba(192,57,43,0.2) !important; border-color: rgba(192,57,43,0.38) !important; color: ${n ? '#e8a090' : '#7f1d1d'} !important; }
        .fc-toolbar-title { color: ${n ? 'rgba(220,235,245,0.9)' : 'rgba(15,35,75,0.9)'} !important; font-family: 'Cinzel', serif !important; font-size: 14px !important; font-weight: 700 !important; letter-spacing: 0.08em !important; }
        .fc-event { cursor: grab !important; border-radius: 3px !important; padding: 2px 5px !important; font-family: 'Rajdhani', sans-serif !important; font-size: 11px !important; }
        .fc-event:active { cursor: grabbing !important; }
        .fc-event-title { font-weight: 700 !important; }
        .fc-event-time { font-size: 9px !important; opacity: 0.75 !important; font-family: 'Share Tech Mono', monospace !important; }
        .fc-done-event { opacity: 0.38 !important; }
        .fc-timegrid-slot { height: 2.8rem !important; }
        .fc-timegrid-slot-label { color: ${n ? 'rgba(180,210,230,0.38)' : 'rgba(20,50,100,0.42)'} !important; font-size: 9px !important; font-family: 'Share Tech Mono', monospace !important; }
        .fc-timegrid-now-indicator-line { border-color: #c0392b !important; box-shadow: 0 0 5px rgba(192,57,43,0.7) !important; }
        .fc-timegrid-now-indicator-arrow { border-top-color: #c0392b !important; border-bottom-color: #c0392b !important; }
        .fc-scrollgrid-section-body td { background: transparent !important; }
        .fc-daygrid-day { background: transparent !important; }
        .fc-col-header { background: ${n ? 'rgba(5,8,16,0.7)' : 'rgba(240,248,255,0.75)'} !important; }
        .fc-toolbar { margin-bottom: 12px !important; }
        /* Selection highlight */
        .fc-highlight { background: rgba(192,57,43,0.12) !important; border: 1px dashed rgba(192,57,43,0.4) !important; }
        /* Drag ghost */
        .fc-event-dragging { opacity: 0.75 !important; box-shadow: 0 8px 24px rgba(0,0,0,0.4) !important; }
        /* Resize handle */
        .fc-event-resizer { background: rgba(255,255,255,0.3) !important; }
      `}</style>

      <FullCalendar
        ref={calRef}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        scrollTime="08:00:00"
        height={600}
        slotMinTime="06:00:00"
        slotMaxTime="26:00:00"
        allDaySlot={true}
        nowIndicator={true}

        // ── Interaction settings ──
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        droppable={true}

        // ── Handlers ──
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}

        // Tooltip on hover
        eventMouseEnter={(arg) => {
          arg.el.title = arg.event.extendedProps.task?.title || ''
        }}
      />
    </div>
  )
}