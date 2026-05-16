import { RefObject, useEffect } from 'react'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Trap keyboard focus inside `ref` while `active`. On activate, focus moves
 * into the container; Tab / Shift+Tab cycle within it; on deactivate, focus
 * returns to whatever was focused before. Closing (Escape / scrim / nav) is
 * already handled by each overlay - this only governs focus order.
 *
 * Inert when `active` is false, so an overlay that never opens on a given
 * viewport (e.g. the mobile drawer on desktop) is completely unaffected.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return
    const container = ref.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    // getClientRects() is truthy for any rendered element including
    // position:fixed/sticky ones (offsetParent is null for those).
    const focusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0 || el === document.activeElement,
      )

    // Move focus into the overlay (first focusable, else the container itself).
    const initial = focusable()[0] ?? container
    initial.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const f = focusable()
      if (f.length === 0) {
        e.preventDefault()
        return
      }
      const first = f[0]
      const last = f[f.length - 1]
      const el = document.activeElement
      if (e.shiftKey) {
        if (el === first || !container.contains(el)) {
          e.preventDefault()
          last.focus()
        }
      } else if (el === last || !container.contains(el)) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      previouslyFocused?.focus?.()
    }
  }, [active, ref])
}
