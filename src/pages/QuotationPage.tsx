import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Calculate as CalculateIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';

interface QuotationItem {
  id: string;
  product_name: string;
  hsn_code: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  total_amount: number;
}

interface Quotation {
  id?: number;
  quotation_number: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  customer_country: string;
  quotation_date: string;
  valid_until: string;
  currency: string;
  payment_terms: string;
  delivery_terms: string;
  items: QuotationItem[];
  subtotal: number;
  total_discount: number;
  total_tax: number;
  shipping_cost: number;
  grand_total: number;
  notes: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  created_at?: string;
}

// Common HSN codes for exports
const commonHSNCodes = [
  { code: '8471', description: 'Automatic data processing machines and units thereof' },
  { code: '8517', description: 'Telephone sets, including smartphones' },
  { code: '8528', description: 'Monitors and projectors' },
  { code: '8544', description: 'Insulated wire, cable and other electric conductors' },
  { code: '6203', description: 'Men\'s or boys\' suits, ensembles, jackets, blazers, trousers' },
  { code: '6204', description: 'Women\'s or girls\' suits, ensembles, jackets, blazers, dresses' },
  { code: '7113', description: 'Articles of jewellery and parts thereof' },
  { code: '0902', description: 'Tea, whether or not flavoured' },
  { code: '0906', description: 'Cinnamon and cinnamon-tree flowers' },
  { code: '1006', description: 'Rice' },
  { code: '5201', description: 'Cotton, not carded or combed' },
  { code: '8703', description: 'Motor cars and other motor vehicles' },
  { code: '8708', description: 'Parts and accessories of motor vehicles' },
  { code: '3004', description: 'Medicaments consisting of mixed or unmixed products' },
  { code: '2710', description: 'Petroleum oils and oils obtained from bituminous minerals' }
];

const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];
const units = ['Pieces', 'Kg', 'Tons', 'Meters', 'Liters', 'Boxes', 'Sets', 'Pairs'];

const QuotationPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [currentQuotation, setCurrentQuotation] = useState<Quotation>({
    quotation_number: `QT-${Date.now()}`,
    customer_name: '',
    customer_email: '',
    customer_address: '',
    customer_country: '',
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'USD',
    payment_terms: '30 days from invoice date',
    delivery_terms: 'FOB Mumbai Port',
    items: [],
    subtotal: 0,
    total_discount: 0,
    total_tax: 0,
    shipping_cost: 0,
    grand_total: 0,
    notes: '',
    status: 'draft'
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<QuotationItem>({
    id: '',
    product_name: '',
    hsn_code: '',
    description: '',
    quantity: 1,
    unit: 'Pieces',
    unit_price: 0,
    discount_percent: 0,
    tax_percent: 18, // Default GST rate
    total_amount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuotations();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [currentQuotation.items, currentQuotation.shipping_cost]);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.warn('Quotations table not found, checking localStorage:', error);
        
        // Check localStorage for saved quotations
        const localQuotations = JSON.parse(localStorage.getItem('exportright_quotations') || '[]');
        
        if (localQuotations.length > 0) {
          setQuotations(localQuotations);
          setError(null);
        } else {
          // Provide sample data when no data exists
          const sampleQuotations = [
            {
              id: 1,
              quotation_number: 'QT-2025-001',
              customer_name: 'Global Electronics Ltd',
              customer_email: 'procurement@globalelectronics.com',
              customer_address: '123 Business Street, Berlin, Germany',
              customer_country: 'Germany',
              quotation_date: new Date().toISOString().split('T')[0],
              valid_until: '2025-02-28',
              currency: 'EUR',
              payment_terms: 'Net 30',
              delivery_terms: 'FOB',
              items: [
                {
                  id: '1',
                  product_name: 'Microprocessors',
                  hsn_code: '85423100',
                  description: 'High-performance microprocessors',
                  quantity: 100,
                  unit: 'Pieces',
                  unit_price: 150.00,
                  discount_percent: 5,
                  tax_percent: 18,
                  total_amount: 16770.00
                }
              ],
              subtotal: 15000.00,
              total_discount: 750.00,
              total_tax: 2700.00,
              shipping_cost: 500.00,
              grand_total: 18200.00,
              notes: 'Bulk order for electronic components',
              status: 'sent' as const,
              created_at: new Date().toISOString()
            },
            {
              id: 2,
              quotation_number: 'QT-2025-002',
              customer_name: 'Tech Solutions Inc',
              customer_email: 'orders@techsolutions.com',
              customer_address: '456 Innovation Ave, San Francisco, CA, USA',
              customer_country: 'United States',
              quotation_date: new Date().toISOString().split('T')[0],
              valid_until: '2025-03-15',
              currency: 'USD',
              payment_terms: 'Net 15',
              delivery_terms: 'CIF',
              items: [
                {
                  id: '2',
                  product_name: 'Software License',
                  hsn_code: '85234900',
                  description: 'Enterprise software license',
                  quantity: 1,
                  unit: 'License',
                  unit_price: 25000.00,
                  discount_percent: 0,
                  tax_percent: 10,
                  total_amount: 27500.00
                }
              ],
              subtotal: 25000.00,
              total_discount: 0.00,
              total_tax: 2500.00,
              shipping_cost: 750.00,
              grand_total: 28250.00,
              notes: 'Custom software development project',
              status: 'draft' as const,
              created_at: new Date().toISOString()
            }
          ];
          setQuotations(sampleQuotations);
          setError(null);
        }
      } else {
        setQuotations(data || []);
      }
    } catch (err) {
      console.error('Error loading quotations:', err);
      setError('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const calculateItemTotal = (item: QuotationItem): number => {
    const baseAmount = item.quantity * item.unit_price;
    const discountAmount = baseAmount * (item.discount_percent / 100);
    const afterDiscount = baseAmount - discountAmount;
    const taxAmount = afterDiscount * (item.tax_percent / 100);
    return afterDiscount + taxAmount;
  };

  const calculateTotals = () => {
    const subtotal = currentQuotation.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    const totalDiscount = currentQuotation.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price * item.discount_percent / 100);
    }, 0);

    const totalTax = currentQuotation.items.reduce((sum, item) => {
      const afterDiscount = (item.quantity * item.unit_price) - (item.quantity * item.unit_price * item.discount_percent / 100);
      return sum + (afterDiscount * item.tax_percent / 100);
    }, 0);

    const grandTotal = subtotal - totalDiscount + totalTax + currentQuotation.shipping_cost;

    setCurrentQuotation(prev => ({
      ...prev,
      subtotal,
      total_discount: totalDiscount,
      total_tax: totalTax,
      grand_total: grandTotal
    }));
  };

  const addItem = () => {
    const itemWithTotal = {
      ...newItem,
      id: Date.now().toString(),
      total_amount: calculateItemTotal(newItem)
    };

    setCurrentQuotation(prev => ({
      ...prev,
      items: [...prev.items, itemWithTotal]
    }));

    setNewItem({
      id: '',
      product_name: '',
      hsn_code: '',
      description: '',
      quantity: 1,
      unit: 'Pieces',
      unit_price: 0,
      discount_percent: 0,
      tax_percent: 18,
      total_amount: 0
    });
    setDialogOpen(false);
  };

  const removeItem = (itemId: string) => {
    setCurrentQuotation(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const saveQuotation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!currentQuotation.customer_name.trim()) {
        throw new Error('Customer name is required');
      }
      if (!currentQuotation.customer_email.trim()) {
        throw new Error('Customer email is required');
      }
      if (currentQuotation.items.length === 0) {
        throw new Error('At least one item is required');
      }

      // Try to save to database
      const { data, error } = await supabase
        .from('quotations')
        .insert([{
          quotation_number: currentQuotation.quotation_number,
          customer_name: currentQuotation.customer_name,
          customer_email: currentQuotation.customer_email,
          customer_address: currentQuotation.customer_address,
          customer_country: currentQuotation.customer_country,
          quotation_date: currentQuotation.quotation_date,
          valid_until: currentQuotation.valid_until,
          currency: currentQuotation.currency,
          payment_terms: currentQuotation.payment_terms,
          delivery_terms: currentQuotation.delivery_terms,
          subtotal: currentQuotation.subtotal,
          total_discount: currentQuotation.total_discount,
          total_tax: currentQuotation.total_tax,
          shipping_cost: currentQuotation.shipping_cost,
          grand_total: currentQuotation.grand_total,
          notes: currentQuotation.notes,
          status: currentQuotation.status
        }])
        .select();

      if (error) {
        console.warn('Database save failed, saving locally:', error);
        // Save to localStorage as fallback
        const savedQuotations = JSON.parse(localStorage.getItem('exportright_quotations') || '[]');
        const newQuotation = { ...currentQuotation, id: Date.now() };
        savedQuotations.unshift(newQuotation);
        localStorage.setItem('exportright_quotations', JSON.stringify(savedQuotations.slice(0, 50))); // Keep last 50
        
        alert('Quotation saved locally! (Database unavailable)');
      } else {
        alert('Quotation saved successfully to database!');
      }

      await loadQuotations();
      resetQuotation();
    } catch (err: any) {
      console.error('Error saving quotation:', err);
      setError(err.message || 'Failed to save quotation');
      alert(`Error: ${err.message || 'Failed to save quotation'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetQuotation = () => {
    setCurrentQuotation({
      quotation_number: `QT-${Date.now()}`,
      customer_name: '',
      customer_email: '',
      customer_address: '',
      customer_country: '',
      quotation_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'USD',
      payment_terms: '30 days from invoice date',
      delivery_terms: 'FOB Mumbai Port',
      items: [],
      subtotal: 0,
      total_discount: 0,
      total_tax: 0,
      shipping_cost: 0,
      grand_total: 0,
      notes: '',
      status: 'draft'
    });
  };

  const generatePDF = () => {
    try {
      // Create PDF content as HTML string
      const pdfContent = generatePDFContent();
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Trigger print dialog
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
      
      alert('PDF generated! Use your browser\'s print dialog to save as PDF.');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const generatePDFContent = (): string => {
    const itemsHTML = currentQuotation.items.map(item => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.product_name}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.hsn_code || 'N/A'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.unit}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${item.unit_price.toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.discount_percent}%</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.tax_percent}%</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${calculateItemTotal(item).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation ${currentQuotation.quotation_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-info { margin-bottom: 20px; }
          .quotation-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .customer-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 10px; text-align: left; }
          .totals { text-align: right; margin-top: 20px; }
          .total-row { margin: 5px 0; }
          .grand-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 10px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EXPORT QUOTATION</h1>
          <h2>ExportRight Platform</h2>
        </div>
        
        <div class="company-info">
          <strong>From:</strong><br>
          ExportRight Platform<br>
          Export Solutions Provider<br>
          Email: info@exportright.com<br>
          Phone: +1-555-EXPORT
        </div>
        
        <div class="quotation-info">
          <div>
            <strong>Quotation #:</strong> ${currentQuotation.quotation_number}<br>
            <strong>Date:</strong> ${currentQuotation.quotation_date}<br>
            <strong>Valid Until:</strong> ${currentQuotation.valid_until}
          </div>
          <div>
            <strong>Currency:</strong> ${currentQuotation.currency}<br>
            <strong>Payment Terms:</strong> ${currentQuotation.payment_terms}<br>
            <strong>Delivery Terms:</strong> ${currentQuotation.delivery_terms}
          </div>
        </div>
        
        <div class="customer-info">
          <strong>To:</strong><br>
          ${currentQuotation.customer_name}<br>
          ${currentQuotation.customer_address}<br>
          ${currentQuotation.customer_country}<br>
          Email: ${currentQuotation.customer_email}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>HSN Code</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Unit Price</th>
              <th>Discount</th>
              <th>Tax</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-row">Subtotal: $${currentQuotation.subtotal.toFixed(2)}</div>
          <div class="total-row">Total Discount: -$${currentQuotation.total_discount.toFixed(2)}</div>
          <div class="total-row">Total Tax: $${currentQuotation.total_tax.toFixed(2)}</div>
          <div class="total-row">Shipping: $${currentQuotation.shipping_cost.toFixed(2)}</div>
          <div class="total-row grand-total">Grand Total: $${currentQuotation.grand_total.toFixed(2)}</div>
        </div>
        
        ${currentQuotation.notes ? `
        <div style="margin-top: 30px;">
          <strong>Notes:</strong><br>
          ${currentQuotation.notes}
        </div>
        ` : ''}
        
        <div style="margin-top: 40px; text-align: center; color: #666;">
          <p>Thank you for your business!</p>
          <p>This quotation is valid until ${currentQuotation.valid_until}</p>
        </div>
      </body>
      </html>
    `;
  };

  const sendEmail = async () => {
    try {
      setLoading(true);
      
      // Use EmailJS (free email service) or Web3Forms
      const emailData = {
        to_email: currentQuotation.customer_email,
        customer_name: currentQuotation.customer_name,
        quotation_number: currentQuotation.quotation_number,
        quotation_date: currentQuotation.quotation_date,
        grand_total: currentQuotation.grand_total.toFixed(2),
        currency: currentQuotation.currency,
        valid_until: currentQuotation.valid_until,
        items_summary: currentQuotation.items.map(item => 
          `${item.product_name} (${item.quantity} ${item.unit}) - $${calculateItemTotal(item).toFixed(2)}`
        ).join('\n'),
        notes: currentQuotation.notes || 'No additional notes'
      };

      // Using Web3Forms (free email service)
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: 'YOUR_WEB3FORMS_KEY', // You can get this free from web3forms.com
          subject: `Quotation ${currentQuotation.quotation_number} from ExportRight`,
          from_name: 'ExportRight Platform',
          from_email: 'noreply@exportright.com',
          to: currentQuotation.customer_email,
          message: `
Dear ${emailData.customer_name},

Please find your quotation details below:

Quotation Number: ${emailData.quotation_number}
Date: ${emailData.quotation_date}
Total Amount: ${emailData.currency} ${emailData.grand_total}
Valid Until: ${emailData.valid_until}

Items:
${emailData.items_summary}

${emailData.notes ? `Notes: ${emailData.notes}` : ''}

Thank you for your interest in our products.

Best regards,
ExportRight Team
          `
        })
      });

      if (response.ok) {
        alert(`Quotation sent successfully to ${currentQuotation.customer_email}!`);
        
        // Update quotation status to 'sent'
        setCurrentQuotation(prev => ({ ...prev, status: 'sent' }));
      } else {
        throw new Error('Email service unavailable');
      }
      
    } catch (error) {
      console.error('Email sending error:', error);
      
      // Fallback: Open default email client
      const subject = encodeURIComponent(`Quotation ${currentQuotation.quotation_number} from ExportRight`);
      const body = encodeURIComponent(`
Dear ${currentQuotation.customer_name},

Please find your quotation details below:

Quotation Number: ${currentQuotation.quotation_number}
Date: ${currentQuotation.quotation_date}
Total Amount: ${currentQuotation.currency} ${currentQuotation.grand_total.toFixed(2)}
Valid Until: ${currentQuotation.valid_until}

Items:
${currentQuotation.items.map(item => 
  `${item.product_name} (${item.quantity} ${item.unit}) - $${calculateItemTotal(item).toFixed(2)}`
).join('\n')}

${currentQuotation.notes ? `Notes: ${currentQuotation.notes}` : ''}

Thank you for your interest in our products.

Best regards,
ExportRight Team
      `);
      
      const mailtoLink = `mailto:${currentQuotation.customer_email}?subject=${subject}&body=${body}`;
      window.open(mailtoLink);
      
      alert('Opening your default email client. Please send the email manually.');
    } finally {
      setLoading(false);
    }
  };

  const printQuotation = () => {
    try {
      const printContent = generatePDFContent();
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to print quotation. Please try again.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Export Quotation Generator
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Quotation Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Create New Quotation
          </Typography>

          <Grid container spacing={3}>
            {/* Customer Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Customer Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={currentQuotation.customer_name}
                onChange={(e) => setCurrentQuotation(prev => ({ ...prev, customer_name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Email"
                type="email"
                value={currentQuotation.customer_email}
                onChange={(e) => setCurrentQuotation(prev => ({ ...prev, customer_email: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Address"
                multiline
                rows={2}
                value={currentQuotation.customer_address}
                onChange={(e) => setCurrentQuotation(prev => ({ ...prev, customer_address: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Country"
                value={currentQuotation.customer_country}
                onChange={(e) => setCurrentQuotation(prev => ({ ...prev, customer_country: e.target.value }))}
              />
            </Grid>

            {/* Quotation Details */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Quotation Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Quotation Number"
                value={currentQuotation.quotation_number}
                onChange={(e) => setCurrentQuotation(prev => ({ ...prev, quotation_number: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Quotation Date"
                type="date"
                value={currentQuotation.quotation_date}
                onChange={(e) => setCurrentQuotation(prev => ({ ...prev, quotation_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Valid Until"
                type="date"
                value={currentQuotation.valid_until}
                onChange={(e) => setCurrentQuotation(prev => ({ ...prev, valid_until: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={currentQuotation.currency}
                  onChange={(e) => setCurrentQuotation(prev => ({ ...prev, currency: e.target.value }))}
                  label="Currency"
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Payment Terms"
                value={currentQuotation.payment_terms}
                onChange={(e) => setCurrentQuotation(prev => ({ ...prev, payment_terms: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Delivery Terms"
                value={currentQuotation.delivery_terms}
                onChange={(e) => setCurrentQuotation(prev => ({ ...prev, delivery_terms: e.target.value }))}
              />
            </Grid>
          </Grid>

          {/* Items Section */}
          <Box sx={{ mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">
                Quotation Items
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
              >
                Add Item
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell>HSN Code</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Unit Price</TableCell>
                    <TableCell>Discount %</TableCell>
                    <TableCell>Tax %</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentQuotation.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>
                        <Chip label={item.hsn_code} size="small" color="primary" />
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{currentQuotation.currency} {item.unit_price.toFixed(2)}</TableCell>
                      <TableCell>{item.discount_percent}%</TableCell>
                      <TableCell>{item.tax_percent}%</TableCell>
                      <TableCell>{currentQuotation.currency} {calculateItemTotal(item).toFixed(2)}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeItem(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {currentQuotation.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No items added. Click "Add Item" to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Totals Section */}
          {currentQuotation.items.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Shipping Cost"
                    type="number"
                    value={currentQuotation.shipping_cost}
                    onChange={(e) => setCurrentQuotation(prev => ({
                      ...prev,
                      shipping_cost: parseFloat(e.target.value) || 0
                    }))}
                    InputProps={{
                      startAdornment: currentQuotation.currency
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={2}
                    value={currentQuotation.notes}
                    onChange={(e) => setCurrentQuotation(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </Grid>
              </Grid>

              <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography>Subtotal:</Typography>
                  </Grid>
                  <Grid item xs={6} textAlign="right">
                    <Typography>{currentQuotation.currency} {currentQuotation.subtotal.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>Total Discount:</Typography>
                  </Grid>
                  <Grid item xs={6} textAlign="right">
                    <Typography color="error">-{currentQuotation.currency} {currentQuotation.total_discount.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>Total Tax:</Typography>
                  </Grid>
                  <Grid item xs={6} textAlign="right">
                    <Typography>{currentQuotation.currency} {currentQuotation.total_tax.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>Shipping:</Typography>
                  </Grid>
                  <Grid item xs={6} textAlign="right">
                    <Typography>{currentQuotation.currency} {currentQuotation.shipping_cost.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h6">Grand Total:</Typography>
                  </Grid>
                  <Grid item xs={6} textAlign="right">
                    <Typography variant="h6" color="primary">
                      {currentQuotation.currency} {currentQuotation.grand_total.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}

          {/* Action Buttons */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={saveQuotation}
              disabled={loading || !currentQuotation.customer_name || currentQuotation.items.length === 0}
            >
              Save Quotation
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={generatePDF}
              disabled={currentQuotation.items.length === 0}
            >
              Download PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={sendEmail}
              disabled={currentQuotation.items.length === 0 || !currentQuotation.customer_email}
            >
              Send Email
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={printQuotation}
              disabled={currentQuotation.items.length === 0}
            >
              Print
            </Button>
            <Button
              variant="text"
              onClick={resetQuotation}
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Quotation Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={newItem.product_name}
                onChange={(e) => setNewItem(prev => ({ ...prev, product_name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={commonHSNCodes}
                getOptionLabel={(option) => `${option.code} - ${option.description}`}
                renderInput={(params) => (
                  <TextField {...params} label="HSN Code" required />
                )}
                onChange={(_, value) => {
                  setNewItem(prev => ({
                    ...prev,
                    hsn_code: value?.code || '',
                    description: value?.description || prev.description
                  }));
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={newItem.unit}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                  label="Unit"
                >
                  {units.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Unit Price"
                type="number"
                value={newItem.unit_price}
                onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Discount %"
                type="number"
                value={newItem.discount_percent}
                onChange={(e) => setNewItem(prev => ({ ...prev, discount_percent: parseFloat(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tax % (GST/VAT)"
                type="number"
                value={newItem.tax_percent}
                onChange={(e) => setNewItem(prev => ({ ...prev, tax_percent: parseFloat(e.target.value) || 0 }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={addItem}
            variant="contained"
            disabled={!newItem.product_name || !newItem.hsn_code || newItem.unit_price <= 0}
          >
            Add Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuotationPage;