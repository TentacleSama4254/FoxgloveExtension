"use client"

import { useRef, useEffect } from "react"

interface IMUDisplayProps {
  acceleration: {
    x: number
    y: number
    z: number
  }
  gyro: {
    x: number
    y: number
    z: number
  }
  mag: {
    x: number
    y: number
    z: number
  }
  size?: number
  darkMode?: boolean
}

export function IMUDisplay({ acceleration, gyro, mag, size = 200, darkMode = true }: IMUDisplayProps) {
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

    // Draw IMU display face
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = darkMode ? "#222" : "#f5f5f5"
    ctx.fill()

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.strokeStyle = darkMode ? "#444" : "#ddd"
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw acceleration data
    const textY = centerY - 45
    ctx.font = "10px monospace"
    ctx.fillStyle = "#ff3b30"
    ctx.textAlign = "left"
    ctx.fillText("ACCEL (m/s²):", centerX - radius + 20, textY)

    ctx.font = "bold 10px monospace"
    ctx.fillStyle = "#ff3b30"
    ctx.fillText(`X: ${acceleration.x.toFixed(2)}`, centerX - radius + 20, textY + 15)

    ctx.fillStyle = "#34c759"
    ctx.fillText(`Y: ${acceleration.y.toFixed(2)}`, centerX - radius + 20, textY + 30)

    ctx.fillStyle = "#007aff"
    ctx.fillText(`Z: ${acceleration.z.toFixed(2)}`, centerX - radius + 20, textY + 45)

    // Draw linear velocity (derived from acceleration)
    const velocityY = centerY + 30
    ctx.font = "10px monospace"
    ctx.fillStyle = "#ffcc00"
    ctx.fillText("VELOCITY:", centerX - radius + 20, velocityY)

    // Simple velocity calculation (just for visualization)
    const velX = acceleration.x * 0.5 // Simple scaling for visualization
    const velY = acceleration.y * 0.5
    const velZ = acceleration.z * 0.5

    ctx.font = "bold 10px monospace"
    ctx.fillStyle = "#ff3b30"
    ctx.fillText(`X: ${velX.toFixed(2)}`, centerX - radius + 20, velocityY + 15)

    ctx.fillStyle = "#34c759"
    ctx.fillText(`Y: ${velY.toFixed(2)}`, centerX - radius + 20, velocityY + 30)

    ctx.fillStyle = "#007aff"
    ctx.fillText(`Z: ${velZ.toFixed(2)}`, centerX - radius + 20, velocityY + 45)

    // Draw 3D visualization of orientation
    const vizRadius = 30
    const vizX = centerX + radius - 50
    const vizY = centerY

    // Draw sphere
    ctx.beginPath()
    ctx.arc(vizX, vizY, vizRadius, 0, Math.PI * 2)
    ctx.fillStyle = darkMode ? "#333" : "#ddd"
    ctx.fill()

    ctx.beginPath()
    ctx.arc(vizX, vizY, vizRadius, 0, Math.PI * 2)
    ctx.strokeStyle = darkMode ? "#555" : "#bbb"
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw axes that animate based on acceleration data
    const axisLength = vizRadius * 0.8

    // Normalize acceleration values for visualization (scale factor can be adjusted)
    const scaleFactor = 5
    const normX = Math.min(1, Math.max(-1, acceleration.x / scaleFactor))
    const normY = Math.min(1, Math.max(-1, acceleration.y / scaleFactor))
    const normZ = Math.min(1, Math.max(-1, acceleration.z / scaleFactor))

    // X axis (roll) - red
    ctx.beginPath()
    ctx.moveTo(vizX - axisLength * Math.abs(normX), vizY)
    ctx.lineTo(vizX + axisLength * Math.abs(normX), vizY)
    ctx.strokeStyle = "#ff3b30"
    ctx.lineWidth = 2
    ctx.stroke()

    // Y axis (pitch) - green
    ctx.beginPath()
    ctx.moveTo(vizX, vizY - axisLength * Math.abs(normY))
    ctx.lineTo(vizX, vizY + axisLength * Math.abs(normY))
    ctx.strokeStyle = "#34c759"
    ctx.lineWidth = 2
    ctx.stroke()

    // Z axis (yaw) - blue (draw as a circle with radius based on Z acceleration)
    ctx.beginPath()
    ctx.arc(vizX, vizY, (axisLength * Math.abs(normZ)) / 2, 0, Math.PI * 2)
    ctx.strokeStyle = "#007aff"
    ctx.lineWidth = 2
    ctx.stroke()

    // Add a dot that moves based on X and Y acceleration
    ctx.beginPath()
    ctx.arc(vizX + normX * vizRadius * 0.7, vizY - normY * vizRadius * 0.7, 3, 0, Math.PI * 2)
    ctx.fillStyle = "white"
    ctx.fill()

    // Draw axis labels
    ctx.font = "bold 8px Arial"
    ctx.fillStyle = "#ff3b30"
    ctx.fillText("X", vizX + axisLength + 5, vizY)

    ctx.fillStyle = "#34c759"
    ctx.fillText("Y", vizX, vizY - axisLength - 5)

    ctx.fillStyle = "#007aff"
    ctx.fillText("Z", vizX + 5, vizY - axisLength / 2 - 5)
  }, [acceleration, gyro, mag, size, darkMode])

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
