/**
 * Firebase Storage Verification Script
 * Run this to verify your Firebase configuration is correct
 * 
 * Usage: node scripts/verify-firebase.js
 */

require('dotenv').config();
const { initializeFirebase } = require('../utils/firebaseStorage');
const { uploadBuffer, deleteResource } = require('../utils/storage');

async function verifyFirebase() {
  console.log('\n🔍 Verifying Firebase Storage Configuration...\n');

  // Check environment variables
  console.log('1. Checking environment variables...');
  const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
  const storageMode = process.env.STORAGE_MODE || 'auto';
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  console.log(`   ✓ STORAGE_MODE: ${storageMode}`);
  console.log(`   ✓ FIREBASE_SERVICE_ACCOUNT: ${hasServiceAccount ? '✅ Set' : '❌ Not set'}`);
  console.log(`   ✓ FIREBASE_STORAGE_BUCKET: ${storageBucket || 'Not set (will use default)'}`);

  if (!hasServiceAccount) {
    console.log('\n❌ ERROR: FIREBASE_SERVICE_ACCOUNT is not set!');
    console.log('   Please set it in your .env file or Render environment variables.');
    process.exit(1);
  }

  // Try to initialize Firebase
  console.log('\n2. Initializing Firebase...');
  try {
    initializeFirebase();
    console.log('   ✅ Firebase initialized successfully');
  } catch (error) {
    console.log(`   ❌ Firebase initialization failed: ${error.message}`);
    console.log('\n   Common issues:');
    console.log('   - FIREBASE_SERVICE_ACCOUNT JSON is malformed');
    console.log('   - JSON is not properly escaped (should be single line with escaped quotes)');
    console.log('   - Service account key is invalid or expired');
    process.exit(1);
  }

  // Try to upload a test file
  console.log('\n3. Testing file upload...');
  try {
    const testBuffer = Buffer.from('This is a test file for Firebase Storage verification');
    const result = await uploadBuffer(testBuffer, {
      folder: 'test',
      contentType: 'text/plain',
      filename: 'verification-test.txt',
    });
    console.log('   ✅ Test file uploaded successfully');
    console.log(`   ✓ File URL: ${result.secure_url}`);

    // Try to delete the test file
    console.log('\n4. Testing file deletion...');
    try {
      await deleteResource(result.public_id);
      console.log('   ✅ Test file deleted successfully');
    } catch (deleteError) {
      console.log(`   ⚠️  Test file deletion failed (non-critical): ${deleteError.message}`);
    }
  } catch (error) {
    console.log(`   ❌ File upload failed: ${error.message}`);
    console.log('\n   Common issues:');
    console.log('   - Storage bucket not found');
    console.log('   - Service account lacks Storage Admin permissions');
    console.log('   - Network connectivity issues');
    process.exit(1);
  }

  console.log('\n✅ All Firebase Storage checks passed!');
  console.log('   Your Firebase configuration is correct and ready to use.\n');
}

// Run verification
verifyFirebase().catch((error) => {
  console.error('\n❌ Verification failed:', error);
  process.exit(1);
});

