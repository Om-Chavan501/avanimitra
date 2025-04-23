import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManagement from './pages/admin/ProductManagement';
import UserManagement from './pages/admin/UserManagement';
import OrderManagement from './pages/admin/OrderManagement';
import CustomOrder from './pages/admin/CustomOrder';
import UserDashboard from './pages/UserDashboard';
import Cart from './pages/Cart';
import OrderHistory from './pages/OrderHistory';
import OrderDetails from './pages/OrderDetails';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import PaymentOptions from './pages/PaymentOptions';
import AboutUs from './pages/AboutUs';
import PaymentSettings from './pages/admin/PaymentSettings';
import OrderExport from './pages/admin/OrderExport';
import Survey from './pages/Survey';
import SurveyManagement from './pages/admin/SurveyManagement';


// Protected Route wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !user?.is_admin) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/survey" element={<Survey />} />
            
            {/* Admin routes */}
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/products" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <ProductManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/orders" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <OrderManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/custom-order" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <CustomOrder />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/payment-settings" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <PaymentSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/export-orders" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <OrderExport />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/survey" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <SurveyManagement />
                </ProtectedRoute>
              } 
            />
            
            {/* User routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cart" 
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/orders/:orderId" 
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment-options" 
              element={
                <ProtectedRoute>
                  <PaymentOptions />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;