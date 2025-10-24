import React, { useState, useEffect, Suspense } from 'react'; // 👈 Import React and Suspense
import axios from 'axios';
import './App.css';

// 💡 MERN-14: Concept of Lazy Loading (Code Splitting)
// In a real app, this would dynamically load a whole page (like FeedPage or ProfilePage)
// We are simulating a lazy-loaded component for demonstration purposes.
const LazyLoadedPlaceholder = React.lazy(() => 
    new Promise(resolve => {
        // Simulate a network delay of 1 second so 'Loading...' message is visible
        setTimeout(() => resolve({ default: () => <p className="text-gray-600">Optimized Feature Loaded Successfully!</p> }), 1000);
    })
);


function App() {
  // A state to store the message from our backend
  const [message, setMessage] = useState('');
  
  // 💡 Note: Your current working port is 8080 (or 5001 if you reverted and it worked)
  // Ensure the port here matches your running backend port (8080 or 5001)
  const BACKEND_URL = 'http://localhost:8080/api/test'; 

  // This 'useEffect' hook runs once when the component first loads
  useEffect(() => {
    // We make a GET request to our backend's test route
    axios.get(BACKEND_URL)
      .then((response) => {
        // If successful, we save the message in our state
        setMessage(response.data.message);
      })
      .catch((error) => {
        // If there's an error, we log it and show a sad message
        console.error('Error fetching data:', error);
        setMessage('Could not connect to backend 😥');
      });
  }, []); 

  return (
    <div className="App max-w-lg mx-auto p-4 border rounded-xl shadow-lg mt-10">
      <h1 className="text-3xl font-bold text-indigo-700">Smart Mood Board</h1>
      <h2 className="text-lg mt-4 border-b pb-2">Backend Status:</h2>
      <p className={`mt-2 font-mono ${message.includes('Hello') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>
      
      <h2 className="text-lg mt-6 border-b pb-2">Optimization Check:</h2>
      
      {/* 💡 MERN-14 Implementation: Using Suspense for Optimization */}
      <Suspense fallback={<div className="text-yellow-600 animate-pulse">Loading optimized content...</div>}>
         {/* The lazy-loaded component will appear here after the simulated delay */}
         <LazyLoadedPlaceholder />
      </Suspense>
    </div>
  );
}

export default App;
