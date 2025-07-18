// Only load .env in development, not in production
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: ModalActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Database = require('./database-new');

// Start web server for static website
require('./web-server');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize database
client.db = new Database();

// Initialize commands collection
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
console.log(`Loading commands from: ${commandsPath}`);
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
console.log(`Found command files: ${commandFiles.join(', ')}`);

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
        const command = require(filePath);
        client.commands.set(command.data.name, command);
        console.log(`Loaded command: ${command.data.name}`);
    } catch (error) {
        console.error(`Error loading command ${file}:`, error);
    }
}

// Register slash commands
async function registerCommands() {
    const commands = [];
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');
        console.log(`Registering ${commands.length} commands:`, commands.map(c => c.name).join(', '));

        // Register commands globally
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Successfully reloaded global application (/) commands.');
        
        // Also register to each guild for faster updates during development
        for (const guild of client.guilds.cache.values()) {
            try {
                await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
                    { body: commands }
                );
                console.log(`Registered commands for guild: ${guild.name} (${guild.id})`);
            } catch (error) {
                console.error(`Failed to register commands for guild ${guild.name}:`, error);
            }
        }
        
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// Bot ready event
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Bot is in ${client.guilds.cache.size} servers`);
    
    // Test database connection
    client.db.getServer('test').then(() => {
        console.log('Database connection test: SUCCESS');
    }).catch(err => {
        console.error('Database connection test: FAILED', err);
    });
    
    registerCommands();
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
    // Handle button interactions for reward approval/deny
    if (interaction.isButton()) {
        const { customId, guild, user, message } = interaction;
        if (!guild) return;
        // Only allow staff (ManageGuild) to use these buttons
        const member = await guild.members.fetch(user.id);
        if (!member.permissions.has('ManageGuild')) {
            await interaction.reply({ content: '❌ You do not have permission to approve/deny rewards.', ephemeral: true });
            return;
        }
        // Parse button customId
        const approveMatch = customId.match(/^approve_reward_(.+)_(\d+)$/);
        const denyMatch = customId.match(/^deny_reward_(.+)_(\d+)$/);
        let action = null, guildId = null, goal = null;
        if (approveMatch) {
            action = 'approve';
            guildId = approveMatch[1];
            goal = parseInt(approveMatch[2]);
        } else if (denyMatch) {
            action = 'deny';
            guildId = denyMatch[1];
            goal = parseInt(denyMatch[2]);
        }
        if (action && guildId && goal) {
            // Find the pending reward
            const rewards = await client.db.getRewards(guildId);
            const reward = rewards.find(r => r.goal === goal && r.status === 'pending');
            if (!reward) {
                await interaction.reply({ content: '❌ No pending reward request found for that goal.', ephemeral: true });
                return;
            }
            if (action === 'approve') {
                await client.db.query(
                    'UPDATE rewards SET status = $1 WHERE guild_id = $2 AND goal = $3',
                    ['approved', guildId, goal]
                );
                // Disable buttons after approval
                const disabledRow = message.components.map(row => {
                    return {
                        ...row,
                        components: row.components.map(btn => ({ ...btn, disabled: true }))
                    };
                });
                await message.edit({ components: disabledRow });
                await interaction.reply({
                    content: `✅ Reward request for goal ${goal} has been approved!`,
                    ephemeral: false
                });
                try {
                    const provider = await client.users.fetch(reward.provider_id);
                    if (provider) {
                        await provider.send(`Your reward request for goal ${goal} in ${guild.name} has been approved!`);
                    }
                } catch (e) { /* ignore DM errors */ }
            } else if (action === 'deny') {
                // Show modal for denial reason
                const modal = new ModalBuilder()
                    .setCustomId(`deny_reason_modal_${guildId}_${goal}_${message.id}`)
                    .setTitle('Deny Reward Request')
                    .addComponents(
                        new ModalActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('deny_reason')
                                .setLabel('Reason for denial')
                                .setStyle(TextInputStyle.Paragraph)
                                .setRequired(true)
                        )
                    );
                await interaction.showModal(modal);
            }
            return;
        }
    }
    // Handle modal submit for denial reason
    if (interaction.isModalSubmit()) {
        const modalMatch = interaction.customId.match(/^deny_reason_modal_(.+)_(\d+)_(\d+)$/);
        if (modalMatch) {
            const guildId = modalMatch[1];
            const goal = parseInt(modalMatch[2]);
            const messageId = modalMatch[3];
            const reason = interaction.fields.getTextInputValue('deny_reason');
            // Update status and store reason (optionally add a denial_reason column, or just notify)
            await client.db.query(
                'UPDATE rewards SET status = $1 WHERE guild_id = $2 AND goal = $3',
                ['denied', guildId, goal]
            );
            // Fetch the original approval message and disable buttons
            try {
                const channel = interaction.channel;
                const approvalMsg = await channel.messages.fetch(messageId);
                if (approvalMsg) {
                    const disabledRow = approvalMsg.components.map(row => {
                        return {
                            ...row,
                            components: row.components.map(btn => ({ ...btn, disabled: true }))
                        };
                    });
                    await approvalMsg.edit({ components: disabledRow });
                }
            } catch (e) { /* ignore fetch/edit errors */ }
            await interaction.reply({
                content: `❌ Reward request for goal ${goal} has been denied.`,
                ephemeral: false
            });
            // Notify the provider with the denial reason via DM only
            const rewards = await client.db.getRewards(guildId);
            const reward = rewards.find(r => r.goal === goal);
            if (reward) {
                try {
                    const provider = await client.users.fetch(reward.provider_id);
                    if (provider) {
                        await provider.send(`Your reward request for goal ${goal} in ${interaction.guild.name} has been denied.\nReason: ${reason}`);
                    }
                } catch (e) { /* ignore DM errors */ }
            }
            return;
        }
    }

    console.log(`Interaction received: ${interaction.type} - ${interaction.isCommand ? interaction.commandName : 'Not a command'}`);
    
    if (!interaction.isChatInputCommand()) {
        console.log('Not a chat input command, ignoring');
        return;
    }

    console.log(`Command received: ${interaction.commandName} from ${interaction.user.tag} in guild: ${interaction.guild?.name || 'DM'}`);
    console.log(`Guild ID: ${interaction.guild?.id}, Channel ID: ${interaction.channel?.id}`);

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.log(`Command ${interaction.commandName} not found in commands collection`);
        console.log('Available commands:', Array.from(client.commands.keys()));
        await interaction.reply({
            content: `❌ Command not found: ${interaction.commandName}`,
            ephemeral: true
        });
        return;
    }

    console.log(`Executing command: ${interaction.commandName}`);
    
    try {
        await command.execute(interaction);
        console.log(`Command ${interaction.commandName} executed successfully`);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        const reply = {
            content: `❌ There was an error while executing this command!\n\`\`\`${error.message}\`\`\``,
            ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
        } else {
            await interaction.reply(reply);
        }
    }
});

