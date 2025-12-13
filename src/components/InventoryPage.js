import React, { useState, useEffect, useMemo } from 'react';
import {
  AppBar, Toolbar, Typography, Container, TextField, IconButton, Card, CardContent,
  Grid, Box, CircularProgress, Fab, Dialog, DialogActions, DialogContent,
  DialogTitle, Button, Snackbar
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Clear as ClearIcon, Check as CheckIcon, Image as ImageIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

const InventoryPage = () => {
  const navigate = useNavigate();
  const { hotelName } = useParams(); // Get hotelName from URL
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // State for Adjust Stock Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [stockToAdd, setStockToAdd] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      if (!hotelName) {
        setError("Hotel name not provided in URL.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `https://api2.nextorbitals.in/api/get_menu.php?hotel_name=${hotelName}&menutype=ac`, {
            headers: { 'Content-Type': 'application/json' },
          }
        );
        if (response.ok) {
          const jsonData = await response.json();
          if (jsonData.data && Array.isArray(jsonData.data)) {
            // Add a unique id to each item for React keys
            const menuItems = jsonData.data.map((item, index) => ({ ...item, id: item.id || `${item.name}-${index}` }));
            setItems(menuItems);
          } else {
            setError("Menu data is not in the expected format.");
          }
        } else {
          setError(`HTTP Error: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        setError(`Failed to fetch menu: ${err.message}`);
        console.error("Error fetching menu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [hotelName]); // Re-run effect if hotelName changes

  const filteredItems = useMemo(() => {
    if (!searchQuery) {
      return items;
    }
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const handleOpenDialog = (e, item) => {
    // Stop the card's onClick from firing when the button is clicked.
    e.stopPropagation(); 

    setCurrentItem(item);
    setStockToAdd('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentItem(null);
  };

  const handleAdjustStock = () => {
    const addValue = parseInt(stockToAdd, 10);
    if (isNaN(addValue) || addValue <= 0) {
      setSnackbar({ open: true, message: 'Please enter a valid number.' });
      return;
    }

    // This is a simulation. In a real app, you would send this update to your backend.
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === currentItem.id
          ? { ...item, adjustStock: (item.adjustStock || 0) + addValue }
          : item
      )
    );

    setSnackbar({ open: true, message: `✅ Stock updated for ${currentItem.name}` });
    handleCloseDialog();
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Box sx={{ textAlign: 'center', mt: 4 }}><Typography color="error">{error}</Typography></Box>;
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="back" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          {isSearching ? (
            <TextField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              fullWidth
              placeholder="Search Items..."
              variant="standard"
              InputProps={{
                disableUnderline: true,
                style: { color: 'white', fontSize: 18 },
              }}
            />
          ) : (
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Inventory ({filteredItems.length})
            </Typography>
          )}
          {isSearching ? (
            <IconButton color="inherit" onClick={() => { setSearchQuery(''); setIsSearching(false); }}>
              <ClearIcon />
            </IconButton>
          ) : (
            <IconButton color="inherit" onClick={() => setIsSearching(true)}>
              <SearchIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 12 }}>
        {filteredItems.length === 0 ? (
          <Typography sx={{ textAlign: 'center', mt: 6 }}>
            {searchQuery ? 'No items match your search.' : 'No items found.'}
          </Typography>
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {filteredItems.map((item) => (
              <Grid item key={item.id}>
                <Card
                  sx={{ width: 350, display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer' }}
                  onClick={() => navigate(`/edit-item/${item.id}`, { state: { item } })}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', mb: 2 }}>
                       <Box sx={{ width: 60, height: 60, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2, borderRadius: 1 }}>
                          <ImageIcon color="disabled" />
                       </Box>
                      <Box sx={{ minWidth: 0 }}> {/* Allow this box to shrink and text to wrap */}
                        <Typography 
                          variant="h6" 
                          component="div" 
                          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, wordWrap: 'break-word', fontWeight: 'bold' }}
                        >
                          {item.submenu || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ wordWrap: 'break-word' }}>Barcode: {item.barCode || 'N/A'}</Typography>
                        {item.h_price > 0 && (
                          <Typography variant="body1">Half ₹ {item.h_price}</Typography>
                        )}
                          <Typography variant="body1">Full ₹ {item.f_price || 0}</Typography>
                      </Box>
                    </Box>
                    <Typography variant="h6">Current Stock: {item.adjustStock || 0}</Typography>
                  </CardContent>
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <Button variant="contained" size="small" onClick={(e) => handleOpenDialog(e, item)}>
                       Adjust Stock
                     </Button>
                     <CheckIcon color="success" />
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/add-item')}
      >
        <AddIcon />
      </Fab>

      {/* Adjust Stock Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Adjust Stock for {currentItem?.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Quantity to Add"
            type="number"
            fullWidth
            variant="outlined"
            value={stockToAdd}
            onChange={(e) => setStockToAdd(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') { handleAdjustStock(); } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAdjustStock} variant="contained">OK</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
};

export default InventoryPage;