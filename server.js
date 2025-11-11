import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));
app.use(bodyParser.json());

if (!process.env.SERVER_API_KEY) {
  console.warn('Warning: SERVER_API_KEY not found in environment. Add it to .env');
}

const ai = new GoogleGenAI({ apiKey: process.env.SERVER_API_KEY });

// Simple file-based storage for dev/testing
const DATA_DIR = path.join(process.cwd(), 'data');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const USERS_FILE = path.join(DATA_DIR, 'users-server.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(PAYMENTS_FILE)) fs.writeFileSync(PAYMENTS_FILE, JSON.stringify({}));
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}));

const readPayments = () => JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf8') || '{}');
const writePayments = (obj) => fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(obj, null, 2));
const readUsersServer = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '{}');
const writeUsersServer = (obj) => fs.writeFileSync(USERS_FILE, JSON.stringify(obj, null, 2));

// Create a fake PIX charge for local testing
app.post('/api/create-charge', async (req, res) => {
  const { email, plan, amount } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  const payments = readPayments();
  const chargeId = `ch_${Date.now()}`;
  const fakeQrcode = `00020101021226800014br.gov.bcb.pix0114${process.env.SERVER_API_KEY?.slice(0,6) || 'FAKE'}5204000053039865405${(amount||0).toFixed(2)}5802BR5925Virada ENEM6009Sao Paulo6108054090006304ABCD`;
  const copiaecola = `pix://${chargeId}`;

  payments[chargeId] = {
    id: chargeId,
    email,
    plan: plan || 'default',
    amount: amount || 0,
    status: 'pending',
    qrcode: fakeQrcode,
    copiaecola,
    createdAt: Date.now(),
  };
  writePayments(payments);

  return res.json({ chargeId, qrcode: fakeQrcode, copiaecola });
});

// Check payment status by chargeId or email
app.get('/api/payment-status', (req, res) => {
  const { chargeId, email } = req.query;
  const payments = readPayments();
  if (chargeId) {
    const p = payments[chargeId];
    if (!p) return res.status(404).json({ error: 'charge not found' });
    return res.json({ paid: p.status === 'paid', charge: p });
  }
  if (email) {
  const entries = Object.values(payments).filter(c => c.email === email);
  const paid = entries.some(c => c.status === 'paid');
    return res.json({ paid, charges: entries });
  }
  return res.status(400).json({ error: 'provide chargeId or email' });
});

// Simulate receiving a webhook from PSP (for local testing)
app.post('/api/simulate-webhook', express.json(), (req, res) => {
  const { chargeId } = req.body;
  if (!chargeId) return res.status(400).json({ error: 'chargeId required' });
  const payments = readPayments();
  const charge = payments[chargeId];
  if (!charge) return res.status(404).json({ error: 'charge not found' });

  charge.status = 'paid';
  charge.paidAt = Date.now();
  payments[chargeId] = charge;
  writePayments(payments);

  // mark server-side user as subscribed
  const users = readUsersServer();
  users[charge.email] = users[charge.email] || {};
  users[charge.email].isSubscribed = true;
  users[charge.email].plan = charge.plan;
  users[charge.email].paidAt = charge.paidAt;
  writeUsersServer(users);

  console.log(`Simulated webhook: charge ${chargeId} marked as paid for ${charge.email}`);
  return res.json({ ok: true, charge });
});

// Endpoint for client to confirm subscription in server records (optional)
app.post('/api/confirm-subscription', express.json(), (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const users = readUsersServer();
  users[email] = users[email] || {};
  users[email].isSubscribed = true;
  users[email].confirmedAt = Date.now();
  writeUsersServer(users);
  return res.json({ ok: true });
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing message in body' });

  try {
    const chatInstance = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "Você é um tutor especialista no ENEM, focado em Matemática e Ciências da Natureza. Responda de forma clara e didática.",
      },
    });

    const response = await chatInstance.sendMessage({ message });
    // response.text should contain the generated text
    res.json({ text: response.text ?? '' });
  } catch (err) {
    console.error('Error proxying to GoogleGenAI:', err);
    res.status(500).json({ error: err?.message ?? String(err) });
  }
});

// Dev convenience: redirect root to the frontend dev server
app.get('/', (req, res) => {
  return res.redirect('http://localhost:3000');
});

app.listen(port, () => {
  console.log(`Server proxy listening on http://localhost:${port}`);
});
