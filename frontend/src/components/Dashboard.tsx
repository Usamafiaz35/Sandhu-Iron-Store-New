import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  DollarSign, 
  Search, 
  X, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  UserPlus,
  PlusCircle
} from 'lucide-react';


interface Customer {
  id: number;
  customer_name: string;
  phone_number: string | null;
  address: string | null;
  reference_name: string | null;
  created_at: string;
  total_purchases?: number;
  total_paid?: number;
  balance?: number;
}

interface Transaction {
  id: number;
  customer_id: number;
  purchase_item: string;
  additional_note: string | null;
  total_amount: number;
  paid_amount: number;
  purchase_date: string;
  created_at: string;
  customer_name?: string;
}

interface DashboardSummary {
  total_customers: number;
  total_sales: number;
  total_payments: number;
  total_pending: number;
  recent_customers: Customer[];
  recent_transactions: Transaction[];
  available_years?: number[];
}

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

interface DashboardProps {
  username: string;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ username, onLogout }) => {
  const [currentTab, setCurrentTab] = useState<'overview' | 'customers' | 'transaction'>('overview');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Year and Month filter states
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  const availableYears = summary?.available_years && summary.available_years.length > 0
    ? summary.available_years
    : [new Date().getFullYear()];
  
  const isFiltered = !!(selectedYear && selectedMonth);
  
  const getPeriodLabel = () => {
    if (selectedYear && selectedMonth) {
      const mObj = MONTHS.find(m => m.value === selectedMonth);
      return `${mObj?.label} ${selectedYear}`;
    }
    if (selectedYear) {
      return `Year ${selectedYear}`;
    }
    if (selectedMonth) {
      const mObj = MONTHS.find(m => m.value === selectedMonth);
      return `${mObj?.label}`;
    }
    return 'Overall';
  };
  
  const periodLabel = getPeriodLabel();
  
  // Modals state
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerLedger, setCustomerLedger] = useState<Transaction[]>([]);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  
  // Form States
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerReference, setNewCustomerReference] = useState('');
  
  const [ledgerType, setLedgerType] = useState<'purchase' | 'payment'>('purchase');
  const [ledgerItem, setLedgerItem] = useState('');
  const [ledgerTotalAmount, setLedgerTotalAmount] = useState('');
  const [ledgerPaidAmount, setLedgerPaidAmount] = useState('');
  const [ledgerDate, setLedgerDate] = useState(new Date().toISOString().split('T')[0]);
  const [ledgerNote, setLedgerNote] = useState('');
  
  // New Transaction Form States
  const [txCustomerId, setTxCustomerId] = useState('');
  const [txType, setTxType] = useState<'purchase' | 'payment'>('purchase');
  const [txItem, setTxItem] = useState('');
  const [txTotalAmount, setTxTotalAmount] = useState('');
  const [txPaidAmount, setTxPaidAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNote, setTxNote] = useState('');
  const [txSuccessMsg, setTxSuccessMsg] = useState<string | null>(null);
  const [txErrorMsg, setTxErrorMsg] = useState<string | null>(null);
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial summary data
  const fetchSummary = async (year?: string, month?: string) => {
    try {
      const token = localStorage.getItem('token');
      let url = '/api/dashboard';
      const queryParams: string[] = [];
      if (year) queryParams.push(`year=${year}`);
      if (month) queryParams.push(`month=${month}`);
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load dashboard data');
      const data = await response.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard metrics.');
    }
  };

  // Fetch customers with their balance
  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customers-with-balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch customers list');
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    await Promise.all([fetchSummary(selectedYear, selectedMonth), fetchCustomers()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Only fetch summary when summary has already been loaded initially and filters change
    if (summary !== null) {
      fetchSummary(selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth]);

  // Filter customers by search query
  const filteredCustomers = customers.filter(c => 
    c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone_number && c.phone_number.includes(searchQuery)) ||
    (c.reference_name && c.reference_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle Add Customer
  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName) return;

    setIsModalSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_name: newCustomerName,
          phone_number: newCustomerPhone || null,
          address: newCustomerAddress || null,
          reference_name: newCustomerReference || null
        })
      });

      const data = await response.json();
      if (data.success) {
        // Reset and close
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerAddress('');
        setNewCustomerReference('');
        setIsAddCustomerOpen(false);
        // Refresh
        await loadData();
      } else {
        alert(data.message || 'Failed to add customer');
      }
    } catch (err) {
      alert('Error creating customer record.');
    } finally {
      setIsModalSubmitting(false);
    }
  };

  // Handle opening a customer's ledger
  const handleOpenLedger = async (customer: Customer) => {
    setSelectedCustomer(customer);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ledger/${customer.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCustomerLedger(data.data);
      }
    } catch (err) {
      console.error('Error fetching ledger details:', err);
    }
  };

  // Handle adding a ledger entry (Purchase or Payment)
  const handleAddLedgerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !ledgerItem) return;

    setIsModalSubmitting(true);
    
    // Format amounts
    const totalAmount = ledgerType === 'purchase' ? parseFloat(ledgerTotalAmount || '0') : 0;
    const paidAmount = ledgerType === 'payment' 
      ? parseFloat(ledgerPaidAmount || '0') 
      : parseFloat(ledgerPaidAmount || '0'); // Allow cash downpayment on purchase

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          purchase_item: ledgerItem,
          total_amount: totalAmount,
          purchase_date: ledgerDate,
          additional_note: ledgerNote || null,
          paid_amount: paidAmount
        })
      });

      const data = await response.json();
      if (data.success) {
        // Clear inputs
        setLedgerItem('');
        setLedgerTotalAmount('');
        setLedgerPaidAmount('');
        setLedgerNote('');
        
        setIsAddEntryOpen(false); // Close the entry sub-modal
        
        // Refresh Ledger history and Summary info
        await handleOpenLedger(selectedCustomer);
        await loadData();
      } else {
        alert(data.message || 'Failed to submit entry');
      }
    } catch (err) {
      alert('Error submitting ledger transaction.');
    } finally {
      setIsModalSubmitting(false);
    }
  };

  // Handle standalone transaction submission
  const handleNewTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txCustomerId || !txItem) return;

    setIsModalSubmitting(true);
    setTxSuccessMsg(null);
    setTxErrorMsg(null);

    // Format amounts
    const totalAmount = txType === 'purchase' ? parseFloat(txTotalAmount || '0') : 0;
    const paidAmount = txType === 'payment'
      ? parseFloat(txPaidAmount || '0')
      : parseFloat(txPaidAmount || '0'); // Allow cash downpayment on purchase

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_id: parseInt(txCustomerId, 10),
          purchase_item: txItem,
          total_amount: totalAmount,
          purchase_date: txDate,
          additional_note: txNote || null,
          paid_amount: paidAmount
        })
      });

      const data = await response.json();
      if (data.success) {
        // Clear inputs, keep type and date as convenience
        setTxCustomerId('');
        setTxItem(txType === 'payment' ? 'Cash Received' : '');
        setTxTotalAmount('');
        setTxPaidAmount('');
        setTxNote('');
        setTxSuccessMsg('Transaction recorded successfully!');
        
        // Refresh global dashboard data
        await loadData();
      } else {
        setTxErrorMsg(data.message || 'Failed to submit transaction');
      }
    } catch (err) {
      setTxErrorMsg('Error submitting transaction.');
    } finally {
      setIsModalSubmitting(false);
    }
  };

  // Handle deleting a ledger entry
  const handleDeleteLedgerEntry = async (ledgerId: number) => {
    if (!confirm('Are you sure you want to delete this transaction record?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ledger/${ledgerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        if (selectedCustomer) {
          await handleOpenLedger(selectedCustomer);
        }
        await loadData();
      } else {
        alert(data.message || 'Failed to delete record');
      }
    } catch (err) {
      alert('Error deleting ledger item.');
    }
  };

  // Handle deleting a customer
  const handleDeleteCustomer = async (customerId: number, customerName: string) => {
    if (!confirm(`WARNING: Deleting "${customerName}" will permanently remove all their transaction ledgers. Do you want to proceed?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedCustomer(null);
        await loadData();
      } else {
        alert(data.message || 'Failed to delete customer');
      }
    } catch (err) {
      alert('Error deleting customer.');
    }
  };

  // Format currency in Rupees
  const formatRs = (value: number) => {
    return 'Rs. ' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format Date strings
  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (isLoading && !summary) {
    return (
      <div className="auth-wrapper">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
          <span className="spinner" style={{ width: '40px', height: '40px', borderColor: 'var(--border-color)', borderTopColor: 'var(--primary)', marginBottom: '16px' }}></span>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading Portal Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <nav className="nav">
        <div className="nav-brand">
          <LayoutDashboard size={22} className="text-primary" />
          <span>Sindhu Iron Store</span>
        </div>
        <div className="nav-user">
          <div className="user-badge">
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
            <span>{username}</span>
          </div>
          <button onClick={onLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogOut size={15} />
              Logout
            </span>
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Real-time balances, accounts, and inventory invoices.</p>
        </header>

        {/* Navigation Tabs */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setCurrentTab('overview'); setTxSuccessMsg(null); setTxErrorMsg(null); }}
          >
            <LayoutDashboard size={16} />
            Overview
          </button>
          <button 
            className={`tab-btn ${currentTab === 'customers' ? 'active' : ''}`}
            onClick={() => { setCurrentTab('customers'); setTxSuccessMsg(null); setTxErrorMsg(null); }}
          >
            <Users size={16} />
            Customers
          </button>
          <button 
            className={`tab-btn ${currentTab === 'transaction' ? 'active' : ''}`}
            onClick={() => { setCurrentTab('transaction'); setTxSuccessMsg(null); setTxErrorMsg(null); }}
          >
            <PlusCircle size={16} />
            New Transaction
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* -------------------- OVERVIEW TAB -------------------- */}
        {currentTab === 'overview' && summary && (
          <>
            {/* Period Filter Bar */}
            <div className="filter-bar" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '24px',
              gap: '16px',
              flexWrap: 'wrap',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                  Filter by Period:
                </div>
                {/* Year Dropdown */}
                <select
                  className="form-input"
                  style={{ width: '130px', padding: '8px 12px', paddingLeft: '12px', fontSize: '14px', margin: 0, height: '38px' }}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">All Years</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={yr.toString()}>{yr}</option>
                  ))}
                </select>
                {/* Month Dropdown */}
                <select
                  className="form-input"
                  style={{ width: '140px', padding: '8px 12px', paddingLeft: '12px', fontSize: '14px', margin: 0, height: '38px' }}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">All Months</option>
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              {(selectedYear || selectedMonth) && (
                <button 
                  onClick={() => { setSelectedYear(''); setSelectedMonth(''); }}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '13px', height: '38px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <X size={14} />
                  Clear Filters
                </button>
              )}
            </div>

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Total Customers</span>
                  <div className="stat-icon"><Users size={20} /></div>
                </div>
                <div className="stat-value">{summary.total_customers}</div>
                <div className="stat-label" style={{ color: 'var(--success)', fontSize: '13px', fontWeight: 500 }}>
                  Active profiles
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">{isFiltered ? `Sales (${periodLabel})` : "Total Sales"}</span>
                  <div className="stat-icon"><ArrowUpRight size={20} /></div>
                </div>
                <div className="stat-value" style={{ fontSize: '24px' }}>{formatRs(summary.total_sales)}</div>
                <div className="stat-label" style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: 500 }}>
                  {isFiltered ? "Period sales volume" : "Overall invoice volume"}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">{isFiltered ? `Payments (${periodLabel})` : "Payments Received"}</span>
                  <div className="stat-icon"><ArrowDownLeft size={20} /></div>
                </div>
                <div className="stat-value" style={{ fontSize: '24px' }}>{formatRs(summary.total_payments)}</div>
                <div className="stat-label" style={{ color: 'var(--success)', fontSize: '13px', fontWeight: 500 }}>
                  {isFiltered ? "Period cash collected" : "Cash collected"}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">{isFiltered ? `Period Net Balance` : "Pending Balance"}</span>
                  <div className="stat-icon"><DollarSign size={20} /></div>
                </div>
                <div className="stat-value" style={{ 
                  fontSize: '24px', 
                  color: summary.total_pending > 0 ? 'var(--error)' : summary.total_pending < 0 ? 'var(--success)' : 'var(--text-primary)' 
                }}>
                  {formatRs(summary.total_pending)}
                </div>
                <div className="stat-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  {isFiltered ? "Sales minus payments" : "Receivables"}
                </div>
              </div>
            </section>

            <div className="dashboard-grid">
              {/* Recent Customers Card */}
              <div className="panel-card">
                <h3 className="panel-title">
                  <Users size={18} className="text-primary" />
                  Recent Customers
                </h3>
                {summary.recent_customers.length === 0 ? (
                  <div className="dummy-placeholder" style={{ padding: '24px' }}>
                    <p style={{ fontSize: '14px' }}>No customers added yet.</p>
                  </div>
                ) : (
                  <div className="list-group">
                    {summary.recent_customers.map(c => (
                      <div key={c.id} className="list-item clickable-row" onClick={() => { setCurrentTab('customers'); handleOpenLedger(c); }}>
                        <div>
                          <div className="list-item-title">{c.customer_name}</div>
                          <div className="list-item-subtitle">{c.phone_number || 'No Phone'}</div>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {formatDate(c.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Transactions Card */}
              <div className="panel-card">
                <h3 className="panel-title">
                  <BookOpen size={18} className="text-primary" />
                  Recent Transactions
                </h3>
                {summary.recent_transactions.length === 0 ? (
                  <div className="dummy-placeholder" style={{ padding: '24px' }}>
                    <p style={{ fontSize: '14px' }}>No entries created yet.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="app-table">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Item</th>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.recent_transactions.map(t => (
                          <tr key={t.id}>
                            <td style={{ fontWeight: 500 }}>{t.customer_name}</td>
                            <td>
                              <span className={`badge ${t.total_amount > 0 ? 'badge-purchase' : 'badge-payment'}`} style={{ marginRight: '6px' }}>
                                {t.total_amount > 0 ? 'Sale' : 'Payment'}
                              </span>
                              {t.purchase_item}
                            </td>
                            <td>{formatDate(t.purchase_date)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }} className={t.total_amount > 0 ? 'text-primary' : 'text-success'}>
                              {t.total_amount > 0 ? formatRs(t.total_amount) : formatRs(t.paid_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* -------------------- CUSTOMERS TAB -------------------- */}
        {currentTab === 'customers' && (
          <div className="panel-card">
            <div className="toolbar">
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search customer by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="search-icon"><Search size={18} /></span>
              </div>
              <button onClick={() => setIsAddCustomerOpen(true)} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
                <UserPlus size={16} />
                Add New Customer
              </button>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="dummy-placeholder">
                <Users size={36} className="placeholder-icon" />
                <p>No customers found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Phone Number</th>
                      <th>Reference Name</th>
                      <th style={{ textAlign: 'right' }}>Total Purchases</th>
                      <th style={{ textAlign: 'right' }}>Total Paid</th>
                      <th style={{ textAlign: 'right' }}>Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map(c => (
                      <tr key={c.id} className="clickable-row" onClick={() => handleOpenLedger(c)}>
                        <td style={{ fontWeight: 600 }}>{c.customer_name}</td>
                        <td>{c.phone_number || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                        <td>{c.reference_name || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatRs(c.total_purchases || 0)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--success)' }}>{formatRs(c.total_paid || 0)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }} className="text-danger">
                          {formatRs(c.balance || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* -------------------- NEW TRANSACTION TAB -------------------- */}
        {currentTab === 'transaction' && (
          <div className="panel-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 className="panel-title">
              <PlusCircle size={18} className="text-primary" />
              Record New Transaction
            </h3>

            {txSuccessMsg && (
              <div className="alert alert-success">
                <span>{txSuccessMsg}</span>
              </div>
            )}

            {txErrorMsg && (
              <div className="alert alert-error">
                <span>{txErrorMsg}</span>
              </div>
            )}

            {/* Form type toggler */}
            <div style={{ display: 'flex', gap: '4px', padding: '3px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', marginBottom: '20px' }}>
              <button
                type="button"
                style={{ flex: 1, padding: '8px 12px', fontSize: '14px', justifyContent: 'center', margin: 0 }}
                onClick={() => { setTxType('purchase'); setTxItem(''); setTxSuccessMsg(null); setTxErrorMsg(null); }}
                className={txType === 'purchase' ? 'tab-btn active' : 'tab-btn'}
              >
                Sale Entry
              </button>
              <button
                type="button"
                style={{ flex: 1, padding: '8px 12px', fontSize: '14px', justifyContent: 'center', margin: 0 }}
                onClick={() => { setTxType('payment'); setTxItem('Cash Received'); setTxSuccessMsg(null); setTxErrorMsg(null); }}
                className={txType === 'payment' ? 'tab-btn active' : 'tab-btn'}
              >
                Receive Cash
              </button>
            </div>

            <form onSubmit={handleNewTransactionSubmit}>
              {/* 1. Select Customer */}
              <div className="form-group">
                <label className="form-label" htmlFor="txCustomerSelect">Select Customer *</label>
                <select
                  id="txCustomerSelect"
                  className="form-input"
                  style={{ paddingLeft: '16px' }}
                  value={txCustomerId}
                  onChange={(e) => setTxCustomerId(e.target.value)}
                  required
                  disabled={isModalSubmitting}
                >
                  <option value="">-- Select a Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.customer_name} {c.phone_number ? `(${c.phone_number})` : ''} {c.balance !== undefined && c.balance !== 0 ? `| Bal: ${formatRs(c.balance)}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Transaction Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="txDateVal">Transaction Date *</label>
                <input
                  id="txDateVal"
                  type="date"
                  className="form-input"
                  style={{ paddingLeft: '16px' }}
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  required
                  disabled={isModalSubmitting}
                />
              </div>

              {/* 3. Purchase item */}
              <div className="form-group">
                <label className="form-label" htmlFor="txItemVal">
                  {txType === 'purchase' ? 'Purchase item *' : 'Payment Mode *'}
                </label>
                <input
                  id="txItemVal"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '16px' }}
                  placeholder={txType === 'purchase' ? "e.g. Sariya 40 Grade 12mm" : "e.g. Cash / Bank Transfer"}
                  value={txItem}
                  onChange={(e) => setTxItem(e.target.value)}
                  required
                  disabled={isModalSubmitting}
                />
              </div>

              {/* 4. Detail of purchase item (optional) */}
              <div className="form-group">
                <label className="form-label" htmlFor="txNoteVal">
                  {txType === 'purchase' ? 'Detail of purchase item (optional)' : 'Remarks (Optional)'}
                </label>
                <textarea
                  id="txNoteVal"
                  className="form-input"
                  style={{ paddingLeft: '16px', height: '80px', resize: 'none' }}
                  placeholder="Additional details..."
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  disabled={isModalSubmitting}
                />
              </div>

              {/* 5 & 6. Total Amount & Paid Amount (optional) */}
              {txType === 'purchase' ? (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="txTotal">Total Amount *</label>
                    <input
                      id="txTotal"
                      type="number"
                      step="0.01"
                      className="form-input"
                      style={{ paddingLeft: '16px' }}
                      placeholder="0.00"
                      value={txTotalAmount}
                      onChange={(e) => setTxTotalAmount(e.target.value)}
                      required
                      disabled={isModalSubmitting}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="txPaid">Paid Amount (optional)</label>
                    <input
                      id="txPaid"
                      type="number"
                      step="0.01"
                      className="form-input"
                      style={{ paddingLeft: '16px' }}
                      placeholder="0.00"
                      value={txPaidAmount}
                      onChange={(e) => setTxPaidAmount(e.target.value)}
                      disabled={isModalSubmitting}
                    />
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label className="form-label" htmlFor="txPaidCollected">Amount Collected (Rs.) *</label>
                  <input
                    id="txPaidCollected"
                    type="number"
                    step="0.01"
                    className="form-input"
                    style={{ paddingLeft: '16px' }}
                    placeholder="0.00"
                    value={txPaidAmount}
                    onChange={(e) => setTxPaidAmount(e.target.value)}
                    required
                    disabled={isModalSubmitting}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setCurrentTab('overview');
                    setTxSuccessMsg(null);
                    setTxErrorMsg(null);
                  }} 
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={isModalSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isModalSubmitting}
                >
                  {isModalSubmitting ? 'Recording...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* -------------------- MODAL: ADD CUSTOMER -------------------- */}
      {isAddCustomerOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Create Customer Record</h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="custName">Customer Name *</label>
                <input
                  id="custName"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '16px' }}
                  placeholder="e.g. Usama Riaz"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  required
                  disabled={isModalSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="custPhone">Phone Number</label>
                <input
                  id="custPhone"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '16px' }}
                  placeholder="e.g. +92 300 1234567"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  disabled={isModalSubmitting}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="custRef">Reference Person</label>
                  <input
                    id="custRef"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '16px' }}
                    placeholder="e.g. Asif Bhai"
                    value={newCustomerReference}
                    onChange={(e) => setNewCustomerReference(e.target.value)}
                    disabled={isModalSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="custAddress">Location/Address</label>
                  <input
                    id="custAddress"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '16px' }}
                    placeholder="e.g. Gulberg III, Lahore"
                    value={newCustomerAddress}
                    onChange={(e) => setNewCustomerAddress(e.target.value)}
                    disabled={isModalSubmitting}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddCustomerOpen(false)} 
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={isModalSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isModalSubmitting}
                >
                  {isModalSubmitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: CUSTOMER LEDGER DETAIL -------------------- */}
      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '840px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ fontSize: '22px' }}>{selectedCustomer.customer_name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {selectedCustomer.phone_number ? `Phone: ${selectedCustomer.phone_number} | ` : ''}
                  {selectedCustomer.address ? `Address: ${selectedCustomer.address} | ` : ''}
                  {selectedCustomer.reference_name ? `Ref: ${selectedCustomer.reference_name}` : ''}
                </p>
              </div>
              <button onClick={() => { setSelectedCustomer(null); setIsAddEntryOpen(false); }} className="modal-close">
                <X size={22} />
              </button>
            </div>

            {/* Ledger metrics header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Purchase</span>
                <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>
                  {formatRs(selectedCustomer.total_purchases || 0)}
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Payments</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>
                  {formatRs(selectedCustomer.total_paid || 0)}
                </div>
              </div>
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <span style={{ fontSize: '12px', color: 'var(--error)', fontWeight: 600 }}>Due Balance</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--error)', marginTop: '4px' }}>
                  {formatRs(selectedCustomer.balance || 0)}
                </div>
              </div>
            </div>

            {/* Full-width Layout for Purchase History */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Purchase History</h4>
                <button
                  type="button"
                  onClick={() => {
                    setLedgerType('purchase');
                    setLedgerItem('');
                    setLedgerTotalAmount('');
                    setLedgerPaidAmount('');
                    setLedgerNote('');
                    setIsAddEntryOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  <PlusCircle size={14} />
                  Add Entry
                </button>
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '380px', minHeight: '200px', marginBottom: '16px' }}>
                {customerLedger.length === 0 ? (
                  <div className="dummy-placeholder" style={{ padding: '40px 10px' }}>
                    <BookOpen size={24} className="placeholder-icon" />
                    <p style={{ fontSize: '13px' }}>No transactions recorded for this customer.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="app-table" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Note</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                          <th style={{ textAlign: 'right' }}>Paid</th>
                          <th style={{ textAlign: 'right' }}>Remaining</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerLedger.map(item => {
                          const remaining = item.total_amount - item.paid_amount;
                          return (
                            <tr key={item.id}>
                              <td>{formatDate(item.purchase_date)}</td>
                              <td style={{ fontWeight: 600 }}>{item.purchase_item}</td>
                              <td style={{ color: item.additional_note ? 'inherit' : 'var(--text-muted)' }}>
                                {item.additional_note || '-'}
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                {item.total_amount > 0 ? formatRs(item.total_amount) : '-'}
                              </td>
                              <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--success)' }}>
                                {item.paid_amount > 0 ? formatRs(item.paid_amount) : '-'}
                              </td>
                              <td style={{ 
                                textAlign: 'right', 
                                fontFamily: 'monospace', 
                                fontWeight: 600,
                                color: remaining > 0 ? 'var(--error)' : 'var(--success)' 
                              }}>
                                {formatRs(remaining)}
                              </td>
                              <td>
                                <button 
                                  onClick={() => handleDeleteLedgerEntry(item.id)}
                                  className="password-toggle"
                                  style={{ position: 'relative', right: 0, top: 0, transform: 'none' }}
                                  title="Delete Entry"
                                >
                                  <Trash2 size={14} className="text-danger" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleDeleteCustomer(selectedCustomer.id, selectedCustomer.customer_name)}
                  className="btn btn-danger-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Trash2 size={14} />
                  Delete Customer Profile
                </button>
              </div>
            </div>

            {/* -------------------- SUB-MODAL: ADD ENTRY POPUP -------------------- */}
            {isAddEntryOpen && (
              <div className="modal-overlay" style={{ zIndex: 120 }}>
                <div className="modal-container" style={{ maxWidth: '480px', padding: '24px' }}>
                  <div className="modal-header">
                    <h3 className="modal-title" style={{ fontSize: '18px' }}>Record Entry</h3>
                    <button onClick={() => setIsAddEntryOpen(false)} className="modal-close">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Form type toggler */}
                  <div style={{ display: 'flex', gap: '4px', padding: '3px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px', marginBottom: '16px' }}>
                    <button
                      type="button"
                      style={{ flex: 1, padding: '6px 12px', fontSize: '13px', justifyContent: 'center', margin: 0 }}
                      onClick={() => { setLedgerType('purchase'); setLedgerItem(''); }}
                      className={ledgerType === 'purchase' ? 'tab-btn active' : 'tab-btn'}
                    >
                      Sale Entry
                    </button>
                    <button
                      type="button"
                      style={{ flex: 1, padding: '6px 12px', fontSize: '13px', justifyContent: 'center', margin: 0 }}
                      onClick={() => { setLedgerType('payment'); setLedgerItem('Cash Received'); }}
                      className={ledgerType === 'payment' ? 'tab-btn active' : 'tab-btn'}
                    >
                      Receive Cash
                    </button>
                  </div>

                  <form onSubmit={handleAddLedgerSubmit}>
                    {/* 1. Transaction Date */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="ledDate">Transaction Date *</label>
                      <input
                        id="ledDate"
                        type="date"
                        className="form-input"
                        style={{ paddingLeft: '16px' }}
                        value={ledgerDate}
                        onChange={(e) => setLedgerDate(e.target.value)}
                        required
                        disabled={isModalSubmitting}
                      />
                    </div>

                    {/* 2. Purchase item / Payment Mode */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="ledItem">
                        {ledgerType === 'purchase' ? 'Purchase item *' : 'Payment Mode *'}
                      </label>
                      <input
                        id="ledItem"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '16px' }}
                        placeholder={ledgerType === 'purchase' ? "e.g. Sariya 40 Grade 12mm" : "e.g. Cash / Bank Transfer"}
                        value={ledgerItem}
                        onChange={(e) => setLedgerItem(e.target.value)}
                        required
                        disabled={isModalSubmitting}
                      />
                    </div>

                    {/* 3. Detail of purchase item (optional) / Remarks / Notes (Optional) */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="ledNote">
                        {ledgerType === 'purchase' ? 'Detail of purchase item (optional)' : 'Remarks / Notes (Optional)'}
                      </label>
                      <textarea
                        id="ledNote"
                        className="form-input"
                        style={{ paddingLeft: '16px', height: '60px', resize: 'none' }}
                        placeholder="Additional remarks..."
                        value={ledgerNote}
                        onChange={(e) => setLedgerNote(e.target.value)}
                        disabled={isModalSubmitting}
                      />
                    </div>

                    {/* 4. Total Amount & Paid Amount */}
                    {ledgerType === 'purchase' ? (
                      <>
                        <div className="form-group">
                          <label className="form-label" htmlFor="ledTotal">Total Amount *</label>
                          <input
                            id="ledTotal"
                            type="number"
                            step="0.01"
                            className="form-input"
                            style={{ paddingLeft: '16px' }}
                            placeholder="0.00"
                            value={ledgerTotalAmount}
                            onChange={(e) => setLedgerTotalAmount(e.target.value)}
                            required
                            disabled={isModalSubmitting}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" htmlFor="ledPaid">Paid Amount (optional)</label>
                          <input
                            id="ledPaid"
                            type="number"
                            step="0.01"
                            className="form-input"
                            style={{ paddingLeft: '16px' }}
                            placeholder="0.00"
                            value={ledgerPaidAmount}
                            onChange={(e) => setLedgerPaidAmount(e.target.value)}
                            disabled={isModalSubmitting}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="form-group">
                        <label className="form-label" htmlFor="ledPaidVal">Amount Collected (Rs.) *</label>
                        <input
                          id="ledPaidVal"
                          type="number"
                          step="0.01"
                          className="form-input"
                          style={{ paddingLeft: '16px' }}
                          placeholder="0.00"
                          value={ledgerPaidAmount}
                          onChange={(e) => setLedgerPaidAmount(e.target.value)}
                          required
                          disabled={isModalSubmitting}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                      <button 
                        type="button" 
                        onClick={() => setIsAddEntryOpen(false)} 
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        disabled={isModalSubmitting}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        disabled={isModalSubmitting}
                      >
                        {isModalSubmitting ? 'Submitting...' : 'Record Entry'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
