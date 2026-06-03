const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const OFFLINE = process.argv.includes('--offline');
const MINIMAL = process.argv.includes('--minimal') || (!process.argv.includes('--quick') && !process.argv.includes('--full'));
const QUICK = process.argv.includes('--quick');
const FULL = process.argv.includes('--full');

const MODEL_CANDIDATES = (
  process.env.GEMINI_MODEL ||
  'gemini-2.5-flash-lite,gemini-2.5-flash,gemini-3.5-flash'
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

if (process.env.GEMINI_SKIP_TLS_VERIFY === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const WHITE = '\x1b[37m';
const GRAY = '\x1b[90m';

let activeModel = MODEL_CANDIDATES[0];
let dailyQuotaExhausted = false;

function pass(msg) {
  console.log(`  ${GREEN}${BOLD}✅  PASS${RESET}  ${msg}`);
}
function fail(msg) {
  console.log(`  ${RED}${BOLD}❌  FAIL${RESET}  ${msg}`);
}
function skip(msg) {
  console.log(`  ${YELLOW}${BOLD}⏭️  SKIP${RESET}  ${msg}`);
}
function info(msg) {
  console.log(`  ${CYAN}ℹ️   ${RESET}${msg}`);
}
function warn(msg) {
  console.log(`  ${YELLOW}⚠️   ${RESET}${msg}`);
}
function sep() {
  console.log(`  ${GRAY}${'─'.repeat(55)}${RESET}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errMessage(err) {
  return String(err?.message || err).split('\n')[0];
}

function isQuotaError(err) {
  const msg = String(err?.message || err);
  return msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('quota');
}

function isDailyQuotaError(err) {
  const msg = String(err?.message || err);
  return msg.includes('PerDay') || msg.includes('PerDayPerProject');
}

function isMinuteQuotaError(err) {
  const msg = String(err?.message || err);
  return isQuotaError(err) && !isDailyQuotaError(err);
}

function parseRetrySeconds(err) {
  const msg = String(err?.message || err);
  const match = msg.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (match) return Math.min(Math.ceil(Number(match[1])) + 1, 15);
  const delayMatch = msg.match(/"retryDelay":"(\d+)s"/);
  if (delayMatch) return Math.min(Number(delayMatch[1]) + 1, 15);
  return 15;
}

function modeLabel() {
  if (OFFLINE) return 'offline (0 API calls)';
  if (MINIMAL) return 'minimal (1 API call)';
  if (QUICK) return 'quick (2 API calls)';
  if (FULL) return 'full (4+ API calls)';
  return 'minimal';
}

async function withRetry(label, fn) {
  try {
    return await fn();
  } catch (err) {
    if (isDailyQuotaError(err)) {
      dailyQuotaExhausted = true;
      throw err;
    }
    if (isMinuteQuotaError(err)) {
      const waitSec = parseRetrySeconds(err);
      warn(`${label}: per-minute limit — waiting ${waitSec}s, one retry...`);
      await sleep(waitSec * 1000);
      return await fn();
    }
    throw err;
  }
}

async function tryModels(genAI, fn) {
  let lastError;
  for (const modelName of MODEL_CANDIDATES) {
    activeModel = modelName;
    try {
      return await fn(genAI.getGenerativeModel({ model: modelName }), modelName);
    } catch (err) {
      lastError = err;
      if (isDailyQuotaError(err)) {
        warn(`${modelName}: daily quota used up for today`);
        continue;
      }
      throw err;
    }
  }
  dailyQuotaExhausted = true;
  throw lastError || new Error('All models exhausted daily quota');
}

async function runTests() {
  console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗`);
  console.log(`║        🔑  GEMINI API KEY — TEST SUITE                ║`);
  console.log(`╚══════════════════════════════════════════════════════╝${RESET}\n`);

  info(`Mode: ${modeLabel()}`);
  info(`Models: ${MODEL_CANDIDATES.join(' → ')}`);
  info('Flags: --offline | --minimal (default) | --quick | --full');
  console.log('');

  const apiKey = process.env.GEMINI_API_KEY;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let quotaFailures = 0;

  const recordFail = (err) => {
    if (isQuotaError(err)) quotaFailures++;
    failed++;
  };

  console.log(`${BOLD}TEST 1: API Key Exists in .env${RESET}`);
  if (!apiKey || apiKey.trim() === '') {
    fail('GEMINI_API_KEY is missing or empty in .env');
    failed++;
    printSummary(passed, failed, skipped, quotaFailures);
    return;
  }
  pass(`Key found — ${YELLOW}${apiKey.slice(0, 8)}...${apiKey.slice(-4)}${RESET}  (length: ${apiKey.length})`);
  passed++;
  sep();

  console.log(`${BOLD}TEST 2: API Key Format Check${RESET}`);
  if (apiKey.startsWith('AIzaSy') || apiKey.startsWith('AQ.')) {
    pass('Key uses a valid Google Studio structure ("AIzaSy" or "AQ.") ✓');
    passed++;
  } else {
    fail(`Key format unrecognised. Got: "${apiKey.slice(0, 10)}..."`);
    warn('Get a free key from: https://aistudio.google.com/apikey');
    failed++;
  }
  sep();

  console.log(`${BOLD}TEST 3: Gemini SDK Initialisation${RESET}`);
  let genAI;
  try {
    // @ts-ignore
    genAI = new GoogleGenerativeAI(apiKey, { apiOptions: { timeout: 30000 } });
    pass('GoogleGenerativeAI client created successfully');
    passed++;
  } catch (e) {
    fail(`SDK init failed: ${e.message}`);
    failed++;
    printSummary(passed, failed, skipped, quotaFailures);
    return;
  }
  sep();

  if (OFFLINE) {
    console.log(`${BOLD}TEST 4–7: Live API tests${RESET}`);
    skip('Skipped (--offline). Key format and SDK look fine.');
    skipped += 4;
    sep();
    printSummary(passed, failed, skipped, quotaFailures);
    return;
  }

  console.log(`${BOLD}TEST 4: Text Generation (live API)${RESET}`);
  try {
    const prompt =
      'Reply with exactly one sentence: "Gemini API is working correctly." Then add one sentence about the best time to visit Bali.';
    info(`Using 1 API call (model: ${MODEL_CANDIDATES.join(' or ')})`);

    const { text, modelName } = await tryModels(genAI, async (model, name) => {
      const result = await withRetry('generate', () => model.generateContent(prompt));
      return { text: result.response.text(), modelName: name };
    });

    activeModel = modelName;
    pass(`Response received from ${modelName}`);
    console.log(`\n  ${YELLOW}Response:${RESET} ${WHITE}${text.trim()}${RESET}\n`);
    passed++;
  } catch (e) {
    if (isDailyQuotaError(e)) dailyQuotaExhausted = true;
    fail(`Generation failed: ${errMessage(e)}`);
    recordFail(e);
  }
  sep();

  if (dailyQuotaExhausted) {
    warn('Daily quota exhausted — skipping remaining live API tests.');
    for (const [num, name] of [
      [5, 'Travel Domain Response'],
      [6, 'SSE Streaming'],
      [7, 'Multi-turn Chat'],
    ]) {
      console.log(`${BOLD}TEST ${num}: ${name}${RESET}`);
      skip('Daily free-tier limit reached (resets ~24h per model).');
      skipped++;
      sep();
    }
    printSummary(passed, failed, skipped, quotaFailures);
    return;
  }

  if (FULL) {
    console.log(`${BOLD}TEST 5: Travel Domain Response (--full)${RESET}`);
    try {
      const { text } = await tryModels(genAI, async (model) => {
        const result = await withRetry('travel', () =>
          model.generateContent('In 2 sentences, what is the best time to visit Bali, Indonesia?')
        );
        return { text: result.response.text() };
      });
      pass('Travel response received!');
      console.log(`\n  ${YELLOW}Response:${RESET} ${WHITE}${text.trim()}${RESET}\n`);
      passed++;
    } catch (e) {
      fail(`Travel prompt failed: ${errMessage(e)}`);
      recordFail(e);
    }
    sep();
    if (dailyQuotaExhausted) {
      printSummary(passed, failed, skipped, quotaFailures);
      return;
    }
  } else {
    console.log(`${BOLD}TEST 5: Travel Domain Response${RESET}`);
    skip('Covered by TEST 4. Use --full for a separate travel call.');
    skipped++;
    sep();
  }

  const runStreaming = QUICK || FULL;
  const runChat = FULL;

  console.log(`${BOLD}TEST 6: SSE Streaming${RESET}`);
  if (!runStreaming) {
    skip('Use --quick (2 calls) or --full when you have quota to spare.');
    skipped++;
  } else if (dailyQuotaExhausted) {
    skip('Daily quota exhausted.');
    skipped++;
  } else {
    try {
      await tryModels(genAI, async (model) => {
        const result = await withRetry('stream', () =>
          model.generateContentStream('Say "Streaming works!" in one sentence.')
        );
        let chunks = 0;
        process.stdout.write(`  ${YELLOW}Streaming:${RESET} `);
        for await (const chunk of result.stream) {
          process.stdout.write(WHITE + chunk.text() + RESET);
          chunks++;
        }
        console.log('');
        pass(`Streaming complete — ${chunks} chunk(s)`);
        return {};
      });
      passed++;
    } catch (e) {
      fail(`Streaming failed: ${errMessage(e)}`);
      recordFail(e);
    }
  }
  sep();

  console.log(`${BOLD}TEST 7: Multi-turn Chat${RESET}`);
  if (!runChat) {
    skip('Use --full when you have quota to spare.');
    skipped++;
  } else if (dailyQuotaExhausted) {
    skip('Daily quota exhausted.');
    skipped++;
  } else {
    try {
      await tryModels(genAI, async (model) => {
        const chat = model.startChat({
          history: [
            { role: 'user', parts: [{ text: 'I want to visit Japan.' }] },
            {
              role: 'model',
              parts: [{ text: 'Great choice! Japan is a beautiful destination.' }],
            },
          ],
        });
        const result = await withRetry('chat', () =>
          chat.sendMessage('What is the best season to go? Reply in 2 sentences.')
        );
        const text = result.response.text();
        pass('Multi-turn chat works!');
        console.log(`\n  ${YELLOW}Response:${RESET} ${WHITE}${text.trim().slice(0, 160)}${RESET}\n`);
        return {};
      });
      passed++;
    } catch (e) {
      fail(`Multi-turn chat failed: ${errMessage(e)}`);
      recordFail(e);
    }
  }
  sep();

  printSummary(passed, failed, skipped, quotaFailures);
}

function printSummary(passed, failed, skipped, quotaFailures) {
  const total = passed + failed + skipped;
  console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗`);
  console.log(`║                   TEST RESULTS                       ║`);
  console.log(`╚══════════════════════════════════════════════════════╝${RESET}`);
  console.log(`  ${GREEN}Passed  : ${passed}${RESET}`);
  console.log(`  ${RED}Failed  : ${failed}${RESET}`);
  console.log(`  ${YELLOW}Skipped : ${skipped}${RESET}`);
  if (activeModel && !OFFLINE) console.log(`  ${CYAN}Model   : ${activeModel}${RESET}`);
  console.log('');

  if (failed === 0 && quotaFailures === 0) {
    console.log(`  ${GREEN}${BOLD}🎉  All runnable tests passed.${RESET}`);
    if (skipped > 0) {
      console.log(`  ${YELLOW}    Run with --quick or --full when quota is available.${RESET}`);
    }
    if (activeModel && activeModel !== process.env.GEMINI_MODEL?.split(',')[0]) {
      console.log(`  ${YELLOW}    Update .env: GEMINI_MODEL=${activeModel}${RESET}`);
    }
  } else if (quotaFailures > 0 || dailyQuotaExhausted) {
    if (passed >= 3 && failed <= 1) {
      console.log(`  ${GREEN}${BOLD}✓  Key & SDK OK — only daily API quota is exhausted.${RESET}`);
    } else {
      console.log(`  ${RED}${BOLD}🚨  API QUOTA LIMIT (your key is fine).${RESET}`);
    }
    console.log(`  ${YELLOW}    Free tier: ~20 requests/day per model.${RESET}`);
    console.log(`  ${YELLOW}    Options:${RESET}`);
    console.log(`  ${YELLOW}      • Wait until tomorrow (quota resets daily)${RESET}`);
    console.log(`  ${YELLOW}      • node scripts/testGemini.js --offline${RESET}`);
    console.log(`  ${YELLOW}      • Try another model in .env:${RESET}`);
    console.log(`  ${YELLOW}        GEMINI_MODEL=gemini-2.5-flash-lite,gemini-2.5-flash,gemini-3.5-flash${RESET}`);
    console.log(`  ${YELLOW}      • New key: https://aistudio.google.com/apikey${RESET}`);
    console.log(`  ${YELLOW}      • Enable billing: https://aistudio.google.com/apikey${RESET}`);
  } else {
    console.log(`  ${RED}${BOLD}🚨  SOME TESTS FAILED.${RESET}`);
  }
  console.log('');
}

runTests()
  .then(() => {
    if (dailyQuotaExhausted && !OFFLINE) process.exit(2);
  })
  .catch((err) => {
    console.error(`\n${RED}${BOLD}Fatal error:${RESET}`, err.message);
    process.exit(1);
  });
