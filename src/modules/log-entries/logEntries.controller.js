const logEntriesService = require('./logEntries.service');
const notificationService = require('../../services/notificationService');
const { success, created } = require('../../utils/response');


const createEntryController = async (req, res, next) => {
  try {
    const entry = await logEntriesService.createEntry(
      req.user.id,
      req.body,
      req.files || []
    );
    return created(res, entry, 'Log entry created successfully');
  } catch (err) {
    // Clean up uploaded files on error
    if (req.files && Array.isArray(req.files)) {
      const fs = require('fs');
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          console.error(`Failed to delete file: ${file.path}`);
        }
      });
    }
    next(err);
  }
};


const getEntryController = async (req, res, next) => {
  try {
    const entry = await logEntriesService.getEntry(
      req.params.id,
      req.user.id,
      req.user.role
    );
    return success(res, entry, 'Log entry retrieved successfully');
  } catch (err) {
    next(err);
  }
};


const listEntriesController = async (req, res, next) => {
  try {
    const { page, limit, status, week_number, date_from, date_to } = req.query;
    const result = await logEntriesService.listEntries(
      req.user.id,
      req.user.role,
      { page, limit, status, week_number, date_from, date_to }
    );
    return success(res, result, 'Log entries retrieved successfully');
  } catch (err) {
    next(err);
  }
};


const updateEntryController = async (req, res, next) => {
  try {
    const entry = await logEntriesService.updateEntry(
      req.params.id,
      req.user.id,
      req.body
    );
    return success(res, entry, 'Log entry updated successfully');
  } catch (err) {
    next(err);
  }
};


const submitEntryController = async (req, res, next) => {
  try {
    const entry = await logEntriesService.submitEntry(
      req.params.id,
      req.user.id
    );
    // Trigger notification
    await notificationService.triggerOnSubmit(req.user.id, req.params.id);
    return success(res, entry, 'Log entry submitted successfully');
  } catch (err) {
    next(err);
  }
};


const deleteEntryController = async (req, res, next) => {
  try {
    await logEntriesService.deleteEntry(req.params.id, req.user.id);
    return success(res, null, 'Log entry deleted successfully');
  } catch (err) {
    next(err);
  }
};


module.exports = {
  createEntryController,
  getEntryController,
  listEntriesController,
  updateEntryController,
  submitEntryController,
  deleteEntryController,
};
