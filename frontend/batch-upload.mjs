import fs from 'fs';
import path from 'path';

const API_URL = 'http://45.77.233.102:8003';
const CONTRACTS_DIR = 'I:/Scratch/ContractClarity/sample-contracts/scribd-downloads';

const contracts = [
  // New PDFs to upload
  '116987661-Sample-Saas-Agreement.pdf',
  '364828294-Sample-Agreement.pdf',
  '440361177-CONTRACT-OF-LEASE-OF-COMMERCIAL-SPACE-docx.pdf',
];

async function uploadContract(filename) {
  const filePath = path.join(CONTRACTS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filename}`);
    return null;
  }

  const fileContent = fs.readFileSync(filePath);
  const formData = new FormData();
  const blob = new Blob([fileContent], { type: 'application/pdf' });
  formData.append('file', blob, filename);

  try {
    const response = await fetch(`${API_URL}/documents/upload`, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`  📋 Response:`, JSON.stringify(data).substring(0, 100));
      return data;
    } else {
      const text = await response.text();
      console.log(`  ❌ Failed: ${response.status} - ${text.substring(0, 100)}`);
      return null;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

console.log('═'.repeat(70));
console.log(`📤 Batch Upload - ${contracts.length} contracts`);
console.log('═'.repeat(70));
console.log();

let uploaded = 0;
for (let i = 0; i < contracts.length; i++) {
  const filename = contracts[i];
  const shortName = filename.length > 50 ? filename.substring(0, 47) + '...' : filename;

  console.log(`[${i + 1}/${contracts.length}] ${shortName}`);

  const result = await uploadContract(filename);

  if (result) {
    const docId = result.document_id || result.id || 'unknown';
    const shortId = typeof docId === 'string' ? docId.substring(0, 8) : docId;
    console.log(`  ✅ Uploaded! ID: ${shortId}...`);
    uploaded++;
  }

  // Small delay between uploads
  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log();
console.log('═'.repeat(70));
console.log(`✅ Upload complete: ${uploaded}/${contracts.length} successful`);
console.log('═'.repeat(70));
