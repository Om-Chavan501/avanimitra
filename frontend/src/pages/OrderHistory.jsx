import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Button, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Tab, Tabs, Divider, Card, CardContent, CardMedia, Alert,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent, 
  DialogActions, CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import RepeatIcon from '@mui/icons-material/Repeat';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  
  // Repeat order states
  const [repeatDialogOpen, setRepeatDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await api.get('/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(response.data);
      } catch (err) {
        setError('Failed to fetch orders');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter orders based on active tab
  const activeOrders = orders.filter(order => 
    ['pending', 'processing', 'shipped'].includes(order.order_status)
  );
  const pastOrders = orders.filter(order => 
    ['delivered', 'cancelled'].includes(order.order_status)
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'success';
      case 'refunded': return 'info';
      case 'failed': return 'error';
      default: return 'warning'; // pending
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy • hh:mm a');
    } catch {
      return dateString;
    }
  };

  const handleRepeatOrderClick = (order) => {
    setSelectedOrder(order);
    setDeliveryAddress(order.delivery_address);
    setReceiverPhone(order.receiver_phone);
    setRepeatDialogOpen(true);
  };

  const handleCloseRepeatDialog = () => {
    setRepeatDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleRepeatOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const orderData = {
        delivery_address: deliveryAddress,
        receiver_phone: receiverPhone,
        items: selectedOrder.items.map(item => {
          const orderItem = {
            product_id: item.product_id,
            quantity: item.quantity
          };
          
          // Include selected option if present
          if (item.selected_option) {
            orderItem.selected_option = item.selected_option;
          }
          
          return orderItem;
        })
      };
      
      await api.post('/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh the page to show the new order
      window.location.reload();
    } catch (err) {
      setError(`Failed to repeat order: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSubmitting(false);
      setRepeatDialogOpen(false);
    }
  };

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" component="h1" gutterBottom>
        Order History
      </Typography>

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`Active Orders (${activeOrders.length})`} />
              <Tab label={`Past Orders (${pastOrders.length})`} />
            </Tabs>
          </Box>

          {tabValue === 0 && (
            <>
              {activeOrders.length === 0 ? (
                <Paper className="p-4 text-center">
                  <Typography color="textSecondary">
                    No active orders
                  </Typography>
                </Paper>
              ) : (
                activeOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    getStatusColor={getStatusColor}
                    getPaymentStatusColor={getPaymentStatusColor}
                    formatDate={formatDate}
                    showRepeatButton={false}
                  />
                ))
              )}
            </>
          )}

          {tabValue === 1 && (
            <>
              {pastOrders.length === 0 ? (
                <Paper className="p-4 text-center">
                  <Typography color="textSecondary">
                    No past orders
                  </Typography>
                </Paper>
              ) : (
                pastOrders.map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    getStatusColor={getStatusColor}
                    getPaymentStatusColor={getPaymentStatusColor}
                    formatDate={formatDate}
                    showRepeatButton={true}
                    onRepeatOrder={() => handleRepeatOrderClick(order)}
                  />
                ))
              )}
            </>
          )}
        </>
      )}

      {/* Repeat Order Dialog */}
      {selectedOrder && (
        <Dialog 
          open={repeatDialogOpen} 
          onClose={handleCloseRepeatDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Repeat Order</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box className="flex items-center">
                            <img 
                              src={item.product.image_url} 
                              alt={item.product.name}
                              className="w-10 h-10 object-cover mr-2"
                            />
                            <Box>
                              <Typography variant="body2">
                                {item.product.name}
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
                          </Box>
                        </TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">₹{item.price_at_purchase.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          ₹{(item.price_at_purchase * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <Typography variant="subtitle1">Total:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1">
                          ₹{selectedOrder.total_amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Typography variant="h6" gutterBottom>
              Delivery Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Delivery Address"
                  multiline
                  rows={2}
                  fullWidth
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Receiver's Phone"
                  fullWidth
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                  }}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRepeatDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleRepeatOrder} 
              variant="contained"
              color="primary"
              disabled={submitting || !deliveryAddress || !receiverPhone}
            >
              {submitting ? <CircularProgress size={24} /> : 'Place Order'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

// Order Card Component
const OrderCard = ({ order, getStatusColor, getPaymentStatusColor, formatDate, showRepeatButton, onRepeatOrder }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  return (
    <Paper className="mb-4 overflow-hidden">
      <Box className="p-4 flex flex-wrap justify-between items-center">
        <Box>
          <Typography variant="subtitle1" className="font-semibold">
            Order #{order.id.substring(0, 8)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {formatDate(order.order_date)}
          </Typography>
        </Box>
        <Box className="flex items-center gap-2 mt-2 sm:mt-0">
          <Box>
            <Typography variant="body2" color="textSecondary">Payment Status:</Typography>
            <Chip 
              label={order.payment_status.toUpperCase()} 
              color={getPaymentStatusColor(order.payment_status)}
              size="small"
            />
          </Box>
          <Box className="ml-3">
            <Typography variant="body2" color="textSecondary">Delivery Status:</Typography>
            <Chip 
              label={order.order_status.toUpperCase()} 
              color={getStatusColor(order.order_status)}
              size="small"
            />
          </Box>
          <Typography variant="subtitle1" className="ml-4">
            ₹{order.total_amount.toFixed(2)}
          </Typography>
        </Box>
      </Box>

      <Box 
        className="bg-gray-50 p-4 cursor-pointer flex justify-between items-center" 
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="body2" color="textSecondary">
          {expanded ? "Hide Details" : "Show Details"}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/orders/${order.id}`);
            }}
            size="small"
            sx={{ mr: 1 }}
          >
            View Details
          </Button>
          {showRepeatButton && order.order_status === 'delivered' && (
            <Button 
              variant="contained"
              color="primary"
              startIcon={<RepeatIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onRepeatOrder();
              }}
              size="small "
            >
              Repeat Order
            </Button>
          )}
        </Box>
      </Box>

      {expanded && (
        <Box className="p-4 border-t">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Delivery Address:
              </Typography>
              <Typography variant="body2" paragraph>
                {order.delivery_address}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Receiver's Phone:
              </Typography>
              <Typography variant="body2">
                +91 {order.receiver_phone}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Order Items:
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Box>
                            {item.product.name}
                            {item.selected_option && (
                              <Chip
                                size="small"
                                label={`${item.selected_option.size} - ${item.selected_option.type} - ${item.selected_option.quantity}`}
                                variant="outlined"
                                color="primary"
                                sx={{ mt: 0.5, ml: 1 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">₹{(item.price_at_purchase * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default OrderHistory;