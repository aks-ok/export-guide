import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  CssBaseline,
  ThemeProvider
} from '@mui/material';
import { exportRightTheme } from './theme/ExportRightTheme';
import EnhancedNavigation from './components/EnhancedNavigation';
import EnhancedHomePage from './components/EnhancedHomePage';
import BuyerDiscoveryPage from './pages/BuyerDiscoveryPage';
import QuotationPage from './pages/QuotationPage';
import IndianTradeOrgsPage from './pages/IndianTradeOrgsPage';
import SimpleLeadGenerationPage from './pages/SimpleLeadGenerationPage';
import SimpleMarketResearchPage from './pages/SimpleMarketResearchPage';
import SimpleExportCompliancePage from './pages/SimpleExportCompliancePage';
import FreeAPIDemo from './pages/FreeAPIDemo';
import EnhancedAPIDemo from './pages/EnhancedAPIDemo';
import { googleAnalyticsService } from './services/GoogleAnalyticsService';



function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // Track page views with Google Analytics
  useEffect(() => {
    googleAnalyticsService.trackPageView(`/${currentPage}`, getPageTitle(currentPage));
  }, [currentPage]);

  const getPageTitle = (page: string): string => {
    const titles: { [key: string]: string } = {
      'home': 'ExportRight - Home',
      'lead-generation': 'Lead Generation',
      'buyer-discovery': 'Buyer Discovery',
      'market-research': 'Market Research',
      'compliance': 'Export Compliance',
      'quotations': 'Quotations',
      'indian-trade-orgs': 'Indian Trade Organizations',
      'free-api-demo': 'Free API Demo',
      'enhanced-api-demo': 'Enhanced API Demo'
    };
    return titles[page] || 'ExportRight';
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'lead-generation':
        return <SimpleLeadGenerationPage />;
      case 'buyer-discovery':
        return <BuyerDiscoveryPage />;
      case 'market-research':
        return <SimpleMarketResearchPage />;
      case 'compliance':
        return <SimpleExportCompliancePage />;
      case 'quotation':
        return <QuotationPage />;
      case 'indian-trade-orgs':
        return <IndianTradeOrgsPage />;
      case 'free-api-demo':
        return <FreeAPIDemo />;
      case 'enhanced-api-demo':
        return <EnhancedAPIDemo />;
      default:
        return <EnhancedHomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <ThemeProvider theme={exportRightTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <EnhancedNavigation 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
        />
        <Box component="main" sx={{ flexGrow: 1 }}>
          {renderPage()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;