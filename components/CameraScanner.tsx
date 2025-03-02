"use client";
import { useRef, useState, useEffect } from "react";
import jsQR from "jsqr";

export interface QRPosition {
  x: number;
  y: number;
}

export interface CameraScannerProps {
  onNewQrRead?: (newQr: string) => void;
}

export default function CameraScanner({ onNewQrRead }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [decodedText, setDecodedText] = useState<string>("");
  const [qrPosition, setQrPosition] = useState<QRPosition | null>(null);
  const [dotColor] = useState<string>(() => getRandomColor());
  const lastDetectionTimeRef = useRef<number>(Date.now());
  const scannedCodesRef = useRef<Set<string>>(new Set());

  function getRandomColor(): string {
    return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
  }

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play();
        }
      })
      .catch((err) => console.error("Error accessing camera:", err));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scanFrame = () => {
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

          const centerX = (code.location.topLeftCorner.x + code.location.bottomRightCorner.x) / 2;
          const centerY = (code.location.topLeftCorner.y + code.location.bottomRightCorner.y) / 2;

          const scaleX = video.clientWidth / video.videoWidth;
          const scaleY = video.clientHeight / video.videoHeight;
          setQrPosition({ x: centerX * scaleX, y: centerY * scaleY });

          if (!scannedCodesRef.current.has(code.data)) {
            scannedCodesRef.current.add(code.data);
            setTimeout(() => onNewQrRead?.(code.data), 0);
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
  }, [onNewQrRead]);

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
