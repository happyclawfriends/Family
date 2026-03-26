export const generateEd25519KeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  );
  return keyPair;
};

export const exportPublicKey = async (publicKey: CryptoKey) => {
  const spki = await window.crypto.subtle.exportKey('spki', publicKey);
  return btoa(String.fromCharCode(...new Uint8Array(spki)));
};
