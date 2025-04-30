import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('userToken');
        
        // If no token, redirect to login
        if (!token) {
            navigate('/login');
            return;
        }

        // Fetch user data from API
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to get user data');
                }
                
                setUserData(data.user);
            } catch (err) {
                setError(err.message || 'Session expired. Please login again.');
                // If there's an auth error, clear token and redirect
                if (err.message === 'Invalid or expired token') {
                    handleLogout();
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleLogout = () => {
        // Clear local storage
        localStorage.removeItem('userToken');
        localStorage.removeItem('userEmail');
        
        // Redirect to login
        navigate('/login');
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>
            {error ? (
                <div className="error-message">{error}</div>
            ) : (
                <div className="user-profile">
                    <h2>Welcome, {userData?.email}</h2>
                    <p>Account created: {userData?.created_at && new Date(userData.created_at).toLocaleString()}</p>
                </div>
            )}
            <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
    );
}

export default Dashboard;