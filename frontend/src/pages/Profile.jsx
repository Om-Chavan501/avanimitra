import { useState } from 'react';
import {
  Container, Typography, Paper, Box, TextField, Button,
  Alert, CircularProgress, Divider, InputAdornment
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import PasswordField from '../components/PasswordField';

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    // Check password only if it's provided
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const updateData = {
      name: formData.name,
      phone: formData.phone,
      address: formData.address
    };
    
    // Add password only if provided
    if (formData.password) {
      updateData.password = formData.password;
    }
    
    try {
      setSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');
      
      const result = await updateUserProfile(updateData);
      
      if (result.success) {
        setSubmitSuccess('Profile updated successfully');
        // Clear password fields
        setFormData({
          ...formData,
          password: '',
          confirmPassword: ''
        });
      } else {
        setSubmitError(result.message);
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} className="p-6 my-8">
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Profile
        </Typography>
        
        {submitError && (
          <Alert severity="error" className="mb-4">
            {submitError}
          </Alert>
        )}
        
        {submitSuccess && (
          <Alert severity="success" className="mb-4">
            {submitSuccess}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Box className="mb-6">
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            
            <TextField
              label="Full Name"
              variant="outlined"
              fullWidth
              margin="normal"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
            />
            
            <TextField
              label="Phone Number"
              variant="outlined"
              fullWidth
              margin="normal"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              InputProps={{
                startAdornment: <InputAdornment position="start">+91</InputAdornment>,
              }}
              inputProps={{ maxLength: 10 }}
            />
            
            <TextField
              label="Address"
              variant="outlined"
              fullWidth
              margin="normal"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={!!errors.address}
              helperText={errors.address}
              multiline
              rows={3}
            />
          </Box>
          
          <Divider className="my-6" />
          
          <Box className="mb-6">
            <Typography variant="h6" gutterBottom>
              Change Password (optional)
            </Typography>
            
            <PasswordField
              id="password"
              label="New Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
            />
            
            <PasswordField
              id="confirmPassword"
              label="Confirm New Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={!formData.password}
            />
          </Box>
          
          <Box className="mt-6">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={submitting}
              className="w-full md:w-auto"
            >
              {submitting ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Profile;
