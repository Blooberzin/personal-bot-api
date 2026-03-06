import 'dotenv/config'

const EVOLUTION_URL = 'https://evolution-api-production-4f8d.up.railway.app'
const API_KEY = 'dd64563a5313e4d904b0576831f7bfa121542ff8cdd5f421a5c4f30c9f1b8c19'
const INSTANCE = 'personal-bot'

export async function sendReminder(phone: string, name: string, date: Date) {
  const hora = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })

  const message = `Olá, ${name}! 👋\n\nLembrete: sua aula está marcada para *hoje às ${hora}*.\n\nVocê confirma presença?\n\n✅ Digite *SIM* para confirmar\n❌ Digite *NÃO* para cancelar`

  await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
    method: 'POST',
    headers: {
      'apikey': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      number: phone,
      text: message
    })
  })
}