
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Fiqh Academy AMS: Initializing Application...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Critical Error: Could not find root element to mount to.");
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("Fiqh Academy AMS: Application Rendered Successfully.");
}
