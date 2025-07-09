const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Test command to verify bot is working'),
    
    async execute(interaction) {
        console.log('Ping command executed successfully');
        
        const startTime = Date.now();
        await interaction.reply({
            content: '🏓 Pong! Bot is working correctly!',
            ephemeral: true
        });
        
        const endTime = Date.now();
        console.log(`Ping command response time: ${endTime - startTime}ms`);
        
        // Edit the reply to show more info
        setTimeout(async () => {
            try {
                await interaction.editReply({
                    content: `🏓 Pong! Bot is working correctly!\n📊 Response time: ${endTime - startTime}ms\n🔧 Guild: ${interaction.guild.name}\n👤 User: ${interaction.user.tag}`
                });
            } catch (error) {
                console.error('Error editing ping reply:', error);
            }
        }, 1000);
    }
};
