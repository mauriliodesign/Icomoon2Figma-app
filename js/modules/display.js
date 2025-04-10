import { copyToClipboard } from './utils.js';
import { setCurrentIcons } from './export.js';

let selectedIcons = new Set();
let currentIcons = [];
let searchTerm = '';
let filteredIcons = [];
let appState = null; // Global reference to app state

export function refreshDisplay(state) {
  appState = state; // Store appState reference
  currentIcons = state.currentIcons;
  setCurrentIcons(currentIcons);
  filteredIcons = filterIcons(currentIcons);
  
  // Show preview controls only if we have icons
  const previewControls = document.querySelector('.preview-controls');
  if (previewControls) {
    previewControls.style.display = currentIcons.length > 0 ? 'flex' : 'none';
  }
  
  if (state.currentView === 'grid') {
    displayGridView(filteredIcons);
  } else {
    displayTableView(filteredIcons);
  }
  initializeModal();
  initializeSearch();
  initializeSelectionControls();
  initializeViewToggle();
  updateSelectionInfo();
  updateExportButtons();
}

function initializeSearch() {
  const searchInput = document.getElementById('iconSearch');
  const clearButton = document.getElementById('clearSearch');
  if (!searchInput || !clearButton) return;

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
    filteredIcons = filterIcons(currentIcons);
    
    // Show/hide clear button
    clearButton.style.display = searchTerm ? 'block' : 'none';
    
    if (document.getElementById('gridView').style.display === 'grid') {
      displayGridView(filteredIcons);
    } else {
      displayTableView(filteredIcons);
    }
    updateSelectionInfo();
  });

  // Clear search
  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    searchTerm = '';
    filteredIcons = filterIcons(currentIcons);
    clearButton.style.display = 'none';
    
    if (document.getElementById('gridView').style.display === 'grid') {
      displayGridView(filteredIcons);
    } else {
      displayTableView(filteredIcons);
    }
    updateSelectionInfo();
  });
}

function initializeSelectionControls() {
  const exportSelectedBtn = document.getElementById('exportSelected');
  const clearSelectionBtn = document.getElementById('clearSelection');

  if (exportSelectedBtn) {
    exportSelectedBtn.addEventListener('click', () => {
      const selectedIconsData = getSelectedIcons();
      if (selectedIconsData.length > 0) {
        const format = exportSelectedBtn.getAttribute('data-format') || 'svg';
        if (format === 'svg') {
          exportSVG(selectedIconsData);
        } else {
          exportJSON(selectedIconsData);
        }
      }
    });
  }

  if (clearSelectionBtn) {
    clearSelectionBtn.addEventListener('click', () => {
      selectedIcons.clear();
      updateSelectionInfo();
      refreshDisplay({ 
        currentIcons, 
        currentView: document.getElementById('gridView').style.display === 'grid' ? 'grid' : 'table' 
      });
    });
  }
}

function isAllFilteredSelected() {
  return filteredIcons.every(icon => selectedIcons.has(icon.properties.name));
}

function updateExportButtons() {
  // Remove disabled state management for export buttons
  // Export buttons should always be enabled
}

function filterIcons(icons) {
  if (!searchTerm) return icons;
  return icons.filter(icon => 
    icon.properties.name.toLowerCase().includes(searchTerm)
  );
}

function updateSelectionInfo() {
  const exportSelectedBtn = document.getElementById('exportSelected');
  const clearSelectionBtn = document.getElementById('clearSelection');
  const selectedCountElement = document.getElementById('selectedCount');
  
  const hasSelection = selectedIcons.size > 0;
  
  // Update export selected button state
  if (exportSelectedBtn) {
    exportSelectedBtn.disabled = !hasSelection;
  }

  // Show/hide clear selection button
  if (clearSelectionBtn) {
    clearSelectionBtn.style.display = hasSelection ? 'block' : 'none';
  }

  // Update selected count
  if (selectedCountElement) {
    selectedCountElement.textContent = selectedIcons.size;
  }
}

function toggleIconSelection(iconName, element) {
  // Check if the icon is already selected
  if (selectedIcons.has(iconName)) {
    // Remove from selection
    selectedIcons.delete(iconName);
    element.classList.remove('selected');
  } else {
    // Add to selection
    selectedIcons.add(iconName);
    element.classList.add('selected');
  }
  updateSelectionInfo();
}

function initializeViewToggle() {
  const gridViewBtn = document.getElementById('gridViewBtn');
  const tableViewBtn = document.getElementById('tableViewBtn');
  
  if (!gridViewBtn || !tableViewBtn) return;

  gridViewBtn.addEventListener('click', () => {
    gridViewBtn.classList.add('active');
    tableViewBtn.classList.remove('active');
    displayGridView(filteredIcons);
  });

  tableViewBtn.addEventListener('click', () => {
    tableViewBtn.classList.add('active');
    gridViewBtn.classList.remove('active');
    displayTableView(filteredIcons);
  });
}

