# 🚀 BetAnalyzer Bot - Deployment Guide

Quick deployment steps for Railway, Heroku, or your own VPS.

## Railway (Recommended) ⭐

**Cost:** $7/mo (shared with other bots)  
**Effort:** 5 minutes  
**Benefits:** Already using for Sharp Bot, git push deploy

### Steps:

1. **Go to Railway:** https://railway.app
2. **Create new project** → "Deploy from GitHub"
3. **Select repository:** `oddsifylabs/betanalyzer-bot`
4. **Configure environment variables:**
   ```
   TELEGRAM_BOT_TOKEN=<your_bot_token>
   ANTHROPIC_API_KEY=<your_anthropic_api_key>
   ```
5. **Deploy!** Railway auto-deploys on git push

### Get Your Tokens:

**Telegram Bot Token:**
1. Open Telegram
2. Message `@BotFather`
3. `/newbot` → follow prompts → get token

**Anthropic API Key:**
1. Go to https://console.anthropic.com
2. Create account → get API key
3. Copy and paste into Railway

---

## Heroku

**Cost:** $7/mo  
**Effort:** 10 minutes

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create betanalyzer-bot

# Set environment variables
heroku config:set TELEGRAM_BOT_TOKEN=<token>
heroku config:set ANTHROPIC_API_KEY=<key>

# Deploy
git push heroku main
```

---

## DigitalOcean / Vultr VPS

**Cost:** $2.50-4/mo  
**Effort:** 30 minutes (more control)

### Setup:

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs npm git

# Clone repo
git clone https://github.com/oddsifylabs/betanalyzer-bot.git
cd betanalyzer-bot

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
TELEGRAM_BOT_TOKEN=<your_token>
ANTHROPIC_API_KEY=<your_key>
EOF

# Run with PM2 (process manager)
npm install -g pm2
pm2 start bot.js --name "betanalyzer"
pm2 startup
pm2 save
```

### Keep Bot Running:

PM2 will auto-restart the bot if it crashes, and auto-start on reboot.

```bash
# Check status
pm2 status

# View logs
pm2 logs betanalyzer

# Stop bot
pm2 stop betanalyzer

# Restart bot
pm2 restart betanalyzer
```

---

## Your Own Machine (Development)

**Cost:** $0 (electricity only)  
**Effort:** 5 minutes

```bash
# Clone repo
git clone https://github.com/oddsifylabs/betanalyzer-bot.git
cd betanalyzer-bot

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your tokens

# Run locally
npm start
```

### Keep It Running 24/7:

Use `screen` or `tmux`:

```bash
# With screen
screen -S bot
npm start
# Press Ctrl+A, then D to detach

# Later, reconnect with:
screen -r bot
```

---

## Testing Your Bot

Once deployed, test in Telegram:

```
/start          → Welcome message
/upload_csv     → Upload a CSV file
/analyze        → Get AI recommendations
/stats          → View win rate
/tier           → See subscription options
/settings       → Check your account
```

### Test CSV Format:

Upload a file named `bets.csv` with:

```csv
pick,odds,stake,result
Man City ML,1.80,50,win
Liverpool O2.5,1.90,25,loss
Arsenal 1H,2.10,40,win
```

---

## Troubleshooting

### Bot not responding?

1. Check Railway logs: Dashboard → Logs
2. Verify token is correct
3. Check Anthropic API key is valid
4. View console errors with `pm2 logs` (VPS)

### "Bad credentials" error?

- Telegram token might be wrong (ask @BotFather again)
- Anthropic API key might be wrong (check console.anthropic.com)

### CSV upload fails?

- Make sure file is named `*.csv`
- Check CSV format (columns: pick, odds, stake, result)
- Verify file size is < 5MB

---

## Next Steps

1. Deploy to Railway (5 min)
2. Test with sample CSV
3. Share bot with users
4. Monitor logs & fix bugs
5. Add Whop payment integration (optional)

---

## Files

- `bot.js` - Main bot logic
- `package.json` - Dependencies
- `.env.example` - Config template
- `README.md` - Feature overview

Questions? Check `README.md` or update this guide.
