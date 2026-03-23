import React from 'react';

export const KeyDownloader = ({ privateKey }: { privateKey: CryptoKey }) => {
  const downloadKey = () => {
    const blob = new Blob([JSON.stringify(privateKey)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soul-key.json';
    a.click();
  };
  return (
    <button onClick={downloadKey} className="bg-pink-500 text-white p-2 rounded">
      🗝️ Download Your Soul Key
    </button>
  );
};
