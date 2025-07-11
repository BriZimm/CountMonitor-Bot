const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cr-approve')
        .setDescription('Approve or deny a pending reward request')
        .addIntegerOption(option =>
            option.setName('goal')
                .setDescription('The goal of the reward request to approve/deny')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Approve or deny the request')
                .setRequired(true)
                .addChoices(
                    { name: 'Approve', value: 'approve' },
                    { name: 'Deny', value: 'deny' }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const goal = interaction.options.getInteger('goal');
        const action = interaction.options.getString('action');
        // Only allow mods/admins
        const member = interaction.member;
        if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({ content: '❌ You do not have permission to approve/deny rewards.', ephemeral: true });
            return;
        }
        // Find the pending reward
        const rewards = await interaction.client.db.getRewards(guildId);
        const reward = rewards.find(r => r.goal === goal && r.status === 'pending');
        if (!reward) {
            await interaction.reply({ content: '❌ No pending reward request found for that goal.', ephemeral: true });
            return;
        }
        // Update status
        await interaction.client.db.query(
            'UPDATE rewards SET status = $1 WHERE guild_id = $2 AND goal = $3',
            [action === 'approve' ? 'approved' : 'denied', guildId, goal]
        );
        await interaction.reply({
            content: action === 'approve'
                ? `✅ Reward request for goal ${goal} has been approved!`
                : `❌ Reward request for goal ${goal} has been denied.`,
            ephemeral: false
        });
        // Optionally notify the provider
        try {
            const user = await interaction.client.users.fetch(reward.provider_id);
            if (user) {
                await user.send(
                    action === 'approve'
                        ? `Your reward request for goal ${goal} in ${interaction.guild.name} has been approved!`
                        : `Your reward request for goal ${goal} in ${interaction.guild.name} has been denied.`
                );
            }
        } catch (e) { /* ignore DM errors */ }
    }
};
