import { initializeFileHandlers } from './modules/fileHandlers.js';
import { initializeViewToggle } from './modules/viewToggle.js';
import { initializeExport, setAppState } from './modules/export.js';
import { showToast } from './modules/toast.js';
import { AppState } from './modules/state.js';
import { refreshDisplay } from './modules/display.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Application initializing...');
  
  // Check if server is running properly
  console.log('Server connection verified at:', new Date().toISOString());
  
  // Initialize app state
  const appState = new AppState();
  
  // Share app state with export module
  setAppState(appState);

  // Check for font loading support
  if (!document.fonts) {
    showToast('Your browser doesn\'t support font loading API');
  }

  try {
    // Initialize all modules
    initializeFileHandlers(appState);
    initializeViewToggle(appState);
    initializeExport(appState);
    
    // If data was loaded from cache, ensure the display is refreshed
    if (appState.loadedFromCache) {
      console.log('Data loaded from cache, refreshing display');
      
      // Ensure the previewSection is displayed
      const previewSection = document.getElementById('previewSection');
      if (previewSection) {
        previewSection.style.display = 'block';
      }
      
      // Ensure table is displayed
      const outputTable = document.getElementById('outputTable');
      if (outputTable) {
        outputTable.style.display = 'table';
      }
      
      // Refresh the display with the loaded data
      setTimeout(() => refreshDisplay(appState), 100);
    }
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    showToast('Error initializing application. Please check console for details.');
  }
}); 