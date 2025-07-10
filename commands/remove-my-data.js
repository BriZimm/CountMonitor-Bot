const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cr-remove-data')
        .setDescription('Remove all your personal data from the bot\'s database')
        .addBooleanOption(option =>
            option.setName('confirm')
                .setDescription('Confirm that you want to permanently delete your data')
                .setRequired(true)
        ),
    async execute(interaction) {
        const confirm = interaction.options.getBoolean('confirm');
        
        if (!confirm) {
            const warningEmbed = new EmbedBuilder()
                .setColor(0xFFFF00)
                .setTitle('⚠️ Data Removal Confirmation Required')
                .setDescription('To remove your data, you must set the `confirm` option to `true`.')
                .addFields(
                    { 
                        name: 'What will be removed:', 
                        value: '• All rewards you\'ve created\n• Your association as the last counter in any server\n• Any other personal data linked to your Discord ID', 
                        inline: false 
                    },
                    { 
                        name: 'Note:', 
                        value: 'This action is **permanent** and cannot be undone!', 
                        inline: false 
                    }
                )
                .setFooter({ text: 'Use /remove-my-data confirm:true to proceed' });
            
            await interaction.reply({ embeds: [warningEmbed], ephemeral: true });
            return;
        }

        try {
            await interaction.deferReply({ ephemeral: true });
            
            // First, get user data to show what will be removed
            const userData = await interaction.client.db.getUserData(interaction.user.id);
            
            // Remove the user's data
            await interaction.client.db.removeUserData(interaction.user.id);
            
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Data Removed Successfully')
                .setDescription('Your personal data has been permanently removed from our database.')
                .addFields(
                    { 
                        name: 'Removed Data:', 
                        value: `• **${userData.rewards.length}** reward(s) you created\n• Last counter status in **${userData.lastCounterIn.length}** server(s)\n• All other personal data linked to your Discord ID`, 
                        inline: false 
                    },
                    { 
                        name: 'What happens next:', 
                        value: '• You can still use the bot normally\n• You can create new rewards if needed\n• Your data will only be stored again if you interact with the bot', 
                        inline: false 
                    }
                )
                .setFooter({ text: 'Thank you for using Count Monitor Bot!' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [successEmbed] });
            
            // Log the data removal
            console.log(`User ${interaction.user.tag} (${interaction.user.id}) removed their data. Removed: ${userData.rewards.length} rewards, ${userData.lastCounterIn.length} last counter associations`);
            
        } catch (error) {
            console.error('Error removing user data:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Error Removing Data')
                .setDescription('An error occurred while removing your data. Please try again later.')
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
