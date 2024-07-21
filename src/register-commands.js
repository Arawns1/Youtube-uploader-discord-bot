import { REST, Routes } from 'discord.js'
import { DISCORD_CLIENT_ID, DISCORD_GUILD_ID, TOKEN } from './constantes.js'

const commands = [
    {
        name: 'yt',
        description: 'Sobe o video para o youtube do acervo'
    }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
try {
    console.log('Registering slash commands...');

    await rest.put(
        Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
        { body: commands },
    );

    console.log('Slash commands were registered successfully!');
} catch (error) {
    console.error(`There was an error: ${error}`)
}
})()