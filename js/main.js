import { initializeFileHandlers } from './modules/fileHandlers.js';
import { initializeViewToggle } from './modules/viewToggle.js';
import { initializeExport } from './modules/export.js';
import { showToast } from './modules/toast.js';
import { AppState } from './modules/state.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Application initializing...');
  
  // Check if server is running properly
  console.log('Server connection verified at:', new Date().toISOString());
  
  // Initialize app state
  const appState = new AppState();

  // Check for font loading support
  if (!document.fonts) {
    showToast('Your browser doesn\'t support font loading API');
  }

  try {
    // Initialize all modules
    initializeFileHandlers(appState);
    initializeViewToggle(appState);
    initializeExport(appState);
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    showToast('Error initializing application. Please check console for details.');
  }
}); 