import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import './Dashboard.css';

function Dashboard() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [equipment, setEquipment] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    
    const navigate = useNavigate();
    
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

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
                
                // Fetch equipment data
                fetchEquipment(token);
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
    
    const fetchEquipment = async (token) => {
        try {
            const response = await fetch('/api/equipment', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to get equipment data');
            }
            
            setEquipment(data.equipment || []);
        } catch (err) {
            console.error('Error fetching equipment:', err);
        }
    };

    const handleLogout = () => {
        // Clear local storage
        localStorage.removeItem('userToken');
        localStorage.removeItem('userEmail');
        
        // Redirect to login
        navigate('/login');
    };
    
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 3) {
            setFormError('Maximum 3 images allowed');
            return;
        }
        
        // Create preview URLs
        const imageFiles = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        
        setUploadedImages(imageFiles);
        setShowPreview(true);
    };
    
    const handleAddEquipment = async (data) => {
        setFormError('');
        setFormSuccess('');
        
        try {
            const token = localStorage.getItem('userToken');
            if (!token) {
                navigate('/login');
                return;
            }
            
            // Create form data to handle file uploads
            const formData = new FormData();
            
            // Add all text fields
            Object.keys(data).forEach(key => {
                if (key !== 'images') {
                    formData.append(key, data[key]);
                }
            });
            
            // Add images if any
            if (uploadedImages.length > 0) {
                uploadedImages.forEach(img => {
                    formData.append('images', img.file);
                });
            }
            
            const response = await fetch('/api/equipment', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to add equipment');
            }
            
            // Show success and reset form
            setFormSuccess('Equipment added successfully!');
            reset();
            setUploadedImages([]);
            setShowPreview(false);
            
            // Refresh equipment list
            fetchEquipment(token);
            
            // Close form after 2 seconds
            setTimeout(() => {
                setShowAddForm(false);
                setFormSuccess('');
            }, 2000);
            
        } catch (err) {
            setFormError(err.message || 'Error adding equipment');
            console.error('Add equipment error:', err);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>LendMe Equipment Dashboard</h1>
                <div className="header-actions">
                    <div className="user-info">
                        {userData && <span>Logged in as: {userData.email}</span>}
                    </div>
                    <button onClick={handleLogout} className="logout-button">Logout</button>
                </div>
            </header>
            
            {error ? (
                <div className="error-message">{error}</div>
            ) : (
                <div className="dashboard-content">
                    <div className="equipment-section">
                        <div className="section-header">
                            <h2>My Equipment</h2>
                            <button 
                                className="add-equipment-btn"
                                onClick={() => setShowAddForm(!showAddForm)}
                            >
                                {showAddForm ? 'Cancel' : 'Add New Equipment'}
                            </button>
                        </div>
                        
                        {showAddForm && (
                            <div className="equipment-form-container">
                                <h3>Add New Equipment</h3>
                                
                                {formSuccess && <div className="success-message">{formSuccess}</div>}
                                {formError && <div className="error-message">{formError}</div>}
                                
                                <form onSubmit={handleSubmit(handleAddEquipment)} className="equipment-form">
                                    <div className="form-group">
                                        <label htmlFor="name">Name/Title *</label>
                                        <input 
                                            type="text" 
                                            id="name" 
                                            {...register('name', { required: 'Name is required' })}
                                        />
                                        {errors.name && <span className="error">{errors.name.message}</span>}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="category">Category/Type *</label>
                                        <select 
                                            id="category" 
                                            {...register('category', { required: 'Category is required' })}
                                        >
                                            <option value="">Select category</option>
                                            <option value="camera">Camera</option>
                                            <option value="tripod">Tripod</option>
                                            <option value="microphone">Microphone</option>
                                            <option value="lighting">Lighting</option>
                                            <option value="audio">Audio Equipment</option>
                                            <option value="computer">Computer/Laptop</option>
                                            <option value="other">Other</option>
                                        </select>
                                        {errors.category && <span className="error">{errors.category.message}</span>}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="modelNumber">Model Number *</label>
                                        <input 
                                            type="text" 
                                            id="modelNumber" 
                                            {...register('modelNumber', { required: 'Model number is required' })}
                                        />
                                        {errors.modelNumber && <span className="error">{errors.modelNumber.message}</span>}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="serialNumber">Serial Number * (must be unique)</label>
                                        <input 
                                            type="text" 
                                            id="serialNumber" 
                                            {...register('serialNumber', { required: 'Serial number is required' })}
                                        />
                                        {errors.serialNumber && <span className="error">{errors.serialNumber.message}</span>}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="description">Description</label>
                                        <textarea 
                                            id="description" 
                                            {...register('description')}
                                        ></textarea>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="condition">Condition *</label>
                                        <select 
                                            id="condition" 
                                            {...register('condition', { required: 'Condition is required' })}
                                        >
                                            <option value="">Select condition</option>
                                            <option value="excellent">Excellent</option>
                                            <option value="good">Good</option>
                                            <option value="fair">Fair</option>
                                            <option value="poor">Poor</option>
                                        </select>
                                        {errors.condition && <span className="error">{errors.condition.message}</span>}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="location">Location/Storage Information *</label>
                                        <input 
                                            type="text" 
                                            id="location" 
                                            {...register('location', { required: 'Location is required' })}
                                        />
                                        {errors.location && <span className="error">{errors.location.message}</span>}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="maintenanceSchedule">Maintenance Schedule</label>
                                        <input 
                                            type="text" 
                                            id="maintenanceSchedule" 
                                            {...register('maintenanceSchedule')}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="notes">Notes</label>
                                        <textarea 
                                            id="notes" 
                                            {...register('notes')}
                                        ></textarea>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="images">Images (Max 3)</label>
                                        <input 
                                            type="file" 
                                            id="images" 
                                            multiple 
                                            accept="image/jpeg,image/jpg,image/png"
                                            onChange={handleImageUpload}
                                        />
                                        <p className="form-hint">Supported formats: JPG, JPEG, PNG. Max size: 5MB each.</p>
                                    </div>
                                    
                                    {showPreview && uploadedImages.length > 0 && (
                                        <div className="image-preview">
                                            <h4>Image Preview</h4>
                                            <div className="preview-container">
                                                {uploadedImages.map((img, index) => (
                                                    <img 
                                                        key={index} 
                                                        src={img.preview} 
                                                        alt={`Preview ${index + 1}`} 
                                                        className="preview-img"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="form-actions">
                                        <button type="button" onClick={() => {
                                            setShowAddForm(false);
                                            reset();
                                            setUploadedImages([]);
                                            setShowPreview(false);
                                        }} className="cancel-btn">
                                            Cancel
                                        </button>
                                        <button type="submit" className="submit-btn">
                                            Add Equipment
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                        
                        <div className="equipment-list">
                            {equipment.length === 0 ? (
                                <p className="no-items">No equipment items found. Add your first item!</p>
                            ) : (
                                <div className="equipment-grid">
                                    {equipment.map(item => (
                                        <div key={item.id} className="equipment-card">
                                            <h3>{item.name}</h3>
                                            <p><strong>Category:</strong> {item.category}</p>
                                            <p><strong>Serial #:</strong> {item.serial_number}</p>
                                            <p><strong>Condition:</strong> {item.condition}</p>
                                            <p><strong>Location:</strong> {item.location}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;