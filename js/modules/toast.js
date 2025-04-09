const toast = document.getElementById('toast');

export function showToast(message, duration = 3000) {
  toast.textContent = message;
  toast.style.display = 'block';
  
  setTimeout(() => {
    toast.style.display = 'none';
  }, duration);
} 