const filesService = require('./files.service');
const { success, created } = require('../../utils/response');
const path = require('path');
const fs = require('fs');


const uploadFileController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No file provided',
        },
      });
    }

    const file = await filesService.uploadFile(
      req.user.id,
      req.params.entryId,
      req.file
    );
    return created(res, file, 'File uploaded successfully');
  } catch (err) {
    next(err);
  }
};


const getFileController = async (req, res, next) => {
  try {
    const file = await filesService.getFile(req.user.id, req.params.fileId);
    
    // Serve file
    res.download(file.file_path, file.original_name, (err) => {
      if (err) {
        console.error('Error serving file:', err);
      }
    });
  } catch (err) {
    next(err);
  }
};


const deleteFileController = async (req, res, next) => {
  try {
    await filesService.deleteFile(req.user.id, req.params.fileId);
    return success(res, null, 'File deleted successfully');
  } catch (err) {
    next(err);
  }
};


const getEntryFilesController = async (req, res, next) => {
  try {
    const files = await filesService.getEntryFiles(
      req.user.id,
      req.params.entryId
    );
    return success(res, files, 'Entry files retrieved successfully');
  } catch (err) {
    next(err);
  }
};


module.exports = {
  uploadFileController,
  getFileController,
  deleteFileController,
  getEntryFilesController,
};
