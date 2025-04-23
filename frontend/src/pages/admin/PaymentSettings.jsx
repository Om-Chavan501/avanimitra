import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Grid, TextField, Button,
  CircularProgress, Alert
} from '@mui/material';
import api from '../../utils/api';

const PaymentSettings = () => {
  const [settings, setSettings] = useState({
    bank_name: '',
    account_holder: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    gpay_number: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await api.get('/admin/payment-settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSettings(response.data);
      } catch (err) {
        setError('Failed to load payment settings. Please try again later.');
        console.error('Error fetching payment settings:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      await api.put('/admin/payment-settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Payment settings updated successfully!');
    } catch (err) {
      setError(`Failed to update settings: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" className="py-8">
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="py-8">
      <Typography variant="h4" component="h1" gutterBottom>
        Payment Settings
      </Typography>
      
      <Typography variant="body1" paragraph>
        Configure the payment details that will be displayed to customers during checkout.
      </Typography>
      
      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" className="mb-4" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      
      <Paper className="p-6">
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            Bank Transfer Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Bank Name"
                name="bank_name"
                value={settings.bank_name}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Account Holder Name"
                name="account_holder"
                value={settings.account_holder}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Account Number"
                name="account_number"
                value={settings.account_number}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="IFSC Code"
                name="ifsc_code"
                value={settings.ifsc_code}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
          </Grid>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            UPI Payment Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="UPI ID"
                name="upi_id"
                value={settings.upi_id}
                onChange={handleChange}
                fullWidth
                required
                helperText="e.g., yourname@upi"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Google Pay Number"
                name="gpay_number"
                value={settings.gpay_number}
                onChange={handleChange}
                fullWidth
                required
                helperText="10-digit mobile number linked with Google Pay"
              />
            </Grid>
          </Grid>
          
          <Box className="mt-6">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Settings'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default PaymentSettings;