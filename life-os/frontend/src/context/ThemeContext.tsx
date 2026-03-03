import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Theme } from '../types'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  accentColor: string
  setAccentColor: (color: string) => void
  bpm: number
  setBpm: (bpm: number) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const getDefaultTheme = (): Theme => {
    const hour = new Date().getHours()
    // Sunset: 5pm - 9pm, Tokyo Night: everything else
    return hour >= 17 && hour < 21 ? 'sunset' : 'tokyo'
  }

  const [theme, setTheme] = useState<Theme>(getDefaultTheme)
  const [accentColor, setAccentColor] = useState('#6366f1')
  const [bpm, setBpm] = useState(120)

  const toggleTheme = () => {
    setTheme(prev => prev === 'sunset' ? 'tokyo' : 'sunset')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accentColor, setAccentColor, bpm, setBpm }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}