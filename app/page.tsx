"use client";
import { useState, useEffect } from "react";
import CameraScanner from "../components/CameraScanner";
import GraphWindow from "../components/GraphWindow";
import { SensorData } from "../components/SensorGraph";
import { SnapTarget } from "../components/GraphWindow";
import { getRandomSensorType, simulateSensorData, SensorType } from "../components/sensorRegistry";

interface GraphInfo {
  code: string;
  sensorType: SensorType;
  sensorData: SensorData;
  dotColor: string;
  // Removed qrPosition from here.
}

export default function MainPage() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [graphs, setGraphs] = useState<GraphInfo[]>([]);
  const [lockScanning, setLockScanning] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    // Lock scrolling on the page
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    function updateSize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const handleNewQrRead = (
    newQr: string,
    position: { x: number; y: number },
    color: string
  ) => {
    if (lockScanning) return;
    setGraphs((prev) => {
      if (prev.length < 4 && !prev.find((g) => g.code === newQr)) {
        const sensorType = getRandomSensorType();
        return [
          ...prev,
          {
            code: newQr,
            sensorType,
            sensorData: simulateSensorData(sensorType),
            dotColor: color,
          },
        ];
      }
      return prev;
    });
  };

  const handleCloseGraph = (code: string) => {
    setGraphs((prev) => prev.filter((g) => g.code !== code));
  };

  const snapTargets = getSnapTargets(graphs.length, windowSize);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 100 }}>
        <button
          onClick={() => setLockScanning((prev) => !prev)}
          style={{
            padding: "10px 20px",
            backgroundColor: lockScanning ? "red" : "green",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {lockScanning ? "Unlock Scanner" : "Lock Scanner"}
        </button>
      </div>

      <CameraScanner onNewQrRead={handleNewQrRead} scanningEnabled={!lockScanning} />

      {graphs.map((graph, index) => (
        <GraphWindow
          key={graph.code}
          sensorData={graph.sensorData}
          sensorType={graph.sensorType}
          layoutMode="free"
          defaultPosition={snapTargets[index] || { x: 50, y: 50 }}
          defaultSize={snapTargets[index] || { width: 300, height: 300 }}
          snapTarget={snapTargets[index]}
          onClose={() => handleCloseGraph(graph.code)}
          dotColor={graph.dotColor}
          scanningEnabled={!lockScanning}
        />
      ))}

      {showInstructions && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.8)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 200,
          }}
        >
          <div style={{ marginBottom: "20px", fontSize: "24px", textAlign: "center" }}>
            To start demo, just start scanning ANY QR codes.
          </div>
          <button
            onClick={() => setShowInstructions(false)}
            style={{
              padding: "10px 20px",
              fontSize: "18px",
              backgroundColor: "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}

function getSnapTargets(count: number, size: { width: number; height: number }): SnapTarget[] {
  const { width, height } = size;
  if (count === 1) return [{ x: 0, y: 0, width, height }];
  if (count === 2)
    return [
      { x: 0, y: 0, width, height: height / 2 },
      { x: 0, y: height / 2, width, height: height / 2 },
    ];
  if (count === 3)
    return [
      { x: 0, y: 0, width: width / 2, height: height / 2 },
      { x: width / 2, y: 0, width: width / 2, height: height / 2 },
      { x: 0, y: height / 2, width: width / 2, height: height / 2 },
    ];
  if (count === 4)
    return [
      { x: 0, y: 0, width: width / 2, height: height / 2 },
      { x: width / 2, y: 0, width: width / 2, height: height / 2 },
      { x: 0, y: height / 2, width: width / 2, height: height / 2 },
      { x: width / 2, y: height / 2, width: width / 2, height: height / 2 },
    ];
  return [];
}
