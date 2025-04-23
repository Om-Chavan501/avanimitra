import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Button, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, FormControl, InputLabel, Select, MenuItem, 
  Chip, Tab, Tabs, Divider, Card, CardContent, CardMedia, Alert,
  TextField, IconButton, Tooltip, Autocomplete, RadioGroup, 
  Radio, FormControlLabel, FormLabel, Checkbox, Toolbar, InputAdornment
} from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../utils/api';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Switch from '@mui/material/Switch';

const OrderManagement = () => {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // View order dialog
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // Status update dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit order dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedOrder, setEditedOrder] = useState(null);
  
  // Delete/Cancel confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  
  // Product management
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [customItemRate, setCustomItemRate] = useState(0);
  const [useCustomItemRate, setUseCustomItemRate] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [optionType, setOptionType] = useState('box');
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  const [users, setUsers] = useState({});

  // New state variables for bulk actions
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkNewStatus, setBulkNewStatus] = useState('');
  const [bulkNewPaymentStatus, setBulkNewPaymentStatus] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
        const usersData = response.data;
        const usersObj = {};
        usersData.forEach((user) => {
          usersObj[user.id] = user.name;
        });
        setUsers(usersObj);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    // Check URL parameters for specific tab
    const statusParam = searchParams.get('status');
    if (statusParam === 'active') {
      setTabValue(0);
    } else if (statusParam === 'past') {
      setTabValue(1);
    }
    
    // Check if a specific order should be viewed
    const orderIdParam = searchParams.get('orderId');
    
    fetchOrders(orderIdParam);
    fetchProducts();
  }, [searchParams]);
  
  // When a product is selected, initialize the price options if available
  useEffect(() => {
    if (selectedProduct?.has_price_options && selectedProduct.price_options?.length > 0) {
      // Group options by type (box or quantity)
      const boxOptions = selectedProduct.price_options.filter(opt => opt.type === 'box');
      const quantityOptions = selectedProduct.price_options.filter(opt => opt.type === 'quantity');
      
      // Set default option based on current selection type
      const defaultOptions = optionType === 'box' ? boxOptions : quantityOptions;
      if (defaultOptions.length > 0) {
        setSelectedOption(defaultOptions[0]);
        setCustomItemRate(defaultOptions[0].price);
      } else if (selectedProduct.price_options.length > 0) {
        // If no options for the selected type, use the first available
        setOptionType(selectedProduct.price_options[0].type);
        setSelectedOption(selectedProduct.price_options[0]);
        setCustomItemRate(selectedProduct.price_options[0].price);
      }
    } else if (selectedProduct) {
      setSelectedOption(null);
      setCustomItemRate(selectedProduct.price);
    }
  }, [selectedProduct, optionType]);
  
  const fetchOrders = async (specificOrderId = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/admin/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const fetchedOrders = response.data;
      setOrders(fetchedOrders);
      
      // If a specific order ID was requested, open it in the view dialog
      if (specificOrderId) {
        const orderToView = fetchedOrders.find(order => order.id === specificOrderId);
        if (orderToView) {
          handleViewOrder(orderToView);
        }
      }
      
      setError('');
    } catch (err) {
      setError('Failed to fetch orders. Please try again.');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Clear selections when changing tabs
    setSelectedOrderIds([]);
  };
  
  // New function to handle checkbox selection
  const handleSelectOrder = (orderId) => {
    setSelectedOrderIds(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  // Select or deselect all displayed orders
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedOrderIds(displayOrders.map(order => order.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  // Open bulk status update dialog
  const handleOpenBulkStatusDialog = () => {
    setBulkNewStatus('');
    setBulkNewPaymentStatus('');
    setBulkStatusDialogOpen(true);
  };

  // Close bulk status update dialog
  const handleCloseBulkStatusDialog = () => {
    setBulkStatusDialogOpen(false);
  };

  // Handle bulk status update
  const handleBulkUpdateStatus = async () => {
    if (selectedOrderIds.length === 0 || 
        (bulkNewStatus === '' && bulkNewPaymentStatus === '')) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      await api.put(
        `/admin/orders/bulk-update`, 
        { 
          order_ids: selectedOrderIds,
          order_status: bulkNewStatus || undefined,
          payment_status: bulkNewPaymentStatus || undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess(`${selectedOrderIds.length} orders updated successfully!`);
      fetchOrders();
      handleCloseBulkStatusDialog();
      setSelectedOrderIds([]); // Clear selection after update
    } catch (err) {
      setError(`Failed to update orders: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };
  
  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedOrder(null);
  };
  
  const handleOpenStatusDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.order_status);
    setNewPaymentStatus(order.payment_status);
    setStatusDialogOpen(true);
  };
  
  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedOrder(null);
    setNewStatus('');
    setNewPaymentStatus('');
  };
  
  const handleStatusChange = (e) => {
    setNewStatus(e.target.value);
  };
  
  const handlePaymentStatusChange = (e) => {
    setNewPaymentStatus(e.target.value);
  };
  
  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      await api.put(
        `/admin/orders/${selectedOrder.id}`, 
        { 
          order_status: newStatus,
          payment_status: newPaymentStatus
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess(`Order updated successfully!`);
      fetchOrders();
      handleCloseStatusDialog();
    } catch (err) {
      setError(`Failed to update order: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenEditDialog = (order) => {
    setEditedOrder({...order});
    setEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditedOrder(null);
  };
  
  const handleEditChange = (field, value) => {
    setEditedOrder({...editedOrder, [field]: value});
  };
  
  const handleSaveEdit = async () => {
    if (!editedOrder) return;
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Format items for the API
      const formattedItems = editedOrder.items.map(item => {
        const formattedItem = {
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_purchase: item.price_at_purchase
        };
        
        // Include selected option if present
        if (item.selected_option) {
          formattedItem.selected_option = item.selected_option;
        }
        
        return formattedItem;
      });
      
      await api.put(
        `/admin/orders/${editedOrder.id}`,
        {
          delivery_address: editedOrder.delivery_address,
          receiver_phone: editedOrder.receiver_phone,
          order_status: editedOrder.order_status,
          payment_status: editedOrder.payment_status,
          items: formattedItems
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess('Order updated successfully!');
      fetchOrders();
      handleCloseEditDialog();
    } catch (err) {
      setError(`Failed to update order: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenDeleteDialog = (order) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setOrderToDelete(null);
  };
  
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      await api.delete(
        `/admin/orders/${orderToDelete.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess('Order deleted successfully!');
      fetchOrders();
      handleCloseDeleteDialog();
    } catch (err) {
      setError(`Failed to delete order: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelOrder = async () => {
    if (!orderToDelete) return;
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      await api.put(
        `/admin/orders/${orderToDelete.id}`,
        {
          order_status: 'cancelled'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess('Order cancelled successfully!');
      fetchOrders();
      handleCloseDeleteDialog();
    } catch (err) {
      setError(`Failed to cancel order: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenProductDialog = () => {
    setSelectedProduct(null);
    setProductQuantity(1);
    setCustomItemRate(0);
    setUseCustomItemRate(false);
    setSelectedOption(null);
    setOptionType('box');
    setProductDialogOpen(true);
  };
  
  const handleCloseProductDialog = () => {
    setProductDialogOpen(false);
    setSelectedProduct(null);
    setProductQuantity(1);
  };
  
  const handleOptionTypeChange = (e) => {
    setOptionType(e.target.value);
  };
  
  const handleOptionChange = (e) => {
    if (!selectedProduct?.has_price_options) return;
    
    const optionId = e.target.value;
    const option = selectedProduct.price_options.find(opt => 
      opt.type === optionType && opt.size === optionId
    );
    
    if (option) {
      setSelectedOption(option);
      setCustomItemRate(option.price);
    }
  };
  
  const handleAddProduct = () => {
    if (!selectedProduct || productQuantity < 1) return;
    
    // Determine price to use and selected option
    let price = selectedProduct.price;
    let option = null;
    
    if (useCustomItemRate) {
      price = customItemRate;
    } else if (selectedOption) {
      price = selectedOption.price;
      option = selectedOption;
    }
    
    // Create item
    const newItem = {
      product_id: selectedProduct.id,
      quantity: productQuantity,
      price_at_purchase: price,
      product: selectedProduct
    };
    
    // Add selected option if applicable
    if (option && !useCustomItemRate) {
      newItem.selected_option = option;
    }
    
    // Add the product to the order
    const updatedItems = [...editedOrder.items, newItem];
    
    // Update total amount
    const newTotalAmount = updatedItems.reduce(
      (sum, item) => sum + (item.price_at_purchase * item.quantity), 
      0
    );
    
    setEditedOrder({
      ...editedOrder, 
      items: updatedItems,
      total_amount: newTotalAmount
    });
    
    handleCloseProductDialog();
  };
  
  const handleRemoveProduct = (indexToRemove) => {
    const updatedItems = editedOrder.items.filter((_, index) => index !== indexToRemove);
    
    // Update total amount
    const newTotalAmount = updatedItems.reduce(
      (sum, item) => sum + (item.price_at_purchase * item.quantity), 
      0
    );
    
    setEditedOrder({
      ...editedOrder, 
      items: updatedItems,
      total_amount: newTotalAmount
    });
  };
  
  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = [...editedOrder.items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: newQuantity
    };
    
    // Update total amount
    const newTotalAmount = updatedItems.reduce(
      (sum, item) => sum + (item.price_at_purchase * item.quantity), 
      0
    );
    
    setEditedOrder({
      ...editedOrder, 
      items: updatedItems,
      total_amount: newTotalAmount
    });
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
  
  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Filter orders based on tab
  const activeOrders = orders.filter(order => 
    ['pending', 'processing', 'shipped'].includes(order.order_status)
  );
  
  const pastOrders = orders.filter(order => 
    ['delivered', 'cancelled'].includes(order.order_status)
  );
  
  const displayOrders = tabValue === 0 ? activeOrders : pastOrders;

  // Determine if some or all orders are selected
  const numSelected = selectedOrderIds.length;
  const rowCount = displayOrders.length;

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" component="h1" gutterBottom>
        Order Management
      </Typography>
      
      {success && (
        <Alert severity="success" className="mb-4" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Paper className="mb-6">
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label={`Active Orders (${activeOrders.length})`} />
          <Tab label={`Past Orders (${pastOrders.length})`} />
        </Tabs>
      </Paper>
      
      {/* Bulk Actions Toolbar - Visible when orders are selected */}
      {numSelected > 0 && (
        <Paper className="mb-4 p-2">
          <Toolbar
            sx={{
              pl: { sm: 2 },
              pr: { xs: 1, sm: 1 },
            }}
          >
            <Typography
              sx={{ flex: '1 1 100%' }}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {numSelected} selected
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleOpenBulkStatusDialog}
              startIcon={<EditIcon />}
            >
              Update Status
            </Button>
          </Toolbar>
        </Paper>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : displayOrders.length === 0 ? (
        <Paper className="p-6 text-center">
          <Typography variant="h6">
            {tabValue === 0 ? "No active orders" : "No past orders"}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={numSelected > 0 && numSelected < rowCount}
                    checked={rowCount > 0 && numSelected === rowCount}
                    onChange={handleSelectAll}
                    inputProps={{
                      'aria-label': 'select all orders',
                    }}
                  />
                </TableCell>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer Name</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Amount (₹)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayOrders.map((order) => (
                <TableRow 
                  key={order.id}
                  selected={selectedOrderIds.includes(order.id)}
                  hover
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={() => handleSelectOrder(order.id)}
                      inputProps={{
                        'aria-labelledby': `order-${order.id}`,
                      }}
                    />
                  </TableCell>
                  <TableCell id={`order-${order.id}`}>#{order.id.substring(0, 8)}</TableCell>
                  <TableCell>{formatDate(order.order_date)}</TableCell>
                  <TableCell>{users[order.user_id]}</TableCell>
                  <TableCell>{order.items.length} items</TableCell>
                  <TableCell align="right">{order.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={order.order_status.toUpperCase()} 
                      color={getStatusColor(order.order_status)} 
                      size="small" 
                      className="cursor-pointer"
                      onClick={() => handleOpenStatusDialog(order)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={order.payment_status.toUpperCase()} 
                      color={getPaymentStatusColor(order.payment_status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Box className="flex">
                      <Tooltip title="View Details">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewOrder(order)}
                          className="mr-1"
                        >
                          View
                        </Button>
                      </Tooltip>
                      <Tooltip title="Edit Order">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenEditDialog(order)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Order">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleOpenDeleteDialog(order)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* View Order Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              <Box className="flex justify-between items-center">
                <Typography variant="h6">
                  Order #{selectedOrder.id.substring(0, 8)}
                </Typography>
                <Box className="flex gap-2">
                  <Chip 
                    label={selectedOrder.payment_status.toUpperCase()} 
                    color={getPaymentStatusColor(selectedOrder.payment_status)}
                    className="cursor-pointer"
                    onClick={() => {
                      handleCloseViewDialog();
                      handleOpenStatusDialog(selectedOrder);
                    }}
                  />
                  <Chip 
                    label={selectedOrder.order_status.toUpperCase()} 
                    color={getStatusColor(selectedOrder.order_status)}
                    className="cursor-pointer"
                    onClick={() => {
                      handleCloseViewDialog();
                      handleOpenStatusDialog(selectedOrder);
                    }}
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle1" gutterBottom>
                    Order Items
                  </Typography>
                  {selectedOrder.items.map((item) => (
                    <Card key={item.product_id} className="mb-3">
                      <Box className="flex">
                        <CardMedia
                          component="img"
                          sx={{ width: 100 }}
                          image={item.product.image_url}
                          alt={item.product.name}
                        />
                        <CardContent className="flex-grow">
                          <Typography variant="subtitle1">
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
                          <Box className="flex justify-between mt-2">
                            <Typography variant="body2">
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
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper className="p-3">
                    <Typography variant="subtitle1" gutterBottom>
                      Order Information
                    </Typography>
                    <Box className="mb-2">
                      <Typography variant="body2" color="textSecondary">
                        Date:
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedOrder.order_date)}
                      </Typography>
                    </Box>
                    <Box className="mb-2">
                      <Typography variant="body2" color="textSecondary">
                        Customer Name:
                      </Typography>
                      <Typography variant="body1">
                        {users[selectedOrder.user_id]}
                      </Typography>
                    </Box>
                    <Box className="mb-2">
                      <Typography variant="body2" color="textSecondary">
                        Phone:
                      </Typography>
                      <Typography variant="body1">
                        +91 {selectedOrder.receiver_phone}
                      </Typography>
                    </Box>
                    <Box className="mb-2">
                      <Typography variant="body2" color="textSecondary">
                        Delivery Address:
                      </Typography>
                      <Typography variant="body1">
                        {selectedOrder.delivery_address}
                      </Typography>
                    </Box>
                    
                    <Divider className="my-3" />
                    
                    <Box className="mb-2">
                      <Typography variant="body2" color="textSecondary">
                        Payment Status:
                      </Typography>
                      <Chip 
                        label={selectedOrder.payment_status.toUpperCase()} 
                        color={getPaymentStatusColor(selectedOrder.payment_status)}
                        size="small"
                      />
                    </Box>
                    
                    <Divider className="my-3" />
                    
                    <Box className="flex justify-between mb-2">
                      <Typography variant="body1">Subtotal:</Typography>
                      <Typography variant="body1">
                        ₹{selectedOrder.total_amount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box className="flex justify-between mb-2">
                      <Typography variant="body1">Delivery Fee:</Typography>
                      <Typography variant="body1">
                        ₹0.00
                      </Typography>
                    </Box>
                    <Box className="flex justify-between">
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6" color="primary">
                        ₹{selectedOrder.total_amount.toFixed(2)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseViewDialog}>
                Close
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  handleCloseViewDialog();
                  handleOpenEditDialog(selectedOrder);
                }}
              >
                Edit Order
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleCloseStatusDialog}>
        <DialogTitle>
          Update Order
        </DialogTitle>
        <DialogContent>
          <Box className="pt-2 space-y-4">
            <FormControl fullWidth>
              <InputLabel>Order Status</InputLabel>
              <Select
                value={newStatus}
                onChange={handleStatusChange}
                label="Order Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={newPaymentStatus}
                onChange={handlePaymentStatusChange}
                label="Payment Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateStatus} 
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Order Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Order #{editedOrder?.id?.substring(0, 8)}
        </DialogTitle>
        <DialogContent>
          {editedOrder && (
            <Box className="pt-2">
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Delivery Address"
                    multiline
                    rows={3}
                    value={editedOrder.delivery_address || ''}
                    onChange={(e) => handleEditChange('delivery_address', e.target.value)}
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={editedOrder.receiver_phone || ''}
                    onChange={(e) => handleEditChange('receiver_phone', e.target.value)}
                    margin="normal"
                  />
                  
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Order Status</InputLabel>
                    <Select
                      value={editedOrder.order_status}
                      onChange={(e) => handleEditChange('order_status', e.target.value)}
                      label="Order Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="processing">Processing</MenuItem>
                      <MenuItem value="shipped">Shipped</MenuItem>
                      <MenuItem value="delivered">Delivered</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Payment Status</InputLabel>
                    <Select
                      value={editedOrder.payment_status}
                      onChange={(e) => handleEditChange('payment_status', e.target.value)}
                      label="Payment Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider className="mb-3">
                    <Chip label="Order Items" />
                  </Divider>
                  
                  <Box display="flex" justifyContent="flex-end" mb={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleOpenProductDialog}
                    >
                      Add Product
                    </Button>
                  </Box>
                  
                  {editedOrder.items.length === 0 ? (
                    <Paper className="p-4 text-center">
                      <Typography variant="body1" color="textSecondary">
                        No products in this order. Add some products.
                      </Typography>
                    </Paper>
                  ) : (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Product</TableCell>
                            <TableCell>Price (₹)</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell align="right">Total (₹)</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {editedOrder.items.map((item, index) => (
                            <TableRow key={`${item.product_id}-${index}`}>
                              <TableCell>
                                <Box className="flex items-center">
                                  <img 
                                    src={item.product.image_url} 
                                    alt={item.product.name}
                                    className="w-12 h-12 object-cover mr-2"
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
                              <TableCell>
                                {item.price_at_purchase.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Box className="flex items-center">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                  >
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                  <TextField
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value);
                                      if (!isNaN(value) && value > 0) {
                                        handleUpdateQuantity(index, value);
                                      }
                                    }}
                                    inputProps={{ 
                                      min: 1,
                                      style: { textAlign: 'center' }
                                    }}
                                    variant="outlined"
                                    size="small"
                                    sx={{ width: 60, mx: 1 }}
                                  />
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                {(item.price_at_purchase * item.quantity).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleRemoveProduct(index)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={3} align="right">
                              <Typography variant="subtitle1">
                                Total Amount:
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="subtitle1" color="primary">
                              ₹{editedOrder.total_amount.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete/Cancel Order Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>
          Order Action
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            What would you like to do with this order?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleCancelOrder} 
            variant="outlined" 
            color="warning"
            disabled={isSubmitting || orderToDelete?.order_status === 'cancelled'}
          >
            Mark as Cancelled
          </Button>
          <Button 
            onClick={handleDeleteOrder} 
            variant="contained" 
            color="error"
            disabled={isSubmitting}
          >
            Delete Order
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Product Dialog */}
      <Dialog open={productDialogOpen} onClose={handleCloseProductDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Add Product to Order
        </DialogTitle>
        <DialogContent>
          <Box className="pt-2 space-y-4">
            <Autocomplete
              options={products.filter(p => p.status === 'active')}
              getOptionLabel={(product) => product.name}
              onChange={(_, newValue) => {
                setSelectedProduct(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Product"
                  fullWidth
                  variant="outlined"
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} className="flex items-center p-2">
                  <img 
                    src={option.image_url} 
                    alt={option.name}
                    className="w-10 h-10 object-cover mr-2"
                  />
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.has_price_options ? 
                        `From ₹${Math.min(...option.price_options.map(opt => opt.price)).toFixed(2)}` : 
                        `₹${option.price.toFixed(2)}`}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
            
            {selectedProduct?.has_price_options && (
              <Box className="mt-4 p-3 border rounded">
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend">Select Option Type</FormLabel>
                  <RadioGroup 
                    row
                    name="option-type" 
                    value={optionType} 
                    onChange={handleOptionTypeChange}
                  >
                    <FormControlLabel value="box" control={<Radio />} label="Box" />
                    <FormControlLabel value="quantity" control={<Radio />} label="By Dozen" />
                  </RadioGroup>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Select Size</InputLabel>
                  <Select
                    value={selectedOption?.size || ''}
                    onChange={handleOptionChange}
                    label="Select Size"
                  >
                    {selectedProduct.price_options
                      .filter(opt => opt.type === optionType)
                      .map((opt, idx) => (
                        <MenuItem key={idx} value={opt.size}>
                          {opt.size} - {opt.quantity} - ₹{opt.price.toFixed(2)}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                {selectedOption && (
                  <Box className="mt-3">
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Option Details:
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Typography variant="body2">Size: {selectedOption.size}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2">Quantity: {selectedOption.quantity}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2">Price: ₹{selectedOption.price.toFixed(2)}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>
            )}
            
            {selectedProduct && (
              <>
                <Box className="flex items-center justify-between">
                  <Typography>Quantity:</Typography>
                  <Box className="flex items-center">
                    <IconButton 
                      size="small" 
                      onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                      disabled={productQuantity <= 1}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <TextField
                      value={productQuantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          setProductQuantity(value);
                        }
                      }}
                      inputProps={{ 
                        min: 1,
                        style: { textAlign: 'center' }
                      }}
                      variant="outlined"
                      size="small"
                      sx={{ width: 60, mx: 1 }}
                    />
                    <IconButton 
                      size="small"
                      onClick={() => setProductQuantity(productQuantity + 1)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                <Box className="mt-4">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useCustomItemRate}
                        onChange={(e) => setUseCustomItemRate(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Use Custom Price"
                  />
                  
                  {useCustomItemRate && (
                    <TextField
                      label="Custom Price (₹)"
                      type="number"
                      value={customItemRate}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0) {
                          setCustomItemRate(value);
                        }
                      }}
                      fullWidth
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₹</InputAdornment>
                        ),
                      }}
                    />
                  )}
                </Box>
                
                <Box className="flex items-center justify-between">
                  <Typography variant="subtitle1">Total:</Typography>
                  <Typography variant="subtitle1" color="primary">
                    ₹{(useCustomItemRate ? customItemRate * productQuantity : 
                        (selectedOption ? selectedOption.price * productQuantity : 
                          selectedProduct.price * productQuantity)).toFixed(2)}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddProduct} 
            variant="contained" 
            color="primary"
            disabled={!selectedProduct || (selectedProduct.has_price_options && !selectedOption && !useCustomItemRate)}
          >
            Add Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={bulkStatusDialogOpen} onClose={handleCloseBulkStatusDialog}>
        <DialogTitle>
          Update Multiple Orders ({selectedOrderIds.length})
        </DialogTitle>
        <DialogContent>
          <Box className="pt-2 space-y-4">
            <Alert severity="info" className="mb-3">
              Leave a field empty if you don't want to update that status.
            </Alert>
            
            <FormControl fullWidth>
              <InputLabel>Order Status</InputLabel>
              <Select
                value={bulkNewStatus}
                onChange={(e) => setBulkNewStatus(e.target.value)}
                label="Order Status"
                displayEmpty
              >
                <MenuItem value="">
                  <em>Don't change</em>
                </MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={bulkNewPaymentStatus}
                onChange={(e) => setBulkNewPaymentStatus(e.target.value)}
                label="Payment Status"
                displayEmpty
              >
                <MenuItem value="">
                  <em>Don't change</em>
                </MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkStatusDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleBulkUpdateStatus} 
            variant="contained" 
            color="primary"
            disabled={isSubmitting || (bulkNewStatus === '' && bulkNewPaymentStatus === '')}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Update All'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderManagement;
