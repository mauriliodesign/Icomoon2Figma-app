import { showToast } from './toast.js';

export class AppState {
  constructor() {
    this._currentFont = null;
    this._currentIcons = [];
    this._currentView = 'table';
    this._subscribers = new Set();
    this._nameChanges = this._loadNameChanges(); // Load name changes from localStorage
    this._loadedFromCache = false; // Flag to indicate data was loaded from cache
    this.updateIconCounter(0); // Initialize counter
    
    // Try to load cached data on initialization
    this._loadCachedData();
  }

  // Get flag indicating if data was loaded from cache
  get loadedFromCache() {
    return this._loadedFromCache;
  }

  // Update icon counter in the UI
  updateIconCounter(count) {
    const iconCounter = document.getElementById('iconCount');
    if (iconCounter) {
      iconCounter.textContent = count;
    }
  }

  // Load name changes from localStorage
  _loadNameChanges() {
    try {
      const storedChanges = localStorage.getItem('iconNameChanges');
      return storedChanges ? JSON.parse(storedChanges) : {};
    } catch (error) {
      console.error('Error loading name changes from localStorage:', error);
      return {};
    }
  }

  // Save name changes to localStorage
  _saveNameChanges() {
    try {
      localStorage.setItem('iconNameChanges', JSON.stringify(this._nameChanges));
    } catch (error) {
      console.error('Error saving name changes to localStorage:', error);
    }
  }
  
