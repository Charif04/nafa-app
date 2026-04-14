// Shown by Next.js App Router during client-side page transitions.
// Prevents the white-screen flash while a new page's JS is loading.
export default function ClientLoading() {
  return (
    <div
      className="min-h-dvh flex items-start pt-20 px-4"
      style={{ background: 'var(--nafa-gray-100)' }}
    >
      <div className="w-full space-y-4 animate-pulse">
        <div className="h-10 rounded-2xl w-2/3" style={{ background: 'var(--nafa-gray-200)' }} />
        <div className="h-32 rounded-2xl w-full" style={{ background: 'var(--nafa-gray-200)' }} />
        <div className="h-32 rounded-2xl w-full" style={{ background: 'var(--nafa-gray-200)' }} />
        <div className="h-32 rounded-2xl w-full" style={{ background: 'var(--nafa-gray-200)' }} />
      </div>
    </div>
  );
}
