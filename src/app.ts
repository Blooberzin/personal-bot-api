import Fastify from 'fastify'
import cors from '@fastify/cors'
import { studentRoutes } from './routes/students'
import { classRoutes } from './routes/classes'
import { webhookRoutes } from './routes/webhook'
import { startReminderJob } from './jobs/reminder'

const app = Fastify()

app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
})

app.register(studentRoutes)
app.register(classRoutes)
app.register(webhookRoutes)

startReminderJob()

app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) throw err
  console.log('Servidor rodando em http://localhost:3000')
})