# Railway Deployment Guide

This guide shows how to deploy the Count Rewards Bot to Railway with PostgreSQL for persistent data storage.

## Prerequisites

- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))
- Your Discord bot token and client ID

## Deployment Steps

### 1. Push Code to GitHub

1. Create a new repository on GitHub
2. Push your bot code to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

### 2. Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your bot repository
5. Railway will automatically detect it's a Node.js project

### 3. Add PostgreSQL Database

1. In your Railway project dashboard, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will create a PostgreSQL database and generate a connection string

### 4. Configure Environment Variables

1. Click on your service (not the database)
2. Go to "Variables" tab
3. Add these environment variables:
   ```
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   DATABASE_TYPE=postgresql
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

   Note: `${{Postgres.DATABASE_URL}}` automatically uses Railway's PostgreSQL connection string.

### 5. Deploy

1. Railway will automatically deploy your bot
2. Check the "Deployments" tab for build status
3. View logs in the "Logs" tab

## Verification

1. **Check bot status:** Your bot should appear online in Discord
2. **Test commands:** Try `/ping` to verify the bot responds
3. **Check database:** Use `/set-count-channel` and `/add-reward` to test database functionality
4. **Verify persistence:** Redeploy the project and check if data persists

## Troubleshooting

### Bot not starting
- Check the "Logs" tab for error messages
- Ensure `DISCORD_TOKEN` and `CLIENT_ID` are set correctly
- Verify the PostgreSQL database is running

### Database connection errors
- Check that `DATABASE_URL` is properly configured
- Ensure the PostgreSQL service is running
- Look for connection errors in the logs

### Commands not working
- Verify the bot has proper permissions in your Discord server
- Check that slash commands are registered (visible when typing `/`)
- Ensure the Message Content Intent is enabled in Discord Developer Portal

## Railway Benefits

- **Automatic PostgreSQL**: No need to set up database separately
- **Persistent storage**: Data survives deployments and restarts
- **Easy scaling**: Can upgrade resources as needed
- **GitHub integration**: Automatic deployments on code changes
- **Free tier**: Good for development and small communities

## Cost Considerations

- **Free tier**: $5 credit monthly (usually enough for small bots)
- **Database**: PostgreSQL included in usage costs
- **Scaling**: Pay-as-you-grow pricing
- **Monitoring**: Built-in metrics and logging

## Next Steps

1. **Custom domain**: Add a custom domain for your bot's website
2. **Monitoring**: Set up alerts for downtime or errors
3. **Backup**: Consider database backup strategies for important data
4. **Scaling**: Monitor usage and upgrade resources as needed

## Environment Variables Reference

| Variable | Value | Purpose |
|----------|-------|---------|
| `DISCORD_TOKEN` | Your bot token | Discord API authentication |
| `CLIENT_ID` | Your bot's client ID | Discord application ID |
| `DATABASE_TYPE` | `postgresql` | Database type selection |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | PostgreSQL connection string |

The bot automatically handles database setup and table creation on first run.
