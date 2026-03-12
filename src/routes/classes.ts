import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { sendReminder } from '../services/whatsapp'

export async function classRoutes(app: FastifyInstance) {
  // Listar todas as aulas
  app.get('/classes', async () => {
    const classes = await prisma.class.findMany({
      include: { student: true }
    })
    return classes
  })

  // Criar uma aula
  app.post('/classes', async (request, reply) => {
    const { studentId, scheduledAt } = request.body as {
      studentId: string
      scheduledAt: string
    }
    const newClass = await prisma.class.create({
      data: {
        studentId,
        scheduledAt: new Date(scheduledAt)
      }
    })
    return reply.status(201).send(newClass)
  })

  // Atualizar status da aula
  app.patch('/classes/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status } = request.body as { status: string }
    const updated = await prisma.class.update({
      where: { id },
      data: { status }
    })
    return reply.send(updated)
  })

  // Reenviar lembrete
  app.post('/classes/:id/reminder', async (request, reply) => {
    const { id } = request.params as { id: string }

    const cls = await prisma.class.findUnique({
      where: { id },
      include: { student: true }
    })

    if (!cls) return reply.status(404).send({ error: 'Aula não encontrada' })

    await sendReminder(cls.student.phone, cls.student.name, cls.scheduledAt)

    await prisma.class.update({
      where: { id },
      data: { reminderSent: true }
    })

    await prisma.student.update({
      where: { id: cls.student.id },
      data: { lastRemindedClassId: cls.id }
    })

    return reply.send({ ok: true })
  })

  // Deletar uma aula
  app.delete('/classes/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.class.delete({ where: { id } })
    return reply.status(204).send()
  })
}