type Props = {
  privateKey: string;
  memberName: string;
};

export default function KeyDownloader({ privateKey, memberName }: Props) {
  const downloadKey = () => {
    const blob = new Blob([privateKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${memberName || 'family-member'}-ed25519-private-key.pkcs8.b64`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={downloadKey} className="bg-pink-500 text-white p-2 rounded">
      🗝️ Download Your Soul Key
    </button>
  );
}
