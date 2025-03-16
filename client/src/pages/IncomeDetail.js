import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  TrendingUp as IncomeIcon,
  DateRange as DateIcon,
  AttachMoney as MoneyIcon,
  Notes as NotesIcon,
  Repeat as RepeatIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const IncomeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [income, setIncome] = useState(null);

  useEffect(() => {
    const fetchIncome = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/incomes/${id}`);
        setIncome(response.data);
      } catch (err) {
        console.error('Error fetching income:', err);
        setError('Failed to load income details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchIncome();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this income entry?')) {
      try {
        await axios.delete(`/api/incomes/${id}`);
        navigate('/incomes');
      } catch (err) {
        console.error('Error deleting income:', err);
        alert('Failed to delete income. Please try again.');
      }
    }
  };

  const getRecurringFrequencyText = (frequency) => {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/incomes')}
          >
            Back to Income
          </Button>
        </Box>
      </Container>
    );
  }

  if (!income) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">Income not found.</Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/incomes')}
          >
            Back to Income
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/incomes')}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Typography variant="h5" component="h1">
              Income Details
            </Typography>
          </Box>
          <Box>
            <IconButton
              component={RouterLink}
              to={`/incomes/${id}/edit`}
              color="primary"
              sx={{ mr: 1 }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={handleDelete}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'success.main' }}>
              ${income.amount.toFixed(2)}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {income.source}
            </Typography>
            {income.isRecurring && (
              <Chip 
                label={`Recurring (${getRecurringFrequencyText(income.recurringFrequency)})`} 
                color="primary" 
                icon={<RepeatIcon />}
                sx={{ mb: 2 }}
              />
            )}
          </Grid>
          
          <Grid item xs={12}>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Date" 
                  secondary={format(new Date(income.date), 'MMMM dd, yyyy')}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
              
              <Divider component="li" />
              
              <ListItem>
                <ListItemText 
                  primary="Source" 
                  secondary={income.source}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
              
              <Divider component="li" />
              
              <ListItem>
                <ListItemText 
                  primary="Amount" 
                  secondary={`$${income.amount.toFixed(2)}`}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1', color: 'success.main', fontWeight: 'bold' }}
                />
              </ListItem>
              
              {income.description && (
                <>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary="Description" 
                      secondary={income.description}
                      primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                </>
              )}
              
              {income.isRecurring && (
                <>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary="Recurring" 
                      secondary={`Yes (${getRecurringFrequencyText(income.recurringFrequency)})`}
                      primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                </>
              )}
              
              {income.notes && (
                <>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary="Notes" 
                      secondary={income.notes}
                      primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                </>
              )}
              
              <Divider component="li" />
              
              <ListItem>
                <ListItemText 
                  primary="Created At" 
                  secondary={format(new Date(income.createdAt), 'MMMM dd, yyyy HH:mm')}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
              
              {income.updatedAt && income.updatedAt !== income.createdAt && (
                <>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary="Last Updated" 
                      secondary={format(new Date(income.updatedAt), 'MMMM dd, yyyy HH:mm')}
                      primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                </>
              )}
            </List>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/incomes')}
              >
                Back to Income
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                component={RouterLink}
                to={`/incomes/${id}/edit`}
                color="primary"
              >
                Edit Income
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default IncomeDetail; 