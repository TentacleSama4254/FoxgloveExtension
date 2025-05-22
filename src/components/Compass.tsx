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

    // Draw cardinal points and degree markers
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate((-heading * Math.PI) / 180)

    // Draw degree markers
    for (let i = 0; i < 360; i += 5) {
      const angle = (i * Math.PI) / 180
      const markerLength = i % 10 === 0 ? 15 : 5

      ctx.beginPath()
      ctx.moveTo(0 + radius * Math.sin(angle), 0 - radius * Math.cos(angle))
      ctx.lineTo(
        0 + (radius - markerLength) * Math.sin(angle),
        0 - (radius - markerLength) * Math.cos(angle)
      )
      ctx.strokeStyle = darkMode ? "#bbb" : "#666"
      ctx.lineWidth = i % 10 === 0 ? 2 : 1
      ctx.stroke()

      // Draw degree text for major markers
      if (i % 30 === 0) {
        ctx.save()
        ctx.translate((radius - 30) * Math.sin(angle), -(radius - 30) * Math.cos(angle))
        ctx.rotate((i * Math.PI) / 180)
        ctx.fillStyle = darkMode ? "#ddd" : "#333"
        ctx.font = "12px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        let displayText
        switch (i) {
          case 0:
            displayText = "N"
            ctx.fillStyle = "red"
            ctx.font = "bold 14px Arial"
            break
          case 90:
            displayText = "E"
            break
          case 180:
            displayText = "S"
            break
          case 270:
            displayText = "W"
            break
          default:
            displayText = i.toString()
        }

        ctx.fillText(displayText, 0, 0)
        ctx.restore()
      }
    }

    ctx.restore()

    // Draw center dot
    ctx.beginPath()
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2)
    ctx.fillStyle = darkMode ? "#eee" : "#222"
    ctx.fill()

    // Draw heading indicator at the top
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - radius - 2)
    ctx.lineTo(centerX - 10, centerY - radius + 10)
    ctx.lineTo(centerX + 10, centerY - radius + 10)
    ctx.closePath()
    ctx.fillStyle = "red"
    ctx.fill()

    // Display heading value
    ctx.fillStyle = darkMode ? "#fff" : "#000"
    ctx.font = "bold 16px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${Math.round(heading)}°`, centerX, centerY)
  }, [heading, size, darkMode])

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
