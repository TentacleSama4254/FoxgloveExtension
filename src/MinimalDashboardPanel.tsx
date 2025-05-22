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
  }, [renderDone]); // Inline styles for responsive layout
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );

  // Add window resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#111827", // bg-gray-900
    color: "white",
    padding: windowWidth >= 640 ? "1rem" : "0.5rem", // sm:p-4 : p-2
  };

  const mainContainerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "72rem", // max-w-6xl
    margin: "0 auto", // mx-auto
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns:
      windowWidth >= 1024 ? "repeat(3, 1fr)" : windowWidth >= 640 ? "repeat(2, 1fr)" : "1fr",
    gap: windowWidth >= 1024 ? "1.5rem" : windowWidth >= 640 ? "1rem" : "0.75rem",
  };

  const cardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#1f2937", // bg-gray-800
    borderRadius: "0.5rem", // rounded-lg
    padding: windowWidth >= 640 ? "1rem" : "0.75rem", // sm:p-4 : p-3
  };

  const imuCardStyle: React.CSSProperties = {
    ...cardStyle,
    gridColumn: windowWidth >= 640 && windowWidth < 1024 ? "span 2" : "auto", // sm:col-span-2 lg:col-span-1
  };
  const cardHeaderStyle: React.CSSProperties = {
    fontSize: windowWidth >= 640 ? "1.125rem" : "1rem", // sm:text-lg : text-base
    fontWeight: "600", // font-semibold
    marginBottom: windowWidth >= 640 ? "0.5rem" : "0.25rem", // sm:mb-2 : mb-1
  };

  const valueContainerStyle: React.CSSProperties = {
    marginTop: windowWidth >= 640 ? "0.5rem" : "0.25rem", // sm:mt-2 : mt-1
    textAlign: "center",
    fontSize: "0.875rem", // text-sm
  };

  const valueStyle: React.CSSProperties = {
    fontSize: windowWidth >= 640 ? "1.25rem" : "1.125rem", // sm:text-xl : text-lg
    fontFamily: "monospace", // font-mono
  };
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
    <div style={containerStyle}>
      <div style={mainContainerStyle}>
        {/* Main display area that adapts to screen orientation */}
        <div style={gridStyle}>
          <div style={cardStyle}>
            <h2 style={cardHeaderStyle}>Horizon</h2>
            <AttitudeIndicator
              roll={droneData.roll}
              pitch={droneData.pitch}
              darkMode={darkMode}
              size={componentSize}
            />
            <div style={valueContainerStyle}>
              <span style={valueStyle}>{droneData.altitude.toFixed(1)} m</span>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={cardHeaderStyle}>Compass</h2>
            <Compass heading={droneData.heading} darkMode={darkMode} size={componentSize} />
            <div style={valueContainerStyle}>
              <span style={valueStyle}>{droneData.heading.toFixed(1)}°</span>
            </div>
          </div>

          <div style={imuCardStyle}>
            <h2 style={cardHeaderStyle}>IMU Data</h2>
            <IMUDisplay
              acceleration={droneData.imuAcceleration}
              gyro={droneData.imuGyro}
              mag={droneData.imuMag}
              darkMode={darkMode}
              size={componentSize}
            />
            <div style={valueContainerStyle}>
              <span style={{ fontFamily: "monospace" }}>
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
