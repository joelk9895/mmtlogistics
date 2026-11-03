import Sidebar from '@/components/Sidebar';
import KeyboardProvider from '@/components/KeyboardProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <KeyboardProvider>
      <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[var(--background)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-w-0 h-screen">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </KeyboardProvider>
  );
}

