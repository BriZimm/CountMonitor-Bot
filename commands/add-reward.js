const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-reward')
        .setDescription('Add a reward for reaching a specific count goal')
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
            // Ensure server exists in database
            await interaction.client.db.createServer(guildId);
            
            // Check if reward for this goal already exists
            const existingReward = await interaction.client.db.getRewardByGoal(guildId, goal);
            if (existingReward) {
                await interaction.reply({
                    content: `❌ A reward already exists for goal **${goal}**! Only one reward per goal is allowed.`,
                    ephemeral: true
                });
                return;
            }
            
            // Get current count to check if goal is valid
            const server = await interaction.client.db.getServer(guildId);
            const currentCount = server ? server.current_count : 0;
            
            if (goal <= currentCount) {
                await interaction.reply({
                    content: `❌ Goal **${goal}** has already been reached! Current count is **${currentCount}**. Please choose a higher goal.`,
                    ephemeral: true
                });
                return;
            }
            
            // Add the reward
            await interaction.client.db.addReward(guildId, goal, description, userId, username);
            
            await interaction.reply({
                content: `✅ Reward added successfully!\n**Goal:** ${goal}\n**Reward:** ${description}\n**Provider:** ${username}`,
                ephemeral: false
            });
        } catch (error) {
            console.error('Error adding reward:', error);
            await interaction.reply({
                content: '❌ An error occurred while adding the reward.',
                ephemeral: true
            });
        }
    }
};
