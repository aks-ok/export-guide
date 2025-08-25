import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { enhancedAPIService } from '../services/EnhancedAPIService';
import { colorPalette, getGradientBackground } from '../theme/ExportGuideTheme';

const EnhancedAPIDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  // Form states
  const [tradeParams, setTradeParams] = useState({
    reporter_country: '699', // India
    partner_country: '276', // Germany
    product_code: '85' // Electronics
  });

  const [currencyParams, setCurrencyParams] = useState({
    amount: 1000,
    from: 'USD',
    to: 'INR'
  });

  const [countryName, setCountryName] = useState('Germany');
  const [companyName, setCompanyName] = useState('Reliance Industries');
  const [postOfficeQuery, setPostOfficeQuery] = useState('Connaught Place');
  const [pincodeQuery, setPincodeQuery] = useState('110001');

  const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];
  const countries = [
    { name: 'Germany', code: '276' },
    { name: 'USA', code: '842' },
    { name: 'UK', code: '826' },
    { name: 'Japan', code: '392' },
    { name: 'China', code: '156' },
    { name: 'France', code: '250' }
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const rates = await enhancedAPIService.getCurrencyRates('USD');
      console.log('Initial currency rates loaded:', rates);
    } catch (err) {
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const handleTradeDataDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await enhancedAPIService.getTradeData(tradeParams);
      setResults({ type: 'trade', data });
      enhancedAPIService.trackAPIUsage('comtrade', true, Date.now());
    } catch (err) {
      setError('Failed to fetch trade data');
      enhancedAPIService.trackAPIUsage('comtrade', false, Date.now());
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const rates = await enhancedAPIService.getCurrencyRates(currencyParams.from);
      const converted = await enhancedAPIService.convertCurrency(
        currencyParams.amount,
        currencyParams.from,
        currencyParams.to
      );
      setResults({ type: 'currency', data: { rates, converted, original: currencyParams } });
    } catch (err) {
      setError('Failed to fetch currency data');
    } finally {
      setLoading(false);
    }
  };

  const handleCountryDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const countryInfo = await enhancedAPIService.getCountryInfo(countryName);
      const worldBankData = await enhancedAPIService.getWorldBankIndicators('DE');
      const projects = await enhancedAPIService.getWorldBankProjects('DE');
      setResults({ type: 'country', data: { countryInfo, worldBankData, projects } });
    } catch (err) {
      setError('Failed to fetch country data');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const companyInfo = await enhancedAPIService.getIndianCompanyInfo(companyName);
      setResults({ type: 'company', data: companyInfo });
    } catch (err) {
      setError('Failed to fetch company data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarketAnalysisDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const analysis = await enhancedAPIService.getEnhancedMarketAnalysis('276', '85');
      setResults({ type: 'market', data: analysis });
    } catch (err) {
      setError('Failed to perform market analysis');
    } finally {
      setLoading(false);
    }
  };

  const handlePostOfficeDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const postOfficeData = await enhancedAPIService.getPostOfficeByName(postOfficeQuery);
      const pincodeData = await enhancedAPIService.getPostOfficeByPincode(pincodeQuery);
      setResults({ 
        type: 'postoffice', 
        data: { 
          by_name: postOfficeData, 
          by_pincode: pincodeData,
          query_name: postOfficeQuery,
          query_pincode: pincodeQuery
        } 
      });
    } catch (err) {
      setError('Failed to fetch post office data');
    } finally {
      setLoading(false);
    }
  };

  const TabPanel = ({ children, value, index }: { children: React.ReactNode; value: number; index: number }) => (
    <div hidden={value !== index} style={{ paddingTop: 24 }}>
      {value === index && children}
    </div>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: colorPalette.background.default, minHeight: '100vh' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: getGradientBackground('135deg'),
          color: 'white',
          p: 4,
          borderRadius: 3,
          mb: 4,
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          🔥 Enhanced API Demo - REAL DATA
        </Typography>
        <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
          Experience live data from your premium API keys - UN Comtrade, MCA, World Bank & more!
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label="UN Comtrade ✅" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} />
          <Chip label="World Bank ✅" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} />
          <Chip label="MCA India ✅" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} />
          <Chip label="Indian Post ✅" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} />
          <Chip label="Exchange Rates ✅" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} />
          <Chip label="Google Analytics ✅" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} />
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* API Demo Tabs */}
      <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${colorPalette.neutral[200]}` }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} variant="scrollable">
            <Tab label="🌍 Trade Data" icon={<TrendingUpIcon />} />
            <Tab label="💱 Currency" icon={<MoneyIcon />} />
            <Tab label="🏛️ Country Info" icon={<PublicIcon />} />
            <Tab label="🏢 Indian Companies" icon={<BusinessIcon />} />
            <Tab label="🏤 Post Office" icon={<PublicIcon />} />
            <Tab label="📊 Market Analysis" icon={<AnalyticsIcon />} />
          </Tabs>
        </Box>

        {/* Tab 1: Enhanced Trade Data */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: colorPalette.primary.main }}>
              🔥 UN Comtrade API - REAL Trade Data (Your API Keys)
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Reporter Country</InputLabel>
                  <Select
                    value={tradeParams.reporter_country}
                    onChange={(e) => setTradeParams(prev => ({ ...prev, reporter_country: e.target.value }))}
                    label="Reporter Country"
                  >
                    <MenuItem value="699">🇮🇳 India</MenuItem>
                    <MenuItem value="842">🇺🇸 United States</MenuItem>
                    <MenuItem value="276">🇩🇪 Germany</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Partner Country</InputLabel>
                  <Select
                    value={tradeParams.partner_country}
                    onChange={(e) => setTradeParams(prev => ({ ...prev, partner_country: e.target.value }))}
                    label="Partner Country"
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.code} value={country.code}>
                        {country.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Product Code"
                  value={tradeParams.product_code}
                  onChange={(e) => setTradeParams(prev => ({ ...prev, product_code: e.target.value }))}
                  helperText="e.g., 85 for Electronics"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleTradeDataDemo}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <TrendingUpIcon />}
                  sx={{ mr: 2 }}
                >
                  {loading ? 'Fetching Real Data...' : '🔥 Get LIVE Trade Data'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Tab 2: Enhanced Currency */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: colorPalette.primary.main }}>
              💱 Live Exchange Rates API
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ p: 3, border: `1px solid ${colorPalette.neutral[200]}` }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Currency Converter
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Amount"
                        type="number"
                        value={currencyParams.amount}
                        onChange={(e) => setCurrencyParams(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>From</InputLabel>
                        <Select
                          value={currencyParams.from}
                          onChange={(e) => setCurrencyParams(prev => ({ ...prev, from: e.target.value }))}
                          label="From"
                        >
                          {currencies.map((currency) => (
                            <MenuItem key={currency} value={currency}>{currency}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>To</InputLabel>
                        <Select
                          value={currencyParams.to}
                          onChange={(e) => setCurrencyParams(prev => ({ ...prev, to: e.target.value }))}
                          label="To"
                        >
                          {currencies.map((currency) => (
                            <MenuItem key={currency} value={currency}>{currency}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={handleCurrencyDemo}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <MoneyIcon />}
                        fullWidth
                      >
                        Convert Currency
                      </Button>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Tab 3: Enhanced Country Info */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: colorPalette.primary.main }}>
              🏛️ Country Info + World Bank Data
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Country Name"
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={handleCountryDemo}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <PublicIcon />}
                >
                  {loading ? 'Loading...' : 'Get Country + World Bank Data'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Tab 4: Indian Company Data */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: colorPalette.primary.main }}>
              🏢 Ministry of Corporate Affairs - Indian Company Data
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Indian Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  helperText="e.g., Reliance Industries, Tata Motors"
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={handleCompanyDemo}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <BusinessIcon />}
                >
                  {loading ? 'Searching MCA Database...' : '🔍 Search Indian Company'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Tab 5: Indian Post Office Data */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: colorPalette.primary.main }}>
              🏤 Indian Post Office API - PIN Code & Post Office Data
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ p: 3, border: `1px solid ${colorPalette.neutral[200]}` }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Search by Post Office Name
                  </Typography>
                  <TextField
                    fullWidth
                    label="Post Office Name"
                    value={postOfficeQuery}
                    onChange={(e) => setPostOfficeQuery(e.target.value)}
                    helperText="e.g., Connaught Place, Andheri East"
                    sx={{ mb: 2 }}
                  />
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ p: 3, border: `1px solid ${colorPalette.neutral[200]}` }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Search by PIN Code
                  </Typography>
                  <TextField
                    fullWidth
                    label="PIN Code"
                    value={pincodeQuery}
                    onChange={(e) => setPincodeQuery(e.target.value)}
                    helperText="e.g., 110001, 400053"
                    sx={{ mb: 2 }}
                  />
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handlePostOfficeDemo}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <PublicIcon />}
                  size="large"
                >
                  {loading ? 'Searching Post Office Data...' : '🔍 Get Post Office Information'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Tab 6: Market Analysis */}
        <TabPanel value={activeTab} index={5}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: colorPalette.primary.main }}>
              📊 Comprehensive Market Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Combines UN Comtrade, World Bank, and country data for complete market intelligence
            </Typography>
            <Button
              variant="contained"
              onClick={handleMarketAnalysisDemo}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AnalyticsIcon />}
            >
              {loading ? 'Analyzing Market...' : '🚀 Run Complete Market Analysis'}
            </Button>
          </Box>
        </TabPanel>
      </Card>

      {/* Results Display */}
      {results && (
        <Card sx={{ mt: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: colorPalette.primary.main }}>
              🎯 Live API Results
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <pre style={{ 
              backgroundColor: colorPalette.neutral[50], 
              padding: '16px', 
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
              {JSON.stringify(results.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default EnhancedAPIDemo;