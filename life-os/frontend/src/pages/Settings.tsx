import { useState, useEffect } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

interface IntegrationStatus {
  google: boolean
  gradescope: boolean
  spotify: boolean
}

export default function Settings() {
  const { user, logout } = useAuth()
  const [status, setStatus] = useState<IntegrationStatus>({
    google: false,
    gradescope: false,
    spotify: false,
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

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

  useEffect(() => {
    fetchStatus()
  }, [])

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

  return (
    <div className="min-h-screen text-white px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-white/40 mb-8">Manage your account and integrations</p>

      {/* Account section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">{user?.name || 'User'}</p>
            <p className="text-white/40 text-sm mt-0.5">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="bg-white/10 hover:bg-red-500/20 text-white/60 hover:text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Integrations section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Integrations</h2>
          <button
            onClick={() => handleSync('all')}
            disabled={syncing !== null}
            className="text-white/60 hover:text-white text-sm bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            {syncing === 'all' ? 'Syncing...' : '↻ Sync All'}
          </button>
        </div>

        {loading ? (
          <div className="text-white/30 text-center py-8">Loading...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {integrations.map(integration => (
              <div
                key={integration.id}
                className="flex items-center gap-4 bg-white/5 rounded-xl p-4"
              >
                <div className="text-3xl">{integration.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{integration.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      integration.connected
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/10 text-white/30'
                    }`}>
                      {integration.connected ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mt-0.5 truncate">
                    {integration.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {integration.onSync && integration.connected && (
                    <button
                      onClick={integration.onSync}
                      disabled={syncing === integration.id}
                      className="text-white/50 hover:text-white text-sm bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {syncing === integration.id ? 'Syncing...' : '↻ Sync'}
                    </button>
                  )}
                  {!integration.connected && integration.onConnect && (
                    <button
                      onClick={integration.onConnect}
                      className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
                    >
                      Connect
                    </button>
                  )}
                  {integration.connected && integration.id === 'spotify' && (
                    <button
                      onClick={handleConnectSpotify}
                      className="text-white/30 hover:text-white text-sm bg-white/5 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Reconnect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync all button */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-2">Data</h2>
        <p className="text-white/40 text-sm mb-4">
          Sync all connected integrations to get the latest tasks and events
        </p>
        <button
          onClick={() => handleSync('all')}
          disabled={syncing !== null}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-colors font-medium"
        >
          {syncing === 'all' ? '↻ Syncing everything...' : '↻ Sync Everything'}
        </button>
      </div>
    </div>
  )
}