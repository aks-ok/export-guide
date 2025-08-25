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
  LinearProgress,
  Skeleton
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Public as PublicIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { worldBankService } from '../services/api/WorldBankService';
import { MarketData, MarketSearchParams } from '../services/types';
import { useErrorHandler } from '../services/ErrorHandler';
import { apiConfig } from '../services/ApiService';
import { DataTransformUtils } from '../services/transformers';

interface MarketSearch {
  product_category: string;
  target_countries: string[];
  min_market_size?: number;
  max_tariff_rate?: number;
  min_growth_rate?: number;
  competition_level?: ('low' | 'medium' | 'high')[];
}

const SimpleMarketResearchPage: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('');
  const [searchData, setSearchData] = useState<MarketSearch>({
    product_category: '',
    target_countries: [],
    min_market_size: undefined,
    max_tariff_rate: undefined,
    min_growth_rate: undefined,
    competition_level: undefined
  });

  const { handleApiError } = useErrorHandler();

  // Sample product categories
  const productCategories = [
    'Electronics', 'Machinery', 'Automotive', 'Textiles', 'Food & Beverages',
    'Chemicals', 'Medical Devices', 'Software', 'Construction Materials', 'Energy Equipment'
  ];

  // Major economies for market research
  const countries = [
    'United States', 'Germany', 'United Kingdom', 'France', 'Japan', 'China', 
    'Canada', 'Australia', 'Brazil', 'India', 'Mexico', 'South Korea', 
    'Italy', 'Netherlands', 'Spain', 'Switzerland', 'Belgium', 'Sweden'
  ];

  // Generate fallback mock data when real data is unavailable
  const generateFallbackData = (searchData: MarketSearch): MarketData[] => {
    const targetCountries = searchData.target_countries.length > 0 
      ? searchData.target_countries 
      : countries.slice(0, 6);

    return targetCountries.map((country, index) => ({
      id: `fallback_${Date.now()}_${index}`,
      country,
      countryCode: country.substring(0, 3).toUpperCase(),
      productCategory: searchData.product_category,
      marketSize: Math.floor(Math.random() * 500000000000) + 50000000000, // 50B - 550B
      growthRate: Math.round((Math.random() * 15 + 2) * 10) / 10, // 2% - 17%
      competitionLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
      tariffRate: Math.round((Math.random() * 20) * 10) / 10, // 0% - 20%
      tradeVolume: Math.floor(Math.random() * 100000000000) + 10000000000, // 10B - 110B
      lastUpdated: new Date(),
      source: 'Fallback Data',
      reliability: 'low' as const
    })).sort((a, b) => b.marketSize - a.marketSize);
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

      // Check if real data is enabled
      if (!apiConfig.isRealDataEnabled()) {
        // Use fallback data
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        const fallbackData = generateFallbackData(searchData);
        setMarketData(fallbackData);
        setDataSource('Mock Data (Real data disabled)');
        return;
      }

      // Prepare search parameters for World Bank API
      const searchParams: MarketSearchParams = {
        productCategory: searchData.product_category,
        countries: searchData.target_countries.length > 0 ? 
          searchData.target_countries.map(country => getCountryCode(country)) : 
          undefined,
        minMarketSize: searchData.min_market_size,
        maxTariffRate: searchData.max_tariff_rate,
        minGrowthRate: searchData.min_growth_rate,
        competitionLevel: searchData.competition_level
      };

      // Fetch real market data from World Bank API
      const response = await worldBankService.getMarketData(searchParams);

      if (response.success && response.data.length > 0) {
        setMarketData(response.data);
        setDataSource(response.source);
      } else {
        // Fallback to mock data if no real data available
        const fallbackData = generateFallbackData(searchData);
        setMarketData(fallbackData);
        setDataSource('Fallback Data (No real data available)');
      }

    } catch (err) {
      console.error('Error searching market opportunities:', err);
      handleApiError(err, 'SimpleMarketResearchPage');
      
      // Use fallback data on error
      if (apiConfig.shouldFallbackToMock()) {
        const fallbackData = generateFallbackData(searchData);
        setMarketData(fallbackData);
        setDataSource('Fallback Data (API Error)');
        setError('Using fallback data due to API issues');
      } else {
        setError('Failed to search market opportunities');
      }
    } finally {
      setSearching(false);
    }
  };

  // Helper function to convert country names to codes
  const getCountryCode = (countryName: string): string => {
    const countryMap: Record<string, string> = {
      'United States': 'USA',
      'Germany': 'DEU',
      'United Kingdom': 'GBR',
      'France': 'FRA',
      'Japan': 'JPN',
      'China': 'CHN',
      'Canada': 'CAN',
      'Australia': 'AUS',
      'Brazil': 'BRA',
      'India': 'IND',
      'Mexico': 'MEX',
      'South Korea': 'KOR',
      'Italy': 'ITA',
      'Netherlands': 'NLD',
      'Spain': 'ESP',
      'Switzerland': 'CHE',
      'Belgium': 'BEL',
      'Sweden': 'SWE'
    };
    return countryMap[countryName] || countryName.substring(0, 3).toUpperCase();
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'default';
    }
  };

  const getGrowthColor = (growthRate: number) => {
    if (growthRate >= 5) return 'success';
    if (growthRate >= 2) return 'warning';
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
        <Alert 
          severity={error.includes('fallback') ? 'warning' : 'error'} 
          sx={{ mb: 2 }} 
          onClose={() => setError(null)}
          action={
            error.includes('API') ? (
              <Button color="inherit" size="small" onClick={() => handleSearch({ preventDefault: () => {} } as any)}>
                <RefreshIcon sx={{ mr: 0.5 }} />
                Retry
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      )}

      {/* Data Source Indicator */}
      {dataSource && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            icon={dataSource.includes('World Bank') ? <TrendingUpIcon /> : <WarningIcon />}
            label={`Data Source: ${dataSource}`}
            color={dataSource.includes('World Bank') ? 'success' : 'warning'}
            variant="outlined"
          />
          {marketData.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {marketData[0]?.lastUpdated.toLocaleString()}
            </Typography>
          )}
        </Box>
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
                {apiConfig.isRealDataEnabled() 
                  ? 'Fetching real market data from World Bank API...' 
                  : 'Generating market analysis...'}
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Market Research Results */}
      {searching ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Loading Market Data...
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
                    <TableCell>Data Reliability</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton variant="text" width={120} /></TableCell>
                      <TableCell><Skeleton variant="text" width={80} /></TableCell>
                      <TableCell><Skeleton variant="text" width={60} /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={70} height={24} /></TableCell>
                      <TableCell><Skeleton variant="text" width={50} /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={60} height={24} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : marketData.length > 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Market Analysis for {searchData.product_category}
              </Typography>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => handleSearch({ preventDefault: () => {} } as any)}
                disabled={searching}
              >
                Refresh Data
              </Button>
            </Box>
            
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Country</TableCell>
                    <TableCell>Market Size</TableCell>
                    <TableCell>Growth Rate</TableCell>
                    <TableCell>Competition</TableCell>
                    <TableCell>Tariff Rate</TableCell>
                    <TableCell>Data Reliability</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {marketData.map((market) => (
                    <TableRow key={market.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PublicIcon fontSize="small" color="action" />
                          <strong>{market.country}</strong>
                          <Typography variant="caption" color="text.secondary">
                            ({market.countryCode})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {DataTransformUtils.formatLargeNumber(market.marketSize)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TrendingUpIcon 
                            fontSize="small" 
                            color={getGrowthColor(market.growthRate) as any}
                          />
                          <Typography 
                            variant="body2" 
                            color={getGrowthColor(market.growthRate) === 'success' ? 'success.main' : 
                                   getGrowthColor(market.growthRate) === 'warning' ? 'warning.main' : 'error.main'}
                          >
                            {market.growthRate.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={market.competitionLevel.toUpperCase()}
                          color={getCompetitionColor(market.competitionLevel) as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {market.tariffRate.toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={market.reliability.toUpperCase()}
                          color={getReliabilityColor(market.reliability) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Market Analysis</strong> is based on {dataSource.includes('World Bank') ? 'real economic data from World Bank APIs' : 'estimated market data'}. 
                Growth rates reflect recent economic trends, and competition levels are assessed based on trade volumes and market dynamics.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      ) : null}

      {/* Empty State */}
      {marketData.length === 0 && !searching && (
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