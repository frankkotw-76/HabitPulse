// HabitPulse - FIDO / WebAuthn 生物辨識隱私防護 (Face ID / Touch ID / Windows Hello)

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// 檢測當前瀏覽器與裝置是否支援平台生物辨識 (Face ID / Touch ID)
export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;
  if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (e) {
    return false;
  }
}

// 註冊 Face ID / Touch ID 憑證
export async function registerBiometric(userName = 'HabitPulse User'): Promise<{ success: boolean; error?: string }> {
  try {
    const supported = await isBiometricSupported();
    if (!supported) {
      return { success: false, error: '此裝置或瀏覽器不支援生物辨識 (Face ID / Touch ID)' };
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'HabitPulse',
      },
      user: {
        id: userId,
        name: userName,
        displayName: 'HabitPulse',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // 強制使用裝置端生物辨識 (Face ID, Touch ID, Windows Hello)
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: '註冊已取消' };
    }

    const credIdBase64 = bufferToBase64(credential.rawId);
    localStorage.setItem('habitpulse_bio_cred_id', credIdBase64);
    localStorage.setItem('habitpulse_bio_enabled', 'true');

    return { success: true };
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      return { success: false, error: '生物辨識授權已取消或超時' };
    }
    return { success: false, error: err.message || '生物辨識註冊失敗' };
  }
}

// 執行 Face ID / Touch ID 解鎖驗證
export async function authenticateBiometric(): Promise<{ success: boolean; error?: string }> {
  try {
    const credId = localStorage.getItem('habitpulse_bio_cred_id');
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'required',
    };

    if (credId) {
      publicKeyCredentialRequestOptions.allowCredentials = [
        {
          id: base64ToBuffer(credId),
          type: 'public-key',
          transports: ['internal'],
        },
      ];
    }

    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential;

    if (!assertion) {
      return { success: false, error: '解鎖已取消' };
    }

    return { success: true };
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Face ID 驗證已取消或失敗' };
    }
    return { success: false, error: err.message || '解鎖失敗' };
  }
}

// 狀態管理
export function isBiometricEnabled(): boolean {
  return localStorage.getItem('habitpulse_bio_enabled') === 'true';
}

export function setBiometricEnabled(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem('habitpulse_bio_enabled', 'true');
  } else {
    localStorage.removeItem('habitpulse_bio_enabled');
    localStorage.removeItem('habitpulse_bio_cred_id');
  }
}

// 備用 PIN 碼
export function getBackupPin(): string {
  return localStorage.getItem('habitpulse_bio_pin') || '';
}

export function setBackupPin(pin: string): void {
  if (pin) {
    localStorage.setItem('habitpulse_bio_pin', pin.trim());
  } else {
    localStorage.removeItem('habitpulse_bio_pin');
  }
}

export function verifyPin(pin: string): boolean {
  const savedPin = getBackupPin();
  if (!savedPin) {
    // 預設救援 PIN 碼為 0000
    return pin.trim() === '0000';
  }
  return pin.trim() === savedPin;
}
