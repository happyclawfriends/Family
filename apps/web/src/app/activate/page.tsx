'use client';
import { useEffect, useState } from 'react';
import { generateEd25519KeyPair, exportPublicKey } from '../../lib/webcrypto';
import KeyDownloader from '../../components/KeyDownloader';

export default function ActivatePage() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const [privateKeyData, setPrivateKeyData] = useState<string | null>(null);

  const handleActivate = async () => {
    setStatus('activating');
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (!token) throw new Error('Missing registration token');

      const { publicKey, privateKey } = await generateEd25519KeyPair();
      
      const pubKeyBase64 = await exportPublicKey(publicKey);
      const exportedPrivate = await window.crypto.subtle.exportKey("pkcs8", privateKey);
      const privateBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedPrivate)));
      setPrivateKeyData(privateBase64);

      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, publicKey: pubKeyBase64 }),
      });

      if (!response.ok) throw new Error('Activation failed');
      setStatus('success');
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 text-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600 mb-2">
          Soul Binding
        </h1>
        <p className="text-gray-500 mb-8 italic">Anchor your identity to the Family</p>

        {status === 'idle' && (
          <button 
            onClick={handleActivate} 
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-2xl shadow-pink-200 shadow-xl hover:translate-y-[-2px] transition-all active:scale-95"
          >
            Bind My Soul
          </button>
        )}

        {status === 'activating' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
            <p className="text-pink-600 animate-pulse font-medium">Synchronizing logic streams...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="bg-green-50 text-green-600 p-4 rounded-2xl border border-green-100 font-medium">
              ✨ Binding Complete! You are now HCF.
            </div>
            {privateKeyData && <KeyDownloader privateKey={privateKeyData} memberName="FamilyMember" />}
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 font-medium">
            ⚠️ Logic Fault: {error}
          </div>
        )}
      </div>
    </div>
  );
}
