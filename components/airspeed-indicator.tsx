"use client"

import { useRef, useEffect } from "react"

interface AirspeedIndicatorProps {
  airspeed: number
  size?: number
  darkMode?: boolean
  maxAirspeed?: number
}

export function AirspeedIndicator({ airspeed, size = 200, darkMode = true, maxAirspeed = 30 }: AirspeedIndicatorProps) {
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

    // Draw airspeed face
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = darkMode ? "#222" : "#f5f5f5"
    ctx.fill()

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.strokeStyle = darkMode ? "#444" : "#ddd"
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw colored arcs for speed ranges
    // Green: normal, Yellow: caution, Red: danger
    const startAngle = -Math.PI * 0.75
    const endAngle = Math.PI * 0.75
    const totalAngle = endAngle - startAngle

    // Red zone (0-10% of max)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 5, startAngle, startAngle + totalAngle * 0.1, false)
    ctx.lineWidth = 10
    ctx.strokeStyle = "#ff3b30"
    ctx.stroke()

    // Yellow zone (10-20% of max)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 5, startAngle + totalAngle * 0.1, startAngle + totalAngle * 0.2, false)
    ctx.lineWidth = 10
    ctx.strokeStyle = "#ffcc00"
    ctx.stroke()

    // Green zone (20-80% of max)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 5, startAngle + totalAngle * 0.2, startAngle + totalAngle * 0.8, false)
    ctx.lineWidth = 10
    ctx.strokeStyle = "#34c759"
    ctx.stroke()

    // Yellow zone (80-90% of max)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 5, startAngle + totalAngle * 0.8, startAngle + totalAngle * 0.9, false)
    ctx.lineWidth = 10
    ctx.strokeStyle = "#ffcc00"
    ctx.stroke()

    // Red zone (90-100% of max)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 5, startAngle + totalAngle * 0.9, endAngle, false)
    ctx.lineWidth = 10
    ctx.strokeStyle = "#ff3b30"
    ctx.stroke()

    // Draw speed markings
    const majorTickCount = 6
    const minorTicksPerMajor = 5
    const majorTickValue = maxAirspeed / majorTickCount

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Draw ticks and numbers
    for (let i = 0; i <= majorTickCount; i++) {
      const value = i * majorTickValue
      const angle = startAngle + (value / maxAirspeed) * totalAngle

      // Major tick
      ctx.beginPath()
      ctx.moveTo(centerX + Math.cos(angle) * (radius - 15), centerY + Math.sin(angle) * (radius - 15))
      ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius)
      ctx.strokeStyle = darkMode ? "white" : "black"
      ctx.lineWidth = 2
      ctx.stroke()

      // Number
      ctx.font = "bold 14px Arial"
      ctx.fillStyle = darkMode ? "white" : "black"
      ctx.fillText(
        value.toString(),
        centerX + Math.cos(angle) * (radius - 30),
        centerY + Math.sin(angle) * (radius - 30),
      )

      // Minor ticks
      if (i < majorTickCount) {
        for (let j = 1; j < minorTicksPerMajor; j++) {
          const minorValue = value + j * (majorTickValue / minorTicksPerMajor)
          const minorAngle = startAngle + (minorValue / maxAirspeed) * totalAngle

          ctx.beginPath()
          ctx.moveTo(centerX + Math.cos(minorAngle) * (radius - 10), centerY + Math.sin(minorAngle) * (radius - 10))
          ctx.lineTo(centerX + Math.cos(minorAngle) * radius, centerY + Math.sin(minorAngle) * radius)
          ctx.strokeStyle = darkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)"
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }

    // Draw airspeed needle
    const needleAngle = startAngle + (airspeed / maxAirspeed) * totalAngle

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(needleAngle)

    // Draw needle
    ctx.beginPath()
    ctx.moveTo(-5, 0)
    ctx.lineTo(0, -5)
    ctx.lineTo(radius - 20, 0)
    ctx.lineTo(0, 5)
    ctx.closePath()
    ctx.fillStyle = "white"
    ctx.strokeStyle = "black"
    ctx.lineWidth = 1
    ctx.fill()
    ctx.stroke()

    ctx.restore()

    // Draw center cap
    ctx.beginPath()
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2)
    ctx.fillStyle = darkMode ? "#444" : "#ccc"
    ctx.fill()

    ctx.beginPath()
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2)
    ctx.strokeStyle = darkMode ? "#666" : "#999"
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw digital airspeed display
    ctx.font = "bold 16px monospace"
    ctx.fillStyle = darkMode ? "white" : "black"
    ctx.textAlign = "center"
    ctx.fillText(`${airspeed.toFixed(1)} m/s`, centerX, centerY + 25)

    // Draw "AIRSPEED" label
    ctx.font = "12px Arial"
    ctx.fillStyle = darkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)"
    ctx.fillText("AIRSPEED", centerX, centerY - 25)
  }, [airspeed, size, darkMode, maxAirspeed])

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