// Monitor count channel messages
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    try {
        const server = await client.db.getServer(message.guild.id);
        if (!server || !server.count_channel_id || message.channel.id !== server.count_channel_id) {
            return;
        }
        
        const content = message.content.trim();
        
        // Check if message is a valid number
        if (!/^\d+$/.test(content)) {
            return; // Not a number, ignore
        }
        
        const messageCount = parseInt(content);
        
        // Update database with the new count (assuming another bot validates correctness)
        await client.db.updateCount(message.guild.id, messageCount, message.author.id);
        
        // Check for rewards that should be triggered
        const unclaimedRewards = await client.db.getUnclaimedRewards(message.guild.id, messageCount);
        
        for (const reward of unclaimedRewards) {
            if (reward.goal === messageCount) {
                // This reward goal was just reached
                await client.db.markRewardClaimed(reward.id);
                await client.db.addAchievement(message.guild.id, reward.goal);
                
                // Notify the reward provider
                try {
                    const provider = await client.users.fetch(reward.provider_id);
                    const rewardEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('🎉 Reward Goal Reached!')
                        .setDescription(`The count has reached **${reward.goal}** in **${message.guild.name}**!`)
                        .addFields(
                            { name: 'Your Reward', value: reward.description, inline: false },
                            { name: 'Server', value: message.guild.name, inline: true },
                            { name: 'Channel', value: `<#${message.channel.id}>`, inline: true }
                        )
                        .setFooter({ text: 'Time to deliver your reward!' })
                        .setTimestamp();
                    
                    await provider.send({ embeds: [rewardEmbed] });
                } catch (error) {
                    console.error('Error notifying reward provider:', error);
                }
                
                // Announce in the channel
                const celebrationEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🎊 GOAL REACHED!')
                    .setDescription(`**${reward.goal}** reached! <@${reward.provider_id}> has been notified about their reward.`)
                    .addFields({
                        name: 'Reward',
                        value: reward.description,
                        inline: false
                    })
                    .setFooter({ text: 'Congratulations Everyone!' });
                
                await message.channel.send({ embeds: [celebrationEmbed] });
            }
        }
        
        // Milestone celebrations (every 100)
        if (messageCount % 100 === 0) {
            const milestoneEmbed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🎯 Milestone Reached!')
                .setDescription(`Congratulations! We've reached **${messageCount}**!`)
                .setFooter({ text: 'Keep counting!' });
            
            await message.channel.send({ embeds: [milestoneEmbed] });
        }
        
    } catch (error) {
        console.error('Error processing count message:', error);
    }
});

// Handle bot shutdown
process.on('SIGINT', () => {
    console.log('Shutting down bot...');
    client.db.close();
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Shutting down bot...');
    client.db.close();
    client.destroy();
    process.exit(0);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
