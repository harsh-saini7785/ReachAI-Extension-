const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../firebase');

const COLLECTION = 'emailContacts';

// ─── GET /api/contacts ─────────────────────────────────────────────────────────
// Returns all contacts ordered by creation time
router.get('/contacts', async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
    const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(contacts);
  } catch (err) {
    console.error('GET /contacts error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/contacts ────────────────────────────────────────────────────────
// Create a new contact
router.post('/contacts', async (req, res) => {
  const { name, email, company, role } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'email is required.' });
  }

  const id = uuidv4();
  const contact = {
    name:           name || '',
    email,
    company:        company || '',
    role:           role || '',
    status:         'pending',
    sentAt:         null,
    followupSentAt: null,
    createdAt:      Date.now(),
  };

  try {
    await db.collection(COLLECTION).doc(id).set(contact);
    return res.status(201).json({ id, ...contact });
  } catch (err) {
    console.error('POST /contacts error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/contacts/:id ───────────────────────────────────────────────────
// Update a contact's fields (status, sentAt, followupSentAt, etc.)
router.patch('/contacts/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Prevent overwriting the id
  delete updates.id;

  try {
    await db.collection(COLLECTION).doc(id).update(updates);
    const updated = await db.collection(COLLECTION).doc(id).get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('PATCH /contacts/:id error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/contacts/:id ──────────────────────────────────────────────────
// Delete a contact permanently
router.delete('/contacts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection(COLLECTION).doc(id).delete();
    return res.json({ success: true });
  } catch (err) {
    console.error('DELETE /contacts/:id error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/contacts/followups-due ──────────────────────────────────────────
// Returns all contacts where status === 'followup-due'
router.get('/contacts/followups-due', async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION)
      .where('status', '==', 'followup-due')
      .get();
    const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(contacts);
  } catch (err) {
    console.error('GET /contacts/followups-due error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
