import React, { useState, useEffect } from 'react';
import { authenticateBiometric, verifyPin, getBackupPin } from '../lib/biometric';
import { ShieldCheck, ScanFace, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

interface BiometricLockModalProps {
  isOpen: boolean;
  onUnlock: () => void;
}

export const BiometricLockModal: React.FC<BiometricLockModalProps> = ({ isOpen, onUnlock }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState(false);

  // 嘗試 Face ID 解鎖
  const triggerBiometricAuth = async () => {
    setIsAuthenticating(true);
    setErrorMessage('');
    try {
      const result = await authenticateBiometric();
      if (result.success) {
        onUnlock();
      } else {
        setErrorMessage(result.error || '驗證失敗，請重試或使用備用 PIN 碼');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Face ID 呼叫失敗');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 當開啟時自動嘗試一次（部分瀏覽器需要使用者手勢，若失敗由按鈕觸發）
  useEffect(() => {
    if (isOpen) {
      triggerBiometricAuth();
    }
  }, [isOpen]);

  // PIN 碼驗證
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPin(pinValue)) {
      onUnlock();
    } else {
      setPinError(true);
      setPinValue('');
      setTimeout(() => setPinError(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center flex flex-col items-center">
        {/* App Logo */}
        <div className="relative mb-5">
          <img
            src="/apple-touch-icon.png"
            alt="HabitPulse"
            className="w-20 h-20 rounded-2xl shadow-xl shadow-emerald-500/20 border-2 border-emerald-500/30 object-cover"
          />
          <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-emerald-500 text-slate-950 shadow-md">
            <ScanFace className="w-4 h-4" />
          </div>
        </div>

        <h2 className="text-xl font-extrabold text-white tracking-tight">
          HabitPulse 隱私鎖定
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 mb-6 max-w-xs leading-relaxed">
          已啟用生物辨識防護，請驗證 Face ID / Touch ID 解鎖以檢視個人習慣
        </p>

        {/* 錯誤提示 */}
        {errorMessage && (
          <div className="w-full p-2.5 mb-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-left">{errorMessage}</span>
          </div>
        )}

        {/* 解鎖方式 */}
        {!showPinInput ? (
          <div className="w-full space-y-3">
            <button
              onClick={triggerBiometricAuth}
              disabled={isAuthenticating}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <ScanFace className="w-5 h-5" />
              {isAuthenticating ? '正在啟動 Face ID...' : '點擊使用 Face ID 解鎖'}
            </button>

            <button
              onClick={() => setShowPinInput(true)}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              使用備用 PIN 碼解鎖
            </button>
          </div>
        ) : (
          <form onSubmit={handlePinSubmit} className="w-full space-y-3 animate-in fade-in duration-150">
            <div>
              <input
                type="password"
                maxLength={8}
                autoFocus
                placeholder="請輸入 4-8 位數 PIN 碼"
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value)}
                className={`w-full py-3 px-4 rounded-2xl bg-slate-950 border text-center text-lg font-mono tracking-widest text-white focus:outline-none transition-colors ${
                  pinError
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-slate-750 focus:border-emerald-500'
                }`}
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {getBackupPin() ? '請輸入您設定的備用 PIN 碼' : '尚未自訂 PIN 碼，預設為 0000'}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center justify-center gap-1.5"
            >
              <span>解鎖</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowPinInput(false);
                setPinError(false);
              }}
              className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              返回 Face ID 解鎖
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
