// src/pages/Home.jsx
import { useState, useEffect, useRef } from 'react';
import { 
  Container, Typography, Box, Grid, CircularProgress, 
  Paper, Button, Card, CardMedia, CardContent, useTheme,
  Tabs, Tab, Avatar
} from '@mui/material';
import ProductCard from '../components/ProductCard';
import SurveyPopup from '../components/SurveyPopup';
import api from '../utils/api';
import heroImage from '../assets/hero-bg.jpg';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { styled } from '@mui/material/styles';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

const StyledHeroBox = styled(Box)(({ theme }) => ({
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${heroImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  minHeight: '70vh',
  display: 'flex',
  alignItems: 'center',
  position: 'relative'
}));

const Home = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const productsRef = useRef(null);
  const [tabValue, setTabValue] = useState(0);
  const [showSurveyPopup, setShowSurveyPopup] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setAllProducts(response.data);
      } catch (error) {
        setError('Failed to fetch products. Please try again later.');
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Add this effect for survey popup logic
  useEffect(() => {
    // Check if the survey popup has been shown recently or dismissed
    const surveyLater = localStorage.getItem('surveyLater');
    const surveyShown = localStorage.getItem('surveyShown');
    
    // If it was dismissed with "Later", don't show for 24 hours
    if (surveyLater) {
      const laterTime = parseInt(surveyLater);
      const hoursPassed = (Date.now() - laterTime) / (1000 * 60 * 60);
      
      if (hoursPassed < 0.001) {
        return; // Don't show
      }
    }
    
    // If never shown or shown more than 3 days ago
    if (!surveyShown || (Date.now() - parseInt(surveyShown)) > (3 * 24 * 60 * 60 * 1000)) {
      // Set a small delay to show the popup
      const timer = setTimeout(() => {
        setShowSurveyPopup(true);
        localStorage.setItem('surveyShown', Date.now().toString());
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Add this handler
  const handleCloseSurveyPopup = () => {
    setShowSurveyPopup(false);
  };

  // Separate seasonal and regular products
  const seasonalProducts = allProducts.filter(product => product.is_seasonal);
  const regularProducts = allProducts.filter(product => !product.is_seasonal);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const scrollToProducts = () => {
    if (productsRef.current) {
      productsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const displayProducts = tabValue === 0 ? seasonalProducts : regularProducts;

  // // Testimonials data
  // const testimonials = [
  //   {
  //     id: 1,
  //     name: "Meera Sharma",
  //     role: "Regular Customer",
  //     content: "I've been ordering mangoes from Avani Mitra for two seasons now, and the quality is outstanding. The taste is exactly what I remember from my childhood - sweet, juicy, and full of flavor!",
  //     avatar: "MS"
  //   },
  //   {
  //     id: 2,
  //     name: "Raj Patel",
  //     role: "Loyal Customer",
  //     content: "The organic products from Avani Mitra have transformed our family's diet. The freshness is unmatched, and knowing these come directly from farmers makes me even happier to support them.",
  //     avatar: "RP"
  //   },
  //   {
  //     id: 3,
  //     name: "Anjali Desai",
  //     role: "Food Enthusiast",
  //     content: "Their seasonal mangoes are the highlight of summer! Delivery was prompt, and the fruit was perfectly ripened. Will definitely order again next season!",
  //     avatar: "AD"
  //   }
  // ];

  return (
    <div>
      {/* Hero Section */}
      <StyledHeroBox>
        <Container maxWidth="md">
          <Typography 
            variant="h1" 
            component="h1" 
            align="center" 
            className="font-bold mb-4 text-white"
            sx={{ fontSize: { xs: '2.5rem', md: '4rem' } }}
          >
            Avani Mitra
          </Typography>
          <Typography 
            variant="h4" 
            component="p" 
            align="center"
            className="mb-6 text-white"
            sx={{ fontSize: { xs: '1.2rem', md: '1.8rem' } }}
          >
            Savour the best farm harvests in India
          </Typography>
          <Typography 
            variant="body1" 
            align="center" 
            className="mx-auto text-white"
            sx={{ fontSize: { xs: '1rem', md: '1.1rem' }, maxWidth: '800px' }}
          >
            Connecting farmers to consumers. Organic, Local and Fresh.
            We deliver seasonal fruits, staple lentils and value added products to make your daily meals wholesome and flavorful.
          </Typography>
          <Box className="flex justify-center mt-8">
            <Button 
              variant="contained" 
              size="large" 
              color="secondary"
              onClick={scrollToProducts}
              endIcon={<ShoppingCartIcon />}
              sx={{
                fontWeight: 'bold',
                px: 4,
                py: 1.5
              }}
            >
              Shop Now
            </Button>
          </Box>
        </Container>
      </StyledHeroBox>

      {/* Products Section */}
      <Box 
        ref={productsRef}
        sx={{
          py: 8,
          px: 2,
          bgcolor: theme.palette.background.default,
          scrollMarginTop: '100px' // For smooth scrolling offset
        }}
        id="products"
      >
        <Container maxWidth="xl">
        <Box className="flex flex-col md:flex-row justify-between items-center md:items-end mb-6">
          <Box className="mb-4 md:mb-0">
            <Typography variant="h3" component="h2" gutterBottom>
              Our Organic Products
            </Typography>
            <Typography variant="body1" paragraph>
              All the fruits and veggies are grown without chemical pesticides and fertilisers,
              ensuring you get the healthiest, most flavorful produce possible.
            </Typography>
            {/* Add this line to add survey CTA below products title */}
            <Box sx={{ textAlign: 'left', mb: 3 }}>
              <Button 
                variant="outlined" 
                color="primary"
                component={Link}
                to="/survey"
                sx={{ borderRadius: 4 }}
              >
                Help us bring more organic products! Fill our quick survey →
              </Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Button 
              variant="contained" 
              color="primary"
              component={Link}
              to={isAuthenticated ? "/cart" : "/login"}
              endIcon={<ShoppingCartIcon />}
              className="mb-4 md:mb-0 md:ml-4"
            >
              View Cart
            </Button>
            <Typography 
              variant="body2" 
              sx={{
                mt: 1, 
                textAlign: { xs: 'center', md: 'center' }, 
                fontStyle: 'italic', 
                color: '#ff7777', 
                maxWidth: { md: 300 }, 
              }}
            >
              For home delivery, charges at actual cost will be communicated during delivery
            </Typography>
          </Box>
        </Box>


          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="product categories">
              <Tab label="Seasonal Mangoes" />
              <Tab label="Regular Products" />
            </Tabs>
          </Box>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Paper className="p-4 text-center text-red-500">
              {error}
            </Paper>
          ) : (
            <>
              {displayProducts.length === 0 ? (
                <Paper className="p-8 text-center">
                  <Typography variant="h6" color="textSecondary">
                    {tabValue === 0 ? "No seasonal products available at the moment" : "No regular products available"}
                  </Typography>
                </Paper>
              ) : (
                <Box className="overflow-x-auto pb-4" sx={{ overflowY: 'hidden' }}>
                  <Box sx={{ 
                    display: 'flex',
                    flexWrap: { xs: 'nowrap', md: 'wrap' },
                    gap: 3,
                    width: { xs: 'max-content', md: '100%' }
                  }}>
                    {displayProducts.map((product) => (
                      <Box 
                        key={product.id} 
                        sx={{ 
                          width: { xs: '280px', sm: '300px', md: 'calc(33.333% - 16px)', lg: 'calc(25% - 16px)' },
                          minWidth: { xs: '280px', sm: '300px', md: '0' }
                        }}
                      >
                        <ProductCard product={product} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Container>
      </Box>

      {/* Testimonials Section
      <Box sx={{ 
        py: 8, 
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 128, 0, 0.05)'
      }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            align="center" 
            gutterBottom
            sx={{ mb: 5 }}
          >
            What Our Customers Say
          </Typography>
          
          <Grid container spacing={4}>
            {testimonials.map((testimonial) => (
              <Grid item xs={12} md={4} key={testimonial.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  p: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  borderRadius: 2
                }}>
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      {testimonial.avatar}
                    </Avatar>
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="h6">{testimonial.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{testimonial.role}</Typography>
                    </Box>
                  </Box>
                  <FormatQuoteIcon 
                    sx={{ 
                      fontSize: 30, 
                      color: theme.palette.primary.light,
                      mb: 1
                    }} 
                  />
                  <Typography variant="body1" sx={{ flexGrow: 1 }}>
                    {testimonial.content}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box> */}

      {/* Contact Section */}
      <Box sx={{ 
        py: 8, 
        background: 'linear-gradient(135deg, #DCE35B 0%, #45B649 100%)',
        color: 'text.primary'
      }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" align="center" gutterBottom>
            Contact Us
          </Typography>
          <Grid container spacing={4} justifyContent="center" className="mt-4">
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                <WhatsAppIcon sx={{ fontSize: 50, color: '#25D366', mb: 2 }} />
                <Typography variant="h6" gutterBottom>WhatsApp</Typography>
                <Button 
                  variant="outlined" 
                  href="https://wa.me/918390770254" 
                  target="_blank"
                  sx={{ mt: 2 }}
                >
                  Chat with us
                </Button>
                <Typography variant="body2" color="text.secondary" className="mt-2">
                  +91 8390770254
                </Typography>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                <PhoneIcon sx={{ fontSize: 50, color: theme.palette.primary.main, mb: 2 }} />
                <Typography variant="h6" gutterBottom>Call Us</Typography>
                <Button 
                  variant="outlined" 
                  href="tel:+918390770254"
                  sx={{ mt: 2 }}
                >
                  Make a call
                </Button>
                <Typography variant="body2" color="text.secondary" className="mt-2">
                  +91 8390770254
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* About Section */}
      <Box sx={{ 
        py: 8, 
        bgcolor: theme.palette.background.default
      }} id="about">
        <Container maxWidth="md">
          <Typography variant="h3" component="h2" align="center" gutterBottom>
            About Avani Mitra
          </Typography>
          
          <Box className="mt-8 text-center">
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              component={Link}
              to="/about"
            >
              Learn More About Us
            </Button>
          </Box>
        </Container>
      </Box>
      <SurveyPopup open={showSurveyPopup} onClose={handleCloseSurveyPopup} />
    </div>
  );
};

export default Home;