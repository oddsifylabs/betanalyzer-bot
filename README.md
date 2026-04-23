# BetAnalyzer Telegram Bot

AI-powered sports bet analysis in Telegram. Upload your picks, get Claude AI recommendations.

## Features

- 📤 CSV upload for bet picks
- 🤖 Claude AI analysis (PLACE/PASS recommendations)
- 📊 Performance stats & win rate tracking
- 💎 Tiered subscription system
- ⚡ Instant recommendations

## Commands

- `/start` - Welcome message
- `/upload_csv` - Upload bet picks file
- `/analyze` - Get AI recommendations
- `/stats` - View performance
- `/tier` - See subscription options
- `/settings` - Manage preferences

## Setup

### 1. Create Telegram Bot
```bash
@BotFather on Telegram
/newbot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your tokens
```

### 4. Run Locally
```bash
npm run dev
```

### 5. Deploy to Railway
```bash
git push heroku main
```

## CSV Format

Your CSV should have these columns:

```
pick,odds,stake,result
Man City ML,1.80,50,win
Liverpool O2.5,1.90,25,loss
Arsenal 1H,2.10,40,win
```

## Monetization

- **Free**: 1 analysis/day
- **Pro**: $9.99/mo - Unlimited analyses + stats export
- **Elite**: $999 lifetime - Everything + private channel

## Integration

This bot works standalone but can be merged with:
- AlexBET Sharp Bot (gem sharing)
- AlexBET Lite (unified dashboard)

## Future Features

- Live game odds integration
- Bankroll management
- Multi-sport support
- Bet notifications
- Sharp line detection
