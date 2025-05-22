"use client"

import { useRef, useEffect } from "react"

interface VerticalSpeedIndicatorProps {
  verticalSpeed: number
  size?: number
  darkMode?: boolean
  maxVerticalSpeed?: number
}

export function VerticalSpeedIndicator({
  verticalSpeed,
  size = 200,
  darkMode = true,
  maxVerticalSpeed = 5,
}: VerticalSpeedIndicatorProps) {
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

    // Draw VSI face
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = darkMode ? "#222" : "#f5f5f5"
    ctx.fill()

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.strokeStyle = darkMode ? "#444" : "#ddd"
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw vertical speed markings
    // VSI is typically from -maxVerticalSpeed to +maxVerticalSpeed
    // with 0 at 9 o'clock (left side)
    const startAngle = -Math.PI / 2
    const endAngle = Math.PI * 1.5
    const totalAngle = endAngle - startAngle

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Draw center line (0 vertical speed)
    ctx.beginPath()
    ctx.moveTo(centerX - radius + 10, centerY)
    ctx.lineTo(centerX + radius - 10, centerY)
    ctx.strokeStyle = darkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)"
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw ticks and numbers
    const majorTickCount = maxVerticalSpeed * 2
    const tickSpacing = totalAngle / majorTickCount

    for (let i = -maxVerticalSpeed; i <= maxVerticalSpeed; i++) {
      const value = i
      const angle = startAngle + (value + maxVerticalSpeed) * tickSpacing

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
      if (i < maxVerticalSpeed) {
        const minorAngle = angle + tickSpacing / 2

        ctx.beginPath()
        ctx.moveTo(centerX + Math.cos(minorAngle) * (radius - 10), centerY + Math.sin(minorAngle) * (radius - 10))
        ctx.lineTo(centerX + Math.cos(minorAngle) * radius, centerY + Math.sin(minorAngle) * radius)
        ctx.strokeStyle = darkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)"
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    // Draw up/down labels
    ctx.font = "bold 16px Arial"
    ctx.fillStyle = darkMode ? "white" : "black"
    ctx.fillText("UP", centerX, centerY - radius + 20)
    ctx.fillText("DOWN", centerX, centerY + radius - 20)

    // Draw vertical speed needle
    const needleValue = Math.max(-maxVerticalSpeed, Math.min(maxVerticalSpeed, verticalSpeed))
    const needleAngle = startAngle + (needleValue + maxVerticalSpeed) * tickSpacing

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

    // Draw digital vertical speed display
    ctx.font = "bold 16px monospace"
    ctx.fillStyle = darkMode ? "white" : "black"
    ctx.textAlign = "center"
    ctx.fillText(`${verticalSpeed.toFixed(1)} m/s`, centerX, centerY + 25)

    // Draw "VERT SPEED" label
    ctx.font = "12px Arial"
    ctx.fillStyle = darkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)"
    ctx.fillText("VERT SPEED", centerX, centerY - 25)
  }, [verticalSpeed, size, darkMode, maxVerticalSpeed])

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
