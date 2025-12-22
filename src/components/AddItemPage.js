import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Container, Box, TextField, Button, Typography, Paper, Grid,
  AppBar, Toolbar, IconButton, Accordion, AccordionSummary, AccordionDetails,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, ExpandMore as ExpandMoreIcon, AddPhotoAlternate as AddPhotoAlternateIcon } from '@mui/icons-material';
import { fetchMenu } from '../api';

const AddItemPage = () => {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const location = useLocation();
  const hotelName = location.state?.hotelName;
  const lastid = location.state?.lastid;
  console.log("name",hotelName,"lastid",lastid );
  const isEditing = Boolean(itemId);

  const [formState, setFormState] = useState({
    name: '',
    h_price: '',
    f_price: '',
    category: '',
    mrp: '',
    purchasePrice: '',
    acSellPrice: '',
    acSellPriceHalf: '',
    hsnCode: '',
    itemCode: '',
    barCode: '',
    adjustStock: '',
    nonAcPrice: '',
    nonAcPriceHalf: '',
    onlinePrice: '',
    onlinePriceHalf: '',
    parcelPrice: '',
    parcelPriceHalf: '',
    description: '',
    available: '1', // Default to 1 (Available)
    itemvnv: '1',   // Default to 1 (Veg)
    gst: '',
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // State for categories and the add category dialog
  const [categories, setCategories] = useState([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (isEditing && location.state?.item) {
      const item = location.state.item;
      console.log("item",item);
      setFormState({
        name: item.submenu || '',
        submenu: item.submenu || '',
        h_price: item.h_price || '',
        f_price: item.f_price || '',
        category: item.menu || '',
        mrp: item.mrp || '',
        purchasePrice: item.purchaseprice || '',
        acSellPrice: item.ac_price || '',
        acSellPriceHalf: item.ac_price_half || '',
        hsnCode: item.hsnCode || '',
        itemCode: item.id || '',
        barCode: item.barCode || '',
        adjustStock: item.adjustStock || '0',
        nonAcPrice: item.nonac_price || '',
        nonAcPriceHalf: item.nonac_price_half || '',
        onlinePrice: item.online_price || '',
        onlinePriceHalf: item.online_price_half || '',
        parcelPrice: item.parcel_price || '',
        parcelPriceHalf: item.parcel_price_half || '',
        description: item.description || '',
        available: String(item.available ?? '1'),
        itemvnv: String(item.itemvnv ?? '1'),
        gst: String(item.gst || ''),
      });
      // In a real app, you would also handle loading the image URL
    }
  }, [isEditing, location.state]);

  useEffect(() => {
    const loadCategories = async () => {
      if (hotelName) { // Use hotelName from component scope
        try {
          const menuItems = await fetchMenu(hotelName);
          if (menuItems && menuItems.length > 0) {
            const uniqueCategories = [...new Set(menuItems.map(item => item.menu).filter(Boolean))];
            setCategories(uniqueCategories.sort());
          }
        } catch (error) {
          console.error("Failed to load categories:", error);
          setSnackbar({ open: true, message: 'Could not load categories.' });
        }
      }
    };
    loadCategories();
  }, [hotelName]); // Depend on hotelName

  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCategoryChange = (e) => {
    const { value } = e.target;
    if (value === 'add_new_category') {
      setNewCategory('');
      setCategoryDialogOpen(true);
    } else {
      handleInputChange(e);
    }
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
  };

  const handleAddNewCategory = () => {
    const newCategoryTrimmed = newCategory.trim();
    if (newCategoryTrimmed && !categories.includes(newCategoryTrimmed)) {
      setCategories(prev => [...prev, newCategoryTrimmed].sort());
      setFormState(prev => ({ ...prev, category: newCategoryTrimmed }));
    }
    handleCloseCategoryDialog();
  };

  const handleSave = async () => {
    if (!hotelName) {
      setSnackbar({ open: true, message: '❌ Hotel name not found. Cannot save.' });
      return;
    }

    try {
      const payload = {
        hotel_name: hotelName,
        menuItems: [
          {
            id: formState.itemCode || itemId || `item_${Date.now()}`,
            menu: formState.category,
            submenu: formState.name,

            h_price: Number(formState.h_price || 0),
            f_price: Number(formState.f_price || 0),

            ac_price: Number(formState.acSellPrice || 0),
            ac_price_half: Number(formState.acSellPriceHalf || 0),
            
            nonac_price: Number(formState.nonAcPrice || 0),
            nonac_price_half: Number(formState.nonAcPriceHalf || 0),
            online_price: Number(formState.onlinePrice || 0),
            online_price_half: Number(formState.onlinePriceHalf || 0),
            parcel_price: Number(formState.parcelPrice || 0),
            parcel_price_half: Number(formState.parcelPriceHalf || 0),

            purchaseprice: Number(formState.purchasePrice || 0),
            mrp: Number(formState.mrp || 0),

            stock: String(formState.adjustStock || 0), // 🔒 keep as string
            available: Number(formState.available),
            itemvnv: Number(formState.itemvnv),
            description: formState.description || '',
            gst: Number(formState.gst || 0),

          }
        ]
      };
      console.log("payload in add item page",payload);
      const response = await fetch(
        'https://api2.nextorbitals.in/api/add_item.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Save failed');
      }

      // Update localStorage
      const localStorageKey = `menu_${hotelName}`;
      const storedMenuItems = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
      const newItem = payload.menuItems[0];
      const itemIndex = storedMenuItems.findIndex(item => item.id === newItem.id);

      let updatedMenuItems;
      if (itemIndex > -1) {
        // Item exists, update it by merging new data
        storedMenuItems[itemIndex] = { ...storedMenuItems[itemIndex], ...newItem };
        updatedMenuItems = storedMenuItems;
      } else {
        // New item, add it to the beginning of the list
        updatedMenuItems = [newItem, ...storedMenuItems];
      }

      localStorage.setItem(localStorageKey, JSON.stringify(updatedMenuItems));

      setSnackbar({
        open: true,
        message: `✅ Item ${isEditing ? 'updated' : 'saved'} successfully`
      });

      // Navigate back and signal that the list was updated
      setTimeout(() => navigate(`/inventory/${hotelName}`, { state: { itemUpdated: true } }), 1200);

    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: `❌ ${err.message}`
      });
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {isEditing ? 'Edit Item' : 'Add New Item'}
          </Typography>
          <Button color="inherit" onClick={handleSave}>Save</Button>
        </Toolbar>
      </AppBar>

      <Container component={Paper} sx={{ p: 3, mt: 3, mb: 3 }} maxWidth="md">
        <Grid container spacing={3}>
          {/* Image Upload */}
          <Grid item xs={12}>
            <Box
              sx={{
                border: '2px dashed grey',
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                height: 150,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                backgroundImage: imagePreview ? `url(${imagePreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              component="label"
              htmlFor="image-upload"
            >
              {!imagePreview && (
                <>
                  <AddPhotoAlternateIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                  <Typography>Upload Item Image</Typography>
                </>
              )}
              <input id="image-upload" type="file" accept="image/*" hidden onChange={handleImageChange} />
            </Box>
          </Grid>

          {/* Main Fields */}
          <Grid item xs={12}>
            <TextField
              name="name"
              label="Product/Service Name"
              value={formState.name}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Grid>
          {/* <Grid item xs={12}>
            <TextField
              name="name"
              label="Product/Service Name"
              value={formState.MenuItem}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Grid> */}
          <Grid item xs={12} sm={6}>
            <TextField
              name="h_price"
              label="Half Price"
              value={formState.h_price}
              onChange={handleInputChange}
              type="number"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="f_price"
              label="Full Price"
              value={formState.f_price}
              onChange={handleInputChange}
              type="number"
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formState.category}
                label="Category"
                onChange={handleCategoryChange}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
                <MenuItem value="add_new_category" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  + Add New Category
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
            <Grid item xs={12} sm={6}>
            <TextField
              name="mrp"
              label="MRP"
              value={formState.mrp}
              onChange={handleInputChange}
              type="number"
              fullWidth
              required
            />
          </Grid>
            <Grid item xs={12} sm={6}>
            <TextField
              name="purchasePrice"
              label="Purchase Price"
              value={formState.purchasePrice}
              onChange={handleInputChange}
              type="number"
              fullWidth
              required
            />
          </Grid>

          {/* Optional Sections */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Product Details (Optional)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField name="hsnCode" label="HSN/SAC Code" value={formState.hsnCode} onChange={handleInputChange} fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="itemCode" label="Item Code/SKU" value={formState.itemCode} onChange={handleInputChange} fullWidth />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField name="barCode" label="Barcode" value={formState.barCode} onChange={handleInputChange} fullWidth />
                  </Grid>
                    <Grid item xs={12}>
                    <TextField name="gst" label="gst" value={formState.gst} onChange={handleInputChange} fullWidth />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Inventory Details (Optional)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="adjustStock"
                      label="Opening Stock"
                      value={formState.adjustStock}
                      onChange={handleInputChange}
                      type="number"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Availability</InputLabel>
                      <Select name="available" value={formState.available} label="Availability" onChange={handleInputChange}>
                        <MenuItem value="1">Available</MenuItem>
                        <MenuItem value="0">Not Available</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Type</InputLabel>
                      <Select name="itemvnv" value={formState.itemvnv} label="Type" onChange={handleInputChange}>
                        <MenuItem value="1">Veg</MenuItem>
                        <MenuItem value="2">Non-Veg</MenuItem>
                        <MenuItem value="3">Contains Egg</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="description" label="Description" value={formState.description}
                      onChange={handleInputChange} fullWidth multiline rows={2}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Alternate Prices (Optional)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField name="acSellPrice" label="AC Price (Full)" value={formState.acSellPrice} onChange={handleInputChange} fullWidth type="number" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="acSellPriceHalf" label="AC Price (Half)" value={formState.acSellPriceHalf} onChange={handleInputChange} fullWidth type="number" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="nonAcPrice" label="Non-AC Price (Full)" value={formState.nonAcPrice} onChange={handleInputChange} fullWidth type="number" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="nonAcPriceHalf" label="Non-AC Price (Half)" value={formState.nonAcPriceHalf} onChange={handleInputChange} fullWidth type="number" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="onlinePrice" label="Online Price (Full)" value={formState.onlinePrice} onChange={handleInputChange} fullWidth type="number" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="onlinePriceHalf" label="Online Price (Half)" value={formState.onlinePriceHalf} onChange={handleInputChange} fullWidth type="number" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="parcelPrice" label="Parcel Price (Full)" value={formState.parcelPrice} onChange={handleInputChange} fullWidth type="number" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField name="parcelPriceHalf" label="Parcel Price (Half)" value={formState.parcelPriceHalf} onChange={handleInputChange} fullWidth type="number" />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </Container>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Add New Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={handleCloseCategoryDialog}>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') { handleAddNewCategory(); } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoryDialog}>Cancel</Button>
          <Button onClick={handleAddNewCategory} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};


export default AddItemPage;