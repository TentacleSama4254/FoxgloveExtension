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
  }, [renderDone]);  // Responsive styles with useState for window dimensions
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // Add window resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#111827', // bg-gray-900
    color: 'white',
    padding: windowWidth >= 640 ? '1rem' : '0.5rem', // sm:p-4 : p-2
  };

  const headerStyle: React.CSSProperties = {
    fontSize: windowWidth >= 640 ? '1.5rem' : '1.25rem', // sm:text-2xl : text-xl
    fontWeight: 'bold',
    marginBottom: windowWidth >= 640 ? '1.5rem' : '0.75rem', // sm:mb-6 : mb-3
    textAlign: 'center',
  };

  const mainContainerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '72rem', // max-w-6xl
    margin: '0 auto', // mx-auto
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: windowWidth >= 1024 ? 'repeat(3, 1fr)' : 
                         windowWidth >= 640 ? 'repeat(2, 1fr)' : '1fr',
    gap: windowWidth >= 1024 ? '1.5rem' : 
         windowWidth >= 640 ? '1rem' : '0.75rem',
  };

  const cardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#1f2937', // bg-gray-800
    borderRadius: '0.5rem', // rounded-lg
    padding: windowWidth >= 640 ? '1rem' : '0.75rem', // sm:p-4 : p-3
  };

  const imuCardStyle: React.CSSProperties = {
    ...cardStyle,
    gridColumn: windowWidth >= 640 && windowWidth < 1024 ? 'span 2' : 'auto', // sm:col-span-2 lg:col-span-1
  };

  const cardHeaderStyle: React.CSSProperties = {
    fontSize: windowWidth >= 640 ? '1.125rem' : '1rem', // sm:text-lg : text-base
    fontWeight: '600', // font-semibold
    marginBottom: windowWidth >= 640 ? '0.5rem' : '0.25rem', // sm:mb-2 : mb-1
  };

  const valueContainerStyle: React.CSSProperties = {
    marginTop: windowWidth >= 640 ? '0.5rem' : '0.25rem', // sm:mt-2 : mt-1
    textAlign: 'center',
    fontSize: '0.875rem', // text-sm
  };

  const valueStyle: React.CSSProperties = {
    fontSize: windowWidth >= 640 ? '1.25rem' : '1.125rem', // sm:text-xl : text-lg
    fontFamily: 'monospace', // font-mono
  };

  const gpsContainerStyle: React.CSSProperties = {
    marginTop: windowWidth >= 640 ? '1.5rem' : '0.75rem', // sm:mt-6 : mt-3
    backgroundColor: '#1f2937', // bg-gray-800
    borderRadius: '0.5rem', // rounded-lg
    padding: windowWidth >= 640 ? '1rem' : '0.75rem', // sm:p-4 : p-3
    textAlign: 'center',
  };

  const gpsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: windowWidth >= 640 ? 'repeat(2, 1fr)' : '1fr',
    gap: windowWidth >= 640 ? '1rem' : '0.5rem', // sm:gap-4 : gap-2
  };

  const gpsLabelStyle: React.CSSProperties = {
    color: '#9ca3af', // text-gray-400
  };

  const gpsValueStyle: React.CSSProperties = {
    fontFamily: 'monospace', // font-mono
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>
        Drone Flight Dashboard
      </h1>

      <div style={mainContainerStyle}>
        {/* Main display area that adapts to screen orientation */}
        <div style={gridStyle}>
          <div style={cardStyle}>
            <h2 style={cardHeaderStyle}>Horizon</h2>
            <AttitudeIndicator roll={droneData.roll} pitch={droneData.pitch} darkMode={darkMode} />
            <div style={valueContainerStyle}>
              <span style={valueStyle}>
                {droneData.altitude.toFixed(1)} m
              </span>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={cardHeaderStyle}>Compass</h2>
            <Compass heading={droneData.heading} darkMode={darkMode} />
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
            />
            <div style={valueContainerStyle}>
              <span style={{fontFamily: 'monospace'}}>
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
        <div style={gpsContainerStyle}>
          <div style={gpsGridStyle}>
            <div>
              <span style={gpsLabelStyle}>Latitude:</span>{" "}
              <span style={gpsValueStyle}>{droneData.latitude?.toFixed(6) || "N/A"}</span>
            </div>
            <div>
              <span style={gpsLabelStyle}>Longitude:</span>{" "}
              <span style={gpsValueStyle}>{droneData.longitude?.toFixed(6) || "N/A"}</span>
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
