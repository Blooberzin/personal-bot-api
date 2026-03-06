import Fastify from 'fastify'
import cors from '@fastify/cors'
import { studentRoutes } from './routes/students'
import { classRoutes } from './routes/classes'
import { startReminderJob } from './jobs/reminder'

const app = Fastify()

app.register(cors, {
  origin: '*'
})

app.register(studentRoutes)
app.register(classRoutes)

startReminderJob()

app.listen({ port: 3000 }, (err) => {
  if (err) throw err
  console.log('Servidor rodando em http://localhost:3000')
})