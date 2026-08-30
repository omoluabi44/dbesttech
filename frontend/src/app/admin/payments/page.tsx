'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Search,
  RefreshCw,
  MoreVertical,
  X,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getPaymentMetrics,
  getTransactions,
  requeryTransaction,
  refundTransaction,
  getWebhookLogs,
  type PaymentMetrics,
  type Transaction,
  type WebhookLog,
} from '@/lib/api/payments';

export default function PaymentsDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'technical'>('overview');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Data state
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txPage, setTxPage] = useState(1);
  const [txCount, setTxCount] = useState(0);
  const [txNext, setTxNext] = useState<string | null>(null);
  const [txPrev, setTxPrev] = useState<string | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [whLoading, setWhLoading] = useState(true);
  const [whPage, setWhPage] = useState(1);
  const [whCount, setWhCount] = useState(0);
  const [whNext, setWhNext] = useState<string | null>(null);
  const [whPrev, setWhPrev] = useState<string | null>(null);

  // Refund modal
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');

  // Fetch Metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setMetricsLoading(true);
      const data = await getPaymentMetrics(dateFilter);
      setMetrics(data);
    } catch {
      toast.error('Failed to load payment metrics');
    } finally {
      setMetricsLoading(false);
    }
  }, [dateFilter]);

  // Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setTxLoading(true);
      const data = await getTransactions({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        page: txPage,
        page_size: 20,
      });
      setTransactions(data.results);
      setTxCount(data.count);
      setTxNext(data.next);
      setTxPrev(data.previous);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setTxLoading(false);
    }
  }, [searchQuery, statusFilter, txPage]);

  // Fetch Webhook Logs
  const fetchWebhooks = useCallback(async () => {
    try {
      setWhLoading(true);
      const data = await getWebhookLogs({ page: whPage, page_size: 20 });
      setWebhooks(data.results);
      setWhCount(data.count);
      setWhNext(data.next);
      setWhPrev(data.previous);
    } catch {
      toast.error('Failed to load webhook logs');
    } finally {
      setWhLoading(false);
    }
  }, [whPage]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => {
    if (activeTab === 'technical') fetchWebhooks();
  }, [activeTab, fetchWebhooks]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { setTxPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handlers
  const handleRequery = async (tx_ref: string) => {
    try {
      const result = await requeryTransaction(tx_ref);
      toast.success(`Re-query complete: ${result.old_status} → ${result.new_status}`);
      fetchTransactions();
      fetchMetrics();
      setSelectedTx(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Re-query failed');
    }
  };

  const handleRefund = async (tx_ref: string) => {
    try {
      const amount = refundAmount ? parseFloat(refundAmount) : undefined;
      await refundTransaction(tx_ref, amount);
      toast.success('Refund initiated successfully!');
      fetchTransactions();
      fetchMetrics();
      setSelectedTx(null);
      setShowRefundConfirm(false);
      setRefundAmount('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Refund failed');
    }
  };

  const renderStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'successful': 'bg-green-500/20 text-green-400',
      'pending': 'bg-yellow-500/20 text-yellow-400',
      'failed': 'bg-red-500/20 text-red-400',
      'refunded': 'bg-gray-500/20 text-black',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || styles['pending']}`}>
        {status}
      </span>
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const totalTxPages = Math.ceil(txCount / 20);
  const totalWhPages = Math.ceil(whCount / 20);

  return (
    <div className="space-y-6" role="main" aria-label="Payments Dashboard">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-black text-sm mt-1">Manage transactions, monitor gateways, and process refunds.</p>
        </div>
        
        <div className="flex bg-[var(--surface)] p-1 rounded-lg border border-[var(--surface-dark)]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-primary-500/20 text-primary-400' : 'text-black hover:text-gray-900 dark:hover:text-white'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'technical' ? 'bg-primary-500/20 text-primary-400' : 'text-black hover:text-gray-900 dark:hover:text-white'}`}
          >
            Technical Monitoring
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Date Filter */}
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

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-6 rounded-xl border border-[var(--surface-dark)] flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Revenue</p>
                <h3 className="text-2xl font-bold mt-1">
                  {metricsLoading ? '...' : `₦${(metrics?.revenue ?? 0).toLocaleString()}`}
                </h3>
              </div>
              <div className="p-3 bg-primary-500/10 rounded-lg text-primary-500">
                <CreditCard size={24} />
              </div>
            </div>
            
            <div className="glass-card p-6 rounded-xl border border-[var(--surface-dark)] flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Volume</p>
                <h3 className="text-2xl font-bold mt-1">
                  {metricsLoading ? '...' : `${metrics?.volume ?? 0} Txns`}
                </h3>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl border border-[var(--surface-dark)] flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Success Rate</p>
                <h3 className="text-2xl font-bold mt-1">
                  {metricsLoading ? '...' : `${metrics?.success_rate ?? 0}%`}
                </h3>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                <CheckCircle size={24} />
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl border border-[var(--surface-dark)] flex items-center justify-between">
              <div>
                <p className="text-black text-sm">Settlement</p>
                <h3 className="text-2xl font-bold mt-1">
                  {metricsLoading ? '...' : `₦${(metrics?.settlement ?? 0).toLocaleString()}`}
                </h3>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
                <Activity size={24} />
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="glass-card rounded-xl overflow-hidden shadow-lg border border-[var(--surface-dark)]">
            <div className="p-4 border-b border-[var(--surface-dark)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--surface-light)]">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-400" />
                Transaction Ledger
                <span className="text-sm font-normal text-black">({txCount} total)</span>
              </h2>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setTxPage(1); }}
                  className="bg-[var(--surface)] border border-[var(--surface-dark)] text-sm rounded-lg p-2"
                >
                  <option value="">All Statuses</option>
                  <option value="successful">Successful</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search ref or email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[var(--surface)] border border-[var(--surface-dark)] rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface)] border-b border-[var(--surface-dark)] text-sm">
                    <th className="p-4 font-medium text-black">Transaction Ref</th>
                    <th className="p-4 font-medium text-black">Customer</th>
                    <th className="p-4 font-medium text-black">Amount</th>
                    <th className="p-4 font-medium text-black">Channel</th>
                    <th className="p-4 font-medium text-black">Status</th>
                    <th className="p-4 font-medium text-black">Date</th>
                    <th className="p-4 font-medium text-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-dark)] text-sm">
                  {txLoading ? (
                    <tr><td colSpan={7} className="p-8 text-center text-black">Loading transactions...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-black">No transactions found.</td></tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-[var(--surface-light)] transition-colors">
                        <td className="p-4">
                          <div className="font-mono text-primary-400 text-xs">{tx.tx_ref}</div>
                          {tx.flw_transaction_id && <div className="text-xs text-black mt-1">{tx.flw_transaction_id}</div>}
                        </td>
                        <td className="p-4">
                          <div>{tx.customer_name}</div>
                          <div className="text-xs text-black">{tx.customer_email}</div>
                        </td>
                        <td className="p-4 font-medium">{tx.currency} {parseFloat(tx.amount).toLocaleString()}</td>
                        <td className="p-4 text-black capitalize">{tx.payment_type || '—'}</td>
                        <td className="p-4">{renderStatusBadge(tx.status)}</td>
                        <td className="p-4 text-black text-xs">{formatDate(tx.created_at)}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => { setSelectedTx(tx); setShowRefundConfirm(false); setRefundAmount(''); }}
                            className="p-2 text-black hover:text-gray-900 dark:hover:text-white hover:bg-[var(--surface-dark)] rounded-md transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalTxPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-[var(--surface-dark)]">
                <span className="text-sm text-black">Page {txPage} of {totalTxPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTxPage(p => Math.max(1, p - 1))}
                    disabled={!txPrev}
                    className="p-2 rounded-md border border-[var(--surface-dark)] disabled:opacity-30 hover:bg-[var(--surface-light)] transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setTxPage(p => p + 1)}
                    disabled={!txNext}
                    className="p-2 rounded-md border border-[var(--surface-dark)] disabled:opacity-30 hover:bg-[var(--surface-light)] transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
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
                <span className="text-sm font-normal text-black">({whCount} total)</span>
              </h2>
              <p className="text-sm text-black mt-1">Raw payloads from payment gateway and automated discrepancy flags.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface)] border-b border-[var(--surface-dark)] text-sm">
                    <th className="p-4 font-medium text-black">Timestamp</th>
                    <th className="p-4 font-medium text-black">Event</th>
                    <th className="p-4 font-medium text-black">TX Ref</th>
                    <th className="p-4 font-medium text-black">Payload</th>
                    <th className="p-4 font-medium text-black">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-dark)] text-sm">
                  {whLoading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-black">Loading webhook logs...</td></tr>
                  ) : webhooks.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-black">No webhook logs found.</td></tr>
                  ) : (
                    webhooks.map(log => (
                      <tr key={log.id} className="hover:bg-[var(--surface-light)] transition-colors">
                        <td className="p-4 text-black whitespace-nowrap text-xs">{formatDate(log.created_at)}</td>
                        <td className="p-4 font-mono text-xs text-primary-400">{log.event}</td>
                        <td className="p-4 font-mono text-xs text-gray-300">{log.tx_ref || '—'}</td>
                        <td className="p-4">
                          <details className="cursor-pointer">
                            <summary className="text-xs text-black hover:text-gray-900 dark:hover:text-white">View payload</summary>
                            <pre className="bg-[var(--background)] p-2 rounded border border-[var(--surface-dark)] font-mono text-xs text-gray-300 overflow-x-auto max-w-md mt-2 max-h-40 overflow-y-auto">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </details>
                        </td>
                        <td className="p-4">
                          {log.discrepancy ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                                <AlertCircle size={12} /> Discrepancy
                              </span>
                              {log.discrepancy_detail && (
                                <p className="text-xs text-red-400/70 mt-1 max-w-xs">{log.discrepancy_detail}</p>
                              )}
                            </div>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              log.status === 'processed' ? 'bg-green-500/20 text-green-400' :
                              log.status === 'ignored' ? 'bg-gray-500/20 text-black' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {log.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Webhook Pagination */}
            {totalWhPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-[var(--surface-dark)]">
                <span className="text-sm text-black">Page {whPage} of {totalWhPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setWhPage(p => Math.max(1, p - 1))}
                    disabled={!whPrev}
                    className="p-2 rounded-md border border-[var(--surface-dark)] disabled:opacity-30 hover:bg-[var(--surface-light)] transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setWhPage(p => p + 1)}
                    disabled={!whNext}
                    className="p-2 rounded-md border border-[var(--surface-dark)] disabled:opacity-30 hover:bg-[var(--surface-light)] transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--surface-dark)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[var(--surface-dark)]">
              <h3 className="text-xl font-bold">Transaction Actions</h3>
              <button onClick={() => setSelectedTx(null)} className="text-black hover:text-gray-900 dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-[var(--surface-light)] p-4 rounded-lg border border-[var(--surface-dark)]">
                <div className="text-sm text-black">Transaction Reference</div>
                <div className="font-mono text-sm text-primary-400 mt-1 break-all">{selectedTx.tx_ref}</div>
                <div className="flex justify-between mt-3 text-sm">
                  <span className="text-gray-300">{selectedTx.customer_email}</span>
                  <span className="font-bold">{selectedTx.currency} {parseFloat(selectedTx.amount).toLocaleString()}</span>
                </div>
                <div className="mt-2">{renderStatusBadge(selectedTx.status)}</div>
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
                  <Download size={18} />
                  Download Receipt
                </button>

                {selectedTx.status === 'successful' && (
                  <div className="pt-4 border-t border-[var(--surface-dark)]">
                    {!showRefundConfirm ? (
                      <button 
                        onClick={() => setShowRefundConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all font-medium"
                      >
                        <RefreshCw size={18} className="rotate-180" />
                        Process Refund
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-black block mb-1">Refund Amount (leave blank for full refund)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            placeholder={selectedTx.amount}
                            className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--surface-dark)] rounded-lg text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowRefundConfirm(false)}
                            className="flex-1 py-2 rounded-lg border border-[var(--surface-dark)] text-black hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleRefund(selectedTx.tx_ref)}
                            className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 transition-colors text-sm font-medium"
                          >
                            Confirm Refund
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-center text-black mt-2">Requires Root Admin permissions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
