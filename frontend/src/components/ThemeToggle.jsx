import { Sun, Moon, Monitor } from 'lucide-react'

const MODES = ['light', 'dark', 'system']

const ICONS = { light: Sun, dark: Moon, system: Monitor }
const LABELS = { light: 'Light mode', dark: 'Dark mode', system: 'System default' }

export default function ThemeToggle({ theme, onThemeChange }) {
  const next = MODES[(MODES.indexOf(theme) + 1) % MODES.length]
  const Icon = ICONS[theme]

  return (
    <button
      onClick={() => onThemeChange(next)}
      aria-label={`Current: ${LABELS[theme]}. Click to switch to ${LABELS[next]}`}
      title={LABELS[theme]}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  )
}
