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

    // Draw IMU background
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = darkMode ? "#222" : "#f5f5f5"
    ctx.fill()

    // Draw center grid
    ctx.strokeStyle = darkMode ? "#444" : "#ccc"
    ctx.lineWidth = 1

    // Vertical grid lines
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue // Skip center line
      ctx.beginPath()
      ctx.moveTo(centerX + (i * radius) / 2.5, centerY - radius * 0.8)
      ctx.lineTo(centerX + (i * radius) / 2.5, centerY + radius * 0.8)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue // Skip center line
      ctx.beginPath()
      ctx.moveTo(centerX - radius * 0.8, centerY + (i * radius) / 2.5)
      ctx.lineTo(centerX + radius * 0.8, centerY + (i * radius) / 2.5)
      ctx.stroke()
    }

    // Draw center axes
    ctx.strokeStyle = darkMode ? "#777" : "#999"
    ctx.lineWidth = 2

    // X-axis
    ctx.beginPath()
    ctx.moveTo(centerX - radius * 0.8, centerY)
    ctx.lineTo(centerX + radius * 0.8, centerY)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - radius * 0.8)
    ctx.lineTo(centerX, centerY + radius * 0.8)
    ctx.stroke()

    // Draw IMU vectors
    const scale = radius / 12 // Scale for vectors

    // Draw acceleration vector
    const accelLength = Math.sqrt(
      acceleration.x * acceleration.x + acceleration.y * acceleration.y + acceleration.z * acceleration.z
    )
    
    if (accelLength > 0) {
      const normalizedAccelX = acceleration.x / accelLength
      const normalizedAccelY = acceleration.y / accelLength
      
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(
        centerX + normalizedAccelX * accelLength * scale,
        centerY - normalizedAccelY * accelLength * scale
      )
      ctx.strokeStyle = "red"
      ctx.lineWidth = 3
      ctx.stroke()
      
      // Draw arrowhead
      const arrowSize = 8
      const arrowAngle = Math.atan2(-normalizedAccelY, normalizedAccelX)
      
      ctx.beginPath()
      ctx.moveTo(
        centerX + normalizedAccelX * accelLength * scale,
        centerY - normalizedAccelY * accelLength * scale
      )
      ctx.lineTo(
        centerX + normalizedAccelX * accelLength * scale - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
        centerY - normalizedAccelY * accelLength * scale + arrowSize * Math.sin(arrowAngle - Math.PI / 6)
      )
      
      ctx.moveTo(
        centerX + normalizedAccelX * accelLength * scale,
        centerY - normalizedAccelY * accelLength * scale
      )
      ctx.lineTo(
        centerX + normalizedAccelX * accelLength * scale - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
        centerY - normalizedAccelY * accelLength * scale + arrowSize * Math.sin(arrowAngle + Math.PI / 6)
      )
      
      ctx.stroke()
    }
    
    // Draw text for IMU values
    ctx.font = "12px Arial"
    ctx.textAlign = "left"
    ctx.fillStyle = darkMode ? "#ddd" : "#333"
    
    // Display acceleration values
    ctx.fillText("Accel (m/s²):", centerX - radius * 0.85, centerY - radius * 0.7)
    ctx.fillText(`X: ${acceleration.x.toFixed(2)}`, centerX - radius * 0.85, centerY - radius * 0.55)
    ctx.fillText(`Y: ${acceleration.y.toFixed(2)}`, centerX - radius * 0.85, centerY - radius * 0.4)
    ctx.fillText(`Z: ${acceleration.z.toFixed(2)}`, centerX - radius * 0.85, centerY - radius * 0.25)
    
    // Display gyro values
    ctx.fillText("Gyro (°/s):", centerX - radius * 0.85, centerY + radius * 0.05)
    ctx.fillText(`X: ${gyro.x.toFixed(2)}`, centerX - radius * 0.85, centerY + radius * 0.2)
    ctx.fillText(`Y: ${gyro.y.toFixed(2)}`, centerX - radius * 0.85, centerY + radius * 0.35)
    ctx.fillText(`Z: ${gyro.z.toFixed(2)}`, centerX - radius * 0.85, centerY + radius * 0.5)
    
  }, [acceleration, gyro, mag, size, darkMode])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="block m-auto"
      />
    </div>
  )
}
