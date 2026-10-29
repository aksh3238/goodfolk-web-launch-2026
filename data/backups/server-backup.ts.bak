import express from 'express';
import path from 'path';
import fs from 'fs';
import { db, verifyPassword, hashPassword } from './src/server/db';
import type { BankAccount } from './src/types';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// CORS setup
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://aksh3238.github.io',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// JSON and URL-encoded body parsing with 100MB limit for media uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static uploads directory for media files (configurable via UPLOADS_DIR for Render Persistent Disk)
const UPLOADS_DIR = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper functions
function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Authentication Middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: missing authorization token' });
  }
  const token = authHeader.slice(7).trim();
  if (!db.verifySession(token)) {
    return res.status(401).json({ success: false, error: 'Unauthorized: session expired or invalid' });
  }
  next();
}

// ============================================================================
// 1. HEALTH & API DISCOVERY
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'Goodfolk Solution API',
    endpoints: [
      '/api/health',
      '/api/auth/me',
      '/api/admin/overview',
      '/api/admin/bank-accounts',
      '/api/admin/invoices',
      '/api/admin/projects',
      '/api/admin/payments',
      '/api/admin/enquiries',
      '/api/site-content'
    ]
  });
});

// ============================================================================
// 2. AUTHENTICATION & OWNER CREDENTIALS
// ============================================================================

const handleLogin = async (req: express.Request, res: express.Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const owner = db.getOwner();

    if (
      email !== normalizeEmail(owner.email) ||
      !verifyPassword(password, owner.passwordHash, owner.salt)
    ) {
      return res.status(401).json({
        success: false,
        error: 'Invalid owner email or password.'
      });
    }

    const token = db.createSession(owner.id);

    return res.json({
      success: true,
      token,
      user: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: 'owner'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to authenticate at this time.'
    });
  }
};

app.post('/api/admin/login', handleLogin);
app.post('/api/auth/login', handleLogin);

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ authenticated: false });
  }

  const token = authHeader.slice(7).trim();
  const isValid = db.verifySession(token);

  if (!isValid) {
    return res.json({ authenticated: false });
  }

  const owner = db.getOwner();
  return res.json({
    authenticated: true,
    user: {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      role: 'owner'
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    db.deleteSession(token);
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

app.post('/api/auth/update-credentials', requireAdmin, (req, res) => {
  try {
    const { currentPassword, newPassword, name } = req.body || {};
    const owner = db.getOwner();

    if (currentPassword && newPassword) {
      if (!verifyPassword(currentPassword, owner.passwordHash, owner.salt)) {
        return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, error: 'New password must be at least 8 characters long.' });
      }
      const newSalt = hashPassword(newPassword + Date.now(), 'salt').slice(0, 32);
      const newHash = hashPassword(newPassword, newSalt);
      db.updateOwner({ passwordHash: newHash, salt: newSalt });
    }

    if (name && typeof name === 'string') {
      db.updateOwner({ name: name.trim() });
    }

    return res.json({ success: true, message: 'Credentials updated successfully.' });
  } catch (error) {
    console.error('Update credentials error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update credentials.' });
  }
});

// ============================================================================
// 3. ADMIN DASHBOARD & OVERVIEW
// ============================================================================

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  res.json({
    success: true,
    stats: db.getStats()
  });
});

// ============================================================================
// 4. DEDICATED BANK ACCOUNTS MANAGER
// ============================================================================

// List all bank accounts (Private to Admin)
app.get('/api/admin/bank-accounts', requireAdmin, (_req, res) => {
  res.json({
    success: true,
    bankAccounts: db.getBankAccounts()
  });
});

// Add new bank account
app.post('/api/admin/bank-accounts', requireAdmin, (req, res) => {
  try {
    const {
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      accountType,
      internalLabel,
      isDefault,
      isActive
    } = req.body || {};

    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({
        success: false,
        error: 'Account holder name, bank name, account number, and IFSC code are required.'
      });
    }

    const newAccount = db.addBankAccount({
      accountHolderName: String(accountHolderName).trim(),
      bankName: String(bankName).trim(),
      accountNumber: String(accountNumber).trim(),
      ifscCode: String(ifscCode).trim().toUpperCase(),
      branchName: String(branchName || '').trim(),
      accountType: accountType === 'Savings' ? 'Savings' : 'Current',
      internalLabel: String(internalLabel || '').trim() || `${bankName} (${accountType || 'Current'})`,
      isDefault: Boolean(isDefault),
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    return res.status(201).json({
      success: true,
      bankAccount: newAccount
    });
  } catch (error) {
    console.error('Error adding bank account:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add bank account.'
    });
  }
});

