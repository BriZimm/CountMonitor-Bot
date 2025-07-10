const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cr-current')
        .setDescription('Show the current count and channel information'),
    
    async execute(interaction) {
        const guildId = interaction.guild.id;
        
        try {
            const server = await interaction.client.db.getServer(guildId);
            
            if (!server || !server.count_channel_id) {
                await interaction.reply({
                    content: '❌ No count channel has been set up yet! An admin can use `/set-count-channel` to configure one.',
                    ephemeral: true
                });
                return;
            }
            
            const channel = interaction.guild.channels.cache.get(server.count_channel_id);
            const channelMention = channel ? `<#${server.count_channel_id}>` : 'Channel not found';
            
            let currentCount = server.current_count;
            let lastCounterId = server.last_counter_id;
            // If current_count is missing or zero, scan the channel for the latest valid count
            if ((!currentCount || currentCount === 0) && channel) {
                try {
                    const messages = await channel.messages.fetch({ limit: 50 });
                    for (const msg of messages.values()) {
                        if (msg.author.bot) continue;
                        const num = parseInt(msg.content.trim(), 10);
                        if (!isNaN(num)) {
                            currentCount = num;
                            lastCounterId = msg.author.id;
                            await interaction.client.db.updateCount(guildId, currentCount, lastCounterId);
                            break;
                        }
                    }
                } catch (err) {
                    console.error('Error fetching messages for count detection:', err);
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('📊 Current Count Status')
                .setColor(0x00AE86)
                .addFields(
                    { name: 'Count Channel', value: channelMention, inline: true },
                    { name: 'Current Count', value: currentCount ? currentCount.toString() : 'N/A', inline: true }
                )
                .setTimestamp();

            if (lastCounterId) {
                const lastCounter = await interaction.guild.members.fetch(lastCounterId).catch(() => null);
                if (lastCounter) {
                    embed.addFields({
                        name: 'Last Counter',
                        value: `<@${lastCounterId}>`,
                        inline: true
                    });
                }
            }
            
            // Add upcoming rewards
            const rewards = await interaction.client.db.getRewards(guildId);
            const upcomingRewards = rewards.filter(r => !r.claimed && r.goal > server.current_count)
                .sort((a, b) => a.goal - b.goal)
                .slice(0, 3);
            
            if (upcomingRewards.length > 0) {
                const upcomingList = upcomingRewards.map(r => `**${r.goal}** - ${r.description}`).join('\n');
                embed.addFields({
                    name: '🎯 Next Rewards',
                    value: upcomingList,
                    inline: false
                });
            }
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error getting current count:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching the current count.',
                ephemeral: true
            });
        }
    }
};