  // Save current data to localStorage
  _saveCurrentData() {
    try {
      if (this._currentIcons && this._currentIcons.length) {
        // Save the current icons data
        localStorage.setItem('cachedIconsData', JSON.stringify({
          icons: this._currentIcons,
          timestamp: new Date().getTime()
        }));
        console.log('Icon data cached successfully');
      }
      
      // Save font data if available
      if (this._currentFont) {
        // We can only store the font name, not the actual font object
        localStorage.setItem('cachedFontInfo', JSON.stringify({
          fontName: this._fontName || 'icomoon',
          timestamp: new Date().getTime()
        }));
        console.log('Font info cached successfully');
      }
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }
  
  // Load cached data from localStorage
  _loadCachedData() {
    try {
      // Load cached icons data
      const cachedIconsData = localStorage.getItem('cachedIconsData');
      if (cachedIconsData) {
        const parsedData = JSON.parse(cachedIconsData);
        if (parsedData && parsedData.icons && parsedData.icons.length) {
          this._currentIcons = parsedData.icons;
          this.updateIconCounter(parsedData.icons.length);
          this._loadedFromCache = true; // Set flag indicating data was loaded from cache
          
          // Show the preview section
          const previewSection = document.getElementById('previewSection');
          if (previewSection) {
            previewSection.style.display = 'block';
          }
          
          // Show the table if in table view (which is default)
          const outputTable = document.getElementById('outputTable');
          if (outputTable) {
            outputTable.style.display = 'table';
          }
          
          // Apply any stored name changes
          setTimeout(() => this.applyStoredNameChanges(), 0);
          
          console.log('Loaded cached icons data');
          showToast('Loaded cached data');
        }
      }
      
      // Load cached font info
      const cachedFontInfo = localStorage.getItem('cachedFontInfo');
      if (cachedFontInfo) {
        const parsedFontInfo = JSON.parse(cachedFontInfo);
        if (parsedFontInfo && parsedFontInfo.fontName) {
          this._fontName = parsedFontInfo.fontName;
          // Note: We can't restore the actual font object from localStorage
          // User will need to re-upload the font file
        }
      }
      
      // Notify subscribers if we loaded data
      if (this._currentIcons && this._currentIcons.length) {
        this._notifySubscribers();
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  }

  // Apply stored name changes to loaded icons
  applyStoredNameChanges() {
    if (!this._currentIcons.length || !Object.keys(this._nameChanges).length) {
      return;
    }

    const iconsByPath = {};
    
    // First pass: create a map of icons by path for quick lookup
    this._currentIcons.forEach(icon => {
      if (icon.properties && icon.properties.name && icon.icon && icon.icon.paths) {
        // Create a hash from the path data to identify icons regardless of their current name
        const pathHash = JSON.stringify(icon.icon.paths);
        iconsByPath[pathHash] = icon;
      }
    });

    // Second pass: apply name changes
    Object.entries(this._nameChanges).forEach(([pathHash, newName]) => {
      if (iconsByPath[pathHash]) {
        iconsByPath[pathHash].properties.name = newName;
      }
    });

    // Notify that changes were applied
    this._notifySubscribers();
  }

  // Getters
  get currentFont() {
    return this._currentFont;
  }

  get currentIcons() {
    return this._currentIcons;
  }

  get currentView() {
    return this._currentView;
  }
  
  get fontName() {
    return this._fontName;
  }

  // Setters with state updates
  set currentFont(font) {
    this._currentFont = font;
    this._notifySubscribers();
    this._saveCurrentData();
  }

  set currentIcons(icons) {
    this._currentIcons = icons;
    this.updateIconCounter(icons.length); // Update counter when icons change
    
    // Apply any stored name changes
    setTimeout(() => this.applyStoredNameChanges(), 0);
    
    this._notifySubscribers();
    this._saveCurrentData();
  }

  set currentView(view) {
    this._currentView = view;
    this._notifySubscribers();
  }
  
  set fontName(name) {
    this._fontName = name;
    this._saveCurrentData();
  }

  // Update icon name by its original name
  updateIconName(originalName, newName) {
    const iconIndex = this._currentIcons.findIndex(icon => 
      icon.properties.name === originalName
    );
    
    if (iconIndex !== -1) {
      // Create a new object to ensure reactivity
      const updatedIcon = {...this._currentIcons[iconIndex]};
      updatedIcon.properties = {...updatedIcon.properties, name: newName};
      
      // Create a path hash to identify this icon regardless of name changes
      const pathHash = JSON.stringify(updatedIcon.icon.paths);
      
      // Save the name change persistently
      this._nameChanges[pathHash] = newName;
      this._saveNameChanges();
      
      // Create a new array with the updated icon
      const updatedIcons = [...this._currentIcons];
      updatedIcons[iconIndex] = updatedIcon;
      
      // Update the state
      this._currentIcons = updatedIcons;
      this._notifySubscribers();
      this._saveCurrentData();
      
      return true;
    }
    
    return false;
  }

  // Subscribe to state changes
  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  // Notify all subscribers of state changes
  _notifySubscribers() {
    this._subscribers.forEach(callback => callback(this));
  }

  // Clear only name changes cache
  clearNameChanges() {
    this._nameChanges = {};
    this._saveNameChanges();
    showToast('Name changes cache cleared');
  }
  
  // Clear all cached data (both names and icon data)
  clearAllCache() {
    // Clear name changes
    this._nameChanges = {};
    this._saveNameChanges();
    
    // Clear cached icon data
    localStorage.removeItem('cachedIconsData');
    localStorage.removeItem('cachedFontInfo');
    
    showToast('Process restarted successfully');
  }

  // Check if there are icons with duplicate names
  findDuplicateNames() {
    if (!this._currentIcons || this._currentIcons.length === 0) {
      return [];
    }
    
    const nameCount = {};
    const nameIndices = {};
    const duplicates = [];
    
    // Count occurrences of each name and track their indices
    this._currentIcons.forEach((icon, index) => {
      const name = icon.properties.name;
      nameCount[name] = (nameCount[name] || 0) + 1;
      
      // Track indices of each name
      if (!nameIndices[name]) {
        nameIndices[name] = [];
      }
      nameIndices[name].push(index);
    });
    
    // Find all names that appear more than once
    for (const [name, count] of Object.entries(nameCount)) {
      if (count > 1) {
        duplicates.push({ 
          name, 
          count,
          indices: nameIndices[name],  // Add the indices of all occurrences
          paths: nameIndices[name].map(index => {
            // Create a short hash from the path data for identification
            const paths = this._currentIcons[index].icon.paths;
            if (paths && paths.length > 0) {
              // Just use first 10 chars of first path as a simple identifier
              return paths[0].substring(0, 10) + '...';
            }
            return 'No path data';
          })
        });
      }
    }
    
    return duplicates;
  }
  
  // Get a helpful suggestion for resolving duplicate names
  getSuggestedName(originalName, index) {
    // If the name doesn't exist or index is -1, just return the original name
    if (!this.nameExists(originalName, index)) {
      return originalName;
    }
    
    // Try adding numeric suffixes until we find a non-duplicate name
    let counter = 1;
    let suggestedName = `${originalName}_${counter}`;
    
    while (this.nameExists(suggestedName, index)) {
      counter++;
      suggestedName = `${originalName}_${counter}`;
    }
    
    return suggestedName;
  }
  
  // Automatically fix all duplicate names in the current icon set
  autoFixDuplicateNames() {
    const duplicates = this.findDuplicateNames();
    if (duplicates.length === 0) {
      return { fixed: 0, total: 0 };
    }
    
    let fixCount = 0;
    
    // For each duplicate name
    duplicates.forEach(duplicate => {
      const { name, indices } = duplicate;
      
      // Skip the first occurrence (keep original)
      for (let i = 1; i < indices.length; i++) {
        const index = indices[i];
        const icon = this._currentIcons[index];
        const originalName = icon.properties.name;
        
        // Generate a new name with a suffix
        const newName = `${name}_${i}`;
        
        // Update the icon name
        if (this.updateIconName(originalName, newName)) {
          fixCount++;
        }
      }
    });
    
    return {
      fixed: fixCount,
      total: duplicates.reduce((sum, d) => sum + d.count - 1, 0) // Sum of duplicates minus the original
    };
  }
  
  // Generate a report of all duplicate names
  getDuplicatesReport() {
    const duplicates = this.findDuplicateNames();
    if (duplicates.length === 0) {
      return "No duplicate names found.";
    }
    
    let report = `Found ${duplicates.length} duplicate icon names:\n\n`;
    
    duplicates.forEach((duplicate, i) => {
      const { name, count, indices } = duplicate;
      report += `${i+1}. "${name}" appears ${count} times at indices: ${indices.join(', ')}\n`;
    });
    
    report += "\nDuplicate names can cause issues when exporting to Figma, as variables with the same name will overwrite each other.";
    report += "\nConsider using the auto-fix function or manually rename the icons.";
    
    return report;
  }
  
  // Check if a specific name already exists in the icons set
  nameExists(name, exceptIconIndex = -1) {
    if (!this._currentIcons || this._currentIcons.length === 0) {
      return false;
    }
    
    return this._currentIcons.some((icon, index) => 
      index !== exceptIconIndex && icon.properties.name === name
    );
  }
} 