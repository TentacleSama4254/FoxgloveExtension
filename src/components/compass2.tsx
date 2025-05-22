"use client"

import { useRef, useEffect } from "react"

interface CompassProps {
  heading: number
  size?: number
  darkMode?: boolean
}

export function Compass({ heading, size = 200, darkMode = true }: CompassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Constants
    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.45

    // Draw outer bezel
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2)
    ctx.fillStyle = darkMode ? "#1a1a1a" : "#e0e0e0"
    ctx.fill()

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2)
    ctx.strokeStyle = darkMode ? "#333" : "#ccc"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw compass face
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = darkMode ? "#222" : "#f5f5f5"
    ctx.fill()

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.strokeStyle = darkMode ? "#444" : "#ddd"
    ctx.lineWidth = 1
    ctx.stroke()

    // Save context for rotation
    ctx.save()

    // Translate to center and rotate (negative because we're rotating the dial, not the indicator)
    ctx.translate(centerX, centerY)
    ctx.rotate((-heading * Math.PI) / 180)

    // Draw cardinal and ordinal directions
    const directions = [
      { label: "N", angle: 0 },
      { label: "NE", angle: 45 },
      { label: "E", angle: 90 },
      { label: "SE", angle: 135 },
      { label: "S", angle: 180 },
      { label: "SW", angle: 225 },
      { label: "W", angle: 270 },
      { label: "NW", angle: 315 },
    ]

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Draw degree markers
    for (let i = 0; i < 360; i += 5) {
      // const angle = (i * Math.PI) / 180
      const length = i % 30 === 0 ? 15 : i % 10 === 0 ? 10 : 5

      ctx.beginPath()
      ctx.moveTo(0, -radius + length)
      ctx.lineTo(0, -radius)
      ctx.strokeStyle = darkMode ? "white" : "black"
      ctx.lineWidth = i % 30 === 0 ? 2 : 1
      ctx.stroke()

      // Draw degree numbers for major divisions
      if (i % 30 === 0) {
        ctx.font = "bold 12px Arial"
        ctx.fillStyle = i === 0 ? "#ff3b30" : darkMode ? "white" : "black"
        ctx.fillText(i.toString(), 0, -radius + 25)
      }

      ctx.rotate((5 * Math.PI) / 180)
    }

    // Draw cardinal and ordinal labels
    ctx.font = "bold 16px Arial"
    directions.forEach((dir) => {
      const angle = (dir.angle * Math.PI) / 180
      const x = 0
      const y = -radius + 45

      // Rotate to the direction angle
      ctx.save()
      ctx.rotate(angle)

      // Draw the label
      ctx.fillStyle = dir.label === "N" ? "#ff3b30" : darkMode ? "white" : "black"
      ctx.fillText(dir.label, x, y)

      ctx.restore()
    })

    // Restore context
    ctx.restore()

    // Draw aircraft/drone silhouette in the center
    const droneSize = 20
    ctx.fillStyle = "#ff3b30"

    // Draw a simple drone shape
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - droneSize / 2)
    ctx.lineTo(centerX + droneSize / 2, centerY)
    ctx.lineTo(centerX, centerY + droneSize / 2)
    ctx.lineTo(centerX - droneSize / 2, centerY)
    ctx.closePath()
    ctx.fill()

    // Draw heading indicator at the top
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - radius + 2)
    ctx.lineTo(centerX - 10, centerY - radius + 15)
    ctx.lineTo(centerX + 10, centerY - radius + 15)
    ctx.closePath()
    ctx.fillStyle = "#ff3b30"
    ctx.fill()

    // Draw digital heading display
    ctx.font = "bold 14px monospace"
    ctx.fillStyle = darkMode ? "white" : "black"
    ctx.textAlign = "center"
    ctx.fillText(`${heading.toFixed(0)}°`, centerX, centerY + radius - 15)
  }, [heading, size, darkMode])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </div>
  )
}
