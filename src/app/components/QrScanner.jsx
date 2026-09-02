'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import jsQR from 'jsqr';
import { X, ScanLine } from 'lucide-react';

/**
 * Full-screen camera modal that decodes a QR code from the live feed and
 * reports it once via onScan(code). Caller owns what happens next (close
 * the scanner, look the code up, etc) — this component only scans.
 */
export default function QrScanner({ onScan, onClose, title = 'Scan QR Code' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const scannedRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch (err) {
        setError(err?.message || 'Could not access the camera.');
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !scannedRef.current) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          scannedRef.current = true;
          onScan?.(code.data);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-6"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-5 top-5 rounded-full border border-white/15 p-2 text-white/70 hover:border-red-400/50 hover:text-red-300 transition-colors"
        aria-label="Close scanner"
      >
        <X size={18} />
      </button>

      <p className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-400/90">
        <ScanLine size={14} /> {title}
      </p>

      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-cyan-500/30 bg-black"
      >
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-cyan-400/60" />
      </motion.div>

      {error && (
        <p className="mt-4 max-w-sm rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-xs text-red-300">
          {error}
        </p>
      )}
      {!error && (
        <p className="mt-4 text-xs text-white/40">Point the camera at a Conscientia QR code.</p>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        className="mt-6 rounded-full border border-white/15 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:border-red-400/50 hover:text-red-300 transition-colors"
      >
        Close
      </button>
    </motion.div>
  );
}
