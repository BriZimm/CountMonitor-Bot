const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cr-approval')
        .setDescription('Set up who should approve reward requests')
        .addStringOption(option =>
            option.setName('mod_user_ids')
                .setDescription('Comma-separated user IDs of mods to notify (leave blank if using a channel)')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('approval_channel')
                .setDescription('Channel to send reward approval requests to')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const modUserIdsRaw = interaction.options.getString('mod_user_ids');
        const approvalChannel = interaction.options.getChannel('approval_channel');
        const modUserIds = modUserIdsRaw ? modUserIdsRaw.split(',').map(id => id.trim()).filter(Boolean) : [];
        const approvalChannelId = approvalChannel ? approvalChannel.id : null;

        if (!modUserIds.length && !approvalChannelId) {
            await interaction.reply({
                content: '❌ You must specify at least one mod user ID or an approval channel.',
                ephemeral: true
            });
            return;
        }

        await interaction.client.db.setApprovalSettings(guildId, modUserIds, approvalChannelId);
        await interaction.reply({
            content: `✅ Approval settings updated!\n${modUserIds.length ? `Mods: ${modUserIds.join(', ')}` : ''}${modUserIds.length && approvalChannelId ? '\n' : ''}${approvalChannelId ? `Channel: <#${approvalChannelId}>` : ''}`,
            ephemeral: true
        });
    }
};
