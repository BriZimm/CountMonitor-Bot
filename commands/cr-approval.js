const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cr-approval')
        .setDescription('Set up who should approve reward requests')
        .addStringOption(option =>
            option.setName('mod_usernames')
                .setDescription('Comma-separated Discord usernames of mods to notify (e.g. user#1234,user2#5678)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('approval_channel')
                .setDescription('Channel name to send reward approval requests to (e.g. approvals)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const modUsernamesRaw = interaction.options.getString('mod_usernames');
        const approvalChannelName = interaction.options.getString('approval_channel');
        let modUserIds = [];
        let notFound = [];
        let approvalChannelId = null;
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
        if (approvalChannelName) {
            const channel = interaction.guild.channels.cache.find(c => c.name === approvalChannelName || c.id === approvalChannelName.replace(/[<#>]/g, ''));
            if (channel) {
                approvalChannelId = channel.id;
            } else {
                notFound.push(`#${approvalChannelName}`);
            }
        }
        if (!modUserIds.length && !approvalChannelId) {
            await interaction.reply({
                content: '❌ You must specify at least one mod username or a channel name.',
                ephemeral: true
            });
            return;
        }
        await interaction.client.db.setApprovalSettings(guildId, modUserIds, approvalChannelId);
        const resolvedMembers = modUserIds.map(id => interaction.guild.members.cache.get(id)).filter(Boolean);
        // Send DM to each resolved mod user
        for (const member of resolvedMembers) {
            try {
                await member.send('You have been designated as a reward approver in the Count Rewards Bot. You will be notified of new reward requests and can approve or deny them.');
            } catch (err) {
                // Ignore DM errors (user may have DMs disabled)
            }
        }
        await interaction.reply({
            content: `✅ Approval settings updated!`,
            ephemeral: true
        });
    }
};
