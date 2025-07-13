const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cr-set-channel')
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

            // Fetch latest messages and find the most recent valid count
            let detectedCount = 0;
            try {
                const messages = await channel.messages.fetch({ limit: 50 });
                // Debug: log the last 10 message contents and authors
                let debugLog = Array.from(messages.values()).slice(0, 10).map(m => `[${m.author.username}]: ${m.content}`).join('\n');
                console.log('Last 10 messages in channel:\n' + debugLog);
                for (const msg of messages.values()) {
                    if (msg.author.bot) continue;
                    // Accept numbers even if there is extra text (e.g. "1234!" or "Count: 1234")
                    const match = msg.content.match(/\b(\d{1,10})\b/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (!isNaN(num)) {
                            detectedCount = num;
                            break;
                        }
                    }
                }
                if (detectedCount > 0) {
                    await interaction.client.db.updateCount(guildId, detectedCount, null);
                    console.log(`Detected last count in channel: ${detectedCount}`);
                } else {
                    console.log('No valid count found in recent messages.');
                }
            } catch (err) {
                console.error('Error fetching messages for count detection:', err);
            }

            await interaction.reply({
                content: `✅ Count channel set to ${channel}! The bot will now monitor this channel for counting.\n` +
                    (detectedCount > 0
                        ? `Last detected count in this channel: **${detectedCount}**.`
                        : 'No valid count found in the last 50 messages.'),
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
