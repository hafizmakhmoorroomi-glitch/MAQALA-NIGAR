import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploaderProps {
  onFileProcessed: (text: string) => void;
  isProcessing: boolean;
  onProcessingChange: (status: boolean) => void;
  onTranscribe: (base64: string, mimeType: string) => Promise<void>;
}

export function FileUploader({ onFileProcessed, isProcessing, onProcessingChange, onTranscribe }: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError("File size should be less than 20MB");
      return;
    }

    setError(null);
    onProcessingChange(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        await onTranscribe(base64, file.type);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to read file. Please try again.");
      onProcessingChange(false);
    }
  }, [onTranscribe, onProcessingChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: isProcessing
  } as any);

  return (
    <div className="max-w-xl mx-auto mt-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ease-in-out cursor-pointer group",
          isDragActive ? "border-neutral-900 bg-neutral-100" : "border-neutral-200 hover:border-neutral-400 bg-white",
          isProcessing && "opacity-50 cursor-not-allowed border-neutral-100"
        )}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-sm",
            isDragActive ? "bg-neutral-900 text-white" : "bg-neutral-50 text-neutral-400 group-hover:bg-neutral-100"
          )}>
            {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-xl font-medium text-neutral-900">
              {isProcessing ? "Processing Document..." : "Upload Handwriting Document"}
            </h3>
            <p className="text-sm text-neutral-500 max-w-xs">
              Drag and drop your handwritten PDF or images here. We'll convert it to Nastaliq Urdu for you.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 bg-neutral-50 px-3 py-1.5 rounded-full">
            <FileText className="w-3 h-3" />
            PDF, PNG, JPG (Max 20MB)
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 text-center bg-white border border-neutral-100 p-6 rounded-2xl shadow-sm">
        <h4 className="text-sm font-semibold text-neutral-900 mb-2">How it works:</h4>
        <ul className="text-xs text-neutral-500 space-y-2 text-left list-disc list-inside">
          <li>Upload any handwritten Urdu article (PDF or Image).</li>
          <li>Our AI analyzes the handwriting and transcribes it precisely.</li>
          <li>You can then edit and print the typed text in beautiful Nastaliq font.</li>
          <li>Formatted for A4 pages to match academic and professional standards.</li>
        </ul>
      </div>
    </div>
  );
}
