import React from 'react';
import { ShieldCheck, Lock, EyeOff, Trash2, Cpu, CheckCircle, X, School } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        id="privacy-modal"
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden text-slate-900"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Playfair_Display',serif]">
                Privacy & Data Governance
              </h3>
              <p className="text-xs text-slate-500">Digital Personal Data Protection (DPDP) Act 2023</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-600 leading-relaxed">
          {/* Hardware & Core Statement */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-1.5 text-indigo-950">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <School className="w-4 h-4 text-indigo-600" />
              <span>Zero New Hardware Overhead</span>
            </div>
            <p className="text-indigo-800 text-[11px]">
              Attendit runs on existing classroom tablets, faculty smartphones, and projectors with zero expensive biometric hardware or dedicated scanners.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">On-Device Biometric Embeddings</h4>
                <p className="text-[11px] text-slate-500">
                  Facial liveness verification processes high-dimensional vector embeddings on the client device. Raw facial imagery or biometric captures are never transmitted or stored on cloud servers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">Strict Role-Based Access Control (RBAC)</h4>
                <p className="text-[11px] text-slate-500">
                  Teachers only access student rosters for their assigned course slots; students only access their personal growth profile; institutional administrators only view aggregated cohorts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">Automatic Ephemeral Data Purge</h4>
                <p className="text-[11px] text-slate-500">
                  Dynamic QR tokens expire every 15-30 seconds. Detailed scanning metadata (GPS radius & BLE hashes) is purged upon semester finalization per institutional governance guidelines.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>DPDP Act 2023 Reference: Section 8(4)</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> ISO/IEC 27001 Aligned
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
