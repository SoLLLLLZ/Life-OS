import { useState, useEffect } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

interface IntegrationStatus {
  google: boolean
  gradescope: boolean
  spotify: boolean
}

interface Props {
  theme: 'sunset' | 'tokyo'
}

export default function Settings({ theme }: Props) {
  const { user, logout } = useAuth()
  const [status, setStatus] = useState<IntegrationStatus>({
    google: false,
    gradescope: false,
    spotify: false,
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const n = theme === 'tokyo'

  const T = {
    bg:         n ? 'rgba(10,18,32,0.94)'       : 'rgba(255,255,255,0.90)',
    cardBg:     n ? 'rgba(180,210,230,0.05)'     : 'rgba(30,80,140,0.05)',
    rowBg:      n ? 'rgba(180,210,230,0.04)'     : 'rgba(30,80,140,0.04)',
    border:     n ? 'rgba(180,210,230,0.12)'     : 'rgba(30,80,140,0.14)',
    text:       n ? '#e8eef5'                    : '#0f2040',
    textSub:    n ? 'rgba(180,210,230,0.55)'     : 'rgba(20,50,100,0.65)',
    textFaint:  n ? 'rgba(180,210,230,0.35)'     : 'rgba(20,50,100,0.45)',
    btnBg:      n ? 'rgba(180,210,230,0.08)'     : 'rgba(30,80,140,0.07)',
    btnBorder:  n ? 'rgba(180,210,230,0.16)'     : 'rgba(30,80,140,0.18)',
    btnFg:      n ? 'rgba(180,210,230,0.65)'     : 'rgba(20,50,100,0.7)',
    accentBg:   n ? 'rgba(192,57,43,0.14)'       : 'rgba(192,57,43,0.08)',
    accentBr:   n ? 'rgba(192,57,43,0.32)'       : 'rgba(192,57,43,0.28)',
    accentFg:   n ? '#f0a090'                    : '#7f1d1d',
    greenBg:    n ? 'rgba(52,211,153,0.12)'      : 'rgba(22,163,74,0.08)',
    greenFg:    n ? '#34d399'                    : '#14532d',
    greenBr:    n ? 'rgba(52,211,153,0.28)'      : 'rgba(22,163,74,0.22)',
    grayBg:     n ? 'rgba(180,210,230,0.06)'     : 'rgba(30,80,140,0.06)',
    grayFg:     n ? 'rgba(180,210,230,0.35)'     : 'rgba(20,50,100,0.45)',
    grayBr:     n ? 'rgba(180,210,230,0.14)'     : 'rgba(30,80,140,0.14)',
    dangerHover:n ? 'rgba(192,57,43,0.18)'       : 'rgba(192,57,43,0.08)',
  }

  const fetchStatus = async () => {
    try {
      const res = await api.get('/integrations/status')
      setStatus(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  const handleConnectSpotify = () => {
    const token = localStorage.getItem('token')
    window.location.href = `http://127.0.0.1:8000/auth/spotify/login?token=${token}`
  }

  const handleConnectGoogle = () => {
    window.location.href = 'http://127.0.0.1:8000/auth/google/login'
  }

  const handleSync = async (provider: string) => {
    setSyncing(provider)
    try {
      if (provider === 'google') {
        await api.post('/integrations/google/sync')
      } else if (provider === 'gradescope') {
        await api.post('/integrations/gradescope/sync')
      } else if (provider === 'all') {
        await api.post('/integrations/sync/all')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSyncing(null)
    }
  }

  const integrations = [
    {
      id: 'google',
      name: 'Google',
      description: 'Syncs your Google Calendar events and Gmail action items as tasks',
      icon: '🗓',
      connected: status.google,
      onConnect: handleConnectGoogle,
      onSync: () => handleSync('google'),
    },
    {
      id: 'gradescope',
      name: 'Gradescope',
      description: 'Syncs your assignments and due dates from all your courses',
      icon: '📚',
      connected: status.gradescope,
      onConnect: null,
      onSync: () => handleSync('gradescope'),
    },
    {
      id: 'spotify',
      name: 'Spotify',
      description: 'Controls music playback and powers the Now Playing section',
      icon: '🎵',
      connected: status.spotify,
      onConnect: handleConnectSpotify,
      onSync: null,
    },
  ]

  const card = (children: React.ReactNode) => (
    <div style={{
      background: T.cardBg, border: `1px solid ${T.border}`,
      borderRadius: '12px', padding: '24px', marginBottom: '16px',
      backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
    }}>{children}</div>
  )

  const sectionTitle = (label: string) => (
    <div style={{
      fontFamily: "'Cinzel', serif", fontSize: '11px', fontWeight: 600,
      letterSpacing: '0.25em', textTransform: 'uppercase' as const,
      color: T.textSub, marginBottom: '16px',
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <span style={{ color: 'rgba(192,57,43,0.55)', fontSize: '7px' }}>◆</span>
      {label}
    </div>
  )

  const btn = (label: string, onClick: () => void, disabled = false, variant: 'ghost' | 'accent' | 'danger' = 'ghost') => {
    const bg = variant === 'accent' ? T.accentBg : variant === 'danger' ? T.dangerHover : T.btnBg
    const br = variant === 'accent' ? T.accentBr : T.btnBorder
    const fg = variant === 'accent' ? T.accentFg : variant === 'danger' ? (n ? '#f0a090' : '#7f1d1d') : T.btnFg
    return (
      <button onClick={onClick} disabled={disabled} style={{
        padding: '6px 14px', fontFamily: "'Rajdhani', sans-serif",
        fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase' as const, borderRadius: '3px', cursor: 'pointer',
        background: bg, border: `1px solid ${br}`, color: fg,
        opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
      }}>{label}</button>
    )
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)', padding: '32px 36px',
      maxWidth: '680px', margin: '0 auto',
    }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: '22px', fontWeight: 700,
        letterSpacing: '0.08em', color: T.text, marginBottom: '6px' }}>
        Forge
      </div>
      <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: '14px', fontStyle: 'italic',
        color: T.textSub, marginBottom: '28px' }}>
        Manage your account and integrations
      </div>

      {/* Account */}
      {card(
        <>
          {sectionTitle('Account')}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '15px',
                fontWeight: 700, color: T.text, letterSpacing: '0.04em' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px',
                color: T.textFaint, marginTop: '3px', letterSpacing: '0.06em' }}>
                {user?.email}
              </div>
            </div>
            {btn('Sign Out', logout, false, 'danger')}
          </div>
        </>
      )}

      {/* Integrations */}
      {card(
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            {sectionTitle('Integrations')}
            {btn(syncing === 'all' ? '↻ Syncing...' : '↻ Sync All', () => handleSync('all'), syncing !== null)}
          </div>

          {loading ? (
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px',
              color: T.textFaint, textAlign: 'center', padding: '24px 0' }}>Loading...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {integrations.map(integration => (
                <div key={integration.id} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  background: T.rowBg, border: `1px solid ${T.border}`,
                  borderRadius: '8px', padding: '14px 16px',
                }}>
                  <div style={{ fontSize: '22px', flexShrink: 0 }}>{integration.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '14px',
                        fontWeight: 700, color: T.text }}>
                        {integration.name}
                      </span>
                      <span style={{
                        fontFamily: "'Share Tech Mono', monospace", fontSize: '8px',
                        letterSpacing: '0.08em', padding: '2px 8px', borderRadius: '2px',
                        background: integration.connected ? T.greenBg : T.grayBg,
                        color: integration.connected ? T.greenFg : T.grayFg,
                        border: `1px solid ${integration.connected ? T.greenBr : T.grayBr}`,
                      }}>
                        {integration.connected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: '12px',
                      fontStyle: 'italic', color: T.textFaint }}>
                      {integration.description}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {integration.onSync && integration.connected &&
                      btn(syncing === integration.id ? 'Syncing...' : '↻ Sync',
                        integration.onSync, syncing === integration.id)}
                    {!integration.connected && integration.onConnect &&
                      btn('Connect', integration.onConnect, false, 'accent')}
                    {integration.connected && integration.id === 'spotify' &&
                      btn('Reconnect', handleConnectSpotify)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Data */}
      {card(
        <>
          {sectionTitle('Data')}
          <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: '13px', fontStyle: 'italic',
            color: T.textSub, marginBottom: '16px' }}>
            Sync all connected integrations to get the latest tasks and events
          </div>
          <button
            onClick={() => handleSync('all')}
            disabled={syncing !== null}
            style={{
              width: '100%', padding: '12px', fontFamily: "'Rajdhani', sans-serif",
              fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em',
              textTransform: 'uppercase' as const, borderRadius: '6px', cursor: 'pointer',
              background: T.accentBg, border: `1px solid ${T.accentBr}`,
              color: T.accentFg, opacity: syncing !== null ? 0.5 : 1, transition: 'all 0.15s',
            }}
          >
            {syncing === 'all' ? '↻ Invoking Sync...' : '↻ Invoke Full Sync'}
          </button>
        </>
      )}
    </div>
  )
}
