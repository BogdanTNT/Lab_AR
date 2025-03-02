"use client";
import { useState, useEffect } from "react";
import CameraScanner from "../components/CameraScanner";
import GraphWindow from "../components/GraphWindow";
import { SensorData } from "../components/SensorGraph";
import { SnapTarget } from "../components/GraphWindow";

interface GraphInfo {
  code: string;
  sensorData: SensorData;
}

function simulateSensorData(): SensorData {
  const time: number[] = [];
  const data: number[] = [];
  for (let i = 0; i < 60; i++) {
    time.push(i);
    data.push(Math.random() < 0.1 ? 1 : 0);
  }
  return { time, data };
}

export default function MainPage() {
  // Start with window size 0 then update on mount.
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [graphs, setGraphs] = useState<GraphInfo[]>([]);

  useEffect(() => {
    function updateSize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // When a new unique QR code is read, add a graph (max 4).
  const handleNewQrRead = (newQr: string) => {
    setGraphs((prev) => {
      if (prev.length < 4 && !prev.find((g) => g.code === newQr)) {
        return [...prev, { code: newQr, sensorData: simulateSensorData() }];
      }
      return prev;
    });
  };

  // Remove a graph when its close button is pressed.
  const handleCloseGraph = (code: string) => {
    setGraphs((prev) => prev.filter((g) => g.code !== code));
  };

  // Calculate snap targets based on current window size and number of graphs.
  function getSnapTargets(count: number): SnapTarget[] {
    const { width, height } = windowSize;
    if (count === 1) {
      return [{ x: 0, y: 0, width, height }];
    } else if (count === 2) {
      return [
        { x: 0, y: 0, width, height: height / 2 },
        { x: 0, y: height / 2, width, height: height / 2 },
      ];
    } else if (count === 3) {
      return [
        { x: 0, y: 0, width: width / 2, height: height / 2 },
        { x: width / 2, y: 0, width: width / 2, height: height / 2 },
        { x: 0, y: height / 2, width: width / 2, height: height / 2 },
      ];
    } else if (count === 4) {
      return [
        { x: 0, y: 0, width: width / 2, height: height / 2 },
        { x: width / 2, y: 0, width: width / 2, height: height / 2 },
        { x: 0, y: height / 2, width: width / 2, height: height / 2 },
        { x: width / 2, y: height / 2, width: width / 2, height: height / 2 },
      ];
    }
    return [];
  }

  const snapTargets = getSnapTargets(graphs.length);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <CameraScanner onNewQrRead={handleNewQrRead} />
      {graphs.map((graph, index) => (
        <GraphWindow
          key={graph.code}
          sensorData={graph.sensorData}
          layoutMode="free"
          defaultPosition={snapTargets[index] || { x: 50, y: 50 }}
          defaultSize={snapTargets[index] || { width: 300, height: 300 }}
          snapTarget={snapTargets[index]}
          onClose={() => handleCloseGraph(graph.code)}
        />
      ))}
    </div>
  );
}
