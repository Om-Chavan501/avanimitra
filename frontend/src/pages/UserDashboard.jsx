import { Container, Typography, Paper, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserDashboard = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="md">
      <Paper elevation={3} className="p-6 my-8">
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.name}
        </Typography>
        
        <Typography variant="body1" paragraph>
          Thank you for shopping with Avanimitra Organics.
        </Typography>
        
        <Box className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Paper className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
            <Typography variant="h6" gutterBottom>
              Your Orders
            </Typography>
            <Typography variant="body2" paragraph>
              View your order history and track active orders.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              component={Link}
              to="/orders"
            >
              View Orders
            </Button>
          </Paper>
          
          <Paper className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
            <Typography variant="h6" gutterBottom>
              Your Profile
            </Typography>
            <Typography variant="body2" paragraph>
              Update your personal information and address.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              component={Link}
              to="/profile"
            >
              Edit Profile
            </Button>
          </Paper>
          
          <Paper className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
            <Typography variant="h6" gutterBottom>
              Your Cart
            </Typography>
            <Typography variant="body2" paragraph>
              View items in your cart and proceed to checkout.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              component={Link}
              to="/cart"
            >
              Go to Cart
            </Button>
          </Paper>
          
          <Paper className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
            <Typography variant="h6" gutterBottom>
              Shop Products
            </Typography>
            <Typography variant="body2" paragraph>
              Browse our selection of fresh organic fruits.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              component={Link}
              to="/"
            >
              Shop Now
            </Button>
          </Paper>
        </Box>
        
        <Box className="mt-6">
          <Typography variant="h6" gutterBottom>
            Your Account Information:
          </Typography>
          <Paper className="p-4 bg-gray-50">
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Typography variant="subtitle2" color="textSecondary">Name:</Typography>
                <Typography variant="body1">{user?.name}</Typography>
              </div>
              <div>
                <Typography variant="subtitle2" color="textSecondary">Phone:</Typography>
                <Typography variant="body1">+91 {user?.phone}</Typography>
              </div>
              <div className="md:col-span-2">
                <Typography variant="subtitle2" color="textSecondary">Address:</Typography>
                <Typography variant="body1">{user?.address}</Typography>
              </div>
            </Box>
          </Paper>
        </Box>
      </Paper>
    </Container>
  );
};

export default UserDashboard;
