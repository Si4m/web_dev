// middleware/auth.js
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET';

function authRequired(req, res, next){
  const auth = req.headers.authorization;
  if(!auth || !auth.startsWith('Bearer ')) return res.status(401).json({error:'missing token'});
  const token = auth.slice(7);
  try{
    const payload = jwt.verify(token, SECRET);
    req.user = payload; // { id, name, role }
    next();
  }catch(e){
    return res.status(401).json({error:'invalid token'});
  }
}

function adminOnly(req, res, next){
  if(!req.user) return res.status(401).json({error:'missing auth'});
  if(req.user.role !== 'admin') return res.status(403).json({error:'admin only'});
  next();
}

module.exports = { authRequired, adminOnly, SECRET };
