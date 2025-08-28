import React, { useState, useEffect } from 'react';
import {
  Box,
  CssBaseline,
  ThemeProvider,
  CircularProgress,
  Typography,
  Button,
  Paper,
  Container,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { exportGuideTheme } from './theme/ExportGuideTheme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
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
import { initializeServices } from './services';
import { initializeApiServices } from './services/api';
import { colorPalette, getGradientBackground } from './theme/ExportGuideTheme';



// Loading component
const LoadingScreen: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: getGradientBackground('135deg'),
    }}
  >
    <TrendingUpIcon sx={{ fontSize: 64, color: 'white', mb: 2 }} />
    <Typography variant="h4" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
      ExportGuide
    </Typography>
    <CircularProgress sx={{ color: 'white' }} />
    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 2 }}>
      Loading your export intelligence platform...
    </Typography>
  </Box>
);

// Login screen component
const LoginScreen: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: getGradientBackground('135deg'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 4,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <TrendingUpIcon sx={{ fontSize: 80, color: colorPalette.primary.main, mb: 3 }} />
          
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: colorPalette.primary.main,
              mb: 2,
              letterSpacing: '-0.5px',
            }}
          >
            Welcome to ExportGuide
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              color: colorPalette.neutral[600],
              mb: 4,
              fontWeight: 400,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Your comprehensive export business intelligence platform. Access real-time market data, 
            discover buyers, generate leads, and ensure compliance - all in one place.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={() => setAuthModalOpen(true)}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
              }}
            >
              Sign In to Continue
            </Button>
          </Box>

          <Box sx={{ mt: 4, pt: 4, borderTop: `1px solid ${colorPalette.neutral[200]}` }}>
            <Typography variant="body2" sx={{ color: colorPalette.neutral[500] }}>
              New to ExportGuide? Create an account to get started with your export journey.
            </Typography>
          </Box>
        </Paper>
      </Container>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={() => setAuthModalOpen(false)}
      />
    </Box>
  );
};

// Main app component with authentication
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');

  // Initialize services on app startup
  useEffect(() => {
    initializeServices();
    initializeApiServices();
  }, []);

  // Track page views with Google Analytics
  useEffect(() => {
    if (user) {
      googleAnalyticsService.trackPageView(`/${currentPage}`, getPageTitle(currentPage));
    }
  }, [currentPage, user]);

  const getPageTitle = (page: string): string => {
    const titles: { [key: string]: string } = {
      'home': 'ExportGuide - Home',
      'lead-generation': 'Lead Generation',
      'buyer-discovery': 'Buyer Discovery',
      'market-research': 'Market Research',
      'compliance': 'Export Compliance',
      'quotations': 'Quotations',
      'indian-trade-orgs': 'Indian Trade Organizations',
      'free-api-demo': 'Free API Demo',
      'enhanced-api-demo': 'Enhanced API Demo'
    };
    return titles[page] || 'ExportGuide';
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

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Show login screen if user is not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  // Show main app if user is authenticated
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <EnhancedNavigation 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
      />
      <Box component="main" sx={{ flexGrow: 1 }}>
        {renderPage()}
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={exportGuideTheme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;