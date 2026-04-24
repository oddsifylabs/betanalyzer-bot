const { Telegraf } = require('telegraf');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const client = new Anthropic();

// In-memory user data (replace with Supabase for production)
const userData = {};

// Middleware: track user
bot.use((ctx, next) => {
  const userId = ctx.from.id;
  if (!userData[userId]) {
    userData[userId] = {
      tier: 'free',
      uploadedBets: [],
      lastAnalysis: null,
    };
  }
  return next();
});

// /start command
bot.command('start', async (ctx) => {
  try {
    ctx.reply(
      'BetAnalyzer Bot - Your AI Betting Assistant\n\n' +
      'Convert your sports bets into AI-powered analysis.\n\n' +
      'COMMANDS:\n' +
      '• /upload_csv - Upload your bet picks (CSV)\n' +
      '• /analyze - Get Claude AI recommendations\n' +
      '• /stats - View your performance\n' +
      '• /tier - See subscription options\n' +
      '• /help - Show all commands\n\n' +
      'CSV Format: pick, odds, stake, result'
    );
  } catch (error) {
    console.error('Error in /start command:', error.message);
    try {
      ctx.reply('Welcome to BetAnalyzer Bot! Use /help for commands.');
    } catch (e) {
      console.error('Fallback reply also failed:', e.message);
    }
  }
});

// /help command
bot.command('help', (ctx) => {
  try {
    ctx.reply(
      'BetAnalyzer Commands:\n\n' +
      '📤 /upload_csv\n' +
      'Upload CSV file with bet picks\n\n' +
      '🤖 /analyze\n' +
      'Get AI analysis (PLACE/PASS)\n\n' +
      '📊 /stats\n' +
      'Win/loss tracking\n\n' +
      '💎 /tier\n' +
      'View premium features\n\n' +
      '⚙️ /settings\n' +
      'Configure preferences'
    );
  } catch (error) {
    console.error('Error in /help command:', error.message);
  }
});

// /tier command
bot.command('tier', (ctx) => {
  try {
    ctx.reply(
      'SUBSCRIPTION TIERS\n\n' +
      'FREE\n' +
      '✓ 1 analysis/day\n' +
      '✓ CSV uploads\n' +
      '✓ Basic stats\n\n' +
      'PRO ($9.99/mo or $99/yr)\n' +
      '✓ Unlimited analyses\n' +
      '✓ Priority AI response\n' +
      '✓ Advanced metrics\n' +
      '✓ Bet history export\n\n' +
      'ELITE ($999 lifetime)\n' +
      '✓ Everything in Pro\n' +
      '✓ Private channel access\n' +
      '✓ Custom AI model tuning\n' +
      '✓ Whatsapp/Discord bot access\n\n' +
      'Subscribe: https://whop.com/alexbet 💳'
    );
  } catch (error) {
    console.error('Error in /tier command:', error.message);
  }
});

// /upload_csv command - Prompt user to attach a CSV file
bot.command('upload_csv', (ctx) => {
  try {
    ctx.reply(
      'UPLOAD YOUR BET PICKS\\n\\n' +
      'Send a CSV file with your bet data.\\n\\n' +
      'CSV Format (with headers):\\n' +
      'pick,odds,stake,result\\n' +
      'Lakers ML,1.95,100,WIN\\n' +
      'Warriors -5,2.10,50,LOSS\\n\\n' +
      'Attach the CSV file now'
    );
  } catch (error) {
    console.error('Error in /upload_csv command:', error.message);
  }
});

// Handle document uploads (CSV files)
bot.on('document', async (ctx) => {
  const userId = ctx.from.id;
  const file = ctx.message.document;

  // Check file type
  if (!file.file_name.endsWith('.csv')) {
    ctx.reply('❌ Please upload a CSV file (e.g., bets.csv)');
    return;
  }

  ctx.reply('📥 Processing CSV... one moment');

  try {
    // Download file
    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    const response = await axios.get(fileLink);
    const csvContent = response.data;

    // Parse CSV
    const rows = csvContent.trim().split('\n');
    const headers = rows[0].split(',').map(h => h.trim());
    const bets = [];

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',').map(v => v.trim());
      const bet = {};
      headers.forEach((header, idx) => {
        bet[header] = values[idx];
      });
      bets.push(bet);
    }

    // Store data
    userData[userId].uploadedBets = bets;
    userData[userId].lastUpload = new Date();

    ctx.reply(
      `✅ Loaded ${bets.length} bets!\n\n` +
      'Use /analyze to get AI recommendations\n' +
      'Or /stats to see performance metrics'
    );
  } catch (error) {
    ctx.reply('❌ Error processing CSV: ' + error.message);
  }
});

// /analyze command - Get Claude AI recommendations
bot.command('analyze', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const bets = userData[userId].uploadedBets;

    if (!bets || bets.length === 0) {
      ctx.reply('No bets loaded. Use /upload_csv first');
      return;
    }

    // Check tier limit (free users: 1/day)
    if (userData[userId].tier === 'free') {
      const lastAnalysis = userData[userId].lastAnalysis;
      if (lastAnalysis && new Date() - lastAnalysis < 86400000) {
        ctx.reply('Free users get 1 analysis per day. Upgrade to Pro for unlimited: /tier');
        return;
      }
    }

    ctx.reply('Analyzing with Claude AI...');

    try {
      console.log('DEBUG: Bets data:', JSON.stringify(bets, null, 2));
      console.log('DEBUG: First bet keys:', Object.keys(bets[0]));
      
      const betsText = bets
        .map((b, i) => `${i + 1}. ${b.pick || b.team || b.bet || 'Unknown'} @ ${b.odds || b.line || 'N/A'} (${b.stake || b.amount || b.wager || 'N/A'})`);

      const message = await client.messages.create({
        model: 'claude-opus-4-1',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are a sports betting expert. Analyze these picks and respond with PLACE or PASS for each:\n\n${betsText.join('\n')}\n\nFor each pick, explain your recommendation in 1-2 sentences. Focus on value, odds, and edge.`,
          },
        ],
      });

      const analysis = message.content[0].text;
      userData[userId].lastAnalysis = new Date();

      ctx.reply(
        'AI ANALYSIS RESULTS\n\n' + analysis + '\n\n' +
        'Powered by Claude AI'
      );
    } catch (error) {
      ctx.reply('Analysis failed: ' + error.message);
    }
  } catch (error) {
    console.error('Error in /analyze command:', error.message);
  }
});

// /stats command
bot.command('stats', (ctx) => {
  try {
    const userId = ctx.from.id;
    const bets = userData[userId].uploadedBets;

    if (!bets || bets.length === 0) {
      ctx.reply('No bet history yet. Upload a CSV to get started!');
      return;
    }

    const total = bets.length;
    const wins = bets.filter(b => b.result === 'win' || b.result === 'W').length;
    const losses = total - wins;
    const winRate = ((wins / total) * 100).toFixed(1);

    ctx.reply(
      'YOUR STATS\n\n' +
      `Total Bets: ${total}\n` +
      `Wins: ${wins} 🟢\n` +
      `Losses: ${losses} 🔴\n` +
      `Win Rate: ${winRate}%`
    );
  } catch (error) {
    console.error('Error in /stats command:', error.message);
  }
});

// /settings command
bot.command('settings', (ctx) => {
  ctx.reply(
    '⚙️ *Settings*\n\n' +
    'Your Tier: ' + userData[ctx.from.id].tier.toUpperCase() + '\n' +
    'Last Upload: ' + (userData[ctx.from.id].lastUpload ? userData[ctx.from.id].lastUpload.toLocaleDateString() : 'Never') + '\n\n' +
    'Use /tier to upgrade'
  );
});

// Launch
bot.catch((err, ctx) => {
  console.error('Telegram error caught:', err);
  ctx.reply('Sorry, something went wrong. Please try again later.').catch(() => {});
});

bot.launch();

console.log('🚀 BetAnalyzer Bot is running...');

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
