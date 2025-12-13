import './app.css';
import { mount } from 'svelte';
import Popup from './popup/Popup.svelte';

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  const target = document.getElementById('app');
  if (target) {
    mount(Popup, { target });
  }
}