// Update bank account
app.put('/api/admin/bank-accounts/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const updates: Partial<BankAccount> = {};
    const body = req.body || {};

    if (body.accountHolderName !== undefined) updates.accountHolderName = String(body.accountHolderName).trim();
    if (body.bankName !== undefined) updates.bankName = String(body.bankName).trim();
    if (body.accountNumber !== undefined) updates.accountNumber = String(body.accountNumber).trim();
    if (body.ifscCode !== undefined) updates.ifscCode = String(body.ifscCode).trim().toUpperCase();
    if (body.branchName !== undefined) updates.branchName = String(body.branchName).trim();
    if (body.accountType !== undefined) updates.accountType = body.accountType === 'Savings' ? 'Savings' : 'Current';
    if (body.internalLabel !== undefined) updates.internalLabel = String(body.internalLabel).trim();
    if (body.isDefault !== undefined) updates.isDefault = Boolean(body.isDefault);
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);

    const updated = db.updateBankAccount(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Bank account not found.' });
    }

    return res.json({
      success: true,
      bankAccount: updated
    });
  } catch (error) {
    console.error('Error updating bank account:', error);
    return res.status(500).json({ success: false, error: 'Failed to update bank account.' });
  }
});

// Delete bank account
app.delete('/api/admin/bank-accounts/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteBankAccount(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Bank account not found.' });
    }
    return res.json({ success: true, message: 'Bank account deleted successfully.' });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete bank account.' });
  }
});

// Set default bank account
app.post('/api/admin/bank-accounts/:id/default', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const account = db.setDefaultBankAccount(id);
    if (!account) {
      return res.status(404).json({ success: false, error: 'Bank account not found.' });
    }
    return res.json({ success: true, bankAccount: account });
  } catch (error) {
    console.error('Error setting default bank account:', error);
    return res.status(500).json({ success: false, error: 'Failed to set default bank account.' });
  }
});

// ============================================================================
// 5. INVOICES & RECEIPTS
// ============================================================================

app.get('/api/admin/invoices', requireAdmin, (_req, res) => {
  res.json({
    success: true,
    invoices: db.getInvoices()
  });
});

app.post('/api/admin/invoices', requireAdmin, (req, res) => {
  try {
    const body = req.body || {};
    if (!body.projectId || !body.clientName || !body.amount) {
      return res.status(400).json({ success: false, error: 'Project, client name, and amount are required.' });
    }

    const newInvoice = db.createInvoice({
      projectId: body.projectId,
      clientName: body.clientName,
      contactEmail: body.contactEmail || '',
      contactPhone: body.contactPhone || '',
      projectName: body.projectName || 'Creative Project',
      amount: Number(body.amount),
      lineItems: Array.isArray(body.lineItems) ? body.lineItems : [{ description: 'Creative Design & Strategic Production Deliverables', amount: Number(body.amount) }],
      issueDate: body.issueDate || new Date().toISOString().split('T')[0],
      dueDate: body.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: body.status || 'Issued',
      notes: body.notes || 'Terms: 50% advance before kickoff, 50% upon final artwork approval.',
      upiId: body.upiId || '9817961412@ibl',
      bankAccountId: body.bankAccountId
    });

    return res.status(201).json({
      success: true,
      invoice: newInvoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ success: false, error: 'Failed to create invoice.' });
  }
});

app.get('/api/admin/receipts', requireAdmin, (_req, res) => {
  res.json({
    success: true,
    receipts: db.getReceipts()
  });
});

// ============================================================================
// 6. ENQUIRIES (Admin & Public)
// ============================================================================

app.get('/api/admin/enquiries', requireAdmin, (_req, res) => {
  res.json({
    success: true,
    enquiries: db.getEnquiries()
  });
});

app.patch('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updated = db.updateEnquiry(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Enquiry not found.' });
  }
  return res.json({ success: true, enquiry: updated });
});

