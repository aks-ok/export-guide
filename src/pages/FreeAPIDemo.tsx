import React, { useState } from 'react';
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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,

  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { freeAPIService } from '../services/FreeAPIService';

const FreeAPIDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
  const [companyName, setCompanyName] = useState('Tech Solutions');
  const [pincode, setPincode] = useState('110001');
  const [ifscCode, setIfscCode] = useState('SBIN0000001');
  const [entityName, setEntityName] = useState('Test Company Ltd');

  const handleTradeDataDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await freeAPIService.getTradeData({
        reporter_country: tradeParams.reporter_country,
        partner_country: tradeParams.partner_country,
        product_code: tradeParams.product_code
      });
      setResults({ type: 'trade', data });
    } catch (err) {
      setError('Failed to fetch trade data');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const rates = await freeAPIService.getCurrencyRates(currencyParams.from);
      const converted = await freeAPIService.convertCurrency(
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
      const countryInfo = await freeAPIService.getCountryInfo(countryName);
      const economicData = await freeAPIService.getEconomicIndicators('DE'); // Germany code
      setResults({ type: 'country', data: { countryInfo, economicData } });
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
      const companyInfo = await freeAPIService.verifyCompany(companyName, 'in');
      setResults({ type: 'company', data: companyInfo });
    } catch (err) {
      setError('Failed to verify company');
    } finally {
      setLoading(false);
    }
  };

  const handleIndianServicesDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pincodeData, ifscData] = await Promise.all([
        freeAPIService.validateIndianPincode(pincode),
        freeAPIService.validateIFSC(ifscCode)
      ]);
      setResults({ type: 'indian', data: { pincodeData, ifscData } });
    } catch (err) {
      setError('Failed to validate Indian data');
    } finally {
      setLoading(false);
    }
  };

  const handleComplianceDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const sanctionsCheck = await freeAPIService.screenForSanctions(entityName);
      setResults({ type: 'compliance', data: sanctionsCheck });
    } catch (err) {
      setError('Failed to perform compliance check');
    } finally {
      setLoading(false);
    }
  };

  const handleMarketAnalysisDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const analysis = await freeAPIService.getMarketAnalysis('Germany', '85');
      setResults({ type: 'market', data: analysis });
    } catch (err) {
      setError('Failed to perform market analysis');
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;

    switch (results.type) {
      case 'trade':
        return (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Country</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Export Value (USD)</TableCell>
                  <TableCell>Year</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.data.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{item.country}</TableCell>
                    <TableCell>{item.product}</TableCell>
                    <TableCell>${item.export_value.toLocaleString()}</TableCell>
                    <TableCell>{item.year}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case 'currency':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Conversion Result
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {results.data.original.amount} {results.data.original.from} = {results.data.converted.toFixed(2)} {results.data.original.to}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Current Rates ({results.data.rates.base})
                  </Typography>
                  <List dense>
                    {Object.entries(results.data.rates.rates).slice(0, 6).map(([currency, rate]: [string, any]) => (
                      <ListItem key={currency}>
                        <ListItemText 
                          primary={`1 ${results.data.rates.base} = ${rate} ${currency}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 'country':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Country Information
                  </Typography>
                  {results.data.countryInfo && (
                    <List>
                      <ListItem>
                        <ListItemText primary="Name" secondary={results.data.countryInfo.name} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Capital" secondary={results.data.countryInfo.capital} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Population" secondary={results.data.countryInfo.population.toLocaleString()} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Currency" secondary={results.data.countryInfo.currency} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Region" secondary={`${results.data.countryInfo.region} - ${results.data.countryInfo.subregion}`} />
                      </ListItem>
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Economic Indicators
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="GDP" secondary={`$${results.data.economicData.gdp.toLocaleString()}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="GDP Growth" secondary={`${results.data.economicData.gdp_growth}%`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Inflation" secondary={`${results.data.economicData.inflation}%`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Unemployment" secondary={`${results.data.economicData.unemployment}%`} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 'company':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Company Verification Result
              </Typography>
              {results.data ? (
                <List>
                  <ListItem>
                    <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                    <ListItemText primary="Company Found" secondary={results.data.name} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Jurisdiction" secondary={results.data.jurisdiction} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Company Number" secondary={results.data.company_number} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Status" secondary={results.data.status} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Incorporation Date" secondary={results.data.incorporation_date} />
                  </ListItem>
                </List>
              ) : (
                <Alert severity="warning">Company not found in database</Alert>
              )}
            </CardContent>
          </Card>
        );

      case 'indian':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Pincode Validation
                  </Typography>
                  {results.data.pincodeData ? (
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                        <ListItemText primary="Valid Pincode" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="District" secondary={results.data.pincodeData.district} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="State" secondary={results.data.pincodeData.state} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Country" secondary={results.data.pincodeData.country} />
                      </ListItem>
                    </List>
                  ) : (
                    <Alert severity="error">Invalid pincode</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    IFSC Validation
                  </Typography>
                  {results.data.ifscData ? (
                    <List>
                      <ListItem>
                        <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                        <ListItemText primary="Valid IFSC Code" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Bank" secondary={results.data.ifscData.bank} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Branch" secondary={results.data.ifscData.branch} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="City" secondary={results.data.ifscData.city} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="State" secondary={results.data.ifscData.state} />
                      </ListItem>
                    </List>
                  ) : (
                    <Alert severity="error">Invalid IFSC code</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      case 'compliance':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sanctions Screening Result
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                {results.data.is_sanctioned ? (
                  <Chip label="SANCTIONED" color="error" icon={<ErrorIcon />} />
                ) : (
                  <Chip label="CLEAR" color="success" icon={<CheckIcon />} />
                )}
                <Chip 
                  label={`Risk: ${results.data.risk_level.toUpperCase()}`} 
                  color={results.data.risk_level === 'high' ? 'error' : 'success'}
                />
              </Box>
              {results.data.matches.length > 0 && (
                <List>
                  {results.data.matches.map((match: any, index: number) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={match.list_name}
                        secondary={`Match Score: ${(match.match_score * 100).toFixed(0)}% - ${match.details}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        );

      case 'market':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Market Analysis Score
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h3" color="primary">
                      {results.data.market_score}/100
                    </Typography>
                    <Chip 
                      label={results.data.market_score >= 70 ? 'High Potential' : results.data.market_score >= 50 ? 'Medium Potential' : 'Low Potential'}
                      color={results.data.market_score >= 70 ? 'success' : results.data.market_score >= 50 ? 'warning' : 'error'}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Trade Data
                  </Typography>
                  {results.data.trade_data.length > 0 ? (
                    <List>
                      {results.data.trade_data.slice(0, 3).map((item: any, index: number) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={item.country}
                            secondary={`Export Value: $${item.export_value.toLocaleString()}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">No trade data available</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Economic Indicators
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="GDP Growth" secondary={`${results.data.economic_indicators.gdp_growth}%`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Inflation" secondary={`${results.data.economic_indicators.inflation}%`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Unemployment" secondary={`${results.data.economic_indicators.unemployment}%`} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Free APIs Demo - Real Data Integration
      </Typography>

      <Alert severity="success" sx={{ mb: 3 }}>
        All APIs demonstrated here are 100% FREE and provide real data for your export platform!
      </Alert>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Trade Data" />
        <Tab label="Currency" />
        <Tab label="Country Info" />
        <Tab label="Company Verify" />
        <Tab label="Indian Services" />
        <Tab label="Compliance" />
        <Tab label="Market Analysis" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Trade Data Tab */}
      {activeTab === 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              UN Comtrade API - Global Trade Data
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Reporter Country Code"
                  value={tradeParams.reporter_country}
                  onChange={(e) => setTradeParams({ ...tradeParams, reporter_country: e.target.value })}
                  helperText="699 = India"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Partner Country Code"
                  value={tradeParams.partner_country}
                  onChange={(e) => setTradeParams({ ...tradeParams, partner_country: e.target.value })}
                  helperText="276 = Germany"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Product Code"
                  value={tradeParams.product_code}
                  onChange={(e) => setTradeParams({ ...tradeParams, product_code: e.target.value })}
                  helperText="85 = Electronics"
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              onClick={handleTradeDataDemo}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <TrendingUpIcon />}
            >
              Get Trade Data
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Currency Tab */}
      {activeTab === 1 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Exchange Rate API - Currency Conversion
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={currencyParams.amount}
                  onChange={(e) => setCurrencyParams({ ...currencyParams, amount: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="From Currency"
                  value={currencyParams.from}
                  onChange={(e) => setCurrencyParams({ ...currencyParams, from: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="To Currency"
                  value={currencyParams.to}
                  onChange={(e) => setCurrencyParams({ ...currencyParams, to: e.target.value })}
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              onClick={handleCurrencyDemo}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <MoneyIcon />}
            >
              Convert Currency
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Country Info Tab */}
      {activeTab === 2 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <PublicIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              REST Countries + World Bank APIs
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country Name"
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  helperText="e.g., Germany, India, United States"
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              onClick={handleCountryDemo}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <PublicIcon />}
            >
              Get Country Info
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Company Verification Tab */}
      {activeTab === 3 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              OpenCorporates API - Company Verification
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  helperText="Search for any company name"
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              onClick={handleCompanyDemo}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <BusinessIcon />}
            >
              Verify Company
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Indian Services Tab */}
      {activeTab === 4 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              India Post + IFSC APIs - Indian Services
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  helperText="e.g., 110001 (New Delhi)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="IFSC Code"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  helperText="e.g., SBIN0000001"
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              onClick={handleIndianServicesDemo}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <CheckIcon />}
            >
              Validate Indian Data
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Compliance Tab */}
      {activeTab === 5 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Sanctions Screening - Compliance Check
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Entity Name"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  helperText="Company or person name to screen"
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              onClick={handleComplianceDemo}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <SecurityIcon />}
            >
              Screen Entity
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Market Analysis Tab */}
      {activeTab === 6 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Comprehensive Market Analysis - Multiple APIs
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This combines trade data, country information, economic indicators, and currency rates
              to provide a comprehensive market analysis with scoring.
            </Typography>
            <Button
              variant="contained"
              onClick={handleMarketAnalysisDemo}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <TrendingUpIcon />}
            >
              Analyze Germany Electronics Market
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {results && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              API Results
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {renderResults()}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FreeAPIDemo;