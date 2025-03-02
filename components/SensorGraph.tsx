"use client";
import dynamic from "next/dynamic";
import React, { useState, useEffect } from "react";
import { getSensorDisplayInfo, SensorType } from "./sensorRegistry";

export interface SensorData {
  time: string[]; // local time strings in hh:mm:ss
  data: number[];
}

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SensorGraphProps {
  sensorType: SensorType;
  scanningEnabled: boolean;
  initialData?: SensorData;
}

export default function SensorGraph({ sensorType, scanningEnabled, initialData }: SensorGraphProps) {
  const { displayName, yAxisTitle, color } = getSensorDisplayInfo(sensorType);
  const [sensorData, setSensorData] = useState<SensorData>(
    initialData || { time: [], data: [] }
  );

  // Helper: format current time in local hh:mm:ss
  const getLocalTimeString = (date: Date = new Date()) => {
    return date.toLocaleTimeString("en-US", { hour12: false });
  };

  // Generate a new sensor reading
  const getNewReading = (): number => {
    if (sensorType === "presence") {
      return Math.random() < 0.1 ? 1 : 0;
    } else if (sensorType === "speed") {
      const t = Date.now() / 1000;
      return 1500 + Math.sin(t / 5) * 100 + Math.random() * 20;
    } else if (sensorType === "temperature") {
      return 20 + Math.random() * 5;
    }
    return 0;
  };

  // Function to initialize data: generate last 60 seconds of data.
  const initializeData = () => {
    const initial: SensorData = { time: [], data: [] };
    const now = new Date();
    for (let i = 60; i > 0; i--) {
      const past = new Date(now.getTime() - i * 1000);
      initial.time.push(getLocalTimeString(past));
      initial.data.push(getNewReading());
    }
    setSensorData(initial);
  };

  useEffect(() => {
    if (scanningEnabled) {
      // When scanning is enabled, initialize data and start updating.
      initializeData();
      const interval = setInterval(() => {
        const now = getLocalTimeString();
        const newValue = getNewReading();
        setSensorData((prev) => {
          const newTime = [...prev.time, now];
          const newData = [...prev.data, newValue];
          if (newTime.length > 60) {
            newTime.shift();
            newData.shift();
          }
          return { time: newTime, data: newData };
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      // When scanning is disabled, stop updating.
      // Optionally, you might want to freeze the data.
      // Here we simply do nothing.
    }
  }, [sensorType, scanningEnabled]);

  // For tick spacing, show every 5 or 10 seconds depending on screen width.
  const tickStep = window.innerWidth < 600 ? 10 : 5;
  const tickvals = sensorData.time.filter((_, index) => index % tickStep === 0);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Plot
        data={[
          {
            x: sensorData.time,
            y: sensorData.data,
            type: "scatter",
            mode: "lines+markers",
            marker: { color, size: 8 },
            line: { width: 3, shape: "hv" },
          },
        ]}
        layout={{
          title: `${displayName} Simulation`,
          xaxis: {
            title: "Time (hh:mm:ss)",
            tickmode: "array",
            tickvals: tickvals,
            gridcolor: "rgba(255,255,255,0.3)",
          },
          yaxis: {
            title: yAxisTitle,
            gridcolor: "rgba(255,255,255,0.3)",
          },
          autosize: true,
          margin: { l: 25, r: 5, t: 5, b: 25 },
          paper_bgcolor: "rgba(0,0,0,0.1)",
          plot_bgcolor: "rgba(0,0,0,0.1)",
          font: { color: "#fff" },
        }}
        config={{ responsive: true, displayModeBar: true }}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
