'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

export default function Whiteboard({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const room = useRoomContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#06b6d4'); // Accent cyan

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set real size based on container
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        // Re-apply background
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f172a'; // surface-900
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    };
    
    // Initial size
    setTimeout(resizeCanvas, 100);
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isOpen]);

  const drawLine = useCallback((x0: number, y0: number, x1: number, y1: number, strokeColor: string, emit: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;
    
    const payload = JSON.stringify({ type: 'draw', x0, y0, x1, y1, color: strokeColor });
    const data = new TextEncoder().encode(payload);
    room.localParticipant.publishData(data, { reliable: true });
  }, [room]);

  const drawRemoteLine = useCallback((x0: number, y0: number, x1: number, y1: number, strokeColor: string) => {
    drawLine(x0, y0, x1, y1, strokeColor, false);
  }, [drawLine]);

  const clearCanvas = useCallback((emit: boolean = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a'; // surface-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (emit) {
      const payload = JSON.stringify({ type: 'clear' });
      const data = new TextEncoder().encode(payload);
      room.localParticipant.publishData(data, { reliable: true });
    }
  }, [room]);

  useEffect(() => {
    if (!isOpen) return;

    const handleData = (payload: Uint8Array) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const parsed = JSON.parse(decoded);
        if (parsed.type === 'draw') {
          drawRemoteLine(parsed.x0, parsed.y0, parsed.x1, parsed.y1, parsed.color);
        }
        if (parsed.type === 'clear') {
          clearCanvas(false);
        }
      } catch {
        // ignore JSON parse errors
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [isOpen, room, drawRemoteLine, clearCanvas]);

  const lastPos = useRef<{ x: number, y: number } | null>(null);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top
      };
    }
  };

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    lastPos.current = getCoordinates(e);
  };

  const onMouseUp = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPos.current) return;
    const newPos = getCoordinates(e);
    drawLine(lastPos.current.x, lastPos.current.y, newPos.x, newPos.y, color, true);
    lastPos.current = newPos;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className="w-full max-w-5xl h-[80vh] bg-surface-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-white/10 bg-surface-800/50 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🎨</span> Whiteboard
            </h2>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              {['#06b6d4', '#ec4899', '#eab308', '#22c55e', '#ffffff'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="h-6 w-px bg-white/10 mx-2" />
            <button 
              onClick={() => clearCanvas(true)}
              className="text-sm font-medium text-text-muted hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              Clear All
            </button>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 w-full relative touch-none cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseOut={onMouseUp}
            onMouseMove={onMouseMove}
            onTouchStart={onMouseDown}
            onTouchEnd={onMouseUp}
            onTouchCancel={onMouseUp}
            onTouchMove={onMouseMove}
            className="absolute inset-0"
          />
        </div>
      </div>
    </div>
  );
}
