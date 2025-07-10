const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cr-me')
        .setDescription('View what personal data the bot has stored about you'),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            // Get user data
            const userData = await interaction.client.db.getUserData(interaction.user.id);
            
            const dataEmbed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle('📋 Your Personal Data')
                .setDescription('Here\'s what data the bot has stored about you:')
                .addFields(
                    { 
                        name: '🎁 Rewards Created', 
                        value: userData.rewards.length > 0 
                            ? userData.rewards.map(r => `• Goal: ${r.goal} - "${r.description}" ${r.claimed ? '(✅ Claimed)' : '(⏳ Pending)'}`).join('\n')
                            : 'No rewards created', 
                        inline: false 
                    },
                    { 
                        name: '🔢 Last Counter Status', 
                        value: userData.lastCounterIn.length > 0 
                            ? userData.lastCounterIn.map(s => `• Server: ${s.guild_id} (Count: ${s.current_count})`).join('\n')
                            : 'Not the last counter in any server', 
                        inline: false 
                    },
                    { 
                        name: '📊 Data Summary', 
                        value: `• **${userData.rewards.length}** reward(s) created\n• Last counter in **${userData.lastCounterIn.length}** server(s)\n• Discord ID: \`${interaction.user.id}\``, 
                        inline: false 
                    }
                )
                .setFooter({ text: 'Use /cr-remove-me to permanently delete this data' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [dataEmbed] });
            
        } catch (error) {
            console.error('Error fetching user data:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error Fetching Data')
                .setDescription('An error occurred while fetching your data. Please try again later.')
                .addFields({ 
                    name: 'Error Details:', 
                    value: `\`\`\`${error.message}\`\`\``, 
                    inline: false 
                })
                .setFooter({ text: 'If this error persists, please contact support' });
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
