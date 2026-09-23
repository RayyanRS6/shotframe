import './styles/fonts';
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useSceneStore } from './store/sceneStore';
import { useAssets } from './store/assets';
import { addFiles } from './store/persistence';

if (import.meta.env.DEV) {
  // Handy for manual testing from the devtools console.
  (window as unknown as Record<string, unknown>).__scene = { useSceneStore, useAssets, addFiles };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
