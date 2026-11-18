import React from 'react';
import { X } from 'lucide-react';
import { useStore } from './store.jsx';
import ICampusRail from './components/ICampusRail.jsx';
import ICampusHome from './components/ICampusHome.jsx';
import Hub from './components/Hub.jsx';

export default function App() {
  const { screen, toasts, dismissToast } = useStore();
  return (
    <div className="app">
      <ICampusRail />
      {screen === 'hub' ? <Hub /> : <ICampusHome />}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span>{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  t.action.onClick();
                  dismissToast(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
            <button type="button" className="icon-btn" aria-label="닫기" onClick={() => dismissToast(t.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
