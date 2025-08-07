document.getElementById("adminLoginForm")?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Login successful! Redirecting to dashboard...");
      window.location.href = "admin-dashboard.html";
    } else {
      alert(data.message || "Invalid credentials");
    }
  } catch (err) {
    alert("Error connecting to server.");
    console.error(err);
  }
});

// === DASHBOARD SCRIPT ===

async function loadAppointments() {
  const container = document.getElementById("appointmentsContainer");
  if (!container) return;

  try {
    const res = await fetch("http://localhost:3000/api/appointments");
    const data = await res.json();

    if (Array.isArray(data)) {
      container.innerHTML = "";

      data.forEach((appt) => {
        const card = document.createElement("div");
        card.className = "booking-card";

        card.innerHTML = `
          <p><strong>Name:</strong> ${appt.name}</p>
          <p><strong>Email:</strong> ${appt.email}</p>
          <p><strong>Phone:</strong> ${appt.phone}</p>
          <p><strong>Date:</strong> ${appt.date}</p>
          <p><strong>Status:</strong> ${appt.status}</p>
          <div class="booking-actions">
            <button class="confirm-btn" ${appt.status === 'confirmed' ? 'disabled' : ''} onclick="confirmAppointment(${appt.id}, this)">Confirm</button>
            <button class="contact-btn" onclick="contactPatient('${appt.email}')">Contact</button>
            <button class="reschedule-btn" onclick="reschedule(${appt.id})">Reschedule</button>
            <button onclick="deleteAppointment(${appt.id}, this)">Delete</button>
          </div>
        `;

        container.appendChild(card);
      });
    } else {
      container.innerHTML = "<p>No appointments found.</p>";
    }
  } catch (err) {
    console.error("Failed to load appointments:", err);
  }
}

async function confirmAppointment(id, btn) {
  try {
    const res = await fetch(`http://localhost:3000/api/appointments/${id}/confirm`, {
      method: "POST"
    });

    const data = await res.json();

    if (res.ok) {
      alert("Appointment confirmed and email sent to patient.");
      btn.disabled = true;
      btn.parentElement.previousElementSibling.innerHTML = "<strong>Status:</strong> confirmed";
    } else {
      alert(data.message || "Failed to confirm appointment.");
    }
  } catch (err) {
    console.error(err);
    alert("Server error during confirmation.");
  }
}

function deleteAppointment(id, btn) {
  if (!confirm("Are you sure you want to delete this appointment?")) return;

  fetch(`http://localhost:3000/api/appointments/${id}`, {
    method: "DELETE"
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Appointment deleted.");
        btn.closest(".booking-card").remove();
      }
    })
    .catch(err => {
      console.error(err);
      alert("Failed to delete appointment.");
    });
}

function contactPatient(email) {
  window.location.href = `mailto:${email}`;
}

function reschedule(id) {
  alert("Reschedule feature coming soon.");
}

// Auto load on dashboard
window.addEventListener("DOMContentLoaded", loadAppointments);
