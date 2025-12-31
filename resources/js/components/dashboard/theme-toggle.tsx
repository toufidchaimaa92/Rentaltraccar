import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/dashboard/theme-provider';

const ThemeToggle = () => {
  const { theme, setThemeWithTransition } = useTheme()

  const resolvedTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme

  const toggleTheme = (e?: React.MouseEvent) => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light'
    setThemeWithTransition(newTheme, e?.nativeEvent)
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-all duration-500"
    >
      {resolvedTheme === 'light' ? (
        <Moon className="text-xl transition-all duration-500" />
      ) : (
        <Sun className="text-xl transition-all duration-500" />
      )}
    </button>
  )
}

export default ThemeToggle
