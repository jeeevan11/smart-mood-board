import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
// Using lucide-react icons for a clean look
import { LogIn, UserPlus, Send, ThumbsUp, MessageCircle, Clock, CheckCircle, UploadCloud, X, Bell } from 'lucide-react';

// Use the deployed Render URL directly. Vercel handles its VITE_ env var separately during build.
const API_BASE_URL = 'https://smart-mood-board.onrender.com';
const API_URL = `${API_BASE_URL}/api`;

const App = () => {
  // --- State Variables ---
  const [view, setView] = useState('login'); // 'login', 'register', 'feed', 'notifications'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [pins, setPins] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- Socket.io Connection (MERN-12/13) ---
  const socket = useMemo(() => {
    if (currentUser && token) {
      console.log(`Attempting socket connection to ${API_BASE_URL} for user ${currentUser.id}`);
      const socketClient = io(API_BASE_URL, {
        query: { userId: currentUser.id },
        extraHeaders: { Authorization: `Bearer ${token}` }
      });

      socketClient.on('connect', () => console.log('Socket Connected:', socketClient.id));
      socketClient.on('connect_error', (err) => console.error('Socket Connection Error:', err.message));

      socketClient.on('newNotification', (data) => {
        console.log("Received notification:", data);
        // Add notification to the top, limit to 20
        setNotifications(prev => [{ ...data, id: Date.now() }, ...prev.slice(0, 19)]);
      });

      return socketClient;
    }
    return null;
  }, [currentUser, token]);

  // --- Effects ---
  // Initial load: check token, fetch user data
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
        setToken(storedToken);
        fetchUserData(storedToken);
    } else {
        setView('login'); // No token, show login
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Fetch pins when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchPins();
    }
    // Cleanup socket on unmount or logout
    return () => {
      if (socket) {
        console.log('Disconnecting socket');
        socket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, socket]); // Dependency on isLoggedIn and socket instance

  // --- API Functions ---
  const fetchUserData = useCallback(async (currentToken) => {
    if (!currentToken) return;
    try {
      const res = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      // Handle potential differences in API response structure
      const userData = res.data.user || res.data; 
      // Ensure the user data has an ID for socket connection
      if (userData && (userData.id || userData._id)) {
        setCurrentUser({ ...userData, id: userData.id || userData._id }); // Standardize to 'id'
        setIsLoggedIn(true);
        setView('feed');
      } else {
         console.error("User data fetched but missing ID:", res.data);
         handleLogout(); // Log out if crucial data is missing
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      handleLogout(); // Log out if token is invalid or request fails
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies need careful consideration, added handleLogout

  const fetchPins = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/pins`);
      setPins(res.data);
    } catch (err) {
      console.error('Error fetching pins:', err);
      setMessage('Could not load pins.');
    }
  }, []);

  // --- Event Handlers ---
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    const endpoint = view === 'login' ? 'login' : 'register';

    try {
      const res = await axios.post(`${API_URL}/auth/${endpoint}`, form);
      const { token: newToken, user } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
       // Ensure user object has 'id' standardized
      setCurrentUser({ ...user, id: user.id || user._id });
      setIsLoggedIn(true);
      setView('feed');
      setMessage(res.data.message || (view === 'login' ? 'Login successful!' : 'Registration successful!')); // Add success message

    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed.';
      setMessage(msg);
      // Keep user on auth screen on failure
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setMessage('Please select an image file.');
      return;
    }
    setMessage('');
    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', uploadFile);
    if (uploadDescription) {
        formData.append('description', uploadDescription);
    }

    try {
      await axios.post(`${API_URL}/pins`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
      });
      // Reset form and close modal on success
      setUploadFile(null);
      setUploadDescription('');
      setIsModalOpen(false);
      fetchPins(); // Refresh feed
      setMessage('Pin uploaded successfully!'); // Add success message
    } catch (err) {
      setMessage(err.response?.data?.message || 'Upload failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (pinId) => {
    try {
      const res = await axios.put(`${API_URL}/pins/like/${pinId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message); // Show like/unlike message
      // Optimistic UI update or fetch pins again
      fetchPins();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Like action failed.');
    }
  };

  const handleFollow = async (targetUserId) => {
    if (currentUser && (currentUser.id === targetUserId || currentUser._id === targetUserId)) return;
    try {
      const res = await axios.put(`${API_URL}/users/follow/${targetUserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || 'Followed user!');
      // Update current user data to reflect change in 'following' list
      fetchUserData(token); 
    } catch (err) {
      setMessage(err.response?.data?.message || 'Follow action failed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setIsLoggedIn(false);
    setView('login');
    setPins([]); // Clear pins on logout
    setNotifications([]); // Clear notifications
    if (socket) {
      console.log('Disconnecting socket on logout');
      socket.disconnect();
    }
    setMessage('Logged out successfully.');
    setForm({ username: '', email: '', password: '' }); // Clear form
  };

  // --- UI Components ---

  const Header = () => (
    <div className="flex justify-between items-center bg-gray-800 text-white p-4 shadow-md sticky top-0 z-50">
      <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        SMART MOOD BOARD
      </h1>
      <div className="flex items-center space-x-3">
        {isLoggedIn && currentUser && (
          <>
            <span className="text-sm hidden sm:inline">Welcome, {currentUser.username}!</span>
            <button
              onClick={() => { setIsModalOpen(true); setMessage(''); }} // Clear message when opening modal
              title="Upload Pin"
              className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
            >
              <UploadCloud size={20} />
            </button>
            <NotificationsBadge />
            <button
              onClick={handleLogout}
              className="text-sm px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );

  const NotificationsBadge = () => (
    <div className="relative">
      <button
        onClick={() => setView(view === 'notifications' ? 'feed' : 'notifications')}
        title="Notifications"
        className={`p-2 rounded-full transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${view === 'notifications' ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
      >
        <Bell size={20} />
      </button>
      {notifications.length > 0 && view !== 'notifications' && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </div>
  );

  const AuthForm = () => (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 px-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
                {view === 'login' ? 'Sign in to your account' : 'Create your account'}
            </h2>
            {message && (
                <div className={`p-3 rounded-md text-sm ${message.toLowerCase().includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                {view === 'register' && (
                    <input type="text" name="username" placeholder="Username" onChange={handleChange} value={form.username || ''} required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"/>
                )}
                <input type="email" name="email" placeholder="Email address" onChange={handleChange} value={form.email || ''} required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"/>
                <input type="password" name="password" placeholder="Password" onChange={handleChange} value={form.password || ''} required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"/>
                <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                    {isLoading ? 'Processing...' : (view === 'login' ? 'Login' : 'Register')}
                </button>
            </form>
            <div className="text-sm text-center">
                <button onClick={() => { setView(view === 'login' ? 'register' : 'login'); setMessage(''); setForm({}); }} className="font-medium text-indigo-600 hover:text-indigo-500">
                    {view === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
            </div>
        </div>
    </div>
  );

  const PinFeed = () => (
    <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Discovery Feed</h2>
        {/* Display general messages at the top of the feed */}
        {message && <div className={`mb-4 p-3 rounded-md text-sm ${message.toLowerCase().includes('success') ? 'bg-green-100 text-green-700' : (message.toLowerCase().includes('fail') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}`}>{message}</div>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pins.map(pin => (
                <div key={pin._id} className="bg-white rounded-lg shadow-md overflow-hidden group transition-shadow duration-300 hover:shadow-xl flex flex-col">
                    <img
                        src={pin.imageUrl}
                        // Use description if available, otherwise generic alt text
                        alt={pin.description ? pin.description.substring(0, 50) : 'Mood board pin'}
                        className="w-full h-56 object-cover" // Fixed height for consistency
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x300/CBD5E1/FFFFFF?text=Image+Error"; }}
                    />
                    <div className="p-4 flex flex-col flex-grow">
                        <p className="text-sm text-gray-500 mb-2 flex items-center">
                            {/* Check if user object exists before accessing username */}
                            <UserPlus size={14} className="mr-1 inline-block text-gray-400"/>
                            Posted by: <span className="font-semibold text-indigo-700 ml-1">{pin.user?.username || 'Unknown User'}</span>
                        </p>
                        <p className="text-gray-700 text-sm mb-4 flex-grow italic">{pin.description || 'No description provided.'}</p>

                        <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-auto">
                            <div className="flex space-x-3">
                                {/* Like Button - check if currentUser exists */}
                                <button onClick={() => handleLike(pin._id)} disabled={!currentUser} className="flex items-center text-gray-500 hover:text-red-600 transition-colors duration-200 text-xs disabled:opacity-50">
                                    <ThumbsUp size={14} className={`mr-1 ${currentUser && pin.likes.includes(currentUser.id || currentUser._id) ? 'fill-current text-red-500' : ''}`} />
                                    {pin.likes.length}
                                </button>
                                {/* Comment Count */}
                                <div className="flex items-center text-gray-500 text-xs">
                                    <MessageCircle size={14} className="mr-1" />
                                    {pin.comments.length}
                                </div>
                            </div>
                            
                            {/* Follow Button - check if currentUser exists and is not the pin owner */}
                            {currentUser && pin.user && currentUser.id !== pin.user._id && (
                                <button
                                    onClick={() => handleFollow(pin.user._id)}
                                    className="text-xs px-3 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition duration-150"
                                >
                                    {/* Advanced: Check if already following */}
                                    Follow
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {/* Show message if feed is empty */}
            {pins.length === 0 && <p className="col-span-full text-center text-gray-500 mt-10 italic">Your feed is empty. Start by uploading a pin!</p>}
        </div>
    </div>
  );

  const NotificationsView = () => (
    <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
            <Bell size={28} className="mr-2 text-yellow-500" /> Notifications
        </h2>
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            {notifications.length === 0 ? (
                <div className="text-center py-10 text-gray-500 italic">
                    <Clock size={40} className="mx-auto mb-3 text-gray-400" />
                    You have no new notifications.
                </div>
            ) : (
                notifications.map(n => (
                    <div
                        key={n.id} // Use the unique ID generated when receiving notification
                        className={`flex items-start p-3 rounded-md border-l-4 ${
                            n.type === 'follow' ? 'border-blue-500 bg-blue-50' : 
                           (n.type === 'like' ? 'border-red-500 bg-red-50' : 
                           'border-purple-500 bg-purple-50') // Default for comment
                        }`}
                    >
                         {/* Render icon based on notification type */}
                         {n.type === 'follow' ? <UserPlus size={18} className="text-blue-600 mr-3 mt-1 flex-shrink-0" /> : 
                          n.type === 'like' ? <ThumbsUp size={18} className="text-red-600 mr-3 mt-1 flex-shrink-0" /> : 
                          <MessageCircle size={18} className="text-purple-600 mr-3 mt-1 flex-shrink-0" />}
                        <div>
                            <p className="text-sm font-medium text-gray-900">{n.message}</p>
                            {/* Optional: Add timestamp or link */}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );

  // Upload modal with better styling and state reset
  const UploadModal = () => {
    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative transform transition-all duration-300 ease-in-out scale-100 opacity-100">
                <button onClick={() => {setIsModalOpen(false); setMessage(''); setUploadFile(null); setUploadDescription('');}} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"> <X size={20} /> </button>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-3">Upload a New Pin</h2>
                {/* Display messages inside the modal */}
                {message && <div className={`mb-4 text-sm p-3 rounded-md ${message.toLowerCase().includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}
                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image File (Required)</label>
                        <input type="file" accept="image/*" onChange={(e) => {setUploadFile(e.target.files[0]); setMessage('');}} required className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"/>
                        {uploadFile && <p className="mt-2 text-xs text-green-600 flex items-center"><CheckCircle size={12} className="mr-1" />{uploadFile.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional - AI fills if blank)</label>
                        <textarea value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="Describe your pin..." rows="3" className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                        <p className="mt-1 text-xs text-gray-500 italic">Powered by Gemini AI for smart captions.</p>
                    </div>
                    <button type="submit" disabled={isLoading || !uploadFile} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Uploading...
                          </>
                        ) : 'Upload Pin'}
                    </button>
                </form>
            </div>
        </div>
    );
  };

  // --- Main App Render ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Header />
      <UploadModal />
      {/* Main content grows to fill space */}
      <main className="flex-grow container mx-auto"> 
        {isLoggedIn ? (
          view === 'feed' ? <PinFeed /> : <NotificationsView />
        ) : (
          <AuthForm />
        )}
      </main>
      {/* Footer stays at the bottom */}
      <footer className="bg-gray-800 text-gray-400 text-xs text-center py-4 w-full">
         Smart Mood Board © 2025 - MERN Full Stack Demo by Jatin
      </footer>
    </div>
  );
};

export default App;

