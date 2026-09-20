import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, Zap, Volume2, CheckCircle2 } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [detectedCode, setDetectedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'accès à la caméra n'est pas supporté par ce navigateur.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start Barcode Detection Loop if BarcodeDetector API is present
      startDetectionLoop();
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setErrorMsg(
        err.message ||
          "Impossible d'accéder à la caméra. Vérifiez les autorisations de votre appareil."
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const triggerSuccess = (code: string) => {
    setDetectedCode(code);
    try {
      // Audio beep
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      osc.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {}

    setTimeout(() => {
      onScan(code);
      onClose();
    }, 400);
  };

  const startDetectionLoop = () => {
    if (!('BarcodeDetector' in window)) {
      return;
    }

    try {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a'],
      });

      const interval = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            if (raw) {
              clearInterval(interval);
              triggerSuccess(raw);
            }
          }
        } catch (e) {
          // Detection frame error
        }
      }, 300);

      return () => clearInterval(interval);
    } catch (e) {}
  };

  if (!isOpen) return null;

  return (
    <div
      id="camera-scanner-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="camera-scanner-card"
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-950/70 border border-indigo-800/40 rounded-lg text-indigo-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Scanner Code-barres Android</h3>
              <p className="text-[11px] text-slate-400">Caméra ML Kit & Détection instantanée</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Viewport / Reticle */}
        <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center space-y-2">
              <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
              <p className="text-[11px] text-slate-400">
                Vous pouvez saisir manuellement le code-barres ci-dessous.
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Aiming Reticle Frame */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-36 border-2 border-emerald-400/80 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  <div className="absolute w-full h-0.5 bg-emerald-400 animate-pulse"></div>
                  <span className="text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded font-mono mt-20">
                    Alignez le code-barres ici
                  </span>
                </div>
              </div>

              {/* Detected overlay badge */}
              {detectedCode && (
                <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-emerald-400 space-y-1">
                  <CheckCircle2 className="w-10 h-10" />
                  <span className="font-mono font-bold text-sm text-white">{detectedCode}</span>
                </div>
              )}
            </>
          )}

          {/* Camera switch toggle button */}
          <button
            type="button"
            onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
            className="absolute bottom-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full border border-slate-700 backdrop-blur-xs cursor-pointer"
            title="Changer de caméra"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Manual Barcode Fallback Input */}
        <div className="p-4 bg-slate-950 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode.trim()) {
                triggerSuccess(manualCode.trim());
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ou saisissez le code manuellement..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg font-mono focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Valider
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center">
            Supporte les formats EAN-13, Code 128, QR Code, et douchettes Bluetooth/USB HID.
          </p>
        </div>
      </div>
    </div>
  );
};
