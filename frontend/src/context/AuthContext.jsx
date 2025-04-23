import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Create the context with default values
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  adminLogin: () => {},
  signup: () => {},
  logout: () => {},
  updateUserProfile: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await api.get('/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (phone, password) => {
    try {
      const response = await api.post('/login', { phone, password });
      const { access_token, user_id, is_admin } = response.data;
      
      localStorage.setItem('token', access_token);
      
      // Fetch full user details
      const userDetailsResponse = await api.get('/me', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      
      setUser(userDetailsResponse.data);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  // Admin login function
  const adminLogin = async (phone, password) => {
    try {
      const response = await api.post('/admin-login', { phone, password });
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      
      // Fetch full user details
      const userDetailsResponse = await api.get('/me', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      
      setUser(userDetailsResponse.data);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Admin login failed'
      };
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      await api.post('/signup', userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Signup failed'
      };
    }
  };

  // Update user profile
  const updateUserProfile = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.put('/users/me', userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUser(response.data);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || 'Profile update failed'
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    adminLogin,
    signup,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
