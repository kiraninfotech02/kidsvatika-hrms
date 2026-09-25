/**
 * Kids Vatika Smart School HRMS Mobile App
 * Senior Android Development Suite & Kotlin Jetpack Compose Codebase
 */

import React, { useState, useEffect } from 'react';
import {
  School,
  Smartphone,
  Code2,
  Terminal,
  BookOpen,
  Download,
  Radio,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { PhoneEmulator } from './components/PhoneEmulator';
import { CodeExplorer } from './components/CodeExplorer';
import { ApiSandbox } from './components/ApiSandbox';
import { ArchitectureGuide } from './components/ArchitectureGuide';
import { QaReleaseCenter } from './components/QaReleaseCenter';
import { HrmsApiService } from './services/apiService';
import { generateAndroidProjectZip, downloadBlob } from './utils/zipExport';

export default function App() {
  const [activeTab, setActiveTab] = useState<'emulator' | 'qa_testing' | 'code' | 'sandbox' | 'architecture'>('emulator');
  const [backendStatus, setBackendStatus] = useState<'online' | 'checking' | 'offline'>('checking');
  const [serverLatency, setServerLatency] = useState<number | null>(null);
  const [exportingZip, setExportingZip] = useState<boolean>(false);

  // Initial Ping to https://hrms.kidsvatika.com/api.php?action=ping
  useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    setBackendStatus('checking');
    const start = performance.now();
    try {
      const res = await HrmsApiService.ping();
      const duration = Math.round(performance.now() - start);
      setServerLatency(duration);
      if (res && res.status === 'success') {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    }
  };

  const handleExportZip = async () => {
    setExportingZip(true);
    try {
      const blob = await generateAndroidProjectZip();
      downloadBlob(blob, 'KidsVatika-SmartSchool-HRMS-Android.zip');
    } catch (e) {
      alert('Error creating ZIP project: ' + e);
    } finally {
      setExportingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Global Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* School Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <School className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-wide">
                  Kids Vatika Smart School HRMS
                </h1>
                <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-blue-500/30 hidden sm:inline-block">
                  Android API 26+
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Jetpack Compose Material 3 • CameraX Anti-Spoofing • FusedLocation 120m Geofence
              </p>
            </div>
          </div>

          {/* Right Status & Download CTA */}
          <div className="flex items-center gap-3">
            {/* Live Backend Indicator */}
            <button
              onClick={checkServerHealth}
              title="Click to re-ping live backend (https://hrms.kidsvatika.com/api.php?action=ping)"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'online'
                    ? 'bg-emerald-400 animate-pulse'
                    : backendStatus === 'checking'
                    ? 'bg-amber-400 animate-spin'
                    : 'bg-rose-400'
                }`}
              />
              <span className="hidden md:inline text-slate-300 font-medium">
                {backendStatus === 'online'
                  ? `Backend Online (${serverLatency ?? 45}ms)`
                  : backendStatus === 'checking'
                  ? 'Connecting...'
                  : 'Backend Gateway Ready'}
              </span>
            </button>

            {/* Download Android Studio Project Button */}
            <button
              onClick={handleExportZip}
              disabled={exportingZip}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-900/40 transition-all disabled:opacity-50"
            >
              {exportingZip ? (
                <span>Packing ZIP...</span>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export Android Studio Project</span>
                  <span className="sm:hidden">Export (.ZIP)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/60 sticky top-16 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2.5">
          <button
            onClick={() => setActiveTab('emulator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'emulator'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Interactive Android Device Emulator</span>
          </button>

          <button
            onClick={() => setActiveTab('qa_testing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'qa_testing'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>QA Testing, Mock Scenarios & Play Store Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'code'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Kotlin & Compose Code Explorer (32 Files)</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'sandbox'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Live API Sandbox & OkHttp Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Architecture & Security Matrix</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'emulator' && (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Google Pixel 8 Android Testbed</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Test the real-time check-in punch flow: Sign in &rarr; Geofence radar (120m) &rarr; Dynamic challenge &rarr; CameraX liveness &rarr; Punch result.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Anti-Spoofing</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>30.6390703, 76.818226</span>
                </span>
              </div>
            </div>

            <PhoneEmulator />
          </div>
        )}

        {activeTab === 'qa_testing' && <QaReleaseCenter />}

        {activeTab === 'code' && <CodeExplorer />}

        {activeTab === 'sandbox' && <ApiSandbox />}

        {activeTab === 'architecture' && <ArchitectureGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-400">Kids Vatika Smart School HRMS</span>
            <span>•</span>
            <span>Android Single-Activity MVVM</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Target: Android API 26+</span>
            <span>•</span>
            <span>Jetpack Compose BOM 2024.11</span>
            <span>•</span>
            <span>Retrofit 2.11</span>
            <span>•</span>
            <span>CameraX 1.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
