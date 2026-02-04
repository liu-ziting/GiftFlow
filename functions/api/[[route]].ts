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
        const { username, password, invite_code } = await c.req.json()
        const db = c.env.DB

        // First user is admin, doesn't need invite code
        const userCountRes = await db.prepare('SELECT COUNT(*) as count FROM users').first()
        const userCount = (userCountRes?.count as number) || 0
        const isAdmin = userCount === 0 ? 1 : 0

        let inviteCodeId = null
        if (!isAdmin) {
            // Verify invite code for normal users
            const inviteCode = await db.prepare('SELECT id FROM invite_codes WHERE code = ?').bind(invite_code).first()
            if (!inviteCode) {
                return c.json({ success: false, message: '无效的邀请码' }, 400)
            }
            inviteCodeId = inviteCode.id
        }

        await db.prepare('INSERT INTO users (username, password, is_admin, invite_code_id) VALUES (?, ?, ?, ?)').bind(username, password, isAdmin, inviteCodeId).run()

        return c.json({ success: true })
    } catch (e: any) {
        console.error('Registration error:', e)
        return c.json({ success: false, message: e.message || '注册失败' }, 400)
    }
})

app.post('/login', async c => {
    const { username, password } = await c.req.json()
    const db = c.env.DB

    const user = await db
        .prepare(
            `
        SELECT u.*, ic.code as invite_code 
        FROM users u 
        LEFT JOIN invite_codes ic ON u.invite_code_id = ic.id 
        WHERE u.username = ? AND u.password = ?
    `
        )
        .bind(username, password)
        .first()

    if (!user) {
        return c.json({ success: false, message: '用户名或密码错误' }, 401)
    }

    const token = await sign(
        {
            id: user.id,
            username: user.username,
            isAdmin: !!user.is_admin,
            inviteCodeId: user.invite_code_id
        },
        JWT_SECRET
    )
    return c.json({
        success: true,
        token,
        user: {
            id: user.id,
            username: user.username,
            isAdmin: !!user.is_admin,
            inviteCode: user.invite_code,
            inviteCodeId: user.invite_code_id
        }
    })
})

