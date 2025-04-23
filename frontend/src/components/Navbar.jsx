import { useState } from 'react';
import {
  AppBar, Button, Toolbar, Typography, Box, IconButton,
  Badge, Menu, MenuItem, Avatar, Tooltip, Divider,
  useMediaQuery, useTheme, Drawer, List, ListItem, ListItemIcon,
  ListItemText, Container
} from '@mui/material';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import InventoryIcon from '@mui/icons-material/Inventory';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const auth = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  
  // Safety checks
  const isAuthenticated = auth?.isAuthenticated;
  const user = auth?.user;
  const logout = auth?.logout;
  const cartItems = cart?.cart?.items || [];
  
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [adminMenuAnchorEl, setAdminMenuAnchorEl] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  const handleProfileMenuOpen = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setProfileAnchorEl(null);
  };
  
  const handleAdminMenuOpen = (event) => {
    setAdminMenuAnchorEl(event.currentTarget);
  };
  
  const handleAdminMenuClose = () => {
    setAdminMenuAnchorEl(null);
  };
  
  const handleNavigate = (path) => {
    navigate(path);
    handleProfileMenuClose();
    handleAdminMenuClose();
    setMobileDrawerOpen(false);
  };
  
  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    handleAdminMenuClose();
    setMobileDrawerOpen(false);
  };
  
  const toggleMobileDrawer = (open) => () => {
    setMobileDrawerOpen(open);
  };

  const activeStyle = {
    fontWeight: 'bold',
    color: theme.palette.secondary.main
  };
  
  const mobileDrawer = (
    <Box
      onClick={toggleMobileDrawer(false)}
      sx={{ width: 250 }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" color="primary">Avani Mitra</Typography>
      </Box>
      <List>
        <ListItem button component={Link} to="/">
          <ListItemIcon><HomeIcon color="primary" /></ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
        <ListItem button component={Link} to="/about">
          <ListItemIcon><InfoIcon color="primary" /></ListItemIcon>
          <ListItemText primary="About Us" />
        </ListItem>

        {isAuthenticated ? (
          <>
            {user?.is_admin ? (
              <>
                <ListItem button onClick={() => handleNavigate('/admin-dashboard')}>
                  <ListItemIcon><AdminPanelSettingsIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Admin Dashboard" />
                </ListItem>
                <ListItem button onClick={() => handleNavigate('/admin/products')}>
                  <ListItemIcon><InventoryIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Manage Products" />
                </ListItem>
                <ListItem button onClick={() => handleNavigate('/admin/orders')}>
                  <ListItemIcon><HistoryIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Manage Orders" />
                </ListItem>
                <ListItem button onClick={() => handleNavigate('/admin/users')}>
                  <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Manage Users" />
                </ListItem>
                <ListItem button onClick={() => handleNavigate('/admin/payment-settings')}>
                  <ListItemIcon><SettingsIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Payment Settings" />
                </ListItem>
                <ListItem button onClick={() => handleNavigate('/admin/export-orders')}>
                  <ListItemIcon><InventoryIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Export Orders" />
                </ListItem>
              </>
            ) : (
              <>
                <ListItem button onClick={() => handleNavigate('/dashboard')}>
                  <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button onClick={() => handleNavigate('/cart')}>
                  <ListItemIcon>
                    <Badge badgeContent={cartItems.length} color="error">
                      <ShoppingCartIcon color="primary" />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText primary="Cart" />
                </ListItem>
                <ListItem button onClick={() => handleNavigate('/orders')}>
                  <ListItemIcon><HistoryIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Orders" />
                </ListItem>
                <ListItem button onClick={() => handleNavigate('/profile')}>
                  <ListItemIcon><SettingsIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Profile" />
                </ListItem>
              </>
            )}
            <Divider />
            <ListItem button onClick={handleLogout}>
              <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem button onClick={() => handleNavigate('/login')}>
              <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Login" />
            </ListItem>
            <ListItem button onClick={() => handleNavigate('/signup')}>
              <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
              <ListItemText primary="Sign Up" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );
  
  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo and title */}
          <Typography 
            variant="h6" 
            component={Link} 
            to="/"
            sx={{
              fontWeight: 'bold',
              color: 'white',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="Avani Mitra Logo"
              sx={{ 
                height: 40, 
                mr: 1,
                display: { xs: 'none', sm: 'block' }
              }}
            />
            Avani Mitra
          </Typography>
          
          {/* Mobile menu button */}
          {isMobile ? (
            <Box sx={{ ml: 'auto' }}>
              {isAuthenticated && !user?.is_admin && (
                <IconButton 
                  color="inherit" 
                  component={Link} 
                  to="/cart"
                  sx={{ mr: 1 }}
                >
                  <Badge badgeContent={cartItems.length} color="error">
                    <ShoppingCartIcon />
                  </Badge>
                </IconButton>
              )}
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleMobileDrawer(true)}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          ) : (
            // Desktop navigation
            <>
              {/* Nav links */}
              <Box sx={{ ml: 4, display: 'flex', flexGrow: 1 }}>
                <Button 
                  component={NavLink} 
                  to="/" 
                  sx={{ 
                    color: 'white', 
                    mx: 1,
                    '&.active': activeStyle 
                  }}
                >
                  Home
                </Button>
                <Button 
                  component={NavLink} 
                  to="/about" 
                  sx={{ 
                    color: 'white', 
                    mx: 1,
                    '&.active': activeStyle 
                  }}
                >
                  About
                </Button>
                {/* Add more navigation links as needed */}
              </Box>
              
              {/* Auth and user controls */}
              <Box display="flex" alignItems="center">
                {isAuthenticated ? (
                  user?.is_admin ? (
                    <>
                      <Tooltip title="Admin Menu">
                        <IconButton
                          color="inherit"
                          onClick={handleAdminMenuOpen}
                        >
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                            <AdminPanelSettingsIcon />
                          </Avatar>
                        </IconButton>
                      </Tooltip>
                      <Menu
                        anchorEl={adminMenuAnchorEl}
                        open={Boolean(adminMenuAnchorEl)}
                        onClose={handleAdminMenuClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                      >
                        <MenuItem onClick={() => handleNavigate('/admin-dashboard')}>
                          Dashboard
                        </MenuItem>
                        <MenuItem onClick={() => handleNavigate('/admin/products')}>
                          Manage Products
                        </MenuItem>
                        <MenuItem onClick={() => handleNavigate('/admin/orders')}>
                          Manage Orders
                        </MenuItem>
                        <MenuItem onClick={() => handleNavigate('/admin/users')}>
                          Manage Users
                        </MenuItem>
                        <MenuItem onClick={() => handleNavigate('/admin/custom-order')}>
                          Create Order
                        </MenuItem>
                        <MenuItem onClick={() => handleNavigate('/admin/payment-settings')}>
                          Payment Settings
                        </MenuItem>
                        <MenuItem onClick={() => handleNavigate('/admin/export-orders')}>
                          Export Orders
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>
                          <LogoutIcon fontSize="small" className="mr-2" />
                          Logout
                        </MenuItem>
                      </Menu>
                    </>
                  ) : (
                    <>
                      <Tooltip title="Cart">
                        <IconButton
                          color="inherit"
                          component={Link}
                          to="/cart"
                        >
                          <Badge badgeContent={cartItems.length} color="error">
                            <ShoppingCartIcon />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Account">
                        <IconButton
                          color="inherit"
                          onClick={handleProfileMenuOpen}
                          sx={{ ml: 2 }}
                        >
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                        </IconButton>
                      </Tooltip>
                      <Menu
                        anchorEl={profileAnchorEl}
                        open={Boolean(profileAnchorEl)}
                        onClose={handleProfileMenuClose}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                      >
                        <MenuItem onClick={() => handleNavigate('/dashboard')}>
                          Dashboard
                        </MenuItem>
                        <MenuItem onClick={() => handleNavigate('/profile')}>
                          Edit Profile
                        </MenuItem>
                        <MenuItem onClick={() => handleNavigate('/orders')}>
                          Order History
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>
                          <LogoutIcon fontSize="small" className="mr-2" />
                          Logout
                        </MenuItem>
                      </Menu>
                    </>
                  )
                ) : (
                  <Box>
                    <Button color="inherit" component={Link} to="/login">
                      Login
                    </Button>
                    <Button color="inherit" component={Link} to="/signup">
                      Sign Up
                    </Button>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Toolbar>
      </Container>
      
      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={toggleMobileDrawer(false)}
      >
        {mobileDrawer}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;