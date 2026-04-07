const fs = require('fs');
const path = require('path');
const { uploadToSupabase } = require('../utils/supabaseStorage');

exports.uploadChunk = async (req, res, next) => {
  try {
    const { chunkIndex, totalChunks, fileName, uploadId } = req.body;
    const chunk = req.files && req.files.appFile ? req.files.appFile[0] : null;

    if (!chunk) {
      console.error('No chunk found in request. Files received:', req.files);
      return res.status(400).json({ message: 'No chunk data received.' });
    }

    const tempDir = path.join(__dirname, '..', 'uploads', 'temp', uploadId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const chunkPath = path.join(tempDir, `chunk_${chunkIndex}`);
    fs.renameSync(chunk.path, chunkPath);

    res.json({ success: true, message: `Chunk ${chunkIndex} received.` });
  } catch (error) {
    next(error);
  }
};

exports.combineChunks = async (req, res, next) => {
  try {
    const { totalChunks, fileName, uploadId, contentType } = req.body;
    const tempDir = path.join(__dirname, '..', 'uploads', 'temp', uploadId);
    const finalDir = path.join(__dirname, '..', 'uploads', 'apps');
    
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }

    const finalPath = path.join(finalDir, `${Date.now()}_${fileName}`);
    const writeStream = fs.createWriteStream(finalPath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(tempDir, `chunk_${i}`);
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
      fs.unlinkSync(chunkPath);
    }

    writeStream.end();

    // After combining, upload to Supabase
    writeStream.on('finish', async () => {
      try {
         const { uploadToB2 } = require('../utils/b2Storage');
         const fileBuffer = fs.readFileSync(finalPath);
         const folderPath = `apps/${uploadId}_${fileName}`;
         const b2Res = await uploadToB2(folderPath, fileBuffer, contentType || 'application/octet-stream');

        // Cleanup local final file
        fs.unlinkSync(finalPath);
        fs.rmdirSync(tempDir);

        if (b2Res.success) {
          res.json({ success: true, url: b2Res.url, fileName, fileSize: fileBuffer.length });
        } else {
          res.status(500).json({ message: 'B2 Cloud Upload failed', error: b2Res.error });
        }
      } catch (err) {
        console.error('Final Stage Error:', err);
        res.status(500).json({ message: 'Final processing failed' });
      }
    });

  } catch (error) {
    next(error);
  }
};
