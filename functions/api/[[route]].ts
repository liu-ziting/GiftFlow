import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { jwt, sign, verify } from 'hono/jwt'

type Bindings = {
    DB: D1Database
    JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

const JWT_SECRET = 'gift-flow-secret-key' // In production, use env var

// --- Middleware ---
const auth = jwt({
    secret: JWT_SECRET,
    alg: 'HS256'
})

// --- Routes ---

// 1. Auth
app.post('/register', async c => {
    try {
        const { username, password } = await c.req.json()
        const db = c.env.DB
        
        // First user is admin
        const userCountRes = await db.prepare('SELECT COUNT(*) as count FROM users').first()
        const userCount = (userCountRes?.count as number) || 0
        const isAdmin = userCount === 0 ? 1 : 0
        
        await db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)')
            .bind(username, password, isAdmin)
            .run()
        
        return c.json({ success: true })
    } catch (e: any) {
        console.error('Registration error:', e)
        return c.json({ success: false, message: e.message || 'Registration failed' }, 400)
    }
})

app.post('/login', async c => {
    const { username, password } = await c.req.json()
    const db = c.env.DB

    const user = await db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').bind(username, password).first()

    if (!user) {
        return c.json({ success: false, message: 'Invalid credentials' }, 401)
    }

    const token = await sign({ id: user.id, username: user.username, isAdmin: !!user.is_admin }, JWT_SECRET)
    return c.json({ success: true, token, user: { id: user.id, username: user.username, isAdmin: !!user.is_admin } })
})

// 2. User Profile
app.get('/profile', auth, async c => {
    const payload = c.get('jwtPayload')
    const db = c.env.DB
    const user = await db.prepare('SELECT id, username, real_name, phone, address, is_admin FROM users WHERE id = ?').bind(payload.id).first()
    return c.json(user)
})

app.post('/profile', auth, async c => {
    const payload = c.get('jwtPayload')
    const { real_name, phone, address } = await c.req.json()
    const db = c.env.DB

    await db.prepare('UPDATE users SET real_name = ?, phone = ?, address = ? WHERE id = ?').bind(real_name, phone, address, payload.id).run()

    return c.json({ success: true })
})

// 3. Activity
app.get('/status', async c => {
    const db = c.env.DB
    const status = await db.prepare('SELECT value FROM config WHERE key = ?').bind('activity_status').first('value')
    const count = await db.prepare('SELECT COUNT(*) as count FROM participants').first('count')
    return c.json({ status, participantCount: count })
})

app.post('/join', auth, async c => {
    const payload = c.get('jwtPayload')
    const db = c.env.DB

    // Check if address is filled
    const user = await db.prepare('SELECT address FROM users WHERE id = ?').bind(payload.id).first()
    if (!user.address) {
        return c.json({ success: false, message: 'Please fill your address first' }, 400)
    }

    await db.prepare('INSERT OR IGNORE INTO participants (user_id) VALUES (?)').bind(payload.id).run()
    return c.json({ success: true })
})

// 4. Results
app.get('/my-gift', auth, async c => {
    const payload = c.get('jwtPayload')
    const db = c.env.DB

    const result = await db
        .prepare(
            `
    SELECT u.real_name, u.phone, u.address 
    FROM draw_results d
    JOIN users u ON d.receiver_id = u.id
    WHERE d.giver_id = ?
  `
        )
        .bind(payload.id)
        .first()

    return c.json({ result })
})

// 5. Admin Draw
app.post('/admin/draw', auth, async c => {
    const payload = c.get('jwtPayload')
    if (!payload.isAdmin) return c.json({ message: 'Forbidden' }, 403)

    const db = c.env.DB

    // Get all participants
    const participants = await db.prepare('SELECT user_id FROM participants').all()
    const ids = participants.results.map(p => p.user_id)

    if (ids.length < 2) {
        return c.json({ success: false, message: 'At least 2 participants required' }, 400)
    }

    // Simple derangement algorithm (Sattolo's or shuffle and shift)
    const shuffled = [...ids].sort(() => Math.random() - 0.5)
    const pairs = []
    for (let i = 0; i < shuffled.length; i++) {
        const giver = shuffled[i]
        const receiver = shuffled[(i + 1) % shuffled.length]
        pairs.push({ giver, receiver })
    }

    // Save results in transaction
    const statements = pairs.map(p => db.prepare('INSERT INTO draw_results (giver_id, receiver_id) VALUES (?, ?)').bind(p.giver, p.receiver))
    statements.push(db.prepare("UPDATE config SET value = 'drawn' WHERE key = 'activity_status'"))

    await db.batch(statements)

    return c.json({ success: true })
})

export const onRequest = handle(app)

