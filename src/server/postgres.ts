import { Pool } from 'pg';
import type { DatabaseSchema } from './db';
import type {
  Enquiry, Project, PaymentTransaction, Invoice, Receipt,
  CMSPortfolioItem, CMSTestimonial, CMSTrustedBrand, CMSSiteContent,
  MediaItem, CMSCustomSection, CMSServiceConcept, CMSContentVersion,
  BankAccount
} from '../types';

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

let pool: Pool | null = null;

export function getPostgresPool(): Pool | null {
  if (!isPostgresConfigured()) {
    return null;
  }
  if (!pool) {
    const connectionString = process.env.DATABASE_URL!;
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    pool.on('error', (err) => {
      console.warn('[Postgres Pool Warning]:', err.message);
    });
  }
  return pool;
}

let schemaInitialized = false;
let schemaInitPromise: Promise<boolean> | null = null;

/**
 * Ensures schema is initialized once before any read or write queries.
 */
export async function ensureSchemaInitialized(): Promise<boolean> {
  if (schemaInitialized) return true;
  if (!isPostgresConfigured()) return false;
  if (schemaInitPromise) return schemaInitPromise;

  schemaInitPromise = (async () => {
    try {
      const ok = await initPostgresSchema();
      schemaInitialized = ok;
      return ok;
    } catch (e: any) {
      console.warn('[Postgres] ensureSchemaInitialized caught error:', e?.message || e);
      schemaInitialized = false;
      return false;
    } finally {
      schemaInitPromise = null;
    }
  })();

  return schemaInitPromise;
}

/**
 * Initializes all PostgreSQL tables required by Goodfolk Solution.
 */
