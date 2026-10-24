import React, { useState } from 'react';
import {
  X, CheckCircle2, Clock, AlertCircle, Plus,
  CreditCard, ShieldCheck, Download
} from 'lucide-react';
import type { Project, PaymentTransaction, Invoice, Receipt, Enquiry } from '../../types';
import { downloadReceiptPDF, downloadInvoicePDF } from '../../utils/pdfGenerator';

interface InternalProjectPortalModalProps {
  project: Project;
  allPayments: PaymentTransaction[];
  allInvoices: Invoice[];
  allReceipts: Receipt[];
  allEnquiries: Enquiry[];
  token: string;
  onClose: () => void;
  onRefreshData: () => Promise<void>;
  onRevertedToEnquiry?: () => void;
}

export const InternalProjectPortalModal: React.FC<InternalProjectPortalModalProps> = ({
  project,
  allPayments,
  allInvoices,
  allReceipts,
  token,
  onClose,
  onRefreshData
}) => {
  // Filter transactions for this project
  const projectPayments = allPayments.filter(p => p.projectId === project.id);
  const verifiedPayments = projectPayments
    .filter(p => p.status === 'Verified')
    .sort((a, b) => new Date(b.verifiedAt || b.paymentDate || b.createdAt).getTime() - new Date(a.verifiedAt || a.paymentDate || a.createdAt).getTime());
  const pendingPayments = projectPayments.filter(p => p.status === 'Pending Verification');

  // 1. Payment Received
  const totalVerifiedPaid = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);

  // 2. Payment Due
  const remainingDue = Math.max(0, project.agreedAmount - totalVerifiedPaid);

  // Due amount updated timestamp (latest verified payment or project update/creation)
  const dueUpdatedTimestamp = verifiedPayments.length > 0 && verifiedPayments[0].verifiedAt
    ? verifiedPayments[0].verifiedAt
    : (project.updatedAt || project.createdAt);

  // 3. Payment Complete calculation
  // Find the exact transaction and timestamp when the cumulative verified payments satisfied the agreed amount
  let paymentCompleteTimestamp: string | null = null;
  const isPaymentComplete = totalVerifiedPaid >= project.agreedAmount && project.agreedAmount > 0;

  if (isPaymentComplete) {
    // Sort ascending to find when full payment was reached
    const ascendingVerified = [...verifiedPayments].sort(
      (a, b) => new Date(a.verifiedAt || a.paymentDate || a.createdAt).getTime() - new Date(b.verifiedAt || b.paymentDate || b.createdAt).getTime()
    );
    let cumulative = 0;
    for (const p of ascendingVerified) {
      cumulative += p.amount;
      if (cumulative >= project.agreedAmount) {
        paymentCompleteTimestamp = p.verifiedAt || p.paymentDate || p.createdAt;
        break;
      }
    }
    if (!paymentCompleteTimestamp && ascendingVerified.length > 0) {
      paymentCompleteTimestamp = ascendingVerified[ascendingVerified.length - 1].verifiedAt || ascendingVerified[ascendingVerified.length - 1].createdAt;
    }
  }

  // Format Date and Time helper
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  // 4. Project Status: Only two statuses ('In Progress' | 'Completed')
  const currentStatus: 'In Progress' | 'Completed' = project.status === 'Completed' ? 'Completed' : 'In Progress';
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Find project invoice if generated
  const projectInvoice = allInvoices.find(inv => inv.id === project.invoiceId || inv.projectId === project.id);

  const handleUpdateStatus = async (newStatus: 'In Progress' | 'Completed') => {
    setStatusLoading(true);
    setStatusFeedback(null);
    setStatusError(null);
    try {
      if (newStatus === 'Completed') {
        const res = await fetch(`/api/admin/projects/${project.id}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to complete project.');
        }
        setStatusFeedback(`Project marked as Completed! Official invoice ${data.invoice?.id || ''} generated.`);
        await onRefreshData();
      } else {
        const res = await fetch(`/api/admin/projects/${project.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'In Progress' })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update project status.');
        }
        setStatusFeedback(`Project status updated to "In Progress".`);
        await onRefreshData();
      }
      setTimeout(() => setStatusFeedback(null), 4000);
    } catch (err: any) {
      console.error('Failed to update project status:', err);
      setStatusError(err.message || 'Failed to update project status.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Payment Recording State
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordAmount, setRecordAmount] = useState('');
  const [recordUtr, setRecordUtr] = useState('');
  const [recordMethod, setRecordMethod] = useState('UPI');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordNotes, setRecordNotes] = useState('');
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordError(null);
    setRecordLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(recordAmount),
          utr: recordUtr.trim(),
          paymentMethod: recordMethod,
          paymentDate: recordDate,
          notes: recordNotes.trim(),
          overrideDuplicate: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }

      setShowRecordModal(false);
      setRecordAmount('');
      setRecordUtr('');
      setRecordNotes('');
      await onRefreshData();
    } catch (err: any) {
      setRecordError(err.message || 'Error recording payment.');
    } finally {
      setRecordLoading(false);
    }
  };

  // Verification State
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const handleVerify = async (paymentId: string) => {
    setVerifyingId(paymentId);
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch (err) {
      console.error('Failed to verify payment:', err);
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1c38]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E6E8ED] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-6 bg-gradient-to-r from-[#173B75] to-[#2458A6] text-white flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                {project.id}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                currentStatus === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-[#F07822] text-white'
              }`}>
                {currentStatus}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{project.projectName}</h2>
            <p className="text-xs text-white/80 mt-1">
              Client: <strong>{project.clientName}</strong> · Phone: {project.contactPhone || '—'} · Email: {project.contactEmail || '—'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close Portal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK & ERROR BANNERS */}
        {statusFeedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{statusFeedback}</span>
          </div>
        )}

        {statusError && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs text-rose-800 font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{statusError}</span>
            </div>
            <button onClick={() => setStatusError(null)} className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* SUMMARY ROW: 4 CORE ITEMS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. PAYMENT RECEIVED */}
            <div className="bg-[#F7F7F5] rounded-2xl p-5 border border-[#E6E8ED] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  1. Payment Received
                </span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  ₹{totalVerifiedPaid.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Total verified receipts ({verifiedPayments.length} payment{verifiedPayments.length === 1 ? '' : 's'})
                </p>
              </div>

              {verifiedPayments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
                  Latest: {formatDateTime(verifiedPayments[0].verifiedAt || verifiedPayments[0].paymentDate)}
                </div>
              )}
            </div>

            {/* 2. PAYMENT DUE */}
            <div className="bg-[#F7F7F5] rounded-2xl p-5 border border-[#E6E8ED] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  2. Payment Due
                </span>
                <div className={`text-2xl font-black mt-1 ${remainingDue === 0 ? 'text-emerald-600' : 'text-[#F07822]'}`}>
                  ₹{remainingDue.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Agreed Project Fee: <strong>₹{project.agreedAmount.toLocaleString('en-IN')}</strong>
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
                Updated: {formatDateTime(dueUpdatedTimestamp)}
              </div>
            </div>

          </div>

          {/* 3. PAYMENT COMPLETE STATUS */}
          <div className="rounded-2xl p-5 border transition-all">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              3. Payment Complete Status
            </span>

            {isPaymentComplete ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-emerald-900">
                    Payment Complete
                  </div>
                  <p className="text-xs text-emerald-700">
                    The entire agreed amount of <strong>₹{project.agreedAmount.toLocaleString('en-IN')}</strong> has been received and verified.
                  </p>
                  <p className="text-[11px] font-mono text-emerald-800">
                    Verified on: <strong>{formatDateTime(paymentCompleteTimestamp || undefined)}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-amber-900">
                    Awaiting Full Payment (₹{remainingDue.toLocaleString('en-IN')} Due)
                  </div>
                  <p className="text-xs text-amber-700">
                    Payment complete will be displayed automatically once the remaining balance is verified. Unverified payments do not mark payment complete.
                  </p>
                  <p className="text-[11px] font-mono text-amber-800">
                    Due amount calculated as of: {formatDateTime(dueUpdatedTimestamp)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 4. PROJECT STATUS (ONLY TWO STATUSES: IN PROGRESS | COMPLETED) */}
          <div className="bg-[#F7F7F5] rounded-2xl p-5 border border-[#E6E8ED] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  4. Project Status
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Toggle status between <strong>In Progress</strong> and <strong>Completed</strong> directly.
                </p>
              </div>

              {/* Status Selector & Quick Action Button */}
              <div className="flex items-center gap-2">
                <select
                  value={currentStatus}
                  disabled={statusLoading}
                  onChange={e => handleUpdateStatus(e.target.value as 'In Progress' | 'Completed')}
                  className="px-3 py-2 rounded-xl border border-[#E6E8ED] bg-white text-xs font-bold text-[#173B75] focus:outline-none focus:ring-2 focus:ring-[#173B75]/20 cursor-pointer disabled:opacity-50"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>

                <button
                  type="button"
                  disabled={statusLoading}
                  onClick={() => handleUpdateStatus(currentStatus === 'Completed' ? 'In Progress' : 'Completed')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
                    currentStatus === 'Completed'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {statusLoading ? 'Updating...' : currentStatus === 'Completed' ? 'Mark In Progress' : 'Mark Complete'}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-200">
              <div>
                Current Status: <strong className={currentStatus === 'Completed' ? 'text-emerald-700' : 'text-[#F07822]'}>{currentStatus}</strong>
                {project.completedAt && currentStatus === 'Completed' && (
                  <span> · Completed on: {formatDateTime(project.completedAt)}</span>
                )}
              </div>
              {currentStatus === 'Completed' && projectInvoice && (
                <button
                  type="button"
                  onClick={() => downloadInvoicePDF(projectInvoice)}
                  className="px-3 py-1.5 rounded-lg bg-[#173B75] text-white font-bold hover:bg-[#2458A6] transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  title="Download Tax Invoice PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Invoice {projectInvoice.id} (Paid)</span>
                </button>
              )}
            </div>
          </div>

          {/* VERIFIED PAYMENTS LEDGER (EXACT DATES & TIMES) */}
          <div className="bg-white rounded-2xl border border-[#E6E8ED] overflow-hidden shadow-sm space-y-0">
            <div className="p-4 bg-[#F7F7F5] border-b border-[#E6E8ED] flex items-center justify-between">
              <h3 className="font-bold text-xs text-[#173B75] uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#F07822]" />
                Verified Payment Records ({verifiedPayments.length})
              </h3>

              <button
                onClick={() => setShowRecordModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#173B75] hover:bg-[#2458A6] text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            </div>

            {verifiedPayments.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <p className="text-xs">No verified payments received yet for this project.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E6E8ED]">
                {verifiedPayments.map((p, idx) => {
                  const receipt = allReceipts.find(r => r.paymentId === p.id);
                  return (
                    <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F7F7F5]/60 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-emerald-700">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Verified
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            Payment #{verifiedPayments.length - idx} ({p.id})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Method: <strong>{p.paymentMethod || 'UPI'}</strong> · UTR: <span className="font-mono">{p.utr}</span>
                          {p.notes && <span className="text-slate-400"> · Note: {p.notes}</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Exact Received / Verified Date & Time: <strong className="text-slate-700">{formatDateTime(p.verifiedAt || p.paymentDate || p.createdAt)}</strong>
                        </div>
                      </div>

                      {receipt && (
                        <button
                          onClick={() => downloadReceiptPDF(receipt)}
                          className="px-3 py-1.5 rounded-lg bg-[#EEF2F9] text-[#173B75] text-[11px] font-bold hover:bg-[#173B75] hover:text-white transition-colors flex items-center gap-1 self-start sm:self-center cursor-pointer"
                          title="Download Receipt PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Receipt {receipt.id}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PENDING VERIFICATION TRANSACTIONS (IF ANY) */}
          {pendingPayments.length > 0 && (
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Pending Verification ({pendingPayments.length})</span>
              </div>
              <p className="text-[11px] text-amber-800">
                These payments are awaiting admin verification and do not reduce the due amount or complete payment until verified.
              </p>
              <div className="space-y-2">
                {pendingPayments.map(p => (
                  <div key={p.id} className="p-3 bg-white rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        ₹{p.amount.toLocaleString('en-IN')} via {p.paymentMethod || 'UPI'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        UTR: {p.utr} · Date: {formatDateTime(p.paymentDate || p.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleVerify(p.id)}
                      disabled={verifyingId === p.id}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {verifyingId === p.id ? 'Verifying...' : 'Verify Now'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-[#F7F7F5] border-t border-[#E6E8ED] flex items-center justify-between text-xs">
          <div className="text-slate-500 font-mono text-[11px]">
            Agreed: ₹{project.agreedAmount.toLocaleString('en-IN')} · Paid: ₹{totalVerifiedPaid.toLocaleString('en-IN')} · Due: ₹{remainingDue.toLocaleString('en-IN')}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#E6E8ED] text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* RECORD PAYMENT MODAL */}
      {showRecordModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6E8ED] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#173B75]">Record Payment Received</h3>
              <button onClick={() => setShowRecordModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Record a client payment for this project. Once verified, it will update Payment Received, Payment Due, and Payment Complete status.
            </p>

            {recordError && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs">
                {recordError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount Received (INR) *</label>
                <input
                  type="number"
                  required
                  value={recordAmount}
                  onChange={e => setRecordAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] font-bold text-[#173B75]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={recordDate}
                    onChange={e => setRecordDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Method</label>
                  <select
                    value={recordMethod}
                    onChange={e => setRecordMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] font-semibold text-[#173B75]"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="Cash / Cheque">Cash / Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">UTR / Bank Reference No. *</label>
                <input
                  type="text"
                  required
                  value={recordUtr}
                  onChange={e => setRecordUtr(e.target.value)}
                  placeholder="e.g. 20261024881726"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Notes (Optional)</label>
                <input
                  type="text"
                  value={recordNotes}
                  onChange={e => setRecordNotes(e.target.value)}
                  placeholder="e.g. Advance installment"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordLoading}
                  className="px-4 py-2 rounded-xl bg-[#173B75] hover:bg-[#2458A6] text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {recordLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
