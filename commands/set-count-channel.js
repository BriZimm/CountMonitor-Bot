const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-count-channel')
        .setDescription('Set the channel to monitor for counting')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to monitor')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;
        
        try {
            // Ensure server exists in database
            await interaction.client.db.createServer(guildId);
            
            // Set the count channel
            await interaction.client.db.setCountChannel(guildId, channel.id);
            
            await interaction.reply({
                content: `✅ Count channel set to ${channel}! The bot will now monitor this channel for counting.`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error setting count channel:', error);
            await interaction.reply({
                content: '❌ An error occurred while setting the count channel.',
                ephemeral: true
            });
        }
    }
};