export async function initPostgresSchema(): Promise<boolean> {
  const p = getPostgresPool();
  if (!p) return false;

  const client = await p.connect();
  try {
    const tableQueries = [
      `CREATE TABLE IF NOT EXISTS owner_credentials (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        name TEXT NOT NULL,
        is_initialized BOOLEAN DEFAULT true,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS admin_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS enquiries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT,
        phone TEXT,
        service TEXT,
        budget TEXT,
        deadline TEXT,
        details TEXT,
        consent BOOLEAN DEFAULT true,
        status TEXT DEFAULT 'New',
        internal_notes TEXT,
        converted_project_id TEXT,
        created_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        client_name TEXT NOT NULL,
        contact_email TEXT,
        contact_phone TEXT,
        project_name TEXT NOT NULL,
        services JSONB,
        agreed_amount NUMERIC DEFAULT 0,
        start_date TEXT,
        deadline TEXT,
        status TEXT DEFAULT 'In Progress',
        internal_notes TEXT,
        client_payment_token TEXT,
        enquiry_id TEXT,
        deliverables JSONB,
        adjustments JSONB,
        audit_log JSONB,
        created_at TEXT,
        updated_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        utr TEXT NOT NULL,
        upi_id TEXT DEFAULT '9817961412@ibl',
        client_name TEXT,
        payment_method TEXT,
        payment_date TEXT,
        notes TEXT,
        proof_url TEXT,
        proof_file_name TEXT,
        status TEXT DEFAULT 'Pending Verification',
        receipt_id TEXT,
        submitted_at TEXT,
        verified_at TEXT,
        verified_by TEXT,
        rejection_reason TEXT,
        created_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        contact_email TEXT,
        contact_phone TEXT,
        project_name TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        line_items JSONB,
        issue_date TEXT,
        due_date TEXT,
        status TEXT DEFAULT 'Issued',
        notes TEXT,
        upi_id TEXT,
        bank_account_id TEXT,
        bank_details JSONB,
        created_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        payment_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        invoice_id TEXT,
        client_name TEXT NOT NULL,
        amount_received NUMERIC NOT NULL,
        utr TEXT NOT NULL,
        verified_date TEXT NOT NULL,
        agreed_project_amount NUMERIC NOT NULL,
        total_verified_paid NUMERIC NOT NULL,
        remaining_balance NUMERIC NOT NULL,
        is_final_receipt BOOLEAN DEFAULT false,
        created_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS bank_accounts (
        id TEXT PRIMARY KEY,
        account_holder_name TEXT NOT NULL,
        bank_name TEXT NOT NULL,
        account_number TEXT NOT NULL,
        ifsc_code TEXT NOT NULL,
        branch_name TEXT,
        account_type TEXT DEFAULT 'Current',
        internal_label TEXT,
        is_default BOOLEAN DEFAULT false,
        isactive BOOLEAN DEFAULT true,
        created_at TEXT,
        updated_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS site_content (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS portfolio_projects (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        order_num INTEGER DEFAULT 1
      );`,
      `CREATE TABLE IF NOT EXISTS service_concepts (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        service_id TEXT,
        order_num INTEGER DEFAULT 1
      );`,
      `CREATE TABLE IF NOT EXISTS trusted_brands (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        logo_url TEXT,
        order_num INTEGER DEFAULT 1,
        active BOOLEAN DEFAULT true
      );`,
      `CREATE TABLE IF NOT EXISTS testimonials (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        order_num INTEGER DEFAULT 1
      );`,
      `CREATE TABLE IF NOT EXISTS custom_sections (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        order_num INTEGER DEFAULT 1
      );`,
      `CREATE TABLE IF NOT EXISTS media_library (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER,
        mime_type TEXT,
        uploaded_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS content_versions (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        label TEXT NOT NULL,
        author TEXT,
        data JSONB NOT NULL
      );`
    ];

    for (const q of tableQueries) {
      await client.query(q);
    }

    schemaInitialized = true;
    console.log('[Postgres] Schema initialization successful. All tables ready.');
    return true;
  } catch (err: any) {
    console.error('[Postgres] Schema initialization error:', err?.message || err);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Loads complete database snapshot from PostgreSQL.
 * Returns null if database is empty or unconfigured.
 */
export async function loadPostgresData(): Promise<DatabaseSchema | null> {
  const p = getPostgresPool();
  if (!p) return null;

  const schemaOk = await ensureSchemaInitialized();
  if (!schemaOk) return null;

  try {
    const ownerRes = await p.query('SELECT * FROM owner_credentials LIMIT 1');
    if (ownerRes.rows.length === 0) {
      return null; // Empty database
    }

    const row = ownerRes.rows[0];
    const owner = {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      salt: row.salt,
      name: row.name,
      isInitialized: row.is_initialized
    };

    // Sessions
    const sessionsRes = await p.query('SELECT * FROM admin_sessions');
    const sessions: Record<string, { userId: string; expiresAt: number }> = {};
    for (const s of sessionsRes.rows) {
      sessions[s.token] = { userId: s.user_id, expiresAt: Number(s.expires_at) };
    }

    // Enquiries
    const enquiriesRes = await p.query('SELECT * FROM enquiries ORDER BY created_at DESC');
    const enquiries: Enquiry[] = enquiriesRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      company: r.company || '',
      phone: r.phone || '',
      service: r.service || '',
      budget: r.budget || '',
      deadline: r.deadline || '',
      details: r.details || '',
      consent: r.consent !== false,
      status: r.status,
      internalNotes: r.internal_notes || '',
      convertedProjectId: r.converted_project_id || undefined,
      createdAt: r.created_at
    }));

    // Projects
    const projectsRes = await p.query('SELECT * FROM projects ORDER BY created_at DESC');
    const projects: Project[] = projectsRes.rows.map(r => ({
      id: r.id,
      clientName: r.client_name,
      contactEmail: r.contact_email || '',
      contactPhone: r.contact_phone || '',
      projectName: r.project_name,
      services: r.services || [],
      agreedAmount: Number(r.agreed_amount) || 0,
      startDate: r.start_date || '',
      deadline: r.deadline || '',
      status: r.status,
      internalNotes: r.internal_notes || '',
      clientPaymentToken: r.client_payment_token || r.id,
      enquiryId: r.enquiry_id || undefined,
      deliverables: r.deliverables || [],
      adjustments: r.adjustments || [],
      auditLog: r.audit_log || [],
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    // Payments
    const paymentsRes = await p.query('SELECT * FROM payments ORDER BY submitted_at DESC');
    const payments: PaymentTransaction[] = paymentsRes.rows.map(r => ({
      id: r.id,
      projectId: r.project_id,
      amount: Number(r.amount),
      utr: r.utr,
      upiId: r.upi_id || '9817961412@ibl',
      clientName: r.client_name || '',
      paymentMethod: r.payment_method || 'UPI',
      paymentDate: r.payment_date || '',
      notes: r.notes || '',
      proofUrl: r.proof_url || undefined,
      proofFileName: r.proof_file_name || undefined,
      status: r.status,
      receiptId: r.receipt_id || undefined,
      verifiedAt: r.verified_at || undefined,
      verifiedBy: r.verified_by || undefined,
      rejectionReason: r.rejection_reason || undefined,
      createdAt: r.created_at || r.submitted_at || new Date().toISOString()
    }));

    // Invoices
    const invoicesRes = await p.query('SELECT * FROM invoices ORDER BY created_at DESC');
    const invoices: Invoice[] = invoicesRes.rows.map(r => ({
      id: r.id,
      projectId: r.project_id,
      clientName: r.client_name,
      contactEmail: r.contact_email || '',
      contactPhone: r.contact_phone || '',
      projectName: r.project_name,
      amount: Number(r.amount),
      lineItems: r.line_items || [],
      issueDate: r.issue_date,
      dueDate: r.due_date,
      status: r.status,
      notes: r.notes || '',
      upiId: r.upi_id,
      bankAccountId: r.bank_account_id || undefined,
      bankDetails: r.bank_details || undefined,
      createdAt: r.created_at
    }));

    // Receipts
    const receiptsRes = await p.query('SELECT * FROM receipts ORDER BY created_at DESC');
    const receipts: Receipt[] = receiptsRes.rows.map(r => ({
      id: r.id,
      paymentId: r.payment_id,
      projectId: r.project_id,
      invoiceId: r.invoice_id || undefined,
      clientName: r.client_name,
      amountReceived: Number(r.amount_received),
      utr: r.utr,
      verifiedDate: r.verified_date,
      agreedProjectAmount: Number(r.agreed_project_amount),
      totalVerifiedPaid: Number(r.total_verified_paid),
      remainingBalance: Number(r.remaining_balance),
      isFinalReceipt: Boolean(r.is_final_receipt),
      createdAt: r.created_at
    }));

    // Bank Accounts
    const bankRes = await p.query('SELECT * FROM bank_accounts ORDER BY is_default DESC');
    const bankAccounts: BankAccount[] = bankRes.rows.map(r => ({
      id: r.id,
      accountHolderName: r.account_holder_name,
      bankName: r.bank_name,
      accountNumber: r.account_number,
      ifscCode: r.ifsc_code,
      branchName: r.branch_name || '',
      accountType: r.account_type,
      internalLabel: r.internal_label || '',
      isDefault: Boolean(r.is_default),
      isActive: Boolean(r.isactive),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    // Site Content
    const scRes = await p.query("SELECT data FROM site_content WHERE id = 'current'");
    const siteContent: CMSSiteContent = scRes.rows.length > 0 ? scRes.rows[0].data : ({} as any);

    // Portfolio Projects
    const pfRes = await p.query('SELECT data FROM portfolio_projects ORDER BY order_num ASC');
    const portfolioProjects: CMSPortfolioItem[] = pfRes.rows.map(r => r.data);

    // Service Concepts
    const scpRes = await p.query('SELECT data FROM service_concepts ORDER BY order_num ASC');
    const serviceConcepts: CMSServiceConcept[] = scpRes.rows.map(r => r.data);

    // Trusted Brands
    const tbRes = await p.query('SELECT * FROM trusted_brands ORDER BY order_num ASC');
    const trustedBrands: CMSTrustedBrand[] = tbRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      logoUrl: r.logo_url || '',
      order: r.order_num || 1,
      active: r.active !== false
    }));

    // Testimonials
    const tstRes = await p.query('SELECT data FROM testimonials ORDER BY order_num ASC');
    const testimonials: CMSTestimonial[] = tstRes.rows.map(r => r.data);

    // Custom Sections
    const csRes = await p.query('SELECT data FROM custom_sections ORDER BY order_num ASC');
    const customSections: CMSCustomSection[] = csRes.rows.map(r => r.data);

    // Media Library
    const mlRes = await p.query('SELECT * FROM media_library ORDER BY uploaded_at DESC');
    const mediaLibrary: MediaItem[] = mlRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      url: r.url,
      size: r.size || 0,
      mimeType: r.mime_type || '',
      uploadedAt: r.uploaded_at
    }));

    // Content Versions
    const cvRes = await p.query('SELECT * FROM content_versions ORDER BY timestamp DESC');
    const contentVersions: CMSContentVersion[] = cvRes.rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      label: r.label,
      siteContent: r.data
    }));

    return {
      owner,
      sessions,
      enquiries,
      projects,
      payments,
      invoices,
      receipts,
      bankAccounts,
      siteContent,
      portfolioProjects,
      serviceConcepts,
      trustedBrands,
      testimonials,
      customSections,
      mediaLibrary,
      contentVersions
    };
  } catch (err) {
    console.error('[Postgres] Error loading snapshot from PostgreSQL:', err);
    return null;
  }
}

