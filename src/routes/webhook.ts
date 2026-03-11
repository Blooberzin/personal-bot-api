import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { sendReply } from '../services/whatsapp'

export async function webhookRoutes(app: FastifyInstance) {
  app.post('/webhook', async (request, reply) => {
    const body = request.body as any

    if (body.event !== 'messages.upsert') return reply.send({ ok: true })
    
    const message = body.data?.messages?.[0]
    if (!message) return reply.send({ ok: true })
    if (message.key?.fromMe) return reply.send({ ok: true })

    const phone = message.key?.remoteJid?.replace('@s.whatsapp.net', '')
    const text = message.message?.conversation?.toLowerCase().trim()

    if (!phone || !text) return reply.send({ ok: true })
    if (text !== 'sim' && text !== 'não' && text !== 'nao') return reply.send({ ok: true })

    const student = await prisma.student.findFirst({ where: { phone } })
    if (!student) return reply.send({ ok: true })

    const cls = await prisma.class.findFirst({
      where: {
        studentId: student.id,
        status: 'pending',
        reminderSent: true
      },
      orderBy: { scheduledAt: 'asc' }
    })

    if (!cls) return reply.send({ ok: true })

    const confirmed = text === 'sim'
    const newStatus = confirmed ? 'confirmed' : 'cancelled'

    await prisma.class.update({
      where: { id: cls.id },
      data: { status: newStatus }
    })

    await sendReply(phone, confirmed)

    console.log(`Aluno ${student.name} ${confirmed ? 'confirmou ✅' : 'cancelou ❌'} a aula`)

    return reply.send({ ok: true })
  })
}