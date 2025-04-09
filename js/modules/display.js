import { copyToClipboard } from './utils.js';
import { setCurrentIcons } from './export.js';

let selectedIcons = new Set();
let currentIcons = [];
let searchTerm = '';
let filteredIcons = [];

export function refreshDisplay(appState) {
  currentIcons = appState.currentIcons;
  setCurrentIcons(currentIcons);
  filteredIcons = filterIcons(currentIcons);
  
  // Show preview controls only if we have icons
  const previewControls = document.querySelector('.preview-controls');
  if (previewControls) {
    previewControls.style.display = currentIcons.length > 0 ? 'flex' : 'none';
  }
  
  if (appState.currentView === 'grid') {
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
  if (selectedIcons.has(iconName)) {
    selectedIcons.delete(iconName);
    element.classList.remove('selected');
  } else {
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
      <button class="copy-button" data-unicode="${unicodeChar}" data-name="${name}">Copy</button>
    `;

    // Add click handler for checkbox
    const checkbox = item.querySelector('.icon-checkbox');
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      toggleIconSelection(name, item);
    });

    // Add click handler for the entire item to show modal
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('copy-button') && !e.target.classList.contains('icon-checkbox')) {
        showPreviewModal(icon);
      }
    });

    // Add click handler for copy button
    const copyButton = item.querySelector('.copy-button');
    copyButton.addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(unicodeChar, name);
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
    const unicodeHex = code.toString(16).padStart(4, '0');

    const row = document.createElement('tr');
    row.className = selectedIcons.has(name) ? 'selected' : '';
    row.innerHTML = `
      <td>
        <input type="checkbox" class="table-checkbox" ${selectedIcons.has(name) ? 'checked' : ''}>
        ${name}
      </td>
      <td>\\u${unicodeHex}</td>
      <td class="icon">${unicodeChar}</td>
      <td><button class="copy-button" data-unicode="${unicodeChar}" data-name="${name}">Copy</button></td>
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

    // Add click handler for copy button
    const copyButton = row.querySelector('.copy-button');
    copyButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const unicode = e.target.getAttribute('data-unicode');
      const iconName = e.target.getAttribute('data-name');
      copyToClipboard(unicode, iconName);
    });

    tbody.appendChild(row);
  });

  gridView.style.display = 'none';
  tableView.style.display = 'block';
  if (outputTable) outputTable.style.display = 'table';
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
  unicodeElement.textContent = `\\u${unicodeHex}`;
  
  // Show modal
  modal.style.display = 'block';
}

// Export the selected icons for other modules to use
export function getSelectedIcons() {
  return currentIcons.filter(icon => selectedIcons.has(icon.properties.name));
} 