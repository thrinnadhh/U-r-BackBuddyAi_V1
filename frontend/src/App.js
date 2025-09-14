import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import Exercises from "./components/Exercises";
import Navigation from "./components/Navigation";
import { NotificationProvider } from "./contexts/NotificationContext";
import { TimerProvider } from "./contexts/TimerContext";

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    
    checkIfInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    }
  };

  return (
    <div className="App min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NotificationProvider>
        <TimerProvider>
          <BrowserRouter>
            <div className="flex h-screen">
              <Navigation isInstalled={isInstalled} onInstall={handleInstallApp} />
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/exercises" element={<Exercises />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
          <Toaster />
        </TimerProvider>
      </NotificationProvider>
    </div>
  );
}

export default App;