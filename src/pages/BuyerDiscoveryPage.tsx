import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  LocationOn as LocationIcon,
  Add as AddIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';

interface Buyer {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  website?: string;
  country: string;
  industry: string;
  company_size: 'small' | 'medium' | 'large' | 'enterprise';
  annual_revenue?: number;
  products_interested: string[];
  import_volume?: number;
  verified: boolean;
  rating: number;
  last_activity: string;
  created_at: string;
}

interface BuyerSearch {
  product_category: string;
  target_country: string;
  company_size?: string;
  min_import_volume?: number;
}

const BuyerDiscoveryPage: React.FC = () => {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchData, setSearchData] = useState<BuyerSearch>({
    product_category: '',
    target_country: '',
    company_size: '',
    min_import_volume: undefined
  });

  // Sample product categories
  const productCategories = [
    'Electronics', 'Machinery', 'Automotive', 'Textiles', 'Food & Beverages',
    'Chemicals', 'Medical Devices', 'Software', 'Construction Materials', 'Energy Equipment'
  ];

  // Sample countries
  const countries = [
    'Germany', 'United Kingdom', 'France', 'Japan', 'China', 'Canada',
    'Australia', 'Brazil', 'India', 'Mexico', 'South Korea', 'Italy',
    'Netherlands', 'Spain', 'United States', 'Singapore'
  ];

  const companySizes = [
    { value: 'small', label: 'Small (1-50 employees)' },
    { value: 'medium', label: 'Medium (51-250 employees)' },
    { value: 'large', label: 'Large (251-1000 employees)' },
    { value: 'enterprise', label: 'Enterprise (1000+ employees)' }
  ];

  // Real buyer discovery would integrate with:
  // - Trade databases (Kompass, D&B, etc.)
  // - Government export promotion databases
  // - Industry association directories
  // - B2B marketplace APIs

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchData.product_category || !searchData.target_country) {
      setError('Please select both product category and target country');
      return;
    }

    try {
      setSearching(true);
      setError(null);

      // Simulate API delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate realistic mock buyers based on search criteria
      const mockBuyers = generateMockBuyers(searchData);
      setBuyers(mockBuyers);

    } catch (err) {
      console.error('Error searching buyers:', err);
      setError('Failed to search buyers');
    } finally {
      setSearching(false);
    }
  };

  // Generate realistic mock buyers based on search criteria
  const generateMockBuyers = (search: BuyerSearch): Buyer[] => {
    const companyPrefixes = ['Global', 'International', 'Premier', 'Advanced', 'Elite', 'Prime'];
    const companySuffixes = ['Corp', 'Ltd', 'Inc', 'GmbH', 'S.A.', 'Pvt Ltd'];
    const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'Robert', 'Anna'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    
    const buyers: Buyer[] = [];
    const numBuyers = Math.floor(Math.random() * 8) + 3; // 3-10 buyers

    for (let i = 0; i < numBuyers; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const companyPrefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
      const companySuffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
      
      const companySize = search.company_size || 
        ['small', 'medium', 'large', 'enterprise'][Math.floor(Math.random() * 4)];
      
      const buyer: Buyer = {
        id: i + 1,
        company_name: `${companyPrefix} ${search.product_category} ${companySuffix}`,
        contact_person: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyPrefix.toLowerCase()}${search.product_category.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+${Math.floor(Math.random() * 99) + 1}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        website: `www.${companyPrefix.toLowerCase()}${search.product_category.toLowerCase().replace(/\s+/g, '')}.com`,
        country: search.target_country,
        industry: search.product_category,
        company_size: companySize as 'small' | 'medium' | 'large' | 'enterprise',
        annual_revenue: getRevenueBySize(companySize),
        products_interested: [search.product_category],
        import_volume: Math.floor(Math.random() * 100000) + 10000,
        verified: Math.random() > 0.3, // 70% verified
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0 rating
        last_activity: getRandomDate(),
        created_at: new Date().toISOString()
      };
      
      buyers.push(buyer);
    }
    
    return buyers.sort((a, b) => b.rating - a.rating); // Sort by rating
  };

  const getRevenueBySize = (size: string): number => {
    switch (size) {
      case 'small': return Math.floor(Math.random() * 5000000) + 500000; // 0.5M-5M
      case 'medium': return Math.floor(Math.random() * 45000000) + 5000000; // 5M-50M
      case 'large': return Math.floor(Math.random() * 450000000) + 50000000; // 50M-500M
      case 'enterprise': return Math.floor(Math.random() * 4500000000) + 500000000; // 500M-5B
      default: return Math.floor(Math.random() * 10000000) + 1000000;
    }
  };

  const getRandomDate = (): string => {
    const days = Math.floor(Math.random() * 30) + 1;
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  const handleAddToLeads = async (buyer: Buyer) => {
    try {
      const { error } = await supabase
        .from('leads')
        .insert([{
          name: buyer.contact_person,
          company: buyer.company_name,
          email: buyer.email,
          phone: buyer.phone,
          country: buyer.country,
          status: 'new'
        }]);

      if (error) throw error;

      alert(`${buyer.contact_person} from ${buyer.company_name} has been added to your leads!`);
    } catch (err) {
      console.error('Error adding to leads:', err);
      setError('Failed to add buyer to leads');
    }
  };

  const getCompanySizeColor = (size: string) => {
    switch (size) {
      case 'enterprise': return 'success';
      case 'large': return 'primary';
      case 'medium': return 'warning';
      case 'small': return 'default';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Buyer Discovery
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Buyer Search Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Find Potential Buyers
          </Typography>
          
          <form onSubmit={handleSearch}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" required>
                  <InputLabel>Product Category</InputLabel>
                  <Select
                    value={searchData.product_category}
                    onChange={(e) => setSearchData({ ...searchData, product_category: e.target.value })}
                    label="Product Category"
                  >
                    {productCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined" required>
                  <InputLabel>Target Country</InputLabel>
                  <Select
                    value={searchData.target_country}
                    onChange={(e) => setSearchData({ ...searchData, target_country: e.target.value })}
                    label="Target Country"
                  >
                    {countries.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Company Size (Optional)</InputLabel>
                  <Select
                    value={searchData.company_size}
                    onChange={(e) => setSearchData({ ...searchData, company_size: e.target.value })}
                    label="Company Size (Optional)"
                  >
                    <MenuItem value="">Any Size</MenuItem>
                    {companySizes.map((size) => (
                      <MenuItem key={size.value} value={size.value}>
                        {size.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box display="flex" alignItems="flex-end" height="100%">
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={searching ? <CircularProgress size={16} /> : <SearchIcon />}
                    disabled={searching}
                    fullWidth
                    size="large"
                  >
                    {searching ? 'Searching...' : 'Find Buyers'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>

          {searching && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Searching global buyer database...
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Analyzing {searchData.product_category} importers in {searchData.target_country}
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Buyer Results */}
      {buyers.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Potential Buyers for {searchData.product_category} in {searchData.target_country}
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {buyers.map((buyer) => (
                <Grid item xs={12} md={6} lg={4} key={buyer.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <BusinessIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                              {buyer.company_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {buyer.contact_person}
                            </Typography>
                          </Box>
                        </Box>
                        {buyer.verified && (
                          <Chip label="Verified" color="success" size="small" />
                        )}
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2">{buyer.country}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <BusinessIcon fontSize="small" color="action" />
                          <Chip 
                            label={buyer.company_size.toUpperCase()} 
                            color={getCompanySizeColor(buyer.company_size) as any}
                            size="small"
                          />
                        </Box>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <StarIcon fontSize="small" color="warning" />
                          <Typography variant="body2">
                            {buyer.rating}/5.0 Rating
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Annual Revenue: {formatCurrency(buyer.annual_revenue || 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Import Volume: {formatNumber(buyer.import_volume || 0)} units/year
                        </Typography>
                      </Box>

                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedBuyer(buyer);
                            setDetailsOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddToLeads(buyer)}
                        >
                          Add to Leads
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Pro Tip:</strong> Verified buyers have been validated through our partner networks. 
                Contact them directly or add them to your leads for follow-up.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {buyers.length === 0 && !searching && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Discover Potential Buyers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select your product category and target country to find verified buyers 
              who are actively importing similar products.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Buyer Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        {selectedBuyer && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedBuyer.company_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedBuyer.contact_person}
                  </Typography>
                </Box>
                {selectedBuyer.verified && (
                  <Chip label="Verified Buyer" color="success" />
                )}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Contact Information</Typography>
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar><EmailIcon /></Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Email" 
                        secondary={selectedBuyer.email}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar><PhoneIcon /></Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Phone" 
                        secondary={selectedBuyer.phone || 'Not provided'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar><WebsiteIcon /></Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Website" 
                        secondary={selectedBuyer.website || 'Not provided'}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Company Details</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Country</Typography>
                    <Typography variant="body1">{selectedBuyer.country}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Company Size</Typography>
                    <Chip 
                      label={selectedBuyer.company_size.toUpperCase()} 
                      color={getCompanySizeColor(selectedBuyer.company_size) as any}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Annual Revenue</Typography>
                    <Typography variant="body1">{formatCurrency(selectedBuyer.annual_revenue || 0)}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Import Volume</Typography>
                    <Typography variant="body1">{formatNumber(selectedBuyer.import_volume || 0)} units/year</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Rating</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <StarIcon color="warning" />
                      <Typography variant="body1">{selectedBuyer.rating}/5.0</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => {
                  handleAddToLeads(selectedBuyer);
                  setDetailsOpen(false);
                }}
              >
                Add to Leads
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default BuyerDiscoveryPage;