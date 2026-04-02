const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

const FIREBASE_URL = process.env.FIREBASE_URL;

// 🔥 UPI DETAILS
const UPI_ID = "tiwari3355931@nyes";
const QR_IMAGE = "https://i.ibb.co/pjX1S6Bk/Navi-QR-HARSHVARDHAN-TIWARI-02042026121324770.png"; // 👉 अपना QR image link डालना

const userStates = {};

async function startBot() {
    if (!FIREBASE_URL) {
        console.log("❌ FIREBASE_URL missing!");
        process.exit(1);
    }

    const { state, saveCreds } = await useMultiFileAuthState('session_data');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["School", "Bot", "1.0"]
    });

    // 🔗 CONNECTION
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.clear();
            console.log("📱 Scan QR Code:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') console.log('✅ School Bot Online!');
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) startBot();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // 💬 MESSAGE HANDLER
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase();

        const phone = sender.split("@")[0];

        console.log("📩", text);

        // ================= MENU =================
        if (text === "hi" || text === "menu") {
            await sock.sendMessage(sender, {
                text: `🎓 *Rajkumar Sitaram School Agent*

1️⃣ Admission
2️⃣ Attendance
3️⃣ Result
4️⃣ Fee
5️⃣ Payment

Reply with number`
            });
        }

        // ================= ADMISSION =================
        else if (text === "1" || text === "admission") {
            userStates[sender] = { step: "NAME" };
            await sock.sendMessage(sender, { text: "📝 Enter Student Name:" });
        }

        else if (userStates[sender]?.step === "NAME") {
            userStates[sender].name = text;
            userStates[sender].step = "CLASS";
            await sock.sendMessage(sender, { text: "Enter Class:" });
        }

        else if (userStates[sender]?.step === "CLASS") {
            userStates[sender].class = text;
            userStates[sender].step = "PHONE";
            await sock.sendMessage(sender, { text: "Enter Phone Number:" });
        }

        else if (userStates[sender]?.step === "PHONE") {
            const data = {
                name: userStates[sender].name,
                class: userStates[sender].class,
                phone: text
            };

            await fetch(`${FIREBASE_URL}/admissions.json`, {
                method: "POST",
                body: JSON.stringify(data)
            });

            await sock.sendMessage(sender, { text: "✅ Admission Submitted Successfully!" });
            delete userStates[sender];
        }

        // ================= ATTENDANCE =================
        else if (text === "2" || text === "attendance") {
            userStates[sender] = { step: "DATE" };
            await sock.sendMessage(sender, { text: "📅 Enter Date (DD-MM-YYYY):" });
        }

        else if (userStates[sender]?.step === "DATE") {
            userStates[sender].date = text;
            userStates[sender].step = "STATUS";
            await sock.sendMessage(sender, { text: "Present / Absent ?" });
        }

        else if (userStates[sender]?.step === "STATUS") {
            await fetch(`${FIREBASE_URL}/attendance/${phone}.json`, {
                method: "PATCH",
                body: JSON.stringify({
                    [userStates[sender].date]: text
                })
            });

            await sock.sendMessage(sender, { text: "✅ Attendance Saved!" });
            delete userStates[sender];
        }

        // ================= RESULT =================
        else if (text === "3" || text === "result") {
            const res = await fetch(`${FIREBASE_URL}/results/${phone}.json`);
            const data = await res.json();

            if (!data) {
                await sock.sendMessage(sender, { text: "❌ Result not found" });
                return;
            }

            await sock.sendMessage(sender, {
                text: `📊 Result

Name: ${data.name}
Class: ${data.class}
Marks: ${data.marks}
Status: ${data.status}`
            });
        }

        // ================= FEE =================
        else if (text === "4" || text === "fee") {
            const res = await fetch(`${FIREBASE_URL}/fees/${phone}.json`);
            const data = await res.json();

            if (!data) {
                await sock.sendMessage(sender, { text: "❌ Fee data not found" });
                return;
            }

            await sock.sendMessage(sender, {
                text: `💰 Fee Details

Amount: ₹${data.amount}
Status: ${data.status}`
            });
        }

        // ================= PAYMENT =================
        else if (text === "5" || text === "payment") {
            const res = await fetch(`${FIREBASE_URL}/fees/${phone}.json`);
            const data = await res.json();

            const amount = data?.amount || 0;

            await sock.sendMessage(sender, {
                image: { url: QR_IMAGE },
                caption: `💳 *Pay School Fee*

UPI ID: ${UPI_ID}
Amount: ₹${amount}

After payment, send screenshot.`
            });
        }

        // ================= DEFAULT =================
        else {
            await sock.sendMessage(sender, {
                text: "❓ Type *hi* to open menu"
            });
        }
    });
}

startBot().catch(err => console.log(err));
