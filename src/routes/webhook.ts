import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { sendReply } from '../services/whatsapp'

export async function webhookRoutes(app: FastifyInstance) {
  app.post('/webhook', async (request, reply) => {
    const body = request.body as any

    console.log('Webhook recebido:', JSON.stringify(body, null, 2))

    if (body.event !== 'messages.upsert') return reply.send({ ok: true })
    
    const message = body.data?.messages?.[0]
    if (!message) return reply.send({ ok: true })
    if (message.key?.fromMe) return reply.send({ ok: true })

    const phone = message.key?.remoteJid?.replace('@s.whatsapp.net', '')
    const text = message.message?.conversation?.toLowerCase().trim()

    console.log('Phone:', phone)
    console.log('Text:', text)

    if (!phone || !text) return reply.send({ ok: true })

    const isConfirmed = ['sim', 's', '1', 'yes', 'confirmo', 'confirmado'].includes(text)
    const isCancelled = ['não', 'nao', 'n', '0', 'no', 'cancelo', 'cancelar'].includes(text)

    if (!isConfirmed && !isCancelled) return reply.send({ ok: true })

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

    const confirmed = isConfirmed
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