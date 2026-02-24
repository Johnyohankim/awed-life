import crypto from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET

export function createVerificationToken(email, userId) {
  const payload = JSON.stringify({
    email,
    userId,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  })
  const encoded = Buffer.from(payload).toString('base64url')
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(encoded)
    .digest('base64url')
  return `${encoded}.${signature}`
}

export function verifyToken(token) {
  try {
    const [encoded, signature] = token.split('.')
    if (!encoded || !signature) return null

    const expectedSig = crypto
      .createHmac('sha256', SECRET)
      .update(encoded)
      .digest('base64url')

    if (signature !== expectedSig) return null

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (Date.now() > payload.exp) return null

    return payload
  } catch {
    return null
  }
}
