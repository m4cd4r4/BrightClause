'use client'

import React, { useCallback, useState, useRef, useEffect } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { BrightClauseDemo } from './demo-video/BrightClauseDemo'
import { Play, Pause, SkipBack, Maximize2, Minimize2, X } from 'lucide-react'

// CSS-based "expanded" mode: covers the viewport with a backdrop, no native browser fullscreen

const SCENES = [
  { name: 'Intro', from: 0, duration: 150 },
  { name: 'Problem', from: 150, duration: 150 },
  { name: 'Chat', from: 300, duration: 180 },
  { name: 'Risk', from: 480, duration: 165 },
  { name: 'Obligations', from: 645, duration: 150 },
  { name: 'Deals', from: 795, duration: 165 },
  { name: 'Outro', from: 960, duration: 120 },
] as const
const TOTAL_FRAMES = 1080

interface HeroVideoPlayerProps {
  onDismiss: () => void
}

export const HeroVideoPlayer: React.FC<HeroVideoPlayerProps> = ({ onDismiss }) => {
  const playerRef = useRef<PlayerRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  // Dismiss/collapse on click outside the video card
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (isExpanded) {
          setIsExpanded(false)
        } else {
          onDismiss()
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onDismiss, isExpanded])

  // Sync play state and frame position with player events
  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onFrame = (e: any) => setCurrentFrame(e.detail.frame as number)
    const onEnded = () => onDismiss()

    player.addEventListener('play', onPlay)
    player.addEventListener('pause', onPause)
    player.addEventListener('frameupdate', onFrame)
    player.addEventListener('ended', onEnded)
    return () => {
      player.removeEventListener('play', onPlay)
      player.removeEventListener('pause', onPause)
      player.removeEventListener('frameupdate', onFrame)
      player.removeEventListener('ended', onEnded)
    }
  }, [onDismiss])

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

  // Sync expanded state with native fullscreen changes (e.g. user presses Escape)
  useEffect(() => {
    const onFsChange = () => {
      const fsEl = document.fullscreenElement ?? (document as any).webkitFullscreenElement
      if (!fsEl) setIsExpanded(false)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange)
    }
  }, [])

  const handleToggleExpanded = useCallback(() => {
    const el = containerRef.current as any
    if (!isExpanded && el) {
      const goFullscreen = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el)
      if (goFullscreen) {
        goFullscreen().catch(() => setIsExpanded(true))
        setIsExpanded(true)
      } else {
        // No fullscreen support (e.g. iPhone) — CSS fallback
        setIsExpanded(true)
      }
    } else {
      const exitFs = document.exitFullscreen?.bind(document) ?? (document as any).webkitExitFullscreen?.bind(document)
      if (exitFs && (document.fullscreenElement ?? (document as any).webkitFullscreenElement)) {
        exitFs().catch(() => {})
      }
      setIsExpanded(false)
    }
  }, [isExpanded])

  const activeSceneIndex = SCENES.findLastIndex(s => currentFrame >= s.from)

  return (
    <>
      {/* Backdrop overlay when expanded */}
      {isExpanded && (
        <div className="fixed inset-0 z-40 pointer-events-none" style={{ background: 'rgba(0,0,0,0.7)' }} />
      )}

      <div className={isExpanded ? 'fixed inset-0 z-[60] flex items-center justify-center' : 'relative'}>
        <div
          ref={containerRef}
          className={`relative overflow-hidden flex flex-col ${isExpanded ? 'w-full h-full' : ''}`}
          style={
            isExpanded
              ? { background: 'var(--v3-canvas)' }
              : {
                  background: 'var(--v3-card)',
                  border: '1px solid var(--v3-border)',
                  borderRadius: 'var(--v3-radius-lg)',
                  boxShadow: 'var(--v3-shadow-md)',
                }
          }
        >
          {/* Browser chrome header */}
          <div
            className="flex items-center gap-2 px-4 py-2.5"
            style={{ borderBottom: '1px solid var(--v3-border)', background: 'var(--v3-panel)' }}
          >
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--v3-border-hover)' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--v3-border-hover)' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--v3-border-hover)' }} />
            </div>
            <div className="flex-1 flex justify-center">
              <div
                className="px-4 py-1 text-[11px] v3-mono"
                style={{ background: 'var(--v3-card)', borderRadius: 'var(--v3-radius-sm)', color: 'var(--v3-text-muted)' }}
              >
                brightclause.com - Demo
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 transition-colors"
              style={{ color: 'var(--v3-text-muted)' }}
              aria-label="Close video"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Remotion Player — click to expand/collapse */}
          <div
            className={`cursor-pointer ${isExpanded ? 'flex-1 min-h-0 overflow-hidden' : ''}`}
            onClick={handleToggleExpanded}
            title={isExpanded ? 'Click to exit fullscreen' : 'Click to fullscreen'}
            aria-hidden="true"
          >
            <Player
              ref={playerRef}
              component={BrightClauseDemo}
              compositionWidth={1920}
              compositionHeight={1080}
              durationInFrames={TOTAL_FRAMES}
              fps={30}
              autoPlay
              style={{
                width: '100%',
                height: isExpanded ? '100%' : undefined,
                aspectRatio: isExpanded ? undefined : '16 / 9',
                pointerEvents: 'none',
                display: 'block',
              }}
              controls={false}
            />
          </div>

          {/* Combined scene progress + labels — single row to avoid overlapping touch targets */}
          <div className="flex" style={{ background: 'var(--v3-panel)' }}>
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
                className="relative flex flex-col items-stretch transition-colors overflow-hidden"
                style={{ width: `${widthPct}%`, borderLeft: i > 0 ? '1px solid var(--v3-border)' : undefined }}
                aria-label={`Jump to ${scene.name}`}
              >
                {/* Progress indicator */}
                <div className="relative h-1.5">
                  <div
                    className="absolute inset-0"
                    style={{ background: isPast ? 'rgba(212, 168, 45, 0.5)' : 'var(--v3-card-hover)' }}
                  />
                  {isActive && (
                    <div
                      className="absolute inset-0 origin-left transition-transform duration-100"
                      style={{ transform: `scaleX(${progressInScene / 100})`, background: 'var(--v3-accent)' }}
                    />
                  )}
                </div>
                {/* Label */}
                <span
                  className="v3-mono truncate text-[11px] py-2.5 px-1 text-center"
                  style={{ color: isActive ? 'var(--v3-accent)' : 'var(--v3-text-muted)' }}
                >
                  {scene.name}
                </span>
              </button>
            )
          })}
        </div>

        {/* Controls bar */}
        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{ background: 'var(--v3-panel)', borderTop: '1px solid var(--v3-border)' }}
        >
          <button
            onClick={handleTogglePlay}
            className="p-1.5 transition-colors"
            style={{ color: 'var(--v3-text-secondary)' }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause className="w-3.5 h-3.5" />
              : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleRestart}
            className="p-1.5 transition-colors"
            style={{ color: 'var(--v3-text-secondary)' }}
            aria-label="Restart"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleToggleExpanded}
            className="ml-auto p-1.5 transition-colors"
            style={{ color: 'var(--v3-text-secondary)' }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded
              ? <Minimize2 className="w-3.5 h-3.5" />
              : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

