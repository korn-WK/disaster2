const mongoose = require('mongoose');
const DisasterReport = require('../models/DisasterReport');
const { upsertDisasterReportsToVectorStore } = require('../services/vectorStoreService');

async function main() {
  await mongoose.connect('mongodb+srv://Disaster:Disaster%40cits@disaster.fp2zibi.mongodb.net/');
  const allReports = await DisasterReport.find({});
  await upsertDisasterReportsToVectorStore(allReports);
  console.log('Embedding complete');
  process.exit(0);
}
main();
