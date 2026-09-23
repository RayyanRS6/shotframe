import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainHeader } from './components/MainHeader';
import { CanvasPreview } from './components/CanvasPreview';
import { Toaster } from './components/Toaster';
import { DropOverlay } from './components/DropOverlay';
import { hydrate } from './store/persistence';
import { useShortcuts } from './hooks/useShortcuts';

export default function App() {
  useEffect(() => {
    void hydrate();
  }, []);
  useShortcuts();

  return (
    <div className="flex h-dvh flex-col bg-paper text-ink min-[900px]:flex-row">
      <Sidebar />
      <main className="order-1 flex min-h-0 min-w-0 flex-1 flex-col min-[900px]:order-none">
        <MainHeader />
        <CanvasPreview />
      </main>
      <DropOverlay />
      <Toaster />
    </div>
  );
}