function displayGridView(icons) {
  const gridContainer = document.getElementById('gridView');
  const tableView = document.getElementById('tableView');
  const outputTable = document.getElementById('outputTable');
  
  gridContainer.innerHTML = '';

  icons.forEach(icon => {
    const name = icon.properties.name;
    const code = icon.properties.code;
    const unicodeChar = String.fromCharCode(code);

    const item = document.createElement('div');
    item.className = `preview-item icon-item ${selectedIcons.has(name) ? 'selected' : ''}`;
    item.setAttribute('data-name', name);
    item.innerHTML = `
      <input type="checkbox" class="icon-checkbox" ${selectedIcons.has(name) ? 'checked' : ''}>
      <i class="icon">${unicodeChar}</i>
      <div class="preview-name">${name}</div>
    `;

    // Add click handler for checkbox
    const checkbox = item.querySelector('.icon-checkbox');
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      toggleIconSelection(name, item);
    });

    // Add click handler for the entire item to show modal
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('icon-checkbox')) {
        showPreviewModal(icon);
      }
    });

    gridContainer.appendChild(item);
  });

  gridContainer.style.display = 'grid';
  tableView.style.display = 'none';
  if (outputTable) outputTable.style.display = 'none';
}

function displayTableView(icons) {
  const tbody = document.querySelector('#outputTable tbody');
  const gridView = document.getElementById('gridView');
  const tableView = document.getElementById('tableView');
  const outputTable = document.getElementById('outputTable');
  
  if (!tbody) return;
  tbody.innerHTML = '';

  icons.forEach(icon => {
    const name = icon.properties.name;
    const code = icon.properties.code;
    const unicodeChar = String.fromCharCode(code);

    const row = document.createElement('tr');
    row.className = selectedIcons.has(name) ? 'selected' : '';
    row.innerHTML = `
      <td>
        <input type="checkbox" class="table-checkbox" ${selectedIcons.has(name) ? 'checked' : ''}>
        <span class="icon-name" data-original-name="${name}">${name}</span>
      </td>
      <td class="icon">${unicodeChar}</td>
      <td>
        <button class="view-details-btn" title="View icon details">View Details</button>
      </td>
    `;

    // Add click handler for checkbox
    const checkbox = row.querySelector('.table-checkbox');
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      toggleIconSelection(name, row);
    });

    // Add click handler for the icon cell
    const iconCell = row.querySelector('td.icon');
    iconCell.addEventListener('click', () => {
      showPreviewModal(icon);
    });
    
    // Add double-click handler for the name span to enable editing
    const nameSpan = row.querySelector('.icon-name');
    nameSpan.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startNameEditing(nameSpan, row, null, null);
    });
    
    // Add view details button functionality
    const viewDetailsButton = row.querySelector('.view-details-btn');
    viewDetailsButton.addEventListener('click', (e) => {
      e.stopPropagation();
      showPreviewModal(icon);
    });

    tbody.appendChild(row);
  });

  gridView.style.display = 'none';
  tableView.style.display = 'block';
  if (outputTable) outputTable.style.display = 'table';
}

// Helper function to start the name editing process
function startNameEditing(nameSpan, row, copyButton, editButton) {
  const originalName = nameSpan.getAttribute('data-original-name');
  const currentName = nameSpan.textContent;
  
  // Create input for editing
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.className = 'edit-name-input';
  
  // Replace span with input
  nameSpan.style.display = 'none';
  
  const firstCell = row.querySelector('td:first-child');
  firstCell.appendChild(input);
  input.focus();
  
  // Handle save on enter or blur
  const saveEdit = () => {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      // Check if the name already exists
      const iconIndex = appState.currentIcons.findIndex(icon => 
        icon.properties.name === originalName
      );
      
      if (appState.nameExists(newName, iconIndex)) {
        // Get a suggested name that doesn't exist
        const suggestedName = appState.getSuggestedName(newName, iconIndex);
        
        // Show warning about duplicate name with suggestion
        if (!confirm(`An icon with the name "${newName}" already exists. Using duplicate names may cause issues when exporting.\n\nWould you like to use "${suggestedName}" instead to avoid duplicates?`)) {
          // User chose not to use suggested name - ask if they want to proceed with duplicate
          if (!confirm("Do you want to proceed with the duplicate name anyway?")) {
            // User chose to cancel, restore original state
            nameSpan.style.display = 'inline';
            input.remove();
            return;
          }
        } else {
          // User chose to use the suggested name
          input.value = suggestedName;
        }
      }
      
      // Update in app state
      if (appState.updateIconName(originalName, input.value.trim())) {
        // Update the name in the DOM
        nameSpan.textContent = input.value.trim();
        nameSpan.setAttribute('data-original-name', input.value.trim());
        
        // Update copyButton if it exists
        if (copyButton) {
          copyButton.setAttribute('data-name', input.value.trim());
        }
        
        // Update editButton if it exists
        if (editButton) {
          editButton.setAttribute('data-name', input.value.trim());
        }
        
        // Update in selectedIcons Set if selected
        if (selectedIcons.has(originalName)) {
          selectedIcons.delete(originalName);
          selectedIcons.add(input.value.trim());
        }
      }
    }
    
    // Clean up
    nameSpan.style.display = 'inline';
    input.remove();
  };
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      nameSpan.style.display = 'inline';
      input.remove();
    }
  });
  
  input.addEventListener('blur', saveEdit);
}