app.post('/api/admin/enquiries/:id/convert', requireAdmin, (req, res) => {
  const { id } = req.params;
  const result = db.convertEnquiryToProject(id, req.body || {}, 'Akshay');
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

app.delete('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
  const deleted = db.deleteEnquiry(req.params.id);
  return res.json({ success: deleted });
});

// Public enquiry submission (with Google Sheets & local persistence)
app.post('/api/enquiries', async (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || body.fullName || '').trim();
    const email = normalizeEmail(body.email);
    const company = String(body.company || body.companyName || body.brand || '').trim();
    const phone = String(body.mobile || body.phone || '').trim();
    const service = String(body.service || body.subject || 'Creative Consultation').trim();
    const budget = String(body.budget || '').trim();
    const deadline = String(body.deadline || '').trim();
    const details = String(body.details || body.message || body.description || '').trim();

    if (!name || !email || !details) {
      return res.status(400).json({
        success: false,
        error: 'Name, email and project details are required.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    // Always persist locally first so enquiries are never lost
    const localEnquiry = db.addEnquiry({
      name,
      email,
      company,
      phone,
      service,
      budget,
      deadline,
      details,
      consent: true
    });

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    let forwardedToSheets = false;

    if (scriptUrl) {
      try {
        const sheetResponse = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            id: localEnquiry.id,
            createdAt: localEnquiry.createdAt,
            name,
            company,
            email,
            mobile: phone,
            service,
            budget,
            deadline,
            details
          }),
          redirect: 'follow'
        });

        if (sheetResponse.ok) {
          forwardedToSheets = true;
        }
      } catch (sheetErr) {
        console.warn('Google Sheets forward error (enquiry saved locally):', sheetErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Your enquiry has been submitted successfully.',
      enquiryId: localEnquiry.id,
      forwardedToSheets,
      enquiry: {
        id: localEnquiry.id,
        status: localEnquiry.status
      }
    });
  } catch (error) {
    console.error('Enquiry submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to submit your enquiry right now.'
    });
  }
});

app.get('/api/enquiries', (_req, res) => {
  res.json({
    success: true,
    enquiries: db.getEnquiries()
  });
});

// General contact form
app.post('/api/contacts', (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || body.fullName || '').trim();
    const email = normalizeEmail(body.email);
    const phone = String(body.phone || body.mobile || '').trim();
    const subject = String(body.subject || 'General Inquiry').trim();
    const message = String(body.message || '').trim();

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
    }

    db.addEnquiry({
      name,
      email,
      company: '',
      phone,
      service: subject,
      budget: 'N/A',
      deadline: 'Flexible',
      details: message,
      consent: true
    });

    return res.status(201).json({
      success: true,
      message: 'Your message has been received.'
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    return res.status(500).json({ success: false, message: 'Unable to submit your message.' });
  }
});

// ============================================================================
// 7. PROJECTS
// ============================================================================

app.get('/api/admin/projects', requireAdmin, (_req, res) => {
  res.json({
    success: true,
    projects: db.getProjects()
  });
});

app.post('/api/admin/projects', requireAdmin, (req, res) => {
  try {
    const body = req.body || {};
    if (!body.clientName || !body.projectName) {
      return res.status(400).json({ success: false, error: 'Client name and project name are required.' });
    }

    const newProject = db.createProject({
      clientName: body.clientName,
      contactEmail: body.contactEmail || '',
      contactPhone: body.contactPhone || '',
      projectName: body.projectName,
      services: Array.isArray(body.services) ? body.services : [body.services || 'Creative Design'],
      agreedAmount: Number(body.agreedAmount) || 0,
      startDate: body.startDate || new Date().toISOString().split('T')[0],
      deadline: body.deadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: body.status || 'In Progress',
      internalNotes: body.internalNotes || '',
      enquiryId: body.enquiryId
    });

    return res.status(201).json({ success: true, project: newProject });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ success: false, error: 'Failed to create project.' });
  }
});

app.patch('/api/admin/projects/:id', requireAdmin, (req, res) => {
  const updated = db.updateProject(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Project not found.' });
  }
  return res.json({ success: true, project: updated });
});

app.delete('/api/admin/projects/:id', requireAdmin, (req, res) => {
  const deleted = db.deleteProject(req.params.id);
  return res.json({ success: deleted });
});

