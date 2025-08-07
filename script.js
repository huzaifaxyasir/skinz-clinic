const form = document.getElementById("appointmentForm");

if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const booking = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      date: document.getElementById("date").value,
      phone: document.getElementById("phone").value
    };

    try {
      const res = await fetch("http://localhost:3000/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(booking)
      });

      const data = await res.json();

      if (res.ok) {
        alert("Your appointment request has been submitted!");
        form.reset();
      } else {
        alert(data.message || "Something went wrong.");
      }
    } catch (err) {
      alert("Error connecting to server.");
      console.error(err);
    }
  });
}
