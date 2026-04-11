export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--nafa-gray-100)' }}
    >
      {children}
    </div>
  );
}
