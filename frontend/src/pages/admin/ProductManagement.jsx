// frontend/src/pages/admin/ProductManagement.jsx
import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Button, TextField, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  CircularProgress, FormControl, InputLabel, Select, MenuItem, Alert,
  Card, CardMedia, Checkbox, FormControlLabel, FormHelperText,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import api from '../../utils/api';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    old_price: '',
    stock_quantity: '',
    category: '',
    image_url: '',
    status: '',
    is_seasonal: false,
    has_price_options: false,
    price_options: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  // Product categories
  const categories = [
    'apples', 'bananas', 'berries', 'citrus', 'grapes', 
    'mangoes', 'melons', 'stone_fruits', 'tropical', 'other'
  ];
  
  // Product statuses
  const statuses = ['active', 'inactive', 'out_of_stock'];
  
  // Initial price options for mangoes
  const defaultMangoOptions = {
    small: [
      {
        type: 'box',
        size: 'small',
        quantity: '6.5/7 Dz',
        price: 5300,
        old_price: null
      },
      {
        type: 'quantity',
        size: 'small',
        quantity: '1 Dz',
        price: 850,
        old_price: null
      }
    ],
    medium: [
      {
        type: 'box',
        size: 'medium',
        quantity: '5.5/6 Dz',
        price: 6300,
        old_price: null
      },
      {
        type: 'quantity',
        size: 'medium',
        quantity: '1 Dz',
        price: 1200,
        old_price: null
      }
    ],
    big: [
      {
        type: 'box',
        size: 'big',
        quantity: '5/5.25 Dz',
        price: 7400,
        old_price: null
      },
      {
        type: 'quantity',
        size: 'big',
        quantity: '1 Dz',
        price: 1550,
        old_price: null
      }
    ]
  };
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/admin/products', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProducts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch products. Please try again.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenDialog = (mode, product = null) => {
    setDialogMode(mode);
    if (mode === 'edit' && product) {
      setFormData({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        old_price: product.old_price ? product.old_price.toString() : '',
        stock_quantity: product.stock_quantity.toString(),
        category: product.category,
        image_url: product.image_url,
        status: product.status,
        is_seasonal: product.is_seasonal || false,
        has_price_options: product.has_price_options || false,
        price_options: product.price_options || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        old_price: '',
        stock_quantity: '',
        category: '',
        image_url: '',
        status: 'active',
        is_seasonal: false,
        has_price_options: false,
        price_options: []
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    // Special handling for checkbox
    const newValue = type === 'checkbox' ? checked : value;
    
    // For mango products, set up default price options when category changes to mangoes
    if (name === 'category' && value === 'mangoes' && !formData.has_price_options) {
      // Suggest enabling price options for mangoes
      setFormData({
        ...formData,
        [name]: value,
        is_seasonal: true
      });
      return;
    }
    
    // When has_price_options is turned on
    if (name === 'has_price_options' && checked && formData.price_options.length === 0) {
      // Set default options based on category
      if (formData.category === 'mangoes') {
        // For mangoes, determine size from name
        let size = 'medium'; // default
        if (formData.name.toLowerCase().includes('small')) {
          size = 'small';
        } else if (formData.name.toLowerCase().includes('big')) {
          size = 'big';
        }
        
        setFormData({
          ...formData,
          has_price_options: true,
          is_seasonal: true,
          price_options: defaultMangoOptions[size] || []
        });
        return;
      }
    }
    
    setFormData({
      ...formData,
      [name]: newValue
    });
    
    // Clear the error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  const handlePriceOptionChange = (index, field, value) => {
    const updatedOptions = [...formData.price_options];
    
    // Convert to number for price fields
    if (field === 'price' || field === 'old_price') {
      value = value === '' ? null : parseFloat(value);
    }
    
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      price_options: updatedOptions
    });
  };
  
  const addPriceOption = () => {
    const newOption = {
      type: 'box', // default type
      size: formData.category === 'mangoes' ? 'medium' : '',
      quantity: '',
      price: parseFloat(formData.price) || 0,
      old_price: formData.old_price ? parseFloat(formData.old_price) : null
    };
    
    setFormData({
      ...formData,
      price_options: [...formData.price_options, newOption]
    });
  };
  
  const removePriceOption = (index) => {
    const updatedOptions = [...formData.price_options];
    updatedOptions.splice(index, 1);
    
    setFormData({
      ...formData,
      price_options: updatedOptions
    });
  };
  
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.price) errors.price = 'Price is required';
    else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = 'Price must be a positive number';
    }
    
    // Old price validation - must be greater than current price or empty
    if (formData.old_price && !isNaN(formData.old_price)) {
      const oldPrice = parseFloat(formData.old_price);
      const currentPrice = parseFloat(formData.price);
      if (oldPrice <= currentPrice) {
        errors.old_price = 'Old price should be greater than current price';
      }
    }
    
    if (!formData.stock_quantity) errors.stock_quantity = 'Stock quantity is required';
    else if (isNaN(formData.stock_quantity) || parseInt(formData.stock_quantity) < 0) {
      errors.stock_quantity = 'Stock quantity must be a non-negative number';
    }
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.image_url.trim()) errors.image_url = 'Image URL is required';
    if (!formData.status) errors.status = 'Status is required';
    
    if (formData.has_price_options && formData.price_options.length === 0) {
      errors.price_options = 'At least one price option is required';
    }
    
    // Validate each price option
    if (formData.has_price_options && formData.price_options.length > 0) {
      const optionErrors = [];
      
      formData.price_options.forEach((option, index) => {
        if (!option.type || !option.size || !option.quantity || !option.price) {
          optionErrors.push(`Option #${index + 1} is missing required fields`);
        }
        
        if (option.old_price && option.price >= option.old_price) {
          optionErrors.push(`Option #${index + 1}: Old price must be greater than current price`);
        }
      });
      
      if (optionErrors.length > 0) {
        errors.price_options = optionErrors.join(', ');
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSuccess('');
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        old_price: formData.old_price ? parseFloat(formData.old_price) : null,
        stock_quantity: parseInt(formData.stock_quantity)
      };
      
      if (dialogMode === 'add') {
        await api.post('/admin/products', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Product added successfully!');
      } else {
        const { id, ...updatePayload } = payload;
        await api.put(`/admin/products/${id}`, updatePayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Product updated successfully!');
      }
      
      // Refresh products list
      fetchProducts();
      handleCloseDialog();
    } catch (err) {
      setError(`Failed to ${dialogMode === 'add' ? 'add' : 'update'} product: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenDeleteDialog = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };
  
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setIsSubmitting(true);
    setSuccess('');
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/admin/products/${productToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Product deleted successfully!');
      fetchProducts();
    } catch (err) {
      setError(`Failed to delete product: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsSubmitting(false);
      handleCloseDeleteDialog();
    }
  };
  
  // Helper function to display price with discount
  const renderPriceDisplay = (price, oldPrice) => {
    if (oldPrice && oldPrice > price) {
      return (
        <Box className="flex flex-col">
          <Typography variant="body2" color="text.secondary" className="line-through">
            ₹{oldPrice.toFixed(2)}
          </Typography>
          <Typography variant="body1" color="primary.main" fontWeight="bold">
            ₹{price.toFixed(2)}
          </Typography>
        </Box>
      );
    }
    return <span>₹{price.toFixed(2)}</span>;
  };
  
  return (
    <Container maxWidth="lg" className="py-8">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" component="h1">
          Product Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('add')}
        >
          Add Product
        </Button>
      </Box>
      
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
      
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Price (₹)</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-16 h-16 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/150?text=Image+Error";
                      }}
                    />
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell align="right">
                    {product.has_price_options ? (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          From
                        </Typography>
                        {renderPriceDisplay(
                          Math.min(...product.price_options.map(opt => opt.price)),
                          product.price_options.find(opt => 
                            opt.price === Math.min(...product.price_options.map(o => o.price))
                          )?.old_price
                        )}
                      </Box>
                    ) : (
                      renderPriceDisplay(product.price, product.old_price)
                    )}
                  </TableCell>
                  <TableCell align="right">{product.stock_quantity}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      product.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : product.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {product.is_seasonal ? (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">Seasonal</span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Regular</span>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenDialog('edit', product)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleOpenDeleteDialog(product)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Product' : 'Edit Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="pt-2">
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Product Name"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.category} required>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.category && (
                  <Typography variant="caption" color="error">
                    {formErrors.category}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                error={!!formErrors.description}
                helperText={formErrors.description}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="price"
                label="Current Price (₹)"
                fullWidth
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                error={!!formErrors.price}
                helperText={formErrors.price}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="old_price"
                label="Old Price (₹) (Optional)"
                fullWidth
                type="number"
                value={formData.old_price}
                onChange={handleInputChange}
                error={!!formErrors.old_price}
                helperText={formErrors.old_price || "Leave empty if no discount"}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="stock_quantity"
                label="Stock Quantity"
                fullWidth
                type="number"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                error={!!formErrors.stock_quantity}
                helperText={formErrors.stock_quantity}
                inputProps={{ min: 0, step: 1 }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.status} required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Status"
                >
                  {statuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.status && (
                  <Typography variant="caption" color="error">
                    {formErrors.status}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="image_url"
                label="Image URL"
                fullWidth
                value={formData.image_url}
                onChange={handleInputChange}
                error={!!formErrors.image_url}
                helperText={formErrors.image_url}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_seasonal}
                    onChange={handleInputChange}
                    name="is_seasonal"
                  />
                }
                label="Seasonal Product"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_price_options}
                    onChange={handleInputChange}
                    name="has_price_options"
                  />
                }
                label="Has Multiple Price Options"
              />
            </Grid>
            
            {formData.has_price_options && (
              <Grid item xs={12}>
                <Box className="mb-3">
                  <Box className="flex justify-between items-center">
                    <Typography variant="subtitle1">Price Options</Typography>
                    <Button 
                      startIcon={<AddIcon />}
                      onClick={addPriceOption}
                      size="small"
                    >
                      Add Option
                    </Button>
                  </Box>
                  
                  {formErrors.price_options && (
                    <FormHelperText error>{formErrors.price_options}</FormHelperText>
                  )}
                  
                  {formData.price_options.length === 0 ? (
                    <Box className="p-4 mt-2 bg-gray-100 text-center rounded">
                      <Typography variant="body2" color="textSecondary">
                        No price options defined. Click "Add Option" to add one.
                      </Typography>
                    </Box>
                  ) : (
                    formData.price_options.map((option, index) => (
                      <Accordion key={index} className="mt-2">
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>
                            Option {index + 1}: {option.type} - {option.size} - {option.quantity} - 
                            {option.old_price && option.old_price > option.price ? (
                              <span>
                                <span className="line-through mr-1">₹{option.old_price}</span>
                                <span className="text-green-600">₹{option.price}</span>
                              </span>
                            ) : (
                              <span>₹{option.price}</span>
                            )}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                  value={option.type}
                                  onChange={(e) => handlePriceOptionChange(index, 'type', e.target.value)}
                                  label="Type"
                                >
                                  <MenuItem value="box">Box</MenuItem>
                                  <MenuItem value="quantity">Quantity</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <FormControl fullWidth>
                                <InputLabel>Size</InputLabel>
                                <Select
                                  value={option.size}
                                  onChange={(e) => handlePriceOptionChange(index, 'size', e.target.value)}
                                  label="Size"
                                >
                                  <MenuItem value="small">Small</MenuItem>
                                  <MenuItem value="medium">Medium</MenuItem>
                                  <MenuItem value="big">Big</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Quantity (e.g. '1 Dz' or '6.5/7 Dz')"
                                fullWidth
                                value={option.quantity}
                                onChange={(e) => handlePriceOptionChange(index, 'quantity', e.target.value)}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Price (₹)"
                                fullWidth
                                type="number"
                                value={option.price}
                                onChange={(e) => handlePriceOptionChange(index, 'price', e.target.value)}
                                inputProps={{ min: 0, step: 0.01 }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                label="Old Price (₹) (Optional)"
                                fullWidth
                                type="number"
                                value={option.old_price || ""}
                                onChange={(e) => handlePriceOptionChange(index, 'old_price', e.target.value)}
                                inputProps={{ min: 0, step: 0.01 }}
                                helperText="Leave empty if no discount"
                              />
                            </Grid>
                            <Grid item xs={12} className="flex justify-end">
                              <Button 
                                variant="outlined" 
                                color="error"
                                onClick={() => removePriceOption(index)}
                              >
                                Remove Option
                              </Button>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  )}
                </Box>
              </Grid>
            )}
            
            {formData.image_url && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Image Preview
                </Typography>
                <Card className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  <CardMedia
                    component="img" 
                    image={formData.image_url}
                    alt="Product preview" 
                    className="max-h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/400x300?text=Invalid+Image+URL";
                    }}
                  />
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteProduct} 
            color="error" 
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductManagement;