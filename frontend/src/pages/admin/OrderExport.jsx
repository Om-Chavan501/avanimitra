// frontend/src/pages/admin/OrderExport.jsx

import { useState } from 'react';
import {
  Container, Typography, Box, Paper, Grid, Button,
  CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem,
  FormHelperText, FormControlLabel, Switch
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import api from '../../utils/api';

const OrderExport = () => {
  const [exportData, setExportData] = useState({
    format: 'excel',
    start_date: null,
    end_date: null,
    status_filter: 'all',
    include_all_fields: true
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExportData({
      ...exportData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleDateChange = (name) => (date) => {
    setExportData({
      ...exportData,
      [name]: date
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await api.post('/admin/export-orders', exportData, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create a download link and click it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from headers if possible
      const contentDisposition = response.headers['content-disposition'];
      let filename = `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      if (contentDisposition) {
        const matches = /filename=([^;]+)/ig.exec(contentDisposition);
        if (matches && matches.length > 1) {
          filename = matches[1].replace(/"/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      setError(`Failed to export orders: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md" className="py-8">
        <Typography variant="h4" component="h1" gutterBottom>
          Export Orders
        </Typography>
        
        <Typography variant="body1" paragraph>
          Generate and export order data to Excel. The file will be downloaded directly to your device.
        </Typography>
        
        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        <Paper className="p-6">
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Filter by Status</InputLabel>
                  <Select
                    name="status_filter"
                    value={exportData.status_filter}
                    onChange={handleChange}
                    label="Filter by Status"
                  >
                    <MenuItem value="all">All Orders</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="processing">Processing</MenuItem>
                    <MenuItem value="shipped">Shipped</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={exportData.start_date}
                  onChange={(newValue) => handleDateChange('start_date')(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={exportData.end_date}
                  onChange={(newValue) => handleDateChange('end_date')(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                  minDate={exportData.start_date}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportData.include_all_fields}
                      onChange={handleChange}
                      name="include_all_fields"
                    />
                  }
                  label="Include all order fields"
                />
                <FormHelperText>
                  If unchecked, only essential fields will be included in the export
                </FormHelperText>
              </Grid>
            </Grid>
            
            <Box className="mt-6">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : 'Download Orders Report'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default OrderExport;