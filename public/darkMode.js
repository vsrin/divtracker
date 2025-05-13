// Check for dark mode preference and apply it
function initializeDarkMode() {
    // Check if user has previously set a preference
    const darkModePreference = localStorage.getItem('darkMode');
    
    if (darkModePreference === 'true' || 
       (darkModePreference === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  
  // Apply dark mode immediately to avoid flash of unstyled content
  initializeDarkMode();
  
  // Re-check when the DOM is loaded
  document.addEventListener('DOMContentLoaded', initializeDarkMode);
  
  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (localStorage.getItem('darkMode') === null) {
      if (event.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  });