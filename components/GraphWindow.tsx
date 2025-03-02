"use client";
import { useState, useEffect } from "react";
import { Rnd, RndDragCallback } from "react-rnd";
import SensorGraph, { SensorData } from "./SensorGraph";

export interface SnapTarget {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GraphWindowProps {
  sensorData: SensorData;
  layoutMode: "free" | "split" | "quad";
  defaultPosition: { x: number; y: number };
  defaultSize: { width: number; height: number };
  snapTarget?: SnapTarget;
  onClose?: () => void;
}

export default function GraphWindow({
  sensorData,
  layoutMode,
  defaultPosition,
  defaultSize,
  snapTarget,
  onClose,
}: GraphWindowProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [showPreview, setShowPreview] = useState(false);

  // When parent’s layout changes, update this window’s position and size.
  useEffect(() => {
    setPosition(defaultPosition);
    setSize(defaultSize);
  }, [defaultPosition, defaultSize]);

  const SNAP_THRESHOLD = 50; // pixels

  const distanceToSnap = (pos: { x: number; y: number }): number => {
    if (!snapTarget) return Infinity;
    const dx = pos.x - snapTarget.x;
    const dy = pos.y - snapTarget.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleDrag: RndDragCallback = (e, d) => {
    const newPos = { x: d.x, y: d.y };
    setPosition(newPos);
    if (snapTarget && distanceToSnap(newPos) < SNAP_THRESHOLD) {
      setShowPreview(true);
    } else {
      setShowPreview(false);
    }
  };

  const handleDragStop: RndDragCallback = (e, d) => {
    const newPos = { x: d.x, y: d.y };
    if (snapTarget && distanceToSnap(newPos) < SNAP_THRESHOLD) {
      // Snap exactly to target.
      setPosition({ x: snapTarget.x, y: snapTarget.y });
      setSize({ width: snapTarget.width, height: snapTarget.height });
    } else {
      setPosition(newPos);
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
      dragHandleClassName="drag-handle"
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
        {/* Thicker draggable header bar with larger "X" button */}
        <div
          className="drag-handle"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 15px",
            height: "50px", // Thicker bar
            background: "rgba(51,51,51,0.85)",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "18px",
            cursor: "move",
          }}
        >
          <span>Sensor Graph</span>
          <button
            onClick={onClose}
            style={{
              fontSize: "28px",
              lineHeight: "28px",
              width: "40px",
              height: "40px",
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
          <SensorGraph sensorData={sensorData} />
        </div>
        {/* Green dashed preview overlay shown during snapping */}
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
