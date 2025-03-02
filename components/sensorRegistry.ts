import { SensorData } from "./SensorGraph";

// Define all supported sensors here.
export type SensorType = keyof typeof sensorRegistry;

const sensorRegistry = {
  presence: {
    displayName: "Presence Sensor",
    yAxisTitle: "Presence (0/1)",
    color: "#00aaff",
    unit: "-",   // No real unit for presence sensor
    simulateData: (): SensorData => {
      const time = Array.from({ length: 60 }, (_, i) => i);
      const data = time.map(() => (Math.random() < 0.1 ? 1 : 0));
      return { time, data };
    },
  },
  speed: {
    displayName: "Motor Speed Sensor",
    yAxisTitle: "Speed (RPM)",
    color: "#ffaa00",
    unit: "RPM",
    simulateData: (): SensorData => {
      const time = Array.from({ length: 60 }, (_, i) => i);
      const data = time.map((i) => 1500 + Math.sin(i / 5) * 100 + Math.random() * 20);
      return { time, data };
    },
  },
  temperature: {
    displayName: "Temperature Sensor",
    yAxisTitle: "Temperature (°C)",
    color: "#ff4444",
    unit: "°C",
    simulateData: (): SensorData => {
      const time = Array.from({ length: 60 }, (_, i) => i);
      const data = time.map(() => 20 + Math.random() * 5);
      return { time, data };
    },
  },
};

export function getRandomSensorType(): SensorType {
  const types = Object.keys(sensorRegistry) as SensorType[];
  return types[Math.floor(Math.random() * types.length)];
}

export function simulateSensorData(sensorType: SensorType): SensorData {
  return sensorRegistry[sensorType].simulateData();
}

export function getSensorDisplayInfo(sensorType: SensorType) {
  return sensorRegistry[sensorType];
}
