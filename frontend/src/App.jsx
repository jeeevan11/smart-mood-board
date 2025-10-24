import { useState, useEffect } from 'react';
import axios from 'axios'; // We just installed this!
import './App.css';

function App() {
  // A state to store the message from our backend
  const [message, setMessage] = useState('');

  // This 'useEffect' hook runs once when the component first loads
  useEffect(() => {
    // We make a GET request to our backend's test route
    axios.get('http://localhost:8080/api/test')
      .then((response) => {
        // If successful, we save the message in our state
        setMessage(response.data.message);
      })
      .catch((error) => {
        // If there's an error, we log it and show a sad message
        console.error('Error fetching data:', error);
        setMessage('Could not connect to backend 😥');
      });
  }, []); // The empty '[]' means this effect only runs on the first render

  return (
    <div className="App">
      <h1>Smart Mood Board</h1>
      <h2>Message from Backend: {message}</h2>
    </div>
  );
}

export default App;