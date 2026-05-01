import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import bodyParser from "body-parser";
import crypto from "crypto";
import fs from "fs";
import { firebaseConfig } from "./services/firebaseConfig";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase for server-side persistence
const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

// SAWERIA AUTH KEY
const SAWERIA_AUTH_KEY = "abd24630e29ccc02952e2060409815b6";
const LOG_FILE = path.join(process.cwd(), "webhook-log.txt");

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(bodyParser.json());

  // Memory store for recent donations
  let recentDonations: { name: string; amount: number; message: string; timestamp: number }[] = [];

  // Try to load historical donations from log to survive restarts partially
  if (fs.existsSync(LOG_FILE)) {
    try {
      const data = fs.readFileSync(LOG_FILE, "utf-8");
      const lines = data.split("\n").filter(l => l.trim());
      lines.forEach(line => {
        if (line.includes("DONATION_VALID:")) {
          const json = JSON.parse(line.split("DONATION_VALID:")[1]);
          recentDonations.push(json);
        }
      });
      recentDonations = recentDonations.slice(-10);
    } catch (e) {
      console.error("Failed to load logs");
    }
  }

  // API Routes
  app.get("/api/donations", (req, res) => {
    res.json(recentDonations.slice(-5).reverse());
  });

  app.post("/api/saweria-webhook", (req, res) => {
    const signature = req.headers["saweria-callback-signature"];
    
    // Log raw request for debugging
    const logEntry = `[${new Date().toISOString()}] REQ: ${JSON.stringify(req.body)}\nSIG: ${signature}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);

    // Saweria payload usually has data in "data" object or root
    const donation = req.body.data || req.body;
    
    // Fallback if structure is nested differently
    const donator_name = donation.donator_name || donation.donatorName || req.body.donator_name;
    const amount_raw = donation.amount_raw || donation.amountRaw || req.body.amount_raw;
    const message = donation.message || req.body.message || "";

    if (donator_name) {
      const newDonation = {
        name: String(donator_name),
        amount: Number(amount_raw) || 0,
        message: String(message),
        timestamp: Date.now(),
      };

      recentDonations.push(newDonation);
      fs.appendFileSync(LOG_FILE, `DONATION_VALID:${JSON.stringify(newDonation)}\n`);

      // Add to Firestore for persistence and real-time across all clients
      try {
        const donationCol = collection(firestore, 'saweria_donations');
        addDoc(donationCol, {
          ...newDonation,
          serverTimestamp: serverTimestamp()
        }).then(() => {
          console.log("Donation saved to Firestore");
        }).catch(err => {
          console.error("Error saving donation to Firestore:", err);
        });
      } catch (e) {
        console.error("Firestore initialization or operation failed:", e);
      }

      if (recentDonations.length > 10) {
        recentDonations.shift();
      }
      console.log(`Donation added: ${donator_name} - ${amount_raw}`);
    }

    res.status(200).send("OK");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
