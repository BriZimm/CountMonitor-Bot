# Count Monitor Bot

A Discord bot that monitors count channels and manages rewards based on counting milestones.

## Features

- Monitor a designated count channel for number tracking
- Automatically track counting progress (validation handled by another bot)
- Allow users to create rewards for specific count goals
- Notify reward providers when goals are reached
- Limit one reward per goal
- List current rewards and goals
- Celebrate milestones every 100 counts

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. **Get your Discord bot token:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to "Bot" section and create a bot
   - **Important**: In the Bot section, scroll down to "Privileged Gateway Intents"
   - Enable "Message Content Intent" (required for reading message content)
   - Copy the token

3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file with your Discord bot token and client ID

5. **Create bot invite URL:**
   - Go to OAuth2 → URL Generator
   - Select "bot" and "applications.commands" scopes
   - Select permissions: Send Messages, Use Slash Commands, Read Messages, Read Message History
   - Copy the generated URL (save this for installing on servers)

6. **Install bot on your server:**
   - Use the invite URL from step 5
   - Select the server where you want to install the bot
   - Confirm the permissions

7. Run the bot:
   ```bash
   npm start
   ```

## Commands

- `/set-count-channel <channel>` - Set the count channel to monitor (Admin only)
- `/add-reward <goal> <description>` - Add a reward for a specific count goal
- `/list-rewards` - List all current rewards and their goals
- `/current-count` - Show the current count

## Permissions Required

The bot needs the following permissions:
- Read Messages
- Read Message History
- Send Messages
- Use Slash Commands

**Important**: You must enable the "Message Content Intent" in the Discord Developer Portal under Bot → Privileged Gateway Intents.

Note: This bot assumes another bot handles count validation and rule enforcement.

## Database

The bot uses SQLite to store:
- Server configurations
- Count tracking
- Reward information
- Goal achievements

## Troubleshooting

### "Used disallowed intents" Error
This error occurs when the Message Content Intent is not enabled. To fix:

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to "Bot" section
4. Scroll down to "Privileged Gateway Intents"
5. Enable "Message Content Intent"
6. Save changes and restart the bot

### Bot doesn't respond to commands
- Make sure the bot has been invited with the correct permissions
- Check that slash commands are registered (they appear when you type `/`)
- Verify the bot token and client ID in your `.env` file

### Bot doesn't detect counting
- Ensure the count channel is set using `/set-count-channel`
- Verify the bot can read messages in the count channel
- Check that messages are valid numbers (digits only)

### Bot not staying online
- The bot only runs while your computer/server is on
- For 24/7 uptime, consider cloud hosting options above
- Check your hosting service logs for any crash errors

### Permission errors
- Make sure the bot has the required permissions in your server
- Check that the bot role is higher than roles it needs to interact with
- Verify channel permissions allow the bot to read/send messages

### Token Invalid Error
This error occurs when the Discord bot token is missing or incorrect in your deployment environment:

