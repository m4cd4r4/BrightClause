'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Network, Loader2, ZoomIn, ZoomOut, Maximize2, Minimize2,
  RefreshCw, Building2, User, Calendar, DollarSign,
  MapPin, Clock, Percent, FileText, Link2, ChevronRight, Quote, X
} from 'lucide-react'
import { api, Document, GraphData, Entity } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Navigation } from '@/lib/navigation'

const entityTypeConfig: Record<string, { icon: typeof Building2; color: string; bg: string }> = {
  party: { icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500' },
  person: { icon: User, color: 'text-purple-400', bg: 'bg-purple-500' },
  date: { icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500' },
  amount: { icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500' },
  location: { icon: MapPin, color: 'text-red-400', bg: 'bg-red-500' },
  term: { icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500' },
  percentage: { icon: Percent, color: 'text-pink-400', bg: 'bg-pink-500' },
}

interface Node {
  id: string
  label: string
  type: string
  value: string | null
  x: number
  y: number
  vx: number
  vy: number
  fx?: number | null
  fy?: number | null
}

interface Edge {
  id: string
  source: string
  target: string
  type: string
  label: string
}

export default function GraphPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])

  // Use refs for values that need to be accessed in the animation loop
  // This prevents stale closure issues where the RAF loop captures old values
  const zoomRef = useRef(1.0)
  const panRef = useRef({ x: 0, y: 0 })
  const selectedTypesRef = useRef<Set<string>>(new Set())
  const selectedNodeRef = useRef<Node | null>(null)
  const hoveredNodeRef = useRef<Node | null>(null)

  const [contractDoc, setContractDoc] = useState<Document | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [selectedNode, setSelectedNodeState] = useState<Node | null>(null)
  const [hoveredNode, setHoveredNodeState] = useState<Node | null>(null)
  const [selectedTypes, setSelectedTypesState] = useState<Set<string>>(new Set())
  const [zoom, setZoomState] = useState(1.0)
  const [pan, setPanState] = useState({ x: 0, y: 0 })

  // Wrapper functions that update both state and ref
  const setSelectedNode = (node: Node | null) => {
    selectedNodeRef.current = node
    setSelectedNodeState(node)
  }
  const setHoveredNode = (node: Node | null) => {
    hoveredNodeRef.current = node
    setHoveredNodeState(node)
  }
  const setSelectedTypes = (types: Set<string>) => {
    selectedTypesRef.current = types
    setSelectedTypesState(types)
  }
  const setZoom = (zoomOrFn: number | ((prev: number) => number)) => {
    const newZoom = typeof zoomOrFn === 'function' ? zoomOrFn(zoomRef.current) : zoomOrFn
    zoomRef.current = newZoom
    setZoomState(newZoom)
  }
  const setPan = (panOrFn: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
    const newPan = typeof panOrFn === 'function' ? panOrFn(panRef.current) : panOrFn
    panRef.current = newPan
    setPanState(newPan)
  }
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [draggedNode, setDraggedNode] = useState<Node | null>(null)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null)
  const lastPinchDistRef = useRef<number | null>(null)
  const { error: showError } = useToast()

  useEffect(() => {
    loadData()
  }, [documentId])

  const loadData = async () => {
    try {
      const [doc, graph] = await Promise.all([
        api.documents.get(documentId),
        api.graph.get(documentId).catch(() => null),
      ])
      setContractDoc(doc)

      if (graph && graph.nodes.length > 0) {
        setGraphData(graph)
      }
    } catch (error) {
      console.error('Failed to load graph:', error)
      showError('Failed to load knowledge graph data.')
    } finally {
      setLoading(false)
    }
  }

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const extractionStartRef = useRef<number | null>(null)
  const [extractionElapsed, setExtractionElapsed] = useState(0)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current)
    }
  }, [])

  // Track elapsed time during extraction
  useEffect(() => {
    if (extracting) {
      extractionStartRef.current = Date.now()
      setExtractionElapsed(0)
      elapsedIntervalRef.current = setInterval(() => {
        setExtractionElapsed(Math.floor((Date.now() - (extractionStartRef.current ?? Date.now())) / 1000))
      }, 1000)
    } else {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current)
      extractionStartRef.current = null
    }
    return () => {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current)
    }
  }, [extracting])

  const triggerExtraction = async () => {
    setExtracting(true)
    try {
      await api.graph.extract(documentId)
      pollIntervalRef.current = setInterval(async () => {
        const graph = await api.graph.get(documentId).catch(() => null)
        if (graph && graph.nodes.length > 0) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
          setGraphData(graph)
          setExtracting(false)
        }
      }, 3000)
      pollTimeoutRef.current = setTimeout(() => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        setExtracting(false)
      }, 300000)
    } catch (error) {
      console.error('Extraction failed:', error)
      setExtracting(false)
    }
  }

  const initializeGraph = (data: GraphData) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Get logical dimensions from container
    const container = canvas.parentElement
    if (!container) return
    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // Initialize nodes with wide spread + randomization
    nodesRef.current = data.nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / data.nodes.length
      // Wide initial radius filling more of the canvas
      const baseRadius = Math.min(width, height) * 0.35
      const radius = baseRadius * (0.5 + Math.random() * 0.5)
      // Random offset to break symmetry
      const jitterX = (Math.random() - 0.5) * 80
      const jitterY = (Math.random() - 0.5) * 80
      return {
        ...node,
        x: width / 2 + radius * Math.cos(angle) + jitterX,
        y: height / 2 + radius * Math.sin(angle) + jitterY,
        vx: 0,
        vy: 0,
      }
    })

    edgesRef.current = data.edges

    // Start simulation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    runSimulation()
  }

  const runSimulation = useCallback(() => {
    const nodes = nodesRef.current
    const edges = edgesRef.current
    const canvas = canvasRef.current
    if (!canvas || nodes.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Use logical dimensions stored in data attributes
    const width = Number(canvas.dataset.logicalWidth) || canvas.width
    const height = Number(canvas.dataset.logicalHeight) || canvas.height

    // Read current values from refs (not stale closure values)
    const currentZoom = zoomRef.current
    const currentPan = panRef.current
    const currentSelectedTypes = selectedTypesRef.current
    const currentSelectedNode = selectedNodeRef.current
    const currentHoveredNode = hoveredNodeRef.current

    // Force simulation parameters - tuned for spread and stability
    const repulsion = 5000      // Very strong push apart
    const attraction = 0.002    // Weak pull together
    const damping = 0.9         // Higher friction to settle faster
    const centerForce = 0.002   // Light centering to keep graph visible
    const maxVelocity = 5       // Slower movement for stability
    const minDistance = 80      // Larger minimum separation between nodes

    // Apply forces
    nodes.forEach((node) => {
      if (node.fx !== undefined && node.fx !== null) {
        node.x = node.fx
        node.vx = 0
      }
      if (node.fy !== undefined && node.fy !== null) {
        node.y = node.fy
        node.vy = 0
      }

      // Repulsion from other nodes with minimum distance enforcement
      nodes.forEach((other) => {
        if (node.id === other.id) return
        const dx = node.x - other.x
        const dy = node.y - other.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Enforce minimum distance - strong push if too close
        if (dist < minDistance && dist > 0) {
          const pushStrength = (minDistance - dist) * 0.5
          node.vx += (dx / dist) * pushStrength
          node.vy += (dy / dist) * pushStrength
        }

        // Normal repulsion force
        const safeDist = Math.max(dist, 10)
        const force = repulsion / (safeDist * safeDist)
        node.vx += (dx / safeDist) * force
        node.vy += (dy / safeDist) * force
      })

      // Center force
      node.vx += (width / 2 - node.x) * centerForce
      node.vy += (height / 2 - node.y) * centerForce
    })

    // Apply edge attraction
    edges.forEach((edge) => {
      const source = nodes.find((n) => n.id === edge.source)
      const target = nodes.find((n) => n.id === edge.target)
      if (!source || !target) return

      const dx = target.x - source.x
      const dy = target.y - source.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      source.vx += dx * attraction
      source.vy += dy * attraction
      target.vx -= dx * attraction
      target.vy -= dy * attraction
    })

    // Update positions with velocity clamping
    nodes.forEach((node) => {
      if (node.fx === undefined || node.fx === null) {
        node.vx *= damping
        // Clamp velocity
        node.vx = Math.max(-maxVelocity, Math.min(maxVelocity, node.vx))
        node.x += node.vx
      }
      if (node.fy === undefined || node.fy === null) {
        node.vy *= damping
        // Clamp velocity
        node.vy = Math.max(-maxVelocity, Math.min(maxVelocity, node.vy))
        node.y += node.vy
      }

      // Keep in bounds with minimal padding (allow spread)
      node.x = Math.max(40, Math.min(width - 40, node.x))
      node.y = Math.max(40, Math.min(height - 40, node.y))
    })

    // Draw with current ref values
    drawGraph(ctx, nodes, edges, width, height, currentZoom, currentPan, currentSelectedTypes, currentSelectedNode, currentHoveredNode)

    // Check if simulation has settled (total kinetic energy near zero)
    const totalEnergy = nodes.reduce((sum, n) => sum + n.vx * n.vx + n.vy * n.vy, 0)
    if (totalEnergy < 0.01 && nodes.length > 0) {
      // Settled - draw one last time and stop. Restart on interaction.
      return
    }

    animationRef.current = requestAnimationFrame(runSimulation)
  }, []) // No deps needed - we read from refs

  // Restart simulation on zoom/pan/type filter changes
  const kickSimulation = useCallback(() => {
    if (!animationRef.current && nodesRef.current.length > 0) {
      runSimulation()
    }
  }, [runSimulation])

  const drawGraph = (
    ctx: CanvasRenderingContext2D,
    nodes: Node[],
    edges: Edge[],
    width: number,
    height: number,
    currentZoom: number,
    currentPan: { x: number; y: number },
    currentSelectedTypes: Set<string>,
    currentSelectedNode: Node | null,
    currentHoveredNode: Node | null
  ) => {
    const dpr = window.devicePixelRatio || 1

    // Clear canvas (full physical size)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, width * dpr, height * dpr)

    // Apply DPR scaling first, then zoom and pan
    // This ensures crisp rendering on high-DPI displays
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.translate(currentPan.x, currentPan.y)
    ctx.scale(currentZoom, currentZoom)

    // Filter nodes by selected types
    const visibleNodes = currentSelectedTypes.size === 0
      ? nodes
      : nodes.filter((n) => currentSelectedTypes.has(n.type))
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id))

    // Draw edges - visible lines connecting nodes
    edges.forEach((edge) => {
      if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) return

      const source = nodes.find((n) => n.id === edge.source)
      const target = nodes.find((n) => n.id === edge.target)
      if (!source || !target) return

      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      ctx.strokeStyle = 'rgba(99, 102, 106, 0.4)'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Draw nodes - larger dots for better visibility
    const colors: Record<string, string> = {
      party: '#3b82f6',
      person: '#a855f7',
      date: '#10b981',
      amount: '#f59e0b',
      location: '#ef4444',
      term: '#06b6d4',
      percentage: '#ec4899',
    }

    visibleNodes.forEach((node) => {
      const isSelected = currentSelectedNode?.id === node.id
      const isHovered = currentHoveredNode?.id === node.id

      // Node circle - larger and more visible (was 4/6, now 10/14)
      const radius = isSelected ? 14 : isHovered ? 12 : 10
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = colors[node.type] || '#6b7280'
      ctx.fill()

      // Add border for better contrast
      ctx.strokeStyle = isSelected ? '#fbbf24' : 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = isSelected ? 3 : 1.5
      ctx.stroke()

      // Show truncated label below each node
      const label = node.label.length > 16 ? node.label.slice(0, 14) + '..' : node.label
      ctx.fillStyle = 'rgba(226, 232, 240, 0.85)'
      ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(label, node.x, node.y + radius + 5)
    })

    // Show full label for hovered/selected node with background
    const labelNode = currentSelectedNode || currentHoveredNode
    if (labelNode) {
      const node = visibleNodes.find(n => n.id === labelNode.id)
      if (node) {
        const labelText = node.label
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif'
        const textWidth = ctx.measureText(labelText).width

        // Draw background
        ctx.fillStyle = 'rgba(10, 10, 11, 0.9)'
        ctx.fillRect(node.x - textWidth/2 - 6, node.y - 28, textWidth + 12, 20)

        // Draw label text above node
        ctx.fillStyle = '#f1f5f9'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(labelText, node.x, node.y - 18)
      }
    }
  }

  // Canvas event handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const currentZoom = zoomRef.current
    const currentPan = panRef.current
    const x = (e.clientX - rect.left - currentPan.x) / currentZoom
    const y = (e.clientY - rect.top - currentPan.y) / currentZoom

    // Check if clicking on a node (generous hitbox)
    const clickedNode = nodesRef.current.find((node) => {
      const dx = node.x - x
      const dy = node.y - y
      return Math.sqrt(dx * dx + dy * dy) < 25
    })

    if (clickedNode) {
      setDraggedNode(clickedNode)
      clickedNode.fx = clickedNode.x
      clickedNode.fy = clickedNode.y
      setSelectedNode(clickedNode)
      kickSimulation()
    } else {
      setIsDragging(true)
      setDragStart({ x: e.clientX - currentPan.x, y: e.clientY - currentPan.y })
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const currentZoom = zoomRef.current
    const currentPan = panRef.current
    const x = (e.clientX - rect.left - currentPan.x) / currentZoom
    const y = (e.clientY - rect.top - currentPan.y) / currentZoom

    if (draggedNode) {
      draggedNode.fx = x
      draggedNode.fy = y
      kickSimulation()
    } else if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    } else {
      // Check for hover on nodes
      const hovered = nodesRef.current.find((node) => {
        const dx = node.x - x
        const dy = node.y - y
        return Math.sqrt(dx * dx + dy * dy) < 25
      })
      setHoveredNode(hovered || null)
    }
  }

  const handleCanvasMouseUp = () => {
    if (draggedNode) {
      draggedNode.fx = null
      draggedNode.fy = null
      setDraggedNode(null)
    }
    setIsDragging(false)
  }

  const handleCanvasMouseLeave = () => {
    handleCanvasMouseUp()
    setHoveredNode(null)
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.3, Math.min(3, zoomRef.current * delta))
    setZoom(newZoom)
  }

  // Touch event handlers for mobile
  const getTouchCanvasCoords = (touch: React.Touch) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const currentZoom = zoomRef.current
    const currentPan = panRef.current
    return {
      x: (touch.clientX - rect.left - currentPan.x) / currentZoom,
      y: (touch.clientY - rect.top - currentPan.y) / currentZoom,
    }
  }

  const getPinchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      // Pinch zoom start - track initial distance
      lastPinchDistRef.current = getPinchDistance(e.touches)
      lastTouchRef.current = null
      return
    }

    if (e.touches.length !== 1) return

    const touch = e.touches[0]
    const { x, y } = getTouchCanvasCoords(touch)
    const currentPan = panRef.current

    const clickedNode = nodesRef.current.find((node) => {
      const dx = node.x - x
      const dy = node.y - y
      return Math.sqrt(dx * dx + dy * dy) < 30 // slightly larger hitbox for fingers
    })

    if (clickedNode) {
      setDraggedNode(clickedNode)
      clickedNode.fx = clickedNode.x
      clickedNode.fy = clickedNode.y
      setSelectedNode(clickedNode)
      setMobileSheetOpen(true)
      kickSimulation()
      lastTouchRef.current = null
    } else {
      lastTouchRef.current = { x: touch.clientX - currentPan.x, y: touch.clientY - currentPan.y }
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    if (e.touches.length === 2) {
      // Pinch zoom
      const dist = getPinchDistance(e.touches)
      if (lastPinchDistRef.current !== null) {
        const scale = dist / lastPinchDistRef.current
        const newZoom = Math.max(0.3, Math.min(3, zoomRef.current * scale))
        setZoom(newZoom)
      }
      lastPinchDistRef.current = dist
      return
    }

    if (e.touches.length !== 1) return

    const touch = e.touches[0]
    const { x, y } = getTouchCanvasCoords(touch)

    if (draggedNode) {
      draggedNode.fx = x
      draggedNode.fy = y
      kickSimulation()
    } else if (lastTouchRef.current) {
      setPan({
        x: touch.clientX - lastTouchRef.current.x,
        y: touch.clientY - lastTouchRef.current.y,
      })
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) {
      // All fingers lifted
      if (draggedNode) {
        draggedNode.fx = null
        draggedNode.fy = null
        setDraggedNode(null)
      }
      lastTouchRef.current = null
      lastPinchDistRef.current = null
    } else if (e.touches.length === 1) {
      // Went from 2 fingers to 1 - reset to pan mode
      lastPinchDistRef.current = null
      const touch = e.touches[0]
      const currentPan = panRef.current
      lastTouchRef.current = { x: touch.clientX - currentPan.x, y: touch.clientY - currentPan.y }
    }
  }

  const resetView = () => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
    setSelectedNode(null)
    setSelectedTypes(new Set())
  }

  const toggleType = (type: string) => {
    const newTypes = new Set(selectedTypes)
    if (newTypes.has(type)) {
      newTypes.delete(type)
    } else {
      newTypes.add(type)
    }
    setSelectedTypes(newTypes)
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } catch (err) {
        console.error('Failed to enter fullscreen:', err)
      }
    } else {
      try {
        await document.exitFullscreen()
        setIsFullscreen(false)
      } catch (err) {
        console.error('Failed to exit fullscreen:', err)
      }
    }
  }

  // Listen for fullscreen changes (e.g., user presses Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Set canvas size and initialize graph when data is ready
  useEffect(() => {
    if (!graphData || graphData.nodes.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (!container) return
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      // Store logical size as data attributes for reference
      canvas.dataset.logicalWidth = String(rect.width)
      canvas.dataset.logicalHeight = String(rect.height)

      // Set physical canvas size (multiplied by DPR for crisp pixels)
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)

      // Set CSS size to match container
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    // Size canvas first, then initialize graph
    resizeCanvas()
    initializeGraph(graphData)

    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [graphData])

  // Cleanup animation
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto" />
          <p className="mt-4 text-ink-400">Loading knowledge graph...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`min-h-screen flex flex-col bg-ink-950 ${isFullscreen ? 'fullscreen-container' : ''}`}
         style={isFullscreen ? { width: '100vw', height: '100vh' } : undefined}>
      <Navigation>
        {graphData && (
          <div className="hidden sm:flex items-center gap-3 text-sm text-ink-400">
            <span className="font-mono text-[11px]">{graphData.stats.total_entities} entities</span>
            <span className="text-ink-600">|</span>
            <span className="font-mono text-[11px]">{graphData.stats.total_relationships} rels</span>
          </div>
        )}
        <button
          onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
          className="p-2 hover:bg-ink-800 rounded-lg transition-colors" title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-ink-400" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z * 0.8))}
          className="p-2 hover:bg-ink-800 rounded-lg transition-colors" title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-ink-400" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-ink-800 rounded-lg transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-ink-400" /> : <Maximize2 className="w-4 h-4 text-ink-400" />}
        </button>
        <button onClick={resetView} className="p-2 hover:bg-ink-800 rounded-lg transition-colors" title="Reset View">
          <RefreshCw className="w-4 h-4 text-ink-400" />
        </button>
        <Link
          href={`/documents/${documentId}`}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 text-ink-200 rounded-lg hover:bg-ink-700 transition-colors text-sm"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Clauses</span>
        </Link>
      </Navigation>

      {/* Mobile Entity Type Filter - horizontal scroll chips */}
      {graphData && graphData.nodes.length > 0 && (
        <div className="md:hidden border-b border-ink-800/50 px-3 py-2 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {Object.entries(entityTypeConfig).map(([type, config]) => {
              const count = graphData.stats.entity_types[type] || 0
              if (count === 0) return null
              const active = selectedTypes.has(type) || selectedTypes.size === 0
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors
                    ${active ? 'bg-ink-800 text-ink-200' : 'bg-ink-900/50 text-ink-500'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${config.bg}`} />
                  <span className="capitalize">{type}</span>
                  <span className="font-mono text-ink-500">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Entity Type Filter */}
        <aside className="hidden md:block w-64 border-r border-ink-800/50 p-4">
          <h3 className="text-sm font-medium text-ink-400 mb-4">Entity Types</h3>
          <div className="space-y-2">
            {Object.entries(entityTypeConfig).map(([type, config]) => {
              const Icon = config.icon
              const count = graphData?.stats.entity_types[type] || 0
              if (count === 0) return null

              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors
                            ${selectedTypes.has(type) || selectedTypes.size === 0
                              ? 'bg-ink-800/50'
                              : 'opacity-40 hover:opacity-70'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.bg}`} />
                    <span className="text-sm capitalize">{type}</span>
                  </div>
                  <span className="text-xs font-mono text-ink-500">{count}</span>
                </button>
              )
            })}
          </div>

          {/* Selected Node Details - Enhanced */}
          <AnimatePresence>
            {selectedNode && graphData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 pt-6 border-t border-ink-800/50 space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto"
              >
                <h3 className="text-sm font-medium text-ink-400">Selected Entity</h3>

                {/* Entity Info */}
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${entityTypeConfig[selectedNode.type]?.bg || 'bg-gray-500'}`} />
                    <span className="text-xs uppercase tracking-wider text-ink-500">{selectedNode.type}</span>
                  </div>
                  <p className="font-semibold text-ink-100 text-lg">{selectedNode.label}</p>
                  {selectedNode.value && selectedNode.value !== selectedNode.label && (
                    <p className="text-sm text-ink-400 mt-2 italic">{selectedNode.value}</p>
                  )}
                </div>

                {/* Connected Relationships */}
                {(() => {
                  const connectedEdges = graphData.edges.filter(
                    e => e.source === selectedNode.id || e.target === selectedNode.id
                  )
                  if (connectedEdges.length === 0) return null

                  return (
                    <div>
                      <h4 className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Link2 className="w-3 h-3" />
                        Relationships ({connectedEdges.length})
                      </h4>
                      <div className="space-y-2">
                        {connectedEdges.slice(0, 8).map((edge) => {
                          const isSource = edge.source === selectedNode.id
                          const otherId = isSource ? edge.target : edge.source
                          const otherNode = graphData.nodes.find(n => n.id === otherId)
                          if (!otherNode) return null

                          return (
                            <button
                              key={edge.id}
                              onClick={() => {
                                const targetNode = nodesRef.current.find(n => n.id === otherId)
                                if (targetNode) setSelectedNode(targetNode)
                              }}
                              className="w-full text-left p-2.5 bg-ink-900/50 hover:bg-ink-800/70 rounded-lg transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${entityTypeConfig[otherNode.type]?.bg || 'bg-gray-500'}`} />
                                  <span className="text-sm text-ink-200 truncate">{otherNode.label}</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-ink-600 group-hover:text-accent flex-shrink-0" />
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-500">
                                <span className="uppercase">{otherNode.type}</span>
                                {edge.label && edge.label !== 'relates_to' && (
                                  <>
                                    <span>•</span>
                                    <span className="text-accent/70">{edge.label.replace(/_/g, ' ')}</span>
                                  </>
                                )}
                              </div>
                            </button>
                          )
                        })}
                        {connectedEdges.length > 8 && (
                          <p className="text-xs text-ink-500 text-center py-1">
                            +{connectedEdges.length - 8} more connections
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Entity Value/Context */}
                {selectedNode.value && selectedNode.value.length > 30 && (
                  <div>
                    <h4 className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Quote className="w-3 h-3" />
                      Context
                    </h4>
                    <div className="p-3 bg-ink-900/30 rounded-lg border border-ink-800/50">
                      <p className="text-xs text-ink-400 leading-relaxed">
                        {selectedNode.value}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Stats for this entity */}
                {(() => {
                  const connectedCount = graphData.edges.filter(
                    e => e.source === selectedNode.id || e.target === selectedNode.id
                  ).length
                  const sameTypeCount = graphData.nodes.filter(n => n.type === selectedNode.type).length

                  return (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-ink-900/30 rounded-lg text-center">
                        <p className="text-lg font-bold font-mono text-ink-200">{connectedCount}</p>
                        <p className="text-[11px] text-ink-500 uppercase">Connections</p>
                      </div>
                      <div className="p-2.5 bg-ink-900/30 rounded-lg text-center">
                        <p className="text-lg font-bold font-mono text-ink-200">{sameTypeCount}</p>
                        <p className="text-[11px] text-ink-500 uppercase">Same Type</p>
                      </div>
                    </div>
                  )
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-ink-950">
          {graphData && graphData.nodes.length > 0 ? (
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={`Knowledge graph visualization showing ${graphData?.stats.total_entities || 0} entities and ${graphData?.stats.total_relationships || 0} relationships`}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseLeave}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Network className="w-12 h-12 text-ink-600 mx-auto" />
                <h3 className="font-display text-lg font-semibold mt-4">No Entities Extracted</h3>
                <p className="text-ink-500 mt-2 max-w-md text-sm leading-relaxed">
                  Extract parties, dates, monetary amounts, and other key entities from
                  {contractDoc ? ` "${contractDoc.filename}"` : ' this document'} to build
                  an interactive relationship graph.
                </p>
                <button
                  onClick={triggerExtraction}
                  disabled={extracting}
                  className="mt-6 btn-primary"
                >
                  {extracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Analyzing{extractionElapsed > 0 ? ` · ${extractionElapsed}s` : '...'}
                    </>
                  ) : (
                    <>
                      <Network className="w-4 h-4 mr-2" />
                      Build Knowledge Graph
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Zoom indicator */}
          <div className="absolute bottom-4 right-4 px-3 py-1 bg-ink-900/80 rounded-lg text-xs text-ink-400">
            {Math.round(zoom * 100)}%
          </div>

          {/* Mobile bottom sheet for selected node */}
          <AnimatePresence>
            {selectedNode && mobileSheetOpen && graphData && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="md:hidden absolute bottom-0 inset-x-0 bg-ink-900 border-t border-ink-700/50 rounded-t-2xl max-h-[60vh] overflow-y-auto z-10"
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 rounded-full bg-ink-600" />
                </div>

                <div className="px-4 pb-4 space-y-3">
                  {/* Header with close button */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${entityTypeConfig[selectedNode.type]?.bg || 'bg-gray-500'}`} />
                      <span className="text-xs uppercase tracking-wider text-ink-500">{selectedNode.type}</span>
                    </div>
                    <button
                      onClick={() => {
                        setMobileSheetOpen(false)
                        setSelectedNode(null)
                      }}
                      className="p-1 hover:bg-ink-800 rounded-lg"
                    >
                      <X className="w-4 h-4 text-ink-400" />
                    </button>
                  </div>

                  <p className="font-semibold text-ink-100 text-lg">{selectedNode.label}</p>
                  {selectedNode.value && selectedNode.value !== selectedNode.label && (
                    <p className="text-sm text-ink-400 italic">{selectedNode.value}</p>
                  )}

                  {/* Connected relationships */}
                  {(() => {
                    const connectedEdges = graphData.edges.filter(
                      e => e.source === selectedNode.id || e.target === selectedNode.id
                    )
                    if (connectedEdges.length === 0) return null

                    return (
                      <div>
                        <h4 className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Link2 className="w-3 h-3" />
                          Relationships ({connectedEdges.length})
                        </h4>
                        <div className="space-y-1.5">
                          {connectedEdges.slice(0, 6).map((edge) => {
                            const isSource = edge.source === selectedNode.id
                            const otherId = isSource ? edge.target : edge.source
                            const otherNode = graphData.nodes.find(n => n.id === otherId)
                            if (!otherNode) return null

                            return (
                              <button
                                key={edge.id}
                                onClick={() => {
                                  const targetNode = nodesRef.current.find(n => n.id === otherId)
                                  if (targetNode) setSelectedNode(targetNode)
                                }}
                                className="w-full text-left p-2 bg-ink-800/50 hover:bg-ink-800 rounded-lg transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${entityTypeConfig[otherNode.type]?.bg || 'bg-gray-500'}`} />
                                    <span className="text-sm text-ink-200 truncate">{otherNode.label}</span>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-ink-600 flex-shrink-0" />
                                </div>
                                {edge.label && edge.label !== 'relates_to' && (
                                  <span className="text-[11px] text-accent/70 mt-0.5 block">{edge.label.replace(/_/g, ' ')}</span>
                                )}
                              </button>
                            )
                          })}
                          {connectedEdges.length > 6 && (
                            <p className="text-xs text-ink-500 text-center py-1">
                              +{connectedEdges.length - 6} more
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Quick stats */}
                  {(() => {
                    const connectedCount = graphData.edges.filter(
                      e => e.source === selectedNode.id || e.target === selectedNode.id
                    ).length
                    const sameTypeCount = graphData.nodes.filter(n => n.type === selectedNode.type).length

                    return (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-ink-800/30 rounded-lg text-center">
                          <p className="text-lg font-bold font-mono text-ink-200">{connectedCount}</p>
                          <p className="text-[11px] text-ink-500 uppercase">Connections</p>
                        </div>
                        <div className="p-2 bg-ink-800/30 rounded-lg text-center">
                          <p className="text-lg font-bold font-mono text-ink-200">{sameTypeCount}</p>
                          <p className="text-[11px] text-ink-500 uppercase">Same Type</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
