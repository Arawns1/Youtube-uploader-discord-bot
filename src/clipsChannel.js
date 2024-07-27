
import { connect } from 'amqplib'
import { AMQP_SERVER, REQUEST_QUEUE_NAME } from './constantes.js'
export function createClipsChannel() {
    return new Promise(async (resolve, reject) => {
        try {
            const connection = await connect(AMQP_SERVER)
            const channel = await connection.createChannel()
            await channel.assertQueue(REQUEST_QUEUE_NAME, { durable: false })
            console.log('Conectado ao RabbitMQ')
            return resolve(channel)
        }
        catch(error){
            console.log('Erro ao conectar ao RabbitMQ')
            reject(error)
        }
    })
}