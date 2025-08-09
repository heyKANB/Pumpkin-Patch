import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add error handling for iOS
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// Ensure DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }
  
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error('Failed to render app:', error);
    // Fallback UI
    rootElement.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Loading...</h1><p>Please wait while the app initializes.</p></div>';
  }
}
