"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function useThemeDebug() {
  const { theme, resolvedTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [debugInfo, setDebugInfo] = useState<{
    storedTheme: string | null
    documentClass: string
    systemPreference: string
  }>({
    storedTheme: null,
    documentClass: '',
    systemPreference: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    const updateDebugInfo = () => {
      const storedTheme = localStorage.getItem('hunkcentral-theme')
      const documentClass = document.documentElement.className
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

      setDebugInfo({
        storedTheme,
        documentClass,
        systemPreference
      })
    }

    updateDebugInfo()

    // Listen for theme changes
    const observer = new MutationObserver(updateDebugInfo)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateDebugInfo)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', updateDebugInfo)
    }
  }, [mounted])

  const validateThemeConsistency = () => {
    if (!mounted) return { isConsistent: true, issues: [] }

    const issues: string[] = []
    const { storedTheme, documentClass, systemPreference } = debugInfo

    // Check if stored theme matches current theme
    if (storedTheme && storedTheme !== theme) {
      issues.push(`Stored theme (${storedTheme}) doesn't match current theme (${theme})`)
    }

    // Check if document class reflects the resolved theme
    const expectedClass = resolvedTheme === 'dark' ? 'dark' : ''
    const hasCorrectClass = expectedClass ? documentClass.includes('dark') : !documentClass.includes('dark')
    
    if (!hasCorrectClass) {
      issues.push(`Document class (${documentClass}) doesn't reflect resolved theme (${resolvedTheme})`)
    }

    // Check system theme consistency
    if (theme === 'system' && systemTheme !== systemPreference) {
      issues.push(`System theme mismatch: detected (${systemTheme}) vs actual (${systemPreference})`)
    }

    return {
      isConsistent: issues.length === 0,
      issues
    }
  }

  return {
    mounted,
    theme,
    resolvedTheme,
    systemTheme,
    debugInfo,
    validateThemeConsistency,
    // Helper to force theme refresh
    refreshTheme: () => {
      if (typeof window !== 'undefined') {
        const event = new StorageEvent('storage', {
          key: 'hunkcentral-theme',
          newValue: localStorage.getItem('hunkcentral-theme'),
          storageArea: localStorage
        })
        window.dispatchEvent(event)
      }
    }
  }
}