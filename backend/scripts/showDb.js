const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const ChatSession = require('../models/ChatSession');
const Newsletter  = require('../models/Newsletter');

const COLORS = {
  reset:  '\x1b[0m',
  bright: '\x1b[1m',
  cyan:   '\x1b[36m',
  yellow: '\x1b[33m',
  green:  '\x1b[32m',
  blue:   '\x1b[34m',
  magenta:'\x1b[35m',
  red:    '\x1b[31m',
  white:  '\x1b[37m',
};

const c = COLORS;

async function showDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tourism-ai');
    console.log(`\n${c.green}${c.bright}✅  Connected to MongoDB${c.reset}`);

    const db = mongoose.connection.db;

    // ── Database Info ──────────────────────────────────────────
    const adminDb = db.admin();
    const serverInfo = await adminDb.serverInfo();
    const dbStats   = await db.stats();

    console.log(`\n${c.cyan}${c.bright}╔══════════════════════════════════════════════╗`);
    console.log(`║          DATABASE OVERVIEW                   ║`);
    console.log(`╚══════════════════════════════════════════════╝${c.reset}`);
    console.log(`  ${c.yellow}Database Name  :${c.reset} ${db.databaseName}`);
    console.log(`  ${c.yellow}MongoDB Version:${c.reset} ${serverInfo.version}`);
    console.log(`  ${c.yellow}Storage Size   :${c.reset} ${(dbStats.storageSize / 1024).toFixed(2)} KB`);
    console.log(`  ${c.yellow}Data Size      :${c.reset} ${(dbStats.dataSize / 1024).toFixed(2)} KB`);
    console.log(`  ${c.yellow}Collections    :${c.reset} ${dbStats.collections}`);
    console.log(`  ${c.yellow}Total Indexes  :${c.reset} ${dbStats.indexes}`);

    // ── Collections List ────────────────────────────────────────
    const collections = await db.listCollections().toArray();
    console.log(`\n${c.cyan}${c.bright}╔══════════════════════════════════════════════╗`);
    console.log(`║          COLLECTIONS (${collections.length} found)                 ║`);
    console.log(`╚══════════════════════════════════════════════╝${c.reset}`);
    for (const col of collections) {
      const colStats = await db.collection(col.name).countDocuments();
      console.log(`  ${c.magenta}▸ ${col.name}${c.reset}  →  ${c.green}${colStats} document(s)${c.reset}`);
    }

    // ── Newsletter Subscriptions ────────────────────────────────
    const newsletters = await Newsletter.find().sort({ subscribedAt: -1 });
    console.log(`\n${c.blue}${c.bright}╔══════════════════════════════════════════════╗`);
    console.log(`║  📧  NEWSLETTER SUBSCRIPTIONS (${newsletters.length})             ║`);
    console.log(`╚══════════════════════════════════════════════╝${c.reset}`);
    if (newsletters.length === 0) {
      console.log(`  ${c.white}  No subscribers yet.${c.reset}`);
    } else {
      newsletters.forEach((sub, i) => {
        console.log(`  ${c.yellow}${i + 1}.${c.reset} ${sub.email.padEnd(35)} ${c.white}subscribed: ${new Date(sub.subscribedAt).toLocaleString()}${c.reset}`);
      });
    }

    // ── Chat Sessions ───────────────────────────────────────────
    const sessions = await ChatSession.find().sort({ updatedAt: -1 });
    console.log(`\n${c.magenta}${c.bright}╔══════════════════════════════════════════════╗`);
    console.log(`║  💬  CHAT SESSIONS (${sessions.length})                          ║`);
    console.log(`╚══════════════════════════════════════════════╝${c.reset}`);

    if (sessions.length === 0) {
      console.log(`  ${c.white}  No chat sessions yet.${c.reset}`);
    } else {
      sessions.forEach((session, i) => {
        const msgCount = session.messages.length;
        const userMsgs = session.messages.filter(m => m.role === 'user').length;
        const aiMsgs   = session.messages.filter(m => m.role === 'assistant').length;

        console.log(`\n  ${c.cyan}${c.bright}Session ${i + 1}${c.reset}`);
        console.log(`  ${c.yellow}  ID         :${c.reset} ${session.sessionId}`);
        console.log(`  ${c.yellow}  Created    :${c.reset} ${new Date(session.createdAt).toLocaleString()}`);
        console.log(`  ${c.yellow}  Updated    :${c.reset} ${new Date(session.updatedAt).toLocaleString()}`);
        console.log(`  ${c.yellow}  Messages   :${c.reset} ${msgCount} total  (${c.green}${userMsgs} user${c.reset} / ${c.blue}${aiMsgs} AI${c.reset})`);

        if (msgCount > 0) {
          console.log(`  ${c.white}  ── Message Preview ──────────────────────────${c.reset}`);
          session.messages.slice(0, 4).forEach((msg, j) => {
            const role   = msg.role === 'user' ? `${c.green}👤 User     ` : `${c.blue}🤖 Assistant`;
            const preview = msg.content.length > 80
              ? msg.content.slice(0, 80) + '...'
              : msg.content;
            console.log(`  ${role}${c.reset}: ${preview}`);
          });
          if (msgCount > 4) {
            console.log(`  ${c.white}  ... and ${msgCount - 4} more messages${c.reset}`);
          }
        }
      });
    }

    // ── Raw Schema Info ─────────────────────────────────────────
    console.log(`\n${c.green}${c.bright}╔══════════════════════════════════════════════╗`);
    console.log(`║  🗂️   SCHEMA DEFINITIONS                       ║`);
    console.log(`╚══════════════════════════════════════════════╝${c.reset}`);

    console.log(`\n  ${c.cyan}${c.bright}Newsletter Schema${c.reset}`);
    console.log(`  ${c.yellow}  email        ${c.reset}: String, required, unique, lowercase`);
    console.log(`  ${c.yellow}  subscribedAt ${c.reset}: Date (default: now)`);

    console.log(`\n  ${c.cyan}${c.bright}ChatSession Schema${c.reset}`);
    console.log(`  ${c.yellow}  sessionId    ${c.reset}: String, required, unique`);
    console.log(`  ${c.yellow}  messages[]   ${c.reset}: [{ role: user|assistant, content, sources[], timestamp }]`);
    console.log(`  ${c.yellow}  createdAt    ${c.reset}: Date`);
    console.log(`  ${c.yellow}  updatedAt    ${c.reset}: Date`);

    console.log(`\n${c.green}${c.bright}══════════════════════════════════════════════${c.reset}\n`);
  } catch (err) {
    console.error(`${c.red}❌ Error:${c.reset}`, err.message);
  } finally {
    await mongoose.disconnect();
    console.log(`${c.white}🔌 Disconnected from MongoDB${c.reset}\n`);
  }
}

showDatabase();
