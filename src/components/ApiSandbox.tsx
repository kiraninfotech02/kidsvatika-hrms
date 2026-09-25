/**
 * Live Backend API Sandbox & OkHttp / Retrofit Network Inspector
 * Direct invocation & testing of https://hrms.kidsvatika.com/api.php
 */

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Send,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Zap,
  Globe,
  Radio,
  Sliders,
  Check
} from 'lucide-react';
import {
  HrmsApiService,
  networkLogs,
  subscribeNetworkLogs,
  NetworkLogItem
} from '../services/apiService';
import { KIDS_VATIKA_GEOFENCE } from '../utils/geoUtils';

export const ApiSandbox: React.FC = () => {
  const [activeAction, setActiveAction] = useState<
    'ping' | 'verify-location' | 'request-challenge' | 'check-in' | 'check-out' | 'login'
  >('ping');
  const [logs, setLogs] = useState<NetworkLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<any>(null);

  // Form params for manual testing
  const [testLat, setTestLat] = useState<number>(30.6390703);
  const [testLng, setTestLng] = useState<number>(76.818226);
  const [testAccuracy, setTestAccuracy] = useState<number>(15.0);
  const [testStaffId, setTestStaffId] = useState<number>(102);
  const [testDeviceId, setTestDeviceId] = useState<string>('a8f9c4e2-9b7d-41a3-92f1-736e4b9982dc');
  const [testLoginId, setTestLoginId] = useState<string>('TCH-102');
  const [testPassword, setTestPassword] = useState<string>('Vatika@2026');
  const [testChallengeToken, setTestChallengeToken] = useState<string>('kv_token_demo_982');

  useEffect(() => {
    const unsub = subscribeNetworkLogs(updatedLogs => {
      setLogs([...updatedLogs]);
    });
    return unsub;
  }, []);

  const handleExecute = async () => {
    setLoading(true);
    setLastResponse(null);
    try {
      let res: any = null;
      switch (activeAction) {
        case 'ping':
          res = await HrmsApiService.ping();
          break;
        case 'verify-location':
          res = await HrmsApiService.verifyLocation(testLat, testLng, testAccuracy);
          break;
        case 'request-challenge':
          res = await HrmsApiService.requestChallenge(testStaffId, testDeviceId);
          break;
        case 'check-in':
          res = await HrmsApiService.checkIn({
            staff_id: testStaffId,
            device_id: testDeviceId,
            latitude: testLat,
            longitude: testLng,
            accuracy: testAccuracy,
            challenge_token: testChallengeToken,
            selfie_image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...[truncated Base64 JPEG ~42KB]',
          });
          break;
        case 'check-out':
          res = await HrmsApiService.checkOut({
            staff_id: testStaffId,
            device_id: testDeviceId,
            latitude: testLat,
            longitude: testLng,
            accuracy: testAccuracy,
          });
          break;
        case 'login':
          res = await HrmsApiService.login(testLoginId, testPassword, testDeviceId);
          break;
      }
      setLastResponse(res);
    } catch (err: any) {
      setLastResponse({ status: 'error', error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                Live Backend Endpoint Tester
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Test the Retrofit contracts directly against <code className="text-cyan-300">https://hrms.kidsvatika.com/api.php</code>
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Target: <strong>https://hrms.kidsvatika.com/api.php</strong></span>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 my-4">
          {[
            { id: 'ping', label: '1. Ping (GET)' },
            { id: 'verify-location', label: '2. Verify Location' },
            { id: 'request-challenge', label: '3. Challenge' },
            { id: 'check-in', label: '4. Check-In' },
            { id: 'check-out', label: '5. Check-Out' },
            { id: 'login', label: '6. Staff Login' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveAction(tab.id as any);
                setLastResponse(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all border ${
                activeAction === tab.id
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Parameters Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 mb-4 text-xs">
          {activeAction === 'ping' && (
            <div className="col-span-2 text-slate-300 space-y-1">
              <p className="font-semibold text-white">GET /api.php?action=ping</p>
              <p className="text-slate-400">Verifies server health, network latency, and Kids Vatika HRMS connectivity.</p>
            </div>
          )}

          {(activeAction === 'verify-location' || activeAction === 'check-in' || activeAction === 'check-out') && (
            <>
              <div>
                <label className="text-slate-400 block mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={testLat}
                  onChange={e => setTestLat(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={testLng}
                  onChange={e => setTestLng(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">GPS Accuracy (Metres)</label>
                <input
                  type="number"
                  value={testAccuracy}
                  onChange={e => setTestAccuracy(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </>
          )}

          {(activeAction === 'request-challenge' || activeAction === 'check-in' || activeAction === 'check-out') && (
            <div>
              <label className="text-slate-400 block mb-1">Staff ID</label>
              <input
                type="number"
                value={testStaffId}
                onChange={e => setTestStaffId(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>
          )}

          {(activeAction === 'request-challenge' || activeAction === 'check-in' || activeAction === 'check-out' || activeAction === 'login') && (
            <div className="col-span-2 sm:col-span-1">
              <label className="text-slate-400 block mb-1">Hardware Device ID</label>
              <input
                type="text"
                value={testDeviceId}
                onChange={e => setTestDeviceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono truncate"
              />
            </div>
          )}

          {activeAction === 'login' && (
            <>
              <div>
                <label className="text-slate-400 block mb-1">Login ID (Staff Code / Phone / Email)</label>
                <input
                  type="text"
                  value={testLoginId}
                  onChange={e => setTestLoginId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Password</label>
                <input
                  type="password"
                  value={testPassword}
                  onChange={e => setTestPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>
            </>
          )}

          <div className="col-span-2 flex items-center justify-end pt-2">
            <button
              onClick={handleExecute}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Request...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Execute Endpoint</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Response Box */}
        {lastResponse && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Response Payload</span>
              </span>
              <span className="text-[10px] bg-slate-900 text-cyan-300 font-mono px-2 py-0.5 rounded border border-slate-800">
                JSON
              </span>
            </div>
            <pre className="text-xs font-mono text-emerald-300 bg-slate-900/60 p-3 rounded-xl overflow-x-auto max-h-48 leading-relaxed">
              {JSON.stringify(lastResponse, null, 2)}
            </pre>
          </div>
        )}

        {/* Network Traffic Inspector Log Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>OkHttp & Retrofit Request History ({logs.length})</span>
            </h3>
            <span className="text-[10px] text-slate-500">Live Traffic Capture</span>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 font-sans text-xs">
                        No network requests dispatched yet. Trigger an action above or punch from the phone emulator!
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 text-slate-500 text-[11px]">{log.timestamp}</td>
                        <td className="py-2 px-3 font-bold text-cyan-400">{log.method}</td>
                        <td className="py-2 px-3 text-slate-200">{log.action}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.responseStatus === 200
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {log.responseStatus}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">{log.durationMs}ms</td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] text-slate-400 capitalize">{log.source}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
