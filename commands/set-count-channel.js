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
        console.log(`set-count-channel command executed by ${interaction.user.tag}`);
        
        const channel = interaction.options.getChannel('channel');
        const guildId = interaction.guild.id;
        
        console.log(`Setting count channel to: ${channel.name} (${channel.id}) in guild: ${guildId}`);
        
        try {
            // Ensure server exists in database
            await interaction.client.db.createServer(guildId);
            console.log('Server created/verified in database');
            
            // Set the count channel
            await interaction.client.db.setCountChannel(guildId, channel.id);
            console.log('Count channel set in database');
            
            await interaction.reply({
                content: `✅ Count channel set to ${channel}! The bot will now monitor this channel for counting.`,
                ephemeral: true
            });
            console.log('Reply sent successfully');
        } catch (error) {
            console.error('Error setting count channel:', error);
            await interaction.reply({
                content: '❌ An error occurred while setting the count channel.',
                ephemeral: true
            });
        }
    }
};
