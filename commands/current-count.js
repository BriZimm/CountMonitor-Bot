const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('current-count')
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
            
            const embed = new EmbedBuilder()
                .setTitle('📊 Current Count Status')
                .setColor(0x00AE86)
                .addFields(
                    { name: 'Count Channel', value: channelMention, inline: true },
                    { name: 'Current Count', value: server.current_count.toString(), inline: true }
                )
                .setTimestamp();
            
            if (server.last_counter_id) {
                const lastCounter = await interaction.guild.members.fetch(server.last_counter_id).catch(() => null);
                if (lastCounter) {
                    embed.addFields({
                        name: 'Last Counter',
                        value: `<@${server.last_counter_id}>`,
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
