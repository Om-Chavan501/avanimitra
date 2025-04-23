import { Box, Container, Typography, Grid, Link as MuiLink, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box 
      component="footer" 
      sx={{ 
        bgcolor: 'background.paper', 
        py: 6, 
        mt: 'auto',
        boxShadow: '0px -2px 10px rgba(0,0,0,0.05)'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="primary" gutterBottom fontWeight="bold">
              Avani Mitra
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Savour the best farm harvests in India. Connecting farmers to consumers.
              Organic, Local and Fresh.
            </Typography>
            
            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <IconButton 
                component="a" 
                href="https://www.instagram.com/avanimitraorganics" 
                target="_blank"
                color="primary"
                sx={{ bgcolor: 'rgba(69, 182, 73, 0.1)' }}
              >
                <InstagramIcon />
              </IconButton>
              <IconButton 
                component="a" 
                href="https://wa.me/918390770254" 
                target="_blank"
                color="primary"
                sx={{ bgcolor: 'rgba(69, 182, 73, 0.1)' }}
              >
                <WhatsAppIcon />
              </IconButton>
              <IconButton 
                component="a" 
                href="tel:+918390770254" 
                color="primary"
                sx={{ bgcolor: 'rgba(69, 182, 73, 0.1)' }}
              >
                <PhoneIcon />
              </IconButton>
              <IconButton 
                component="a" 
                href="mailto:contact@avanimitra.com" 
                color="primary"
                sx={{ bgcolor: 'rgba(69, 182, 73, 0.1)' }}
              >
                <EmailIcon />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="primary" gutterBottom fontWeight="bold">
              Quick Links
            </Typography>
            <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
              <Box component="li" sx={{ mb: 1 }}>
                <MuiLink component={Link} to="/" color="inherit" underline="hover">
                  Home
                </MuiLink>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <MuiLink component={Link} to="/about" color="inherit" underline="hover">
                  About Us
                </MuiLink>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <MuiLink href="#products" color="inherit" underline="hover">
                  Products
                </MuiLink>
              </Box>
              {/* Add more links as needed */}
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="primary" gutterBottom fontWeight="bold">
              Contact
            </Typography>
            <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <EmailIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <MuiLink href="mailto:contact@avanimitra.com" color="inherit" underline="hover">
                  contact@avanimitra.com
                </MuiLink>
              </Box>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <WhatsAppIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <MuiLink href="https://wa.me/918390770254" color="inherit" underline="hover" target="_blank" rel="noopener noreferrer">
                  Chat on WhatsApp
                </MuiLink>
              </Box>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2">
                  +91 8390770254
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2">
                  Near MIT, Kothrud, Pune
                </Typography>
              </Box>
              <Box component="li" sx={{ display: 'flex', alignItems: 'center' }}>
                <InstagramIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                <MuiLink href="https://www.instagram.com/avanimitraorganics" color="inherit" underline="hover" target="_blank" rel="noopener noreferrer">
                  Follow us on Instagram
                </MuiLink>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" color="primary" gutterBottom fontWeight="bold">
              Team
            </Typography>
            <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  Atharva Datar
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  Om Chavan
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  Suresh Margale
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Box mt={5} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            &copy; {currentYear} Avani Mitra | All rights reserved.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Developed by Om Chavan
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;