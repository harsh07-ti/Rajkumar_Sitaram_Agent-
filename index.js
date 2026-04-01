const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const admin = require('firebase-admin');
const fs = require('fs');

// 🔐 Firebase init
const serviceAccount = JSON.parse(process.env.FIREBASE_URL);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: serviceAccount.databaseURL
});

const db = admin.database();

// 🤖 WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox']
  }
});

let userState = {};

// QR
client.on('qr', qr => qrcode.generate(qr, { small: true }));

client.on('ready', () => {
  console.log("✅ Firebase Bot Ready");
});

// 📩 Message System
client.on('message', async msg => {

  const mobile = msg.from.replace('@c.us','');
  const text = msg.body.toLowerCase();

  // START
  if (text === 'hi' || text === 'hello') {
    userState[mobile] = { step: "name" };
    return msg.reply("📚 Rajkumar Sitaram School\n\nअपना नाम बताइए");
  }

  // NAME
  if (userState[mobile]?.step === "name") {
    userState[mobile].name = msg.body;
    userState[mobile].step = "class";
    return msg.reply("अपनी कक्षा बताइए");
  }

  // CLASS
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

  // MENU
  if (userState[mobile]?.step === "menu") {

    const studentRef = db.ref("students/" + mobile);
    const snapshot = await studentRef.get();
    const s = snapshot.val();

    if (!s) {
      return msg.reply("❌ आपका डेटा नहीं मिला");
    }

    let due = s.total_fees - s.paid_fees;

    if (text === '1') {
      msg.reply(`💰 Fees

Total: ₹${s.total_fees}
Paid: ₹${s.paid_fees}
Due: ₹${due}`);
    }

    else if (text === '2') {
      msg.reply(`📊 Attendance: ${s.attendance}%`);
    }

    else if (text === '3') {
      msg.reply(`📄 Result: ${s.result}`);
    }

    else if (text === '4') {
      msg.reply(`💳 Payment

UPI ID: school@upi

📸 Screenshot भेजें`);
    }

    else if (text === '6') {
      msg.reply("📢 Notice: कल अवकाश रहेगा");
    }

    else if (text === '7') {
      userState[mobile].step = "admission";
      msg.reply("नाम, कक्षा, मोबाइल भेजें\nExample: Rahul,10,9876543210");
    }
  }

  // ADMISSION
  if (userState[mobile]?.step === "admission") {
    let p = msg.body.split(',');

    if (p.length === 3) {
      const id = Date.now();

      await db.ref("admissions/" + id).set({
        name: p[0],
        class: p[1],
        mobile: p[2]
      });

      msg.reply("✅ Admission request save");
      userState[mobile].step = "menu";
    }
  }

  // 📸 Screenshot Upload
  if (msg.hasMedia) {
    const media = await msg.downloadMedia();
    const fileName = `uploads/${Date.now()}.png`;

    fs.writeFileSync(fileName, media.data, 'base64');

    await db.ref("payments/" + Date.now()).set({
      mobile: mobile,
      image: fileName,
      status: "pending"
    });

    msg.reply("✅ Screenshot मिला, verify होगा");
  }
});

client.initialize();            );
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
