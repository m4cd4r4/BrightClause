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
import { V3Shell } from '@/components/v3/shell'
import { PageHeader } from '@/components/v3/primitives'

const entityTypeConfig: Record<string, { icon: typeof Building2; dot: string }> = {
  party: { icon: Building2, dot: '#3b82f6' },
  person: { icon: User, dot: '#a855f7' },
  date: { icon: Calendar, dot: '#10b981' },
  amount: { icon: DollarSign, dot: '#f59e0b' },
  location: { icon: MapPin, dot: '#ef4444' },
  term: { icon: Clock, dot: '#06b6d4' },
  percentage: { icon: Percent, dot: '#ec4899' },
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
      <V3Shell>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 size={40} color="var(--v3-accent)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ marginTop: 16, color: 'var(--v3-text-muted)' }}>Loading knowledge graph...</p>
          </div>
        </div>
      </V3Shell>
    )
  }

  return (
    <V3Shell>
      <div
        ref={containerRef}
        style={isFullscreen
          ? { width: '100vw', height: '100vh', background: 'var(--v3-canvas)', display: 'flex', flexDirection: 'column' }
          : { background: 'var(--v3-canvas)', display: 'flex', flexDirection: 'column' }}
      >
        <PageHeader
          crumb="Workspace · Document"
          title="Knowledge Graph"
          subtitle={graphData
            ? `${graphData.stats.total_entities} entities · ${graphData.stats.total_relationships} relationships`
            : contractDoc ? contractDoc.filename : undefined}
          actions={
            <>
              <button
                onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
                className="v3-btn v3-btn-ghost"
                style={{ padding: '0 10px' }}
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.3, z * 0.8))}
                className="v3-btn v3-btn-ghost"
                style={{ padding: '0 10px' }}
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={toggleFullscreen}
                className="v3-btn v3-btn-ghost"
                style={{ padding: '0 10px' }}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button onClick={resetView} className="v3-btn v3-btn-ghost" style={{ padding: '0 10px' }} title="Reset View">
                <RefreshCw size={16} />
              </button>
              <Link href={`/documents/${documentId}`} className="v3-btn">
                <FileText size={14} />
                <span>Clauses</span>
              </Link>
            </>
          }
        />

        {/* Mobile Entity Type Filter - horizontal scroll chips */}
        {graphData && graphData.nodes.length > 0 && (
          <div className="md:hidden" style={{ borderBottom: '1px solid var(--v3-border)', padding: '8px 12px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 'max-content' }}>
              {Object.entries(entityTypeConfig).map(([type, config]) => {
                const count = graphData.stats.entity_types[type] || 0
                if (count === 0) return null
                const active = selectedTypes.has(type) || selectedTypes.size === 0
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                      borderRadius: 999, fontSize: 12, whiteSpace: 'nowrap', cursor: 'pointer',
                      border: '1px solid var(--v3-border)',
                      background: active ? 'var(--v3-card)' : 'transparent',
                      color: active ? 'var(--v3-text-primary)' : 'var(--v3-text-muted)',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: config.dot }} />
                    <span style={{ textTransform: 'capitalize' }}>{type}</span>
                    <span className="v3-mono" style={{ color: 'var(--v3-text-muted)' }}>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 16 }}>
          {/* Entity Type Filter */}
          <aside className="hidden md:block" style={{ width: 256, flexShrink: 0 }}>
            <div className="v3-card" style={{ padding: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--v3-text-secondary)', marginBottom: 12 }}>Entity Types</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(entityTypeConfig).map(([type, config]) => {
                  const count = graphData?.stats.entity_types[type] || 0
                  if (count === 0) return null

                  const active = selectedTypes.has(type) || selectedTypes.size === 0
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 'var(--v3-radius-sm)', cursor: 'pointer',
                        border: 'none', background: active ? 'var(--v3-card-hover)' : 'transparent',
                        opacity: active ? 1 : 0.45, color: 'inherit',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 999, background: config.dot }} />
                        <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{type}</span>
                      </div>
                      <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>{count}</span>
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
                    style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--v3-border)', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}
                  >
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--v3-text-secondary)', margin: 0 }}>Selected Entity</h3>

                    {/* Entity Info */}
                    <div className="v3-card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 999, background: entityTypeConfig[selectedNode.type]?.dot || '#6b7280' }} />
                        <span className="v3-mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v3-text-muted)' }}>{selectedNode.type}</span>
                      </div>
                      <p style={{ fontWeight: 600, color: 'var(--v3-text-primary)', fontSize: 18, margin: 0 }}>{selectedNode.label}</p>
                      {selectedNode.value && selectedNode.value !== selectedNode.label && (
                        <p style={{ fontSize: 13, color: 'var(--v3-text-muted)', marginTop: 8, fontStyle: 'italic' }}>{selectedNode.value}</p>
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
                          <h4 className="v3-mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--v3-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Link2 size={12} />
                            Relationships ({connectedEdges.length})
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                                  style={{ width: '100%', textAlign: 'left', padding: 10, background: 'var(--v3-panel)', border: '1px solid var(--v3-border)', borderRadius: 'var(--v3-radius-sm)', cursor: 'pointer', color: 'inherit' }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                      <div style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: entityTypeConfig[otherNode.type]?.dot || '#6b7280' }} />
                                      <span style={{ fontSize: 13, color: 'var(--v3-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{otherNode.label}</span>
                                    </div>
                                    <ChevronRight size={14} color="var(--v3-text-muted)" style={{ flexShrink: 0 }} />
                                  </div>
                                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--v3-text-muted)' }}>
                                    <span style={{ textTransform: 'uppercase' }}>{otherNode.type}</span>
                                    {edge.label && edge.label !== 'relates_to' && (
                                      <>
                                        <span>•</span>
                                        <span style={{ color: 'var(--v3-accent)' }}>{edge.label.replace(/_/g, ' ')}</span>
                                      </>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                            {connectedEdges.length > 8 && (
                              <p style={{ fontSize: 11, color: 'var(--v3-text-muted)', textAlign: 'center', padding: '4px 0' }}>
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
                        <h4 className="v3-mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--v3-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Quote size={12} />
                          Context
                        </h4>
                        <div style={{ padding: 12, background: 'var(--v3-panel)', borderRadius: 'var(--v3-radius-sm)', border: '1px solid var(--v3-border)' }}>
                          <p style={{ fontSize: 11, color: 'var(--v3-text-muted)', lineHeight: 1.6, margin: 0 }}>
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                          <div style={{ padding: 10, background: 'var(--v3-panel)', borderRadius: 'var(--v3-radius-sm)', textAlign: 'center' }}>
                            <p className="v3-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--v3-text-secondary)', margin: 0 }}>{connectedCount}</p>
                            <p style={{ fontSize: 11, color: 'var(--v3-text-muted)', textTransform: 'uppercase' }}>Connections</p>
                          </div>
                          <div style={{ padding: 10, background: 'var(--v3-panel)', borderRadius: 'var(--v3-radius-sm)', textAlign: 'center' }}>
                            <p className="v3-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--v3-text-secondary)', margin: 0 }}>{sameTypeCount}</p>
                            <p style={{ fontSize: 11, color: 'var(--v3-text-muted)', textTransform: 'uppercase' }}>Same Type</p>
                          </div>
                        </div>
                      )
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </aside>

          {/* Canvas Area */}
          <div className="v3-card" style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: 0, minHeight: isFullscreen ? undefined : 'calc(100vh - 180px)' }}>
            {graphData && graphData.nodes.length > 0 ? (
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={`Knowledge graph visualization showing ${graphData?.stats.total_entities || 0} entities and ${graphData?.stats.total_relationships || 0} relationships`}
                style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none', display: 'block' }}
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
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <Network size={48} color="var(--v3-text-disabled)" style={{ margin: '0 auto' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 16, color: 'var(--v3-text-primary)' }}>No Entities Extracted</h3>
                  <p style={{ color: 'var(--v3-text-muted)', marginTop: 8, maxWidth: 420, fontSize: 13, lineHeight: 1.6 }}>
                    Extract parties, dates, monetary amounts, and other key entities from
                    {contractDoc ? ` "${contractDoc.filename}"` : ' this document'} to build
                    an interactive relationship graph.
                  </p>
                  <button
                    onClick={triggerExtraction}
                    disabled={extracting}
                    className="v3-btn v3-btn-primary"
                    style={{ marginTop: 24, display: 'inline-flex' }}
                  >
                    {extracting ? (
                      <>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        Analyzing{extractionElapsed > 0 ? ` · ${extractionElapsed}s` : '...'}
                      </>
                    ) : (
                      <>
                        <Network size={14} />
                        Build Knowledge Graph
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Zoom indicator */}
            <div className="v3-mono" style={{ position: 'absolute', bottom: 16, right: 16, padding: '4px 12px', background: 'rgba(17,17,20,0.8)', borderRadius: 'var(--v3-radius-sm)', fontSize: 11, color: 'var(--v3-text-muted)', border: '1px solid var(--v3-border)' }}>
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
                  className="md:hidden"
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--v3-popover)', borderTop: '1px solid var(--v3-border)', borderTopLeftRadius: 'var(--v3-radius-lg)', borderTopRightRadius: 'var(--v3-radius-lg)', maxHeight: '60vh', overflowY: 'auto', zIndex: 10 }}
                >
                  {/* Drag handle */}
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
                    <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--v3-border-hover)' }} />
                  </div>

                  <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Header with close button */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 999, background: entityTypeConfig[selectedNode.type]?.dot || '#6b7280' }} />
                        <span className="v3-mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v3-text-muted)' }}>{selectedNode.type}</span>
                      </div>
                      <button
                        onClick={() => {
                          setMobileSheetOpen(false)
                          setSelectedNode(null)
                        }}
                        style={{ padding: 4, background: 'transparent', border: 'none', color: 'var(--v3-text-muted)', cursor: 'pointer' }}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <p style={{ fontWeight: 600, color: 'var(--v3-text-primary)', fontSize: 18, margin: 0 }}>{selectedNode.label}</p>
                    {selectedNode.value && selectedNode.value !== selectedNode.label && (
                      <p style={{ fontSize: 13, color: 'var(--v3-text-muted)', fontStyle: 'italic', margin: 0 }}>{selectedNode.value}</p>
                    )}

                    {/* Connected relationships */}
                    {(() => {
                      const connectedEdges = graphData.edges.filter(
                        e => e.source === selectedNode.id || e.target === selectedNode.id
                      )
                      if (connectedEdges.length === 0) return null

                      return (
                        <div>
                          <h4 className="v3-mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--v3-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Link2 size={12} />
                            Relationships ({connectedEdges.length})
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                                  style={{ width: '100%', textAlign: 'left', padding: 8, background: 'var(--v3-card)', border: '1px solid var(--v3-border)', borderRadius: 'var(--v3-radius-sm)', cursor: 'pointer', color: 'inherit' }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                      <div style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: entityTypeConfig[otherNode.type]?.dot || '#6b7280' }} />
                                      <span style={{ fontSize: 13, color: 'var(--v3-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{otherNode.label}</span>
                                    </div>
                                    <ChevronRight size={14} color="var(--v3-text-muted)" style={{ flexShrink: 0 }} />
                                  </div>
                                  {edge.label && edge.label !== 'relates_to' && (
                                    <span style={{ fontSize: 11, color: 'var(--v3-accent)', marginTop: 2, display: 'block' }}>{edge.label.replace(/_/g, ' ')}</span>
                                  )}
                                </button>
                              )
                            })}
                            {connectedEdges.length > 6 && (
                              <p style={{ fontSize: 11, color: 'var(--v3-text-muted)', textAlign: 'center', padding: '4px 0' }}>
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                          <div style={{ padding: 8, background: 'var(--v3-card)', borderRadius: 'var(--v3-radius-sm)', textAlign: 'center' }}>
                            <p className="v3-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--v3-text-secondary)', margin: 0 }}>{connectedCount}</p>
                            <p style={{ fontSize: 11, color: 'var(--v3-text-muted)', textTransform: 'uppercase' }}>Connections</p>
                          </div>
                          <div style={{ padding: 8, background: 'var(--v3-card)', borderRadius: 'var(--v3-radius-sm)', textAlign: 'center' }}>
                            <p className="v3-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--v3-text-secondary)', margin: 0 }}>{sameTypeCount}</p>
                            <p style={{ fontSize: 11, color: 'var(--v3-text-muted)', textTransform: 'uppercase' }}>Same Type</p>
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
    </V3Shell>
  )
}
