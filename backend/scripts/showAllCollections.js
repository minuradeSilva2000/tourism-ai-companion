const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function showAll() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tourism-ai');
  const db = mongoose.connection.db;

  console.log('\n\x1b[1m\x1b[36m╔══════════════════════════════════════════════════════╗');
  console.log('║     🗄️  tourism-ai  DATABASE — FULL SNAPSHOT          ║');
  console.log('╚══════════════════════════════════════════════════════╝\x1b[0m');

  const collections = await db.listCollections().toArray();

  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    const docs  = await db.collection(col.name).find().limit(10).toArray();

    console.log(`\n\x1b[1m\x1b[33m┌─ 📁  ${col.name.toUpperCase()}  (${count} document${count !== 1 ? 's' : ''})\x1b[0m`);

    if (count === 0) {
      console.log('\x1b[90m│   (empty collection)\x1b[0m');
    } else {
      docs.forEach((doc, i) => {
        console.log(`\x1b[36m│  [${i + 1}]\x1b[0m`, JSON.stringify(doc, null, 2)
          .split('\n')
          .map((line, idx) => idx === 0 ? line : '│      ' + line)
          .join('\n'));
      });
      if (count > 10) {
        console.log(`\x1b[90m│   ... and ${count - 10} more documents\x1b[0m`);
      }
    }
    console.log('\x1b[33m└────────────────────────────────────────────────────\x1b[0m');
  }

  console.log('\n\x1b[32m✅  Done.\x1b[0m\n');
  await mongoose.disconnect();
}

showAll().catch(console.error);
