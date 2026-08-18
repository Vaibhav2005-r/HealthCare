'use client';

import React from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#F6F5F2]">
      <div className="max-w-md bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-[#C6362C]">Surveillance Telemetry Warning</h2>
        <p className="text-xs text-[#5B6663] mt-2 mb-6">
          An unexpected error occurred while processing live district intelligence.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center px-4 py-2 bg-[#C2255C] hover:bg-[#A61E4D] text-white font-bold text-xs rounded-lg transition-colors"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}
