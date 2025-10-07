// server.js
require('dotenv').config();
const express = require('express');
const helmet = require('./node_modules/helmet/index.d.cts');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { authRequired, adminOnly, SECRET } = require('./middleware/auth');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // serve client (put index.html in public/)

const PORT = process.env.PORT || 4000;

// helper to get user by name
function getUserByName(name){
  return db.prepare('SELECT id,name,hash,role FROM users WHERE name = ?').get(name);
}

// --- register (admin only) ---
app.post('/api/register', authRequired, adminOnly, async (req,res)=>{
  const { name, password, role } = req.body;
  if(!name || !password || !role) return res.status(400).json({error:'missing'});
  if(!['admin','member'].includes(role)) return res.status(400).json({error:'bad role'});
  const exists = getUserByName(name);
  if(exists) return res.status(409).json({error:'exists'});
  const hash = await bcrypt.hash(password, 10);
  const info = db.prepare('INSERT INTO users (name, hash, role) VALUES (?, ?, ?)').run(name, hash, role);
  res.json({ ok:true, id: info.lastInsertRowid });
});

// --- login (returns JWT) ---
app.post('/api/login', async (req,res)=>{
  const { name, password } = req.body;
  if(!name || !password) return res.status(400).json({error:'missing'});
  const user = getUserByName(name);
  if(!user) return res.status(401).json({error:'bad cred'});
  const ok = await bcrypt.compare(password, user.hash);
  if(!ok) return res.status(401).json({error:'bad cred'});
  const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, SECRET, { expiresIn: '8h' });
  res.json({ token, name: user.name, role: user.role });
});

// --- get current user info ---
app.get('/api/me', authRequired, (req,res)=>{
  res.json({ id: req.user.id, name: req.user.name, role: req.user.role });
});

// --- list users (admin only) ---
app.get('/api/users', authRequired, adminOnly, (req,res)=>{
  const rows = db.prepare('SELECT id,name,role FROM users ORDER BY id DESC').all();
  res.json(rows);
});

// --- revoke user (admin only) ---
app.delete('/api/users/:id', authRequired, adminOnly, (req,res)=>{
  const id = Number(req.params.id);
  if(!id) return res.status(400).json({error:'bad id'});
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ ok:true });
});

// --- links: anyone authenticated can view ---
app.get('/api/links', authRequired, (req,res)=>{
  const rows = db.prepare('SELECT id,title,href,created_at FROM links ORDER BY id DESC').all();
  res.json(rows);
});

// --- add link (admin only) ---
app.post('/api/links', authRequired, adminOnly, (req,res)=>{
  const { title, href } = req.body;
  if(!title || !href) return res.status(400).json({error:'missing'});
  const info = db.prepare('INSERT INTO links (title, href) VALUES (?, ?)').run(title, href);
  res.json({ id: info.lastInsertRowid });
});

// --- reset portal (admin only) ---
app.post('/api/reset', authRequired, adminOnly, (req,res)=>{
  db.prepare('DELETE FROM links').run();
  db.prepare("DELETE FROM users WHERE role != 'admin'").run(); // keep admins
  res.json({ ok:true });
});

// fallback for SPA, (serve index.html from public)
app.get('*', (req,res)=> res.sendFile(require('path').resolve(__dirname, 'public', 'index.html')));

app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));
