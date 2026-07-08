import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return transporter
}

export async function sendWelcomeEmail(to, password, name, role) {
  const t = getTransporter()
  if (!t) {
    console.log(`[EMAIL] Simulated send to ${to}: Welcome ${name} (${role}), password: ${password}`)
    return
  }
  const roleLabel = role === 'enseignant' ? 'enseignant' : role === 'parent' ? 'parent' : 'utilisateur'
  await t.sendMail({
    from: process.env.SMTP_FROM || 'noreply@ecole.cm',
    to,
    subject: 'Bienvenue sur le portail scolaire',
    text: `Bonjour ${name},\n\nVotre compte ${roleLabel} a été créé.\n\nIdentifiants de connexion :\nEmail : ${to}\nMot de passe : ${password}\n\nConnectez-vous sur : http://localhost:3000/login\n\nCordialement,\nL'administration`,
  })
  console.log(`[EMAIL] Sent welcome email to ${to}`)
}
