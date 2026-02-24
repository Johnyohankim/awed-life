import { Resend } from 'resend'

let resend

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function sendVerificationEmail(email, name, token) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://awed.life'
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`

  await getResend().emails.send({
    from: 'Awed <noreply@awed.life>',
    to: email,
    subject: 'Verify your Awed account',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #2D3A2E; margin-bottom: 8px;">Welcome to Awed${name ? `, ${name}` : ''}!</h2>
        <p style="color: #5A6B5C; line-height: 1.6;">Please verify your email to start your daily practice of wonder.</p>
        <a href="${verifyUrl}"
           style="display: inline-block; background: #5B7F6B; color: white;
                  padding: 14px 28px; border-radius: 10px; text-decoration: none;
                  font-weight: 500; margin: 20px 0;">
          Verify my email
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 32px; line-height: 1.5;">
          This link expires in 24 hours.<br/>
          If you didn't create an Awed account, you can safely ignore this email.
        </p>
      </div>
    `
  })
}
