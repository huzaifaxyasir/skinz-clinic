const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");
const nodemailer = require("nodemailer");
require('dotenv').config();

const app = express();

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files

// === DATABASE SETUP ===
const db = new sqlite3.Database("./db/skinz.db", (err) => {
  if (err) {
    console.error("❌ Failed to connect to DB:", err.message);
  } else {
    console.log("✅ Connected to SQLite database.");
  }
});

// Create tables if not exist
db.run(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    date TEXT,
    phone TEXT,
    status TEXT DEFAULT 'pending'
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT
  )
`);

// === EMAIL SETUP ===
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// === ROUTES ===

// Serve home.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "home.html"));
});

// API routes (unchanged)
app.post("/api/appointments", (req, res) => {
  const { name, email, date, phone } = req.body;
  const sql = `INSERT INTO appointments (name, email, date, phone, status) VALUES (?, ?, ?, ?, ?)`;

  db.run(sql, [name, email, date, phone, 'pending'], function (err) {
    if (err) return res.status(500).json({ message: err.message });

    const mailOptions = {
      from: '"Skinz Dermatology" <huzaifaxyasir@gmail.com>',
      to: 'huzaifaxyasir@gmail.com',
      subject: `New Appointment from ${name}`,
      html: `
        <h2>New Appointment Booking</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p>Status: <strong>Pending</strong></p>
        <p><a href="/admin-login.html" target="_blank">Go to Admin Dashboard to confirm</a></p>
      `
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) console.error("❌ Failed to send email:", err.message);
      else console.log("📧 Doctor notified:", info.response);
    });

    res.json({ success: true, id: this.lastID });
  });
});

app.get("/api/appointments", (req, res) => {
  db.all(`SELECT * FROM appointments ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

app.post("/api/appointments/:id/confirm", (req, res) => {
  const appointmentId = req.params.id;

  db.get(`SELECT * FROM appointments WHERE id = ?`, [appointmentId], (err, appointment) => {
    if (err || !appointment) return res.status(404).json({ message: "Appointment not found" });

    db.run(`UPDATE appointments SET status = 'confirmed' WHERE id = ?`, [appointmentId], function (err) {
      if (err) return res.status(500).json({ message: err.message });

      const mailOptions = {
        from: '"Skinz Dermatology" <huzaifaxyasir@gmail.com>',
        to: appointment.email,
        subject: "Appointment Confirmed",
        html: `
          <h2>Hello ${appointment.name},</h2>
          <p>Your appointment for <strong>${appointment.date}</strong> has been <strong>confirmed</strong>.</p>
          <p>See you soon!</p>
          <p>- Skinz Dermatology Clinic</p>
        `
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error("❌ Failed to notify patient:", err.message);
        else console.log("📧 Patient notified:", info.response);
      });

      res.json({ success: true, message: "Appointment confirmed and patient notified." });
    });
  });
});

app.delete("/api/appointments/:id", (req, res) => {
  db.run(`DELETE FROM appointments WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ success: true });
  });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const ADMIN_USERNAME = "chaand";
  const ADMIN_PASSWORD = "354061";

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ message: "Invalid username or password" });
  }
});

// === EXPORT FOR VERCEL ===
module.exports = app;