1. **Check your token:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Select your application → Bot
   - Click "Reset Token" to generate a new one
   - Copy the new token immediately (it won't be shown again)

2. **Set environment variables in your hosting platform:**

   **For Railway:**
   - Go to your Railway dashboard
   - Click on your project
   - Go to "Variables" tab
   - Add: `DISCORD_TOKEN=your_actual_token_here`
   - Add: `CLIENT_ID=your_client_id_here`

   **For Render:**
   - Go to your service dashboard
   - Click "Environment"
   - Add environment variables:
     - `DISCORD_TOKEN`: your_actual_token_here
     - `CLIENT_ID`: your_client_id_here

   **For Heroku:**
   - Go to your app dashboard
   - Click "Settings" → "Config Vars"
   - Add: `DISCORD_TOKEN` = your_actual_token_here
   - Add: `CLIENT_ID` = your_client_id_here

   **For Cyclic:**
   - Go to your app dashboard
   - Click "Variables"
   - Add environment variables with your token and client ID

3. **Redeploy your application** after setting the environment variables

4. **Common token issues:**
   - Make sure you're using the BOT token, not the client secret
   - Don't include quotes around the token in environment variables
   - Ensure there are no extra spaces or characters
   - If you regenerated the token, update it everywhere

# Install URL: 
https://discord.com/oauth2/authorize?client_id=1330684676679143476&permissions=277025467456&integration_type=0&scope=bot+applications.commands

## Installation & Deployment

### **Installing on Your Server**

1. **Generate invite URL:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Select your application → OAuth2 → URL Generator
   - Select scopes: `bot` and `applications.commands`
   - Select permissions: `Send Messages`, `Use Slash Commands`, `Read Messages`, `Read Message History`
   - Copy the generated URL

2. **Add to server:**
   - Open the invite URL in your browser
   - Select the server where you want to install the bot
   - Click "Authorize"

3. **Set up the bot:**
   - Use `/set-count-channel #your-counting-channel` to configure the count channel
   - Start adding rewards with `/add-reward`

### **Hosting Options**

#### **Local Development:**
- Run `npm start` on your local machine
- Bot will be online as long as your computer is running

#### **Cloud Hosting (Recommended for 24/7 uptime):**

**Free Options:**
- **Railway**: Great for Node.js bots, easy deployment, includes database storage
- **Render**: Free tier with good uptime, includes static site hosting
- **Heroku**: Free tier available (with limitations)
- **Fly.io**: Free tier for small apps
- **Cyclic**: Free hosting for Node.js apps with built-in database

**Free Database Options:**
- **Railway**: Includes PostgreSQL database
- **Supabase**: Free PostgreSQL database (2GB storage)
- **PlanetScale**: Free MySQL database (5GB storage)
- **MongoDB Atlas**: Free MongoDB database (512MB storage)
- **SQLite**: File-based database (works on most hosting platforms)

**Free Static Website Hosting:**
- **Netlify**: Perfect for simple websites, easy deployment
- **Vercel**: Great for static sites and simple web apps
- **GitHub Pages**: Free hosting directly from your GitHub repo
- **Cloudflare Pages**: Fast and reliable static hosting

**Paid Options:**
- **DigitalOcean**: $5/month droplet
- **AWS EC2**: Various pricing tiers
- **VPS providers**: Usually $3-10/month

#### **Quick Railway Deployment:**
1. Create account at [Railway](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables (DISCORD_TOKEN, CLIENT_ID)
4. Deploy automatically

#### **Complete Free Solution (Recommended):**

**For Discord Bot + Database:**
1. **Railway** (Free tier):
   - Deploy your bot directly from GitHub
   - Includes PostgreSQL database
   - 500 hours/month free (about 20 days)
   - Simple deployment process

**For Simple Webpage:**
1. **Netlify** (Free tier):
   - Perfect for simple HTML/CSS/JS websites
   - Deploy directly from GitHub
   - Custom domain support
   - Automatic deployments

#### **Alternative Free Stack:**

**Bot Hosting: Render**
- Free tier with good uptime
- Automatic deployments from GitHub
- Built-in database options

**Website Hosting: Vercel**
- Great for static sites and simple web apps
- Lightning fast deployment
- Custom domains included

#### **Database Migration from SQLite:**

If you want to use a cloud database instead of SQLite:

1. **For PostgreSQL (Railway/Supabase):**
   - Update your database.js to use `pg` instead of `sqlite3`
   - Modify connection strings

2. **For MySQL (PlanetScale):**
   - Update to use `mysql2` package
   - Adjust queries for MySQL syntax

3. **For MongoDB (Atlas):**
   - Switch to `mongoose` package
   - Redesign schema for document database

### **Making Your Bot Public**

If you want others to install your bot:

1. **In Discord Developer Portal:**
   - Go to "General Information"
   - Make sure "Public Bot" is enabled
   - Add a good description and avatar

2. **Host your bot 24/7** (use cloud hosting options above)

3. **Share your invite URL** with others

4. **Optional**: Submit to bot listing sites like:
   - top.gg
   - discord.bots.gg
   - discordbotlist.com
