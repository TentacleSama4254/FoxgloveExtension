import { Immutable, MessageEvent, PanelExtensionContext, Topic } from "@foxglove/extension";
import React, { ReactElement, useEffect, useLayoutEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";

import { Compass } from "../components/compass";
import { IMUDisplay } from "../components/imu-display";
import { AttitudeIndicator } from "../components/attitude-indicator";

// GPS data structure based on NavSatFix message
interface GpsData {
  latitude: number;
  longitude: number;
  altitude: number;
  position_covariance?: number[];
  header?: {
    seq?: number;
    stamp?: { sec: number; nsec: number };
    frame_id?: string;
  };
}

// IMU data structure based on IMU message
interface ImuData {
  orientation: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
  angular_velocity: {
    x: number;
    y: number;
    z: number;
  };
  linear_acceleration: {
    x: number;
    y: number;
    z: number;
  };
  header?: {
    seq?: number;
    stamp?: { sec: number; nsec: number };
    frame_id?: string;
  };
}

// Consolidated drone telemetry data
interface DroneData {
  altitude: number;
  heading: number;
  roll: number;
  pitch: number;
  imuAcceleration: {
    x: number;
    y: number;
    z: number;
  };
  imuGyro: {
    x: number;
    y: number;
    z: number;
  };
  imuMag: {
    x: number;
    y: number;
    z: number;
  };
  latitude?: number;
  longitude?: number;
}

// Default initial data
const initialData: DroneData = {
  altitude: 0,
  heading: 0,
  roll: 0,
  pitch: 0,
  imuAcceleration: { x: 0, y: 0, z: 9.8 },
  imuGyro: { x: 0, y: 0, z: 0 },
  imuMag: { x: 0, y: 0, z: 0 },
};

function quaternionToEuler(quat: { x: number; y: number; z: number; w: number }): { roll: number; pitch: number; yaw: number } {
  const { x, y, z, w } = quat;
  
  // Convert quaternion to Euler angles (roll, pitch, yaw)
  // Roll (x-axis rotation)
  const sinr_cosp = 2 * (w * x + y * z);
  const cosr_cosp = 1 - 2 * (x * x + y * y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp) * (180 / Math.PI);
  
  // Pitch (y-axis rotation)
  const sinp = 2 * (w * y - z * x);
  const pitch = Math.abs(sinp) >= 1 
    ? Math.sign(sinp) * 90 // Use 90 degrees if out of range
    : Math.asin(sinp) * (180 / Math.PI);
  
  // Yaw (z-axis rotation)
  const siny_cosp = 2 * (w * z + x * y);
  const cosy_cosp = 1 - 2 * (y * y + z * z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp) * (180 / Math.PI);
  
  return { roll, pitch, yaw };
}

function DroneDashboardPanel({ context }: { context: PanelExtensionContext }): ReactElement {
  const [droneData, setDroneData] = useState<DroneData>(initialData);
  const [darkMode] = useState(true);
  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();
  
  // Setup render handler and topic subscriptions
  useLayoutEffect(() => {
    context.onRender = (renderState, done) => {
      setRenderDone(() => done);
      
      // Process messages in the current frame
      if (renderState.currentFrame) {
        const newDroneData = { ...droneData };
        let dataUpdated = false;
        
        // Process GPS data from NavSatFix messages
        const gpsMessages = renderState.currentFrame.filter(
          msg => msg.topic === "/fix" || msg.topic.includes("NavSatFix") || msg.topic.includes("/sensor_msgs")
        );
        
        if (gpsMessages.length > 0) {
          const gpsMessage = gpsMessages[gpsMessages.length - 1];
          const gpsData = gpsMessage.message as unknown as GpsData;
          
          if (gpsData) {
            newDroneData.latitude = gpsData.latitude;
            newDroneData.longitude = gpsData.longitude;
            newDroneData.altitude = gpsData.altitude;
            dataUpdated = true;
          }
        }
        
        // Process IMU data from IMU messages
        const imuMessages = renderState.currentFrame.filter(
          msg => msg.topic.includes("/imu") || msg.topic.includes("data_stamped")
        );
        
        if (imuMessages.length > 0) {
          const imuMessage = imuMessages[imuMessages.length - 1];
          const imuData = imuMessage.message as unknown as ImuData;
          
          if (imuData) {
            // Convert quaternion to Euler angles
            const { roll, pitch, yaw } = quaternionToEuler(imuData.orientation);
            
            newDroneData.roll = roll;
            newDroneData.pitch = pitch;
            newDroneData.heading = (yaw + 360) % 360; // Convert to 0-360 range
            
            // Update acceleration and angular velocity
            newDroneData.imuAcceleration = imuData.linear_acceleration;
            newDroneData.imuGyro = imuData.angular_velocity;
            
            dataUpdated = true;
          }
        }
        
        // Update state only if data changed
        if (dataUpdated) {
          setDroneData(newDroneData);
        }
      }
    };
    
    // Watch for topic updates and messages
    context.watch("topics");
    context.watch("currentFrame");
    
    // Subscribe to relevant topics - adjust these based on your ROS bag's actual topics
    context.subscribe([
      { topic: "/fix" },
      { topic: "/imu/data_stamped" },
      { topic: "/sensor_msgs/NavSatFix" },
      { topic: "/nav_msgs/Odometry" }
    ]);
  }, [context, droneData]);
  
  // Call the done callback after render
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Drone Flight Dashboard</h1>

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

        {/* GPS coordinates */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 text-center">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400">Latitude:</span>{" "}
              <span className="font-mono">{droneData.latitude?.toFixed(6) || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-400">Longitude:</span>{" "}
              <span className="font-mono">{droneData.longitude?.toFixed(6) || "N/A"}</span>
            </div>          </div>
        </div>

 
      </div>
    </div>
  );
}

export function initDroneDashboardPanel(context: PanelExtensionContext): () => void {
  const root = createRoot(context.panelElement);
  root.render(<DroneDashboardPanel context={context} />);

  // Return a function to run when the panel is removed
  return () => {
    root.unmount();
  };
}