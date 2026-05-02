const { 
  startMultipartUpload, 
  uploadPart, 
  completeMultipartUpload,
  abortMultipartUpload 
} = require('../utils/b2Storage');

// Starts the cloud multipart process
exports.initUpload = async (req, res, next) => {
  try {
    const { fileName, contentType } = req.body;
    const filePath = `apps/${Date.now()}_${fileName}`;
    
    const result = await startMultipartUpload(filePath, contentType || 'application/octet-stream');
    
    if (result.success) {
      res.json({ 
        success: true, 
        uploadId: result.uploadId, 
        filePath 
      });
    } else {
      res.status(500).json({ message: 'Failed to initialize cloud upload', error: result.error });
    }
  } catch (error) {
    next(error);
  }
};

exports.uploadChunk = async (req, res, next) => {
  try {
    const { chunkIndex, uploadId, filePath } = req.body;
    const chunk = req.file;

    if (!chunk) {
      return res.status(400).json({ message: 'No chunk data received.' });
    }

    // chunk.buffer is available because we use memoryStorage
    const partNumber = parseInt(chunkIndex) + 1;
    const result = await uploadPart(filePath, uploadId, partNumber, chunk.buffer);

    if (result.success) {
      res.json({ success: true, etag: result.etag, partNumber });
    } else {
      res.status(500).json({ message: `Failed to upload part ${partNumber}`, error: result.error });
    }
  } catch (error) {
    next(error);
  }
};

exports.combineChunks = async (req, res, next) => {
  try {
    const { uploadId, filePath, parts, fileName } = req.body;
    
    // parts should be array of { ETag, PartNumber }
    const result = await completeMultipartUpload(filePath, uploadId, parts);

    if (result.success) {
      res.json({ 
        success: true, 
        url: result.url, 
        fileName,
        // Since we don't know the exact size here without summing parts, we'll let client handle metadata
      });
    } else {
      await abortMultipartUpload(filePath, uploadId);
      res.status(500).json({ message: 'Failed to finalize cloud upload', error: result.error });
    }
  } catch (error) {
    next(error);
  }
};
