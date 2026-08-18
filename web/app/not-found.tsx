'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#F6F5F2]">
      <div className="max-w-md bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#1D2321]">404 - Page Not Found</h2>
        <p className="text-sm text-[#5B6663] mt-2 mb-6">
          The surveillance page or resource you requested does not exist.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 bg-[#C2255C] hover:bg-[#A61E4D] text-white font-bold text-sm rounded-lg transition-colors"
        >
          Return to Command Dashboard
        </Link>
      </div>
    </div>
  );
}
