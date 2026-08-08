'use client';

import React, { useState } from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  X,
  FileText,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---
interface Transaction {
  id: string;
  tx_ref: string;
  gateway_id: string;
  customer_email: string;
  amount: number;
  currency: string;
  channel: string;
  status: 'Successful' | 'Pending' | 'Failed' | 'Refunded';
  date: string;
}

interface WebhookLog {
  id: string;
  event: string;
  payload: string;
  timestamp: string;
  status: 'Processed' | 'Ignored' | 'Error';
  discrepancy: boolean;
}

// --- Mock Data ---
const mockMetrics = {
  revenue: 4520000,
  volume: 1240,
  successRate: 98.5,
  settlement: 4100000,
};

const mockTransactions: Transaction[] = [
  { id: '1', tx_ref: 'TXN-001', gateway_id: 'FLW-12345', customer_email: 'user1@example.com', amount: 5000, currency: 'NGN', channel: 'Card', status: 'Successful', date: '2026-08-08 14:30' },
  { id: '2', tx_ref: 'TXN-002', gateway_id: 'FLW-12346', customer_email: 'user2@example.com', amount: 15000, currency: 'NGN', channel: 'Bank Transfer', status: 'Pending', date: '2026-08-08 14:15' },
  { id: '3', tx_ref: 'TXN-003', gateway_id: 'FLW-12347', customer_email: 'user3@example.com', amount: 2000, currency: 'NGN', channel: 'USSD', status: 'Failed', date: '2026-08-08 13:45' },
  { id: '4', tx_ref: 'TXN-004', gateway_id: 'FLW-12348', customer_email: 'user4@example.com', amount: 10000, currency: 'NGN', channel: 'Card', status: 'Refunded', date: '2026-08-08 12:00' },
];

const mockWebhooks: WebhookLog[] = [
  { id: '1', event: 'charge.completed', payload: '{"event": "charge.completed", "data": {"id": "FLW-12345", "status": "successful"}}', timestamp: '2026-08-08 14:30:12', status: 'Processed', discrepancy: false },
  { id: '2', event: 'charge.completed', payload: '{"event": "charge.completed", "data": {"id": "FLW-12346", "status": "successful"}}', timestamp: '2026-08-08 14:15:05', status: 'Processed', discrepancy: true },
];