function initializeModal() {
  const modal = document.getElementById('previewModal');
  const closeBtn = modal.querySelector('.close-modal');

  // Close modal when clicking the close button
  closeBtn.onclick = function() {
    modal.style.display = 'none';
  };

  // Close modal when clicking outside
  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

function showPreviewModal(icon) {
  const modal = document.getElementById('previewModal');
  const iconElement = modal.querySelector('.preview-icon .icon');
  const nameElement = document.getElementById('modalIconName');
  const unicodeElement = document.getElementById('modalIconUnicode');
  
  const unicodeChar = String.fromCharCode(icon.properties.code);
  const unicodeHex = icon.properties.code.toString(16).padStart(4, '0');
  
  // Update icon and information
  iconElement.textContent = unicodeChar;
  nameElement.textContent = icon.properties.name;
  nameElement.setAttribute('data-original-name', icon.properties.name);
  unicodeElement.textContent = `\\u${unicodeHex}`;
  
  // Add double-click handler for the name element to enable editing
  nameElement.addEventListener('dblclick', function(e) {
    e.stopPropagation();
    
    // Create input for editing
    const input = document.createElement('input');
    input.type = 'text';
    input.value = nameElement.textContent;
    input.className = 'modal-edit-name-input';
    
    // Replace span with input
    const originalName = nameElement.getAttribute('data-original-name');
    nameElement.style.display = 'none';
    
    const nameContainer = nameElement.parentNode;
    nameContainer.appendChild(input);
    input.focus();
    
    // Handle save on enter or blur
    const saveModalEdit = () => {
      const newName = input.value.trim();
      if (newName && newName !== originalName) {
        // Check if the name already exists
        const iconIndex = appState.currentIcons.findIndex(icon => 
          icon.properties.name === originalName
        );
        
        if (appState.nameExists(newName, iconIndex)) {
          // Get a suggested name that doesn't exist
          const suggestedName = appState.getSuggestedName(newName, iconIndex);
          
          // Show warning about duplicate name with suggestion
          if (!confirm(`An icon with the name "${newName}" already exists. Using duplicate names may cause issues when exporting.\n\nWould you like to use "${suggestedName}" instead to avoid duplicates?`)) {
            // User chose not to use suggested name - ask if they want to proceed with duplicate
            if (!confirm("Do you want to proceed with the duplicate name anyway?")) {
              // User chose to cancel, restore original state
              nameElement.style.display = 'inline';
              input.remove();
              return;
            }
          } else {
            // User chose to use the suggested name
            input.value = suggestedName;
          }
        }
        
        // Update in app state
        if (appState.updateIconName(originalName, input.value.trim())) {
          // Update the name in the DOM
          nameElement.textContent = input.value.trim();
          nameElement.setAttribute('data-original-name', input.value.trim());
          
          // Update the icon object for consistency
          icon.properties.name = input.value.trim();
          
          // Update in selectedIcons Set if selected
          if (selectedIcons.has(originalName)) {
            selectedIcons.delete(originalName);
            selectedIcons.add(input.value.trim());
          }
          
          // Refresh the table/grid view to reflect the changes
          if (appState.currentView === 'grid') {
            displayGridView(filteredIcons);
          } else {
            displayTableView(filteredIcons);
          }
        }
      }
      
      // Clean up
      nameElement.style.display = 'inline';
      input.remove();
    };
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveModalEdit();
      } else if (e.key === 'Escape') {
        nameElement.style.display = 'inline';
        input.remove();
      }
    });
    
    input.addEventListener('blur', saveModalEdit);
  });
  
  // Show modal
  modal.style.display = 'block';
}

// Export the selected icons for other modules to use
export function getSelectedIcons() {
  // Ensure we're using the most up-to-date icons data from the app state
  const icons = appState ? appState.currentIcons : currentIcons;
  
  // Filter based on the selection set which has been updated during name changes
  return icons.filter(icon => selectedIcons.has(icon.properties.name));
} 