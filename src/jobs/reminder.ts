import cron from 'node-cron'
import { prisma } from '../lib/prisma'
import { sendReminder } from '../services/whatsapp'

export function startReminderJob() {
  cron.schedule('* * * * *', async () => {
    console.log('Verificando aulas próximas...')

    const now = new Date()
    const in2hours = new Date(now.getTime() + 2 * 60 * 60 * 1000)

    const upcomingClasses = await prisma.class.findMany({
      where: {
        scheduledAt: { gte: now, lte: in2hours },
        reminderSent: false,
        status: 'pending'
      },
      include: { student: true }
    })

    console.log(`${upcomingClasses.length} aula(s) encontrada(s)`)

    for (const cls of upcomingClasses) {
      console.log(`Enviando lembrete para ${cls.student.name}...`)
      await sendReminder(cls.student.phone, cls.student.name, cls.scheduledAt)
      await prisma.class.update({
        where: { id: cls.id },
        data: { reminderSent: true }
      })
      await prisma.student.update({
        where: { id: cls.student.id },
        data: { lastRemindedClassId: cls.id }
      })
      console.log(`Lembrete enviado para ${cls.student.name} ✅`)
    }
  })

  console.log('Job de lembretes iniciado!')
}