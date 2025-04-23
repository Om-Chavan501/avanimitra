// frontend/src/components/SurveyPopup.jsx
import { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogTitle, IconButton, Button,
  Box, Typography, Slide, DialogActions
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const Transition = (props) => {
  return <Slide direction="up" {...props} />;
};

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    padding: theme.spacing(2),
    maxWidth: '600px',
    width: '90%',
    margin: '32px auto 0',
  },
}));

const SurveyPopup = ({ open, onClose }) => {
  const navigate = useNavigate();
  
  const handleSurveyClick = () => {
    navigate('/survey');
    onClose();
  };

  const handleLaterClick = () => {
    localStorage.setItem('surveyLater', Date.now());
    onClose();
  };
  
  return (
    <StyledDialog
      open={open}
      TransitionComponent={Transition}
      onClose={onClose}
      aria-labelledby="survey-popup-title"
    >
      <Box sx={{ position: 'relative' }}>
        <DialogTitle id="survey-popup-title" sx={{ textAlign: 'center', fontSize: '1.5rem' }}>
          Help Us Serve You Better!
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      <DialogContent>
        <Typography variant="body1" paragraph align="center">
          We want to expand our organic product lineup beyond seasonal offerings!
        </Typography>
        <Typography variant="body1" paragraph align="center">
          Would you take a quick 2-minute survey to tell us which organic products you'd like to buy year-round?
        </Typography>
        <Box
          sx={{
            backgroundColor: (theme) => theme.palette.background.paper,
            borderRadius: 2,
            p: 1.5,
            my: 2,
            border: '1px solid #e0e0e0'
          }}
        >
          <Typography variant="body2" color="textSecondary" align="center">
            Your feedback will help us bring you the organic products you actually want! 🌱
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2, flexDirection: {xs: 'column', sm: 'row'} }}>
        <Button 
          onClick={handleSurveyClick}
          variant="contained" 
          color="primary"
          fullWidth={window.innerWidth < 600}
          sx={{ minWidth: 120 }}
        >
          Take Survey
        </Button>
        <Button 
          onClick={handleLaterClick} 
          variant="outlined"
          fullWidth={window.innerWidth < 600}
        >
          Remind Me Later
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default SurveyPopup;