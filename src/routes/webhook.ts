import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { sendReply } from '../services/whatsapp'

export async function webhookRoutes(app: FastifyInstance) {
  app.post('/webhook', async (request, reply) => {
    const body = request.body as any

    if (body.event !== 'messages.upsert') return reply.send({ ok: true })

    const message = body.data?.key
    if (!message) return reply.send({ ok: true })
    if (message.fromMe) return reply.send({ ok: true })

    const phone = message.remoteJid?.replace('@s.whatsapp.net', '')
    
    const text = (
      body.data?.message?.conversation ||
      body.data?.message?.extendedTextMessage?.text ||
      body.data?.message?.editedMessage?.message?.protocolMessage?.editedMessage?.conversation
    )?.toLowerCase().trim()

    console.log('Phone:', phone)
    console.log('Text:', text)

    if (!phone || !text) return reply.send({ ok: true })

    const isConfirmed = ['sim', 's', '1', 'yes', 'confirmo', 'confirmado'].includes(text)
    const isCancelled = ['não', 'nao', 'n', '0', 'no', 'cancelo', 'cancelar'].includes(text)

    if (!isConfirmed && !isCancelled) return reply.send({ ok: true })

    const student = await prisma.student.findFirst({ where: { phone } })
    if (!student) return reply.send({ ok: true })

    // Usa o ID da aula que recebeu o último lembrete
    const cls = await prisma.class.findUnique({
      where: { id: student.lastRemindedClassId ?? '' }
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