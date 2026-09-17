import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Radio,
  Anchor,
  ClipboardList,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/',         icon: LayoutDashboard, label: 'Board'    },
  { to: '/dispatch', icon: Radio,           label: 'Dispatch' },
  { to: '/captain',  icon: Anchor,          label: 'Captain'  },
  { to: '/handoff',  icon: ClipboardList,   label: 'Handoff'  },
  { to: '/history',  icon: History,         label: 'History'  },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-white/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const exact = to === '/'
          const active = exact
            ? location.pathname === '/'
            : location.pathname.startsWith(to)

          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={exact}
                className={cn(
                  'flex flex-col items-center justify-center h-full gap-0.5',
                  'text-xs font-medium transition-colors duration-150',
                  active
                    ? 'text-blue-300'
                    : 'text-blue-200/50 hover:text-blue-200/80'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className={cn('w-5 h-5 transition-transform duration-150', active && 'scale-110')}
                  strokeWidth={active ? 2.2 : 1.7}
                />
                <span>{label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