// Revert Project to Enquiry with safe financial check
app.post('/api/admin/projects/:id/revert', requireAdmin, (req, res) => {
  const { id } = req.params;
  const result = db.revertProjectToEnquiry(id, 'Akshay');
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// Project Deliverables
app.post('/api/admin/projects/:id/deliverables', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, description, fileUrl, fileName, fileSize, isDelivered } = req.body || {};
  if (!title) {
    return res.status(400).json({ success: false, error: 'Deliverable title is required.' });
  }
  const result = db.addProjectDeliverable(id, { title, description, fileUrl, fileName, fileSize, isDelivered }, 'Akshay');
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.status(201).json(result);
});

app.put('/api/admin/projects/:id/deliverables/:deliverableId', requireAdmin, (req, res) => {
  const { id, deliverableId } = req.params;
  const result = db.updateProjectDeliverable(id, deliverableId, req.body || {}, 'Akshay');
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

app.delete('/api/admin/projects/:id/deliverables/:deliverableId', requireAdmin, (req, res) => {
  const { id, deliverableId } = req.params;
  const result = db.deleteProjectDeliverable(id, deliverableId, 'Akshay');
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// Project Financial Adjustments
app.post('/api/admin/projects/:id/adjustments', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { type, amount, reason } = req.body || {};
  if (!type || !amount || !reason) {
    return res.status(400).json({ success: false, error: 'Adjustment type, amount, and reason are required.' });
  }
  const result = db.addProjectAdjustment(id, { type, amount: Number(amount), reason }, 'Akshay');
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.status(201).json(result);
});

// Project Internal Payment Recording with duplicate detection & two-step verification
app.post('/api/admin/projects/:id/payments', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { amount, utr, clientName, paymentMethod, paymentDate, notes, proofUrl, proofFileName, overrideDuplicate } = req.body || {};
  if (!amount || !utr) {
    return res.status(400).json({ success: false, error: 'Payment amount and UTR/reference number are required.' });
  }
  const result = db.recordAdminPayment(
    {
      projectId: id,
      amount: Number(amount),
      utr: String(utr).trim(),
      clientName,
      paymentMethod,
      paymentDate,
      notes,
      proofUrl,
      proofFileName,
      overrideDuplicate: Boolean(overrideDuplicate)
    },
    'Akshay'
  );

  if (!result.success) {
    return res.status(result.duplicateWarning ? 409 : 400).json(result);
  }
  return res.status(201).json(result);
});

// Project Completion Gate
app.post('/api/admin/projects/:id/complete', requireAdmin, (req, res) => {
  const { id } = req.params;
  const result = db.completeProject(id, 'Akshay');
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// ============================================================================
// 8. PAYMENTS & VERIFICATION
// ============================================================================

app.get('/api/admin/payments', requireAdmin, (_req, res) => {
  res.json({
    success: true,
    payments: db.getPayments()
  });
});

app.post('/api/admin/payments/:id/verify', requireAdmin, (req, res) => {
  const result = db.verifyPayment(req.params.id, 'Akshay');
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

app.post('/api/admin/payments/:id/reject', requireAdmin, (req, res) => {
  const { reason } = req.body || {};
  const result = db.rejectPayment(req.params.id, reason || 'Transaction not recognized in bank account statement.');
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

// Client Portal payment details
app.get('/api/client/payment-details/:token', (req, res) => {
  const details = db.getClientPaymentDetails(req.params.token);
  if (!details) {
    return res.status(404).json({ success: false, error: 'Payment portal not found.' });
  }
  return res.json({ success: true, data: details });
});

// Client submit payment UTR
app.post('/api/client/submit-payment', (req, res) => {
  const { projectId, amount, utr, clientName, notes } = req.body || {};
  if (!projectId || !amount || !utr || !clientName) {
    return res.status(400).json({ success: false, error: 'Project ID, amount, client name, and UTR reference number are required.' });
  }

  const result = db.submitPayment({
    projectId,
    amount: Number(amount),
    utr: String(utr).trim(),
    clientName,
    notes
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.status(201).json(result);
});

// ============================================================================
// 9. CMS & SITE CONTENT
// ============================================================================

app.get('/api/site-content', (_req, res) => {
  res.json({
    success: true,
    siteContent: db.getSiteContent(),
    portfolioProjects: db.getPortfolioProjects(),
    trustedBrands: db.getTrustedBrands(),
    testimonials: db.getTestimonials(),
    serviceConcepts: db.getServiceConcepts(),
    customSections: db.getCustomSections(),
    mediaLibrary: db.getMediaLibrary()
  });
});

app.put('/api/site-content', requireAdmin, (req, res) => {
  try {
    const body = req.body || {};
    db.updateSiteContent(body.siteContent || body);
    return res.json({
      success: true,
      siteContent: db.getSiteContent()
    });
  } catch (error) {
    console.error('Error updating site content:', error);
    return res.status(500).json({ success: false, error: 'Failed to update site content.' });
  }
});

app.put('/api/admin/content/site', requireAdmin, (req, res) => {
  try {
    const body = req.body || {};
    const updated = db.updateSiteContent(body.siteContent || body);
    return res.json({
      success: true,
      siteContent: updated
    });
  } catch (error) {
    console.error('Error updating site content:', error);
    return res.status(500).json({ success: false, error: 'Failed to update site content.' });
  }
});

app.put('/api/admin/site-content', requireAdmin, (req, res) => {
  try {
    const body = req.body || {};
    const updated = db.updateSiteContent(body.siteContent || body);
    return res.json({
      success: true,
      siteContent: updated
    });
  } catch (error) {
    console.error('Error updating site content:', error);
    return res.status(500).json({ success: false, error: 'Failed to update site content.' });
  }
});

app.get('/api/admin/content', requireAdmin, (_req, res) => {
  res.json({
    success: true,
    siteContent: db.getSiteContent(),
    portfolioProjects: db.getPortfolioProjects(),
    trustedBrands: db.getTrustedBrands(),
    testimonials: db.getTestimonials(),
    customSections: db.getCustomSections(),
    serviceConcepts: db.getServiceConcepts(),
    mediaLibrary: db.getMediaLibrary(),
    contentVersions: db.getContentVersions()
  });
});

app.post('/api/admin/content/draft', requireAdmin, (req, res) => {
  const updated = db.saveDraftContent(req.body);
  return res.json({ success: true, siteContent: updated });
});

app.post('/api/admin/content/publish', requireAdmin, (req, res) => {
  const { siteContent, label } = req.body || {};
  const result = db.publishSiteContent(siteContent || db.getSiteContent(), label);
  return res.json(result);
});

app.get('/api/admin/content/versions', requireAdmin, (_req, res) => {
  res.json({ success: true, versions: db.getContentVersions() });
});

app.post('/api/admin/content/restore/:versionId', requireAdmin, (req, res) => {
  const result = db.restoreContentVersion(req.params.versionId);
  return res.json(result);
});

// General Publish Alias
app.post('/api/admin/publish', requireAdmin, (req, res) => {
  const { label } = req.body || {};
  const result = db.publishSiteContent(db.getSiteContent(), label);
  return res.json(result);
});

// Portfolio Projects REST endpoints
app.post('/api/admin/content/portfolio', requireAdmin, (req, res) => {
  try {
    const project = db.addPortfolioProject(req.body);
    return res.json({ success: true, project });
  } catch (error) {
    console.error('Error adding project:', error);
    return res.status(500).json({ success: false, error: 'Failed to add project.' });
  }
});

app.put('/api/admin/content/portfolio/:id', requireAdmin, (req, res) => {
  try {
    const project = db.updatePortfolioProject(req.params.id, req.body);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found.' });
    return res.json({ success: true, project });
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ success: false, error: 'Failed to update project.' });
  }
});

app.delete('/api/admin/content/portfolio/:id', requireAdmin, (req, res) => {
  try {
    const success = db.deletePortfolioProject(req.params.id);
    return res.json({ success });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete project.' });
  }
});

app.post('/api/admin/content/portfolio/reorder', requireAdmin, (req, res) => {
  try {
    const { orderedIds } = req.body || {};
    const projects = db.reorderPortfolioProjects(orderedIds || []);
    return res.json({ success: true, projects });
  } catch (error) {
    console.error('Error reordering projects:', error);
    return res.status(500).json({ success: false, error: 'Failed to reorder projects.' });
  }
});

app.post('/api/admin/content/portfolio/categories', requireAdmin, (req, res) => {
  try {
    const { category } = req.body || {};
    const categories = db.addPortfolioCategory(category || '');
    return res.json({ success: true, categories });
  } catch (error) {
    console.error('Error adding category:', error);
    return res.status(500).json({ success: false, error: 'Failed to add category.' });
  }
});

// Trusted Brands REST endpoints
app.put('/api/admin/content/brands', requireAdmin, (req, res) => {
  try {
    const { brands } = req.body || {};
    const updated = db.updateTrustedBrands(brands || []);
    return res.json({ success: true, brands: updated });
  } catch (error) {
    console.error('Error updating brands:', error);
    return res.status(500).json({ success: false, error: 'Failed to update brands.' });
  }
});

// Testimonials REST endpoints
app.post('/api/admin/content/testimonials', requireAdmin, (req, res) => {
  try {
    const testimonial = db.addTestimonial(req.body);
    return res.json({ success: true, testimonial });
  } catch (error) {
    console.error('Error adding testimonial:', error);
    return res.status(500).json({ success: false, error: 'Failed to add testimonial.' });
  }
});

app.put('/api/admin/content/testimonials/:id', requireAdmin, (req, res) => {
  try {
    const testimonial = db.updateTestimonial(req.params.id, req.body);
    if (!testimonial) return res.status(404).json({ success: false, error: 'Testimonial not found.' });
    return res.json({ success: true, testimonial });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return res.status(500).json({ success: false, error: 'Failed to update testimonial.' });
  }
});

app.delete('/api/admin/content/testimonials/:id', requireAdmin, (req, res) => {
  try {
    const success = db.deleteTestimonial(req.params.id);
    return res.json({ success });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete testimonial.' });
  }
});

// Custom Sections REST endpoints
app.post('/api/admin/sections', requireAdmin, (req, res) => {
  try {
    const section = db.addCustomSection(req.body);
    return res.json({ success: true, section });
  } catch (error) {
    console.error('Error adding section:', error);
    return res.status(500).json({ success: false, error: 'Failed to add section.' });
  }
});

app.put('/api/admin/sections/:id', requireAdmin, (req, res) => {
  try {
    const section = db.updateCustomSection(req.params.id, req.body);
    if (!section) return res.status(404).json({ success: false, error: 'Section not found.' });
    return res.json({ success: true, section });
  } catch (error) {
    console.error('Error updating section:', error);
    return res.status(500).json({ success: false, error: 'Failed to update section.' });
  }
});

app.delete('/api/admin/sections/:id', requireAdmin, (req, res) => {
  try {
    const success = db.deleteCustomSection(req.params.id);
    return res.json({ success });
  } catch (error) {
    console.error('Error deleting section:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete section.' });
  }
});

// Base64 media upload helper
app.post('/api/admin/upload', requireAdmin, (req, res) => {
  try {
    const { dataUrl, filename } = req.body || {};
    if (!dataUrl) {
      return res.status(400).json({ success: false, error: 'dataUrl is required' });
    }

    let fileUrl = dataUrl;
    const matches = dataUrl.match(/^data:([A-Za-z0-9\-+/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mime = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = mime.includes('png')
        ? '.png'
        : mime.includes('webp')
        ? '.webp'
        : mime.includes('svg')
        ? '.svg'
        : mime.includes('mp4')
        ? '.mp4'
        : mime.includes('gif')
        ? '.gif'
        : '.jpg';
      const cleanBase = (filename || 'asset').replace(/[^a-zA-Z0-9.-]/g, '_');
      const safeFilename = `${Date.now()}-${cleanBase}${cleanBase.endsWith(ext) ? '' : ext}`;
      const destPath = path.join(UPLOADS_DIR, safeFilename);
      fs.writeFileSync(destPath, buffer);
      fileUrl = `/uploads/${safeFilename}`;
    }

    const mediaItem = db.addMediaItem({
      name: filename || `Upload-${Date.now()}`,
      url: fileUrl,
      size: Math.round(dataUrl.length * 0.75),
      mimeType: dataUrl.startsWith('data:video') ? 'video/mp4' : 'image/jpeg'
    });

    return res.json({
      success: true,
      url: fileUrl,
      media: mediaItem
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ success: false, error: 'Failed to process upload.' });
  }
});

// Dedicated Website Images
app.get('/api/admin/website-images', requireAdmin, (_req, res) => {
  res.json({ success: true, images: db.getWebsiteImages() });
});

app.put('/api/admin/website-images/:id', requireAdmin, (req, res) => {
  const updated = db.updateWebsiteImage(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Image slot not found.' });
  }
  return res.json({ success: true, imageSlot: updated });
});

app.post('/api/admin/website-images/:id/restore', requireAdmin, (req, res) => {
  const restored = db.restoreWebsiteImage(req.params.id);
  if (!restored) {
    return res.status(404).json({ success: false, error: 'No previous image to restore.' });
  }
  return res.json({ success: true, imageSlot: restored });
});

// Dedicated Services CMS
app.get('/api/admin/services', (_req, res) => {
  res.json({ success: true, services: db.getServices() });
});

app.put('/api/admin/services/:id', requireAdmin, (req, res) => {
  const updated = db.updateService(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Service not found.' });
  }
  return res.json({ success: true, service: updated });
});

// Dedicated Service Concepts (Case Studies) REST endpoints
app.get('/api/admin/service-concepts', requireAdmin, (req, res) => {
  try {
    const serviceId = req.query.serviceId ? String(req.query.serviceId) : undefined;
    const concepts = db.getServiceConcepts(serviceId);
    return res.json({ success: true, serviceConcepts: concepts });
  } catch (error) {
    console.error('Error fetching service concepts:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch service concepts.' });
  }
});

app.post('/api/admin/service-concepts', requireAdmin, (req, res) => {
  try {
    const { title, serviceId, image, description } = req.body || {};
    if (!title || !serviceId) {
      return res.status(400).json({ success: false, error: 'Title and Associated Service are required.' });
    }
    const concept = db.addServiceConcept({
      serviceId: String(serviceId).trim(),
      title: String(title).trim(),
      category: req.body.category || 'Creative Concept',
      tagline: req.body.tagline || req.body.description || '',
      description: String(description || '').trim(),
      image: String(image || 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80').trim(),
      videoUrl: req.body.videoUrl || '',
      badge: req.body.badge || '',
      deliverables: Array.isArray(req.body.deliverables)
        ? req.body.deliverables
        : typeof req.body.deliverables === 'string'
        ? req.body.deliverables.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      clientName: req.body.clientName || '',
      order: Number(req.body.order) || 1,
      published: req.body.published !== false
    });
    return res.status(201).json({ success: true, concept });
  } catch (error) {
    console.error('Error adding service concept:', error);
    return res.status(500).json({ success: false, error: 'Failed to add service concept.' });
  }
});

app.put('/api/admin/service-concepts/:id', requireAdmin, (req, res) => {
  try {
    const updates = { ...req.body };
    if (typeof updates.deliverables === 'string') {
      updates.deliverables = updates.deliverables.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    const updated = db.updateServiceConcept(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Concept not found.' });
    }
    return res.json({ success: true, concept: updated });
  } catch (error) {
    console.error('Error updating service concept:', error);
    return res.status(500).json({ success: false, error: 'Failed to update service concept.' });
  }
});

app.delete('/api/admin/service-concepts/:id', requireAdmin, (req, res) => {
  try {
    const deleted = db.deleteServiceConcept(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Concept not found.' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting service concept:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete service concept.' });
  }
});

app.post('/api/admin/service-concepts/:id/duplicate', requireAdmin, (req, res) => {
  try {
    const duplicated = db.duplicateServiceConcept(req.params.id);
    if (!duplicated) {
      return res.status(404).json({ success: false, error: 'Concept not found to duplicate.' });
    }
    return res.json({ success: true, concept: duplicated });
  } catch (error) {
    console.error('Error duplicating service concept:', error);
    return res.status(500).json({ success: false, error: 'Failed to duplicate concept.' });
  }
});

app.post('/api/admin/service-concepts/reorder', requireAdmin, (req, res) => {
  try {
    const { orderedIds } = req.body || {};
    const updated = db.reorderServiceConcepts(orderedIds || []);
    return res.json({ success: true, serviceConcepts: updated });
  } catch (error) {
    console.error('Error reordering service concepts:', error);
    return res.status(500).json({ success: false, error: 'Failed to reorder concepts.' });
  }
});

// ============================================================================
// 10. API 404 CATCH-ALL & FRONTEND MOUNTING
// ============================================================================

// Catch all unmatched /api/* routes with a 404 JSON response
app.use('/api', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.'
  });
});

// Global error handler
app.use((
  err: any,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.'
  });
});

async function startServer(): Promise<void> {
  // Mount Vite SPA middlewares in development mode
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the compiled dist folder
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Goodfolk Solution Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
