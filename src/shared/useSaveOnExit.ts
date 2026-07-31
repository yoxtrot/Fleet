import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router-dom'

type UseSaveOnExitOptions = {
  isDirty: boolean
  /** Persist current form values. Return true to allow navigation. */
  onSave: () => Promise<boolean>
}

/**
 * Saves dirty form state when leaving the page (in-app navigation).
 * Call `exitAndSave(path)` for explicit Done/back actions.
 */
export function useSaveOnExit({ isDirty, onSave }: UseSaveOnExitOptions) {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const skipBlockRef = useRef(false)
  const onSaveRef = useRef(onSave)
  const isDirtyRef = useRef(isDirty)

  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (skipBlockRef.current) return false
    if (!isDirtyRef.current || isSaving) return false
    return currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search
  })

  const blockerSaveInFlightRef = useRef(false)

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (blockerSaveInFlightRef.current) return

    let cancelled = false
    blockerSaveInFlightRef.current = true

    void (async () => {
      setIsSaving(true)
      try {
        const ok = await onSaveRef.current()
        if (cancelled) return
        if (ok) {
          skipBlockRef.current = true
          blocker.proceed()
        } else {
          blocker.reset()
        }
      } catch {
        if (!cancelled) blocker.reset()
      } finally {
        blockerSaveInFlightRef.current = false
        if (!cancelled) setIsSaving(false)
        // Allow the next navigation attempt to block again if still dirty.
        queueMicrotask(() => {
          skipBlockRef.current = false
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [blocker])

  const exitAndSave = useCallback(
    async (path: string | (() => string)) => {
      if (isDirtyRef.current) {
        setIsSaving(true)
        try {
          const ok = await onSaveRef.current()
          if (!ok) return
        } finally {
          setIsSaving(false)
        }
      }
      const destination = typeof path === 'function' ? path() : path
      skipBlockRef.current = true
      navigate(destination)
    },
    [navigate],
  )

  return { isSaving, exitAndSave }
}

export function snapshotsDiffer<T>(current: T, baseline: T) {
  return JSON.stringify(current) !== JSON.stringify(baseline)
}
