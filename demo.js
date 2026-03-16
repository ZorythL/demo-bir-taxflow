/* ============================================================
   LOGIN / LANDING
============================================================ */
function loginTo(page) {
  document.getElementById('login-screen').style.display = 'none';
  if (page === 'clients') {
    document.getElementById('client-portal').style.display = 'block';
    document.getElementById('app').style.display = 'none';
    renderClientPortal();
  } else {
    document.getElementById('client-portal').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    navigateTo(page);
  }
  lucide.createIcons();
}

function logout() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('client-portal').style.display = 'none';
  document.getElementById('app').style.display = 'none';
  lucide.createIcons();
}

function renderClientPortal() {
  const clients = load(KEYS.clients);
  const filings = load(KEYS.filings);
  const invoices = load(KEYS.invoices);

  // Use first client (ABC Trading Corp) as the demo client
  const client = clients[0];
  if (!client) return;

  const members = load(KEYS.members);
  const myFilings = filings.filter(f => f.clientName === client.name);
  const myInvoices = invoices.filter(inv => inv.client === client.name);
  const myMembers = members.filter(m => m.client_id === client.id);

  // Header & welcome — pull from client data
  const firstName = client.contact ? client.contact.split(' ')[0] : client.name;
  document.getElementById('cp-header-contact').textContent = client.contact || client.name;
  document.getElementById('cp-header-company').textContent = client.name;
  document.getElementById('cp-welcome-title').textContent = 'Welcome, ' + firstName;
  document.getElementById('cp-welcome-sub').textContent = "Here's an overview of " + client.name + "'s tax compliance status.";

  // Company info — from client record
  const taxTypeLabel = client.taxType === 'VAT' ? 'VAT Registered' : client.taxType === 'Non-VAT' ? 'Non-VAT (Percentage Tax)' : client.taxType;
  document.getElementById('cp-company-info').innerHTML = [
    { label: 'TIN', value: client.tin },
    { label: 'RDO Code', value: client.rdo },
    { label: 'Tax Type', value: taxTypeLabel },
    { label: 'Business Type', value: client.type },
    { label: 'Industry', value: client.industry },
    { label: 'COR Number', value: client.cor || '—' },
    { label: 'BIR Registration', value: fmtDate(client.birDate) },
    { label: 'Fiscal Year End', value: client.fyEnd },
    { label: 'Books of Accounts', value: client.books },
    { label: 'ATP Status', value: client.atp },
    { label: 'Address', value: [client.address, client.city, client.province, client.zip].filter(Boolean).join(', ') },
    { label: 'Assigned Accountant', value: client.accountant },
  ].map(i => `<div class="cp-info-item"><span class="cp-info-label">${i.label}</span><span class="cp-info-value">${i.value || '—'}</span></div>`).join('');

  // Stats
  const filed = myFilings.filter(f => f.filingStatus === 'Filed').length;
  const pending = myFilings.filter(f => f.filingStatus === 'Pending').length;
  const overdue = myFilings.filter(f => f.filingStatus === 'Overdue').length;
  const totalPaid = myFilings.filter(f => f.paymentStatus === 'Paid').reduce((s, f) => s + (f.amount || 0), 0);

  document.getElementById('cp-stats').innerHTML = [
    { label: 'Total Filings', value: myFilings.length, icon: 'file-text', color: '#3B82F6' },
    { label: 'Filed', value: filed, icon: 'check-circle', color: '#10B981' },
    { label: 'Pending', value: pending, icon: 'clock', color: '#F59E0B' },
    { label: 'Overdue', value: overdue, icon: 'alert-circle', color: '#EF4444' },
  ].map(s => `
    <div class="stat-card">
      <div class="stat-icon" style="background:${s.color}15;color:${s.color}"><i data-lucide="${s.icon}"></i></div>
      <div class="stat-info"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>
    </div>`).join('');

  // Upcoming deadlines (pending/overdue, sorted by date)
  const upcoming = myFilings
    .filter(f => f.filingStatus !== 'Filed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  document.querySelector('#cp-deadlines-table tbody').innerHTML = upcoming.length
    ? upcoming.map(f => `<tr>
        <td><strong>${f.form}</strong></td>
        <td>${f.period}</td>
        <td>${fmtDate(f.dueDate)}</td>
        <td>${statusBadge(f.filingStatus)}</td>
      </tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center;color:#9CA3AF;padding:20px;">All filings are up to date!</td></tr>';

  // Members
  document.querySelector('#cp-members-table tbody').innerHTML = myMembers.length
    ? myMembers.map(m => `<tr>
        <td><strong>${m.full_name}</strong></td>
        <td>${roleBadge(m.role)}</td>
        <td>${m.tin}</td>
        <td>${m.email}</td>
        <td>${m.phone}</td>
      </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:#9CA3AF;padding:20px;">No members recorded.</td></tr>';

  // All filings
  document.querySelector('#cp-filings-table tbody').innerHTML = myFilings
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
    .map(f => `<tr>
      <td><strong>${f.form}</strong></td>
      <td>${f.period}</td>
      <td>${fmtDate(f.dueDate)}</td>
      <td>${statusBadge(f.filingStatus)}</td>
      <td>${statusBadge(f.paymentStatus)}</td>
      <td>${php(f.amount)}</td>
    </tr>`).join('');

  // Invoices
  document.querySelector('#cp-invoices-table tbody').innerHTML = myInvoices.length
    ? myInvoices.map(inv => {
        const vat = inv.amount * 0.12;
        const total = inv.amount + vat;
        return `<tr>
          <td><strong>${inv.id}</strong></td>
          <td>${inv.description}</td>
          <td>${php(inv.amount)}</td>
          <td>${php(vat)}</td>
          <td><strong>${php(total)}</strong></td>
          <td>${statusBadge(inv.status)}</td>
          <td>${fmtDate(inv.dueDate)}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="7" style="text-align:center;color:#9CA3AF;padding:20px;">No invoices yet.</td></tr>';
}

/* ============================================================
   UTILITY
============================================================ */
const php = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uid = () => Math.random().toString(36).substr(2, 9);
const today = () => new Date().toISOString().split('T')[0];
const avatarColors = ['#4F46E5','#10B981','#F59E0B','#3B82F6','#8B5CF6','#EF4444','#0EA5E9','#14B8A6'];

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
}

function statusBadge(status) {
  const map = {
    'Active':   'badge-green',
    'Inactive': 'badge-gray',
    'Pending':  'badge-yellow',
    'Filed':    'badge-green',
    'Overdue':  'badge-red',
    'Paid':     'badge-green',
    'Unpaid':   'badge-yellow',
    'Partial':  'badge-blue',
    'Urgent':   'badge-red',
    'High':     'badge-yellow',
    'Medium':   'badge-blue',
    'Low':      'badge-gray',
    'To Do':    'badge-gray',
    'In Progress':'badge-blue',
    'Review':   'badge-purple',
    'Completed':'badge-green',
    'Sent':     'badge-blue',
    'Draft':    'badge-gray',
  };
  return `<span class="badge ${map[status]||'badge-gray'}">${status}</span>`;
}

function roleBadge(role) {
  const map = {
    'Owner':                    'badge-purple',
    'President':                'badge-indigo',
    'Treasurer':                'badge-blue',
    'Secretary':                'badge-green',
    'Director':                 'badge-gray',
    'Authorized Representative':'badge-yellow',
  };
  return `<span class="badge ${map[role]||'badge-gray'}">${role}</span>`;
}

function fmtDate(d) {
  if (!d) return '—';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(parts[1])-1]} ${parseInt(parts[2])}, ${parts[0]}`;
}

/* ============================================================
   LOCAL STORAGE
============================================================ */
const KEYS = {
  init:     'birtaxflow_initialized',
  clients:  'birtaxflow_clients',
  filings:  'birtaxflow_filings',
  tasks:    'birtaxflow_tasks',
  invoices: 'birtaxflow_invoices',
  members:  'birtaxflow_members',
};

function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}

/* ============================================================
   DEMO DATA SEED
============================================================ */
function initDemoData() {
  // Re-seed if data version changed or client data is missing
  const DATA_VERSION = '4';
  const existingClients = load(KEYS.clients);
  const existingMembers = load(KEYS.members);
  if (localStorage.getItem(KEYS.init) === DATA_VERSION && existingClients.length > 0 && existingMembers.length > 0) return;
  // Clear everything and re-seed
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));

  const clients = [
    { id: uid(), name: 'ABC Trading Corp',       trade: 'ABC Trading',       tin: '123-456-789-000', rdo: '040', cor: 'OCN-2019-04-12345', birDate: '2019-04-15', taxType: 'VAT',     type: 'Corporation',         industry: 'Wholesale Trading',      sec: 'CS201904567',  fyEnd: 'Dec 31', books: 'Computerized', atp: 'Active', incDate: '2019-03-01', contact: 'Roberto Cruz',    phone: '+63 917 111 0001', email: 'rcruz@abctrading.ph',     address: '3F Makati Trade Center, Gil Puyat Ave', city: 'Makati City',   province: 'Metro Manila', zip: '1227', bank: 'BDO',       bankAcct: '0012-3456-7890', status: 'Active',   accountant: 'Maria Santos',  notes: '' },
    { id: uid(), name: 'XYZ Services Inc',        trade: '',                  tin: '234-567-890-000', rdo: '044', cor: 'OCN-2020-07-23456', birDate: '2020-07-20', taxType: 'VAT',     type: 'Corporation',         industry: 'IT Consulting',          sec: 'CS202012890',  fyEnd: 'Dec 31', books: 'Computerized', atp: 'Active', incDate: '2020-06-15', contact: 'Linda Gomez',     phone: '+63 917 111 0002', email: 'lgomez@xyzservices.ph',   address: '18F Cyber One Tower, Eastwood',         city: 'Quezon City',   province: 'Metro Manila', zip: '1110', bank: 'BPI',       bankAcct: '3456-7890-1234', status: 'Active',   accountant: 'Jose Reyes',    notes: '' },
    { id: uid(), name: 'Manila Bay Holdings',     trade: 'MB Holdings',       tin: '345-678-901-000', rdo: '033', cor: 'OCN-2017-11-34567', birDate: '2017-11-10', taxType: 'VAT',     type: 'Corporation',         industry: 'Real Estate',            sec: 'CS201734567',  fyEnd: 'Dec 31', books: 'Computerized', atp: 'Active', incDate: '2017-10-05', contact: 'Ernesto Tan',     phone: '+63 917 111 0003', email: 'etan@manilabay.ph',       address: 'Penthouse, PBCOM Tower, Ayala Ave',     city: 'Makati City',   province: 'Metro Manila', zip: '1226', bank: 'Metrobank', bankAcct: '6789-0123-4567', status: 'Active',   accountant: 'Ana Cruz',      notes: 'Large client, multiple properties' },
    { id: uid(), name: 'Global Tech PH',          trade: 'GlobalTech',        tin: '456-789-012-000', rdo: '055', cor: 'OCN-2021-02-45678', birDate: '2021-02-14', taxType: 'VAT',     type: 'Corporation',         industry: 'Software Development',   sec: 'CS202145678',  fyEnd: 'Dec 31', books: 'Computerized', atp: 'Active', incDate: '2021-01-10', contact: 'Grace Villanueva',phone: '+63 917 111 0004', email: 'gv@globaltech.ph',        address: 'Unit 5A, BGC Corporate Center',        city: 'Taguig City',   province: 'Metro Manila', zip: '1634', bank: 'UnionBank', bankAcct: '1098-7654-3210', status: 'Active',   accountant: 'Maria Santos',  notes: '' },
    { id: uid(), name: 'Santos Enterprises',      trade: 'Santos Gen. Mdse.', tin: '567-890-123-000', rdo: '033', cor: 'OCN-2015-06-56789', birDate: '2015-06-20', taxType: 'Non-VAT', type: 'Sole Proprietorship', industry: 'General Merchandise',    sec: 'DTI-04-12345', fyEnd: 'Dec 31', books: 'Manual',       atp: 'For Renewal', incDate: '2015-05-10', contact: 'Pedro Santos',    phone: '+63 917 111 0005', email: 'pedro@santosentprise.ph', address: '145 Rizal St, Brgy. Poblacion',         city: 'San Pablo City', province: 'Laguna',       zip: '4000', bank: 'Landbank', bankAcct: '2345-6789-0123', status: 'Active',   accountant: 'Carlo Bautista', notes: 'ATP expiring June 2026' },
    { id: uid(), name: 'Reyes Construction',      trade: '',                  tin: '678-901-234-000', rdo: '050', cor: 'OCN-2018-09-67890', birDate: '2018-09-05', taxType: 'VAT',     type: 'Corporation',         industry: 'Construction',           sec: 'CS201867890',  fyEnd: 'Dec 31', books: 'Loose-leaf',   atp: 'Expired',     incDate: '2018-08-01', contact: 'Danilo Reyes',    phone: '+63 917 111 0006', email: 'dreyes@reyesconstruct.ph',address: '88 MacArthur Hwy, Brgy. Tabang',        city: 'Guiguinto',     province: 'Bulacan',      zip: '3015', bank: 'PNB',       bankAcct: '4567-8901-2345', status: 'Inactive', accountant: 'Jose Reyes',    notes: 'Operations paused. ATP needs renewal.' },
    { id: uid(), name: 'Pacific Food Industries', trade: 'PacFood',          tin: '789-012-345-000', rdo: '038', cor: 'OCN-2016-03-78901', birDate: '2016-03-18', taxType: 'VAT',     type: 'Corporation',         industry: 'Food Manufacturing',     sec: 'CS201678901',  fyEnd: 'Dec 31', books: 'Computerized', atp: 'Active', incDate: '2016-02-10', contact: 'Marisol Lim',     phone: '+63 917 111 0007', email: 'mlim@pacificfood.ph',     address: 'Lot 5, Block 3, LISP II',               city: 'Calamba City',  province: 'Laguna',       zip: '4027', bank: 'BDO',       bankAcct: '7890-1234-5678', status: 'Active',   accountant: 'Ana Cruz',      notes: '' },
    { id: uid(), name: 'Diamond Logistics',       trade: '',                  tin: '890-123-456-000', rdo: '043', cor: 'OCN-2023-01-89012', birDate: '2023-01-25', taxType: 'VAT',     type: 'Partnership',         industry: 'Freight & Logistics',    sec: 'CS202389012',  fyEnd: 'Dec 31', books: 'Computerized', atp: 'Active', incDate: '2022-12-15', contact: 'Arnold Dela Cruz',phone: '+63 917 111 0008', email: 'adc@diamondlogistics.ph', address: '12 Port Area, South Harbor',            city: 'Manila',        province: 'Metro Manila', zip: '1018', bank: 'BPI',       bankAcct: '9012-3456-7890', status: 'Active',   accountant: 'Maria Santos',  notes: 'New client, onboarding in progress' },
  ];

  const cid = clients.map(c => c.id);

  // ──────────────────────────────────────────────────────────────
  // BIR FILING SCHEDULE — Based on actual Philippine tax deadlines
  // ──────────────────────────────────────────────────────────────
  // MONTHLY forms & deadlines:
  //   2550M  (VAT)                      — due 25th of following month
  //   1601C  (Withholding Tax on Comp)  — due 10th of following month
  //   0619E  (Expanded Withholding Tax) — due 10th of following month
  //   0619F  (Final Withholding Tax)    — due 10th of following month
  // QUARTERLY forms & deadlines:
  //   2550Q  (Quarterly VAT)            — due 25th of month after quarter
  //   2551Q  (Quarterly % Tax)          — due 25th of month after quarter
  //   1601EQ (Quarterly EWT Return)     — due last day of month after quarter
  //   1701Q  (Quarterly Income Tax)     — due 15th of month after quarter (May 15, Aug 15, Nov 15)
  // ANNUAL forms & deadlines:
  //   0605   (Annual Registration Fee ₱500)   — due Jan 31
  //   1604CF (Annual Info Return — Comp WT)    — due Jan 31
  //   1604E  (Annual Info Return — EWT)        — due Mar 1
  //   Alphalist (of Employees)                 — due Jan 31
  //   1701   (Annual ITR — Self-employed)      — due Apr 15
  //   1701A  (Annual ITR — Compensation only)  — due Apr 15
  //   1702   (Annual ITR — Corporations)       — due Apr 15 (or 4th month after FY end)
  //   2316   (Certificate of Comp Payment)     — due Jan 31 (issued to employees)
  // ──────────────────────────────────────────────────────────────

  const cn = [ // client names shorthand
    'ABC Trading Corp','XYZ Services Inc','Manila Bay Holdings','Global Tech PH',
    'Santos Enterprises','Reyes Construction','Pacific Food Industries','Diamond Logistics'
  ];

  const filings = [
    // ═══════════════════════════════════════
    // ANNUAL — January 31 deadlines
    // ═══════════════════════════════════════
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '0605',      period: 'AY 2026',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 500    },
    { id: uid(), clientId: cid[1], clientName: cn[1], form: '0605',      period: 'AY 2026',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 500    },
    { id: uid(), clientId: cid[2], clientName: cn[2], form: '0605',      period: 'AY 2026',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 500    },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '0605',      period: 'AY 2026',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 500    },
    { id: uid(), clientId: cid[4], clientName: cn[4], form: '0605',      period: 'AY 2026',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 500    },
    { id: uid(), clientId: cid[5], clientName: cn[5], form: '0605',      period: 'AY 2026',     dueDate: '2026-01-31', filingStatus: 'Overdue', paymentStatus: 'Unpaid', amount: 500    },
    { id: uid(), clientId: cid[6], clientName: cn[6], form: '0605',      period: 'AY 2026',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 500    },
    { id: uid(), clientId: cid[7], clientName: cn[7], form: '0605',      period: 'AY 2026',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 500    },

    // 1604CF — Annual Info Return (Withholding on Compensation) — Jan 31
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '1604CF',    period: 'AY 2025',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 0      },
    { id: uid(), clientId: cid[1], clientName: cn[1], form: '1604CF',    period: 'AY 2025',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 0      },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '1604CF',    period: 'AY 2025',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 0      },
    { id: uid(), clientId: cid[6], clientName: cn[6], form: '1604CF',    period: 'AY 2025',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 0      },

    // Alphalist of Employees — Jan 31
    { id: uid(), clientId: cid[0], clientName: cn[0], form: 'Alphalist', period: 'AY 2025',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 0      },
    { id: uid(), clientId: cid[1], clientName: cn[1], form: 'Alphalist', period: 'AY 2025',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 0      },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: 'Alphalist', period: 'AY 2025',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 0      },

    // 1604E — Annual Info Return (Creditable/Expanded WT) — Mar 1
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '1604E',     period: 'AY 2025',     dueDate: '2026-03-01', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 0      },
    { id: uid(), clientId: cid[1], clientName: cn[1], form: '1604E',     period: 'AY 2025',     dueDate: '2026-03-01', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 0      },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '1604E',     period: 'AY 2025',     dueDate: '2026-03-01', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 0      },

    // ═══════════════════════════════════════
    // ANNUAL ITR — April 15 deadlines
    // ═══════════════════════════════════════
    // 1702 — Annual ITR for Corporations
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '1702',      period: 'AY 2025',     dueDate: '2026-04-15', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 285000 },
    { id: uid(), clientId: cid[1], clientName: cn[1], form: '1702',      period: 'AY 2025',     dueDate: '2026-04-15', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 192000 },
    { id: uid(), clientId: cid[2], clientName: cn[2], form: '1702',      period: 'AY 2025',     dueDate: '2026-04-15', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 540000 },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '1702',      period: 'AY 2025',     dueDate: '2026-04-15', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 378000 },
    { id: uid(), clientId: cid[5], clientName: cn[5], form: '1702',      period: 'AY 2025',     dueDate: '2026-04-15', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 156000 },
    { id: uid(), clientId: cid[6], clientName: cn[6], form: '1702',      period: 'AY 2025',     dueDate: '2026-04-15', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 234000 },
    // 1701 — Annual ITR for Self-employed / Sole Prop
    { id: uid(), clientId: cid[4], clientName: cn[4], form: '1701',      period: 'AY 2025',     dueDate: '2026-04-15', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 67500  },
    // 1701A — Annual ITR for Partnership
    { id: uid(), clientId: cid[7], clientName: cn[7], form: '1701A',     period: 'AY 2025',     dueDate: '2026-04-15', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 89000  },

    // ═══════════════════════════════════════
    // MONTHLY — 1601C (Withholding Tax on Compensation)
    // Due: 10th of following month
    // ═══════════════════════════════════════
    // January (due Feb 10)
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '1601C',     period: 'Jan 2026',    dueDate: '2026-02-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 42300  },
    { id: uid(), clientId: cid[1], clientName: cn[1], form: '1601C',     period: 'Jan 2026',    dueDate: '2026-02-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 28700  },
    { id: uid(), clientId: cid[2], clientName: cn[2], form: '1601C',     period: 'Jan 2026',    dueDate: '2026-02-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 63500  },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '1601C',     period: 'Jan 2026',    dueDate: '2026-02-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 51200  },
    { id: uid(), clientId: cid[6], clientName: cn[6], form: '1601C',     period: 'Jan 2026',    dueDate: '2026-02-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 35800  },
    // February (due Mar 10)
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '1601C',     period: 'Feb 2026',    dueDate: '2026-03-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 43100  },
    { id: uid(), clientId: cid[1], clientName: cn[1], form: '1601C',     period: 'Feb 2026',    dueDate: '2026-03-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 29100  },
    { id: uid(), clientId: cid[2], clientName: cn[2], form: '1601C',     period: 'Feb 2026',    dueDate: '2026-03-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 64200  },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '1601C',     period: 'Feb 2026',    dueDate: '2026-03-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 52800  },
    { id: uid(), clientId: cid[7], clientName: cn[7], form: '1601C',     period: 'Feb 2026',    dueDate: '2026-03-10', filingStatus: 'Overdue', paymentStatus: 'Unpaid', amount: 12300  },
    // March (due Apr 10)
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '1601C',     period: 'Mar 2026',    dueDate: '2026-04-10', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 44500  },
    { id: uid(), clientId: cid[1], clientName: cn[1], form: '1601C',     period: 'Mar 2026',    dueDate: '2026-04-10', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 30200  },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '1601C',     period: 'Mar 2026',    dueDate: '2026-04-10', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 53600  },

    // ═══════════════════════════════════════
    // MONTHLY — 0619E (Expanded Withholding Tax Remittance)
    // Due: 10th of following month
    // ═══════════════════════════════════════
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '0619E',     period: 'Jan 2026',    dueDate: '2026-02-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 15600  },
    { id: uid(), clientId: cid[2], clientName: cn[2], form: '0619E',     period: 'Jan 2026',    dueDate: '2026-02-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 28400  },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '0619E',     period: 'Jan 2026',    dueDate: '2026-02-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 19200  },
    { id: uid(), clientId: cid[6], clientName: cn[6], form: '0619E',     period: 'Jan 2026',    dueDate: '2026-02-10', filingStatus: 'Overdue', paymentStatus: 'Unpaid', amount: 9800   },
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '0619E',     period: 'Feb 2026',    dueDate: '2026-03-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 16100  },
    { id: uid(), clientId: cid[2], clientName: cn[2], form: '0619E',     period: 'Feb 2026',    dueDate: '2026-03-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 29800  },
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '0619E',     period: 'Mar 2026',    dueDate: '2026-04-10', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 15900  },

    // ═══════════════════════════════════════
    // MONTHLY — 0619F (Final Withholding Tax Remittance)
    // Due: 10th of following month
    // ═══════════════════════════════════════
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '0619F',     period: 'Jan 2026',    dueDate: '2026-02-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 8500   },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '0619F',     period: 'Jan 2026',    dueDate: '2026-02-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 12400  },
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '0619F',     period: 'Feb 2026',    dueDate: '2026-03-10', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 8900   },

    // ═══════════════════════════════════════
    // MONTHLY — 2550M (Monthly VAT Declaration)
    // Due: 25th of following month (except quarters → use 2550Q)
    // Filed monthly EXCEPT for months ending a quarter (Mar, Jun, Sep, Dec → use 2550Q instead)
    // ═══════════════════════════════════════
    // January (due Feb 25)
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '2550M',     period: 'Jan 2026',    dueDate: '2026-02-25', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 24500  },
    { id: uid(), clientId: cid[1], clientName: cn[1], form: '2550M',     period: 'Jan 2026',    dueDate: '2026-02-25', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 18200  },
    { id: uid(), clientId: cid[2], clientName: cn[2], form: '2550M',     period: 'Jan 2026',    dueDate: '2026-02-25', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 45600  },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '2550M',     period: 'Jan 2026',    dueDate: '2026-02-25', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 31200  },
    { id: uid(), clientId: cid[6], clientName: cn[6], form: '2550M',     period: 'Jan 2026',    dueDate: '2026-02-25', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 22800  },
    // February (due Mar 25)
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '2550M',     period: 'Feb 2026',    dueDate: '2026-03-25', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 26400  },
    { id: uid(), clientId: cid[1], clientName: cn[1], form: '2550M',     period: 'Feb 2026',    dueDate: '2026-03-25', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 19100  },
    { id: uid(), clientId: cid[2], clientName: cn[2], form: '2550M',     period: 'Feb 2026',    dueDate: '2026-03-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 47200  },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '2550M',     period: 'Feb 2026',    dueDate: '2026-03-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 33500  },

    // ═══════════════════════════════════════
    // QUARTERLY — 2550Q (Quarterly VAT Return)
    // Due: 25th of month after quarter end
    // Q4 2025 → due Jan 25, 2026   |   Q1 2026 → due Apr 25, 2026
    // ═══════════════════════════════════════
    // Q4 2025 (due Jan 25, 2026)
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '2550Q',     period: 'Q4 2025',     dueDate: '2026-01-25', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 78200  },
    { id: uid(), clientId: cid[1], clientName: cn[1], form: '2550Q',     period: 'Q4 2025',     dueDate: '2026-01-25', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 55400  },
    { id: uid(), clientId: cid[2], clientName: cn[2], form: '2550Q',     period: 'Q4 2025',     dueDate: '2026-01-25', filingStatus: 'Overdue', paymentStatus: 'Unpaid', amount: 87300  },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '2550Q',     period: 'Q4 2025',     dueDate: '2026-01-25', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 92600  },
    { id: uid(), clientId: cid[6], clientName: cn[6], form: '2550Q',     period: 'Q4 2025',     dueDate: '2026-01-25', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 68100  },
    // Q1 2026 (due Apr 25, 2026)
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '2550Q',     period: 'Q1 2026',     dueDate: '2026-04-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 82400  },
    { id: uid(), clientId: cid[1], clientName: cn[1], form: '2550Q',     period: 'Q1 2026',     dueDate: '2026-04-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 58900  },
    { id: uid(), clientId: cid[2], clientName: cn[2], form: '2550Q',     period: 'Q1 2026',     dueDate: '2026-04-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 95100  },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '2550Q',     period: 'Q1 2026',     dueDate: '2026-04-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 97800  },

    // ═══════════════════════════════════════
    // QUARTERLY — 2551Q (Quarterly Percentage Tax)
    // Due: 25th of month after quarter end
    // For non-VAT registered businesses
    // ═══════════════════════════════════════
    { id: uid(), clientId: cid[4], clientName: cn[4], form: '2551Q',     period: 'Q4 2025',     dueDate: '2026-01-25', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 18750  },
    { id: uid(), clientId: cid[7], clientName: cn[7], form: '2551Q',     period: 'Q4 2025',     dueDate: '2026-01-25', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 22400  },
    { id: uid(), clientId: cid[4], clientName: cn[4], form: '2551Q',     period: 'Q1 2026',     dueDate: '2026-04-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 19200  },
    { id: uid(), clientId: cid[7], clientName: cn[7], form: '2551Q',     period: 'Q1 2026',     dueDate: '2026-04-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 23800  },

    // ═══════════════════════════════════════
    // QUARTERLY — 1601EQ (Quarterly Expanded Withholding Tax Return)
    // Due: last day of month after quarter end
    // Q4 2025 → due Jan 31   |   Q1 2026 → due Apr 30
    // ═══════════════════════════════════════
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '1601EQ',    period: 'Q4 2025',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 48200  },
    { id: uid(), clientId: cid[2], clientName: cn[2], form: '1601EQ',    period: 'Q4 2025',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 72500  },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '1601EQ',    period: 'Q4 2025',     dueDate: '2026-01-31', filingStatus: 'Filed',   paymentStatus: 'Paid',   amount: 56800  },
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '1601EQ',    period: 'Q1 2026',     dueDate: '2026-04-30', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 51400  },
    { id: uid(), clientId: cid[2], clientName: cn[2], form: '1601EQ',    period: 'Q1 2026',     dueDate: '2026-04-30', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 76200  },
    { id: uid(), clientId: cid[3], clientName: cn[3], form: '1601EQ',    period: 'Q1 2026',     dueDate: '2026-04-30', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 59300  },

    // ═══════════════════════════════════════
    // QUARTERLY — 1701Q (Quarterly Income Tax for Self-employed)
    // Due: Q1→May 15, Q2→Aug 15, Q3→Nov 15 (no Q4, covered by annual)
    // ═══════════════════════════════════════
    { id: uid(), clientId: cid[4], clientName: cn[4], form: '1701Q',     period: 'Q1 2026',     dueDate: '2026-05-15', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 16800  },

    // ═══════════════════════════════════════
    // FUTURE — May through December upcoming filings
    // ═══════════════════════════════════════
    // May 2550M (Apr period, due May 25)
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '2550M',     period: 'Apr 2026',    dueDate: '2026-05-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 27100  },
    { id: uid(), clientId: cid[1], clientName: cn[1], form: '2550M',     period: 'Apr 2026',    dueDate: '2026-05-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 20300  },
    // Q2 2550Q (due Jul 25)
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '2550Q',     period: 'Q2 2026',     dueDate: '2026-07-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 85600  },
    { id: uid(), clientId: cid[1], clientName: cn[1], form: '2550Q',     period: 'Q2 2026',     dueDate: '2026-07-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 61200  },
    { id: uid(), clientId: cid[2], clientName: cn[2], form: '2550Q',     period: 'Q2 2026',     dueDate: '2026-07-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 98400  },
    // Q3 2550Q (due Oct 25)
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '2550Q',     period: 'Q3 2026',     dueDate: '2026-10-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 88200  },
    // Q4 2550Q (due Jan 25, 2027)
    { id: uid(), clientId: cid[0], clientName: cn[0], form: '2550Q',     period: 'Q4 2026',     dueDate: '2027-01-25', filingStatus: 'Pending', paymentStatus: 'Unpaid', amount: 91500  },
  ];

  const tasks = [
    { id: uid(), title: 'Prepare Feb 2026 VAT return',           clientName: 'ABC Trading Corp',       assignee: 'Maria Santos',   priority: 'Urgent', dueDate: '2026-03-18', status: 'In Progress' },
    { id: uid(), title: 'File Q4 2550Q for Manila Bay',          clientName: 'Manila Bay Holdings',    assignee: 'Jose Reyes',     priority: 'Urgent', dueDate: '2026-03-15', status: 'To Do'       },
    { id: uid(), title: 'Reconcile withholding tax — Global Tech',clientName: 'Global Tech PH',        assignee: 'Ana Cruz',       priority: 'High',   dueDate: '2026-03-20', status: 'In Progress' },
    { id: uid(), title: 'Annual ITR preparation — Santos Enter.', clientName: 'Santos Enterprises',    assignee: 'Carlo Bautista', priority: 'High',   dueDate: '2026-04-10', status: 'To Do'       },
    { id: uid(), title: 'Review EWT computation — Pacific Food',  clientName: 'Pacific Food Industries',assignee: 'Maria Santos',   priority: 'Medium', dueDate: '2026-03-25', status: 'Review'      },
    { id: uid(), title: 'Client onboarding — Diamond Logistics',  clientName: 'Diamond Logistics',     assignee: 'Jose Reyes',     priority: 'Medium', dueDate: '2026-03-22', status: 'To Do'       },
    { id: uid(), title: 'Jan 2026 payroll tax reconciliation',    clientName: 'XYZ Services Inc',      assignee: 'Ana Cruz',       priority: 'Low',    dueDate: '2026-03-30', status: 'Completed'   },
    { id: uid(), title: 'Update TIN records — Reyes Construction',clientName: 'Reyes Construction',    assignee: 'Carlo Bautista', priority: 'Low',    dueDate: '2026-04-01', status: 'Completed'   },
  ];

  const invoices = [
    { id: uid(), number: 'INV-2026-0001', clientName: 'ABC Trading Corp',       desc: 'Monthly compliance services — Jan 2026', amount: 18000, status: 'Paid',   dueDate: '2026-02-15' },
    { id: uid(), number: 'INV-2026-0002', clientName: 'XYZ Services Inc',       desc: 'Monthly compliance services — Jan 2026', amount: 15000, status: 'Paid',   dueDate: '2026-02-15' },
    { id: uid(), number: 'INV-2026-0003', clientName: 'Manila Bay Holdings',    desc: 'Q4 2025 tax compliance package',          amount: 42000, status: 'Unpaid', dueDate: '2026-02-28' },
    { id: uid(), number: 'INV-2026-0004', clientName: 'Global Tech PH',         desc: 'Monthly compliance services — Jan 2026', amount: 22000, status: 'Paid',   dueDate: '2026-02-15' },
    { id: uid(), number: 'INV-2026-0005', clientName: 'Santos Enterprises',     desc: 'Annual ITR preparation — AY 2025',        amount: 35000, status: 'Sent',   dueDate: '2026-03-31' },
    { id: uid(), number: 'INV-2026-0006', clientName: 'Pacific Food Industries',desc: 'Monthly compliance services — Feb 2026', amount: 18000, status: 'Unpaid', dueDate: '2026-03-15' },
  ];

  // Members are seeded after clients so we can reference cid[] indexes
  // Each member: id, client_id, full_name, role, email, phone, tin, sss, philhealth, pagibig, ownership_percentage
  const members = [
    // ABC Trading Corp (cid[0]) — 3 members
    { id: uid(), client_id: cid[0], full_name: 'Roberto Santos',     role: 'President',                 tin: '100-200-300-001', sss: '33-1456789-1', philhealth: '01-234567890-1', pagibig: '1212-3456-7890', email: 'rsantos@abctrading.ph',     phone: '+63 917 200 0001', ownership_percentage: 40 },
    { id: uid(), client_id: cid[0], full_name: 'Elena Cruz',          role: 'Treasurer',                 tin: '100-200-300-002', sss: '33-2567890-2', philhealth: '01-345678901-2', pagibig: '1213-4567-8901', email: 'ecruz@abctrading.ph',       phone: '+63 917 200 0002', ownership_percentage: 35 },
    { id: uid(), client_id: cid[0], full_name: 'Miguel Reyes',        role: 'Secretary',                 tin: '100-200-300-003', sss: '33-3678901-3', philhealth: '01-456789012-3', pagibig: '1214-5678-9012', email: 'mreyes@abctrading.ph',      phone: '+63 917 200 0003', ownership_percentage: 25 },

    // XYZ Services Inc (cid[1]) — 4 members
    { id: uid(), client_id: cid[1], full_name: 'Ana Garcia',          role: 'Owner',                     tin: '100-200-301-001', sss: '34-0123456-1', philhealth: '02-012345678-1', pagibig: '1220-1234-5678', email: 'agarcia@xyzservices.ph',    phone: '+63 917 200 0011', ownership_percentage: 51 },
    { id: uid(), client_id: cid[1], full_name: 'Jose Mendoza',        role: 'President',                 tin: '100-200-301-002', sss: '34-1234567-2', philhealth: '02-123456789-2', pagibig: '1221-2345-6789', email: 'jmendoza@xyzservices.ph',   phone: '+63 917 200 0012', ownership_percentage: 25 },
    { id: uid(), client_id: cid[1], full_name: 'Patricia Villanueva', role: 'Director',                  tin: '100-200-301-003', sss: '34-2345678-3', philhealth: '02-234567890-3', pagibig: '1222-3456-7890', email: 'pvillanueva@xyzservices.ph', phone: '+63 917 200 0013', ownership_percentage: 14 },
    { id: uid(), client_id: cid[1], full_name: 'Carlos Bautista',     role: 'Authorized Representative', tin: '100-200-301-004', sss: '34-3456789-4', philhealth: '02-345678901-4', pagibig: '1223-4567-8901', email: 'cbautista@xyzservices.ph',  phone: '+63 917 200 0014', ownership_percentage: 10 },

    // Manila Bay Holdings (cid[2]) — 3 members
    { id: uid(), client_id: cid[2], full_name: 'Maria Fernandez',     role: 'Owner',                     tin: '100-200-302-001', sss: '04-5678901-1', philhealth: '03-567890123-1', pagibig: '1230-5678-9012', email: 'mfernandez@manilabay.ph',   phone: '+63 917 200 0021', ownership_percentage: 60 },
    { id: uid(), client_id: cid[2], full_name: 'Ricardo Lim',         role: 'Treasurer',                 tin: '100-200-302-002', sss: '04-6789012-2', philhealth: '03-678901234-2', pagibig: '1231-6789-0123', email: 'rlim@manilabay.ph',         phone: '+63 917 200 0022', ownership_percentage: 25 },
    { id: uid(), client_id: cid[2], full_name: 'Sofia Aquino',        role: 'Secretary',                 tin: '100-200-302-003', sss: '04-7890123-3', philhealth: '03-789012345-3', pagibig: '1232-7890-1234', email: 'saquino@manilabay.ph',      phone: '+63 917 200 0023', ownership_percentage: 15 },

    // Global Tech PH (cid[3]) — 4 members
    { id: uid(), client_id: cid[3], full_name: 'Fernando Torres',     role: 'President',                 tin: '100-200-303-001', sss: '06-8901234-1', philhealth: '04-890123456-1', pagibig: '1240-8901-2345', email: 'ftorres@globaltech.ph',     phone: '+63 917 200 0031', ownership_percentage: 30 },
    { id: uid(), client_id: cid[3], full_name: 'Isabella Ramos',      role: 'Owner',                     tin: '100-200-303-002', sss: '06-9012345-2', philhealth: '04-901234567-2', pagibig: '1241-9012-3456', email: 'iramos@globaltech.ph',      phone: '+63 917 200 0032', ownership_percentage: 40 },
    { id: uid(), client_id: cid[3], full_name: 'Eduardo Navarro',     role: 'Director',                  tin: '100-200-303-003', sss: '06-0123456-3', philhealth: '04-012345678-3', pagibig: '1242-0123-4567', email: 'enavarro@globaltech.ph',    phone: '+63 917 200 0033', ownership_percentage: 20 },
    { id: uid(), client_id: cid[3], full_name: 'Carmela Reyes',       role: 'Treasurer',                 tin: '100-200-303-004', sss: '06-1234567-4', philhealth: '04-123456789-4', pagibig: '1243-1234-5678', email: 'creyes@globaltech.ph',      phone: '+63 917 200 0034', ownership_percentage: 10 },

    // Santos Enterprises (cid[4]) — 2 members
    { id: uid(), client_id: cid[4], full_name: 'Pedro Santos',        role: 'Owner',                     tin: '100-200-304-001', sss: '07-2345678-1', philhealth: '05-234567890-1', pagibig: '1250-2345-6789', email: 'psantos@santosentprise.ph', phone: '+63 917 200 0041', ownership_percentage: 75 },
    { id: uid(), client_id: cid[4], full_name: 'Luisa Santos',        role: 'Authorized Representative', tin: '100-200-304-002', sss: '07-3456789-2', philhealth: '05-345678901-2', pagibig: '1251-3456-7890', email: 'lsantos@santosentprise.ph', phone: '+63 917 200 0042', ownership_percentage: 25 },

    // Reyes Construction (cid[5]) — 3 members
    { id: uid(), client_id: cid[5], full_name: 'Danilo Reyes',        role: 'President',                 tin: '100-200-305-001', sss: '08-4567890-1', philhealth: '06-456789012-1', pagibig: '1260-4567-8901', email: 'dreyes@reyesconstruct.ph',  phone: '+63 917 200 0051', ownership_percentage: 50 },
    { id: uid(), client_id: cid[5], full_name: 'Josefina Reyes',      role: 'Secretary',                 tin: '100-200-305-002', sss: '08-5678901-2', philhealth: '06-567890123-2', pagibig: '1261-5678-9012', email: 'jreyes@reyesconstruct.ph',  phone: '+63 917 200 0052', ownership_percentage: 30 },
    { id: uid(), client_id: cid[5], full_name: 'Marcos Dela Cruz',    role: 'Treasurer',                 tin: '100-200-305-003', sss: '08-6789012-3', philhealth: '06-678901234-3', pagibig: '1262-6789-0123', email: 'mdelacruz@reyesconstruct.ph', phone: '+63 917 200 0053', ownership_percentage: 20 },

    // Pacific Food Industries (cid[6]) — 4 members
    { id: uid(), client_id: cid[6], full_name: 'Marisol Lim',         role: 'Owner',                     tin: '100-200-306-001', sss: '09-7890123-1', philhealth: '07-789012345-1', pagibig: '1270-7890-1234', email: 'mlim@pacificfood.ph',       phone: '+63 917 200 0061', ownership_percentage: 45 },
    { id: uid(), client_id: cid[6], full_name: 'Antonio Flores',      role: 'President',                 tin: '100-200-306-002', sss: '09-8901234-2', philhealth: '07-890123456-2', pagibig: '1271-8901-2345', email: 'aflores@pacificfood.ph',    phone: '+63 917 200 0062', ownership_percentage: 30 },
    { id: uid(), client_id: cid[6], full_name: 'Rosario Castillo',    role: 'Director',                  tin: '100-200-306-003', sss: '09-9012345-3', philhealth: '07-901234567-3', pagibig: '1272-9012-3456', email: 'rcastillo@pacificfood.ph',  phone: '+63 917 200 0063', ownership_percentage: 15 },
    { id: uid(), client_id: cid[6], full_name: 'Vicente Magno',       role: 'Secretary',                 tin: '100-200-306-004', sss: '09-0123456-4', philhealth: '07-012345678-4', pagibig: '1273-0123-4567', email: 'vmagno@pacificfood.ph',     phone: '+63 917 200 0064', ownership_percentage: 10 },

    // Diamond Logistics (cid[7]) — 2 members
    { id: uid(), client_id: cid[7], full_name: 'Arnold Dela Cruz',    role: 'Owner',                     tin: '100-200-307-001', sss: '10-1234567-1', philhealth: '08-123456789-1', pagibig: '1280-1234-5678', email: 'adc@diamondlogistics.ph',   phone: '+63 917 200 0071', ownership_percentage: 60 },
    { id: uid(), client_id: cid[7], full_name: 'Beatrice Soriano',    role: 'President',                 tin: '100-200-307-002', sss: '10-2345678-2', philhealth: '08-234567890-2', pagibig: '1281-2345-6789', email: 'bsoriano@diamondlogistics.ph', phone: '+63 917 200 0072', ownership_percentage: 40 },
  ];

  save(KEYS.clients,  clients);
  save(KEYS.filings,  filings);
  save(KEYS.tasks,    tasks);
  save(KEYS.invoices, invoices);
  save(KEYS.members,  members);
  localStorage.setItem(KEYS.init, DATA_VERSION);
}

function resetDemoData() {
  if (!confirm('Reset all demo data to defaults? This cannot be undone.')) return;
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  initDemoData();
  renderPage(currentPage);
  showToast('Demo data has been reset.');
}

/* ============================================================
   NAVIGATION
============================================================ */
let currentPage = 'dashboard';
const pageTitles = {
  dashboard: 'Dashboard',
  clients: 'Clients',
  compliance: 'Compliance Tracker',
  calendar: 'Tax Calendar',
  tasks: 'Tasks',
  billing: 'Billing & Invoices',
  settings: 'Settings',
};

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');
  document.getElementById('topbar-title').textContent = pageTitles[page] || page;
  document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
  const viewBtn = document.getElementById('view-btn-' + page);
  if (viewBtn) viewBtn.classList.add('active');
  currentPage = page;
  renderPage(page);
  lucide.createIcons();
}

