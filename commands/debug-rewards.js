const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug-rewards')
        .setDescription('Debug command to check rewards table (temporary)')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Debug action to perform')
                .setRequired(true)
                .addChoices(
                    { name: 'Show all rewards', value: 'all' },
                    { name: 'Show my rewards', value: 'mine' },
                    { name: 'Show rewards by user ID', value: 'user' }
                )
        )
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('User ID to check (for user action)')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const action = interaction.options.getString('action');
            const userId = interaction.options.getString('userid') || interaction.user.id;
            
            let debugInfo = '';
            
            if (action === 'all') {
                const allRewards = await interaction.client.db.debugRewardsTable();
                debugInfo = `**All rewards in database (${allRewards.length}):**\n` +
                    allRewards.map(r => `• Guild: ${r.guild_id}, Goal: ${r.goal}, Provider: ${r.provider_id}, Description: "${r.description}"`).join('\n');
            } else if (action === 'mine' || action === 'user') {
                const userData = await interaction.client.db.getUserData(userId);
                debugInfo = `**Rewards for user ${userId} (${userData.rewards.length}):**\n` +
                    (userData.rewards.length > 0 
                        ? userData.rewards.map(r => `• Guild: ${r.guild_id}, Goal: ${r.goal}, Description: "${r.description}", Claimed: ${r.claimed}`).join('\n')
                        : 'No rewards found');
            }
            
            if (debugInfo.length > 4096) {
                debugInfo = debugInfo.substring(0, 4090) + '...';
            }
            
            const debugEmbed = new EmbedBuilder()
                .setColor(0xFF9900)
                .setTitle('🔍 Debug Information')
                .setDescription(debugInfo || 'No data found')
                .setFooter({ text: 'This is a temporary debug command' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [debugEmbed] });
            
        } catch (error) {
            console.error('Error in debug command:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Debug Error')
                .setDescription(`Error: ${error.message}`)
                .setFooter({ text: 'Debug command failed' });
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
