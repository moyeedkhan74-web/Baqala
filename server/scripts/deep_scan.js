const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const s3Public = new S3Client({
    region: process.env.B2_REGION || 'us-east-005',
    endpoint: `https://${process.env.B2_ENDPOINT}`,
    credentials: {
        accessKeyId: process.env.B2_APPLICATION_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY,
    },
    forcePathStyle: true,
});

const s3Private = new S3Client({
    region: process.env.B2_PRIVATE_REGION || 'us-east-005',
    endpoint: `https://${process.env.B2_PRIVATE_ENDPOINT}`,
    credentials: {
        accessKeyId: process.env.B2_PRIVATE_KEY_ID,
        secretAccessKey: process.env.B2_PRIVATE_APP_KEY,
    },
    forcePathStyle: true,
});

async function scanBucket(s3, bucketName) {
    let totalSize = 0;
    let count = 0;
    let continuationToken = undefined;

    console.log(`Scanning Bucket: ${bucketName}...`);
    try {
        do {
            const command = new ListObjectsV2Command({
                Bucket: bucketName,
                ContinuationToken: continuationToken,
            });
            const response = await s3.send(command);
            
            if (response.Contents) {
                response.Contents.forEach(obj => {
                    totalSize += obj.Size;
                    count++;
                });
            }
            continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        return { totalSize, count };
    } catch (err) {
        console.error(`Error scanning ${bucketName}:`, err.message);
        return { totalSize: 0, count: 0, error: err.message };
    }
}

async function runDeepScan() {
    console.log('--- STARTING DEEP STORAGE SCAN ---');
    
    // 1. Scan Public Bucket (Photos/Icons)
    const publicStats = await scanBucket(s3Public, process.env.B2_BUCKET_NAME);
    
    // 2. Scan Private Bucket (Apps/Binaries)
    const privateStats = await scanBucket(s3Private, process.env.B2_PRIVATE_BUCKET);
    
    const totalBytes = publicStats.totalSize + privateStats.totalSize;
    const totalFiles = publicStats.count + privateStats.count;

    console.log('\n--- B2 STORAGE RESULTS ---');
    console.log(`Public Bucket (${process.env.B2_BUCKET_NAME}): ${(publicStats.totalSize / (1024 * 1024)).toFixed(2)} MB (${publicStats.count} files)`);
    console.log(`Private Bucket (${process.env.B2_PRIVATE_BUCKET}): ${(privateStats.totalSize / (1024 * 1024)).toFixed(2)} MB (${privateStats.count} files)`);
    console.log(`Total Storage Used: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
    
    // 3. Attempt MongoDB Stats
    console.log('\n--- ATTEMPTING DATABASE SCAN ---');
    try {
        const client = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });
        const db = client.connection.db;
        const stats = await db.command({ dbStats: 1 });
        
        console.log(`Database Name: ${stats.db}`);
        console.log(`Data Size: ${(stats.dataSize / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`Storage Size: ${(stats.storageSize / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`Total Objects: ${stats.objects}`);
        
        // MongoDB Atlas Free Tier is typically 512MB
        const limit = 512 * 1024 * 1024;
        const percent = ((stats.storageSize / limit) * 100).toFixed(2);
        console.log(`Database Usage: ${percent}% of 512MB Free Tier`);
    } catch (err) {
        console.log('Database scan failed (Blocked by MongoDB Atlas IP Whitelist / Network)');
        console.log('Use the Admin Dashboard for live DB metrics.');
    }

    process.exit();
}

runDeepScan();
