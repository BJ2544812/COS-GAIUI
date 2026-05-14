import express from 'express';
/** @deprecated Legacy monolithic dev server. Prefer `npm run dev:server` → `src/server/index.ts` (Express + Prisma API). */
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'church-os-secret-secure-key-2024';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Local SQLite Database
  const db = new Database('church.db');
  db.pragma('journal_mode = WAL');

  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT,
      membership_date TEXT,
      status TEXT DEFAULT 'Active',
      growth_stage TEXT DEFAULT 'Visitor',
      last_attendance TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS finance_accounts (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      balance REAL DEFAULT 0,
      type TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      id TEXT PRIMARY KEY,
      voucher_no TEXT UNIQUE,
      type TEXT,
      date TEXT,
      amount REAL,
      account_id TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES finance_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      count INTEGER,
      session_name TEXT,
      campus TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role_id TEXT,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      is_system INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      module_key TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT,
      permission_id TEXT,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (permission_id) REFERENCES permissions(id)
    );

    CREATE TABLE IF NOT EXISTS org_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Seed initial data if empty
  const isSeeded = db.prepare('SELECT COUNT(*) as count FROM roles').get() as { count: number };
  if (isSeeded.count === 0) {
    console.log('Generating Core Identity System...');
    
    // 1. Roles
    const roles = [
      { id: 'admin', name: 'Super Administrator', is_system: 1 },
      { id: 'pastor', name: 'Lead Pastor', is_system: 0 },
      { id: 'accountant', name: 'Finance Officer', is_system: 0 },
      { id: 'usher', name: 'Usher / Attendance', is_system: 0 }
    ];
    const insertRole = db.prepare('INSERT INTO roles (id, name, is_system) VALUES (?, ?, ?)');
    roles.forEach(r => insertRole.run(r.id, r.name, r.is_system));

    // 2. Permissions
    const perms = [
      { id: 'view_dashboard', module: 'dashboard', name: 'View Dashboard' },
      { id: 'manage_members', module: 'members', name: 'Manage Members' },
      { id: 'view_finance', module: 'finance', name: 'View Accounts' },
      { id: 'post_vouchers', module: 'finance', name: 'Post Vouchers' },
      { id: 'manage_attendance', module: 'attendance', name: 'Manage Attendance' },
      { id: 'manage_permissions', module: 'permissions', name: 'Manage Roles' }
    ];
    const insertPerm = db.prepare('INSERT INTO permissions (id, name, module_key) VALUES (?, ?, ?)');
    perms.forEach(p => insertPerm.run(p.id, p.name, p.module));

    // 3. Assign all to Admin
    const insertRP = db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
    perms.forEach(p => insertRP.run('admin', p.id));
    
    // 4. Default Admin User (password: church123)
    const hashedPassword = await bcrypt.hash('church123', 10);
    db.prepare('INSERT INTO users (id, username, password, role_id) VALUES (?, ?, ?, ?)').run(
      crypto.randomUUID(), 'admin', hashedPassword, 'admin'
    );

    // 5. Seed Members
    const members = [
      { id: '1', name: 'John Smith', role: 'Deacon', growth_stage: 'Leader' },
      { id: '2', name: 'Sarah Jones', role: 'Member', growth_stage: 'Visitor' }
    ];
    const insertMember = db.prepare('INSERT INTO members (id, name, role, growth_stage) VALUES (?, ?, ?, ?)');
    members.forEach(m => insertMember.run(m.id, m.name, m.role, m.growth_stage));

    // 6. Seed Accounts
    const accounts = [
      { id: '1', code: '1000', name: 'General Fund', balance: 485000, type: 'Credit' },
      { id: '2', code: '2000', name: 'Building Project', balance: 28430000, type: 'Credit' }
    ];
    const insertAcc = db.prepare('INSERT INTO finance_accounts (id, code, name, balance, type) VALUES (?, ?, ?, ?, ?)');
    accounts.forEach(a => insertAcc.run(a.id, a.code, a.name, a.balance, a.type));

    console.log('Identity System Seeded Successfully.');
  }

  app.use(cors());
  app.use(express.json());

  // Middleware: Auth
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.username = ?
    `).get(username) as any;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const permissions = db.prepare(`
      SELECT p.module_key, p.id 
      FROM role_permissions rp 
      JOIN permissions p ON rp.permission_id = p.id 
      WHERE rp.role_id = ?
    `).all(user.role_id) as any[];

    const token = jwt.sign({ 
      id: user.id, 
      username: user.username, 
      role: user.role_id,
      permissions: permissions.map(p => p.id)
    }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, user: { username: user.username, role: user.role_name } });
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    const user = db.prepare('SELECT username, role_id FROM users WHERE id = ?').get(req.user.id) as any;
    const permissions = db.prepare(`
      SELECT p.module_key, p.id 
      FROM role_permissions rp 
      JOIN permissions p ON rp.permission_id = p.id 
      WHERE rp.role_id = ?
    `).all(user.role_id) as any[];

    res.json({ 
      username: user.username, 
      roleId: user.role_id,
      permissions: permissions.map(p => p.id) 
    });
  });

  // Permissions API
  app.get('/api/roles', authenticateToken, (req, res) => {
    const roles = db.prepare('SELECT * FROM roles').all();
    const rolesWithPerms = roles.map((role: any) => {
      const perms = db.prepare(`
        SELECT p.* FROM role_permissions rp 
        JOIN permissions p ON rp.permission_id = p.id 
        WHERE rp.role_id = ?
      `).all(role.id);
      return { ...role, permissions: perms };
    });
    res.json(rolesWithPerms);
  });

  app.get('/api/permissions', authenticateToken, (req, res) => {
    const perms = db.prepare('SELECT * FROM permissions').all();
    res.json(perms);
  });

  // Settings & Setup API
  app.get('/api/setup/status', (req, res) => {
    const orgName = db.prepare('SELECT value FROM org_settings WHERE key = ?').get('org_name') as any;
    res.json({ isInitialized: !!orgName });
  });

  app.post('/api/setup/initialize', async (req, res) => {
    const { orgName, adminUser, adminPassword } = req.body;
    
    const existing = db.prepare('SELECT value FROM org_settings WHERE key = ?').get('org_name');
    if (existing) return res.status(400).json({ error: 'System already initialized' });

    const transaction = db.transaction(async () => {
      db.prepare('INSERT INTO org_settings (key, value) VALUES (?, ?)').run('org_name', orgName);
      
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      db.prepare('UPDATE users SET username = ?, password = ? WHERE role_id = ?').run(
        adminUser, hashedPassword, 'admin'
      );
    });

    await transaction();
    res.json({ status: 'success' });
  });

  app.get('/api/settings', authenticateToken, (req, res) => {
    const settings = db.prepare('SELECT * FROM org_settings').all();
    res.json(settings);
  });

  // Protected Core APIs
  app.get('/api/members', authenticateToken, (req, res) => {
    const members = db.prepare('SELECT * FROM members ORDER BY created_at DESC').all();
    res.json(members);
  });

  app.post('/api/members', authenticateToken, (req, res) => {
    const { id, name, email, phone, role, membership_date, growth_stage } = req.body;
    const stmt = db.prepare('INSERT INTO members (id, name, email, phone, role, membership_date, growth_stage) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id || crypto.randomUUID(), name, email, phone, role, membership_date || new Date().toISOString(), growth_stage);
    res.status(201).json({ status: 'success' });
  });

  // Finance API
  app.get('/api/accounts', authenticateToken, (req, res) => {
    const accounts = db.prepare('SELECT * FROM finance_accounts').all();
    res.json(accounts);
  });

  app.post('/api/vouchers', authenticateToken, (req, res) => {
    const { id, voucher_no, type, date, amount, account_id, description } = req.body;
    const insertVoucher = db.prepare('INSERT INTO vouchers (id, voucher_no, type, date, amount, account_id, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const updateBalance = db.prepare('UPDATE finance_accounts SET balance = balance + ? WHERE id = ?');
    
    const transaction = db.transaction(() => {
      insertVoucher.run(id || crypto.randomUUID(), voucher_no, type, date, amount, account_id, description);
      updateBalance.run(amount, account_id);
    });

    transaction();
    res.json({ status: 'success' });
  });

  // Attendance API
  app.get('/api/attendance', authenticateToken, (req, res) => {
    const data = db.prepare('SELECT * FROM attendance ORDER BY date DESC LIMIT 30').all();
    res.json(data);
  });

  app.post('/api/attendance', authenticateToken, (req, res) => {
    const { date, count, session_name, campus } = req.body;
    db.prepare('INSERT INTO attendance (date, count, session_name, campus) VALUES (?, ?, ?, ?)').run(
      date || new Date().toISOString(), 
      count, 
      session_name, 
      campus
    );
    res.json({ status: 'success' });
  });

  // Vite Middleware integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kingdom OS API initialized at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Core Ignition Error:', err);
});
