import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Grid, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, CircularProgress, Autocomplete, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
  FormControl, InputLabel, Select, MenuItem, Divider, Switch, FormControlLabel,
  RadioGroup, FormLabel, Radio, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PercentIcon from '@mui/icons-material/Percent';
import api from '../../utils/api';
import PasswordField from '../../components/PasswordField';

const CustomOrder = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Order data
  const [selectedUser, setSelectedUser] = useState(null);
  const [orderDetails, setOrderDetails] = useState({
    delivery_address: '',
    receiver_phone: '',
    payment_status: 'pending',
    order_status: 'pending'
  });
  const [orderItems, setOrderItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Custom rate fields
  const [discountType, setDiscountType] = useState('none'); // none, order, item
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [orderDiscountType, setOrderDiscountType] = useState('percentage'); // percentage, fixed
  
  // Product selection dialog
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [customItemRate, setCustomItemRate] = useState(0);
  const [useCustomItemRate, setUseCustomItemRate] = useState(false);
  
  // Price option states
  const [selectedOption, setSelectedOption] = useState(null);
  const [optionType, setOptionType] = useState('box');

  // New user dialog
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    phone: '',
    address: '',
    password: 'password' // Default password
  });
  const [newUserErrors, setNewUserErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        // Fetch users
        const usersResponse = await api.get('/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Only regular users, not admins
        const regularUsers = usersResponse.data.filter(user => !user.is_admin);
        setUsers(regularUsers);

        // Fetch active products
        const productsResponse = await api.get('/admin/products', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Only active products with stock
        const activeProducts = productsResponse.data.filter(
          product => product.status === 'active' && product.stock_quantity > 0
        );
        setProducts(activeProducts);
      } catch (err) {
        setError('Failed to fetch required data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate total amount when order items change or when discount changes
  useEffect(() => {
    // Calculate base total
    const baseTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply discounts
    if (discountType === 'order' && orderDiscount > 0) {
      if (orderDiscountType === 'percentage') {
        // Percentage discount
        const discountAmount = baseTotal * (orderDiscount / 100);
        setTotalAmount(baseTotal - discountAmount);
      } else {
        // Fixed amount discount
        setTotalAmount(Math.max(0, baseTotal - orderDiscount));
      }
    } else {
      // No discount or item-level discounts are already included in item prices
      setTotalAmount(baseTotal);
    }
  }, [orderItems, discountType, orderDiscount, orderDiscountType]);

  // Update delivery details when user changes
  useEffect(() => {
    if (selectedUser) {
      setOrderDetails({
        ...orderDetails,
        delivery_address: selectedUser.address || '',
        receiver_phone: selectedUser.phone || ''
      });
    }
  }, [selectedUser]);
  
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

  const handleUserChange = (event, newValue) => {
    setSelectedUser(newValue);
  };

  const handleOrderDetailsChange = (e) => {
    const { name, value } = e.target;
    setOrderDetails({
      ...orderDetails,
      [name]: value
    });
  };

  const handleOpenProductDialog = () => {
    setSelectedProduct(null);
    setSelectedQuantity(1);
    setCustomItemRate(0);
    setUseCustomItemRate(false);
    setSelectedOption(null);
    setOptionType('box');
    setProductDialogOpen(true);
  };

  const handleCloseProductDialog = () => {
    setProductDialogOpen(false);
  };

  const handleProductSelection = (event, newValue) => {
    setSelectedProduct(newValue);
    if (newValue) {
      if (!newValue.has_price_options) {
        setCustomItemRate(newValue.price);
      }
    }
  };

  const handleQuantityChange = (value) => {
    if (value < 1) return;
    setSelectedQuantity(value);
  };

  const handleCustomRateChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setCustomItemRate(value);
    }
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

  const handleAddProductToOrder = () => {
    if (!selectedProduct) return;

    // Determine the price to use
    let price = selectedProduct.price;
    let option = null;
    
    if (useCustomItemRate) {
      price = customItemRate;
    } else if (selectedOption) {
      price = selectedOption.price;
      option = selectedOption;
    }

    // Add new product to order
    const newItem = {
      product_id: selectedProduct.id,
      product: selectedProduct,
      quantity: selectedQuantity,
      price: price,
      custom_price: useCustomItemRate
    };
    
    // Add selected option if applicable
    if (option && !useCustomItemRate) {
      newItem.selected_option = option;
    }

    setOrderItems([...orderItems, newItem]);
    handleCloseProductDialog();
  };

  const handleUpdateItemQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = [...orderItems];
    updatedItems[index].quantity = newQuantity;
    setOrderItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...orderItems];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
  };

  const handleDiscountTypeChange = (e) => {
    setDiscountType(e.target.value);
  };

  const handleOrderDiscountChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setOrderDiscount(value);
    }
  };
  
  const handleOrderDiscountTypeChange = (e) => {
    setOrderDiscountType(e.target.value);
  };

  const validateOrder = () => {
    if (!selectedUser) {
      setError('Please select a customer');
      return false;
    }

    if (!orderDetails.delivery_address) {
      setError('Delivery address is required');
      return false;
    }

    if (!orderDetails.receiver_phone) {
      setError('Receiver phone is required');
      return false;
    }

    if (orderItems.length === 0) {
      setError('Please add at least one product to the order');
      return false;
    }

    return true;
  };

  const handleSubmitOrder = async () => {
    if (!validateOrder()) return;
    
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      
      // Prepare discount information
      const discountInfo = 
        discountType === 'order' 
          ? {
              discount_type: orderDiscountType,
              discount_value: orderDiscount
            }
          : {};
      
      // Format items to include selected_option
      const formattedItems = orderItems.map(item => {
        const formattedItem = {
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_purchase: item.price
        };
        
        // Include selected option if present
        if (item.selected_option) {
          formattedItem.selected_option = item.selected_option;
        }
        
        return formattedItem;
      });
      
      await api.post(
        '/admin/custom-orders',
        {
          user_id: selectedUser.id,
          delivery_address: orderDetails.delivery_address,
          receiver_phone: orderDetails.receiver_phone,
          payment_status: orderDetails.payment_status,
          order_status: orderDetails.order_status,
          items: formattedItems,
          ...discountInfo,
          total_amount: totalAmount
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Order created successfully!');
      
      // Reset form after successful submission
      setTimeout(() => {
        navigate('/admin/orders');
      }, 2000);
    } catch (err) {
      setError(`Failed to create order: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // New user dialog functions
  const handleOpenNewUserDialog = () => {
    setNewUser({
      name: '',
      phone: '',
      address: '',
      password: 'password' // Default password
    });
    setNewUserErrors({});
    setNewUserDialogOpen(true);
  };

  const handleCloseNewUserDialog = () => {
    setNewUserDialogOpen(false);
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
    
    // Clear error for this field
    if (newUserErrors[name]) {
      setNewUserErrors({
        ...newUserErrors,
        [name]: ''
      });
    }
  };

  const validateNewUser = () => {
    const errors = {};
    
    if (!newUser.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!newUser.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(newUser.phone)) {
      errors.phone = 'Phone number must be 10 digits';
    }
    
    if (!newUser.address.trim()) {
      errors.address = 'Address is required';
    }
    
    setNewUserErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateNewUser = async () => {
    if (!validateNewUser()) return;
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await api.post(
        '/admin/users',
        newUser,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Add new user to the users list and select it
      const newCreatedUser = response.data;
      setUsers([...users, newCreatedUser]);
      setSelectedUser(newCreatedUser);
      
      // Close dialog
      handleCloseNewUserDialog();
      setSuccess('New customer created successfully!');
    } catch (err) {
      setError(`Failed to create user: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSubmitting(false);
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
        Create Custom Order
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

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper className="p-4 mb-4">
            <Typography variant="h6" gutterBottom>
              Order Items
            </Typography>

            {orderItems.length === 0 ? (
              <Box className="text-center py-6">
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  No items added to order
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenProductDialog}
                >
                  Add Product
                </Button>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="center">Quantity</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderItems.map((item, index) => (
                        <TableRow key={index}>
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
                                <Typography variant="caption" color="textSecondary">
                                  Stock: {item.product.stock_quantity}
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
                                
                                {item.custom_price && (
                                  <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                                    Custom Price
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {item.custom_price ? (
                              <Typography color="primary">₹{item.price.toFixed(2)}</Typography>
                            ) : (
                              <Typography>₹{item.price.toFixed(2)}</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box className="flex items-center justify-center">
                              <IconButton 
                                size="small"
                                onClick={() => handleUpdateItemQuantity(index, item.quantity - 1)}
                              >
                                <RemoveIcon />
                              </IconButton>
                              <TextField
                                value={item.quantity}
                                size="small"
                                InputProps={{ readOnly: true }}
                                sx={{ width: 60, mx: 1, textAlign: 'center' }}
                              />
                              <IconButton 
                                size="small"
                                onClick={() => handleUpdateItemQuantity(index, item.quantity + 1)}
                              >
                                <AddIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              color="error"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box className="mt-4 flex justify-between">
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleOpenProductDialog}
                  >
                    Add More Products
                  </Button>
                  <Typography variant="h6">
                    Total: ₹{totalAmount.toFixed(2)}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>

          <Paper className="p-4 mb-4">
            <Typography variant="h6" gutterBottom>
              Discount Options
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Discount Type</InputLabel>
              <Select
                value={discountType}
                onChange={handleDiscountTypeChange}
                label="Discount Type"
              >
                <MenuItem value="none">No Discount</MenuItem>
                <MenuItem value="order">Order-level Discount</MenuItem>
                <MenuItem value="item">Item-level Custom Prices</MenuItem>
              </Select>
            </FormControl>
            
            {discountType === 'order' && (
              <Box className="mt-3">
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Discount Value"
                      type="number"
                      value={orderDiscount}
                      onChange={handleOrderDiscountChange}
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {orderDiscountType === 'percentage' ? '%' : '₹'}
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Discount Method</InputLabel>
                      <Select
                        value={orderDiscountType}
                        onChange={handleOrderDiscountTypeChange}
                        label="Discount Method"
                      >
                        <MenuItem value="percentage">Percentage</MenuItem>
                        <MenuItem value="fixed">Fixed Amount</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                {orderDiscountType === 'percentage' && orderDiscount > 0 && (
                  <Typography variant="body2" color="textSecondary" className="mt-2">
                    Discount Amount: ₹{((orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * orderDiscount) / 100).toFixed(2)}
                  </Typography>
                )}
              </Box>
            )}
            
            {discountType === 'item' && (
              <Typography variant="body2" color="textSecondary" className="mt-2">
                Use custom prices when adding individual products to the order.
              </Typography>
            )}
          </Paper>

          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Order Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    name="payment_status"
                    value={orderDetails.payment_status}
                    onChange={handleOrderDetailsChange}
                    label="Payment Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Order Status</InputLabel>
                  <Select
                    name="order_status"
                    value={orderDetails.order_status}
                    onChange={handleOrderDetailsChange}
                    label="Order Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="processing">Processing</MenuItem>
                    <MenuItem value="shipped">Shipped</MenuItem>
                    <MenuItem value="delivered">Delivered</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper className="p-4 mb-4">
            <Box className="flex justify-between items-center mb-4">
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
              <Button
                startIcon={<PersonAddIcon />}
                onClick={handleOpenNewUserDialog}
                size="small"
              >
                New Customer
              </Button>
            </Box>
            <Autocomplete
              id="customer-select"
              options={users}
              getOptionLabel={(option) => `${option.name} (${option.phone})`}
              value={selectedUser}
              onChange={handleUserChange}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Select Customer" 
                  margin="normal"
                  required
                />
              )}
            />
          </Paper>

          <Paper className="p-4">
            <Typography variant="h6" gutterBottom>
              Delivery Details
            </Typography>
            <TextField
              name="delivery_address"
              label="Delivery Address"
              fullWidth
              margin="normal"
              value={orderDetails.delivery_address}
              onChange={handleOrderDetailsChange}
              multiline
              rows={3}
              required
            />
            <TextField
              name="receiver_phone"
              label="Receiver's Phone"
              fullWidth
              margin="normal"
              value={orderDetails.receiver_phone}
              onChange={handleOrderDetailsChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">+91</InputAdornment>,
              }}
              required
            />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              className="mt-4"
              onClick={handleSubmitOrder}
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : 'Create Order'}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Product Dialog */}
      <Dialog open={productDialogOpen} onClose={handleCloseProductDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add Product to Order</DialogTitle>
        <DialogContent>
          <Autocomplete
            id="product-select"
            options={products.filter(product => product.status === 'active' && product.stock_quantity > 0)}
            getOptionLabel={(option) => option.name}
            value={selectedProduct}
            onChange={handleProductSelection}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Select Product" 
                margin="normal"
                fullWidth
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box className="flex items-center">
                  <img 
                    src={option.image_url} 
                    alt={option.name}
                    className="w-10 h-10 object-cover mr-2"
                  />
                  <Box>
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {option.has_price_options ? 
                        `From ₹${Math.min(...option.price_options.map(opt => opt.price)).toFixed(2)}` : 
                        `₹${option.price.toFixed(2)}`} - Stock: {option.stock_quantity} - {option.category}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          />

          {selectedProduct && (
            <>
              {selectedProduct.has_price_options ? (
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
              ) : (
                <Typography variant="body1" className="mt-4">
                  Price: ₹{selectedProduct.price.toFixed(2)}
                </Typography>
              )}

              <Box className="mt-4">
                <Typography variant="subtitle2" gutterBottom>
                  Quantity: (Available: {selectedProduct.stock_quantity})
                </Typography>
                <Box className="flex items-center">
                  <IconButton 
                    size="small"
                    onClick={() => handleQuantityChange(selectedQuantity - 1)}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <TextField
                    value={selectedQuantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value > 0 && value <= selectedProduct.stock_quantity) {
                        handleQuantityChange(value);
                      }
                    }}
                    size="small"
                    type="number"
                    InputProps={{ 
                      inputProps: { 
                        min: 1, 
                        max: selectedProduct.stock_quantity 
                      } 
                    }}
                    sx={{ width: 60, mx: 1 }}
                  />
                  <IconButton 
                    size="small"
                    onClick={() => handleQuantityChange(Math.min(selectedQuantity + 1, selectedProduct.stock_quantity))}
                  >
                    <AddIcon />
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
                    onChange={handleCustomRateChange}
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
              
              <Box className="mt-4 flex justify-between">
                <Typography>
                  Price: ₹{useCustomItemRate ? 
                    customItemRate.toFixed(2) : 
                    (selectedOption ? selectedOption.price.toFixed(2) : selectedProduct.price.toFixed(2))}
                </Typography>
                <Typography>
                  Subtotal: ₹{(useCustomItemRate ? 
                    customItemRate * selectedQuantity : 
                    (selectedOption ? selectedOption.price * selectedQuantity : selectedProduct.price * selectedQuantity))
                    .toFixed(2)}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddProductToOrder} 
            variant="contained" 
            color="primary"
            disabled={!selectedProduct || (selectedProduct.has_price_options && !selectedOption && !useCustomItemRate)}
          >
            Add to Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Customer Dialog */}
      <Dialog open={newUserDialogOpen} onClose={handleCloseNewUserDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Customer</DialogTitle>
        <DialogContent>
          <Box className="pt-2">
            <TextField
              name="name"
              label="Full Name"
              fullWidth
              margin="normal"
              value={newUser.name}
              onChange={handleNewUserChange}
              error={!!newUserErrors.name}
              helperText={newUserErrors.name}
              required
            />
            
            <TextField
              name="phone"
              label="Phone Number"
              fullWidth
              margin="normal"
              value={newUser.phone}
              onChange={handleNewUserChange}
              error={!!newUserErrors.phone}
              helperText={newUserErrors.phone}
              InputProps={{
                startAdornment: <InputAdornment position="start">+91</InputAdornment>,
              }}
              inputProps={{ maxLength: 10 }}
              required
            />
            
            <TextField
              name="address"
              label="Address"
              fullWidth
              margin="normal"
              multiline
              rows={2}
              value={newUser.address}
              onChange={handleNewUserChange}
              error={!!newUserErrors.address}
              helperText={newUserErrors.address}
              required
            />
            
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Note: A default password "password" will be set for this customer.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewUserDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateNewUser} 
            variant="contained" 
            color="primary"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Create Customer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomOrder;