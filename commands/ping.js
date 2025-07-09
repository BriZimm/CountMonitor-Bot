const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Test command to verify bot is working'),
    
    async execute(interaction) {
        console.log('Ping command executed');
        await interaction.reply({
            content: '🏓 Pong! Bot is working correctly!',
            ephemeral: true
        });
    }
};
