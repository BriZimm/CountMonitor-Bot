const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cr-approval')
        .setDescription('Set up who should approve reward requests')
        .addStringOption(option =>
            option.setName('mod_usernames')
                .setDescription('Comma-separated Discord usernames of mods to notify (e.g. user#1234,user2#5678)')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('approval_channel')
                .setDescription('Channel to send reward approval requests to')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const modUsernamesRaw = interaction.options.getString('mod_usernames');
        const approvalChannel = interaction.options.getChannel('approval_channel');
        let modUserIds = [];
        let notFound = [];
        if (modUsernamesRaw) {
            const usernames = modUsernamesRaw.split(',').map(u => u.trim()).filter(Boolean);
            for (const username of usernames) {
                // Try to find user in guild by username#discriminator
                const member = interaction.guild.members.cache.find(m => `${m.user.username}#${m.user.discriminator}`.toLowerCase() === username.toLowerCase());
                if (member) {
                    modUserIds.push(member.user.id);
                } else {
                    notFound.push(username);
                }
            }
        }
        const approvalChannelId = approvalChannel ? approvalChannel.id : null;
        if (!modUserIds.length && !approvalChannelId) {
            await interaction.reply({
                content: '❌ You must specify at least one mod username or an approval channel.',
                ephemeral: true
            });
            return;
        }
        await interaction.client.db.setApprovalSettings(guildId, modUserIds, approvalChannelId);
        await interaction.reply({
            content: `✅ Approval settings updated!\n${modUserIds.length ? `Mods: ${modUserIds.join(', ')}` : ''}${modUserIds.length && approvalChannelId ? '\n' : ''}${approvalChannelId ? `Channel: <#${approvalChannelId}>` : ''}${notFound.length ? `\n⚠️ Not found: ${notFound.join(', ')}` : ''}`,
            ephemeral: true
        });
    }
};
