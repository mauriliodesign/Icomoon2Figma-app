import { refreshDisplay } from './display.js';

export function initializeViewToggle(appState) {
  const viewButtons = document.querySelectorAll('.view-toggle button');
  
  viewButtons.forEach(button => {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      appState.currentView = view;
      
      // Update button states
      viewButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
      });

      refreshDisplay(appState);
    });
  });
} 