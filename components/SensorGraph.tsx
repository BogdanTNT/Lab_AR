"use client";
import dynamic from "next/dynamic";
import React, { useState, useEffect, useCallback } from "react";
import { getSensorDisplayInfo, SensorType } from "./sensorRegistry";

export interface SensorData {
  time: string[]; // local time strings (hh:mm:ss)
  data: number[];
}

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SensorGraphProps {
  sensorType: SensorType;
  sensorData: SensorData;
  scanningEnabled: boolean;
}

export default function SensorGraph({ sensorType, sensorData: initialData, scanningEnabled }: SensorGraphProps) {
  const { displayName, yAxisTitle, color } = getSensorDisplayInfo(sensorType);
  const [sensorData, setSensorData] = useState<SensorData>(initialData);

  const getLocalTimeString = useCallback((date: Date = new Date()) => {
    return date.toLocaleTimeString("en-US", { hour12: false });
  }, []);

  const getNewReading = useCallback((): number => {
    if (sensorType === "presence") {
      return Math.random() < 0.1 ? 1 : 0;
    } else if (sensorType === "speed") {
      const t = Date.now() / 1000;
      return 1500 + Math.sin(t / 5) * 100 + Math.random() * 20;
    } else if (sensorType === "temperature") {
      return 20 + Math.random() * 5;
    }
    return 0;
  }, [sensorType]);

  const initializeData = useCallback(() => {
    const initial: SensorData = { time: [], data: [] };
    const now = new Date();
    for (let i = 60; i > 0; i--) {
      const past = new Date(now.getTime() - i * 1000);
      initial.time.push(getLocalTimeString(past));
      initial.data.push(getNewReading());
    }
    setSensorData(initial);
  }, [getLocalTimeString, getNewReading]);

  useEffect(() => {
    if (scanningEnabled) {
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
      // When scanning is disabled, reinitialize to current 60s window
      initializeData();
    }
  }, [sensorType, scanningEnabled, getLocalTimeString, getNewReading, initializeData]);

  // Calculate tick values: show every 5 or 10 seconds depending on screen width.
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
          yaxis: { title: yAxisTitle, gridcolor: "rgba(255,255,255,0.3)" },
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
