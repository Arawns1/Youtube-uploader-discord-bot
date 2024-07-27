import dotenv from 'dotenv'
dotenv.config()
export const TOKEN = process.env.DISCORD_TOKEN;
export const CANAL_CLIPES_ID = process.env.ID_CANAL_CLIPES
export const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
export const REQUEST_QUEUE_NAME = process.env.REQUEST_QUEUE_NAME
export const REPLY_QUEUE_NAME = process.env.REPLY_QUEUE_NAME
export const AMQP_SERVER = process.env.AMQP_SERVER