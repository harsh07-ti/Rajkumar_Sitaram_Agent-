// ===============================
// 🚀 SCHOOL BOT + BACKEND
// ===============================

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const P = require("pino");

// WhatsApp Baileys
const {
  default: makeWASocket,
  useMultiFileAuthState
} = require("@adiwajshing/baileys");

// ===============================
// 🔥 FIREBASE CONFIG
// ===============================
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://education-2d496-default-rtdb.firebaseio.com"
});

const db = admin.database();

// ===============================
// 🌐 EXPRESS SERVER
// ===============================
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});

// ===============================
// 🤖 WHATSAPP BOT START
// ===============================
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const sender = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    const phone = sender.split("@")[0];

    // ===============================
    // MENU
    // ===============================
    if (text === "hi" || text === "Hi") {
      await sock.sendMessage(sender, {
        text:
          "👋 Welcome to School Bot\n\n" +
          "1️⃣ Admission\n" +
          "2️⃣ Attendance\n" +
          "3️⃣ Result\n" +
          "4️⃣ Fee\n" +
          "5️⃣ Payment"
      });
    }

    // ===============================
    // ADMISSION
    // ===============================
    if (text === "1") {
      const snap = await db.ref("students/" + phone).once("value");
      const data = snap.val();

      if (!data) {
        return sock.sendMessage(sender, { text: "No Admission Found ❌" });
      }

      await sock.sendMessage(sender, {
        text: `👨‍🎓 Name: ${data.name}\nClass: ${data.class}`
      });
    }

    // ===============================
    // ATTENDANCE
    // ===============================
    if (text === "2") {
      const snap = await db.ref("attendance/" + phone).once("value");
      const data = snap.val();

      if (!data) return sock.sendMessage(sender, { text: "No Data ❌" });

      let msgText = "📅 Attendance:\n";
      for (let d in data) {
        msgText += `${d} - ${data[d]}\n`;
      }

      await sock.sendMessage(sender, { text: msgText });
    }

    // ===============================
    // RESULT
    // ===============================
    if (text === "3") {
      const snap = await db.ref("results/" + phone).once("value");
      const data = snap.val();

      if (!data) return sock.sendMessage(sender, { text: "No Result ❌" });

      await sock.sendMessage(sender, {
        text: `📊 Result: ${data.percentage}%`
      });
    }

    // ===============================
    // FEE
    // ===============================
    if (text === "4") {
      const snap = await db.ref("fees/" + phone).once("value");
      const data = snap.val();

      if (!data) return sock.sendMessage(sender, { text: "No Fee Data ❌" });

      await sock.sendMessage(sender, {
        text: `💰 Fee:\nPaid: ₹${data.paid}\nDue: ₹${data.due}`
      });
    }

    // ===============================
    // PAYMENT
    // ===============================
    if (text === "5") {
      const snap = await db.ref("payments").once("value");

      let msgText = "💳 Payments:\n";
      snap.forEach(child => {
        const p = child.val();
        if (p.studentId === phone) {
          msgText += `₹${p.amount} (${p.method})\n`;
        }
      });

      await sock.sendMessage(sender, { text: msgText });
    }
  });
}

startBot();

// ===============================
// 🚀 SERVER START
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server Running on " + PORT));            await sock.sendMessage(sender, { text: "✅ Admission Submitted Successfully!" });
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
