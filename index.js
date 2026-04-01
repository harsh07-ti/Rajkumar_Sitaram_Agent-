const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mysql = require('mysql2');

// WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth()
});

// Database Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "school"
});

// QR Code Generate
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// Ready
client.on('ready', () => {
    console.log('✅ Rajkumar Sitaram School Bot Ready!');
});

// Message System
client.on('message', msg => {
    let text = msg.body.toLowerCase();

    if (text === 'hi' || text === 'hello') {
        msg.reply(`📚 Rajkumar Sitaram School में आपका स्वागत है

1️⃣ Fees जानकारी
2️⃣ Result
3️⃣ Notice
4️⃣ Student Details

Reply number भेजें`);
    }

    // Fees
    if (text === '1') {
        db.query("SELECT * FROM fees LIMIT 1", (err, result) => {
            if (!err && result.length > 0) {
                msg.reply(`💰 आपकी फीस: ₹${result[0].amount}`);
            }
        });
    }

    // Notice
    if (text === '3') {
        db.query("SELECT * FROM notice ORDER BY id DESC LIMIT 1", (err, result) => {
            if (!err && result.length > 0) {
                msg.reply(`📢 Notice:\n${result[0].message}`);
            }
        });
    }
});

// Start Bot
client.initialize();
