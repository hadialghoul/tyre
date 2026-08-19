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
  Chip,
  Stack,
} from '@mui/material';
import { businessAPI, categoryAPI, resolveMediaUrl } from '../utils/api';
import { Edit, Delete, OpenInNew } from '@mui/icons-material';
import { Link, useSearchParams } from 'react-router-dom';
import { isDiningCategory, getCategoryKind } from '../utils/catalog';
import { filterDeleted, rememberDeleted, getDeletedIds, getDeletedNames } from '../utils/deleted';
import { fileToLogoImage, isPdfFile } from '../utils/pdfLogo';
import CategoryIcon from '../components/CategoryIcon';

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
  secondName: '',
  menuName: 'Main Menu',
  menuDescription: '',
  menuType: 'image',
  menuLink: '',
};

const logoThumbSx = {
  width: 56,
  height: 56,
  objectFit: 'contain',
  display: 'block',
  mb: 1,
  bgcolor: '#fff',
  border: '1px solid #eee',
};

const ManageBusinesses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [logo2File, setLogo2File] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logo2Preview, setLogo2Preview] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [menuQrFile, setMenuQrFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [convertingLogo, setConvertingLogo] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const categoryFilter = searchParams.get('category') || '';

  useEffect(() => {
    const syncDeleted = async () => {
      const ids = getDeletedIds();
      const names = getDeletedNames();
      if (ids.length || names.length) {
        try {
          await businessAPI.rememberDeleted(ids, names);
        } catch (err) {
          // Keep local list even if the server sync fails.
        }
      }
      fetchData();
    };
    syncDeleted();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bizRes, catRes] = await Promise.all([
        businessAPI.getAll({}),
        categoryAPI.getAll(),
      ]);
      setBusinesses(filterDeleted(Array.isArray(bizRes.data) ? bizRes.data : []));
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
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
        secondName: business.secondName || '',
        menuName: firstMenu.name || 'Main Menu',
        menuDescription: firstMenu.description || '',
        menuType: firstMenu.type || (firstMenu.link ? 'link' : 'image'),
        menuLink: firstMenu.link || '',
      });
      setEditingId(business._id);
      setLogoPreview(resolveMediaUrl(business.logo));
      setLogo2Preview(resolveMediaUrl(business.logo2));
    } else {
      setFormData({
        ...emptyForm,
        category: categoryFilter || '',
      });
      setEditingId(null);
      setLogoPreview('');
      setLogo2Preview('');
    }
    setLogoFile(null);
    setLogo2File(null);
    setCoverFile(null);
    setMenuQrFile(null);
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const selectedCategory = categories.find((cat) => String(cat._id) === String(formData.category));
  const categoryKind = getCategoryKind(selectedCategory?.name);
  const showMenuFields = isDiningCategory(selectedCategory?.name);

  const pickLogoFile = async (file, which) => {
    const setFile = which === 'logo2' ? setLogo2File : setLogoFile;
    const setPreview = which === 'logo2' ? setLogo2Preview : setLogoPreview;
    if (!file) {
      setFile(null);
      return;
    }
    try {
      setError('');
      setConvertingLogo(Boolean(isPdfFile(file)));
      const converted = await fileToLogoImage(file);
      setFile(converted);
      setPreview(URL.createObjectURL(converted));
    } catch (err) {
      setFile(null);
      setError(err.message || 'Could not convert this PDF. Use a PNG or JPG instead.');
    } finally {
      setConvertingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category) {
      setError('Name and category are required');
      return;
    }
    try {
      setSaving(true);
      setError('');
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
      payload.append('secondName', showMenuFields ? formData.secondName : '');

      if (logoFile) {
        payload.append('logo', logoFile);
      }
      if (showMenuFields && logo2File) {
        payload.append('logo2', logo2File);
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
        const { data } = await businessAPI.update(editingId, payload);
        setBusinesses((prev) =>
          prev.map((item) => (String(item._id) === String(editingId) ? data : item))
        );
      } else {
        const { data } = await businessAPI.create(payload);
        setBusinesses((prev) => [data, ...prev]);
      }
      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save business');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this business?')) return;
    try {
      setDeletingId(id);
      setError('');
      await businessAPI.delete(id);
      const removed = businesses.find((item) => String(item._id) === String(id));
      rememberDeleted(id, removed?.name);
      setBusinesses((prev) => prev.filter((item) => String(item._id) !== String(id)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete business');
    } finally {
      setDeletingId(null);
    }
  };

  const setCategoryFilter = (id) => {
    const next = {};
    if (id) next.category = id;
    setSearchParams(next);
  };

  const visibleBusinesses = categoryFilter
    ? businesses.filter((item) => String(item.category?._id || item.category) === String(categoryFilter))
    : businesses;

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <h2>Manage Businesses</h2>
        <Button type="button" variant="contained" onClick={() => handleOpenDialog()}>
          + Add Business
        </Button>
      </Box>

      {error && !openDialog && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
        <Chip
          label={`All (${businesses.length})`}
          onClick={() => setCategoryFilter('')}
          color={!categoryFilter ? 'primary' : 'default'}
          variant={!categoryFilter ? 'filled' : 'outlined'}
        />
        {categories.map((cat) => {
          const count = businesses.filter(
            (item) => String(item.category?._id || item.category) === String(cat._id)
          ).length;
          const selected = String(categoryFilter) === String(cat._id);
          return (
            <Chip
              key={cat._id}
              avatar={<CategoryIcon category={cat} size={22} sx={{ borderRadius: '50%' }} />}
              label={`${cat.name} (${count})`}
              onClick={() => setCategoryFilter(cat._id)}
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
            />
          );
        })}
      </Stack>

      {categoryFilter && (
        <Box sx={{ mb: 2 }}>
          <Button
            component={Link}
            to={`/businesses?category=${encodeURIComponent(categoryFilter)}`}
            size="small"
            startIcon={<OpenInNew />}
          >
            View this category on the site
          </Button>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Logo</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleBusinesses.map((business) => (
              <TableRow key={business._id}>
                <TableCell>
                  {business.logo ? (
                    <Box
                      component="img"
                      src={resolveMediaUrl(business.logo)}
                      alt=""
                      sx={{ width: 44, height: 44, objectFit: 'contain', bgcolor: '#fff', border: '1px solid #eee' }}
                    />
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>{business.name}</TableCell>
                <TableCell>{business.category?.name}</TableCell>
                <TableCell>
                  <Box component="span" dir="ltr" className="phone-number" sx={{ display: 'inline-block', direction: 'ltr' }}>
                    {business.phone}
                  </Box>
                </TableCell>
                <TableCell>{business.address}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    size="small"
                    onClick={() => handleOpenDialog(business)}
                    startIcon={<Edit />}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="small"
                    color="error"
                    disabled={deletingId === business._id}
                    onClick={() => handleDelete(business._id)}
                    startIcon={<Delete />}
                  >
                    {deletingId === business._id ? 'Deleting...' : 'Delete'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {visibleBusinesses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography sx={{ py: 2, color: 'text.secondary' }}>
                    No businesses in this category yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth scroll="paper">
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
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
            inputProps={{ dir: 'ltr' }}
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
              inputProps={{ dir: 'ltr' }}
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
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {showMenuFields ? 'Logo 1 — first restaurant / cafe (optional)' : 'Logo (optional)'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              PNG, JPG, or PDF. A PDF is converted and shown as an image.
            </Typography>
            {logoPreview ? (
              <Box component="img" src={logoPreview} alt="" sx={logoThumbSx} />
            ) : null}
            {convertingLogo && (
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Converting PDF to image…
              </Typography>
            )}
            <input
              type="file"
              accept="image/*,.pdf,application/pdf"
              onChange={(e) => pickLogoFile(e.target.files?.[0] || null, 'logo')}
            />
          </Box>
          {showMenuFields && (
            <Box sx={{ mt: 2, border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Second restaurant / cafe in this place
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Use this when two restaurants or cafes share the same location.
              </Typography>
              <TextField
                fullWidth
                label="Second name (optional)"
                value={formData.secondName}
                onChange={(e) => setFormData({ ...formData, secondName: e.target.value })}
                margin="normal"
                placeholder="Name of the second restaurant or cafe"
              />
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Logo 2 (optional)
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                PNG, JPG, or PDF. A PDF is converted and shown as an image.
              </Typography>
              {logo2Preview ? (
                <Box component="img" src={logo2Preview} alt="" sx={logoThumbSx} />
              ) : null}
              <input
                type="file"
                accept="image/*,.pdf,application/pdf"
                onChange={(e) => pickLogoFile(e.target.files?.[0] || null, 'logo2')}
              />
            </Box>
          )}
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
            <Button type="submit" variant="contained" disabled={saving || convertingLogo}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" onClick={handleCloseDialog} disabled={saving}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ManageBusinesses;
