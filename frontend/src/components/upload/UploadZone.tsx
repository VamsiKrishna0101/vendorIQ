import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { Upload, X, FileText, File } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  file: File;
}

interface UploadZoneProps {
  onFilesChange: (files: UploadedFile[]) => void;
}

export function UploadZone({ onFilesChange }: UploadZoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList) => {
    const added: UploadedFile[] = Array.from(newFiles).map(f => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      progress: 0,
      file: f,
    }));
    const updated = [...files, ...added];
    setFiles(updated);

    // Simulate upload progress
    added.forEach(file => {
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 20;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
        }
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, progress: p } : f));
      }, 150);
    });

    onFilesChange(updated);
  };

  const removeFile = (id: string) => {
    const updated = files.filter(f => f.id !== id);
    setFiles(updated);
    onFilesChange(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Drop Zone */}
      <motion.div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
        }}
        animate={{
          borderColor: isDragging ? '#E8A930' : '#1E1E22',
          backgroundColor: isDragging ? 'rgba(232,169,48,0.04)' : 'transparent',
        }}
        className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-colors"
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDragging ? 'bg-[#E8A930]/20' : 'bg-[#1C1C21]'}`}>
          <Upload size={22} className={isDragging ? 'text-[#E8A930]' : 'text-[#6B6B72]'} />
        </div>
        <div className="text-center">
          <p className="text-[#F0F0F0] font-medium mb-1">Drop vendor documents here</p>
          <p className="text-[13px] text-[#6B6B72]">PDF, DOCX, TXT — up to 10 files</p>
        </div>
        <span className="text-[12px] text-[#E8A930] border border-[#E8A930]/30 px-3 py-1.5 rounded-lg">
          Browse Files
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
        />
      </motion.div>

      {/* File List */}
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map(file => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 bg-[#16161A] border border-[#1E1E22] rounded-lg p-3"
            >
              <div className="w-8 h-8 rounded bg-[#1C1C21] flex items-center justify-center flex-shrink-0">
                {file.name.endsWith('.pdf') ? (
                  <FileText size={14} className="text-[#DC2626]" />
                ) : (
                  <File size={14} className="text-[#E8A930]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#F0F0F0] truncate">{file.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-[#1E1E22] rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${file.progress}%` }}
                      className="h-full bg-[#E8A930] rounded-full"
                    />
                  </div>
                  <span className="text-[11px] text-[#6B6B72] flex-shrink-0">{formatSize(file.size)}</span>
                </div>
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="text-[#6B6B72] hover:text-[#DC2626] transition-colors p-1"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
