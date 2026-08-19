'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F5F2] text-[#1D2321] p-6 text-center">
      <h1 className="text-4xl font-bold font-mono text-[#C6362C]">Error</h1>
      <h2 className="text-lg font-bold mt-2">Surveillance Grid Disconnected</h2>
      <p className="text-xs text-[#5B6663] mt-1 max-w-sm">
        An error occurred while loading state telemetry. Please retry connection.
      </p>
      <button 
        onClick={() => reset()}
        className="mt-4 px-4 py-2 bg-[#C2255C] hover:bg-[#A61E4D] text-white text-xs font-bold rounded-lg transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
