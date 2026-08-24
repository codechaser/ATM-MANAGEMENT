import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./Database.js";
import { ObjectId } from "mongodb";

dotenv.config();

const app = express();
const port = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());

let db;

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "atm-management-backend" });
});

// Initialize database connection
connectDB().then((database) => {
  db = database;
  app.listen(port, () => console.log(`App listening on port ${port}!`));
}).catch((err) => {
  console.error("Failed to connect to database:", err);
  process.exit(1);
});

// routes

app.get("/api/selectuser/:accno", async (req, res) => {
  try {
    const accno = parseInt(req.params.accno);
    const card = await db.collection("card").findOne({ accno });
    
    if (card) {
      res.json([card]); // Return as array to maintain compatibility
    } else {
      res.status(404).json([]);
    }
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.post("/api/create-account", async (req, res) => {
  try {
    const { accno, name, pin, balance = 0 } = req.body;
    const accountNumber = Number(accno);
    const openingBalance = Number(balance);

    if (!Number.isInteger(accountNumber) || accountNumber <= 0 || !name || !/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({ error: "Enter a valid account number, name, and 4-digit PIN" });
    }

    if (!Number.isFinite(openingBalance) || openingBalance < 0) {
      return res.status(400).json({ error: "Opening balance must be zero or more" });
    }

    // Check if account already exists
    const existingUser = await db.collection("user").findOne({ accno: accountNumber });
    if (existingUser) {
      return res.status(409).json({ error: "Account number already exists" });
    }

    // Create user
    await db.collection("user").insertOne({
      accno: accountNumber,
      name: name.trim()
    });

    // Create card
    await db.collection("card").insertOne({
      cardno: accountNumber,
      accno: accountNumber,
      acctype: "Savings",
      name_card: name.trim(),
      pin: String(pin),
      bankname: "KCT Bankers",
      expiredate: "2030-12-31",
      cvv: 0,
      balance: openingBalance
    });

    res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ error: "Unable to create account" });
  }
});

app.post("/api/withdraw/:accno", async (req, res) => {
  try {
    const accno = parseInt(req.params.accno);
    const amt = parseFloat(req.body.amt);

    const card = await db.collection("card").findOne({ accno });

    if (!card) {
      return res.status(404).json({ error: "Account not found" });
    }

    if (card.balance < amt) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Update balance
    await db.collection("card").updateOne(
      { accno },
      { $inc: { balance: -amt } }
    );

    // Add transaction record
    const now = new Date();
    await db.collection("transaction").insertOne({
      cardno: card.cardno,
      transtype: "withdraw",
      amt: amt,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0]
    });

    console.log("Withdrawal successful");
    res.status(200).json({ message: "Withdrawal successful" });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.post("/api/deposit/:accno", async (req, res) => {
  try {
    const accno = parseInt(req.params.accno);
    const amount = parseFloat(req.body.amount);

    if (amount <= 0) {
      return res.status(400).json({ error: "Enter the amount" });
    }

    const card = await db.collection("card").findOne({ accno });

    if (!card) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Update balance
    await db.collection("card").updateOne(
      { accno },
      { $inc: { balance: amount } }
    );

    // Add transaction record
    const now = new Date();
    await db.collection("transaction").insertOne({
      cardno: card.cardno,
      transtype: "deposit",
      amt: amount,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0]
    });

    console.log("Deposit successful");
    res.status(200).json({ message: "Deposit successful" });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/api/transaction/:accno", async (req, res) => {
  try {
    const accno = parseInt(req.params.accno);

    const card = await db.collection("card").findOne({ accno });
    
    if (!card) {
      return res.status(404).json([]);
    }

    const transactions = await db.collection("transaction")
      .find({ cardno: card.cardno })
      .sort({ date: -1, time: -1 })
      .limit(10)
      .toArray();

    res.json(transactions);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
