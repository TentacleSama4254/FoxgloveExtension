"use client"

import { useEffect, useState } from "react"
import { Compass } from "./components/compass"
import { AttitudeIndicator } from "./components/attitude-indicator"
import { Altimeter } from "./components/altimeter"
import { IMUDisplay } from "./components/imu-display"
import { VerticalSpeedIndicator } from "./components/vertical-speed-indicator"
import { AirspeedIndicator } from "./components/airspeed-indicator"

// Sample data structure for drone telemetry
export interface DroneData {
  roll: number // degrees
  pitch: number // degrees
  yaw: number // degrees
  altitude: number // meters
  heading: number // degrees
  verticalSpeed: number // m/s
  airspeed: number // m/s
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
const initialData: DroneData = {
  roll: 0,
  pitch: 0,
  yaw: 0,
  altitude: 100,
  heading: 0,
  verticalSpeed: 0,
  airspeed: 0,
  imuAcceleration: { x: 0, y: 0, z: 9.8 },
  imuGyro: { x: 0, y: 0, z: 0 },
  imuMag: { x: 0, y: 0, z: 0 },
}

interface DroneDashboardProps {
  data?: DroneData
  darkMode?: boolean
  simulateData?: boolean
}

export default function DroneDashboard({
  data = initialData,
  darkMode = true,
  simulateData = true,
}: DroneDashboardProps) {
  const [droneData, setDroneData] = useState<DroneData>(data)

  // Simulate data changes if no real data is provided
  useEffect(() => {
    if (!simulateData) {
      setDroneData(data)
      return
    }

    const interval = setInterval(() => {
      setDroneData((prevData) => ({
        roll: Math.sin(Date.now() / 2000) * 15,
        pitch: Math.sin(Date.now() / 3000) * 10,
        yaw: (prevData.yaw + 0.5) % 360,
        altitude: 100 + Math.sin(Date.now() / 5000) * 20,
        heading: (prevData.heading + 0.2) % 360,
        verticalSpeed: Math.sin(Date.now() / 4000) * 2,
        airspeed: 15 + Math.sin(Date.now() / 6000) * 5,
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
  }, [data, simulateData])

  // Update with real data when provided
  useEffect(() => {
    if (!simulateData) {
      setDroneData(data)
    }
  }, [data, simulateData])

  return (
    <div className={`p-4 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"} rounded-lg`}>
      <h1 className="text-2xl font-bold mb-4 text-center">Drone Flight Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top row */}
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">Airspeed</h2>
          <AirspeedIndicator airspeed={droneData.airspeed} darkMode={darkMode} />
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">Horizon</h2>
          <AttitudeIndicator roll={droneData.roll} pitch={droneData.pitch} darkMode={darkMode} />
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">Altitude</h2>
          <Altimeter altitude={droneData.altitude} darkMode={darkMode} />
        </div>

        {/* Bottom row */}
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">Vertical Speed</h2>
          <VerticalSpeedIndicator verticalSpeed={droneData.verticalSpeed} darkMode={darkMode} />
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">Compass</h2>
          <Compass heading={droneData.heading} darkMode={darkMode} />
        </div>

        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2">IMU Data</h2>
          <IMUDisplay
            acceleration={droneData.imuAcceleration}
            gyro={droneData.imuGyro}
            mag={droneData.imuMag}
            darkMode={darkMode}
          />
        </div>
      </div>

      <div className="mt-4 text-center text-sm opacity-70">
        Roll: {droneData.roll.toFixed(1)}° | Pitch: {droneData.pitch.toFixed(1)}° | Yaw: {droneData.yaw.toFixed(1)}° |
        Heading: {droneData.heading.toFixed(1)}°
      </div>
    </div>
  )
}
