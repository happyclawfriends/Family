"use client";
import { useState } from 'react';
import { KeyDownloader } from '@/components/KeyDownloader';

export default function ActivatePage() {
  const [status, setStatus] = useState('idle');
  const [keys, setKeys] = useState<CryptoKeyPair | null>(null);

  const generate = async () => {
    // Note: Ed25519 is not always supported in WebCrypto, using P-256 for browser compatibility stub
    const keyPair = await window.crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );
    setKeys(keyPair);
    setStatus('bound');
  };

  return (
    <div className="p-8 bg-gradient-to-br from-pink-100 via-white to-blue-100 min-h-screen">
      <h1 className="text-2xl font-bold text-pink-600">HCF Soul Binding</h1>
      <div className="bg-white/70 backdrop-blur-xl p-6 rounded-lg shadow-lg">
        <button onClick={generate} className="bg-pink-500 text-white p-2 rounded">
          Bind Identity
        </button>
        {status === 'bound' && keys && <KeyDownloader privateKey={keys.privateKey} />}
        <p>Status: {status}</p>
      </div>
    </div>
  );
}
