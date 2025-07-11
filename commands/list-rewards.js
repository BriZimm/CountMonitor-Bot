const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cr-list')
        .setDescription('List all current rewards and their goals'),
    
    async execute(interaction) {
        const guildId = interaction.guild.id;
        
        try {
            const rewards = (await interaction.client.db.getRewards(guildId)).filter(r => r.status === 'approved');
            const server = await interaction.client.db.getServer(guildId);
            const currentCount = server ? server.current_count : 0;
            
            if (rewards.length === 0) {
                await interaction.reply({
                    content: '📋 No approved rewards have been set up yet! Use `/cr-add` to request one.',
                    ephemeral: true
                });
                return;
            }
            
            const embed = new EmbedBuilder()
                .setTitle('🎁 Current Rewards')
                .setDescription(`**Current Count:** ${currentCount}`)
                .setColor(0x00AE86)
                .setTimestamp();
            
            const activeRewards = rewards.filter(r => !r.claimed);
            const claimedRewards = rewards.filter(r => r.claimed);
            
            if (activeRewards.length > 0) {
                const activeRewardsList = activeRewards.map(reward => {
                    const status = reward.goal <= currentCount ? '✅ **READY**' : '⏳ Pending';
                    return `**Goal ${reward.goal}** ${status}\n${reward.description}\n*Provider: ${reward.provider_username}*`;
                }).join('\n\n');
                
                embed.addFields({
                    name: '🔥 Active Rewards',
                    value: activeRewardsList,
                    inline: false
                });
            }
            
            if (claimedRewards.length > 0) {
                const claimedRewardsList = claimedRewards.map(reward => {
                    return `**Goal ${reward.goal}** ✅ Claimed\n${reward.description}\n*Provider: ${reward.provider_username}*`;
                }).join('\n\n');
                
                embed.addFields({
                    name: '✅ Claimed Rewards',
                    value: claimedRewardsList,
                    inline: false
                });
            }
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error listing rewards:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching the rewards.',
                ephemeral: true
            });
        }
    }
};
