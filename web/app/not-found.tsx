import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F5F2] text-[#1D2321] p-6 text-center">
      <h1 className="text-4xl font-bold font-mono text-[#C2255C]">404</h1>
      <h2 className="text-lg font-bold mt-2">Page Not Found</h2>
      <p className="text-xs text-[#5B6663] mt-1 max-w-sm">
        The requested surveillance view or resource does not exist.
      </p>
      <Link 
        href="/"
        className="mt-4 px-4 py-2 bg-[#C2255C] hover:bg-[#A61E4D] text-white text-xs font-bold rounded-lg transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
