import { getSelectedIcons } from './display.js';
import { showToast } from './toast.js';

let currentIcons = [];
let appState = null;

export function setCurrentIcons(icons) {
  currentIcons = icons;
}

export function setAppState(state) {
  appState = state;
}

export function initializeExport() {
  const exportFigmaCSVBtn = document.getElementById('exportFigmaCSV');
  const exportSelectedBtn = document.getElementById('exportSelected');
  const exportSVGBtn = document.getElementById('exportSVG');
  const exportJSONBtn = document.getElementById('exportJSON');
  const generateFontMapBtn = document.getElementById('generateFontMap');
  const resetNamesBtn = document.getElementById('resetNames');
  
  if (exportFigmaCSVBtn) {
    exportFigmaCSVBtn.addEventListener('click', () => {
      // Always use the most up-to-date icons data from appState
      if (appState && appState.currentIcons) {
      // Export all icons in CSV format
        exportCSV(appState.currentIcons);
      } else {
        // Fallback to local variable if appState is not available
      exportCSV(currentIcons);
      }
    });
  }

  if (exportSelectedBtn) {
    exportSelectedBtn.addEventListener('click', () => {
      const selectedIconsData = getSelectedIcons();
      if (selectedIconsData.length > 0) {
        // Export selected icons in CSV format
        exportCSV(selectedIconsData);
      }
    });
  }

  if (exportSVGBtn) {
    exportSVGBtn.addEventListener('click', () => {
      const selectedIconsData = getSelectedIcons();
      if (selectedIconsData.length > 0) {
        exportSVG(selectedIconsData);
      }
    });
  }

  if (exportJSONBtn) {
    exportJSONBtn.addEventListener('click', () => {
      const selectedIconsData = getSelectedIcons();
      if (selectedIconsData.length > 0) {
        exportJSON(selectedIconsData);
      }
    });
  }
  
  if (generateFontMapBtn) {
    generateFontMapBtn.addEventListener('click', () => {
      // Always use the most up-to-date icons data from appState
      if (appState && appState.currentIcons) {
        // Export all icons in Simple CSV format with only variableName and unicodeHex
        exportSimpleCSV(appState.currentIcons);
      } else {
        // Fallback to local variable if appState is not available
        exportSimpleCSV(currentIcons);
      }
    });
  }
  
  if (resetNamesBtn) {
    resetNamesBtn.addEventListener('click', () => {
      if (appState) {
        if (confirm('Are you sure you want to restart the process? All cached data will be removed and this cannot be undone.')) {
          appState.clearAllCache();
          // Reload the page after clearing cache
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        showToast('Error: App state not available');
      }
    });
  }
}

function exportCSV(icons) {
  // Create CSV content without headers
  const csvContent = icons.map(icon => {
    const name = escapeCsvValue(icon.properties.name);
    const code = icon.properties.code;
    const unicodeChar = String.fromCharCode(code);
    const unicodeHex = `\\u${code.toString(16).padStart(4, '0')}`;
    const tags = icon.properties.tags ? escapeCsvValue(icon.properties.tags.join(', ')) : '';
    
    return [
      name,           // variableName
      'icons',        // category (fixed as 'icons' for now)
      unicodeChar,    // unicode
      unicodeHex,     // unicodeHex
      tags           // tags
    ].join(',');
  }).join('\n');

  // Generate filename with date and time: FigmaVariables-DDMMYYHM.csv
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const filename = `FigmaVariables-${day}${month}${year}${hours}${minutes}.csv`;

  // Create and download the CSV file
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value) {
  // If the value contains commas, quotes, or newlines, wrap it in quotes
  // and escape any existing quotes
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function exportSVG(icons) {
  const zip = new JSZip();
  
  icons.forEach(icon => {
    const svgContent = icon.svg;
    zip.file(`${icon.name}.svg`, svgContent);
  });
  
  const content = await zip.generateAsync({type: "blob"});
  downloadFile(content, 'icons.zip', 'application/zip');
}

function exportJSON(icons) {
  const jsonData = icons.map(icon => ({
    name: icon.name,
    svg: icon.svg,
    unicode: icon.unicode,
    tags: icon.tags
  }));
  
  const content = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  downloadFile(blob, 'icons.json', 'application/json');
}

function exportSimpleCSV(icons) {
  // Create CSV content without headers
  const csvContent = icons.map(icon => {
    const name = escapeCsvValue(icon.properties.name);
    const code = icon.properties.code;
    const unicodeHex = `0x${code.toString(16)}`;
    
    return [
      name,           // variableName
      unicodeHex      // unicodeHex
    ].join(',');
  }).join('\n');

  // Create and download the CSV file with fixed filename
  downloadFile(csvContent, 'fontMap.csv', 'text/csv;charset=utf-8;');
} 