import { ActionRowBuilder, Client, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js"
import * as fs from "fs"
import * as path from "path"
import { Readable } from "stream"
import { CANAL_CLIPES_ID, TOKEN } from "./constantes.js"

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
})

client.on("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}!`)
})

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return

    const { commandName, user, channel } = interaction

    if (commandName === "yt") {
        if (interaction.channelId !== CANAL_CLIPES_ID) return
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
                        await salvarVideo(video.link, video.titulo, video.getExtensao())
                        modalInteraction.reply(`Clipe: '${tituloValue}' adicionado a fila com sucesso!`)
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

// const tokens = {
//     access_token: 'ya29.a0AXooCgvfYdiGLX6Rkm_yFZchQCnve4kx4S-CEQvV8NJSHcSd4WsUycEKhvcFy-r6kH15UUl-cr93UbzqH3vaBXNVfI8C4Y6zO2BI3_IrzaUMIb-vqgq0gYj1oKyPipInkEv2UknLmrvVphZpzfa8Fsh7EdHEsQcPJTaUaCgYKAagSARMSFQHGX2Mi6oxrN523jPI6gvaTJvSv1g0171',
//     refresh_token: '1//0h5JjLdF-hLVWCgYIARAAGBESNwF-L9IrVtsgYACCfnCi8I7aYSanUNKKft4B-taBLfHkwcgpIVMcuJD537VjqXdqHb79dXVI42Q',
//     scope: 'https://www.googleapis.com/auth/youtube',
//     token_type: 'Bearer',
//     expiry_date: 1721184894499
// }



// const confirm = new ButtonBuilder()
// 			.setCustomId('uploadToYoutubeButton')
// 			.setLabel('Subir para o youtube')
// 			.setStyle(ButtonStyle.Primary);

// const cancel = new ButtonBuilder()
// 			.setCustomId('notUploadButton')
// 			.setLabel('Não')
// 			.setStyle(ButtonStyle.Secondary);

//  const row = new ActionRowBuilder()
// 			.addComponents(confirm, cancel);

// client.on("messageCreate", async (message,) => {
//     const {channelId, author, channel, content, attachments} = message
//     // if(channelId === CANAL_CLIPES_ID){
//         if(!author.bot){
//             if(content === '/yt'){

//             }

//             // if(content === "force"){
//             //       const oauth2Client = new google.auth.OAuth2(
//             //         GOOGLE_CLIENT_ID,
//             //         GOOGLE_CLIENT_SECRET,
//             //         GOOGLE_REDIRECT_URL
//             //     );

//             //     oauth2Client.setCredentials(tokens)

//             //     google.options({
//             //         auth: oauth2Client
//             //     })
//             // }
//             // else{
//             //     await autenticacaoOAuth()
//             // }

//             // attachments.forEach(async anexo => {
//             //     if(isAnexoUmVideo(anexo.contentType)){
//             //         const video = new Video(anexo.id, anexo.name, anexo.contentType, anexo.size, anexo.url, author.username)
//             //         await salvarVideo(video.link)
//             //         channel.send(`Video adicionado a fila com sucesso!`);
//             //         channel.send(`Iniciando Upload...`);
//             //         const data = await uploadVideo()
//             //         channel.send(`Video disponível em: https://youtu.be/${data.id}`)
//             //     }
//             // })
//         }
//     // }
// })

// client.on('interactionCreate', async interaction => {

//     if(interaction.customId === 'uploadToYoutubeButton' ){
//         await interaction.reply({
//             content: "Subindo video para o youtube...",
//             ephemeral: true
//         })
//     }

//     if(interaction.customId === 'notUploadButton' ){
//         await interaction.deleteReply()
//     }

// })

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

async function salvarVideo(videoURL, titulo, extensao) {
    console.log(`> Baixando video: ${videoURL}`);
    const response = await fetch(videoURL);

    if (!response.ok) {
        throw new Error(`Erro ao baixar o vídeo: ${response.statusText}`);
    }
    const __dirname = path.resolve();

    const filePath = path.join(__dirname, 'temp', `${titulo}.${extensao}`);

    const fileStream = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {

        Readable.fromWeb(response.body).pipe(fileStream);

        fileStream.on('finish', () => {
            console.log('> Download concluído');
            resolve(filePath);
        });

        fileStream.on('error', (err) => {
            console.error('> Erro ao salvar o arquivo', err);
            reject(err);
        });
    });
}

