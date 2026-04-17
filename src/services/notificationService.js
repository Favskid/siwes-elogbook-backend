const { query } = require('../config/db');
const { v4: uuidv4 } = require('uuid');


// ─── Auto-Trigger Events ──────────────────────────────────────

const triggerOnSubmit = async (studentId, entryId) => {
  try {
    const message = 'Your log entry has been submitted for review';
    await query(
      `INSERT INTO notifications (id, user_id, title, message, type, related_entry_id, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [uuidv4(), studentId, 'Entry Submitted', message, 'submission', entryId, false]
    );
  } catch (err) {
    console.error('Failed to trigger submit notification:', err);
  }
};


const triggerOnApprove = async (studentId, entryId, supervisorComment = '') => {
  try {
    const message = supervisorComment 
      ? `Your log entry has been approved. Comment: ${supervisorComment}`
      : 'Your log entry has been approved';
    
    await query(
      `INSERT INTO notifications (id, user_id, title, message, type, related_entry_id, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [uuidv4(), studentId, 'Entry Approved', message, 'approval', entryId, false]
    );
  } catch (err) {
    console.error('Failed to trigger approve notification:', err);
  }
};


const triggerOnReject = async (studentId, entryId, supervisorComment = '') => {
  try {
    const message = supervisorComment
      ? `Your log entry has been rejected. Comment: ${supervisorComment}`
      : 'Your log entry has been rejected';
    
    await query(
      `INSERT INTO notifications (id, user_id, title, message, type, related_entry_id, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [uuidv4(), studentId, 'Entry Rejected', message, 'rejection', entryId, false]
    );
  } catch (err) {
    console.error('Failed to trigger reject notification:', err);
  }
};


const triggerOnFeedback = async (userId, entryId, message) => {
  try {
    await query(
      `INSERT INTO notifications (id, user_id, title, message, type, related_entry_id, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [uuidv4(), userId, 'Feedback', message, 'feedback', entryId, false]
    );
  } catch (err) {
    console.error('Failed to trigger feedback notification:', err);
  }
};


module.exports = {
  triggerOnSubmit,
  triggerOnApprove,
  triggerOnReject,
  triggerOnFeedback,
};
