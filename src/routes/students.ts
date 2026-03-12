import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'

export async function studentRoutes(app: FastifyInstance) {
  // Listar todos os alunos
  app.get('/students', async () => {
    const students = await prisma.student.findMany()
    return students
  })

  // Criar um aluno
  app.post('/students', async (request, reply) => {
    const { name, phone } = request.body as { name: string, phone: string }
    const student = await prisma.student.create({
      data: { name, phone }
    })
    return reply.status(201).send(student)
  })

 // Deletar um aluno
app.delete('/students/:id', async (request, reply) => {
  const { id } = request.params as { id: string }
  
  // Primeiro deleta as aulas do aluno
  await prisma.class.deleteMany({ where: { studentId: id } })
  
  // Depois deleta o aluno
  await prisma.student.delete({ where: { id } })
  
  return reply.status(204).send()
})

  // Atualizar um aluno
app.patch('/students/:id', async (request, reply) => {
  const { id } = request.params as { id: string }
  const { name, phone } = request.body as { name?: string, phone?: string }
  const updated = await prisma.student.update({
    where: { id },
    data: { name, phone }
  })
  return reply.send(updated)
})
}