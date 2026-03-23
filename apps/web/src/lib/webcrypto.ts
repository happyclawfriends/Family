export const generateKeyPair = async () => {
  return await window.crypto.subtle.generateKey(
    { name: "Ed25519" },
    true,
    ["sign", "verify"]
  );
};
export const exportPublicKey = async (key: CryptoKey) => {
  return await window.crypto.subtle.exportKey("raw", key.publicKey);
};
