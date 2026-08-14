import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  TextField,
  CircularProgress,
  Alert,
  Typography,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
} from '@mui/material';
import { businessAPI, categoryAPI } from '../utils/api';
import { Edit, Delete } from '@mui/icons-material';
import { isDiningCategory, getCategoryKind } from '../utils/catalog';

const emptyForm = {
  name: '',
  category: '',
  description: '',
  phone: '',
  address: '',
  openingHours: '',
  hasDelivery: false,
  deliveryPhone: '',
  starRating: '',
  serviceType: '',
  featured: false,
  menuName: 'Main Menu',
  menuDescription: '',
  menuType: 'image',
  menuLink: '',
};

const ManageBusinesses = () => {
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [menuQrFile, setMenuQrFile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bizRes, catRes] = await Promise.all([
        businessAPI.getAll({}),
        categoryAPI.getAll(),
      ]);
      setBusinesses(bizRes.data);
      setCategories(catRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (business = null) => {
    if (business) {
      const firstMenu = business.menus?.[0] || {};
      setFormData({
        ...emptyForm,
        name: business.name || '',
        category: business.category?._id || business.category || '',
        description: business.description || '',
        phone: business.phone || '',
        address: business.address || '',
        openingHours: business.openingHours || '',
        hasDelivery: Boolean(business.hasDelivery),
        deliveryPhone: business.deliveryPhone || '',
        starRating: business.starRating || '',
        serviceType: business.serviceType || '',
        featured: Boolean(business.featured),
        menuName: firstMenu.name || 'Main Menu',
        menuDescription: firstMenu.description || '',
        menuType: firstMenu.type || (firstMenu.link ? 'link' : 'image'),
        menuLink: firstMenu.link || '',
      });
      setLogoFile(null);
      setCoverFile(null);
      setMenuQrFile(null);
      setEditingId(business._id);
    } else {
      setFormData(emptyForm);
      setLogoFile(null);
      setCoverFile(null);
      setMenuQrFile(null);
      setEditingId(null);
    }
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const selectedCategory = categories.find((cat) => cat._id === formData.category);
  const categoryKind = getCategoryKind(selectedCategory?.name);
  const showMenuFields = isDiningCategory(selectedCategory?.name);

  const handleSubmit = async () => {
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('category', formData.category);
      payload.append('description', formData.description);
      payload.append('phone', formData.phone);
      payload.append('address', formData.address);

      payload.append('openingHours', formData.openingHours);
      payload.append('hasDelivery', formData.hasDelivery ? 'true' : 'false');
      payload.append('deliveryPhone', formData.deliveryPhone);
      payload.append('featured', formData.featured ? 'true' : 'false');
      payload.append('starRating', formData.starRating);
      payload.append('serviceType', formData.serviceType);

      if (logoFile) {
        payload.append('logo', logoFile);
      }
      if (coverFile) {
        payload.append('coverImage', coverFile);
      }

      if (showMenuFields) {
        payload.append('menuName', formData.menuName || 'Main Menu');
        payload.append('menuDescription', formData.menuDescription || '');
        payload.append('menuType', formData.menuType);

        if (formData.menuType === 'link' && formData.menuLink) {
          payload.append('menuLink', formData.menuLink);
        }

        if (formData.menuType === 'image' && menuQrFile) {
          payload.append('menuQrImage', menuQrFile);
        }
      }

      if (editingId) {
        await businessAPI.update(editingId, payload);
      } else {
        await businessAPI.create(payload);
      }
      fetchData();
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save business');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await businessAPI.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete business');
      }
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h2>Manage Businesses</h2>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          + Add Business
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {businesses.map((business) => (
              <TableRow key={business._id}>
                <TableCell>{business.name}</TableCell>
                <TableCell>{business.category?.name}</TableCell>
                <TableCell>{business.phone}</TableCell>
                <TableCell>{business.address}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => handleOpenDialog(business)}
                    startIcon={<Edit />}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(business._id)}
                    startIcon={<Delete />}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth scroll="paper">
        <Box sx={{ p: 2 }}>
          <h3>{editingId ? 'Edit Business' : 'Add Business'}</h3>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
          />
          <TextField
            select
            fullWidth
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Address / Location"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Opening hours"
            value={formData.openingHours}
            onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
            margin="normal"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              />
            }
            label="Featured on homepage"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.hasDelivery}
                onChange={(e) => setFormData({ ...formData, hasDelivery: e.target.checked })}
              />
            }
            label="Offers delivery"
          />
          {formData.hasDelivery && (
            <TextField
              fullWidth
              label="Delivery phone"
              value={formData.deliveryPhone}
              onChange={(e) => setFormData({ ...formData, deliveryPhone: e.target.value })}
              margin="normal"
            />
          )}

          {categoryKind === 'hotel' && (
            <TextField
              select
              fullWidth
              label="Hotel star rating"
              value={formData.starRating}
              onChange={(e) => setFormData({ ...formData, starRating: e.target.value })}
              margin="normal"
              SelectProps={{ native: true }}
            >
              <option value="">Select stars</option>
              {[1, 2, 3, 4, 5].map((star) => (
                <option key={star} value={star}>{star} star</option>
              ))}
            </TextField>
          )}

          {categoryKind === 'service' && (
            <TextField
              select
              fullWidth
              label="Service type"
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              margin="normal"
              SelectProps={{ native: true }}
            >
              <option value="">Select service</option>
              {['Electricity', 'Washing machines', 'Air conditioning', 'Plumbing', 'Laundry', 'Painting', 'Refrigerator repair'].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </TextField>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Logo (optional)
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Cover photo of Tyre / the place (optional)
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
          </Box>

          {showMenuFields && (
            <Box sx={{ mt: 3, border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Menu & QR (Restaurant / Coffee shop)
              </Typography>

              <TextField
                fullWidth
                label="Menu Name"
                value={formData.menuName}
                onChange={(e) => setFormData({ ...formData, menuName: e.target.value })}
                margin="normal"
              />

              <TextField
                fullWidth
                label="Menu Description"
                value={formData.menuDescription}
                onChange={(e) => setFormData({ ...formData, menuDescription: e.target.value })}
                margin="normal"
              />

              <RadioGroup
                row
                value={formData.menuType}
                onChange={(e) => setFormData({ ...formData, menuType: e.target.value })}
              >
                <FormControlLabel value="image" control={<Radio />} label="QR Code Image" />
                <FormControlLabel value="link" control={<Radio />} label="Menu Link" />
              </RadioGroup>

              {formData.menuType === 'link' ? (
                <TextField
                  fullWidth
                  label="Menu Link"
                  value={formData.menuLink}
                  onChange={(e) => setFormData({ ...formData, menuLink: e.target.value })}
                  margin="normal"
                  placeholder="https://..."
                />
              ) : (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Upload QR Code Image
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setMenuQrFile(e.target.files?.[0] || null)}
                  />
                </Box>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button variant="contained" onClick={handleSubmit}>
              Save
            </Button>
            <Button onClick={handleCloseDialog}>Cancel</Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ManageBusinesses;
