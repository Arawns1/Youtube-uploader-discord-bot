import { ActionRowBuilder, Client, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js"
import * as fs from "fs"
import * as path from "path"
import { Readable } from "stream"
import { CANAL_CLIPES_ID, REQUEST_QUEUE_NAME, REPLY_QUEUE_NAME, TOKEN } from "./constantes.js"
import { createClipsChannel } from './clipsChannel.js'
import { randomUUID } from 'node:crypto';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
})

client.on("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}!`)
})

const clipsChannel = await createClipsChannel()

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return

    const { commandName, user, channel } = interaction

    if (commandName === "yt") {
        // if (interaction.channelId !== CANAL_CLIPES_ID) return
        const modal = youtubeUploaderModal(user)
        await interaction.showModal(modal)
        const filter = interaction => interaction.customId === modal.data.custom_id

        await interaction.awaitModalSubmit({ filter, time: 30_000 })
            .then(async modalInteraction => {
                const tituloValue = modalInteraction.fields.getTextInputValue("tituloInput")
                const descricaoValue = modalInteraction.fields.getTextInputValue("descricaoInput")

                const ultimaMensagem = await channel.messages
                    .fetch({ limit: 1 })
                    .then(messages => {
                        return messages.filter(message => message.author.id === user.id).first()
                    })

                if (!ultimaMensagem) {
                    return modalInteraction.reply({
                        content: "Não foi possível encontrar o último clipe enviado por você.",
                        ephemeral: true
                    })
                }

                ultimaMensagem.attachments.forEach(async anexo => {
                    if (isAnexoUmVideo(anexo.contentType)) {
                        const video = new Video(anexo.id, tituloValue, descricaoValue, anexo.contentType, anexo.size, anexo.url, ultimaMensagem.author.username)

                        if (clipsChannel) {
                            const messageJSON = JSON.stringify(video)
                            var correlationId = randomUUID();

                            await clipsChannel.assertQueue(REPLY_QUEUE_NAME, { durable: false })
                            clipsChannel.consume(REPLY_QUEUE_NAME, (msg) => {
                                if (msg.properties.correlationId == correlationId) {
                                    return modalInteraction.reply('Link do clipe: ', msg.content.toString())
                                }
                            }, {
                                noAck: true
                            });

                            clipsChannel.sendToQueue(
                                REQUEST_QUEUE_NAME,
                                Buffer.from(messageJSON),
                                {
                                    persistent: true,
                                    replyTo: REPLY_QUEUE_NAME,
                                    correlationId
                                })
                            modalInteraction.reply(`Clipe: '${tituloValue}' adicionado a fila com sucesso!`)
                        }
                        else {
                            modalInteraction.reply("Não foi possível enviar o clipe para a fila, tente novamente mais tarde.")
                        }

                    }
                })
            })
            .catch(error => {
                channel.send("Tempo esgotado, por favor tente novamente.")
                console.error(error)
            })
    }
})

function youtubeUploaderModal(user) {
    const modal = new ModalBuilder({
        customId: `ytModal-${user.id}`,
        title: "Upload para o youtube",
    })

    const titulo = new TextInputBuilder({
        customId: "tituloInput",
        label: "Título do clipe",
        style: TextInputStyle.Short,
        max_length: 100,
        required: true,
    })

    const descricao = new TextInputBuilder({
        customId: "descricaoInput",
        label: "Descrição do clipe",
        style: TextInputStyle.Paragraph,
        max_length: 200,
        required: false,
    })

    const firstActionRow = new ActionRowBuilder().addComponents(titulo)
    const secondActionRow = new ActionRowBuilder().addComponents(descricao)

    modal.addComponents(firstActionRow, secondActionRow)
    return modal
}

client.login(TOKEN)

function isAnexoUmVideo(tipo_anexo) {
    const [tipo, formato] = tipo_anexo.split("/")
    return tipo === 'video'
}

class Video {
    constructor(id, titulo, descricao, formato, tamanho, link, autor) {
        this.id = id
        this.titulo = titulo
        this.descricao = descricao
        this.formato = formato
        this.tamanho = tamanho
        this.link = link
        this.autor = autor
    }

    getExtensao() {
        return this.formato.split("/")[1]
    }
}