/**
 * Seeds or writes the complete database schema into PostgreSQL.
 */
export async function syncPostgresData(data: DatabaseSchema): Promise<boolean> {
  const p = getPostgresPool();
  if (!p) return false;

  const schemaOk = await ensureSchemaInitialized();
  if (!schemaOk) {
    return false;
  }

  const client = await p.connect();
  try {
    await client.query('BEGIN');

    // 1. Owner
    if (data.owner) {
      await client.query(`
        INSERT INTO owner_credentials (id, email, password_hash, salt, name, is_initialized, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          salt = EXCLUDED.salt,
          name = EXCLUDED.name,
          updated_at = NOW();
      `, [
        data.owner.id,
        data.owner.email,
        data.owner.passwordHash,
        data.owner.salt,
        data.owner.name,
        data.owner.isInitialized !== false
      ]);
    }

    // 2. Sessions (refresh active sessions)
    await client.query('DELETE FROM admin_sessions');
    for (const [token, session] of Object.entries(data.sessions || {})) {
      if (session.expiresAt > Date.now()) {
        await client.query(`
          INSERT INTO admin_sessions (token, user_id, expires_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (token) DO UPDATE SET expires_at = EXCLUDED.expires_at;
        `, [token, session.userId, session.expiresAt]);
      }
    }

    // 3. Enquiries
    if (Array.isArray(data.enquiries)) {
      for (const e of data.enquiries) {
        await client.query(`
          INSERT INTO enquiries (id, name, email, company, phone, service, budget, deadline, details, consent, status, internal_notes, converted_project_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            internal_notes = EXCLUDED.internal_notes,
            converted_project_id = EXCLUDED.converted_project_id;
        `, [
          e.id, e.name, e.email, e.company || '', e.phone || '', e.service || '',
          e.budget || '', e.deadline || '', e.details || '', e.consent !== false,
          e.status || 'New', e.internalNotes || '', e.convertedProjectId || null,
          e.createdAt || new Date().toISOString()
        ]);
      }
    }

    // 4. Projects
    if (Array.isArray(data.projects)) {
      for (const pr of data.projects) {
        await client.query(`
          INSERT INTO projects (id, client_name, contact_email, contact_phone, project_name, services, agreed_amount, start_date, deadline, status, internal_notes, client_payment_token, enquiry_id, deliverables, adjustments, audit_log, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            agreed_amount = EXCLUDED.agreed_amount,
            deliverables = EXCLUDED.deliverables,
            adjustments = EXCLUDED.adjustments,
            audit_log = EXCLUDED.audit_log,
            internal_notes = EXCLUDED.internal_notes,
            client_payment_token = EXCLUDED.client_payment_token,
            updated_at = EXCLUDED.updated_at;
        `, [
          pr.id, pr.clientName, pr.contactEmail || '', pr.contactPhone || '', pr.projectName,
          JSON.stringify(pr.services || []), pr.agreedAmount || 0, pr.startDate || '',
          pr.deadline || '', pr.status || 'In Progress', pr.internalNotes || '',
          pr.clientPaymentToken || pr.id, pr.enquiryId || null,
          JSON.stringify(pr.deliverables || []), JSON.stringify(pr.adjustments || []),
          JSON.stringify(pr.auditLog || []),
          pr.createdAt || new Date().toISOString(), pr.updatedAt || new Date().toISOString()
        ]);
      }
    }

    // 5. Payments
    if (Array.isArray(data.payments)) {
      for (const pay of data.payments) {
        await client.query(`
          INSERT INTO payments (id, project_id, amount, utr, upi_id, client_name, payment_method, payment_date, notes, proof_url, proof_file_name, status, receipt_id, submitted_at, verified_at, verified_by, rejection_reason, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            receipt_id = EXCLUDED.receipt_id,
            verified_at = EXCLUDED.verified_at,
            verified_by = EXCLUDED.verified_by,
            rejection_reason = EXCLUDED.rejection_reason;
        `, [
          pay.id, pay.projectId, pay.amount, pay.utr, pay.upiId || '9817961412@ibl',
          pay.clientName || '', pay.paymentMethod || 'UPI',
          pay.paymentDate || '', pay.notes || '', pay.proofUrl || null, pay.proofFileName || null,
          pay.status || 'Pending Verification', pay.receiptId || null, pay.createdAt || new Date().toISOString(),
          pay.verifiedAt || null, pay.verifiedBy || null, pay.rejectionReason || null,
          pay.createdAt || new Date().toISOString()
        ]);
      }
    }

    // 6. Invoices
    if (Array.isArray(data.invoices)) {
      for (const inv of data.invoices) {
        await client.query(`
          INSERT INTO invoices (id, project_id, client_name, contact_email, contact_phone, project_name, amount, line_items, issue_date, due_date, status, notes, upi_id, bank_account_id, bank_details, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            notes = EXCLUDED.notes;
        `, [
          inv.id, inv.projectId, inv.clientName, inv.contactEmail || '', inv.contactPhone || '', inv.projectName,
          inv.amount, JSON.stringify(inv.lineItems || []), inv.issueDate, inv.dueDate, inv.status || 'Issued',
          inv.notes || '', inv.upiId, inv.bankAccountId || null, JSON.stringify(inv.bankDetails || {}), inv.createdAt
        ]);
      }
    }

    // 7. Receipts
    if (Array.isArray(data.receipts)) {
      for (const rc of data.receipts) {
        await client.query(`
          INSERT INTO receipts (id, payment_id, project_id, invoice_id, client_name, amount_received, utr, verified_date, agreed_project_amount, total_verified_paid, remaining_balance, is_final_receipt, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO NOTHING;
        `, [
          rc.id, rc.paymentId, rc.projectId, rc.invoiceId || null, rc.clientName, rc.amountReceived,
          rc.utr, rc.verifiedDate, rc.agreedProjectAmount, rc.totalVerifiedPaid, rc.remainingBalance,
          rc.isFinalReceipt || false, rc.createdAt
        ]);
      }
    }

    // 8. Bank Accounts
    if (Array.isArray(data.bankAccounts)) {
      for (const b of data.bankAccounts) {
        await client.query(`
          INSERT INTO bank_accounts (id, account_holder_name, bank_name, account_number, ifsc_code, branch_name, account_type, internal_label, is_default, isactive, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            account_holder_name = EXCLUDED.account_holder_name,
            bank_name = EXCLUDED.bank_name,
            account_number = EXCLUDED.account_number,
            ifsc_code = EXCLUDED.ifsc_code,
            branch_name = EXCLUDED.branch_name,
            account_type = EXCLUDED.account_type,
            internal_label = EXCLUDED.internal_label,
            is_default = EXCLUDED.is_default,
            isactive = EXCLUDED.isactive,
            updated_at = EXCLUDED.updated_at;
        `, [
          b.id, b.accountHolderName, b.bankName, b.accountNumber, b.ifscCode, b.branchName || '',
          b.accountType || 'Current', b.internalLabel || '', b.isDefault || false, b.isActive !== false,
          b.createdAt || new Date().toISOString(), b.updatedAt || new Date().toISOString()
        ]);
      }
    }

    // 9. Site Content
    if (data.siteContent) {
      await client.query(`
        INSERT INTO site_content (id, data, updated_at)
        VALUES ('current', $1, NOW())
        ON CONFLICT (id) DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = NOW();
      `, [JSON.stringify(data.siteContent)]);
    }

    // 10. Portfolio Projects
    if (Array.isArray(data.portfolioProjects)) {
      await client.query('DELETE FROM portfolio_projects');
      for (let i = 0; i < data.portfolioProjects.length; i++) {
        const pf = data.portfolioProjects[i];
        await client.query(`
          INSERT INTO portfolio_projects (id, data, order_num)
          VALUES ($1, $2, $3);
        `, [pf.id, JSON.stringify(pf), pf.order || i + 1]);
      }
    }

    // 11. Service Concepts
    if (Array.isArray(data.serviceConcepts)) {
      await client.query('DELETE FROM service_concepts');
      for (let i = 0; i < data.serviceConcepts.length; i++) {
        const sc = data.serviceConcepts[i];
        await client.query(`
          INSERT INTO service_concepts (id, data, service_id, order_num)
          VALUES ($1, $2, $3, $4);
        `, [sc.id, JSON.stringify(sc), sc.serviceId, sc.order || i + 1]);
      }
    }

    // 12. Trusted Brands
    if (Array.isArray(data.trustedBrands)) {
      await client.query('DELETE FROM trusted_brands');
      for (const tb of data.trustedBrands) {
        await client.query(`
          INSERT INTO trusted_brands (id, name, logo_url, order_num, active)
          VALUES ($1, $2, $3, $4, $5);
        `, [tb.id, tb.name, tb.logoUrl || '', tb.order || 1, tb.active !== false]);
      }
    }

    // 13. Testimonials
    if (Array.isArray(data.testimonials)) {
      await client.query('DELETE FROM testimonials');
      for (const t of data.testimonials) {
        await client.query(`
          INSERT INTO testimonials (id, data, order_num)
          VALUES ($1, $2, $3);
        `, [t.id, JSON.stringify(t), t.order || 1]);
      }
    }

    // 14. Custom Sections
    if (Array.isArray(data.customSections)) {
      await client.query('DELETE FROM custom_sections');
      for (const cs of data.customSections) {
        await client.query(`
          INSERT INTO custom_sections (id, data, order_num)
          VALUES ($1, $2, $3);
        `, [cs.id, JSON.stringify(cs), cs.order || 1]);
      }
    }

    // 15. Media Library
    if (Array.isArray(data.mediaLibrary)) {
      for (const m of data.mediaLibrary) {
        await client.query(`
          INSERT INTO media_library (id, name, url, size, mime_type, uploaded_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url;
        `, [m.id, m.name, m.url, m.size || 0, m.mimeType || '', m.uploadedAt || new Date().toISOString()]);
      }
    }

    // 16. Content Versions
    if (Array.isArray(data.contentVersions)) {
      for (const cv of data.contentVersions) {
        await client.query(`
          INSERT INTO content_versions (id, timestamp, label, author, data)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO NOTHING;
        `, [cv.id, cv.timestamp, cv.label, 'Admin', JSON.stringify(cv.siteContent || {})]);
      }
    }

    await client.query('COMMIT');
    console.log('[Postgres] Synchronized database changes to PostgreSQL.');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Postgres] Error synchronizing data to PostgreSQL:', err);
    return false;
  } finally {
    client.release();
  }
}