function renderPage(page) {
  switch(page) {
    case 'dashboard':   renderDashboard();   break;
    case 'clients':     renderClientsTable(); break;
    case 'compliance':  renderCompliancePage(); break;
    case 'calendar':    renderCalendar();    break;
    case 'tasks':       renderKanban();      break;
    case 'billing':     renderBillingPage(); break;
  }
}

/* ============================================================
   MODALS
============================================================ */
let activeModal = null;
function openModal(id) {
  document.getElementById('modal-backdrop').classList.add('open');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  activeModal = id;
  // populate client dropdowns
  if (['modal-new-filing','modal-new-task','modal-create-invoice'].includes(id)) {
    populateClientDropdowns();
  }
  lucide.createIcons();
}
function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  activeModal = null;
}
function handleBackdropClick(e) {
  if (e.target === document.getElementById('modal-backdrop')) closeModal();
}

function populateClientDropdowns() {
  const clients = load(KEYS.clients);
  const opts = clients.map(c => `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`).join('');
  ['nf-client','nt-client','ci-client'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts;
  });
}

/* ============================================================
   TOAST
============================================================ */
function showToast(msg, type='success') {
  const tc = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i data-lucide="${type==='success'?'check-circle':'alert-circle'}" style="width:16px;height:16px;flex-shrink:0;"></i>${msg}`;
  tc.appendChild(t);
  lucide.createIcons();
  setTimeout(() => t.remove(), 3200);
}

/* ============================================================
   DASHBOARD
============================================================ */
function renderDashboard() {
  const filings  = load(KEYS.filings);
  const clients  = load(KEYS.clients);
  const invoices = load(KEYS.invoices);
  const overdue  = filings.filter(f => f.filingStatus === 'Overdue').length;
  const upcoming = filings.filter(f => f.filingStatus === 'Pending').length;
  const revenue  = invoices.filter(i => i.status === 'Paid').reduce((s,i) => s + Number(i.amount), 0);
  const revVat   = revenue * 1.12;

  document.getElementById('dashboard-stats').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:#EEF2FF;">
        <i data-lucide="users" style="width:20px;height:20px;color:#4F46E5;"></i>
      </div>
      <div class="stat-label">Total Clients</div>
      <div class="stat-value">${clients.length}</div>
      <div class="stat-change up">↑ +12% from last month</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:#FEF3C7;">
        <i data-lucide="clock" style="width:20px;height:20px;color:#F59E0B;"></i>
      </div>
      <div class="stat-label">Upcoming Deadlines</div>
      <div class="stat-value">${upcoming}</div>
      <div class="stat-change neutral">Next 30 days</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:#FEE2E2;">
        <i data-lucide="alert-triangle" style="width:20px;height:20px;color:#EF4444;"></i>
      </div>
      <div class="stat-label">Overdue Filings</div>
      <div class="stat-value">${overdue}</div>
      <div class="stat-change down">Requires immediate action</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:#D1FAE5;">
        <i data-lucide="trending-up" style="width:20px;height:20px;color:#10B981;"></i>
      </div>
      <div class="stat-label">Revenue (incl. VAT)</div>
      <div class="stat-value" style="font-size:20px;">${php(revVat)}</div>
      <div class="stat-change up">↑ +8% from last month</div>
    </div>
  `;

  // Upcoming deadlines table
  const deadlines = filings.filter(f => f.filingStatus !== 'Filed').slice(0,5);
  const tbody = document.querySelector('#dashboard-deadlines-table tbody');
  if (deadlines.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#9CA3AF;padding:24px;">No upcoming deadlines</td></tr>`;
  } else {
    tbody.innerHTML = deadlines.map(f => `
      <tr>
        <td><span style="font-weight:600;">${f.clientName}</span></td>
        <td><span class="badge badge-indigo">${f.form}</span></td>
        <td>${fmtDate(f.dueDate)}</td>
        <td>${statusBadge(f.filingStatus)}</td>
      </tr>
    `).join('');
  }

  // Activity feed
  const activities = [
    { initials:'MS', color:'#4F46E5', text:'Filed <b>2550M</b> for ABC Trading Corp', time:'2 hours ago' },
    { initials:'JR', color:'#10B981', text:'Added new client <b>Diamond Logistics</b>', time:'4 hours ago' },
    { initials:'AC', color:'#F59E0B', text:'Invoice <b>INV-2026-0004</b> marked as paid', time:'Yesterday' },
    { initials:'CB', color:'#8B5CF6', text:'Uploaded BIR docs for <b>Global Tech PH</b>', time:'Yesterday' },
    { initials:'MS', color:'#4F46E5', text:'Deadline reminder sent for <b>Manila Bay Holdings</b>', time:'2 days ago' },
  ];
  document.getElementById('activity-feed').innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="activity-avatar" style="background:${a.color};">${a.initials}</div>
      <div>
        <div class="activity-text">${a.text}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

/* ============================================================
   CLIENTS
============================================================ */
function renderClientsTable() {
  const clients = load(KEYS.clients);
  const search  = (document.getElementById('client-search')?.value || '').toLowerCase();
  const filter  = document.getElementById('client-status-filter')?.value || '';
  const filtered = clients.filter(c =>
    (!search || c.name.toLowerCase().includes(search) || c.tin.includes(search) || c.contact.toLowerCase().includes(search)) &&
    (!filter || c.status === filter)
  );
  const tbody = document.querySelector('#clients-table tbody');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#9CA3AF;padding:32px;">No clients found.</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map((c,i) => `
    <tr class="clickable-row" onclick="openClientDetail('${c.id}')">
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="activity-avatar" style="background:${avatarColors[i%avatarColors.length]};width:30px;height:30px;font-size:10px;">${initials(c.name)}</div>
          <div>
            <div style="font-weight:600;color:#111827;">${c.name}</div>
            <div style="font-size:11px;color:#9CA3AF;">${c.type}</div>
          </div>
        </div>
      </td>
      <td class="font-mono" style="font-size:12px;">${c.tin}</td>
      <td>
        <div style="font-weight:500;">${c.contact}</div>
        <div style="font-size:11px;color:#9CA3AF;">${c.email}</div>
      </td>
      <td><span class="badge badge-gray">${c.rdo}</span></td>
      <td>${statusBadge(c.status)}</td>
      <td style="font-size:12px;color:#6B7280;">${c.accountant}</td>
      <td style="white-space:nowrap;">
        <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();editClient('${c.id}')" title="Edit"><i data-lucide="pencil" style="width:13px;height:13px;"></i></button>
        <button class="action-btn" onclick="event.stopPropagation();openClientDetail('${c.id}')">View →</button>
      </td>
    </tr>
  `).join('');
}

function openClientDetail(id) {
  const clients       = load(KEYS.clients);
  const filings       = load(KEYS.filings);
  const allMembers    = load(KEYS.members);
  const c             = clients.find(x => x.id === id);
  if (!c) return;

  const clientFilings = filings.filter(f => f.clientId === id);
  const clientMembers = allMembers.filter(m => m.client_id === id);

  document.getElementById('client-detail-title').textContent = c.name;
  document.getElementById('client-edit-btn').setAttribute('onclick', `editClient('${id}')`);
  document.getElementById('client-detail-body').innerHTML = `
    <div class="tabs" style="margin-bottom:16px;" id="client-detail-tabs">
      <div class="tab active" onclick="switchClientTab('overview','${id}')">Overview</div>
      <div class="tab" onclick="switchClientTab('members','${id}')">Members (${clientMembers.length})</div>
      <div class="tab" onclick="switchClientTab('filings','${id}')">Filings (${clientFilings.length})</div>
    </div>
    <div id="client-tab-overview" class="tab-panel active">
      <!-- BIR Registration -->
      <div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #F3F4F6;">BIR Registration</div>
      <div class="info-grid" style="margin-bottom:20px;">
        <div class="info-item"><div class="info-label">TIN</div><div class="info-value font-mono">${c.tin}</div></div>
        <div class="info-item"><div class="info-label">RDO Code</div><div class="info-value">${c.rdo}</div></div>
        ${c.trade ? `<div class="info-item"><div class="info-label">Trade Name</div><div class="info-value">${c.trade}</div></div>` : ''}
        ${c.cor ? `<div class="info-item"><div class="info-label">COR No. (2303)</div><div class="info-value font-mono">${c.cor}</div></div>` : ''}
        <div class="info-item"><div class="info-label">Tax Type</div><div class="info-value">${c.taxType === 'VAT' ? '<span class="badge badge-blue">VAT</span>' : c.taxType === 'Non-VAT' ? '<span class="badge badge-yellow">Non-VAT</span>' : '<span class="badge badge-gray">Exempt</span>'}</div></div>
        <div class="info-item"><div class="info-label">Business Type</div><div class="info-value">${c.type}</div></div>
        ${c.industry ? `<div class="info-item"><div class="info-label">Line of Business</div><div class="info-value">${c.industry}</div></div>` : ''}
        ${c.sec ? `<div class="info-item"><div class="info-label">SEC / DTI / CDA</div><div class="info-value font-mono">${c.sec}</div></div>` : ''}
        ${c.birDate ? `<div class="info-item"><div class="info-label">BIR Registration</div><div class="info-value">${fmtDate(c.birDate)}</div></div>` : ''}
        ${c.incDate ? `<div class="info-item"><div class="info-label">Date of Incorporation</div><div class="info-value">${fmtDate(c.incDate)}</div></div>` : ''}
        <div class="info-item"><div class="info-label">Fiscal Year End</div><div class="info-value">${c.fyEnd || 'Dec 31'}</div></div>
        <div class="info-item"><div class="info-label">Books of Accounts</div><div class="info-value">${c.books || '—'}</div></div>
        <div class="info-item"><div class="info-label">ATP Status</div><div class="info-value">${c.atp === 'Active' ? '<span class="badge badge-green">Active</span>' : c.atp === 'Expired' ? '<span class="badge badge-red">Expired</span>' : c.atp === 'For Renewal' ? '<span class="badge badge-yellow">For Renewal</span>' : '<span class="badge badge-gray">N/A</span>'}</div></div>
        <div class="info-item"><div class="info-label">Status</div><div class="info-value">${statusBadge(c.status)}</div></div>
      </div>
      <!-- Contact -->
      <div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #F3F4F6;">Contact</div>
      <div class="info-grid" style="margin-bottom:20px;">
        <div class="info-item"><div class="info-label">Contact Person</div><div class="info-value">${c.contact || '—'}</div></div>
        <div class="info-item"><div class="info-label">Phone</div><div class="info-value">${c.phone || '—'}</div></div>
        <div class="info-item"><div class="info-label">Email</div><div class="info-value">${c.email || '—'}</div></div>
        <div class="info-item"><div class="info-label">Accountant</div><div class="info-value">${c.accountant}</div></div>
      </div>
      <!-- Address -->
      <div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #F3F4F6;">Registered Address</div>
      <div class="info-grid" style="margin-bottom:20px;">
        <div class="info-item" style="grid-column:span 2;"><div class="info-label">Address</div><div class="info-value">${[c.address, c.city, c.province, c.zip].filter(Boolean).join(', ') || '—'}</div></div>
      </div>
      <!-- Banking -->
      ${(c.bank || c.bankAcct) ? `
      <div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #F3F4F6;">Banking</div>
      <div class="info-grid" style="margin-bottom:20px;">
        ${c.bank ? `<div class="info-item"><div class="info-label">Bank</div><div class="info-value">${c.bank}</div></div>` : ''}
        ${c.bankAcct ? `<div class="info-item"><div class="info-label">Account No.</div><div class="info-value font-mono">${c.bankAcct}</div></div>` : ''}
      </div>` : ''}
      <!-- Notes -->
      ${c.notes ? `
      <div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #F3F4F6;">Notes</div>
      <div class="info-item"><div class="info-value" style="white-space:pre-wrap;color:#6B7280;">${c.notes}</div></div>` : ''}
    </div>
    <div id="client-tab-members" class="tab-panel">
      ${renderMembersTabHTML(id)}
    </div>
    <div id="client-tab-filings" class="tab-panel">
      ${clientFilings.length === 0
        ? `<div class="empty-state"><p>No filings recorded for this client.</p></div>`
        : `<table style="width:100%;border-collapse:collapse;">
            <thead><tr><th>Form</th><th>Period</th><th>Due</th><th>Status</th><th>Amount</th></tr></thead>
            <tbody>${clientFilings.map(f=>`
              <tr>
                <td><span class="badge badge-indigo">${f.form}</span></td>
                <td>${f.period}</td>
                <td>${fmtDate(f.dueDate)}</td>
                <td>${statusBadge(f.filingStatus)}</td>
                <td style="font-weight:600;">${php(f.amount)}</td>
              </tr>`).join('')}
            </tbody>
           </table>`}
    </div>
  `;
  openModal('modal-client-detail');
}

/* ============================================================
   MEMBERS
============================================================ */
const MEMBER_ROLES = ['Owner','President','Treasurer','Secretary','Director','Authorized Representative'];

function renderMembersTabHTML(clientId) {
  const allMembers    = load(KEYS.members);
  const clientMembers = allMembers.filter(m => m.client_id === clientId);
  const totalPct      = clientMembers.reduce((sum, m) => sum + Number(m.ownership_percentage || 0), 0);

  const tableHTML = clientMembers.length === 0
    ? `<div class="empty-state"><p>No members recorded.</p><span>Click "Add Member" to add the first officer or owner.</span></div>`
    : `<div class="members-table-wrap">
        <table class="members-table">
          <thead>
            <tr>
              <th>Name / Contact</th>
              <th>Role</th>
              <th>Government IDs</th>
              <th>Ownership %</th>
              <th style="width:72px;text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${clientMembers.map(m => `
              <tr class="member-row">
                <td>
                  <div style="font-weight:600;color:#111827;">${m.full_name}</div>
                  <div style="font-size:11px;color:#6B7280;margin-top:2px;">${m.email || '—'}</div>
                  <div style="font-size:11px;color:#9CA3AF;">${m.phone || '—'}</div>
                </td>
                <td>${roleBadge(m.role)}</td>
                <td>
                  <div class="gov-ids-grid">
                    <div class="gov-id-item"><span class="gov-id-label">TIN</span><span class="gov-id-value">${m.tin || '—'}</span></div>
                    <div class="gov-id-item"><span class="gov-id-label">SSS</span><span class="gov-id-value">${m.sss || '—'}</span></div>
                    <div class="gov-id-item"><span class="gov-id-label">PhilHealth</span><span class="gov-id-value">${m.philhealth || '—'}</span></div>
                    <div class="gov-id-item"><span class="gov-id-label">Pag-IBIG</span><span class="gov-id-value">${m.pagibig || '—'}</span></div>
                  </div>
                </td>
                <td>
                  <div class="ownership-bar-wrap">
                    <span class="ownership-pct">${m.ownership_percentage || 0}%</span>
                    <div class="ownership-bar">
                      <div class="ownership-bar-fill" style="width:${Math.min(Number(m.ownership_percentage||0),100)}%;"></div>
                    </div>
                  </div>
                </td>
                <td style="text-align:center;">
                  <div style="display:flex;gap:4px;justify-content:center;">
                    <button class="member-action-btn" title="Edit member" onclick="showEditMemberForm('${m.id}','${clientId}')">
                      <i data-lucide="pencil" style="width:13px;height:13px;"></i>
                    </button>
                    <button class="member-action-btn delete" title="Delete member" onclick="deleteMember('${m.id}','${clientId}')">
                      <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="members-total-row">
        <span>${clientMembers.length} member${clientMembers.length !== 1 ? 's' : ''} recorded</span>
        <span>Total ownership: <strong>${totalPct}%</strong>${totalPct !== 100 ? `<span style="color:#F59E0B;margin-left:6px;">(${totalPct < 100 ? totalPct - 100 : totalPct - 100 > 0 ? '+' + (totalPct - 100) : ''}${totalPct !== 100 ? (totalPct < 100 ? 100 - totalPct + '% unallocated' : totalPct - 100 + '% over 100%') : ''})</span>` : ''}</strong></span>
      </div>`;

  return `
    <div id="members-tab-content-${clientId}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <div style="font-size:13px;color:#6B7280;">Officers, owners, and authorized representatives for this client.</div>
        <button class="btn btn-primary btn-sm" onclick="showAddMemberForm('${clientId}')">
          <i data-lucide="user-plus" style="width:14px;height:14px;"></i> Add Member
        </button>
      </div>
      <div id="member-form-area-${clientId}"></div>
      ${tableHTML}
    </div>
  `;
}

function refreshMembersTab(clientId) {
  const container = document.getElementById(`members-tab-content-${clientId}`);
  if (!container) return;
  const parent = container.parentElement;
  parent.innerHTML = renderMembersTabHTML(clientId);
  // Update the Members tab label count
  const allMembers    = load(KEYS.members);
  const clientMembers = allMembers.filter(m => m.client_id === clientId);
  const tabs = document.querySelectorAll('#client-detail-tabs .tab');
  if (tabs[1]) tabs[1].textContent = `Members (${clientMembers.length})`;
  lucide.createIcons();
}

function showAddMemberForm(clientId) {
  const area = document.getElementById(`member-form-area-${clientId}`);
  if (!area) return;
  area.innerHTML = `
    <div class="add-member-form" id="add-member-form-${clientId}">
      <div class="form-section-title">Add New Member / Officer</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input class="form-control" id="am-name-${clientId}" placeholder="e.g. Roberto Santos" />
        </div>
        <div class="form-group">
          <label class="form-label">Role *</label>
          <select class="form-control" id="am-role-${clientId}">
            ${MEMBER_ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-control" id="am-email-${clientId}" type="email" placeholder="member@company.ph" />
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input class="form-control" id="am-phone-${clientId}" placeholder="+63 9XX XXX XXXX" />
        </div>
      </div>
      <div class="form-section-title" style="margin-top:8px;">Government IDs</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">TIN</label>
          <input class="form-control" id="am-tin-${clientId}" placeholder="123-456-789-000" />
        </div>
        <div class="form-group">
          <label class="form-label">SSS No.</label>
          <input class="form-control" id="am-sss-${clientId}" placeholder="33-1234567-8" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">PhilHealth No.</label>
          <input class="form-control" id="am-philhealth-${clientId}" placeholder="01-234567890-1" />
        </div>
        <div class="form-group">
          <label class="form-label">Pag-IBIG / HDMF No.</label>
          <input class="form-control" id="am-pagibig-${clientId}" placeholder="1212-3456-7890" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Ownership %</label>
          <input class="form-control" id="am-pct-${clientId}" type="number" min="0" max="100" placeholder="0" />
        </div>
        <div class="form-group"></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secondary btn-sm" onclick="cancelMemberForm('${clientId}')">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="saveMember('${clientId}')">
          <i data-lucide="save" style="width:13px;height:13px;"></i> Save Member
        </button>
      </div>
    </div>
  `;
  lucide.createIcons();
  document.getElementById(`am-name-${clientId}`).focus();
}

function showEditMemberForm(memberId, clientId) {
  const allMembers = load(KEYS.members);
  const m = allMembers.find(x => x.id === memberId);
  if (!m) return;
  const area = document.getElementById(`member-form-area-${clientId}`);
  if (!area) return;
  area.innerHTML = `
    <div class="add-member-form" id="edit-member-form-${memberId}">
      <div class="form-section-title">Edit Member</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input class="form-control" id="em-name-${memberId}" value="${m.full_name}" />
        </div>
        <div class="form-group">
          <label class="form-label">Role *</label>
          <select class="form-control" id="em-role-${memberId}">
            ${MEMBER_ROLES.map(r => `<option value="${r}" ${r === m.role ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-control" id="em-email-${memberId}" type="email" value="${m.email || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input class="form-control" id="em-phone-${memberId}" value="${m.phone || ''}" />
        </div>
      </div>
      <div class="form-section-title" style="margin-top:8px;">Government IDs</div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">TIN</label>
          <input class="form-control" id="em-tin-${memberId}" value="${m.tin || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">SSS No.</label>
          <input class="form-control" id="em-sss-${memberId}" value="${m.sss || ''}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">PhilHealth No.</label>
          <input class="form-control" id="em-philhealth-${memberId}" value="${m.philhealth || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Pag-IBIG / HDMF No.</label>
          <input class="form-control" id="em-pagibig-${memberId}" value="${m.pagibig || ''}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Ownership %</label>
          <input class="form-control" id="em-pct-${memberId}" type="number" min="0" max="100" value="${m.ownership_percentage || 0}" />
        </div>
        <div class="form-group"></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secondary btn-sm" onclick="cancelMemberForm('${clientId}')">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="updateMember('${memberId}','${clientId}')">
          <i data-lucide="save" style="width:13px;height:13px;"></i> Update Member
        </button>
      </div>
    </div>
  `;
  lucide.createIcons();
  document.getElementById(`em-name-${memberId}`).focus();
}

function cancelMemberForm(clientId) {
  const area = document.getElementById(`member-form-area-${clientId}`);
  if (area) area.innerHTML = '';
}

function saveMember(clientId) {
  const name = document.getElementById(`am-name-${clientId}`).value.trim();
  if (!name) { showToast('Full name is required.', 'error'); return; }
  const role       = document.getElementById(`am-role-${clientId}`).value;
  const email      = document.getElementById(`am-email-${clientId}`).value.trim();
  const phone      = document.getElementById(`am-phone-${clientId}`).value.trim();
  const tin        = document.getElementById(`am-tin-${clientId}`).value.trim();
  const sss        = document.getElementById(`am-sss-${clientId}`).value.trim();
  const philhealth = document.getElementById(`am-philhealth-${clientId}`).value.trim();
  const pagibig    = document.getElementById(`am-pagibig-${clientId}`).value.trim();
  const pct        = parseFloat(document.getElementById(`am-pct-${clientId}`).value) || 0;

  const members = load(KEYS.members);
  members.push({
    id:                   uid(),
    client_id:            clientId,
    full_name:            name,
    role,
    email,
    phone,
    tin,
    sss,
    philhealth,
    pagibig,
    ownership_percentage: pct,
  });
  save(KEYS.members, members);
  refreshMembersTab(clientId);
  showToast(`Member "${name}" added successfully.`);
}

function updateMember(memberId, clientId) {
  const name = document.getElementById(`em-name-${memberId}`).value.trim();
  if (!name) { showToast('Full name is required.', 'error'); return; }
  const members = load(KEYS.members);
  const idx = members.findIndex(m => m.id === memberId);
  if (idx === -1) return;
  members[idx] = {
    ...members[idx],
    full_name:            name,
    role:                 document.getElementById(`em-role-${memberId}`).value,
    email:                document.getElementById(`em-email-${memberId}`).value.trim(),
    phone:                document.getElementById(`em-phone-${memberId}`).value.trim(),
    tin:                  document.getElementById(`em-tin-${memberId}`).value.trim(),
    sss:                  document.getElementById(`em-sss-${memberId}`).value.trim(),
    philhealth:           document.getElementById(`em-philhealth-${memberId}`).value.trim(),
    pagibig:              document.getElementById(`em-pagibig-${memberId}`).value.trim(),
    ownership_percentage: parseFloat(document.getElementById(`em-pct-${memberId}`).value) || 0,
  };
  save(KEYS.members, members);
  refreshMembersTab(clientId);
  showToast(`Member "${name}" updated successfully.`);
}

function deleteMember(memberId, clientId) {
  const members = load(KEYS.members);
  const m = members.find(x => x.id === memberId);
  if (!m) return;
  if (!confirm(`Remove "${m.full_name}" from this client?`)) return;
  const updated = members.filter(x => x.id !== memberId);
  save(KEYS.members, updated);
  refreshMembersTab(clientId);
  showToast(`Member "${m.full_name}" removed.`);
}

function switchClientTab(tab, id) {
  const tabEls = document.querySelectorAll('#client-detail-tabs .tab');
  const panels = ['overview','members','filings'];
  panels.forEach((p, i) => {
    const panel = document.getElementById('client-tab-' + p);
    if (panel) panel.classList.toggle('active', p === tab);
    if (tabEls[i]) tabEls[i].classList.toggle('active', p === tab);
  });
}

function saveClient() {
  const name = document.getElementById('ac-name').value.trim();
  const tin  = document.getElementById('ac-tin').value.trim();
  if (!name || !tin) { showToast('Company name and TIN are required.','error'); return; }
  const clients = load(KEYS.clients);
  clients.push({
    id: uid(),
    name,
    trade:      document.getElementById('ac-trade').value.trim(),
    tin,
    rdo:        document.getElementById('ac-rdo').value.trim(),
    cor:        document.getElementById('ac-cor').value.trim(),
    birDate:    document.getElementById('ac-birdate').value,
    taxType:    document.getElementById('ac-taxtype').value,
    type:       document.getElementById('ac-type').value,
    industry:   document.getElementById('ac-industry').value.trim(),
    sec:        document.getElementById('ac-sec').value.trim(),
    fyEnd:      document.getElementById('ac-fyend').value,
    books:      document.getElementById('ac-books').value,
    atp:        document.getElementById('ac-atp').value,
    incDate:    document.getElementById('ac-incdate').value,
    contact:    document.getElementById('ac-contact').value.trim(),
    phone:      document.getElementById('ac-phone').value.trim(),
    email:      document.getElementById('ac-email').value.trim(),
    address:    document.getElementById('ac-address').value.trim(),
    city:       document.getElementById('ac-city').value.trim(),
    province:   document.getElementById('ac-province').value.trim(),
    zip:        document.getElementById('ac-zip').value.trim(),
    bank:       document.getElementById('ac-bank').value.trim(),
    bankAcct:   document.getElementById('ac-bankacct').value.trim(),
    accountant: document.getElementById('ac-accountant').value,
    status:     document.getElementById('ac-status').value,
    notes:      document.getElementById('ac-notes').value.trim(),
  });
  save(KEYS.clients, clients);
  closeModal();
  renderClientsTable();
  showToast(`Client "${name}" added successfully.`);
  document.querySelectorAll('#modal-add-client input, #modal-add-client textarea').forEach(el => { el.value = ''; });
}

function editClient(id) {
  const clients = load(KEYS.clients);
  const c = clients.find(x => x.id === id);
  if (!c) return;
  closeModal();
  setTimeout(() => {
    document.getElementById('ec-id').value        = c.id;
    document.getElementById('ec-name').value       = c.name || '';
    document.getElementById('ec-trade').value      = c.trade || '';
    document.getElementById('ec-tin').value        = c.tin || '';
    document.getElementById('ec-rdo').value        = c.rdo || '';
    document.getElementById('ec-cor').value        = c.cor || '';
    document.getElementById('ec-birdate').value    = c.birDate || '';
    document.getElementById('ec-taxtype').value    = c.taxType || 'VAT';
    document.getElementById('ec-type').value       = c.type || 'Corporation';
    document.getElementById('ec-industry').value   = c.industry || '';
    document.getElementById('ec-sec').value        = c.sec || '';
    document.getElementById('ec-fyend').value      = c.fyEnd || 'Dec 31';
    document.getElementById('ec-books').value      = c.books || 'Computerized';
    document.getElementById('ec-atp').value        = c.atp || 'Active';
    document.getElementById('ec-incdate').value    = c.incDate || '';
    document.getElementById('ec-contact').value    = c.contact || '';
    document.getElementById('ec-phone').value      = c.phone || '';
    document.getElementById('ec-email').value      = c.email || '';
    document.getElementById('ec-address').value    = c.address || '';
    document.getElementById('ec-city').value       = c.city || '';
    document.getElementById('ec-province').value   = c.province || '';
    document.getElementById('ec-zip').value        = c.zip || '';
    document.getElementById('ec-bank').value       = c.bank || '';
    document.getElementById('ec-bankacct').value   = c.bankAcct || '';
    document.getElementById('ec-accountant').value = c.accountant || 'Maria Santos';
    document.getElementById('ec-status').value     = c.status || 'Active';
    document.getElementById('ec-notes').value      = c.notes || '';
    openModal('modal-edit-client');
  }, 200);
}

function updateClient() {
  const id   = document.getElementById('ec-id').value;
  const name = document.getElementById('ec-name').value.trim();
  const tin  = document.getElementById('ec-tin').value.trim();
  if (!name || !tin) { showToast('Company name and TIN are required.', 'error'); return; }

  const clients = load(KEYS.clients);
  const idx = clients.findIndex(c => c.id === id);
  if (idx === -1) return;

  const oldName = clients[idx].name;
  clients[idx] = {
    ...clients[idx],
    name,
    trade:      document.getElementById('ec-trade').value.trim(),
    tin,
    rdo:        document.getElementById('ec-rdo').value.trim(),
    cor:        document.getElementById('ec-cor').value.trim(),
    birDate:    document.getElementById('ec-birdate').value,
    taxType:    document.getElementById('ec-taxtype').value,
    type:       document.getElementById('ec-type').value,
    industry:   document.getElementById('ec-industry').value.trim(),
    sec:        document.getElementById('ec-sec').value.trim(),
    fyEnd:      document.getElementById('ec-fyend').value,
    books:      document.getElementById('ec-books').value,
    atp:        document.getElementById('ec-atp').value,
    incDate:    document.getElementById('ec-incdate').value,
    contact:    document.getElementById('ec-contact').value.trim(),
    phone:      document.getElementById('ec-phone').value.trim(),
    email:      document.getElementById('ec-email').value.trim(),
    address:    document.getElementById('ec-address').value.trim(),
    city:       document.getElementById('ec-city').value.trim(),
    province:   document.getElementById('ec-province').value.trim(),
    zip:        document.getElementById('ec-zip').value.trim(),
    bank:       document.getElementById('ec-bank').value.trim(),
    bankAcct:   document.getElementById('ec-bankacct').value.trim(),
    accountant: document.getElementById('ec-accountant').value,
    status:     document.getElementById('ec-status').value,
    notes:      document.getElementById('ec-notes').value.trim(),
  };
  save(KEYS.clients, clients);

  // Update client name in filings if changed
  if (oldName !== name) {
    const filings = load(KEYS.filings);
    filings.forEach(f => { if (f.clientId === id) f.clientName = name; });
    save(KEYS.filings, filings);
  }

  closeModal();
  renderClientsTable();
  showToast(`Client "${name}" updated successfully.`);
}

function deleteClient() {
  const id   = document.getElementById('ec-id').value;
  const clients = load(KEYS.clients);
  const c = clients.find(x => x.id === id);
  if (!c) return;
  if (!confirm(`Delete "${c.name}"? This will also remove all their filings and members. This cannot be undone.`)) return;

  // Remove client
  save(KEYS.clients, clients.filter(x => x.id !== id));
  // Remove related filings
  const filings = load(KEYS.filings);
  save(KEYS.filings, filings.filter(f => f.clientId !== id));
  // Remove related members
  const members = load(KEYS.members);
  save(KEYS.members, members.filter(m => m.client_id !== id));

  closeModal();
  renderClientsTable();
  showToast(`Client "${c.name}" and all related data deleted.`);
}

/* ============================================================
   COMPLIANCE
============================================================ */
function renderCompliancePage() {
  const filings = load(KEYS.filings);
  const filed   = filings.filter(f => f.filingStatus === 'Filed').length;
  const pending = filings.filter(f => f.filingStatus === 'Pending').length;
  const overdue = filings.filter(f => f.filingStatus === 'Overdue').length;

  document.getElementById('compliance-stats').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:#EEF2FF;"><i data-lucide="clipboard-list" style="width:18px;height:18px;color:#4F46E5;"></i></div>
      <div class="stat-label">Total Filings</div>
      <div class="stat-value">${filings.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:#D1FAE5;"><i data-lucide="check-circle" style="width:18px;height:18px;color:#10B981;"></i></div>
      <div class="stat-label">Filed</div>
      <div class="stat-value" style="color:#10B981;">${filed}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:#FEF3C7;"><i data-lucide="clock" style="width:18px;height:18px;color:#F59E0B;"></i></div>
      <div class="stat-label">Pending</div>
      <div class="stat-value" style="color:#F59E0B;">${pending}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:#FEE2E2;"><i data-lucide="alert-circle" style="width:18px;height:18px;color:#EF4444;"></i></div>
      <div class="stat-label">Overdue</div>
      <div class="stat-value" style="color:#EF4444;">${overdue}</div>
    </div>
  `;
  document.getElementById('overdue-badge').textContent = overdue;
  renderComplianceTable();
}

function renderComplianceTable() {
  const filings   = load(KEYS.filings);
  const formF     = document.getElementById('form-filter')?.value || '';
  const statusF   = document.getElementById('status-filter')?.value || '';
  const filtered  = filings.filter(f =>
    (!formF   || f.form === formF) &&
    (!statusF || f.filingStatus === statusF)
  );
  const tbody = document.querySelector('#compliance-table tbody');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#9CA3AF;padding:32px;">No filings match the filter.</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map(f => `
    <tr>
      <td style="font-weight:600;">${f.clientName}</td>
      <td><span class="badge badge-indigo">${f.form}</span></td>
      <td style="color:#6B7280;">${f.period}</td>
      <td>${fmtDate(f.dueDate)}</td>
      <td>${statusBadge(f.filingStatus)}</td>
      <td>${statusBadge(f.paymentStatus)}</td>
      <td class="invoice-amount">${php(f.amount)}</td>
      <td>
        ${f.filingStatus !== 'Filed'
          ? `<button class="action-btn" onclick="markFiled('${f.id}')">Mark Filed</button>`
          : `<button class="action-btn filed" disabled>✓ Filed</button>`}
      </td>
    </tr>
  `).join('');
}

function saveFiling() {
  const clientSel = document.getElementById('nf-client');
  const clientName = clientSel?.options[clientSel.selectedIndex]?.dataset.name || clientSel?.value;
  const clientId   = clientSel?.value;
  const form = document.getElementById('nf-form').value;
  const due  = document.getElementById('nf-due').value;
  if (!clientId || !due) { showToast('Please fill required fields.','error'); return; }
  const filings = load(KEYS.filings);
  filings.push({
    id: uid(),
    clientId,
    clientName,
    form,
    period:        document.getElementById('nf-period').value || '—',
    dueDate:       due,
    filingStatus:  'Pending',
    paymentStatus: 'Unpaid',
    amount:        parseFloat(document.getElementById('nf-amount').value) || 0,
  });
  save(KEYS.filings, filings);
  closeModal();
  renderCompliancePage();
  showToast(`Filing for ${clientName} added.`);
}

function markFiled(id) {
  const filings = load(KEYS.filings);
  const f = filings.find(x => x.id === id);
  if (f) { f.filingStatus = 'Filed'; f.paymentStatus = 'Paid'; }
  save(KEYS.filings, filings);
  renderCompliancePage();
  showToast('Filing marked as filed and paid.');
}

/* ============================================================
   CALENDAR
============================================================ */
let calYear = 2026, calMonth = 2; // 0-based: 2 = March

function renderCalendar() {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('cal-month-label').textContent = `${months[calMonth]} ${calYear}`;

  const filings = load(KEYS.filings);
  const dateMap = {};
  filings.forEach(f => {
    if (!dateMap[f.dueDate]) dateMap[f.dueDate] = [];
    dateMap[f.dueDate].push(f);
  });

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayStr = today();

  const dows = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = dows.map(d => `<div class="cal-dow">${d}</div>`).join('');

  for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === todayStr;
    const dayFilings = dateMap[dateStr] || [];
    let dots = '';
    if (dayFilings.length) {
      const dotColors = dayFilings.map(f => {
        if (f.filingStatus === 'Filed')   return '#10B981';
        if (f.filingStatus === 'Overdue') return '#EF4444';
        return '#F59E0B';
      });
      dots = `<div class="cal-dots">${dotColors.map(c=>`<span class="cal-dot" style="background:${c};"></span>`).join('')}</div>`;
    }
    html += `
      <div class="cal-day${isToday?' today':''}" onclick="selectCalDay('${dateStr}')">
        <div class="cal-day-num">${d}</div>
        ${dots}
      </div>
    `;
  }

  document.getElementById('cal-grid').innerHTML = html;
}

function calNav(dir) {
  calMonth += dir;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
  document.getElementById('cal-events-panel').innerHTML = `<div class="text-muted text-sm">Click a date to see filings due on that day.</div>`;
  lucide.createIcons();
}

function selectCalDay(dateStr) {
  document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  const filings = load(KEYS.filings).filter(f => f.dueDate === dateStr);
  const panel = document.getElementById('cal-events-panel');
  if (filings.length === 0) {
    panel.innerHTML = `<div class="cal-events-title">${fmtDate(dateStr)}</div><div class="text-muted text-sm">No filings due on this date.</div>`;
    return;
  }
  panel.innerHTML = `
    <div class="cal-events-title">${fmtDate(dateStr)} — ${filings.length} filing${filings.length>1?'s':''}</div>
    ${filings.map(f=>`
      <div class="cal-event-item">
        <span class="badge badge-indigo">${f.form}</span>
        <span style="font-weight:600;">${f.clientName}</span>
        <span style="color:#6B7280;">${f.period}</span>
        ${statusBadge(f.filingStatus)}
        <span style="margin-left:auto;font-weight:700;">${php(f.amount)}</span>
      </div>
    `).join('')}
  `;
}

/* ============================================================
   TASKS / KANBAN
============================================================ */
const KANBAN_COLS = ['To Do','In Progress','Review','Completed'];
const colColors   = { 'To Do':'#6B7280','In Progress':'#3B82F6','Review':'#8B5CF6','Completed':'#10B981' };

function renderKanban() {
  const tasks = load(KEYS.tasks);
  document.getElementById('kanban-board').innerHTML = KANBAN_COLS.map(col => {
    const colTasks = tasks.filter(t => t.status === col);
    return `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <div class="kanban-col-title">
            <span style="width:8px;height:8px;border-radius:50%;background:${colColors[col]};display:inline-block;"></span>
            ${col}
          </div>
          <span class="kanban-count">${colTasks.length}</span>
        </div>
        ${colTasks.map(t => `
          <div class="task-card">
            <div class="task-title">${t.title}</div>
            <div style="font-size:11px;color:#6B7280;margin-top:2px;">${t.clientName}</div>
            ${statusBadge(t.priority)}
            <div class="task-meta">
              <div class="task-meta-item">
                <i data-lucide="user" style="width:11px;height:11px;"></i> ${t.assignee.split(' ')[0]}
              </div>
              <div class="task-meta-item">
                <i data-lucide="calendar" style="width:11px;height:11px;"></i> ${fmtDate(t.dueDate)}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');
}

function saveTask() {
  const title = document.getElementById('nt-title').value.trim();
  if (!title) { showToast('Task title is required.','error'); return; }
  const clientSel = document.getElementById('nt-client');
  const clientName = clientSel?.options[clientSel.selectedIndex]?.dataset.name || clientSel?.value || '—';
  const tasks = load(KEYS.tasks);
  tasks.push({
    id: uid(),
    title,
    clientName,
    assignee: document.getElementById('nt-assignee').value,
    priority: document.getElementById('nt-priority').value,
    dueDate:  document.getElementById('nt-due').value || today(),
    status:   'To Do',
  });
  save(KEYS.tasks, tasks);
  closeModal();
  renderKanban();
  showToast(`Task "${title}" created.`);
  document.getElementById('nt-title').value = '';
}

/* ============================================================
   BILLING
============================================================ */
function renderBillingPage() {
  const invoices = load(KEYS.invoices);
  const paid     = invoices.filter(i => i.status === 'Paid').reduce((s,i)=>s+Number(i.amount),0) * 1.12;
  const outstanding = invoices.filter(i => ['Unpaid','Sent'].includes(i.status)).reduce((s,i)=>s+Number(i.amount)*1.12,0);
  const overdue  = invoices.filter(i => i.status === 'Unpaid' && i.dueDate < today()).reduce((s,i)=>s+Number(i.amount)*1.12,0);
  const total    = invoices.reduce((s,i)=>s+Number(i.amount)*1.12,0);

  document.getElementById('billing-stats').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:#EEF2FF;"><i data-lucide="trending-up" style="width:18px;height:18px;color:#4F46E5;"></i></div>
      <div class="stat-label">Total Invoiced</div>
      <div class="stat-value" style="font-size:19px;">${php(total)}</div>
      <div class="stat-change up">↑ +8% vs last month</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:#FEF3C7;"><i data-lucide="clock" style="width:18px;height:18px;color:#F59E0B;"></i></div>
      <div class="stat-label">Outstanding</div>
      <div class="stat-value" style="font-size:19px;color:#F59E0B;">${php(outstanding)}</div>
      <div class="stat-change neutral">Awaiting payment</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:#FEE2E2;"><i data-lucide="alert-circle" style="width:18px;height:18px;color:#EF4444;"></i></div>
      <div class="stat-label">Overdue</div>
      <div class="stat-value" style="font-size:19px;color:#EF4444;">${php(overdue)}</div>
      <div class="stat-change down">Past due date</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon-wrap" style="background:#D1FAE5;"><i data-lucide="check-circle" style="width:18px;height:18px;color:#10B981;"></i></div>
      <div class="stat-label">Collected</div>
      <div class="stat-value" style="font-size:19px;color:#10B981;">${php(paid)}</div>
      <div class="stat-change up">Paid invoices</div>
    </div>
  `;

  const tbody = document.querySelector('#billing-table tbody');
  if (invoices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#9CA3AF;padding:32px;">No invoices yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = invoices.map(inv => {
    const vat = Number(inv.amount) * 0.12;
    const total = Number(inv.amount) + vat;
    return `
      <tr>
        <td class="font-mono" style="font-weight:700;color:#4F46E5;">${inv.number}</td>
        <td style="font-weight:600;">${inv.clientName}</td>
        <td style="color:#6B7280;max-width:200px;white-space:normal;">${inv.desc}</td>
        <td class="invoice-amount">${php(inv.amount)}</td>
        <td style="color:#6B7280;">${php(vat)}</td>
        <td class="invoice-amount">${php(total)}</td>
        <td>${statusBadge(inv.status)}</td>
        <td>${fmtDate(inv.dueDate)}</td>
      </tr>
    `;
  }).join('');
}

function calcVAT() {
  const amount = parseFloat(document.getElementById('ci-amount').value) || 0;
  const vat    = amount * 0.12;
  const total  = amount + vat;
  const preview = document.getElementById('vat-preview');
  if (amount > 0) {
    preview.style.display = 'block';
    document.getElementById('vat-sub').textContent   = php(amount);
    document.getElementById('vat-tax').textContent   = php(vat);
    document.getElementById('vat-total').textContent = php(total);
  } else {
    preview.style.display = 'none';
  }
}

function saveInvoice() {
  const clientSel  = document.getElementById('ci-client');
  const clientName = clientSel?.options[clientSel.selectedIndex]?.dataset.name || clientSel?.value;
  const desc   = document.getElementById('ci-desc').value.trim();
  const amount = parseFloat(document.getElementById('ci-amount').value) || 0;
  const due    = document.getElementById('ci-due').value;
  if (!clientName || !desc || !amount) { showToast('Please fill all required fields.','error'); return; }
  const invoices = load(KEYS.invoices);
  const num = `INV-2026-${String(invoices.length + 1).padStart(4,'0')}`;
  invoices.push({ id: uid(), number: num, clientName, desc, amount, status: 'Draft', dueDate: due || today() });
  save(KEYS.invoices, invoices);
  closeModal();
  renderBillingPage();
  showToast(`Invoice ${num} created.`);
  document.getElementById('vat-preview').style.display = 'none';
}

/* ============================================================
   SETTINGS TABS
============================================================ */
function switchSettingsTab(tab) {
  const tabs   = ['profile','firm','notifications'];
  const tabEls = document.querySelectorAll('#settings-tabs .tab');
  tabs.forEach((t,i) => {
    document.getElementById('settings-'+t).classList.toggle('active', t===tab);
    tabEls[i].classList.toggle('active', t===tab);
  });
}

/* ============================================================
   INIT
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initDemoData();
  navigateTo('dashboard');
});
