import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Make sure it imports App from the correct file
import './index.css'     // Make sure it imports the CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App /> {/* Make sure it renders your App component */}
  </React.StrictMode>,
)