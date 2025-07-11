const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cr-add')
        .setDescription('Request a reward for reaching a specific count goal')
        .addIntegerOption(option =>
            option.setName('goal')
                .setDescription('The count goal to reach')
                .setRequired(true)
                .setMinValue(1))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Description of the reward')
                .setRequired(true)
                .setMaxLength(500)),
    async execute(interaction) {
        const goal = interaction.options.getInteger('goal');
        const description = interaction.options.getString('description');
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const username = interaction.user.username;
        try {
            await interaction.client.db.createServer(guildId);
            const existingReward = await interaction.client.db.getRewardByGoal(guildId, goal);
            if (existingReward) {
                await interaction.reply({
                    content: `❌ A reward already exists for goal **${goal}**! Only one reward per goal is allowed.`,
                    ephemeral: true
                });
                return;
            }
            const server = await interaction.client.db.getServer(guildId);
            const currentCount = server ? server.current_count : 0;
            if (goal <= currentCount) {
                await interaction.reply({
                    content: `❌ Goal **${goal}** has already been reached! Current count is **${currentCount}**. Please choose a higher goal.`,
                    ephemeral: true
                });
                return;
            }
            // Add the reward as pending
            await interaction.client.db.query(
                'INSERT INTO rewards (guild_id, goal, description, provider_id, provider_username, status) VALUES ($1, $2, $3, $4, $5, $6)',
                [guildId, goal, description, userId, username, 'pending']
            );
            // Notify approvers
            const approvalSettings = await interaction.client.db.getApprovalSettings(guildId);
            let notified = false;
            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`approve_reward_${guildId}_${goal}`)
                    .setLabel('Approve')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`deny_reward_${guildId}_${goal}`)
                    .setLabel('Deny')
                    .setStyle(ButtonStyle.Danger)
            );
            if (approvalSettings) {
                // Notify channel if set
                if (approvalSettings.approval_channel_id) {
                    const channel = interaction.guild.channels.cache.get(approvalSettings.approval_channel_id);
                    if (channel) {
                        const embed = new EmbedBuilder()
                            .setTitle('New Reward Request')
                            .setDescription(`A new reward request needs approval!`)
                            .addFields(
                                { name: 'Goal', value: goal.toString(), inline: true },
                                { name: 'Description', value: description, inline: false },
                                { name: 'Requested by', value: username, inline: true }
                            )
                            .setColor(0xfca326)
                            .setTimestamp();
                        await channel.send({ embeds: [embed], components: [actionRow] });
                        notified = true;
                    }
                }
                // Notify mod users if set
                if (approvalSettings.mod_user_ids) {
                    const modIds = approvalSettings.mod_user_ids.split(',').map(id => id.trim()).filter(Boolean);
                    for (const modId of modIds) {
                        try {
                            const user = await interaction.client.users.fetch(modId);
                            if (user) {
                                await user.send({
                                    content: `A new reward request for **Goal ${goal}** in **${interaction.guild.name}** needs approval.\nDescription: ${description}\nRequested by: ${username}`,
                                    components: [actionRow]
                                });
                                notified = true;
                            }
                        } catch (e) { /* ignore DM errors */ }
                    }
                }
            }
            await interaction.reply({
                content: `✅ Your reward request has been submitted for approval.${notified ? ' Staff will be notified.' : ' Please contact a server admin for approval setup.'}`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Error requesting reward:', error);
            await interaction.reply({
                content: '❌ An error occurred while submitting your reward request.',
                ephemeral: true
            });
        }
    }
};
