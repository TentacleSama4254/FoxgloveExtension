import { PanelExtensionContext } from "@foxglove/extension";
import { ReactElement, useEffect, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { Compass } from "./components/Compass";
import { IMUDisplay } from "./components/IMUDisplay";
import { AttitudeIndicator } from "./components/AttitudeIndicator";
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
          (msg) =>
            msg.topic === "/fix" ||
            msg.topic.includes("NavSatFix") ||
            msg.topic.includes("/sensor_msgs"),
        );

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
          (msg) => msg.topic.includes("/imu") || msg.topic.includes("data_stamped"),
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
      { topic: "/nav_msgs/Odometry" },
    ]);
  }, [context, droneData]);

  // Call the done callback after render
  useEffect(() => {
    renderDone?.();
  }, [renderDone]); // Responsive styles with useState for window dimensions
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );

  // Add window resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // No need for inline styles as we're using CSS classes now
  // Calculate component sizes based on available space
  const calculateComponentSize = () => {
    // Base size for components based on screen size
    let baseSize: number;

    if (windowWidth >= 1024) {
      // Large screens - can fit 3 components horizontally
      baseSize = Math.min(windowWidth / 3.5, 200);
    } else if (windowWidth >= 640) {
      // Medium screens - can fit 2 components horizontally
      baseSize = Math.min(windowWidth / 2.5, 200);
    } else {
      // Small screens - single column
      baseSize = Math.min(windowWidth * 0.7, 200);
    }

    return Math.max(120, Math.min(baseSize, 200)); // Clamp between 120px and 200px
  };

  // Dynamically sized components
  const componentSize = calculateComponentSize();
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">Drone Flight Dashboard</h1>

      <div className="main-container">
        {/* Main display area that adapts to screen orientation */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2 className="card-header">Horizon</h2>
            <div className="dashboard-component">
              <AttitudeIndicator
                roll={droneData.roll}
                pitch={droneData.pitch}
                darkMode={darkMode}
                size={componentSize}
              />
            </div>
            <div className="value-container">
              <span className="value-text">{droneData.altitude.toFixed(1)} m</span>
            </div>
          </div>

          <div className="dashboard-card">
            <h2 className="card-header">Compass</h2>
            <div className="dashboard-component">
              <Compass heading={droneData.heading} darkMode={darkMode} size={componentSize} />
            </div>
            <div className="value-container">
              <span className="value-text">{droneData.heading.toFixed(1)}°</span>
            </div>
          </div>

          <div className="dashboard-card imu-card">
            <h2 className="card-header">IMU Data</h2>
            <div className="dashboard-component">
              <IMUDisplay
                acceleration={droneData.imuAcceleration}
                gyro={droneData.imuGyro}
                mag={droneData.imuMag}
                darkMode={darkMode}
                size={componentSize}
              />
            </div>
            <div className="value-container">
              <span className="mono-text">
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
        <div className="gps-container">
          <div className="gps-grid">
            <div>
              <span className="gps-label">Latitude:</span>{" "}
              <span className="mono-text">{droneData.latitude?.toFixed(6) || "N/A"}</span>
            </div>
            <div>
              <span className="gps-label">Longitude:</span>{" "}
              <span className="mono-text">{droneData.longitude?.toFixed(6) || "N/A"}</span>
            </div>
          </div>
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
