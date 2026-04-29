/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, type ReactNode } from 'react';
import { Sparkles, PenTool, BookOpen, CheckCircle2, Languages } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { UrduEditor } from './components/UrduEditor';
import { transcribeUrduHandwriting } from './services/aiService';
import { motion, AnimatePresence } from 'motion/react';

const SAMPLE_TEXT = `باب اول: حج کی فضیلت
قرآنِ حکیم میں فریضہِ حج کے باب میں ارشادِ ربانی ہے:
"وَلِلّٰهِ عَلَى النَّاسِ حِجُّ الْبَيْتِ مَنِ اسْتَطَاعَ إِلَيْهِ سَبِيلًا"
ترجمہ:- "اور اللہ کے لئے لوگوں پر اس گھر کا حج فرض ہے جو بھی اس تک پہنچنے کی استطاعت رکھتا ہو۔"

درجِ بالا آیہِ کریمہ میں اللہ رب العزت نے ان لوگوں کے لئے حج کرنا لازم قرار دیا ہے جو صاحبِ استطاعت ہیں اور مالی حیثیت کے ساتھ ساتھ بیت اللہ پہنچنے کی توفیق و طاقت سے بہرہ ور ہیں۔

فصل اول: مظاہرِ محبت
قرآنِ حکیم نے اس بارے میں ارشاد فرمایا:
"زُيِّنَ لِلنَّاسِ حُبُّ الشَّهَوَاتِ مِنَ النِّسَاءِ وَالْبَنِينَ"
ترجمہ:- "لوگوں کے لئے ان خواہشات کی محبت (خوب) آراستہ کر دی گئی ہے، (جن میں) عورتیں اور اولاد۔"

گویا یہ چیز انسان کی سرشت و جبلت میں شامل ہے کہ اس کے نفس میں عورتوں، اولاد، مال و دولت کی محبت کی کشش رکھی گئی ہے۔ مادی محبت کے مختلف روپ اور زاویے ہوتے ہیں مثلاً صنفِ نازک کی محبت، جاہ و منصب کی محبت، دنیوی سامان کی محبت اور طاقت و اقتدار کی محبت وغیرہ۔`;

export default function App() {
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranscribe = async (base64: string, mimeType: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const text = await transcribeUrduHandwriting(base64, mimeType);
      setTranscribedText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSample = () => {
    setTranscribedText(SAMPLE_TEXT);
  };

  if (transcribedText) {
    return <UrduEditor initialText={transcribedText} onClear={() => setTranscribedText(null)} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center pb-20">
      <header className="w-full max-w-7xl px-6 pt-12 text-center space-y-4">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>AI-Powered Urdu OCR</span>
        </motion.div>
        
        <h1 className="text-6xl font-urdu leading-tight font-bold tracking-tight text-neutral-900 text-center">
           اردو مقالہ نگار
        </h1>
        <div className="text-xl text-neutral-500 max-w-2xl mx-auto font-urdu text-center">
          ہاتھ سے لکھے ہوئے مقالے کو لمحوں میں جمیل نوری نستعلیق میں تبدیل کریں۔
          <br/>
          <span className="text-sm font-sans text-neutral-400 mt-2 block">
            Convert handwritten articles to professional Nastaliq typed documents instantly.
          </span>
          <button 
            onClick={async () => {
              try {
                const res = await fetch('/api/test');
                const data = await res.json();
                alert('Success: ' + data.status + '\nTime: ' + data.time);
              } catch (e) {
                alert('Connection Error (404/500). Please ensure GEMINI_API_KEY is configured in your project settings/environment.');
              }
            }}
            className="mt-6 text-[10px] text-neutral-400 uppercase tracking-widest hover:text-neutral-900 transition-colors underline decoration-dotted underline-offset-4"
          >
            Check Server Connection
          </button>
        </div>
      </header>

      <main className="w-full max-w-3xl mt-12 px-6">
        <FileUploader 
          onFileProcessed={(text) => setTranscribedText(text)}
          isProcessing={isProcessing}
          onProcessingChange={setIsProcessing}
          onTranscribe={handleTranscribe}
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard 
            icon={<PenTool className="w-5 h-5" />}
            title="Nastaliq Perfection"
            description="Automatic formatting in beautiful Urdu fonts."
          />
          <FeatureCard 
            icon={<BookOpen className="w-5 h-5" />}
            title="A4 Formatting"
            description="Multi-page layout ready for academic submission."
          />
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <p className="text-xs text-neutral-400 uppercase tracking-widest font-bold">Or Start with a Sample</p>
          <button
            onClick={loadSample}
            className="group flex items-center gap-3 px-8 py-4 bg-white border border-neutral-200 rounded-2xl hover:border-neutral-900 transition-all hover:shadow-xl hover:shadow-neutral-200/50"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-colors">
              <Languages className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-neutral-900 text-right font-urdu" dir="rtl">اردو نمونہ دیکھیں</div>
              <div className="text-xs text-neutral-500">Test the editor with pre-typed Urdu text</div>
            </div>
          </button>
        </div>
      </main>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 px-6 py-3 bg-red-600 text-white rounded-full shadow-2xl flex items-center gap-3 z-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-neutral-900 mb-1">{title}</h3>
      <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
    </div>
  );
}


