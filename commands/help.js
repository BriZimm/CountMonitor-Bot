const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cr-help')
        .setDescription('Show a list of all available commands'),
    async execute(interaction) {
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) ||
                        interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        const embed = new EmbedBuilder()
            .setTitle('🤖 Count Rewards Bot Help')
            .setColor(0x5865f2)
            .setDescription('Here are the available commands:')
            .addFields(
                { name: '/cr-current', value: 'Show the current count and channel information', inline: false },
                { name: '/cr-add <goal> <description>', value: 'Request a reward for a specific count goal (requires staff approval)', inline: false },
                { name: '/cr-approval <mod_user_ids> <approval_channel>', value: 'Set up who should approve reward requests (Admin only)', inline: false },
                { name: '/cr-approve <goal> <action>', value: 'Approve or deny pending reward requests (Staff only)', inline: false },
                { name: '/cr-list', value: 'List all current approved rewards and their goals', inline: false },
                { name: '/cr-me', value: 'View what personal data the bot has stored about you', inline: false },
                { name: '/cr-remove-me', value: 'Permanently delete all your personal data from the bot', inline: false },
                { name: '/cr-ping', value: 'Check if the bot is responsive', inline: false },
                { name: '/cr-help', value: 'Show this help message', inline: false },
                { name: '/cr-set-channel <channel>', value: 'Set the count channel to monitor (Admin only)', inline: false },
                { name: '/cr-refresh-commands', value: 'Refresh slash commands for this server (Admin only)', inline: false }
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
