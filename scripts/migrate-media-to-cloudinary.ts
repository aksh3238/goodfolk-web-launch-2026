import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { isCloudinaryConfigured, uploadToCloudinary } from '../src/server/cloudinary';
import { isPostgresConfigured, getPostgresPool } from '../src/server/postgres';

async function run() {
  console.log('====================================================');
  console.log(' Goodfolk Solution — Cloudinary Media Migration Tool');
  console.log('====================================================');

  if (!isCloudinaryConfigured()) {
    console.error('ERROR: Cloudinary credentials are not defined.');
    console.error('Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file or environment.');
    process.exit(1);
  }

  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log(`Notice: Uploads directory ${uploadsDir} does not exist or is empty. Nothing to migrate.`);
    return;
  }

  const files = fs.readdirSync(uploadsDir).filter(f => !f.startsWith('.'));
  if (files.length === 0) {
    console.log('Notice: No files found in uploads directory to migrate.');
    return;
  }

  console.log(`Found ${files.length} file(s) in /uploads to upload to Cloudinary...`);

  const mapping: Record<string, string> = {};
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(uploadsDir, file);
    try {
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(file).toLowerCase();
      let mimeType = 'image/jpeg';
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.svg') mimeType = 'image/svg+xml';
      else if (ext === '.mp4') mimeType = 'video/mp4';

      const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

      console.log(`[${i + 1}/${files.length}] Uploading ${file}...`);
      const res = await uploadToCloudinary(dataUrl, {
        filename: file,
        folder: process.env.CLOUDINARY_FOLDER || 'goodfolk'
      });

      const localUrl = `/uploads/${file}`;
      mapping[localUrl] = res.url;
      successCount++;
      console.log(`  -> Uploaded: ${res.url}`);
    } catch (err) {
      console.error(`  -> Failed to upload ${file}:`, err);
      failCount++;
    }
  }

  console.log('----------------------------------------------------');
  console.log(`Cloudinary Uploads Complete: ${successCount} succeeded, ${failCount} failed.`);

  // Save mapping file for reference
  const mappingFile = path.resolve(process.cwd(), 'data', 'cloudinary-media-mapping.json');
  fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2), 'utf-8');
  console.log(`Saved mapping to: ${mappingFile}`);

  // Update data/database.json with Cloudinary URLs
  const dbPath = path.resolve(process.cwd(), 'data', 'database.json');
  if (fs.existsSync(dbPath) && successCount > 0) {
    console.log('Updating references in data/database.json...');
    let raw = fs.readFileSync(dbPath, 'utf-8');
    for (const [localUrl, cloudUrl] of Object.entries(mapping)) {
      raw = raw.split(localUrl).join(cloudUrl);
    }
    fs.writeFileSync(dbPath, raw, 'utf-8');
    console.log('Updated data/database.json successfully.');

    // If Postgres is configured, update site_content & media_library in Postgres as well
    if (isPostgresConfigured()) {
      console.log('Updating references in Neon PostgreSQL...');
      const pool = getPostgresPool();
      if (pool) {
        try {
          const parsed = JSON.parse(raw);
          await pool.query("UPDATE site_content SET data = $1 WHERE id = 'current'", [JSON.stringify(parsed.siteContent)]);
          for (const [localUrl, cloudUrl] of Object.entries(mapping)) {
            await pool.query('UPDATE media_library SET url = $1 WHERE url = $2', [cloudUrl, localUrl]);
          }
          console.log('Updated Neon PostgreSQL references successfully.');
        } catch (pgErr) {
          console.warn('Could not update PostgreSQL with new URLs:', pgErr);
        } finally {
          await pool.end();
        }
      }
    }
  }

  console.log('====================================================');
  console.log('Media migration complete.');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('Media migration failed with unexpected error:', err);
  process.exit(1);
});