export default function PaymentsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'technical'>('overview');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // --- Handlers ---
  const handleRequery = (tx_ref: string) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: `Re-querying transaction ${tx_ref}...`,
        success: 'Transaction verified successfully!',
        error: 'Failed to re-query.',
      }
    );
  };

  const handleRefund = (tx_ref: string) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: `Processing refund for ${tx_ref}...`,
        success: 'Refund initiated successfully!',
        error: 'Failed to process refund.',
      }
    );
    setSelectedTx(null);
  };

  // --- Render Helpers ---
  const renderStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Successful': 'bg-green-500/20 text-green-400',
      'Pending': 'bg-yellow-500/20 text-yellow-400',
      'Failed': 'bg-red-500/20 text-red-400',
      'Refunded': 'bg-gray-500/20 text-gray-400',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles['Pending']}`}>
        {status}
      </span>
    );
  };

  const filteredTransactions = mockTransactions.filter(tx => 
    tx.tx_ref.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tx.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" role="main" aria-label="Payments Dashboard">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-gray-400 text-sm mt-1">Manage transactions, monitor gateways, and process refunds.</p>
        </div>
        
        <div className="flex bg-[var(--surface)] p-1 rounded-lg border border-[var(--surface-dark)]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'technical' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white'}`}
          >
            Technical Monitoring
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Metrics Header */}
          <div className="flex justify-end mb-2">
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-[var(--surface)] border border-[var(--surface-dark)] text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-6 rounded-xl border border-[var(--surface-dark)] flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Revenue</p>
                <h3 className="text-2xl font-bold mt-1">₦{mockMetrics.revenue.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-primary-500/10 rounded-lg text-primary-500">
                <CreditCard size={24} />
              </div>
            </div>
            
            <div className="glass-card p-6 rounded-xl border border-[var(--surface-dark)] flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Volume</p>
                <h3 className="text-2xl font-bold mt-1">{mockMetrics.volume} Txns</h3>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl border border-[var(--surface-dark)] flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Success Rate</p>
                <h3 className="text-2xl font-bold mt-1">{mockMetrics.successRate}%</h3>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                <CheckCircle size={24} />
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl border border-[var(--surface-dark)] flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Settlement Status</p>
                <h3 className="text-2xl font-bold mt-1">₦{mockMetrics.settlement.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
                <Activity size={24} />
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="glass-card rounded-xl overflow-hidden shadow-lg border border-[var(--surface-dark)]">
            <div className="p-4 border-b border-[var(--surface-dark)] flex justify-between items-center bg-[var(--surface-light)]">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-400" />
                Transaction Ledger
              </h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search ref or email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[var(--surface)] border border-[var(--surface-dark)] rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface)] border-b border-[var(--surface-dark)] text-sm">
                    <th className="p-4 font-medium text-gray-400">Transaction Ref</th>
                    <th className="p-4 font-medium text-gray-400">Customer</th>
                    <th className="p-4 font-medium text-gray-400">Amount</th>
                    <th className="p-4 font-medium text-gray-400">Channel</th>
                    <th className="p-4 font-medium text-gray-400">Status</th>
                    <th className="p-4 font-medium text-gray-400">Date</th>
                    <th className="p-4 font-medium text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-dark)] text-sm">
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-[var(--surface-light)] transition-colors">
                      <td className="p-4">
                        <div className="font-mono text-primary-400">{tx.tx_ref}</div>
                        <div className="text-xs text-gray-500 mt-1">{tx.gateway_id}</div>
                      </td>
                      <td className="p-4">{tx.customer_email}</td>
                      <td className="p-4 font-medium">{tx.currency} {tx.amount.toLocaleString()}</td>
                      <td className="p-4 text-gray-400">{tx.channel}</td>
                      <td className="p-4">{renderStatusBadge(tx.status)}</td>
                      <td className="p-4 text-gray-400">{tx.date}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setSelectedTx(tx)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-[var(--surface-dark)] rounded-md transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No transactions found matching "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'technical' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass-card rounded-xl overflow-hidden shadow-lg border border-[var(--surface-dark)]">
            <div className="p-4 border-b border-[var(--surface-dark)] bg-[var(--surface-light)]">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-400" />
                Webhook Logs & Monitoring
              </h2>
              <p className="text-sm text-gray-400 mt-1">Raw payloads from payment gateway and automated discrepancy flags.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface)] border-b border-[var(--surface-dark)] text-sm">
                    <th className="p-4 font-medium text-gray-400">Timestamp</th>
                    <th className="p-4 font-medium text-gray-400">Event</th>
                    <th className="p-4 font-medium text-gray-400">Payload</th>
                    <th className="p-4 font-medium text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-dark)] text-sm">
                  {mockWebhooks.map(log => (
                    <tr key={log.id} className="hover:bg-[var(--surface-light)] transition-colors">
                      <td className="p-4 text-gray-400 whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-4 font-mono text-xs text-primary-400">{log.event}</td>
                      <td className="p-4">
                        <div className="bg-[var(--background)] p-2 rounded border border-[var(--surface-dark)] font-mono text-xs text-gray-300 overflow-x-auto max-w-md">
                          {log.payload}
                        </div>
                      </td>
                      <td className="p-4">
                        {log.discrepancy ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                            <AlertCircle size={12} /> Discrepancy
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            {log.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Actions Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--surface-dark)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[var(--surface-dark)]">
              <h3 className="text-xl font-bold">Transaction Actions</h3>
              <button onClick={() => setSelectedTx(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-[var(--surface-light)] p-4 rounded-lg border border-[var(--surface-dark)]">
                <div className="text-sm text-gray-400">Transaction Reference</div>
                <div className="font-mono text-lg text-primary-400">{selectedTx.tx_ref}</div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-300">{selectedTx.customer_email}</span>
                  <span className="font-bold">{selectedTx.currency} {selectedTx.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => handleRequery(selectedTx.tx_ref)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all font-medium"
                >
                  <RefreshCw size={18} />
                  Manual Re-query (Verify)
                </button>
                
                <button 
                  onClick={() => {}}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[var(--surface-light)] hover:bg-[var(--surface-dark)] border border-[var(--surface-dark)] transition-all font-medium text-gray-300"
                >
                  <FileText size={18} />
                  Download Receipt
                </button>

                <div className="pt-4 border-t border-[var(--surface-dark)]">
                  <button 
                    onClick={() => handleRefund(selectedTx.tx_ref)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all font-medium"
                  >
                    <RefreshCw size={18} className="rotate-180" />
                    Process Refund
                  </button>
                  <p className="text-xs text-center text-gray-500 mt-2">Requires Root Admin permissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
