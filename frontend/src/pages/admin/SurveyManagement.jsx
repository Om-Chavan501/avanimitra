// frontend/src/pages/admin/SurveyManagement.jsx
import { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Button, TextField, IconButton,
  Dialog, DialogActions, DialogContent, DialogTitle, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Grid, Card, CardContent
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  getAdminSurveyProducts, 
  createAdminSurveyProduct,
  updateAdminSurveyProduct,
  deleteAdminSurveyProduct, 
  getAdminSurveyResponses 
} from '../../utils/surveyApi';

const SurveyManagement = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    description: '',
    available_quantities: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Check if user is admin
  useEffect(() => {
    if (isAuthenticated && !user?.is_admin) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);
  
  // Fetch survey products and responses
  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch products
        const productsData = await getAdminSurveyProducts();
        setProducts(productsData);
        
        // Fetch responses
        const responsesData = await getAdminSurveyResponses();
        setResponses(responsesData);
      } catch (err) {
        console.error('Error loading survey data:', err);
        setError('Failed to load survey data');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && user?.is_admin) {
      fetchSurveyData();
    }
  }, [isAuthenticated, user, refreshTrigger]);
  
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleOpenDialog = (product = null) => {
    if (product) {
      // Convert array to comma-separated string for editing
      const quantitiesString = product.available_quantities ? 
        product.available_quantities.join(', ') : '';
      
      setCurrentProduct({
        id: product.id,
        name: product.name,
        description: product.description || '',
        available_quantities: quantitiesString,
      });
      setIsEditing(true);
    } else {
      setCurrentProduct({
        name: '',
        description: '',
        available_quantities: '',
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct({
      ...currentProduct,
      [name]: value
    });
  };
  
  const handleSubmit = async () => {
    try {
      // Prepare data - Convert comma-separated string to array
      const productData = {
        ...currentProduct,
        available_quantities: currentProduct.available_quantities
          ? currentProduct.available_quantities.split(',').map(q => q.trim())
          : []
      };
      
      if (isEditing) {
        const { id, ...updateData } = productData;
        await updateAdminSurveyProduct(id, updateData);
      } else {
        await createAdminSurveyProduct(productData);
      }
      
      // Close dialog and refresh list
      handleCloseDialog();
      handleRefresh();
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product');
    }
  };
  
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteAdminSurveyProduct(productId);
        handleRefresh();
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Failed to delete product');
      }
    }
  };
  
  // Generate summary stats
  const calculateStats = () => {
    const totalResponses = responses.length;
    
    // Count product preferences
    const productCounts = {};
    let totalProductSelections = 0;
    
    responses.forEach(response => {
      if (response.product_preferences && response.product_preferences.length > 0) {
        response.product_preferences.forEach(pref => {
          const productName = pref.product_name;
          if (!productCounts[productName]) {
            productCounts[productName] = 0;
          }
          productCounts[productName]++;
          totalProductSelections++;
        });
      }
    });
    
    // Sort products by popularity
    const sortedProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalResponses) * 100)
      }));
    
    return {
      totalResponses,
      totalProductSelections,
      averageProductsPerResponse: totalResponses > 0 ? 
        (totalProductSelections / totalResponses).toFixed(1) : 0,
      popularProducts: sortedProducts
    };
  };
  
  const stats = calculateStats();
  
  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading survey data...</Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">Survey Management</Typography>
        <Box>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={handleRefresh}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Product
          </Button>
        </Box>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {/* Summary Statistics */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Survey Overview</Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" color="primary">{stats.totalResponses}</Typography>
                <Typography variant="body2" color="textSecondary">Total Responses</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" color="primary">{stats.averageProductsPerResponse}</Typography>
                <Typography variant="body2" color="textSecondary">Avg Products Per Response</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" color="primary">{stats.totalProductSelections}</Typography>
                <Typography variant="body2" color="textSecondary">Total Product Selections</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {stats.popularProducts.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Most Popular Products</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">% of Responses</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.popularProducts.slice(0, 5).map((product) => (
                    <TableRow key={product.name}>
                      <TableCell component="th" scope="row">{product.name}</TableCell>
                      <TableCell align="right">{product.count}</TableCell>
                      <TableCell align="right">{product.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
      
      {/* Products Table */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Survey Products</Typography>
        
        {products.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary">No products added yet</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Quantities</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.description || '-'}</TableCell>
                    <TableCell>
                      {product.available_quantities
                        ? product.available_quantities.join(', ')
                        : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpenDialog(product)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeleteProduct(product.id)} 
                        color="error"
                        size="small"
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
      </Paper>
      
      {/* Responses Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Survey Responses</Typography>
        
        {responses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary">No responses yet</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Area</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Preferred Products</TableCell>
                  <TableCell>Submitted At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {responses.map((response) => (
                  <TableRow key={response.id || response.mobile}>
                    <TableCell>{response.name}</TableCell>
                    <TableCell>{response.mobile}</TableCell>
                    <TableCell>{response.area}</TableCell>
                    <TableCell>{response.city}</TableCell>
                    <TableCell>
                      {response.product_preferences?.map(pref => 
                        `${pref.product_name} (${pref.quantity}, ${pref.frequency})`
                      ).join(', ') || '-'}
                    </TableCell>
                    <TableCell>
                      {response.created_at ? new Date(response.created_at).toLocaleString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Product Name"
            type="text"
            fullWidth
            value={currentProduct.name}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description (Optional)"
            type="text"
            fullWidth
            value={currentProduct.description}
            onChange={handleInputChange}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="available_quantities"
            label="Available Quantities (comma separated)"
            placeholder="1 kg, 500g, 250g"
            type="text"
            fullWidth
            value={currentProduct.available_quantities}
            onChange={handleInputChange}
            helperText="Enter quantities separated by commas"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!currentProduct.name}
          >
            {isEditing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SurveyManagement;