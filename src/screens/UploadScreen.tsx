import { useRef, useState, useCallback } from 'react';
import { Upload, Camera, Image as ImageIcon, X, ArrowRight, ArrowLeft, Info, Check } from 'lucide-react';
import Logo from '@/components/Logo';
import HomeButton from '@/components/HomeButton';

interface UploadScreenProps {
  onBack: () => void;
  onHome: () => void;
  onNext: (topImage: string, sideImage: string) => void;
}

type Slot = 'top' | 'side';

interface ImageState {
  data: string | null;
  progress: number;
  isUploading: boolean;
}

export default function UploadScreen({ onBack, onHome, onNext }: UploadScreenProps) {
  const [topImage, setTopImage] = useState<ImageState>({ data: null, progress: 0, isUploading: false });
  const [sideImage, setSideImage] = useState<ImageState>({ data: null, progress: 0, isUploading: false });
  const [isDragging, setIsDragging] = useState<Slot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const topFileRef = useRef<HTMLInputElement>(null);
  const topCameraRef = useRef<HTMLInputElement>(null);
  const sideFileRef = useRef<HTMLInputElement>(null);
  const sideCameraRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<Slot>('top');

  const handleFile = useCallback((file: File, slot: Slot) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB');
      return;
    }
    const setter = slot === 'top' ? setTopImage : setSideImage;
    setter({ data: null, progress: 0, isUploading: true });
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Simulate upload progress
      const interval = setInterval(() => {
        setter((prev) => {
          if (prev.progress >= 100) {
            clearInterval(interval);
            return { data: result, progress: 100, isUploading: false };
          }
          return { ...prev, progress: prev.progress + 5 };
        });
      }, 40);
    };
    reader.onerror = () => setError('Failed to read the image. Please try again.');
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, slot: Slot) => {
    e.preventDefault();
    setIsDragging(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, slot);
  }, [handleFile]);

  const clearImage = (slot: Slot) => {
    const setter = slot === 'top' ? setTopImage : setSideImage;
    setter({ data: null, progress: 0, isUploading: false });
    const ref = slot === 'top' ? topFileRef : sideFileRef;
    if (ref.current) ref.current.value = '';
  };

  const bothReady = topImage.data !== null && sideImage.data !== null && !topImage.isUploading && !sideImage.isUploading;

  const renderSlot = (slot: Slot, state: ImageState, label: string, instruction: string, icon: typeof Upload) => {
    const fileRef = slot === 'top' ? topFileRef : sideFileRef;
    const cameraRef = slot === 'top' ? topCameraRef : sideCameraRef;
    const Icon = icon;

    return (
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Icon size={16} className="text-white" />
          </div>
          <h3 className="font-semibold">{label}</h3>
          {state.data && !state.isUploading && (
            <div className="ml-auto flex items-center gap-1 text-green-600 dark:text-green-400">
              <Check size={16} />
              <span className="text-xs font-medium">Ready</span>
            </div>
          )}
        </div>

        {!state.data && !state.isUploading ? (
          <div
            onDrop={(e) => handleDrop(e, slot)}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(slot); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(null); }}
            className={`glass-card border-2 border-dashed transition-all duration-300 p-6 md:p-8 text-center cursor-pointer min-h-[200px] flex flex-col items-center justify-center
              ${isDragging === slot ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 scale-[1.02]' : 'border-gray-300 dark:border-white/10 hover:border-blue-400'}`}
            onClick={() => { activeSlotRef.current = slot; fileRef.current?.click(); }}
          >
            <div className={`mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 transition-transform duration-300 ${isDragging === slot ? 'scale-110' : 'animate-float'}`}>
              <Upload size={26} className="text-white" />
            </div>
            <p className="text-sm font-medium mb-1">Drag & Drop or tap to browse</p>
            <p className="text-xs text-gray-400 mb-4">{instruction}</p>
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); activeSlotRef.current = slot; fileRef.current?.click(); }}
                className="glass-card px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 hover:scale-105 transition-transform"
              >
                <ImageIcon size={14} className="text-blue-500" />
                Browse
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); activeSlotRef.current = slot; cameraRef.current?.click(); }}
                className="glass-card px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 hover:scale-105 transition-transform"
              >
                <Camera size={14} className="text-blue-500" />
                Camera
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card p-4">
            <div className="relative rounded-2xl overflow-hidden">
              {state.data ? (
                <img src={state.data} alt={`${label} preview`} className="w-full max-h-48 object-contain bg-gray-100 dark:bg-white/5 rounded-2xl" />
              ) : (
                <div className="w-full h-48 skeleton rounded-2xl" />
              )}
              {state.data && !state.isUploading && (
                <button
                  onClick={() => clearImage(slot)}
                  className="absolute top-2 right-2 glass-card p-1.5 rounded-xl hover:scale-110 transition-transform"
                  aria-label="Remove image"
                >
                  <X size={16} className="text-red-500" />
                </button>
              )}
            </div>
            {state.isUploading && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Uploading...</span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{state.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-40" style={{ width: `${state.progress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], slot)} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], slot)} />
      </div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl -z-10" />

      <header className="sticky top-0 z-40 glass border-b border-gray-200/60 dark:border-white/5">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <button onClick={onBack} className="glass-card p-2.5 hover:scale-110 transition-transform">
            <ArrowLeft size={20} className="text-blue-600 dark:text-blue-400" />
          </button>
          <Logo size="sm" />
          <HomeButton onClick={onHome} />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-8">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8">
          {['Upload', 'Activity', 'Analysis', 'Result'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`h-2 rounded-full transition-all duration-500 ${i === 0 ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300 dark:bg-white/10'}`} />
              <span className={`text-xs font-medium hidden sm:inline ${i === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>{step}</span>
            </div>
          ))}
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-2">Upload Your Foot</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">We need two photos for an accurate analysis</p>

        {/* Instructions */}
        <div className="glass-card p-4 mb-6 flex items-start gap-3">
          <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <p><strong>Top-down view:</strong> Place your foot on a plain white surface with a <strong>30 cm ruler</strong> beside it, and photograph from directly above.</p>
            <p><strong>Side-on view:</strong> Capture the inside of your foot from the side to show the arch clearly.</p>
            <p className="text-gray-400">The ruler lets the AI calculate your exact shoe size. Ensure good lighting and a plain background.</p>
          </div>
        </div>

        {/* Two upload slots */}
        <div className="flex flex-col md:flex-row gap-6">
          {renderSlot('top', topImage, 'Top-Down View', 'Photo from directly above the foot', Upload)}
          {renderSlot('side', sideImage, 'Side-On View', 'Side view showing the arch', Upload)}
        </div>

        {error && (
          <div className="mt-4 glass-card p-4 border-l-4 border-red-500 animate-fade-in">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Continue button */}
        <div className="sticky bottom-0 mt-8 pb-6 pt-4 bg-gradient-to-t from-slate-50 dark:from-[#0a0e1a] to-transparent">
          <button
            onClick={() => bothReady && onNext(topImage.data!, sideImage.data!)}
            disabled={!bothReady}
            className="btn-primary ripple group w-full flex items-center justify-center gap-2 text-lg"
          >
            {bothReady ? 'Continue' : 'Upload both photos to continue'}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
