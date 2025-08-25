import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Public as PublicIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

interface MarketOpportunity {
  id: number;
  country: string;
  product_category: string;
  market_size: number;
  growth_rate: number;
  competition_level: 'low' | 'medium' | 'high';
  opportunity_score: number;
  tariff_rate: number;
  created_at: string;
}

interface MarketSearch {
  product_category: string;
  target_countries: string[];
  min_market_size?: number;
}

const SimpleMarketResearchPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchData, setSearchData] = useState<MarketSearch>({
    product_category: '',
    target_countries: [],
    min_market_size: undefined
  });

  // Sample product categories
  const productCategories = [
    'Electronics', 'Machinery', 'Automotive', 'Textiles', 'Food & Beverages',
    'Chemicals', 'Medical Devices', 'Software', 'Construction Materials', 'Energy Equipment'
  ];

  // Sample countries
  const countries = [
    'Germany', 'United Kingdom', 'France', 'Japan', 'China', 'Canada',
    'Australia', 'Brazil', 'India', 'Mexico', 'South Korea', 'Italy'
  ];

  const generateMockOpportunities = (searchData: MarketSearch): MarketOpportunity[] => {
    const mockData: MarketOpportunity[] = [];
    const targetCountries = searchData.target_countries.length > 0 
      ? searchData.target_countries 
      : countries.slice(0, 6);

    targetCountries.forEach((country, index) => {
      const opportunity: MarketOpportunity = {
        id: Date.now() + index,
        country,
        product_category: searchData.product_category,
        market_size: Math.floor(Math.random() * 500000000) + 50000000, // 50M - 550M
        growth_rate: Math.round((Math.random() * 15 + 2) * 10) / 10, // 2% - 17%
        competition_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        opportunity_score: Math.floor(Math.random() * 40) + 60, // 60-100
        tariff_rate: Math.round((Math.random() * 20) * 10) / 10, // 0% - 20%
        created_at: new Date().toISOString()
      };
      mockData.push(opportunity);
    });

    // Sort by opportunity score
    return mockData.sort((a, b) => b.opportunity_score - a.opportunity_score);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchData.product_category) {
      setError('Please select a product category');
      return;
    }

    try {
      setSearching(true);
      setError(null);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock opportunities
      const mockOpportunities = generateMockOpportunities(searchData);
      setOpportunities(mockOpportunities);

    } catch (err) {
      console.error('Error searching opportunities:', err);
      setError('Failed to search market opportunities');
    } finally {
      setSearching(false);
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Market Research
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Market Opportunity Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <PublicIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Market Opportunity Search
          </Typography>
          
          <form onSubmit={handleSearch}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
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
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Target Countries (Optional)</InputLabel>
                  <Select
                    multiple
                    value={searchData.target_countries}
                    onChange={(e) => setSearchData({ 
                      ...searchData, 
                      target_countries: typeof e.target.value === 'string' 
                        ? e.target.value.split(',') 
                        : e.target.value 
                    })}
                    label="Target Countries (Optional)"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box display="flex" alignItems="flex-end" height="100%">
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={searching ? <CircularProgress size={16} /> : <SearchIcon />}
                    disabled={searching}
                    fullWidth
                    size="large"
                  >
                    {searching ? 'Searching...' : 'Find Opportunities'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>

          {searching && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Analyzing global market data...
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Market Opportunities Results */}
      {opportunities.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Market Opportunities for {searchData.product_category}
            </Typography>
            
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Country</TableCell>
                    <TableCell>Market Size</TableCell>
                    <TableCell>Growth Rate</TableCell>
                    <TableCell>Competition</TableCell>
                    <TableCell>Tariff Rate</TableCell>
                    <TableCell>Opportunity Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {opportunities.map((opportunity) => (
                    <TableRow key={opportunity.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PublicIcon fontSize="small" color="action" />
                          <strong>{opportunity.country}</strong>
                        </Box>
                      </TableCell>
                      <TableCell>{formatCurrency(opportunity.market_size)}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TrendingUpIcon fontSize="small" color="success" />
                          {opportunity.growth_rate}%
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={opportunity.competition_level.toUpperCase()}
                          color={getCompetitionColor(opportunity.competition_level) as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{opportunity.tariff_rate}%</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={`${opportunity.opportunity_score}/100`}
                            color={getScoreColor(opportunity.opportunity_score) as any}
                            size="small"
                          />
                          <LinearProgress
                            variant="determinate"
                            value={opportunity.opportunity_score}
                            sx={{ width: 60, height: 6, borderRadius: 3 }}
                            color={getScoreColor(opportunity.opportunity_score) as any}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Opportunity Score</strong> is calculated based on market size, growth rate, 
                competition level, regulatory environment, and trade barriers.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {opportunities.length === 0 && !searching && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Discover Market Opportunities
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a product category and search to find the best export markets for your business.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SimpleMarketResearchPage;