"use client"

import { useRef, useEffect } from "react"

interface AltimeterProps {
  altitude: number
  size?: number
  darkMode?: boolean
  maxAltitude?: number
}

export function Altimeter({ altitude, size = 200, darkMode = true, maxAltitude = 500 }: AltimeterProps) {
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

    // Draw outer bezel - make sure it's a perfect circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2)
    ctx.fillStyle = darkMode ? "#1a1a1a" : "#e0e0e0"
    ctx.fill()
    ctx.closePath()

    // Draw inner bezel edge
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2)
    ctx.strokeStyle = darkMode ? "#333" : "#ccc"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.closePath()

    // Draw altimeter face - ensure it's a perfect circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = darkMode ? "#222" : "#f5f5f5"
    ctx.fill()
    ctx.closePath()

    // Draw face edge
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.strokeStyle = darkMode ? "#444" : "#ddd"
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.closePath()

    // Draw altitude markings
    const majorTickCount = 10
    const minorTicksPerMajor = 5
    const majorTickValue = maxAltitude / majorTickCount

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Draw ticks and numbers
    for (let i = 0; i <= majorTickCount; i++) {
      const angle = (i / majorTickCount) * Math.PI * 2

      // Major tick
      ctx.beginPath()
      ctx.moveTo(centerX + Math.sin(angle) * (radius - 15), centerY - Math.cos(angle) * (radius - 15))
      ctx.lineTo(centerX + Math.sin(angle) * radius, centerY - Math.cos(angle) * radius)
      ctx.strokeStyle = darkMode ? "white" : "black"
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.closePath()

      // Number
      const value = i * majorTickValue
      ctx.font = "bold 14px Arial"
      ctx.fillStyle = darkMode ? "white" : "black"
      ctx.fillText(
        value.toString(),
        centerX + Math.sin(angle) * (radius - 30),
        centerY - Math.cos(angle) * (radius - 30),
      )

      // Minor ticks
      if (i < majorTickCount) {
        for (let j = 1; j < minorTicksPerMajor; j++) {
          const minorAngle = angle + (j / minorTicksPerMajor) * ((Math.PI * 2) / majorTickCount)

          ctx.beginPath()
          ctx.moveTo(centerX + Math.sin(minorAngle) * (radius - 10), centerY - Math.cos(minorAngle) * (radius - 10))
          ctx.lineTo(centerX + Math.sin(minorAngle) * radius, centerY - Math.cos(minorAngle) * radius)
          ctx.strokeStyle = darkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)"
          ctx.lineWidth = 1
          ctx.stroke()
          ctx.closePath()
        }
      }
    }

    // Draw altitude needle
    const needleAngle = (altitude / maxAltitude) * Math.PI * 2

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(needleAngle)

    // Draw needle
    ctx.beginPath()
    ctx.moveTo(0, -radius + 10)
    ctx.lineTo(5, 0)
    ctx.lineTo(-5, 0)
    ctx.closePath()
    ctx.fillStyle = "#ff3b30"
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -radius + 15)
    ctx.strokeStyle = "#ff3b30"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.closePath()

    ctx.restore()

    // Draw center cap
    ctx.beginPath()
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2)
    ctx.fillStyle = darkMode ? "#444" : "#ccc"
    ctx.fill()
    ctx.closePath()

    ctx.beginPath()
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2)
    ctx.strokeStyle = darkMode ? "#666" : "#999"
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.closePath()

    // Draw digital altitude display
    ctx.font = "bold 16px monospace"
    ctx.fillStyle = darkMode ? "white" : "black"
    ctx.textAlign = "center"
    ctx.fillText(`${altitude.toFixed(1)} m`, centerX, centerY + 25)
  }, [altitude, size, darkMode, maxAltitude])

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
