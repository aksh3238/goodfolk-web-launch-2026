import React, { useState } from 'react';
import {
  X, CheckCircle2, XCircle, AlertCircle, Clock, ShieldCheck, DollarSign,
  Upload, FileText, Check, Copy, ExternalLink, Trash2, Edit2, Plus,
  AlertTriangle, ArrowLeftRight, FileCheck, HelpCircle, Eye, Download, CreditCard
} from 'lucide-react';
import type { Project, PaymentTransaction, Invoice, Receipt, Enquiry, ProjectDeliverableItem, ProjectAdjustment } from '../../types';
import { downloadReceiptPDF } from '../../utils/pdfGenerator';

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
  allEnquiries,
  token,
  onClose,
  onRefreshData,
  onRevertedToEnquiry
}) => {
  const [activeSection, setActiveSection] = useState<'details' | 'financials' | 'ledger' | 'deliverables' | 'audit'>('details');

  // Linked enquiry lookup
  const linkedEnquiry = allEnquiries.find(e => e.id === project.enquiryId || e.convertedProjectId === project.id);

  // Payments for this project
  const projectPayments = allPayments.filter(p => p.projectId === project.id);
  const verifiedPayments = projectPayments.filter(p => p.status === 'Verified');
  const pendingPayments = projectPayments.filter(p => p.status === 'Pending Verification');
  const rejectedPayments = projectPayments.filter(p => p.status === 'Rejected');

  // Deliverables & Adjustments
  const deliverables = project.deliverables || [];
  const adjustments = project.adjustments || [];

  // Financial calculations
  const discountSum = adjustments
    .filter(a => a.type === 'discount' || a.type === 'waiver')
    .reduce((sum, a) => sum + a.amount, 0);
  const additionSum = adjustments
    .filter(a => a.type === 'addition')
    .reduce((sum, a) => sum + a.amount, 0);
  const netAgreedAmount = Math.max(0, project.agreedAmount + additionSum - discountSum);

  const totalVerifiedPaid = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPendingPaid = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalRejectedPaid = rejectedPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = Math.max(0, netAgreedAmount - totalVerifiedPaid);

  const advanceAgreed = project.advanceAmountAgreed !== undefined ? project.advanceAmountAgreed : Math.round(project.agreedAmount * 0.5);
  const advanceReceived = Math.min(advanceAgreed, totalVerifiedPaid);

  // Completion Gate Checklist
  const cond1DeliverablesPassed = deliverables.length > 0 && deliverables.every(d => Boolean(d.fileUrl) && d.isDelivered);
  const cond2FinalPaymentPassed = totalVerifiedPaid >= netAgreedAmount && totalVerifiedPaid > 0;
  const cond3BalancePassed = remainingBalance <= 0;
  const cond4NoPendingPassed = pendingPayments.length === 0;
  const canCompleteProject = cond1DeliverablesPassed && cond2FinalPaymentPassed && cond3BalancePassed && cond4NoPendingPassed;

  // Project Editable Fields
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState(project.projectName);
  const [startDateInput, setStartDateInput] = useState(project.startDate);
  const [deadlineInput, setDeadlineInput] = useState(project.deadline);
  const [agreedAmountInput, setAgreedAmountInput] = useState(String(project.agreedAmount));
  const [advanceAmountInput, setAdvanceAmountInput] = useState(String(advanceAgreed));
  const [statusInput, setStatusInput] = useState(project.status);
  const [notesInput, setNotesInput] = useState(project.internalNotes || '');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Record Payment Modal State
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentDateInput, setPaymentDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethodInput, setPaymentMethodInput] = useState('UPI');
  const [paymentUtrInput, setPaymentUtrInput] = useState('');
  const [paymentNotesInput, setPaymentNotesInput] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [paymentProofFileName, setPaymentProofFileName] = useState('');
  const [paymentOverrideDuplicate, setPaymentOverrideDuplicate] = useState(false);
  const [paymentDuplicateWarning, setPaymentDuplicateWarning] = useState<string | null>(null);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Deliverables State
  const [showAddDeliverableModal, setShowAddDeliverableModal] = useState(false);
  const [newDeliverableTitle, setNewDeliverableTitle] = useState('');
  const [newDeliverableDesc, setNewDeliverableDesc] = useState('');
  const [newDeliverableFileUrl, setNewDeliverableFileUrl] = useState('');
  const [newDeliverableFileName, setNewDeliverableFileName] = useState('');
  const [deliverableLoading, setDeliverableLoading] = useState(false);

  // Financial Adjustment State
  const [showAddAdjustmentModal, setShowAddAdjustmentModal] = useState(false);
  const [adjType, setAdjType] = useState<'discount' | 'addition' | 'waiver'>('discount');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [adjLoading, setAdjLoading] = useState(false);

  // Revert State
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [revertError, setRevertError] = useState<string | null>(null);

  // Complete Gate Modal
  const [showGateCheckModal, setShowGateCheckModal] = useState(false);
  const [completingProject, setCompletingProject] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Rejection prompt state
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Copy helper
  const [copiedLink, setCopiedLink] = useState(false);
  const copyPaymentLink = () => {
    const url = `${window.location.origin}/pay/${project.clientPaymentToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Upload helper for proofs or deliverables
  const handleFileUpload = async (file: File, target: 'proof' | 'deliverable') => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            dataUrl,
            filename: file.name
          })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          if (target === 'proof') {
            setPaymentProofUrl(data.url);
            setPaymentProofFileName(file.name);
          } else {
            setNewDeliverableFileUrl(data.url);
            setNewDeliverableFileName(file.name);
          }
        }
      } catch (err) {
        console.error('File upload failed:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Project Details Updates
  const handleSaveProjectDetails = async () => {
    setSaveLoading(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectName: projectNameInput.trim(),
          startDate: startDateInput,
          deadline: deadlineInput,
          agreedAmount: Number(agreedAmountInput) || project.agreedAmount,
          advanceAmountAgreed: Number(advanceAmountInput) || advanceAgreed,
          status: statusInput,
          internalNotes: notesInput
        })
      });

      if (res.ok) {
        setSaveSuccessMsg('Project updated successfully.');
        setIsEditingProject(false);
        await onRefreshData();
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update project:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Record Payment (Step 1)
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setPaymentDuplicateWarning(null);
    setRecordingPayment(true);

    try {
      const res = await fetch(`/api/admin/projects/${project.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(paymentAmountInput),
          utr: paymentUtrInput.trim(),
          paymentMethod: paymentMethodInput,
          paymentDate: paymentDateInput,
          notes: paymentNotesInput.trim(),
          proofUrl: paymentProofUrl || undefined,
          proofFileName: paymentProofFileName || undefined,
          overrideDuplicate: paymentOverrideDuplicate
        })
      });

      const data = await res.json();

      if (res.status === 409 && data.duplicateWarning) {
        setPaymentDuplicateWarning(data.error || 'Suspected duplicate payment detected.');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment.');
      }

      // Reset form
      setShowRecordPaymentModal(false);
      setPaymentAmountInput('');
      setPaymentUtrInput('');
      setPaymentNotesInput('');
      setPaymentProofUrl('');
      setPaymentProofFileName('');
      setPaymentOverrideDuplicate(false);
      setPaymentDuplicateWarning(null);

      await onRefreshData();
    } catch (err: any) {
      setPaymentError(err.message || 'Error recording payment.');
    } finally {
      setRecordingPayment(false);
    }
  };

  // Verify Payment (Step 2)
  const handleVerifyPayment = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch (err) {
      console.error('Failed to verify payment:', err);
    }
  };

  // Reject Payment
  const handleRejectPayment = async () => {
    if (!rejectingPaymentId) return;
    setRejectLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${rejectingPaymentId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectionReason.trim() || 'Transaction not recognized in bank statement.' })
      });
      if (res.ok) {
        setRejectingPaymentId(null);
        setRejectionReason('');
        await onRefreshData();
      }
    } catch (err) {
      console.error('Failed to reject payment:', err);
    } finally {
      setRejectLoading(false);
    }
  };

  // Deliverables Handlers
  const handleAddDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeliverableTitle.trim()) return;
    setDeliverableLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/deliverables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newDeliverableTitle.trim(),
          description: newDeliverableDesc.trim() || undefined,
          fileUrl: newDeliverableFileUrl || undefined,
          fileName: newDeliverableFileName || undefined,
          isDelivered: false
        })
      });
      if (res.ok) {
        setShowAddDeliverableModal(false);
        setNewDeliverableTitle('');
        setNewDeliverableDesc('');
        setNewDeliverableFileUrl('');
        setNewDeliverableFileName('');
        await onRefreshData();
      }
    } catch (err) {
      console.error('Failed to add deliverable:', err);
    } finally {
      setDeliverableLoading(false);
    }
  };

  const handleToggleDeliverableStatus = async (item: ProjectDeliverableItem) => {
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/deliverables/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isDelivered: !item.isDelivered
        })
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch (err) {
      console.error('Failed to update deliverable:', err);
    }
  };

  const handleDeleteDeliverable = async (deliverableId: string) => {
    if (!window.confirm('Are you sure you want to delete this deliverable?')) return;
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/deliverables/${deliverableId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch (err) {
      console.error('Failed to delete deliverable:', err);
    }
  };

  // Add Financial Adjustment
  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjAmount || !adjReason.trim()) return;
    setAdjLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/adjustments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: adjType,
          amount: Number(adjAmount),
          reason: adjReason.trim()
        })
      });
      if (res.ok) {
        setShowAddAdjustmentModal(false);
        setAdjAmount('');
        setAdjReason('');
        await onRefreshData();
      }
    } catch (err) {
      console.error('Failed to add adjustment:', err);
    } finally {
      setAdjLoading(false);
    }
  };

  // Complete Project (Gate Check)
  const handleCompleteProject = async () => {
    setCompletingProject(true);
    setCompleteError(null);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Completion conditions not satisfied.');
      }
      setShowGateCheckModal(false);
      await onRefreshData();
    } catch (err: any) {
      setCompleteError(err.message);
    } finally {
      setCompletingProject(false);
    }
  };

  // Revert Project to Enquiry
  const handleRevertToEnquiry = async () => {
    setReverting(true);
    setRevertError(null);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/revert`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to revert project.');
      }
      setShowRevertModal(false);
      await onRefreshData();
      if (onRevertedToEnquiry) {
        onRevertedToEnquiry();
      } else {
        onClose();
      }
    } catch (err: any) {
      setRevertError(err.message);
    } finally {
      setReverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1c38]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E6E8ED] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#123578] via-[#1a4494] to-[#123578] text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                {project.id}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ED650B] text-white font-bold">
                {project.status}
              </span>
              {project.status === 'Completed' && (
                <span className="flex items-center gap-1 text-[11px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Completed
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{project.projectName}</h2>
            <p className="text-xs text-white/80 mt-0.5">
              Client: <strong>{project.clientName}</strong> · Contact: {project.contactPhone} · {project.contactEmail}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mark as Done / Complete Button */}
            {project.status !== 'Completed' && (
              <button
                onClick={() => setShowGateCheckModal(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                  canCompleteProject
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/20'
                }`}
                title={canCompleteProject ? 'Ready to complete project' : 'View completion criteria'}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Mark Project as Completed</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* METRICS & QUICK SUMMARY BAR */}
        <div className="bg-[#F7F7F5] border-b border-[#E6E8ED] px-6 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Agreed Amount</span>
            <span className="font-bold text-[#123578] text-sm">₹{netAgreedAmount.toLocaleString('en-IN')}</span>
            {discountSum > 0 && <span className="text-[10px] text-emerald-600 ml-1">(-₹{discountSum.toLocaleString('en-IN')})</span>}
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Verified Paid</span>
            <span className="font-bold text-emerald-600 text-sm">₹{totalVerifiedPaid.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-400 ml-1">({verifiedPayments.length} txns)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Pending Verification</span>
            <span className="font-bold text-amber-600 text-sm">₹{totalPendingPaid.toLocaleString('en-IN')}</span>
            {pendingPayments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold ml-1">
                {pendingPayments.length} pending
              </span>
            )}
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Outstanding Due</span>
            <span className={`font-bold text-sm ${remainingBalance === 0 ? 'text-emerald-600' : 'text-[#ED650B]'}`}>
              {remainingBalance === 0 ? '₹0 (Fully Paid)' : `₹${remainingBalance.toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>

        {/* SECTION NAVIGATION TABS */}
        <div className="flex items-center gap-1 px-6 border-b border-[#E6E8ED] bg-white overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveSection('details')}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'details'
                ? 'border-[#123578] text-[#123578] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Client & Enquiry</span>
          </button>
          <button
            onClick={() => setActiveSection('financials')}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'financials'
                ? 'border-[#123578] text-[#123578] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>2. Financials & Adjustments</span>
          </button>
          <button
            onClick={() => setActiveSection('ledger')}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'ledger'
                ? 'border-[#123578] text-[#123578] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. Payment Ledger & Verification</span>
            {pendingPayments.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>
          <button
            onClick={() => setActiveSection('deliverables')}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'deliverables'
                ? 'border-[#123578] text-[#123578] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>4. Deliverables Checklist</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 font-mono">
              {deliverables.filter(d => d.isDelivered).length}/{deliverables.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSection('audit')}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'audit'
                ? 'border-[#123578] text-[#123578] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>5. History & Audit Trail</span>
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* SECTION 1: CLIENT & ENQUIRY DETAILS */}
          {activeSection === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Client Information */}
                <div className="bg-[#F7F7F5] rounded-2xl p-5 border border-[#E6E8ED] space-y-3">
                  <h3 className="text-sm font-bold text-[#123578] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#ED650B]" />
                    Client & Contact Information
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Brand / Client Name</span>
                      <span className="font-bold text-[#242832] text-sm">{project.clientName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Contact Person</span>
                      <span className="font-semibold text-[#242832]">{linkedEnquiry?.name || project.clientName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Email Address</span>
                        <a href={`mailto:${project.contactEmail}`} className="font-mono text-[#123578] hover:underline">
                          {project.contactEmail || '—'}
                        </a>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Phone Number</span>
                        <a href={`tel:${project.contactPhone}`} className="font-mono text-emerald-700 font-bold hover:underline">
                          {project.contactPhone || '—'}
                        </a>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Services Commissioned</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {project.services.map((srv, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-[#E6E8ED] text-[11px] font-semibold text-[#123578]">
                            {srv}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linked Original Enquiry Details */}
                <div className="bg-[#F7F7F5] rounded-2xl p-5 border border-[#E6E8ED] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#123578] uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#ED650B]" />
                      Original Enquiry Details
                    </h3>
                    {project.enquiryId && (
                      <span className="px-2 py-0.5 rounded bg-[#123578]/10 text-[#123578] font-mono text-[10px] font-bold">
                        {project.enquiryId}
                      </span>
                    )}
                  </div>

                  {linkedEnquiry ? (
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Enquiry Date & Time</span>
                          <span className="font-mono text-[#242832]">
                            {new Date(linkedEnquiry.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Initial Budget Quoted</span>
                          <span className="font-semibold text-[#242832]">{linkedEnquiry.budget || 'Custom Quote'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Original Client Brief & Message</span>
                        <div className="p-3 bg-white rounded-xl border border-[#E6E8ED] text-slate-700 text-xs leading-relaxed max-h-28 overflow-y-auto">
                          {linkedEnquiry.details}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Project Creation Timestamp</span>
                        <span className="font-mono text-slate-600">
                          {new Date(project.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 text-center">
                      Direct project record without linked original enquiry.
                    </div>
                  )}
                </div>

              </div>

              {/* Editable Project Management Details */}
              <div className="bg-white rounded-2xl p-5 border border-[#E6E8ED] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#123578] uppercase tracking-wider">
                    Project Schedule, Status & Internal Notes
                  </h3>
                  {!isEditingProject ? (
                    <button
                      onClick={() => setIsEditingProject(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#EEF2F9] text-[#123578] font-bold text-xs hover:bg-[#123578] hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Project Info</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingProject(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProjectDetails}
                        disabled={saveLoading}
                        className="px-3.5 py-1.5 rounded-lg bg-[#ED650B] text-white font-bold text-xs hover:bg-[#d65805] transition-colors"
                      >
                        {saveLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Project Title</label>
                    <input
                      type="text"
                      disabled={!isEditingProject}
                      value={projectNameInput}
                      onChange={e => setProjectNameInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] bg-[#F7F7F5] disabled:opacity-75 font-semibold text-[#123578]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Work Start Date</label>
                    <input
                      type="date"
                      disabled={!isEditingProject}
                      value={startDateInput}
                      onChange={e => setStartDateInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] bg-[#F7F7F5] disabled:opacity-75 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Project Deadline</label>
                    <input
                      type="date"
                      disabled={!isEditingProject}
                      value={deadlineInput}
                      onChange={e => setDeadlineInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] bg-[#F7F7F5] disabled:opacity-75 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Workflow Status</label>
                    <select
                      disabled={!isEditingProject}
                      value={statusInput}
                      onChange={e => setStatusInput(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] bg-[#F7F7F5] disabled:opacity-75 font-bold text-[#123578]"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Review & Revisions">Review & Revisions</option>
                      <option value="Awaiting Final Payment">Awaiting Final Payment</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Client Payment Portal Link</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`/pay/${project.clientPaymentToken}`}
                        className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] bg-[#EEF2F9]/50 font-mono text-[11px] text-[#123578]"
                      />
                      <button
                        onClick={copyPaymentLink}
                        className="px-3 py-2 rounded-xl bg-[#EEF2F9] text-[#123578] font-bold hover:bg-[#123578] hover:text-white transition-colors flex items-center gap-1 flex-shrink-0"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Internal Project Notes & Collaboration Brief</label>
                  <textarea
                    rows={3}
                    disabled={!isEditingProject}
                    value={notesInput}
                    onChange={e => setNotesInput(e.target.value)}
                    placeholder="Enter private studio notes, client requests, revisions summary..."
                    className="w-full p-3 rounded-xl border border-[#E6E8ED] bg-[#F7F7F5] disabled:opacity-75 text-xs text-[#242832]"
                  />
                </div>
              </div>

              {/* Danger Zone / Revert Action */}
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Accidental Conversion? Revert to Active Enquiry
                  </h4>
                  <p className="text-[11px] text-rose-700 mt-0.5 max-w-xl">
                    Moves this record back to active Enquiries and removes it from Projects. Safe financial guard: Revert is strictly blocked if any payment transactions, invoices, or receipts exist.
                  </p>
                </div>
                <button
                  onClick={() => setShowRevertModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Revert to Enquiry</span>
                </button>
              </div>

            </div>
          )}

          {/* SECTION 2: FINANCIALS & ADJUSTMENTS */}
          {activeSection === 'financials' && (
            <div className="space-y-6">
              
              {/* Financial Snapshot Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-[#E6E8ED] shadow-sm space-y-1">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Agreed Project Total</span>
                  <div className="text-2xl font-bold text-[#123578]">₹{netAgreedAmount.toLocaleString('en-IN')}</div>
                  <p className="text-[11px] text-slate-500">
                    Base: ₹{project.agreedAmount.toLocaleString('en-IN')}
                    {additionSum > 0 && ` + Additions: ₹${additionSum.toLocaleString('en-IN')}`}
                    {discountSum > 0 && ` - Discounts: ₹${discountSum.toLocaleString('en-IN')}`}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E6E8ED] shadow-sm space-y-1">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Advance Terms</span>
                  <div className="text-2xl font-bold text-[#123578]">₹{advanceAgreed.toLocaleString('en-IN')}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-500">Received:</span>
                    <span className={`font-bold text-xs ${advanceReceived >= advanceAgreed ? 'text-emerald-600' : 'text-amber-600'}`}>
                      ₹{advanceReceived.toLocaleString('en-IN')} {advanceReceived >= advanceAgreed ? '(Satisfied ✓)' : '(Pending)'}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E6E8ED] shadow-sm space-y-1">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Balance Outstanding</span>
                  <div className={`text-2xl font-bold ${remainingBalance === 0 ? 'text-emerald-600' : 'text-[#ED650B]'}`}>
                    ₹{remainingBalance.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {remainingBalance === 0 ? 'Project is fully paid.' : 'Awaiting final payment from client.'}
                  </p>
                </div>
              </div>

              {/* Adjustments Section */}
              <div className="bg-white rounded-2xl p-5 border border-[#E6E8ED] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#123578] uppercase tracking-wider">
                      Commercial Adjustments (Discounts, Additions & Waivers)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Track scope additions or agreed fee discounts with full audit reasons.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddAdjustmentModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#EEF2F9] text-[#123578] font-bold text-xs hover:bg-[#123578] hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Adjustment</span>
                  </button>
                </div>

                {adjustments.length === 0 ? (
                  <div className="p-6 bg-[#F7F7F5] rounded-xl text-center text-slate-500 border border-dashed border-slate-200">
                    No financial adjustments recorded. Project is running at original agreed fee of ₹{project.agreedAmount.toLocaleString('en-IN')}.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E6E8ED] border border-[#E6E8ED] rounded-xl overflow-hidden">
                    {adjustments.map(adj => (
                      <div key={adj.id} className="p-3.5 flex items-center justify-between bg-white hover:bg-[#F7F7F5] transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              adj.type === 'discount' ? 'bg-emerald-100 text-emerald-800' :
                              adj.type === 'addition' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {adj.type}
                            </span>
                            <span className="font-bold text-[#123578] text-xs">{adj.reason}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                            Added by {adj.createdBy || 'Akshay'} on {new Date(adj.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <div className="font-bold text-xs">
                          {adj.type === 'addition' ? (
                            <span className="text-blue-700">+₹{adj.amount.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-emerald-700">-₹{adj.amount.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* SECTION 3: PAYMENT LEDGER & TWO-STEP VERIFICATION */}
          {activeSection === 'ledger' && (
            <div className="space-y-6">
              
              {/* Action Banner with Two-Step Verification explanation */}
              <div className="p-4 bg-[#EEF2F9] rounded-2xl border border-[#123578]/15 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-[#123578] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#ED650B]" />
                    Two-Step Verification Payment Ledger
                  </h3>
                  <p className="text-[11px] text-[#242832]/70 max-w-xl">
                    <strong>Step 1:</strong> Record client transaction with UTR & proof &rarr; Status is marked <em>Pending Verification</em>.<br/>
                    <strong>Step 2:</strong> Owner matches bank statement and clicks <em>Verify</em> &rarr; Balance credits and receipt is created.
                  </p>
                </div>
                <button
                  onClick={() => setShowRecordPaymentModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#ED650B] hover:bg-[#d65805] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              </div>

              {/* Duplicate Warning Alert if any active */}
              {projectPayments.some(p => p.duplicateWarningAcknowledged) && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Note: One or more transactions in this ledger had duplicate warnings confirmed by the studio admin.</span>
                </div>
              )}

              {/* Transactions Table */}
              <div className="bg-white rounded-2xl border border-[#E6E8ED] overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[#E6E8ED] flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#123578] uppercase tracking-wider">
                    Project Payment Transactions ({projectPayments.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Verified Total: <strong className="text-emerald-700">₹{totalVerifiedPaid.toLocaleString('en-IN')}</strong>
                  </span>
                </div>

                {projectPayments.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs">No payment transactions recorded for this project yet.</p>
                    <button
                      onClick={() => setShowRecordPaymentModal(true)}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-[#EEF2F9] text-[#123578] font-bold text-xs hover:bg-[#123578] hover:text-white transition-colors"
                    >
                      Record First Payment
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F7F7F5] border-b border-[#E6E8ED] text-[#123578] font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3.5">Payment ID</th>
                          <th className="p-3.5">Date</th>
                          <th className="p-3.5">Amount (INR)</th>
                          <th className="p-3.5">Method & UTR</th>
                          <th className="p-3.5">Proof / Attach</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Verification Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6E8ED]">
                        {projectPayments.map(p => {
                          const receipt = allReceipts.find(r => r.paymentId === p.id);
                          return (
                            <tr key={p.id} className="hover:bg-[#F7F7F5] transition-colors">
                              <td className="p-3.5 font-mono font-bold text-[#123578]">{p.id}</td>
                              <td className="p-3.5 font-mono text-slate-600">
                                {new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}
                              </td>
                              <td className="p-3.5 font-bold text-[#123578]">
                                ₹{p.amount.toLocaleString('en-IN')}
                              </td>
                              <td className="p-3.5">
                                <div className="font-semibold text-slate-800">{p.paymentMethod || 'UPI'}</div>
                                <div className="font-mono text-[11px] text-slate-500 truncate max-w-[150px]">{p.utr}</div>
                              </td>
                              <td className="p-3.5">
                                {p.proofUrl ? (
                                  <a
                                    href={p.proofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ED650B] hover:underline"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{p.proofFileName || 'View Proof'}</span>
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-slate-400">None</span>
                                )}
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 ${
                                  p.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  p.status === 'Pending Verification' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {p.status === 'Verified' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                  {p.status === 'Pending Verification' && <Clock className="w-3 h-3 text-amber-600" />}
                                  {p.status === 'Rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                                  <span>{p.status}</span>
                                </span>
                              </td>
                              <td className="p-3.5 text-right space-x-1.5">
                                {p.status === 'Pending Verification' && (
                                  <>
                                    <button
                                      onClick={() => handleVerifyPayment(p.id)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                                    >
                                      Verify
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRejectingPaymentId(p.id);
                                        setRejectionReason('');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition-colors"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                {p.status === 'Verified' && receipt && (
                                  <button
                                    onClick={() => downloadReceiptPDF(receipt)}
                                    className="px-2.5 py-1 rounded-lg bg-[#EEF2F9] text-[#123578] font-bold text-[11px] hover:bg-[#123578] hover:text-white transition-colors inline-flex items-center gap-1"
                                    title="Download GST / Payment Receipt"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Receipt</span>
                                  </button>
                                )}
                                {p.status === 'Rejected' && (
                                  <span className="text-[10px] text-rose-600 font-medium italic" title={p.rejectionReason}>
                                    {p.rejectionReason || 'Rejected'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* SECTION 4: DELIVERABLES CHECKLIST */}
          {activeSection === 'deliverables' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#123578] uppercase tracking-wider">
                    Project Deliverables & Master Asset Handover
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Upload completed design files and mark each asset as delivered to satisfy the project completion gate.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddDeliverableModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#ED650B] hover:bg-[#d65805] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Deliverable</span>
                </button>
              </div>

              {deliverables.length === 0 ? (
                <div className="p-8 text-center bg-[#F7F7F5] rounded-2xl border border-dashed border-slate-300">
                  <FileCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">No deliverables added for this project yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Deliverables must be added and marked delivered with files uploaded before marking the project complete.
                  </p>
                  <button
                    onClick={() => setShowAddDeliverableModal(true)}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-[#123578] text-white font-bold text-xs hover:bg-[#1f4a9b] transition-colors"
                  >
                    Add First Deliverable
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {deliverables.map(del => (
                    <div
                      key={del.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
                        del.isDelivered
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-white border-[#E6E8ED]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleDeliverableStatus(del)}
                          className={`mt-0.5 p-1 rounded-md transition-colors ${
                            del.isDelivered
                              ? 'bg-emerald-600 text-white'
                              : 'border-2 border-slate-300 text-transparent hover:border-[#123578]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <div>
                          <h4 className={`text-xs font-bold ${del.isDelivered ? 'text-emerald-950 line-through' : 'text-[#123578]'}`}>
                            {del.title}
                          </h4>
                          {del.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{del.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-mono">
                            {del.isDelivered && del.deliveredAt && (
                              <span className="text-emerald-700 font-semibold">
                                Delivered: {new Date(del.deliveredAt).toLocaleDateString('en-IN')}
                              </span>
                            )}
                            {del.fileUrl && (
                              <a
                                href={del.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#ED650B] font-bold hover:underline inline-flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                <span>{del.fileName || 'Download Asset'}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-[#EEF2F9] text-[#123578] font-bold text-[11px] hover:bg-[#123578] hover:text-white transition-colors flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>{del.fileUrl ? 'Replace File' : 'Upload File'}</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) {
                                handleFileUpload(f, 'deliverable');
                              }
                            }}
                          />
                        </label>
                        <button
                          onClick={() => handleDeleteDeliverable(del.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: PROJECT HISTORY & AUDIT TRAIL */}
          {activeSection === 'audit' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#123578] uppercase tracking-wider">
                  Chronological Project Audit Log
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tamper-proof audit record of all project conversions, status changes, payments, deliverables, and verifications.
                </p>
              </div>

              {(!project.auditLog || project.auditLog.length === 0) ? (
                <div className="p-6 bg-[#F7F7F5] rounded-xl text-center text-slate-500">
                  No historic audit events logged yet.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E6E8ED]">
                  {project.auditLog.map(entry => (
                    <div key={entry.id} className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#123578] border-2 border-white ring-2 ring-[#EEF2F9]"></div>
                      <div className="p-3 bg-white rounded-xl border border-[#E6E8ED] text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-[#123578]">{entry.action}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(entry.timestamp).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{entry.details}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          Actor: {entry.actor}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-[#F7F7F5] border-t border-[#E6E8ED] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-mono text-[11px]">ID: {project.id}</span>
            <span>·</span>
            <span>Balance: <strong className={remainingBalance === 0 ? 'text-emerald-600' : 'text-[#ED650B]'}>
              ₹{remainingBalance.toLocaleString('en-IN')}
            </strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-[#E6E8ED] text-[#242832] font-semibold hover:bg-slate-50"
            >
              Close Portal
            </button>
            {project.status !== 'Completed' && (
              <button
                onClick={() => setShowGateCheckModal(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                  canCompleteProject
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#123578] hover:bg-[#1f4a9b] text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark as Done (Check Gate)</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* MODAL: RECORD PAYMENT (TWO-STEP VERIFICATION STEP 1) */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6E8ED] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#123578]">Record Project Payment</h3>
              <button onClick={() => setShowRecordPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Payments are recorded with status <strong>Pending Verification</strong>. Only owner verification credits the client balance.
            </p>

            {paymentError && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs">
                {paymentError}
              </div>
            )}

            {paymentDuplicateWarning && (
              <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Duplicate Payment Detected</strong>
                    <span>{paymentDuplicateWarning}</span>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1 font-semibold text-amber-950">
                  <input
                    type="checkbox"
                    checked={paymentOverrideDuplicate}
                    onChange={e => setPaymentOverrideDuplicate(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Confirm as valid separate transaction (override warning)</span>
                </label>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount (INR) *</label>
                <input
                  type="number"
                  required
                  value={paymentAmountInput}
                  onChange={e => setPaymentAmountInput(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] font-bold text-[#123578]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDateInput}
                    onChange={e => setPaymentDateInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Method</label>
                  <select
                    value={paymentMethodInput}
                    onChange={e => setPaymentMethodInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] font-semibold text-[#123578]"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="Cheque / Cash">Cheque / Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">UTR / Bank Reference No. *</label>
                <input
                  type="text"
                  required
                  value={paymentUtrInput}
                  onChange={e => setPaymentUtrInput(e.target.value)}
                  placeholder="e.g. 20261024881726"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Proof (Screenshot / PDF)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={paymentProofFileName || paymentProofUrl}
                    placeholder="No proof file attached"
                    readOnly
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] bg-[#F7F7F5] text-slate-500 font-mono text-[11px]"
                  />
                  <label className="cursor-pointer px-3 py-2 rounded-xl bg-[#EEF2F9] text-[#123578] font-bold hover:bg-[#123578] hover:text-white transition-colors flex-shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'proof');
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Transaction Notes</label>
                <input
                  type="text"
                  value={paymentNotesInput}
                  onChange={e => setPaymentNotesInput(e.target.value)}
                  placeholder="e.g. 50% project kickoff advance payment"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingPayment || (Boolean(paymentDuplicateWarning) && !paymentOverrideDuplicate)}
                  className="px-4 py-2 rounded-xl bg-[#ED650B] hover:bg-[#d65805] text-white font-bold transition-colors disabled:opacity-50"
                >
                  {recordingPayment ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REJECTION REASON PROMPT */}
      {rejectingPaymentId && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E6E8ED] space-y-4">
            <h3 className="text-base font-bold text-rose-900">Reject Payment Transaction</h3>
            <p className="text-xs text-slate-500">
              Provide reason for rejecting payment {rejectingPaymentId}. This will be permanently recorded in the project audit history.
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. UTR not matched in bank statement, amount mismatch..."
                className="w-full p-3 rounded-xl border border-[#E6E8ED] text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingPaymentId(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPayment}
                disabled={rejectLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                {rejectLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD DELIVERABLE */}
      {showAddDeliverableModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6E8ED] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#123578]">Add Project Deliverable</h3>
              <button onClick={() => setShowAddDeliverableModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDeliverable} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Deliverable Title *</label>
                <input
                  type="text"
                  required
                  value={newDeliverableTitle}
                  onChange={e => setNewDeliverableTitle(e.target.value)}
                  placeholder="e.g. Primary Vector Logo Suite (AI/SVG/PNG)"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] font-semibold text-[#123578]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Deliverable Specifications / Notes</label>
                <textarea
                  rows={2}
                  value={newDeliverableDesc}
                  onChange={e => setNewDeliverableDesc(e.target.value)}
                  placeholder="e.g. CMYK print-ready files, RGB web exports, typography guidelines..."
                  className="w-full p-2.5 rounded-xl border border-[#E6E8ED]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Deliverable File (Optional now, required for completion)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newDeliverableFileName || newDeliverableFileUrl}
                    placeholder="No file attached"
                    readOnly
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] bg-[#F7F7F5] font-mono text-[11px]"
                  />
                  <label className="cursor-pointer px-3 py-2 rounded-xl bg-[#EEF2F9] text-[#123578] font-bold hover:bg-[#123578] hover:text-white transition-colors flex-shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'deliverable');
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeliverableModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deliverableLoading}
                  className="px-4 py-2 rounded-xl bg-[#ED650B] hover:bg-[#d65805] text-white font-bold transition-colors"
                >
                  {deliverableLoading ? 'Adding...' : 'Add Deliverable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD FINANCIAL ADJUSTMENT */}
      {showAddAdjustmentModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6E8ED] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#123578]">Add Commercial Adjustment</h3>
              <button onClick={() => setShowAddAdjustmentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Adjustment Type *</label>
                <select
                  value={adjType}
                  onChange={e => setAdjType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] font-bold text-[#123578]"
                >
                  <option value="discount">Discount (- decreases project fee)</option>
                  <option value="addition">Addition (+ extra deliverables / scope expansion)</option>
                  <option value="waiver">Fee Waiver (- decreases balance due)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount (INR) *</label>
                <input
                  type="number"
                  required
                  value={adjAmount}
                  onChange={e => setAdjAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED] font-bold text-[#123578]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Commercial Reason *</label>
                <input
                  type="text"
                  required
                  value={adjReason}
                  onChange={e => setAdjReason(e.target.value)}
                  placeholder="e.g. Multi-service agency loyalty discount"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E8ED]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAdjustmentModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjLoading}
                  className="px-4 py-2 rounded-xl bg-[#ED650B] hover:bg-[#d65805] text-white font-bold transition-colors"
                >
                  {adjLoading ? 'Saving...' : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REVERT PROJECT TO ENQUIRY */}
      {showRevertModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">Confirm Revert to Enquiry</h3>
                <p className="text-xs text-rose-800 mt-1">
                  Are you sure you want to revert project <strong>{project.id}</strong> back to active enquiries?
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 text-rose-900 rounded-xl text-xs space-y-1">
              <p>• The enquiry will reappear in the active enquiries list with status <em>New</em>.</p>
              <p>• The project will be removed from active projects.</p>
              <p>• <strong>Strict Guard:</strong> If any payments, invoices, or receipts exist, reversal will be blocked.</p>
            </div>

            {revertError && (
              <div className="p-3 bg-rose-100 text-rose-900 rounded-xl text-xs font-semibold">
                {revertError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRevertModal(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRevertToEnquiry}
                disabled={reverting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                {reverting ? 'Reverting...' : 'Yes, Revert Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPLETION GATE CHECKLIST */}
      {showGateCheckModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E6E8ED] space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#ED650B]" />
                <h3 className="text-base font-bold text-[#123578]">Project Completion Gate</h3>
              </div>
              <button onClick={() => setShowGateCheckModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              To guarantee client satisfaction and studio accounting integrity, projects can only be marked as completed when all four conditions are satisfied:
            </p>

            <div className="space-y-3 text-xs">
              
              {/* Condition 1 */}
              <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                cond1DeliverablesPassed ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
              }`}>
                {cond1DeliverablesPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-[#123578]">1. Deliverables Uploaded & Handed Over</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {deliverables.length === 0
                      ? 'No deliverables defined. Please add deliverables and attach files.'
                      : `${deliverables.filter(d => Boolean(d.fileUrl) && d.isDelivered).length} of ${deliverables.length} deliverables complete.`}
                  </p>
                </div>
              </div>

              {/* Condition 2 */}
              <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                cond2FinalPaymentPassed ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
              }`}>
                {cond2FinalPaymentPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-[#123578]">2. Final Payment Recorded & Verified</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Verified Paid: ₹{totalVerifiedPaid.toLocaleString('en-IN')} (Target: ₹{netAgreedAmount.toLocaleString('en-IN')}).
                  </p>
                </div>
              </div>

              {/* Condition 3 */}
              <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                cond3BalancePassed ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
              }`}>
                {cond3BalancePassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-[#123578]">3. Outstanding Balance is ₹0 or Less</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {remainingBalance === 0 ? 'Project account is fully paid.' : `Remaining balance due: ₹${remainingBalance.toLocaleString('en-IN')}.`}
                  </p>
                </div>
              </div>

              {/* Condition 4 */}
              <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                cond4NoPendingPassed ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
              }`}>
                {cond4NoPendingPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-[#123578]">4. No Payments Pending Verification</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {pendingPayments.length === 0
                      ? 'No transactions awaiting verification.'
                      : `${pendingPayments.length} payment transaction(s) pending verification.`}
                  </p>
                </div>
              </div>

            </div>

            {completeError && (
              <div className="p-3 bg-rose-100 text-rose-900 rounded-xl text-xs font-semibold">
                {completeError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowGateCheckModal(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={handleCompleteProject}
                disabled={!canCompleteProject || completingProject}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  canCompleteProject
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {completingProject ? 'Completing...' : canCompleteProject ? 'Confirm & Mark as Done' : 'Criteria Not Met'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
