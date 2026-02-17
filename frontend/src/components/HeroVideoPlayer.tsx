'use client'

import React, { useCallback, useState, useRef, useEffect } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { ClauseLensDemo } from './demo-video/ClauseLensDemo'
import { Play, Pause, SkipBack, Maximize2, Minimize2, X } from 'lucide-react'

const SCENES = [
  { name: 'Intro', from: 0, duration: 110 },
  { name: 'Problem', from: 110, duration: 155 },
  { name: 'Chat', from: 265, duration: 185 },
  { name: 'Risk', from: 450, duration: 155 },
  { name: 'Obligations', from: 605, duration: 140 },
  { name: 'Deals', from: 745, duration: 145 },
  { name: 'Outro', from: 890, duration: 110 },
] as const
const TOTAL_FRAMES = 1000

interface HeroVideoPlayerProps {
  onDismiss: () => void
}

export const HeroVideoPlayer: React.FC<HeroVideoPlayerProps> = ({ onDismiss }) => {
  const playerRef = useRef<PlayerRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Dismiss on click outside the video card (skip when fullscreen)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (document.fullscreenElement) return
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onDismiss()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onDismiss])

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

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

  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }, [])

  const activeSceneIndex = SCENES.findLastIndex(s => currentFrame >= s.from)

  return (
    <div className="relative">
      {/* Glow behind video (hidden in fullscreen) */}
      {!isFullscreen && (
        <div className="absolute -inset-10 bg-accent/5 blur-[80px] rounded-full pointer-events-none" />
      )}

      <div
        ref={containerRef}
        className={`relative bg-ink-950 overflow-hidden flex flex-col
          ${isFullscreen
            ? 'w-screen h-screen'
            : 'bg-ink-950/80 border border-ink-700/40 rounded-2xl backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(201,162,39,0.05)]'
          }`}
      >
        {/* Browser chrome header (hidden in fullscreen) */}
        {!isFullscreen && (
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ink-800/40 bg-ink-900/60">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1 bg-ink-800/50 rounded-md text-[10px] text-ink-500 font-mono">
                clauselens.com — Demo
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 text-ink-600 hover:text-ink-300 transition-colors"
              aria-label="Close video"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Remotion Player — fills remaining space in fullscreen */}
        <div className={isFullscreen ? 'flex-1 min-h-0' : ''}>
          <Player
            ref={playerRef}
            component={ClauseLensDemo}
            compositionWidth={1920}
            compositionHeight={1080}
            durationInFrames={1000}
            fps={30}
            autoPlay
            style={{
              width: '100%',
              height: isFullscreen ? '100%' : undefined,
              aspectRatio: isFullscreen ? undefined : '16 / 9',
            }}
            controls={false}
          />
        </div>

        {/* Segmented scene progress bar */}
        <div className={`flex bg-ink-900/80 ${isFullscreen ? 'h-2' : 'h-1'}`}>
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
                className="relative h-full transition-colors"
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
        <div className="flex bg-ink-950/60 border-t border-ink-800/20">
          {SCENES.map((scene, i) => {
            const widthPct = (scene.duration / TOTAL_FRAMES) * 100
            const isActive = i === activeSceneIndex
            return (
              <button
                key={scene.name}
                onClick={() => handleSeekToScene(scene.from)}
                className={`font-mono transition-colors truncate
                  ${isFullscreen ? 'text-xs py-2' : 'text-[9px] py-1.5'}
                  ${isActive ? 'text-accent' : 'text-ink-600 hover:text-ink-400'}`}
                style={{ width: `${widthPct}%` }}
              >
                {scene.name}
              </button>
            )
          })}
        </div>

        {/* Controls bar */}
        <div className={`flex items-center gap-2 bg-ink-950/80 border-t border-ink-800/40
          ${isFullscreen ? 'px-6 py-3' : 'px-4 py-2'}`}>
          <button
            onClick={handleTogglePlay}
            className="p-1.5 text-ink-500 hover:text-white transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause className={isFullscreen ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
              : <Play className={isFullscreen ? 'w-5 h-5' : 'w-3.5 h-3.5'} />}
          </button>
          <button
            onClick={handleRestart}
            className="p-1.5 text-ink-500 hover:text-white transition-colors"
            aria-label="Restart"
          >
            <SkipBack className={isFullscreen ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
          </button>

          <span className={`ml-auto font-mono text-ink-600 ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>
            Live React Animation
          </span>

          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 text-ink-500 hover:text-accent transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen
              ? <Minimize2 className="w-5 h-5" />
              : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
