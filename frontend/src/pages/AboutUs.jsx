import { Container, Typography, Box, Grid, Avatar, Card, CardContent, CardMedia } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(8, 0),
}));

const TeamMemberCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-10px)',
  },
}));

const AboutUs = () => {
  const team = [
    {
      name: 'Atharva Datar',
      role: 'Co-founder',
      bio: "Volunteer at Jnana Prabodhini's Youth Wing. Member of Jnana Prabodhini's Atal Community Innovation Center, Nigdi",
      phone: '+91 9764814452',
      image: '/profile_icon.png'
    },
    {
      name: 'Om Chavan',
      role: 'Co-founder',
      bio: "Volunteer at Jnana Prabodhini's Youth Wing. Intern at KPIT Technologies",
      phone: '+91 8390770254',
      image: '/om_chavan.jpeg'
    },
    {
      name: 'Suresh Margale',
      role: 'Co-founder',
      bio: "Volunteer at Jnana Prabodhini's Youth Wing. Full time member of Jnana Prabodhini Harali.",
      phone: '+91 9145740750',
      image: '/profile_icon_2.png'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main',
          color: 'white',
          py: 10,
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" align="center" gutterBottom>
            About Avani Mitra
          </Typography>
          <Typography variant="h5" align="center">
            Growing Better Food for a Better Tomorrow
          </Typography>
        </Container>
      </Box>

      {/* Our Story */}
      {/* <StyledSection>
        <Container>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box 
                component="img"
                src="/organic_farm.jpeg"
                alt="Organic Farm"
                sx={{ 
                  width: '100%', 
                  borderRadius: 2,
                  boxShadow: 3
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h3" gutterBottom>
                Our Story
              </Typography>
              <Typography variant="body1" paragraph>
                Avani Mitra began with a simple idea: to reconnect people with the food they eat. Founded in 2020, we set out to create a sustainable ecosystem where farmers could thrive while providing consumers with the freshest, most nutritious produce possible.
              </Typography>
              <Typography variant="body1">
                What started as a small community-supported agriculture project has now grown into a network of over 50 partner farms across the region. We're proud to say that every fruit and vegetable in our catalog is grown without harmful chemicals, preserving both your health and the environment.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </StyledSection> */}

      {/* Our Mission */}
      {/* <StyledSection sx={{ bgcolor: 'background.paper' }}>
        <Container>
          <Typography variant="h3" align="center" gutterBottom>
            Our Mission
          </Typography>
          <Typography variant="body1" align="center" paragraph sx={{ maxWidth: 800, mx: 'auto', mb: 6 }}>
            To create a sustainable food system that benefits farmers, consumers, and the planet by promoting organic farming practices and making fresh, healthy produce accessible to all.
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: 'secondary.main',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  🌱
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  Sustainability
                </Typography>
                <Typography variant="body2">
                  We're committed to farming practices that nurture the soil, conserve water, and protect biodiversity.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: 'secondary.main',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  🧑‍🌾
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  Farmer Support
                </Typography>
                <Typography variant="body2">
                  We ensure our farmers receive fair compensation for their hard work and dedication to organic methods.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: 'secondary.main',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  🍎
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  Quality Produce
                </Typography>
                <Typography variant="body2">
                  We never compromise on the quality of our produce, ensuring you get the best nature has to offer.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </StyledSection> */}

      {/* Meet The Team */}
      <StyledSection>
        <Container>
          <Typography variant="h3" align="center" gutterBottom>
            Meet Our Team
          </Typography>
          <Typography variant="body1" align="center" paragraph sx={{ maxWidth: 800, mx: 'auto', mb: 6 }}>
            The passionate individuals behind Avani Mitra who work to bring you the best organic produce.
          </Typography>
          
          <Grid container spacing={4}>
            {team.map((member, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <TeamMemberCard>
                  <CardMedia
                    component="img"
                    height="260"
                    image={member.image}
                    alt={member.name}
                    sx={{
                      borderRadius: '50%',
                      overflow: 'hidden',
                    }}
                  />
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      {member.name}
                    </Typography>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      {member.role}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {member.bio}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Contact: {member.phone}
                    </Typography>
                  </CardContent>
                </TeamMemberCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </StyledSection>

      {/* Values */}
      {/* <StyledSection sx={{ bgcolor: 'background.paper' }}>
        <Container>
          <Typography variant="h3" align="center" gutterBottom>
            Our Values
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom>
                Transparency
              </Typography>
              <Typography variant="body1" paragraph>
                We believe in complete transparency about where your food comes from and how it's grown. That's why we provide detailed information about each of our partner farms and their growing practices.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom>
                Environmental Stewardship
              </Typography>
              <Typography variant="body1" paragraph>
                We're committed to practices that protect and enhance the environment, from sustainable farming methods to eco-friendly packaging.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom>
                Community Building
              </Typography>
              <Typography variant="body1" paragraph>
                We aim to strengthen the connections between farmers, consumers, and everyone involved in the food system, creating a community centered around good food.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom>
                Accessibility
              </Typography>
              <Typography variant="body1" paragraph>
                We believe everyone deserves access to fresh, healthy food, which is why we work to make our products as accessible and affordable as possible.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </StyledSection> */}
    </Box>
  );
};

export default AboutUs;