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
            console.log('Resolving usernames:', usernames);
            for (const username of usernames) {
                // Try to find user in guild by username#discriminator (case-insensitive, Unicode safe)
                const lower = username.toLowerCase();
                let member = interaction.guild.members.cache.find(m => `${m.user.username}#${m.user.discriminator}`.toLowerCase() === lower);
                // Fallback: try tag property if available (Discord.js v14+)
                if (!member && interaction.guild.members.cache.find(m => m.user.tag && m.user.tag.toLowerCase() === lower)) {
                    member = interaction.guild.members.cache.find(m => m.user.tag && m.user.tag.toLowerCase() === lower);
                }
                if (member) {
                    modUserIds.push(member.user.id);
                    console.log(`Resolved username: ${username} -> ${member.user.id}`);
                } else {
                    notFound.push(`user:${username}`);
                    console.log(`Could not resolve username: ${username}`);
                }
            }
        }
        if (approvalChannelName) {
            // Support channel mention (e.g. #approvals), channel ID, or plain name
            let channel = null;
            const trimmed = approvalChannelName.trim();
            // Try by ID (if numeric)
            if (/^\d+$/.test(trimmed)) {
                channel = interaction.guild.channels.cache.get(trimmed);
            }
            // Try by mention (e.g. <#1234567890>)
            if (!channel && /^<#\d+>$/.test(trimmed)) {
                const id = trimmed.replace(/[^\d]/g, '');
                channel = interaction.guild.channels.cache.get(id);
            }
            // Try by name (case-insensitive)
            if (!channel) {
                channel = interaction.guild.channels.cache.find(c => c.name.toLowerCase() === trimmed.replace(/^#/, '').toLowerCase());
            }
            if (channel) {
                approvalChannelId = channel.id;
                console.log(`Resolved channel: ${approvalChannelName} -> ${channel.id}`);
            } else {
                notFound.push(`#${approvalChannelName}`);
                console.log(`Could not resolve channel: ${approvalChannelName}`);
            }
        }
        console.log('modUserIds:', modUserIds, 'approvalChannelId:', approvalChannelId, 'notFound:', notFound);
        if (!modUserIds.length && !approvalChannelId) {
            await interaction.reply({
                content: `❌ You must specify at least one valid mod username or a valid channel name.\n${notFound.length ? 'Not found: ' + notFound.join(', ') : ''}`,
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
