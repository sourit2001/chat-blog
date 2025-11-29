"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
    stream: MediaStream | null;
    isRecording: boolean;
}

export default function AudioVisualizer({ stream, isRecording }: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    useEffect(() => {
        if (!stream || !isRecording || !canvasRef.current) return;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        analyserRef.current = analyser;
        sourceRef.current = source;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;

            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            // Draw symmetric waves from center
            const centerX = width / 2;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height; // Scale to canvas height

                const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
                gradient.addColorStop(0, "#a855f7"); // Purple-500
                gradient.addColorStop(1, "#3b82f6"); // Blue-500

                ctx.fillStyle = gradient;

                // Draw mirrored bars
                ctx.fillRect(centerX + x, (height - barHeight) / 2, barWidth, barHeight);
                ctx.fillRect(centerX - x - barWidth, (height - barHeight) / 2, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (sourceRef.current) sourceRef.current.disconnect();
            if (analyserRef.current) analyserRef.current.disconnect();
            if (audioContext.state !== "closed") audioContext.close();
        };
    }, [stream, isRecording]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={60}
            className="w-full h-full"
        />
    );
}
