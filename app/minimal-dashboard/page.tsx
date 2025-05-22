"use client"

import { useState, useEffect } from "react"
import { Compass } from "../../components/compass"
import { IMUDisplay } from "../../components/imu-display"
import { AttitudeIndicator } from "../../components/attitude-indicator"

// Sample data structure for drone telemetry
interface MinimalDroneData {
  altitude: number // meters
  heading: number // degrees
  roll: number // degrees
  pitch: number // degrees
  imuAcceleration: {
    x: number // m/s²
    y: number // m/s²
    z: number // m/s²
  }
  imuGyro: {
    x: number // deg/s
    y: number // deg/s
    z: number // deg/s
  }
  imuMag: {
    x: number // μT
    y: number // μT
    z: number // μT
  }
}

// Default initial data
const initialData: MinimalDroneData = {
  altitude: 100,
  heading: 0,
  roll: 0,
  pitch: 0,
  imuAcceleration: { x: 0, y: 0, z: 9.8 },
  imuGyro: { x: 0, y: 0, z: 0 },
  imuMag: { x: 0, y: 0, z: 0 },
}

export default function MinimalDashboard() {
  const [droneData, setDroneData] = useState<MinimalDroneData>(initialData)
  const [darkMode] = useState(true)

  // Simulate data changes
  useEffect(() => {
    const interval = setInterval(() => {
      setDroneData((prevData) => ({
        altitude: 100 + Math.sin(Date.now() / 5000) * 20,
        heading: (prevData.heading + 0.2) % 360,
        roll: Math.sin(Date.now() / 2000) * 15,
        pitch: Math.sin(Date.now() / 3000) * 10,
        imuAcceleration: {
          x: Math.sin(Date.now() / 1000) * 0.5,
          y: Math.cos(Date.now() / 1200) * 0.5,
          z: 9.8 + Math.sin(Date.now() / 2000) * 0.2,
        },
        imuGyro: {
          x: Math.sin(Date.now() / 800) * 5,
          y: Math.cos(Date.now() / 900) * 5,
          z: Math.sin(Date.now() / 1000) * 3,
        },
        imuMag: {
          x: Math.sin(Date.now() / 1500) * 20,
          y: Math.cos(Date.now() / 1600) * 20,
          z: Math.sin(Date.now() / 1700) * 15,
        },
      }))
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Minimal Flight Dashboard</h1>

      <div className="max-w-4xl mx-auto">
        {/* Main display area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Horizon</h2>
            <AttitudeIndicator roll={droneData.roll} pitch={droneData.pitch} darkMode={darkMode} />
            <div className="mt-2 text-center text-sm">
              <span className="text-xl font-mono">{droneData.altitude.toFixed(1)} m</span>
            </div>
          </div>

          <div className="flex flex-col items-center bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Compass</h2>
            <Compass heading={droneData.heading} darkMode={darkMode} />
            <div className="mt-2 text-center text-sm">
              <span className="text-xl font-mono">{droneData.heading.toFixed(1)}°</span>
            </div>
          </div>

          <div className="flex flex-col items-center bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">IMU Data</h2>
            <IMUDisplay
              acceleration={droneData.imuAcceleration}
              gyro={droneData.imuGyro}
              mag={droneData.imuMag}
              darkMode={darkMode}
            />
            <div className="mt-2 text-center text-sm">
              <span className="font-mono">
                Accel:{" "}
                {Math.sqrt(
                  Math.pow(droneData.imuAcceleration.x, 2) +
                    Math.pow(droneData.imuAcceleration.y, 2) +
                    Math.pow(droneData.imuAcceleration.z, 2),
                ).toFixed(2)}{" "}
                m/s²
              </span>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <div className="mt-8 text-center">
          <a href="/" className="text-blue-400 hover:text-blue-300 underline">
            Back to Full Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
