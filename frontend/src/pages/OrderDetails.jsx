import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Grid, Button, Divider,
  Card, CardContent, CardMedia, Chip, CircularProgress, Alert
} from '@mui/material';
import { format } from 'date-fns';
import api from '../utils/api';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await api.get(`/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setOrder(response.data);
      } catch (error) {
        setError('Failed to fetch order details');
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId]);

  const handleRepeatOrder = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      
      const token = localStorage.getItem('token');
      await api.post(
        `/orders/${orderId}/repeat`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      navigate('/orders');
    } catch (error) {
      setSubmitError(error.response?.data?.detail || 'Failed to repeat order');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd MMM yyyy, h:mm a');
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
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

  if (error) {
    return (
      <Container maxWidth="lg" className="py-8">
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/orders')}
          className="mt-4"
        >
          Back to Orders
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="py-8">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" component="h1">
          Order Details
        </Typography>
        <Button 
          variant="outlined"
          onClick={() => navigate('/orders')}
        >
          Back to Orders
        </Button>
      </Box>

      {submitError && (
        <Alert severity="error" className="mb-4">
          {submitError}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper className="p-4 mb-4">
            <Box className="flex justify-between items-center mb-2">
              <Typography variant="h6">
                Order #{order.id.substring(0, 8)}
              </Typography>
              <Chip 
                label={order.order_status.toUpperCase()} 
                color={getStatusColor(order.order_status)} 
              />
            </Box>
            <Typography variant="body2" color="textSecondary">
              Placed on: {formatDate(order.order_date)}
            </Typography>
          </Paper>
          
          <Typography variant="h6" gutterBottom className="mt-4">
            Items
          </Typography>
          
          {order.items.map((item) => (
            <Card key={item.product_id} className="mb-4">
              <Box className="flex flex-col sm:flex-row">
                <CardMedia
                  component="img"
                  sx={{ width: { xs: '100%', sm: 140 } }}
                  image={item.product.image_url}
                  alt={item.product.name}
                  className="object-cover"
                />
                <CardContent className="flex-grow">
                  <Box>
                    <Typography variant="h6">{item.product.name}</Typography>
                    {item.selected_option && (
                      <Chip
                        label={`${item.selected_option.size} - ${item.selected_option.type} - ${item.selected_option.quantity}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        className="mb-2 mt-1"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph className="line-clamp-2">
                    {item.product.description}
                  </Typography>
                  <Box className="flex justify-between items-center">
                    <Typography variant="body1">
                      Quantity: {item.quantity}
                    </Typography>
                    <Typography variant="body1" color="primary">
                      ₹{item.price_at_purchase.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Box>
            </Card>
          ))}
          
          {(order.order_status === 'delivered' || order.order_status === 'cancelled') && (
            <Button 
              variant="contained" 
              color="primary"
              fullWidth
              className="mt-4"
              onClick={handleRepeatOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Repeat this order'}
            </Button>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            
            <Box className="flex justify-between py-2">
              <Typography variant="body1">Subtotal</Typography>
              <Typography variant="body1">₹{order.total_amount.toFixed(2)}</Typography>
            </Box>
            
            <Box className="flex justify-between py-2">
              <Typography variant="body1">Delivery Fee</Typography>
              <Typography variant="body1">₹0.00</Typography>
            </Box>
            
            <Divider className="my-2" />
            
            <Box className="flex justify-between py-2">
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary">₹{order.total_amount.toFixed(2)}</Typography>
            </Box>
          </Paper>
          
          <Paper className="p-4 mt-4">
            <Typography variant="h6" gutterBottom>
              Delivery Details
            </Typography>
            
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Delivery Address:
            </Typography>
            <Typography variant="body1" paragraph>
              {order.delivery_address}
            </Typography>
            
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Recipient Phone:
            </Typography>
            <Typography variant="body1" paragraph>
              +91 {order.receiver_phone}
            </Typography>
          </Paper>
          
          <Paper className="p-4 mt-4">
            <Typography variant="h6" gutterBottom>
              Order Status
            </Typography>
            
            <Box className="flex justify-between py-2">
              <Typography variant="body1">Order Status:</Typography>
              <Chip 
                label={order.order_status.toUpperCase()} 
                color={getStatusColor(order.order_status)} 
                size="small"
              />
            </Box>
            
            <Box className="flex justify-between py-2">
              <Typography variant="body1">Payment Status:</Typography>
              <Chip 
                label={order.payment_status.toUpperCase()} 
                color={order.payment_status === 'paid' ? 'success' : 'warning'} 
                size="small"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrderDetails;