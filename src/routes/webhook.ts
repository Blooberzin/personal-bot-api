import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function webhookRoutes(app: FastifyInstance) {
  app.post('/webhook', async (request, reply) => {
    const body = request.body as any

    // Verifica se é uma mensagem recebida
    if (body.event !== 'messages.upsert') return reply.send({ ok: true })
    
    const message = body.data?.messages?.[0]
    if (!message) return reply.send({ ok: true })
    
    // Ignora mensagens enviadas pelo próprio bot
    if (message.key?.fromMe) return reply.send({ ok: true })

    const phone = message.key?.remoteJid?.replace('@s.whatsapp.net', '')
    const text = message.message?.conversation?.toLowerCase().trim()

    if (!phone || !text) return reply.send({ ok: true })

    // Verifica se é SIM ou NÃO
    if (text !== 'sim' && text !== 'não' && text !== 'nao') {
      return reply.send({ ok: true })
    }

    // Busca o aluno pelo telefone
    const student = await prisma.student.findFirst({
      where: { phone }
    })

    if (!student) return reply.send({ ok: true })

    // Busca a aula mais recente pendente do aluno
    const cls = await prisma.class.findFirst({
      where: {
        studentId: student.id,
        status: 'pending',
        reminderSent: true
      },
      orderBy: { scheduledAt: 'asc' }
    })

    if (!cls) return reply.send({ ok: true })

    // Atualiza o status
    const newStatus = (text === 'sim') ? 'confirmed' : 'cancelled'
    await prisma.class.update({
      where: { id: cls.id },
      data: { status: newStatus }
    })

    console.log(`Aluno ${student.name} ${newStatus === 'confirmed' ? 'confirmou ✅' : 'cancelou ❌'} a aula`)

    return reply.send({ ok: true })
  })
}