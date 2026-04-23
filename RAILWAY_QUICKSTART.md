# Quick Railway Setup (5 Minutes)

## Step 1: Get Your Tokens

### Telegram Bot Token:
1. Open Telegram, message **@BotFather**
2. Send `/newbot`
3. Follow prompts → copy token

**Format:** `123456789:ABCdefGHIjklmnoPQRstuvWxyz`

### Anthropic API Key:
1. Go to https://console.anthropic.com
2. Sign up (if needed)
3. Create API key from dashboard
4. Copy key

**Format:** `sk-ant-...`

---

## Step 2: Deploy to Railway

1. Go to **https://railway.app**
2. Sign in (GitHub account easiest)
3. Click **"New Project"**
4. Select **"Deploy from GitHub"**
5. Connect GitHub → authorize
6. Select **`oddsifylabs/betanalyzer-bot`**
7. Choose deployment settings (defaults fine)
8. Click **"Deploy"**

---

## Step 3: Set Environment Variables

After Railway creates your deployment:

1. In Railway dashboard, find your app
2. Click **"Variables"** tab
3. Add these variables:

```
TELEGRAM_BOT_TOKEN = <your_token_from_BotFather>
ANTHROPIC_API_KEY = <your_key_from_console.anthropic.com>
```

4. Click **"Save"**
5. Railway auto-redeploys with new vars

---

## Step 4: Start Using Your Bot

Open Telegram and test:

```
/start          → See welcome message
/help           → List all commands
/upload_csv     → Upload bet picks
/analyze        → Get AI analysis
/stats          → View performance
/tier           → See subscription options
```

---

## That's It! 🎉

Your bot is now live and available to your users.

**Cost:** $7/mo (shared with other bots on Railway)

**What's included:**
- Unlimited uptime
- Auto-restart if crashes
- Built-in monitoring & logs
- 1GB RAM / 0.5 CPU

---

## Next Steps

- Test with sample CSV file
- Share bot link with users
- Monitor logs in Railway dashboard
- Add payment integration (optional)

---

## Troubleshooting

**Bot not responding?**
- Check Railway logs: Dashboard → "Deployments" → "View Logs"
- Verify tokens are correct
- Restart deployment if needed

**Need help?**
- See `DEPLOYMENT.md` for detailed instructions
- Check `README.md` for features
