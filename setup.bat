@echo off
echo Setting up Count Monitor Bot...

echo.
echo 1. Installing dependencies...
call npm install

echo.
echo 2. Creating .env file...
if not exist .env (
    copy .env.example .env
    echo .env file created! Please edit it with your Discord bot token and client ID.
) else (
    echo .env file already exists.
)

echo.
echo Setup complete! 
echo.
echo Next steps:
echo 1. Edit .env file with your Discord bot token and client ID
echo 2. Run 'npm start' to start the bot
echo.
pause
