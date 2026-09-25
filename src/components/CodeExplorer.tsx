/**
 * Android Studio Kotlin Code Explorer & Project Downloader
 * Displays production-ready Kotlin Jetpack Compose source files with syntax views and 1-click export
 */

import React, { useState } from 'react';
import {
  FileCode,
  FolderArchive,
  Copy,
  Check,
  Download,
  Search,
  Code2,
  Cpu,
  Layers,
  FileText,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { ANDROID_FILES, AndroidFile } from '../data/androidProjectFiles';
import { generateAndroidProjectZip, downloadBlob } from '../utils/zipExport';

export const CodeExplorer: React.FC = () => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>('app/src/main/java/com/kidsvatika/hrms/ui/screens/AttendanceCameraScreen.kt');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const selectedFile = ANDROID_FILES.find(f => f.path === selectedFilePath) || ANDROID_FILES[0];

  const filteredFiles = ANDROID_FILES.filter(file => {
    const matchesSearch = file.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCopyCode = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const blob = await generateAndroidProjectZip();
      downloadBlob(blob, 'KidsVatika-HRMS-Android-Project.zip');
    } catch (err) {
      alert('Failed to generate ZIP project: ' + err);
    } finally {
      setDownloadingZip(false);
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'gradle': return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'manifest': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'data': return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'ui': return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'utils': return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      default: return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Top Banner & ZIP Export Action */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Production Kotlin Jetpack Compose Codebase
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            32 Compile-safe, production-ready Android files adhering to Single-Activity MVVM architecture.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={downloadingZip}
          className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-50"
        >
          {downloadingZip ? (
            <span>Building Gradle Project Archive...</span>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Android Studio Project (.ZIP)</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        {/* Left Column: File Tree Selector */}
        <div className="lg:col-span-4 border-r border-slate-800 bg-slate-950/60 p-4 flex flex-col">
          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search Kotlin files & DTOs..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 text-[11px]">
            {['all', 'ui', 'data', 'utils', 'gradle', 'manifest', 'res'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[580px]">
            {filteredFiles.map(file => {
              const isSelected = file.path === selectedFilePath;
              const fileName = file.path.split('/').pop();
              const dirPath = file.path.substring(0, file.path.lastIndexOf('/'));

              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start justify-between border ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/60 text-white'
                      : 'bg-slate-900/40 border-transparent hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="font-semibold truncate">{fileName}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">{dirPath}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">{file.description}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-mono ${getCategoryBadgeColor(file.category)}`}>
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950">
          {/* File Header Details */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono">{selectedFile.path}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${getCategoryBadgeColor(selectedFile.category)}`}>
                  {selectedFile.language.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{selectedFile.description}</p>
            </div>

            <button
              onClick={handleCopyCode}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1.5 px-3 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Viewer with Line Numbers */}
          <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[620px] p-4 text-xs font-mono bg-slate-950 text-slate-200">
            <pre className="leading-relaxed">
              {selectedFile.content.split('\n').map((line, index) => (
                <div key={index} className="table-row hover:bg-slate-900/60">
                  <span className="table-cell text-right pr-4 select-none text-slate-600 text-[11px] w-10">
                    {index + 1}
                  </span>
                  <span className="table-cell whitespace-pre">{line}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
