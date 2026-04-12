'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('[Client error]', error);
  }, [error]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-8 text-center"
      style={{ background: 'var(--nafa-gray-100)' }}>
      <p className="text-sm font-medium" style={{ color: 'var(--nafa-gray-700)' }}>
        Une erreur est survenue sur cette page.
      </p>
      <div className="flex gap-3">
        <button onClick={reset}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--nafa-orange)' }}>
          Réessayer
        </button>
        <button onClick={() => router.push('/home')}
          className="px-4 py-2 rounded-xl text-sm font-medium border"
          style={{ borderColor: 'var(--nafa-gray-200)', color: 'var(--nafa-gray-700)' }}>
          Accueil
        </button>
      </div>
    </div>
  );
}
