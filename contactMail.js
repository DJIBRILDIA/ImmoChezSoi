async function handleContact(event) {
  event.preventDefault()
  const form = event.target
  const msg = document.getElementById("msg")
  msg.textContent = ""

  const name = form.name.value.trim()
  const email = form.email.value.trim()
  const phone = form.phone.value.trim()
  const message = form.message.value.trim()
  const honeypot = (form.company.value || "").trim()

  if (honeypot) { msg.textContent = "OK"; return }

  if (!name || !email || !message) {
    msg.textContent = "Veuillez renseigner nom, email et message."
    return
  }

  const payload = { name, email, phone, message }

  try {
    const response = await fetch("https://formspree.io/f/xeoqjvra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    if (response.ok) {
      msg.textContent = "Message envoyé, merci !"
      form.reset()
    } else {
      msg.textContent = "Désolé, l’envoi a échoué. Réessayez plus tard."
    }
  } catch (err) {
    msg.textContent = "Erreur réseau. Vérifiez votre connexion."
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contact-form")
  if (form) form.addEventListener("submit", handleContact)
})
