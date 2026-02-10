'use client'

import { useCallback, useEffect, useState } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { ContractClarityDemo } from './demo-video/ContractClarityDemo'
import { X, RotateCcw, Play, Pause, SkipBack } from 'lucide-react'
import React from 'react'

interface DemoVideoModalProps {
  open: boolean
  onClose: () => void
}

export const DemoVideoModal: React.FC<DemoVideoModalProps> = ({ open, onClose }) => {
  const playerRef = React.useRef<PlayerRef>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)

  // Detect portrait orientation on mobile
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerWidth < 768 && window.innerHeight > window.innerWidth)
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    return () => window.removeEventListener('resize', checkOrientation)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Auto-play when opened
  useEffect(() => {
    if (open) {
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }
  }, [open])

  const handleTogglePlay = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    if (isPlaying) {
      player.pause()
    } else {
      player.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleRestart = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    player.seekTo(0)
    player.play()
    setIsPlaying(true)
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Content */}
      <div
        className="relative w-full max-w-6xl mx-4 sm:mx-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 sm:right-0 p-2 text-ink-400 hover:text-white transition-colors z-10"
          aria-label="Close video"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Portrait rotation hint */}
        {isPortrait && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ink-950/95 rounded-2xl gap-4">
            <RotateCcw className="w-12 h-12 text-accent animate-spin" style={{ animationDuration: '3s' }} />
            <p className="text-ink-300 text-center text-lg font-medium px-8">
              Rotate your device for the best experience
            </p>
            <button
              onClick={() => setIsPortrait(false)}
              className="mt-2 px-4 py-2 text-sm text-ink-500 hover:text-ink-300 transition-colors"
            >
              Watch anyway
            </button>
          </div>
        )}

        {/* Player container */}
        <div className="rounded-2xl overflow-hidden border border-ink-800/50 shadow-2xl shadow-black/50 bg-[#06060a]">
          <Player
            ref={playerRef}
            component={ContractClarityDemo}
            compositionWidth={1920}
            compositionHeight={1080}
            durationInFrames={1350}
            fps={30}
            autoPlay={true}
            loop
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
            }}
            controls={false}
          />

          {/* Custom controls */}
          <div className="flex items-center gap-3 px-4 py-3 bg-ink-950 border-t border-ink-800/50">
            <button
              onClick={handleTogglePlay}
              className="p-1.5 text-ink-400 hover:text-white transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={handleRestart}
              className="p-1.5 text-ink-400 hover:text-white transition-colors"
              aria-label="Restart"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <span className="ml-auto text-xs text-ink-600 font-mono">
              45s — Live React Animation
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
