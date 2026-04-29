import { useState, useRef } from 'react';
import { Download, Printer, Copy, Check, ArrowRight, Sparkles, FileText } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

interface UrduEditorProps {
  initialText: string;
  onClear: () => void;
}

export function UrduEditor({ initialText, onClear }: UrduEditorProps) {
  const [text, setText] = useState(initialText);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const printFn = useReactToPrint({
    contentRef,
    documentTitle: 'Urdu_Article',
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isArabic = (t: string) => /[\u0621-\u064A]/.test(t) && !/[\u0671-\u06D3]/.test(t); // Basic Arabic vs Urdu check
  const isChapter = (t: string) => t.trim().startsWith('باب') || t.trim().startsWith('فصل');
  const isSubheading = (t: string) => t.trim().endsWith(':') || t.trim().endsWith(':-') || t.trim().startsWith('**');

  const handleExportWord = async () => {
    setIsExporting(true);
    try {
      // Group lines into semantic paragraphs for Word export
      const lines = text.split('\n');
      const docParagraphs: { type: 'chapter' | 'subheading' | 'normal', text: string }[] = [];
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (isChapter(trimmed)) {
          docParagraphs.push({ type: 'chapter', text: trimmed });
        } else if (isSubheading(trimmed)) {
          docParagraphs.push({ type: 'subheading', text: trimmed });
        } else {
          const last = docParagraphs[docParagraphs.length - 1];
          if (last && last.type === 'normal') {
            last.text += ' ' + trimmed;
          } else {
            docParagraphs.push({ type: 'normal', text: trimmed });
          }
        }
      });

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: docParagraphs.map(p => {
            let size = 32; // 16pt
            let bold = false;
            let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.BOTH; // FULL JUSTIFY
            
            if (p.type === 'chapter') {
              size = 48; // 24pt
              bold = true;
              alignment = AlignmentType.CENTER;
            } else if (p.type === 'subheading') {
              size = 40; // 20pt
              bold = true;
              alignment = AlignmentType.RIGHT;
            }

            return new Paragraph({
              alignment: alignment,
              bidirectional: true,
              spacing: { 
                line: 480, // Approx 2.0 spacing
                before: 200,
                after: 200
              },
              children: [
                new TextRun({
                  text: p.text,
                  font: isArabic(p.text) ? 'Amiri' : 'Noto Nastaliq Urdu',
                  size: size,
                  bold: bold,
                  rightToLeft: true,
                }),
              ],
            });
          }),
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, 'Urdu_Article.docx');
    } catch (err) {
      console.error('Word export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const pages = (content: string) => {
    const paragraphs = content.split('\n\n');
    const result: string[][] = [[]];
    let currentLength = 0;
    const charsPerPage = 2000;

    paragraphs.forEach(p => {
      if (currentLength + p.length > charsPerPage && result[result.length - 1].length > 0) {
        result.push([p]);
        currentLength = p.length;
      } else {
        result[result.length - 1].push(p);
        currentLength += p.length;
      }
    });

    return result;
  };

  const editorPages = pages(text);

  const processPageText = (lines: string[]) => {
    const segments: { type: 'chapter' | 'subheading' | 'normal', text: string, arabic: boolean }[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        // Add a placeholder for paragraph break or force next segment to be new
        segments.push({ type: 'normal', text: '', arabic: false }); 
        return;
      }

      if (isChapter(trimmed)) {
        segments.push({ type: 'chapter', text: trimmed, arabic: isArabic(trimmed) });
      } else if (isSubheading(trimmed)) {
        segments.push({ type: 'subheading', text: trimmed, arabic: isArabic(trimmed) });
      } else {
        const last = segments[segments.length - 1];
        if (last && last.type === 'normal' && last.text !== '') {
          last.text += ' ' + trimmed;
        } else if (last && last.type === 'normal' && last.text === '') {
          last.text = trimmed;
          last.arabic = isArabic(trimmed);
        } else {
          segments.push({ type: 'normal', text: trimmed, arabic: isArabic(trimmed) });
        }
      }
    });

    return segments.filter(s => s.text !== '').map((seg, idx) => (
      <div
        key={idx}
        className={cn(
          "urdu-text mb-6",
          seg.type === 'chapter' && "text-chapter",
          seg.type === 'subheading' && "text-subheading",
          seg.type === 'normal' && "text-normal",
          seg.arabic && "arabic-text"
        )}
      >
        {seg.text}
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-neutral-100 font-sans">
      {/* Toolbar */}
      <header className="bg-white border-b border-neutral-200 px-6 py-3 flex items-center justify-between no-print z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onClear}
            className="flex items-center gap-2 pr-4 pl-3 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all border border-neutral-200"
            title="Go Back"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm font-medium font-urdu">واپس جائیں</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>

          <button
            onClick={handleExportWord}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-sm font-medium hover:bg-blue-100 transition-all shadow-sm disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'MS Word Download'}
          </button>
          
          <button
            onClick={() => printFn()}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-all shadow-md shadow-neutral-200"
          >
            <Printer className="w-4 h-4" />
            Print / Export PDF
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Editor Side */}
        <section className="w-1/3 border-r border-neutral-200 bg-white no-print p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Urdu Editor
            </h2>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            dir="rtl"
            className="flex-1 w-full font-urdu text-base resize-none outline-none border border-neutral-100 p-6 rounded-2xl bg-neutral-50/50 leading-relaxed text-neutral-800"
            placeholder="اردو تحریر یہاں لکھیں یا اپ لوڈ کریں..."
          />
        </section>

        {/* Preview Side */}
        <section className="flex-1 overflow-y-auto p-12 bg-neutral-100/50 relative">
          <div ref={contentRef} className="mx-auto" style={{ width: '210mm' }}>
            {editorPages.map((pageParagraphs, idx) => (
              <div 
                key={idx} 
                className="a4-page relative mb-12 flex flex-col bg-white shadow-xl rounded-sm"
                style={{ direction: 'rtl' }}
              >
                {/* Visual flourishes for paper */}
                <div className="absolute top-0 left-0 w-full h-1 bg-neutral-900" />
                <div className="absolute top-6 right-10 text-[10px] uppercase tracking-widest text-neutral-300 font-sans font-bold">
                  Page {idx + 1}
                </div>
                
                <div className="flex-1">
                  {editorPages.map((pageParagraphs, idx) => (
                    <div key={idx} className="mb-px last:mb-0">
                      {processPageText(pageParagraphs.join('\n').split('\n'))}
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 border-t border-neutral-100 pt-4 flex justify-between items-center text-[10px] font-mono text-neutral-300">
                  <span>Urdu Makala Nigari App</span>
                  <span>{new Date().toLocaleDateString('ur-PK')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

