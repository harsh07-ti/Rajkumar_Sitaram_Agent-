// ===============================
// 🚀 RAJKUMAR SITARAM BOT SERVER
// ===============================

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const pino = require("pino");

const { default: makeWASocket, useMultiFileAuthState } = require("@adiwajshing/baileys");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Firebase Config (serviceAccountKey.json add karo)
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://education-2d496-default-rtdb.firebaseio.com"
});

const db = admin.database();

// ===============================
// 🤖 WHATSAPP BOT START
// ===============================
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const text = msg.message.conversation || "";
    const sender = msg.key.remoteJid.replace("@s.whatsapp.net", "");

    console.log("Message:", text);

    // 🔹 MENU
    if (text.toLowerCase() === "hi") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "📚 Rajkumar Sitaram School\n\n1️⃣ Admission\n2️⃣ Attendance\n3️⃣ Result\n4️⃣ Fee\n5️⃣ Payment"
      });
    }

    // 🔹 ADMISSION
    if (text === "1") {
      const snap = await db.ref("students/" + sender).once("value");
      const data = snap.val();

      if (data) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `👤 Name: ${data.name}\nClass: ${data.class}\nMobile: ${data.mobile}`
        });
      } else {
        await sock.sendMessage(msg.key.remoteJid, {
          text: "❌ No Admission Data Found"
        });
      }
    }

    // 🔹 ATTENDANCE
    if (text === "2") {
      const snap = await db.ref("attendance/" + sender).once("value");
      const data = snap.val();

      let msgText = "📅 Attendance:\n";
      for (let date in data) {
        msgText += `${date} - ${data[date]}\n`;
      }

      await sock.sendMessage(msg.key.remoteJid, { text: msgText });
    }

    // 🔹 RESULT
    if (text === "3") {
      const snap = await db.ref("results/" + sender).once("value");
      const data = snap.val();

      await sock.sendMessage(msg.key.remoteJid, {
        text: `📊 Total: ${data.total}\nPercentage: ${data.percentage}%`
      });
    }

    // 🔹 FEE
    if (text === "4") {
      const snap = await db.ref("fees/" + sender).once("value");
      const data = snap.val();

      await sock.sendMessage(msg.key.remoteJid, {
        text: `💰 Fee: ${data.monthlyFee}\nPaid: ${data.paid}\nDue: ${data.due}`
      });
    }

    // 🔹 PAYMENT
    if (text === "5") {
      const snap = await db.ref("payments").once("value");
      const payments = snap.val();

      let msgText = "💳 Payments:\n";

      for (let key in payments) {
        if (payments[key].studentId === sender) {
          msgText += `₹${payments[key].amount} (${payments[key].method})\n`;
        }
      }

      await sock.sendMessage(msg.key.remoteJid, { text: msgText });
    }
  });
}

startBot();

// ===============================
// 🌐 API (OPTIONAL)
// ===============================
app.get("/", (req, res) => {
  res.send("✅ Bot Running...");
});

const PORT = 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));      }

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
