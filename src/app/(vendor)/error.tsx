'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VendorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[Vendor error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center" style={{ minHeight: '60vh' }}>
      <p className="text-sm font-medium" style={{ color: 'var(--nafa-gray-700)' }}>
        Une erreur est survenue.
      </p>
      <div className="flex gap-3">
        <button onClick={reset}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--nafa-orange)' }}>
          Réessayer
        </button>
        <button onClick={() => router.push('/vendor/dashboard')}
          className="px-4 py-2 rounded-xl text-sm font-medium border"
          style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)' }}>
          Tableau de bord
        </button>
      </div>
    </div>
  );
}
