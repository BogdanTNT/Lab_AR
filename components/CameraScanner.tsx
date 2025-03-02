"use client";
import { useRef, useState, useEffect } from "react";
import jsQR from "jsqr";

export interface QRPosition {
  x: number;
  y: number;
}

export interface CameraScannerProps {
  onNewQrRead?: (newQr: string, position: QRPosition, color: string) => void;
  scanningEnabled: boolean;
}

export default function CameraScanner({ onNewQrRead, scanningEnabled }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [decodedText, setDecodedText] = useState<string>("");
  const [qrPosition, setQrPosition] = useState<QRPosition | null>(null);
  // Removed qrReadList state (was unused)
  const lastDetectionTimeRef = useRef<number>(Date.now());
  const [dotColor, setDotColor] = useState<string>(() => getRandomColor());

  function getRandomColor(): string {
    return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
  }

  useEffect(() => {
    if (!scanningEnabled) return;
    const video = videoRef.current;
    if (!video) return;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.play();
      })
      .catch((err) => console.error("Error accessing camera:", err));

    return () => {
      // Copy videoRef.current to a variable to ensure it's stable during cleanup
      const currentVideo = video;
      if (currentVideo && currentVideo.srcObject) {
        const stream = currentVideo.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        currentVideo.srcObject = null;
      }
    };
  }, [scanningEnabled]);

  useEffect(() => {
    if (!scanningEnabled) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scanFrame = () => {
      if (!scanningEnabled) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code) {
          setDecodedText(code.data);
          lastDetectionTimeRef.current = Date.now();

          const centerX =
            (code.location.topLeftCorner.x + code.location.bottomRightCorner.x) / 2;
          const centerY =
            (code.location.topLeftCorner.y + code.location.bottomRightCorner.y) / 2;

          const scaleX = video.clientWidth / video.videoWidth;
          const scaleY = video.clientHeight / video.videoHeight;
          const position = { x: centerX * scaleX, y: centerY * scaleY };
          setQrPosition(position);

          // If this QR code is new, call the parent's callback.
          // (We generate a new dot color and pass it along.)
          if (onNewQrRead) {
            const color = getRandomColor();
            setDotColor(color);
            setTimeout(() => onNewQrRead(code.data, position, color), 0);
          }
        } else {
          if (Date.now() - lastDetectionTimeRef.current > 5000) {
            setQrPosition(null);
          }
        }
      }
      requestAnimationFrame(scanFrame);
    };

    requestAnimationFrame(scanFrame);
  }, [onNewQrRead, scanningEnabled]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <video
        ref={videoRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {qrPosition && (
        <div
          style={{
            position: "absolute",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: dotColor,
            transform: `translate(${qrPosition.x - 10}px, ${qrPosition.y - 10}px)`,
            transition: "transform 0.3s ease",
            zIndex: 10,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          color: "#fff",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: "10px",
          borderRadius: "8px",
          zIndex: 20,
        }}
      >
        <h2>Decoded Text: {decodedText}</h2>
      </div>
    </div>
  );
}
