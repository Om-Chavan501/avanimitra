import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Typography, Box, Paper, Grid, Card, CardContent,
  Button, List, ListItem, ListItemText, Divider, CircularProgress,
  Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  DialogContentText, Snackbar, Alert, CardActions
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DownloadIcon from '@mui/icons-material/Download';
import PollIcon from '@mui/icons-material/Poll';

import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    users: 0,
    activeOrders: 0,
    deliveredOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    message: '',
    duplicates: []
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [downloadLoading, setDownloadLoading] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Get products count
        const productsResponse = await api.get('/products', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Get users count
        const usersResponse = await api.get('/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Get orders
        const ordersResponse = await api.get('/admin/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Calculate stats
        const activeOrders = ordersResponse.data.filter(
          order => ['pending', 'processing', 'shipped'].includes(order.order_status)
        );
        const deliveredOrders = ordersResponse.data.filter(
          order => order.order_status === 'delivered'
        );
        
        setStats({
          products: productsResponse.data.length,
          users: usersResponse.data.filter(user => !user.is_admin).length,
          activeOrders: activeOrders.length,
          deliveredOrders: deliveredOrders.length
        });
        
        // Set recent orders (up to 5)
        setRecentOrders(ordersResponse.data.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleDownloadClick = (event) => {
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setDownloadMenuAnchor(null);
  };

  const handleDownload = async (format) => {
    handleDownloadClose();
    
    try {
      setDownloadLoading(true);
      const token = localStorage.getItem('token');
      
      // First validate users for duplicates
      const validationResponse = await api.get('/admin/users/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!validationResponse.data.valid) {
        setErrorDialog({
          open: true,
          message: validationResponse.data.message,
          duplicates: validationResponse.data.duplicates
        });
        return;
      }
      
      // Download the file
      const response = await api.get(`/admin/users/download?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create a download link and click it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'users';
      if (format === 'excel') filename += '.xlsx';
      if (format === 'vcf') filename += '.vcf';
      
      // Try to get filename from Content-Disposition header
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
      
      setNotification({
        open: true,
        message: `User data successfully downloaded as ${format.toUpperCase()}`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error(`Error downloading ${format} file:`, error);
      setNotification({
        open: true,
        message: `Failed to download user data. ${error.message || ''}`,
        severity: 'error'
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleCloseErrorDialog = () => {
    setErrorDialog({
      ...errorDialog,
      open: false
    });
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Typography variant="body1" paragraph>
        Welcome back, {user?.name}. Here's an overview of your store.
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={4} className="mb-6">
            <Grid item xs={12} sm={6} lg={3}>
              <Card className="h-full">
                <CardContent className="flex flex-col items-center text-center">
                  <InventoryIcon fontSize="large" color="primary" />
                  <Typography variant="h4" className="my-2">
                    {stats.products}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    Products
                  </Typography>
                  <Button 
                    component={Link} 
                    to="/admin/products"
                    size="small"
                    className="mt-2"
                  >
                    Manage
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} lg={3}>
              <Card className="h-full">
                <CardContent className="flex flex-col items-center text-center">
                  <PeopleIcon fontSize="large" color="primary" />
                  <Typography variant="h4" className="my-2">
                    {stats.users}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    Users
                  </Typography>
                  <Button 
                    component={Link} 
                    to="/admin/users"
                    size="small"
                    className="mt-2"
                  >
                    Manage
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} lg={3}>
              <Card className="h-full">
                <CardContent className="flex flex-col items-center text-center">
                  <LocalShippingIcon fontSize="large" color="primary" />
                  <Typography variant="h4" className="my-2">
                    {stats.activeOrders}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    Active Orders
                  </Typography>
                  <Button 
                    component={Link} 
                    to="/admin/orders?status=active"
                    size="small"
                    className="mt-2"
                  >
                    Manage
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} lg={3}>
              <Card className="h-full">
                <CardContent className="flex flex-col items-center text-center">
                  <AddShoppingCartIcon fontSize="large" color="primary" />
                  <Typography variant="h4" className="my-2">
                    {stats.deliveredOrders}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    Delivered Orders
                  </Typography>
                  <Button 
                    component={Link} 
                    to="/admin/orders?status=past"
                    size="small"
                    className="mt-2"
                  >
                    View
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper className="p-4">
                <Box className="flex justify-between items-center mb-3">
                  <Typography variant="h6">Recent Orders</Typography>
                  <Button 
                    component={Link} 
                    to="/admin/orders"
                    size="small"
                  >
                    View All
                  </Button>
                </Box>
                
                {recentOrders.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" className="text-center py-4">
                    No orders found
                  </Typography>
                ) : (
                  <List>
                    {recentOrders.map((order, index) => (
                      <Box key={order.id}>
                        <ListItem>
                          <ListItemText
                            primary={`Order #${order.id.substring(0, 8)}`}
                            secondary={`${new Date(order.order_date).toLocaleDateString()} - ${order.order_status.toUpperCase()}`}
                          />
                          <Button 
                            variant="outlined" 
                            size="small"
                            component={Link}
                            to={`/admin/orders?orderId=${order.id}`}
                          >
                            View
                          </Button>
                        </ListItem>
                        {index < recentOrders.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper className="p-4">
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Button 
                    variant="contained" 
                    component={Link} 
                    to="/admin/products"
                    className="w-full" 
                    startIcon={<InventoryIcon />}
                  >
                    Manage Products
                  </Button>
                  <Button 
                    variant="contained" 
                    component={Link} 
                    to="/admin/users"
                    className="w-full" 
                    startIcon={<PeopleIcon />}
                  >
                    Manage Users
                  </Button>
                  <Button 
                    variant="contained" 
                    component={Link} 
                    to="/admin/orders"
                    className="w-full" 
                    startIcon={<LocalShippingIcon />}
                  >
                    Manage Orders
                  </Button>
                  <Button 
                    variant="contained" 
                    component={Link} 
                    to="/admin/custom-order"
                    className="w-full" 
                    startIcon={<AddShoppingCartIcon />}
                  >
                    Create Order
                  </Button>
                  <Button 
                    variant="contained" 
                    component={Link} 
                    to="/admin/export-orders"
                    className="w-full" 
                    startIcon={<FileDownloadIcon />}
                  >
                    Export Orders
                  </Button>
                  <Button
                    variant="contained"
                    className="w-full"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadClick}
                    disabled={downloadLoading}
                  >
                    {downloadLoading ? 'Downloading...' : 'Download User Info'}
                  </Button>
                </Box>
              </Paper>
              
              <Paper className="p-4 mt-4">
                <Typography variant="h6" gutterBottom>
                  Admin Info
                </Typography>
                <Box className="mt-2">
                  <Typography variant="body2" color="textSecondary">
                    Name:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {user?.name}
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary">
                    Phone:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    +91 {user?.phone}
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary">
                    Role:
                  </Typography>
                  <Typography variant="body1">
                    Administrator
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Survey Management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Manage survey products and view customer preferences.
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                <Button 
                  color="primary" 
                  variant="contained" 
                  component={Link} 
                  to="/admin/survey"
                  startIcon={<PollIcon />}
                >
                  Manage Survey
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </>
      )}
      
      {/* Download Format Menu */}
      <Menu
        anchorEl={downloadMenuAnchor}
        open={Boolean(downloadMenuAnchor)}
        onClose={handleDownloadClose}
      >
        <MenuItem onClick={() => handleDownload('excel')}>
          Download as Excel (.xlsx)
        </MenuItem>
        <MenuItem onClick={() => handleDownload('vcf')}>
          Download as Contacts (.vcf)
        </MenuItem>
      </Menu>
      
      {/* Error Dialog for Duplicate Phone Numbers */}
      <Dialog
        open={errorDialog.open}
        onClose={handleCloseErrorDialog}
        aria-labelledby="duplicate-dialog-title"
      >
        <DialogTitle id="duplicate-dialog-title">
          Cannot Download User Data
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {errorDialog.message}
          </DialogContentText>
          {errorDialog.duplicates && errorDialog.duplicates.length > 0 && (
            <>
              <Typography variant="subtitle2" className="mt-3 mb-1">
                Duplicate phone numbers:
              </Typography>
              <Box className="max-h-40 overflow-y-auto">
                <List dense>
                  {errorDialog.duplicates.map((phone, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={phone} />
                    </ListItem>
                  ))}
                </List>
              </Box>
              <DialogContentText className="mt-3">
                Please resolve these duplicate entries before downloading user data.
              </DialogContentText>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseErrorDialog} color="primary" autoFocus>
            Close
          </Button>
          <Button 
            component={Link} 
            to="/admin/users" 
            color="primary"
            onClick={handleCloseErrorDialog}
          >
            Manage Users
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;