// 2. User Profile
app.get('/profile', auth, async c => {
    const payload = c.get('jwtPayload')
    const db = c.env.DB
    const user = await db
        .prepare(
            `
        SELECT u.id, u.username, u.real_name, u.phone, u.address, u.is_admin, ic.code as invite_code 
        FROM users u 
        LEFT JOIN invite_codes ic ON u.invite_code_id = ic.id 
        WHERE u.id = ?
    `
        )
        .bind(payload.id)
        .first()
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
app.get('/status', auth, async c => {
    const payload = c.get('jwtPayload')
    const db = c.env.DB

    if (payload.isAdmin) {
        return c.json({
            status: 'admin',
            participantCount: 0,
            groupName: '系统管理'
        })
    }

    const inviteCode = await db.prepare('SELECT status, group_name FROM invite_codes WHERE id = ?').bind(payload.inviteCodeId).first()
    const count = await db
        .prepare('SELECT COUNT(*) as count FROM participants p JOIN users u ON p.user_id = u.id WHERE u.invite_code_id = ?')
        .bind(payload.inviteCodeId)
        .first('count')

    return c.json({
        status: inviteCode?.status || 'joining',
        participantCount: count,
        groupName: inviteCode?.group_name || '未知群组'
    })
})

app.post('/join', auth, async c => {
    const payload = c.get('jwtPayload')
    const db = c.env.DB

    if (payload.isAdmin) {
        return c.json({ success: false, message: '管理员无需参与抽奖' }, 400)
    }

    // Check if address is filled
    const user = await db.prepare('SELECT address FROM users WHERE id = ?').bind(payload.id).first()
    if (!user.address) {
        return c.json({ success: false, message: '请先填写收货地址' }, 400)
    }

    await db.prepare('INSERT OR IGNORE INTO participants (user_id) VALUES (?)').bind(payload.id).run()
    return c.json({ success: true })
})

// 4. Results
app.get('/my-gift', auth, async c => {
    const payload = c.get('jwtPayload')
    const db = c.env.DB

    // Get the info of who I need to send a gift to
    const result = await db
        .prepare(
            `
    SELECT u.real_name, u.phone, u.address 
    FROM draw_results d
    JOIN users u ON d.receiver_id = u.id
    WHERE d.giver_id = ? AND d.invite_code_id = ?
  `
        )
        .bind(payload.id, payload.inviteCodeId)
        .first()

    return c.json({ result })
})

// 5. Admin Draw
app.post('/admin/draw', auth, async c => {
    const payload = c.get('jwtPayload')
    if (!payload.isAdmin) return c.json({ message: 'Forbidden' }, 403)

    const db = c.env.DB
    const { inviteCodeId: targetInviteCodeId } = await c.req.json().catch(() => ({ inviteCodeId: null }))
    const inviteCodeId = targetInviteCodeId || payload.inviteCodeId

    if (!inviteCodeId) {
        return c.json({ success: false, message: '未指定群组' }, 400)
    }

    // Get all participants in the same group
    const participants = await db
        .prepare(
            `
        SELECT p.user_id 
        FROM participants p 
        JOIN users u ON p.user_id = u.id 
        WHERE u.invite_code_id = ?
    `
        )
        .bind(inviteCodeId)
        .all()

    const ids = participants.results.map(p => p.user_id)

    if (ids.length < 2) {
        return c.json({ success: false, message: '该群组至少需要 2 名参与者才能开始抽奖' }, 400)
    }

    // Check if already drawn
    const existingResults = await db.prepare('SELECT id FROM draw_results WHERE invite_code_id = ?').bind(inviteCodeId).first()
    if (existingResults) {
        return c.json({ success: false, message: '该群组已完成抽奖' }, 400)
    }

    // Completely random shuffle
    // Using Fisher-Yates shuffle
    const shuffled = [...ids]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // Generate pairs: giver -> receiver
    const pairs = []
    for (let i = 0; i < shuffled.length; i++) {
        const giver = shuffled[i]
        const receiver = shuffled[(i + 1) % shuffled.length]
        pairs.push({ giver, receiver })
    }

    // Save results in transaction
    const statements = pairs.map(p => db.prepare('INSERT INTO draw_results (giver_id, receiver_id, invite_code_id) VALUES (?, ?, ?)').bind(p.giver, p.receiver, inviteCodeId))
    statements.push(db.prepare("UPDATE invite_codes SET status = 'drawn' WHERE id = ?").bind(inviteCodeId))

    await db.batch(statements)

    return c.json({ success: true })
})

app.get('/admin/draw-results/:inviteCodeId', auth, async c => {
    const payload = c.get('jwtPayload')
    if (!payload.isAdmin) return c.json({ message: 'Forbidden' }, 403)

    const inviteCodeId = c.req.param('inviteCodeId')
    const db = c.env.DB

    const results = await db
        .prepare(
            `
        SELECT 
            u1.real_name as giver_name,
            u1.username as giver_username,
            u2.real_name as receiver_name,
            u2.username as receiver_username
        FROM draw_results dr
        JOIN users u1 ON dr.giver_id = u1.id
        JOIN users u2 ON dr.receiver_id = u2.id
        WHERE dr.invite_code_id = ?
    `
        )
        .bind(inviteCodeId)
        .all()

    return c.json(results.results)
})

// 6. User Management (Admin only)
app.get('/admin/users', auth, async c => {
    const payload = c.get('jwtPayload')
    if (!payload.isAdmin) return c.json({ message: 'Forbidden' }, 403)
    const db = c.env.DB
    const inviteCodeId = c.req.query('inviteCodeId')

    let query = `
        SELECT u.id, u.username, u.real_name, u.is_admin, u.created_at, ic.group_name,
               CASE WHEN p.user_id IS NOT NULL THEN 1 ELSE 0 END as is_participating
        FROM users u
        LEFT JOIN participants p ON u.id = p.user_id
        LEFT JOIN invite_codes ic ON u.invite_code_id = ic.id
    `
    const params = []
    if (inviteCodeId) {
        query += ` WHERE u.invite_code_id = ?`
        params.push(inviteCodeId)
    }

    const users = await db
        .prepare(query)
        .bind(...params)
        .all()
    return c.json(users.results)
})

// 7. Invite Code Management (Admin only)
app.get('/admin/invite-codes', auth, async c => {
    const payload = c.get('jwtPayload')
    if (!payload.isAdmin) return c.json({ message: 'Forbidden' }, 403)
    const db = c.env.DB
    const codes = await db
        .prepare(
            `
        SELECT ic.*, 
               (SELECT COUNT(*) FROM participants p JOIN users u ON p.user_id = u.id WHERE u.invite_code_id = ic.id) as participant_count
        FROM invite_codes ic 
        ORDER BY created_at DESC
    `
        )
        .all()
    return c.json(codes.results)
})

app.post('/admin/invite-codes', auth, async c => {
    const payload = c.get('jwtPayload')
    if (!payload.isAdmin) return c.json({ message: 'Forbidden' }, 403)
    const { code, group_name } = await c.req.json()
    const db = c.env.DB
    try {
        await db.prepare('INSERT INTO invite_codes (code, group_name) VALUES (?, ?)').bind(code, group_name).run()
        return c.json({ success: true })
    } catch (e: any) {
        return c.json({ success: false, message: '邀请码已存在' }, 400)
    }
})

app.delete('/admin/invite-codes/:id', auth, async c => {
    const payload = c.get('jwtPayload')
    if (!payload.isAdmin) return c.json({ message: 'Forbidden' }, 403)
    const id = c.req.param('id')
    const db = c.env.DB

    // Check if there are users using this code
    const userCount = await db.prepare('SELECT COUNT(*) as count FROM users WHERE invite_code_id = ?').bind(id).first('count')
    if (userCount > 0) {
        return c.json({ success: false, message: '该邀请码下已有用户，无法删除' }, 400)
    }

    await db.prepare('DELETE FROM invite_codes WHERE id = ?').bind(id).run()
    return c.json({ success: true })
})

app.delete('/admin/users/:id', auth, async c => {
    const payload = c.get('jwtPayload')
    if (!payload.isAdmin) return c.json({ message: 'Forbidden' }, 403)
    const id = c.req.param('id')
    const db = c.env.DB

    // Don't delete self
    if (Number(id) === payload.id) {
        return c.json({ success: false, message: 'Cannot delete yourself' }, 400)
    }

    await db.batch([
        db.prepare('DELETE FROM participants WHERE user_id = ?').bind(id),
        db.prepare('DELETE FROM draw_results WHERE giver_id = ? OR receiver_id = ?').bind(id, id),
        db.prepare('DELETE FROM users WHERE id = ?').bind(id)
    ])

    return c.json({ success: true })
})

export const onRequest = handle(app)

