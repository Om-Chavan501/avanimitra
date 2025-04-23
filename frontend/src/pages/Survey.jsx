// frontend/src/pages/Survey.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container, Typography, Box, TextField, FormControl,
  FormControlLabel, Checkbox, Button, Paper, Grid, MenuItem,
  CircularProgress, Divider, Alert, Snackbar,
  Select, InputLabel, Card, CardContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getSurveyProducts, submitSurvey, checkSurveySubmission } from '../utils/surveyApi';

const frequencies = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every Two Weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

const Survey = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    area: '',
    city: '',
    product_preferences: []
  });
  
  const [surveyProducts, setSurveyProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load products and check previous submission
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Load survey products
        const products = await getSurveyProducts();
        setSurveyProducts(products);
        
        // Initialize selected products state
        const initialSelectedState = {};
        products.forEach(product => {
          initialSelectedState[product.id] = {
            selected: false,
            quantity: product.available_quantities?.length > 0 ? product.available_quantities[0] : '',
            frequency: 'monthly'
          };
        });
        setSelectedProducts(initialSelectedState);
        
        // Auto-fill user data if authenticated
        if (isAuthenticated && user) {
          setFormData(prev => ({
            ...prev,
            name: user.name || '',
            mobile: user.phone || '',
            address: user.address || '',
          }));
          
          // Check if user already submitted a survey
          if (user.phone) {
            const result = await checkSurveySubmission(user.phone);
            if (result.submitted) {
              setSnackbar({
                open: true,
                message: 'You have already submitted a survey. You can submit again to update your responses.',
                severity: 'info'
              });
            }
          }
        }
      } catch (err) {
        console.error('Error loading survey data:', err);
        setError('Failed to load survey data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, [isAuthenticated, user]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleProductSelect = (productId, isSelected) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selected: isSelected
      }
    }));
  };
  
  const handleProductOptionChange = (productId, field, value) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.mobile.trim() || !/^\d{10}$/.test(formData.mobile)) {
      setError('Valid 10-digit mobile number is required');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!formData.area.trim()) {
      setError('Area of residence is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    
    // Check if at least one product is selected
    const hasSelectedProducts = Object.values(selectedProducts).some(p => p.selected);
    if (!hasSelectedProducts) {
      setError('Please select at least one product');
      return false;
    }
    
    setError('');
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Prepare product preferences from selected products
      const productPreferences = [];
      
      Object.entries(selectedProducts).forEach(([productId, productData]) => {
        if (productData.selected) {
          // Find product name from the product ID
          const product = surveyProducts.find(p => p.id === productId);
          if (product) {
            productPreferences.push({
              product_name: product.name,
              quantity: productData.quantity,
              frequency: productData.frequency
            });
          }
        }
      });
      
      // Update form data with product preferences
      const submissionData = {
        survey_data: {
            ...formData,
            product_preferences: productPreferences
        }
      };
      
      // Submit the survey
      await submitSurvey(submissionData);
      
      setSubmitted(true);
      setSnackbar({
        open: true,
        message: 'Survey submitted successfully! Thank you for your feedback.',
        severity: 'success'
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Error submitting survey:', err);
      setError('Failed to submit survey. Please try again.');
      setSnackbar({
        open: true,
        message: 'Failed to submit survey. Please try again.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading survey...</Typography>
      </Container>
    );
  }
  
  if (submitted) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'success.main' }}>
            Thank You!
          </Typography>
          <Typography variant="body1" paragraph>
            Your survey has been submitted successfully. We appreciate your feedback!
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Return to Homepage
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          Organic Products Survey
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Personal Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isAuthenticated && user?.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Mobile Number"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                disabled={isAuthenticated && user?.phone}
                inputProps={{ pattern: "[0-9]{10}" }}
                helperText="10-digit mobile number"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={isAuthenticated && user?.address}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Area of Residence"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                placeholder="E.g., Kothrud, Baner"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="E.g., Pune"
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4 }} />
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Product Preferences
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Select which organic products you'd be interested in purchasing regularly.
              For each selected product, choose your preferred quantity and buying frequency.
            </Typography>
            
            {surveyProducts.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No products available for survey at the moment.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {surveyProducts.map((product) => (
                  <Grid item xs={12} key={product.id}>
                    <Card variant="outlined" sx={{
                      borderLeft: selectedProducts[product.id]?.selected ? 
                        '4px solid #4caf50' : '1px solid rgba(0, 0, 0, 0.12)'
                    }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedProducts[product.id]?.selected || false}
                                  onChange={(e) => handleProductSelect(product.id, e.target.checked)}
                                  color="primary"
                                />
                              }
                              label={
                                <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'bold' }}>
                                  {product.name}
                                </Typography>
                              }
                            />
                            {product.description && (
                              <Typography variant="body2" color="textSecondary" sx={{ ml: 4, mb: 2 }}>
                                {product.description}
                              </Typography>
                            )}
                          </Grid>
                          
                          {selectedProducts[product.id]?.selected && (
                            <Grid item xs={12}>
                              <Box sx={{ pl: 4, pt: 1 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size="small">
                                      <InputLabel id={`quantity-label-${product.id}`}>Preferred Quantity</InputLabel>
                                      <Select
                                        labelId={`quantity-label-${product.id}`}
                                        value={selectedProducts[product.id]?.quantity || ''}
                                        onChange={(e) => handleProductOptionChange(product.id, 'quantity', e.target.value)}
                                        label="Preferred Quantity"
                                      >
                                        {product.available_quantities?.length > 0 ? (
                                          product.available_quantities.map((qty, idx) => (
                                            <MenuItem key={`${product.id}-qty-${idx}`} value={qty}>
                                              {qty}
                                            </MenuItem>
                                          ))
                                        ) : (
                                          <MenuItem value="standard">Standard Package</MenuItem>
                                        )}
                                      </Select>
                                    </FormControl>
                                  </Grid>
                                  <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth size="small">
                                      <InputLabel id={`frequency-label-${product.id}`}>Buying Frequency</InputLabel>
                                      <Select
                                        labelId={`frequency-label-${product.id}`}
                                        value={selectedProducts[product.id]?.frequency || 'monthly'}
                                        onChange={(e) => handleProductOptionChange(product.id, 'frequency', e.target.value)}
                                        label="Buying Frequency"
                                      >
                                        {frequencies.map((option) => (
                                          <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </Grid>
                                </Grid>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={submitting}
              sx={{ minWidth: 200 }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Submit Survey'}
            </Button>
          </Box>
        </form>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Survey;