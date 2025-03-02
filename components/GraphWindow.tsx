"use client";
import { useState, useEffect } from "react";
import { Rnd, RndDragCallback } from "react-rnd";
import SensorGraph, { SensorData } from "./SensorGraph";
import { getSensorDisplayInfo, SensorType } from "./sensorRegistry";

export interface SnapTarget {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GraphWindowProps {
  sensorData: SensorData;
  sensorType: SensorType;
  layoutMode: "free" | "split" | "quad";
  defaultPosition: { x: number; y: number };
  defaultSize: { width: number; height: number };
  snapTarget?: SnapTarget;
  onClose?: () => void;
  dotColor: string;
  qrPosition: { x: number; y: number } | null;
  scanningEnabled: boolean;
}

export default function GraphWindow({
  sensorData,
  sensorType,
  layoutMode,
  defaultPosition,
  defaultSize,
  snapTarget,
  onClose,
  dotColor,
  qrPosition,
  scanningEnabled,
}: GraphWindowProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [showPreview, setShowPreview] = useState(false);

  const { displayName, unit } = getSensorDisplayInfo(sensorType);  // Fetch name + unit

  useEffect(() => {
    setPosition(defaultPosition);
    setSize(defaultSize);
  }, [defaultPosition, defaultSize]);

  const SNAP_THRESHOLD = 50;

  const distanceToSnap = (pos: { x: number; y: number }): number => {
    if (!snapTarget) return Infinity;
    const dx = pos.x - snapTarget.x;
    const dy = pos.y - snapTarget.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleDrag: RndDragCallback = (e, d) => {
    setPosition({ x: d.x, y: d.y });
    setShowPreview(snapTarget ? distanceToSnap({ x: d.x, y: d.y }) < SNAP_THRESHOLD : false);
  };

  const handleDragStop: RndDragCallback = (e, d) => {
    if (snapTarget && distanceToSnap({ x: d.x, y: d.y }) < SNAP_THRESHOLD) {
      setPosition({ x: snapTarget.x, y: snapTarget.y });
      setSize({ width: snapTarget.width, height: snapTarget.height });
    } else {
      setPosition({ x: d.x, y: d.y });
    }
    setShowPreview(false);
  };

  return (
    <Rnd
      size={{ width: size.width, height: size.height }}
      position={{ x: position.x, y: position.y }}
      onDrag={handleDrag}
      onDragStop={handleDragStop}
      onResizeStop={(e, direction, ref, delta, pos) => {
        setSize({ width: ref.offsetWidth, height: ref.offsetHeight });
        setPosition(pos);
      }}
      dragHandleClassName="actual-drag-handle"
      bounds="window"
      disableDragging={layoutMode !== "free"}
      enableResizing={layoutMode === "free"}
      style={{
        zIndex: 30,
        border: "1px solid #fff",
        background: "transparent",
      }}
    >
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 15px",
            height: "50px",
            background: dotColor,
            color: "#fff",
            fontWeight: "bold",
            fontSize: "18px",
          }}
        >
          <div className="actual-drag-handle" style={{ flex: 1, cursor: "move" }}>
            {`${displayName} Sensor Demo (${unit})`}
          </div>
          <button
            onClick={onClose}
            style={{
              fontSize: "28px",
              lineHeight: "28px",
              width: "50px",
              height: "50px",
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ height: "calc(100% - 50px)" }}>
          <SensorGraph sensorData={sensorData} sensorType={sensorType} scanningEnabled={scanningEnabled} />
        </div>
        {showPreview && snapTarget && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: snapTarget.width,
              height: snapTarget.height,
              border: "3px dashed #00ff00",
              pointerEvents: "none",
              zIndex: 100,
            }}
          />
        )}
      </div>
    </Rnd>
  );
}
