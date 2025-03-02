"use client";
import dynamic from "next/dynamic";
import React from "react";

export interface SensorData {
  time: number[];
  data: number[];
}

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SensorGraphProps {
  sensorData: SensorData;
}

export default function SensorGraph({ sensorData }: SensorGraphProps) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Plot
        data={[
          {
            x: sensorData.time,
            y: sensorData.data,
            type: "scatter",
            mode: "lines+markers",
            marker: { color: "#00aaff", size: 8 },
            line: { width: 3, shape: "hv" },
          },
        ]}
        layout={{
          title: "Presence Sensor Simulation",
          xaxis: { title: "Time (s)", gridcolor: "rgba(255,255,255,0.3)" },
          yaxis: { title: "Sensor Output", range: [-0.1, 1.1], gridcolor: "rgba(255,255,255,0.3)" },
          autosize: true,
          margin: { l: 40, r: 20, t: 40, b: 40 },
          // More transparent backgrounds:
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
