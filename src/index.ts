import { ExtensionContext } from "@foxglove/extension";
import { initExamplePanel } from "./ExamplePanel";

/**
 * Updates visualization marker mesh resource URL
 */
function updateMeshResource(message: {
  markers: Array<{
    mesh_resource: string;
    [key: string]: unknown;
  }>;
}): {
  markers: Array<{
    mesh_resource: string;
    [key: string]: unknown;
    updated: boolean;
  }>;
} {
  // Create a deep copy of the message
  const updatedMessage = JSON.parse(JSON.stringify(message));
  
  // Update mesh_resource URL for each marker
  updatedMessage.markers = updatedMessage.markers.map((marker: { mesh_resource: string; [key: string]: unknown }) => ({
    ...marker,
    mesh_resource: "http://raw.githubusercontent.com/TentacleSama4254/Assets/main/M600.stl",
    updated: true
  }));
  
  return updatedMessage;
}

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "example-panel", initPanel: initExamplePanel });

  // Register a message converter for visualization markers
  extensionContext.registerMessageConverter({
    fromSchemaName: "visualization_msgs/MarkerArray",
    toSchemaName: "visualization_msgs/MarkerArray2",
    converter: (message: {
      markers: Array<{
        mesh_resource: string;
        [key: string]: unknown;
      }>;
    }) => {
      return updateMeshResource(message);
    },
  });
}
