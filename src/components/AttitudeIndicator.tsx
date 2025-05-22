import { useRef, useEffect } from "react"

interface AttitudeIndicatorProps {
  roll: number
  pitch: number
  size?: number
  darkMode?: boolean
}

export function AttitudeIndicator({ roll, pitch, size = 200, darkMode = true }: AttitudeIndicatorProps) {
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

    // Create a clipping region for the attitude indicator
    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.clip()

    // The horizon line needs to move vertically based on pitch
    // and rotate based on roll
    const pitchOffset = (pitch / 90) * radius
    
    ctx.translate(centerX, centerY)
    ctx.rotate((roll * Math.PI) / 180)
    
    // Draw sky
    ctx.fillStyle = darkMode ? "#0a4b9c" : "#87CEEB"
    ctx.fillRect(-radius, -radius - pitchOffset, radius * 2, radius)
    
    // Draw ground
    ctx.fillStyle = darkMode ? "#5e3a11" : "#8B4513"
    ctx.fillRect(-radius, -pitchOffset, radius * 2, radius)
    
    // Draw horizon line
    ctx.beginPath()
    ctx.moveTo(-radius, -pitchOffset)
    ctx.lineTo(radius, -pitchOffset)
    ctx.strokeStyle = "white"
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Draw pitch lines
    const pitchLineSpacing = radius / 6 // Distance between pitch lines (15 degree increments)
    ctx.strokeStyle = "white"
    ctx.lineWidth = 1
    
    // Draw pitch lines above horizon (positive pitch)
    for (let i = 1; i <= 6; i++) {
      const y = -pitchOffset - pitchLineSpacing * i
      if (y < -radius) continue // Skip if outside view
      
      const lineWidth = i % 2 === 0 ? radius * 0.6 : radius * 0.3
      
      ctx.beginPath()
      ctx.moveTo(-lineWidth / 2, y)
      ctx.lineTo(lineWidth / 2, y)
      ctx.stroke()
      
      // Add degree markers for major lines
      if (i % 2 === 0) {
        ctx.save()
        ctx.translate(-lineWidth / 2 - 20, y)
        ctx.rotate(-roll * Math.PI / 180)
        ctx.fillStyle = "white"
        ctx.font = "12px Arial"
        ctx.fillText(`+${i * 15}`, 0, 4)
        ctx.restore()
        
        ctx.save()
        ctx.translate(lineWidth / 2 + 20, y)
        ctx.rotate(-roll * Math.PI / 180)
        ctx.fillStyle = "white"
        ctx.font = "12px Arial"
        ctx.fillText(`+${i * 15}`, -20, 4)
        ctx.restore()
      }
    }
    
    // Draw pitch lines below horizon (negative pitch)
    for (let i = 1; i <= 6; i++) {
      const y = -pitchOffset + pitchLineSpacing * i
      if (y > radius) continue // Skip if outside view
      
      const lineWidth = i % 2 === 0 ? radius * 0.6 : radius * 0.3
      
      ctx.beginPath()
      ctx.moveTo(-lineWidth / 2, y)
      ctx.lineTo(lineWidth / 2, y)
      ctx.stroke()
      
      // Add degree markers for major lines
      if (i % 2 === 0) {
        ctx.save()
        ctx.translate(-lineWidth / 2 - 20, y)
        ctx.rotate(-roll * Math.PI / 180)
        ctx.fillStyle = "white"
        ctx.font = "12px Arial"
        ctx.fillText(`-${i * 15}`, 0, 4)
        ctx.restore()
        
        ctx.save()
        ctx.translate(lineWidth / 2 + 20, y)
        ctx.rotate(-roll * Math.PI / 180)
        ctx.fillStyle = "white"
        ctx.font = "12px Arial"
        ctx.fillText(`-${i * 15}`, -20, 4)
        ctx.restore()
      }
    }
    
    ctx.restore() // Restore the saved state (removes clipping region)
    
    // Draw the center aircraft reference
    ctx.beginPath()
    ctx.moveTo(centerX - 20, centerY)
    ctx.lineTo(centerX - 5, centerY)
    ctx.moveTo(centerX + 5, centerY)
    ctx.lineTo(centerX + 20, centerY)
    ctx.moveTo(centerX, centerY)
    ctx.strokeStyle = "yellow"
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Draw roll indicator at the top
    ctx.beginPath()
    ctx.arc(centerX, centerY - radius, 5, 0, Math.PI * 2)
    ctx.fillStyle = "yellow"
    ctx.fill()
    
    // Draw roll markers
    for (let i = -60; i <= 60; i += 30) {
      const angle = (i * Math.PI) / 180
      const markerRadius = radius + 10
      
      ctx.beginPath()
      ctx.moveTo(
        centerX + markerRadius * Math.sin(angle),
        centerY - markerRadius * Math.cos(angle)
      )
      ctx.lineTo(
        centerX + (markerRadius + 8) * Math.sin(angle),
        centerY - (markerRadius + 8) * Math.cos(angle)
      )
      ctx.strokeStyle = "white"
      ctx.lineWidth = 2
      ctx.stroke()
    }
    
  }, [roll, pitch, size, darkMode])

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
