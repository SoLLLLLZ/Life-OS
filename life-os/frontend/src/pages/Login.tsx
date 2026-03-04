import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const { theme, toggleTheme } = useTheme()

  const handleGoogleLogin = () => {
    window.location.href = "https://life-os-j3cz.onrender.com/auth/google/login"
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-2">Life OS</h1>
        <p className="text-white/60 text-lg">Your personal productivity hub</p>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="bg-white text-gray-800 px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/90 transition-all shadow-lg"
      >
        Sign in with Google
      </button>

      <button
        onClick={toggleTheme}
        className="text-white/40 text-sm hover:text-white/70 transition-colors"
      >
        Switch to {theme === 'sunset' ? 'Tokyo Night' : 'Sunset'} theme
      </button>
    </div>
  )
}