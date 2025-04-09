import { showToast } from './toast.js';
import { refreshDisplay } from './display.js';

const VALID_FONT_TYPES = [
  'font/woff',
  'font/woff2',
  'font/ttf',
  'font/otf',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/font-woff',
  'application/font-woff2'
];

// Add font style to document head
const fontStyle = document.createElement('style');
document.head.appendChild(fontStyle);

export function initializeFileHandlers(appState) {
  const dropZones = {
    json: document.getElementById('jsonDropZone'),
    font: document.getElementById('fontDropZone')
  };

  const fileInputs = {
    json: document.getElementById('fileInput'),
    font: document.getElementById('fontInput')
  };

  // Initialize delete buttons
  Object.entries(dropZones).forEach(([type, zone]) => {
    const deleteBtn = zone.querySelector('.delete-file');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleFileDelete(type, appState, zone, fileInputs[type]);
      });
    }
  });

  // Add drag and drop listeners for both zones
  Object.entries(dropZones).forEach(([type, zone]) => {
    if (!zone) {
      console.error(`Drop zone for ${type} not found`);
      return;
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      zone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      zone.addEventListener(eventName, () => highlight(zone), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      zone.addEventListener(eventName, () => unhighlight(zone), false);
    });

    zone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (type === 'json') {
        handleJsonFile(file, appState, zone);
      } else {
        handleFontFile(file, appState, zone);
      }
    }, false);
  });

  // File input listeners
  Object.entries(fileInputs).forEach(([type, input]) => {
    if (!input) {
      console.error(`File input for ${type} not found`);
      return;
    }

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (type === 'json') {
        handleJsonFile(file, appState, dropZones[type]);
      } else {
        handleFontFile(file, appState, dropZones[type]);
      }
    });
  });
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight(element) {
  element.style.borderColor = 'var(--primary)';
}

function unhighlight(element) {
  if (!element.classList.contains('file-loaded')) {
    element.style.borderColor = 'var(--border)';
  }
}

function updateFileLoadedState(zone, file) {
  // Adicionar a classe file-loaded ao zone
  zone.classList.add('file-loaded');
  
  // Configurar o estilo da borda
  zone.style.borderColor = 'var(--primary)';
  zone.style.borderStyle = 'solid';
  
  // Atualizar a exibição do nome do arquivo
  const fileInfo = zone.querySelector('.file-info');
  const fileName = zone.querySelector('.file-name');
  
  if (fileInfo && fileName) {
    fileName.textContent = file.name;
    fileInfo.style.display = 'flex';
    console.log('File info updated:', file.name);
  } else {
    console.error('File info elements not found in zone:', zone.id);
  }
}

function handleFileDelete(type, appState, zone, input) {
  // Reset the file input
  if (input) {
    input.value = '';
  }

  // Reset the upload zone appearance
  zone.classList.remove('file-loaded');
  zone.style.borderColor = 'var(--border)';
  const fileInfo = zone.querySelector('.file-info');
  if (fileInfo) {
    fileInfo.style.display = 'none';
  }

  // Reset the appropriate state
  if (type === 'json') {
    appState.currentIcons = [];
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('outputTable').style.display = 'none';
  } else if (type === 'font') {
    appState.currentFont = null;
    fontStyle.textContent = '';
  }

  refreshDisplay(appState);
  showToast('File removed');
}

async function handleFontFile(file, appState, zone) {
  if (!file) {
    console.error('No font file provided');
    return;
  }

  console.log('Processing font file:', file.name, 'Type:', file.type);

  if (!file.name.match(/\.(woff2?|ttf|otf)$/i)) {
    showToast('Please upload a valid font file (woff, woff2, ttf, or otf)');
    return;
  }

  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const fontBlob = new Blob([arrayBuffer], { type: file.type || 'font/ttf' });
    const fontUrl = URL.createObjectURL(fontBlob);

    const fontFace = new FontFace('icomoon', `url(${fontUrl})`);
    
    console.log('Loading font face...');
    const loadedFont = await fontFace.load();
    console.log('Font face loaded successfully');

    document.fonts.delete(loadedFont);
    document.fonts.add(loadedFont);

    fontStyle.textContent = `
      @font-face {
        font-family: 'icomoon';
        src: url('${fontUrl}') format('${getFontFormat(file.name)}');
        font-weight: normal;
        font-style: normal;
        font-display: block;
      }
    `;

    appState.currentFont = loadedFont;
    updateFileLoadedState(zone, file);
    showToast('Font loaded successfully');
    refreshDisplay(appState);

  } catch (error) {
    console.error('Error loading font:', error);
    showToast('Error loading font file. Please check the console for details.');
  }
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function getFontFormat(filename) {
  if (filename.endsWith('.woff2')) return 'woff2';
  if (filename.endsWith('.woff')) return 'woff';
  if (filename.endsWith('.ttf')) return 'truetype';
  if (filename.endsWith('.otf')) return 'opentype';
  return 'truetype';
}

function handleJsonFile(file, appState, zone) {
  if (!file) {
    console.error('No JSON file provided');
    return;
  }

  console.log('Processing JSON file:', file.name);

  if (!file.name.toLowerCase().endsWith('.json')) {
    showToast('Please select a valid selection.json file');
    return;
  }

  // Atualizar o estado visual do dropzone imediatamente
  updateFileLoadedState(zone, file);

  const reader = new FileReader();
  
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      
      if (!data.icons || !Array.isArray(data.icons)) {
        showToast('Invalid IcoMoon selection.json file');
        // Reverter o estado visual em caso de erro
        handleFileDelete('json', appState, zone, document.getElementById('fileInput'));
        return;
      }
      
      // Process the icons data
      appState.currentIcons = data.icons;
      appState.fontName = data.preferences?.fontPref?.metadata?.fontFamily || 'icomoon';
      
      // Show the icons count
      updateIconCount(data.icons.length);
      
      // Show preview section now that we have icons
      const previewSection = document.getElementById('previewSection');
      if (previewSection) {
        previewSection.style.display = 'block';
      }
      
      // Refresh the display with the loaded icons
      refreshDisplay(appState);
      
      showToast(`Loaded ${data.icons.length} icons successfully`);
      
    } catch (error) {
      console.error('Error processing JSON file:', error);
      showToast('Error processing file. Please make sure it\'s a valid IcoMoon selection.json file.');
      // Reverter o estado visual em caso de erro
      handleFileDelete('json', appState, zone, document.getElementById('fileInput'));
    }
  };

  reader.onerror = function(error) {
    console.error('Error reading file:', error);
    showToast('Error reading the file');
    // Reverter o estado visual em caso de erro
    handleFileDelete('json', appState, zone, document.getElementById('fileInput'));
  };

  reader.readAsText(file);
}

// Update the icon counter display
function updateIconCount(count) {
  const iconCounter = document.getElementById('iconCount');
  if (iconCounter) {
    iconCounter.textContent = count;
  }
} 