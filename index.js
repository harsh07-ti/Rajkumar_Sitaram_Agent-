const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mysql = require('mysql2');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "school"
});

let userState = {};

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log("✅ Rajkumar Sitaram Agent Bot Ready");
});

client.on('message', async msg => {

    const mobile = msg.from.replace('@c.us','');
    const text = msg.body.toLowerCase();

    // Start Flow
    if (text === 'hi' || text === 'hello') {
        userState[mobile] = { step: "name" };
        return msg.reply("📚 Rajkumar Sitaram School\n\nअपना नाम बताइए");
    }

    // Name
    if (userState[mobile]?.step === "name") {
        userState[mobile].name = msg.body;
        userState[mobile].step = "class";
        return msg.reply("अपनी कक्षा बताइए");
    }

    // Class
    if (userState[mobile]?.step === "class") {
        userState[mobile].class = msg.body;
        userState[mobile].step = "menu";

        return msg.reply(`धन्यवाद ${userState[mobile].name}

1️⃣ Fees
2️⃣ Attendance
3️⃣ Result
4️⃣ Payment
5️⃣ Receipt
6️⃣ Notice
7️⃣ Admission

नंबर भेजें`);
    }

    // Menu System
    if (userState[mobile]?.step === "menu") {

        if (text === '1') {
            db.query("SELECT * FROM students WHERE mobile=?", [mobile], (err, r) => {
                if (r.length > 0) {
                    let s = r[0];
                    let due = s.total_fees - s.paid_fees;

                    msg.reply(`💰 Fees

Total: ₹${s.total_fees}
Paid: ₹${s.paid_fees}
Due: ₹${due}`);
                }
            });
        }

        else if (text === '2') {
            db.query("SELECT * FROM students WHERE mobile=?", [mobile], (err, r) => {
                if (r.length > 0) {
                    msg.reply(`📊 Attendance: ${r[0].attendance}%`);
                }
            });
        }

        else if (text === '3') {
            db.query("SELECT * FROM students WHERE mobile=?", [mobile], (err, r) => {
                if (r.length > 0) {
                    msg.reply(`📄 Result: ${r[0].result}`);
                }
            });
        }

        else if (text === '4') {
            msg.reply(`💳 Payment

UPI ID: school@upi

📸 Screenshot भेजें`);
        }

        else if (text === '5') {
            msg.reply("📄 Receipt जल्द भेजी जाएगी");
        }

        else if (text === '6') {
            msg.reply("📢 Notice: कल अवकाश रहेगा");
        }

        else if (text === '7') {
            userState[mobile].step = "admission";
            msg.reply("नाम, कक्षा, मोबाइल भेजें\nExample: Rahul,10,9876543210");
        }
    }

    // Admission
    if (userState[mobile]?.step === "admission") {
        let p = msg.body.split(',');
        if (p.length === 3) {
            db.query(
                "INSERT INTO admissions (name,class,mobile) VALUES (?,?,?)",
                [p[0], p[1], p[2]]
            );
            msg.reply("✅ Admission request save");
            userState[mobile].step = "menu";
        }
    }

    // Screenshot Upload
    if (msg.hasMedia) {
        const media = await msg.downloadMedia();
        const file = `uploads/${Date.now()}.png`;

        fs.writeFileSync(file, media.data, 'base64');

        db.query("INSERT INTO payments (mobile,image) VALUES (?,?)", [mobile, file]);

        msg.reply("✅ Screenshot मिला, verify होगा");
    }
});

client.initialize();
