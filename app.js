'use strict';

// 1. Logique des onglets (Performant & a11y)
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[role="tabpanel"]');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetId = tab.getAttribute('aria-controls');
            
            // Éviter le blocage du thread principal (INP optimization)
            requestAnimationFrame(() => {
                // Reset states
                tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
                panels.forEach(p => p.setAttribute('hidden', 'true'));
                
                // Set active states
                tab.setAttribute('aria-selected', 'true');
                document.getElementById(targetId).removeAttribute('hidden');
            });
        });

        // Navigation au clavier (Flèches)
        tab.addEventListener('keydown', (e) => {
            const index = Array.prototype.indexOf.call(tabs, tab);
            let nextIndex = null;

            if (e.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
            if (e.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;

            if (nextIndex !== null) {
                tabs[nextIndex].focus();
                tabs[nextIndex].click();
            }
        });
    });
});

// 2. Enregistrement du Service Worker & Mises à jour fluides
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(registration => {
            // Détection de nouvelle version
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateToast(newWorker);
                    }
                });
            });
        }).catch(err => console.error('Erreur PWA:', err));
    });
}

function showUpdateToast(worker) {
    const toast = document.getElementById('pwa-toast');
    const refreshBtn = document.getElementById('pwa-refresh');
    
    toast.removeAttribute('hidden');
    refreshBtn.addEventListener('click', () => {
        worker.postMessage({ action: 'skipWaiting' });
    });
}

// Rechargement après mise à jour du SW
let refreshing = false;
navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
        window.location.reload();
        refreshing = true;
    }
});