// async function autenticacaoOAuth() {
//     const webServer = await iniciarWebServer()
//     const OAuthClient = await criarClienteOAuth()
//     requisitarConsentimentoUsuario(OAuthClient)
//     const authorizationToken = await googleCallback(webServer)
//     await requisitarAccessTokenAoGoogle(OAuthClient, authorizationToken)
//     await definirAutenticacaoGlobal(OAuthClient)
//     await fecharWebserver(webServer)
// }

// async function iniciarWebServer() {
//     return new Promise((resolve, reject) => {
//         const port = 3000
//         const app = express()

//         const server = app.listen(port, () => {
//             console.log(`> Servidor ouvindo em http://localhost:${port}`)
//             resolve({
//                 app,
//                 server
//             })
//         })
//     })
// }

// async function criarClienteOAuth() {
//     const oauth2Client = new google.auth.OAuth2(
//         GOOGLE_CLIENT_ID,
//         GOOGLE_CLIENT_SECRET,
//         GOOGLE_REDIRECT_URL
//     );
//     return oauth2Client
// }

// async function requisitarConsentimentoUsuario(OAuthClient) {
//     const scopes = [
//         'https://www.googleapis.com/auth/youtube'
//     ];

//     const url = OAuthClient.generateAuthUrl({
//         access_type: 'offline',
//         scope: scopes
//     });

//     console.log('> Autorize o aplicativo em: ', url);
// }

// async function googleCallback(webServer) {
//     return new Promise((resolve, reject) => {
//         console.log("> Aguardando aprovação do usuário")

//         webServer.app.get("/oauth2callback", (req, res) => {
//             const authCode = req.query.code
//             console.log(` > Consetimento dado: ${authCode}`)
//             res.send('<h1>Obrigado!</h1>')
//             resolve(authCode)
//         })
//     })
// }

// async function requisitarAccessTokenAoGoogle(OAuthClient, authorizationToken) {
//     return new Promise((resolve, reject) => {
//         OAuthClient.getToken(authorizationToken, (error, tokens) => {
//             if (error) {
//                 return reject(error)
//             }

//             console.log("> Access token recebido")
//             console.log(tokens)

//             OAuthClient.setCredentials(tokens)
//             resolve()
//         })
//     })
// }

// async function definirAutenticacaoGlobal(OAuthClient) {
//     google.options({
//         auth: OAuthClient
//     })
// }

// async function fecharWebserver(webServer) {
//     return new Promise((resolve, reject) => {
//         webServer.server.close(() => {
//             resolve()
//         })
//     })
// }

// async function uploadVideo() {
//     const videoFileSize = fs.statSync('./temp/aaaa.mp4').size

//     const corpoRequisicao = {
//         part: 'snippet, status',
//         requestBody: {
//             snippet: { title: 'Hello World!', description: 'Teste', tags: ['minecraft', 'jogos legais', 'minecraft videos'] },
//             status: {
//                 privacyStatus: 'unlisted'
//             }
//         },
//         media: {
//             body: fs.createReadStream('./temp/aaaa.mp4'),
//         },
//     }

//     const youtube = google.youtube({
//         version: 'v3'
//     })

//     const res = await youtube.videos.insert(corpoRequisicao, {
//         onUploadProgress: onUploadProgress
//     })
//     console.log(">>> UPLOAD REALIZADO COM SUCESSO")
//     console.log(res.data);
//     return res.data

//     function onUploadProgress(event){
//         const progresso = Math.round((event.bytesRead / videoFileSize) * 100)
//         console.log(`> ${progresso} % concluido`)
//     }
// }
