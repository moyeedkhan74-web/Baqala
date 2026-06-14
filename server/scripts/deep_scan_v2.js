const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// --- CONFIGURATION & LIMITS ---
const LIMITS = {
    MONGODB: 512 * 1024 * 1024,      // 512 MB
    B2_PUBLIC: 10 * 1024 * 1024 * 1024, // 10 GB
    B2_PRIVATE: 10 * 1024 * 1024 * 1024,// 10 GB
    SUPABASE: 500 * 1024 * 1024      // 500 MB
};

// --- CLIENTS ---
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

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- SCAN FUNCTIONS ---

async function scanB2(s3, bucketName, limit) {
    let totalSize = 0;
    let count = 0;
    let continuationToken = undefined;

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

        const percentage = ((totalSize / limit) * 100).toFixed(2);
        return { totalSize, count, percentage };
    } catch (err) {
        return { totalSize: 0, count: 0, percentage: '0.00', error: err.message };
    }
}

async function scanMongo(limit) {
    try {
        const client = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        const stats = await client.connection.db.command({ dbStats: 1 });
        const percentage = ((stats.storageSize / limit) * 100).toFixed(2);
        return {
            size: stats.storageSize,
            count: stats.objects,
            percentage
        };
    } catch (err) {
        return { size: 0, count: 0, percentage: 'N/A (Access Restricted)', error: err.message };
    }
}

async function scanSupabase(limit) {
    try {
        // We estimate Supabase DB size by counting rows and assuming average row size
        // Since Supabase doesn't expose easy DB size via standard Client SDK (needs pg_database_size)
        // We'll fetch total rows from all tables if possible, or just a rough estimate if only 'feedbacks' exists.
        const { count, error } = await supabase
            .from('feedbacks')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        // Estimate: 1KB per feedback entry
        const estimatedSize = (count || 0) * 1024;
        const percentage = ((estimatedSize / limit) * 100).toFixed(4);
        return { size: estimatedSize, count: count || 0, percentage };
    } catch (err) {
        return { size: 0, count: 0, percentage: '0.00', error: err.message };
    }
}

async function runEnhancedScan() {
    console.log('--- BAQALA INDIVIDUAL STORAGE PERCENTAGES ---\n');

    const results = {
        b2Public: await scanB2(s3Public, process.env.B2_BUCKET_NAME, LIMITS.B2_PUBLIC),
        b2Private: await scanB2(s3Private, process.env.B2_PRIVATE_BUCKET, LIMITS.B2_PRIVATE),
        mongo: await scanMongo(LIMITS.MONGODB),
        supabase: await scanSupabase(LIMITS.SUPABASE)
    };

    console.log(`1. MongoDB Atlas (Metadata):`);
    console.log(`   Usage: ${results.mongo.percentage}% of 512MB`);
    console.log(`   Details: ${results.mongo.count} objects / ${(results.mongo.size / (1024*1024)).toFixed(2)} MB used\n`);

    console.log(`2. Backblaze B2 (Assets/Public):`);
    console.log(`   Usage: ${results.b2Public.percentage}% of 10GB`);
    console.log(`   Details: ${results.b2Public.count} files / ${(results.b2Public.totalSize / (1024*1024)).toFixed(2)} MB used\n`);

    console.log(`3. Backblaze B2 (Apps/Private):`);
    console.log(`   Usage: ${results.b2Private.percentage}% of 10GB`);
    console.log(`   Details: ${results.b2Private.count} files / ${(results.b2Private.totalSize / (1024*1024)).toFixed(2)} MB used\n`);

    console.log(`4. Supabase (Feedback DB):`);
    console.log(`   Usage: ${results.supabase.percentage}% of 500MB (Estimate)`);
    console.log(`   Details: ${results.supabase.count} entries / ${(results.supabase.size / 1024).toFixed(2)} KB estimated\n`);

    console.log('--- SCAN COMPLETE ---');
    process.exit();
}

runEnhancedScan();
