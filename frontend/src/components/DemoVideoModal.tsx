'use client'

import { useCallback, useEffect, useState } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { BrightClauseDemo } from './demo-video/BrightClauseDemo'
import { X, RotateCcw, Play, Pause, SkipBack } from 'lucide-react'
import React from 'react'

const SCENES = [
  { name: 'Intro', from: 0, duration: 150 },
  { name: 'Problem', from: 150, duration: 210 },
  { name: 'Chat', from: 360, duration: 210 },
  { name: 'Risk', from: 570, duration: 210 },
  { name: 'Obligations', from: 780, duration: 210 },
  { name: 'Deals', from: 990, duration: 210 },
  { name: 'Outro', from: 1200, duration: 150 },
] as const
const TOTAL_FRAMES = 1350

interface DemoVideoModalProps {
  open: boolean
  onClose: () => void
}

export const DemoVideoModal: React.FC<DemoVideoModalProps> = ({ open, onClose }) => {
  const playerRef = React.useRef<PlayerRef>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)

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

  // Sync play state and frame position
  useEffect(() => {
    if (open) {
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
      setCurrentFrame(0)
    }
  }, [open])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFrame = (e: any) => setCurrentFrame(e.detail.frame as number)

    player.addEventListener('play', onPlay)
    player.addEventListener('pause', onPause)
    player.addEventListener('frameupdate', onFrame)
    return () => {
      player.removeEventListener('play', onPlay)
      player.removeEventListener('pause', onPause)
      player.removeEventListener('frameupdate', onFrame)
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
  }, [isPlaying])

  const handleRestart = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    player.seekTo(0)
    player.play()
  }, [])

  const handleSeekToScene = useCallback((frame: number) => {
    const player = playerRef.current
    if (!player) return
    player.seekTo(frame)
    player.play()
  }, [])

  const activeSceneIndex = SCENES.findLastIndex(s => currentFrame >= s.from)

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
            component={BrightClauseDemo}
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

          {/* Segmented scene progress bar */}
          <div className="flex h-1.5 bg-ink-900">
            {SCENES.map((scene, i) => {
              const widthPct = (scene.duration / TOTAL_FRAMES) * 100
              const isActive = i === activeSceneIndex
              const isPast = i < activeSceneIndex
              const progressInScene = isActive
                ? Math.min(((currentFrame - scene.from) / scene.duration) * 100, 100)
                : 0
              return (
                <button
                  key={scene.name}
                  onClick={() => handleSeekToScene(scene.from)}
                  className="relative h-full cursor-pointer"
                  style={{ width: `${widthPct}%` }}
                  aria-label={`Jump to ${scene.name}`}
                >
                  <div className={`absolute inset-0 ${isPast ? 'bg-accent/50' : 'bg-ink-800/40'}`} />
                  {isActive && (
                    <div
                      className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-100"
                      style={{ width: `${progressInScene}%` }}
                    />
                  )}
                  {i > 0 && <div className="absolute left-0 inset-y-0 w-px bg-ink-700/30" />}
                </button>
              )
            })}
          </div>

          {/* Scene labels */}
          <div className="flex bg-ink-950/80 border-t border-ink-800/20">
            {SCENES.map((scene, i) => {
              const widthPct = (scene.duration / TOTAL_FRAMES) * 100
              const isActive = i === activeSceneIndex
              return (
                <button
                  key={scene.name}
                  onClick={() => handleSeekToScene(scene.from)}
                  className={`text-[10px] sm:text-xs font-mono py-2 transition-colors truncate
                    ${isActive ? 'text-accent font-bold' : 'text-ink-600 hover:text-ink-300'}`}
                  style={{ width: `${widthPct}%` }}
                >
                  {scene.name}
                </button>
              )
            })}
          </div>

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
