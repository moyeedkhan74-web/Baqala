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
    // Sanitize filename: replace spaces and special characters with underscores
    const sanitizedFileName = fileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = `apps/${Date.now()}_${sanitizedFileName}`;
    
    console.log(`[B2_INIT] Initializing upload for: ${fileName} as ${filePath}`);
    const result = await startMultipartUpload(filePath, contentType || 'application/octet-stream');
    
    if (result.success) {
      console.log(`[B2_INIT] Success. UploadID: ${result.uploadId} | Path: ${result.filePath}`);
      res.json({ 
        success: true, 
        uploadId: result.uploadId, 
        filePath: result.filePath 
      });
    } else {
      console.error(`[B2_INIT] Failed:`, result.error);
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
    console.log(`[B2_CHUNK] Uploading Part ${partNumber} for ${uploadId}`);
    const result = await uploadPart(filePath, uploadId, partNumber, chunk.buffer);
    
    if (result.success) {
      console.log(`[B2_CHUNK] Part ${partNumber} complete. ETag: ${result.etag}`);
      res.json({ success: true, etag: result.etag, partNumber });
    } else {
      console.error(`[B2_CHUNK] Part ${partNumber} failed:`, result.error);
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
    // FORCE isPrivate=true for apps
    const result = await completeMultipartUpload(filePath, uploadId, parts, true);

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
