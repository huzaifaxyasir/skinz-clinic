const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");
const nodemailer = require("nodemailer");
require('dotenv').config();

const app = express();
const port = 3000;

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// === DATABASE SETUP ===
const db = new sqlite3.Database("./db/skinz.db", (err) => {
  if (err) {
    console.error("❌ Failed to connect to DB:", err.message);
  } else {
    console.log("✅ Connected to SQLite database.");
  }
});

// Create appointments table with status
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

// Create admins table
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


// === API ROUTES ===

// POST /api/appointments - Book appointment
app.post("/api/appointments", (req, res) => {
  const { name, email, date, phone } = req.body;

  const sql = `INSERT INTO appointments (name, email, date, phone, status) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [name, email, date, phone, 'pending'], function (err) {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    // Send email to doctor
    const mailOptions = {
      from: '"Skinz Dermatology" <huzaifaxyasir@gmail.com>',
      to: 'huzaifaxyasir@gmail.com', // Replace with doctor's email
      subject: `New Appointment from ${name}`,
      html: `
        <h2>New Appointment Booking</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p>Status: <strong>Pending</strong></p>
        <p><a href="http://localhost:3000/admin-login.html" target="_blank">Go to Admin Dashboard to confirm</a></p>
      `
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("❌ Failed to send email:", err.message);
      } else {
        console.log("📧 Doctor notified:", info.response);
      }
    });

    res.json({ success: true, id: this.lastID });
  });
});

// GET /api/appointments - Fetch all appointments
app.get("/api/appointments", (req, res) => {
  const sql = `SELECT * FROM appointments ORDER BY id DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// POST /api/appointments/:id/confirm - Confirm appointment and email patient
app.post("/api/appointments/:id/confirm", (req, res) => {
  const appointmentId = req.params.id;

  // Get appointment info
  db.get(`SELECT * FROM appointments WHERE id = ?`, [appointmentId], (err, appointment) => {
    if (err || !appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update status to confirmed
    db.run(`UPDATE appointments SET status = 'confirmed' WHERE id = ?`, [appointmentId], function (err) {
      if (err) return res.status(500).json({ message: err.message });

      // Send confirmation email to patient
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
        if (err) {
          console.error("❌ Failed to notify patient:", err.message);
        } else {
          console.log("📧 Patient notified:", info.response);
        }
      });

      res.json({ success: true, message: "Appointment confirmed and patient notified." });
    });
  });
});

// DELETE /api/appointments/:id - Delete appointment
app.delete("/api/appointments/:id", (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM appointments WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) return res.status(500).json({ message: err.message });

    res.json({ success: true });
  });
});

// POST /api/auth/login - Admin login
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

// === START SERVER ===
app.listen(port, () => {
  console.log(`🌐 Server running at: http://localhost:${port}`);
});


