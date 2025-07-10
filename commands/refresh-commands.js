const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cr-refresh-commands')
        .setDescription('Refresh slash commands (Owner only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            // Re-register commands for this guild specifically
            const { REST, Routes } = require('discord.js');
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
            
            // Get all commands
            const commands = [];
            const fs = require('fs');
            const path = require('path');
            const commandsPath = path.join(__dirname, '../commands');
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                delete require.cache[require.resolve(filePath)]; // Clear cache
                const command = require(filePath);
                commands.push(command.data.toJSON());
            }
            
            // Register to this guild
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, interaction.guild.id),
                { body: commands }
            );
            
            console.log(`Commands refreshed for guild: ${interaction.guild.name}`);
            
            await interaction.editReply({
                content: `✅ Refreshed ${commands.length} commands for this server!\nCommands: ${commands.map(c => c.name).join(', ')}`
            });
            
        } catch (error) {
            console.error('Error refreshing commands:', error);
            await interaction.editReply({
                content: `❌ Error refreshing commands: ${error.message}`
            });
        }
    }
};
