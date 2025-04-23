import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Grid, Button, TextField, 
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  Divider, CircularProgress, Alert, Snackbar, IconButton, Chip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '../utils/api';

const PaymentOptions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderDetails = location.state?.orderDetails;
  const cartItems = location.state?.cartItems;
  const totalAmount = location.state?.totalAmount;
  
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [paymentSettings, setPaymentSettings] = useState({
    bank_name: '',
    account_holder: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    gpay_number: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  useEffect(() => {
    // Verify if order details exist, if not redirect back to cart
    if (!orderDetails || !cartItems) {
      navigate('/cart');
      return;
    }
    
    // Fetch payment settings
    const fetchPaymentSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/payment-settings');
        setPaymentSettings(response.data);
      } catch (err) {
        setError('Failed to load payment details. Please try again.');
        console.error('Error fetching payment settings:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaymentSettings();
  }, [orderDetails, cartItems, navigate]);

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };
  
  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setOpenSnackbar(true);
  };
  
  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };
  
  const handleSubmitOrder = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      // Prepare order data
      const orderData = {
        delivery_address: orderDetails.delivery_address,
        receiver_phone: orderDetails.receiver_phone,
        payment_method: paymentMethod,
        items: cartItems.map(item => {
          const cartItem = {
            product_id: item.product_id,
            quantity: item.quantity
          };
          
          // Include selected option if present
          if (item.selected_option) {
            cartItem.selected_option = item.selected_option;
          }
          
          return cartItem;
        })
      };
      
      const response = await api.post('/orders', orderData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccess('Order placed successfully!');
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to place order');
      console.error('Order submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" className="py-8">
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" component="h1" gutterBottom>
        Payment Options
      </Typography>

      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" className="mb-4">
          {success}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper className="p-6">
            <FormControl component="fieldset" className="w-full mb-4">
              <FormLabel component="legend">Select Payment Method</FormLabel>
              <RadioGroup
                aria-label="payment-method"
                name="payment-method"
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel 
                      value="bank" 
                      control={<Radio />} 
                      label="Bank Transfer" 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel 
                      value="upi" 
                      control={<Radio />} 
                      label="UPI Payment" 
                    />
                  </Grid>
                </Grid>
              </RadioGroup>
            </FormControl>

            <Divider className="my-4" />
            
            {paymentMethod === 'bank' && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Bank Transfer Details
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Bank Name"
                      value={paymentSettings.bank_name}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton 
                            size="small"
                            onClick={() => handleCopyText(paymentSettings.bank_name, 'Bank Name')}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        ),
                      }}
                      fullWidth
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Account Holder"
                      value={paymentSettings.account_holder}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton 
                            size="small"
                            onClick={() => handleCopyText(paymentSettings.account_holder, 'Account Holder')}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        ),
                      }}
                      fullWidth
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Account Number"
                      value={paymentSettings.account_number}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton 
                            size="small"
                            onClick={() => handleCopyText(paymentSettings.account_number, 'Account Number')}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        ),
                      }}
                      fullWidth
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="IFSC Code"
                      value={paymentSettings.ifsc_code}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton 
                            size="small"
                            onClick={() => handleCopyText(paymentSettings.ifsc_code, 'IFSC Code')}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        ),
                      }}
                      fullWidth
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {paymentMethod === 'upi' && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  UPI Payment Details
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="UPI ID"
                      value={paymentSettings.upi_id}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <Button 
                            variant="contained" 
                            size="small"
                            onClick={() => handleCopyText(paymentSettings.upi_id, 'UPI ID')}
                          >
                            Copy
                          </Button>
                        ),
                      }}
                      fullWidth
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Google Pay Number"
                      value={paymentSettings.gpay_number}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <Button 
                            variant="contained" 
                            size="small"
                            onClick={() => handleCopyText(paymentSettings.gpay_number, 'GPay Number')}
                          >
                            Copy
                          </Button>
                        ),
                      }}
                      fullWidth
                      margin="normal"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
            
            <Divider className="my-6" />
            
            <Typography variant="body1" className="mb-4">
              Please make the payment using the details above, then click "Confirm Order" to complete your purchase. We'll process your order once it's received.
            </Typography>
            
            <Box className="flex justify-between">
              <Button 
                variant="outlined" 
                onClick={() => navigate('/cart')}
                disabled={isSubmitting}
              >
                Back to Cart
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Confirm Order'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {cartItems.length} item(s)
            </Typography>
            
            <Divider className="my-2" />
            
            {cartItems.map((item) => (
              <Box key={item.product_id} className="flex justify-between py-2">
                <Box>
                  <Typography variant="body2">
                    {item.product.name} x {item.quantity}
                  </Typography>
                  {item.selected_option && (
                    <Chip
                      size="small"
                      label={`${item.selected_option.size} - ${item.selected_option.type} - ${item.selected_option.quantity}`}
                      variant="outlined"
                      color="primary"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>
                <Typography variant="body2">
                  ₹{(item.selected_option ? item.selected_option.price * item.quantity : item.product.price * item.quantity).toFixed(2)}
                </Typography>
              </Box>
            ))}
            
            <Divider className="my-2" />
            
            <Box className="flex justify-between py-2">
              <Typography variant="body1">Subtotal</Typography>
              <Typography variant="body1">₹{totalAmount.toFixed(2)}</Typography>
            </Box>
            
            <Box className="flex justify-between py-2">
              <Typography variant="body1">Delivery Fee</Typography>
              <Typography variant="body1">₹0.00</Typography>
            </Box>
            
            <Divider className="my-2" />
            
            <Box className="flex justify-between py-2">
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary">₹{totalAmount.toFixed(2)}</Typography>
            </Box>
            
            <Divider className="my-4" />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Delivery Address:
              </Typography>
              <Typography variant="body2" paragraph>
                {orderDetails.delivery_address}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Contact Number:
              </Typography>
              <Typography variant="body2">
                +91 {orderDetails.receiver_phone}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={`${copiedText} copied to clipboard`}
      />
    </Container>
  );
};

export default PaymentOptions;