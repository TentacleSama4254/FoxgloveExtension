import { PanelExtensionContext } from "@foxglove/extension";
import { ReactElement, useEffect, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { Compass } from "./components/compass2";
import { IMUDisplay } from "./components/imu-display";
import { AttitudeIndicator } from "./components/attitude-indicator";
import "./styles.css";

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
  status?: {
    status?: number; // STATUS_GBAS_FIX=2
    service?: number; // SERVICE_GPS=1
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
  orientation_covariance?: number[];
  angular_velocity: {
    x: number;
    y: number;
    z: number;
  };
  angular_velocity_covariance?: number[];
  linear_acceleration: {
    x: number;
    y: number;
    z: number;
  };
  linear_acceleration_covariance?: number[];
  header?: {
    seq?: number;
    stamp?: { sec: number; nsec: number };
    frame_id?: string;
  };
}

// Odometry data structure
interface OdometryData {
  pose?: {
    pose?: {
      position?: {
        x: number;
        y: number;
        z: number;
      };
      orientation?: {
        x: number;
        y: number;
        z: number;
        w: number;
      };
    };
  };
  header?: {
    seq?: number;
    stamp?: { sec: number; nsec: number };
    frame_id?: string;
  };
}

// Sample data structure for drone telemetry
interface MinimalDroneData {
  altitude: number; // meters
  heading: number; // degrees
  roll: number; // degrees
  pitch: number; // degrees
  imuAcceleration: {
    x: number; // m/s²
    y: number; // m/s²
    z: number; // m/s²
  };
  imuGyro: {
    x: number; // deg/s
    y: number; // deg/s
    z: number; // deg/s
  };
  imuMag: {
    x: number; // μT
    y: number; // μT
    z: number; // μT
  };
  latitude?: number;
  longitude?: number;
}

// Default initial data
const initialData: MinimalDroneData = {
  altitude: 0,
  heading: 0,
  roll: 0,
  pitch: 0,
  imuAcceleration: { x: 0, y: 0, z: 9.8 },
  imuGyro: { x: 0, y: 0, z: 0 },
  imuMag: { x: 0, y: 0, z: 0 },
};

// Helper function to convert quaternion to Euler angles
function quaternionToEuler(quat: { x: number; y: number; z: number; w: number }): {
  roll: number;
  pitch: number;
  yaw: number;
} {
  const { x, y, z, w } = quat;

  // Convert quaternion to Euler angles (roll, pitch, yaw)
  // Roll (x-axis rotation)
  const sinr_cosp = 2 * (w * x + y * z);
  const cosr_cosp = 1 - 2 * (x * x + y * y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp) * (180 / Math.PI);

  // Pitch (y-axis rotation)
  const sinp = 2 * (w * y - z * x);
  const pitch =
    Math.abs(sinp) >= 1
      ? Math.sign(sinp) * 90 // Use 90 degrees if out of range
      : Math.asin(sinp) * (180 / Math.PI);

  // Yaw (z-axis rotation)
  const siny_cosp = 2 * (w * z + x * y);
  const cosy_cosp = 1 - 2 * (y * y + z * z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp) * (180 / Math.PI);

  return { roll, pitch, yaw };
}

function MinimalDashboardPanel({ context }: { context: PanelExtensionContext }): ReactElement {
  const [droneData, setDroneData] = useState<MinimalDroneData>(initialData);
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
        const gpsMessages = renderState.currentFrame.filter((msg) => msg.topic === "/fix");

        if (gpsMessages.length > 0) {
          const gpsMessage = gpsMessages[gpsMessages.length - 1];
          const gpsData = gpsMessage?.message as unknown as GpsData;

          if (gpsData) {
            newDroneData.latitude = gpsData.latitude;
            newDroneData.longitude = gpsData.longitude;
            newDroneData.altitude = gpsData.altitude;
            dataUpdated = true;
          }
        }
        // Process IMU data from IMU messages
        const imuMessages = renderState.currentFrame.filter(
          (msg) => msg.topic === "/imu/data_stamped" || msg.topic.includes("IMUwithTimeRef"),
        );

        if (imuMessages.length > 0) {
          const imuMessage = imuMessages[imuMessages.length - 1];
          const imuData = imuMessage?.message as unknown as ImuData;

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
        // Process Odometry data
        const odometryMessages = renderState.currentFrame.filter((msg) =>
          msg.topic.includes("/Odometry"),
        );

        if (odometryMessages.length > 0) {
          const odometryMessage = odometryMessages[odometryMessages.length - 1];
          const odometryData = odometryMessage?.message as unknown as OdometryData;

          if (odometryData?.pose?.pose) {
            // Use odometry data as a fallback for missing IMU data
            if (odometryData.pose.pose.orientation && !dataUpdated) {
              const { roll, pitch, yaw } = quaternionToEuler(odometryData.pose.pose.orientation);

              newDroneData.roll = roll;
              newDroneData.pitch = pitch;
              newDroneData.heading = (yaw + 360) % 360;

              dataUpdated = true;
            }
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
    // Subscribe to relevant topics as shown in the screenshots
    context.subscribe([
      { topic: "/fix" }, // GPS data
      { topic: "/imu/data_stamped" }, // IMU data
      { topic: "/Odometry" }, // Odometry data
    ]);
  }, [context, droneData]);

  // Call the done callback after render
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);

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
      </div>
    </div>
  );
}

export function initMinimalDashboardPanel(context: PanelExtensionContext): () => void {
  const root = createRoot(context.panelElement);
  root.render(<MinimalDashboardPanel context={context} />);

  // Return a function to run when the panel is removed
  return () => {
    root.unmount();
  };
}
