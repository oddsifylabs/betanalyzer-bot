const { Telegraf } = require('telegraf');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const anthropicClient = new Anthropic();

// Kimi API Client
const kimiApiKey = process.env.KIMI_API_KEY;
const kimiApiBase = process.env.KIMI_API_BASE || 'https://api.moonshot.cn/v1';

// Kimi Model Routing Configuration
const KIMI_ROUTES = {
  cheap: process.env.KIMI_CHEAP_MODEL || 'moonshot-v1-8k',
  standard: process.env.KIMI_STANDARD_MODEL || 'moonshot-v1-32k',
  advanced: process.env.KIMI_ADVANCED_MODEL || 'moonshot-v1-128k',
  premium: process.env.KIMI_PREMIUM_MODEL || 'claude-opus-4-1', // fallback to Claude for premium
};

// Helper function to call Kimi API
async function callKimiAPI(model, messages, maxTokens = 1024) {
  if (!kimiApiKey) {
    throw new Error('KIMI_API_KEY not set in environment variables');
  }

  try {
    const response = await axios.post(`${kimiApiBase}/chat/completions`, {
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${kimiApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Kimi API error:', error.response?.data || error.message);
    throw new Error(`Kimi API call failed: ${error.message}`);
  }
}

// Helper function to call appropriate AI API based on model
async function callAI(model, messages, maxTokens = 1024) {
  // If model is Claude, use Anthropic
  if (model.includes('claude')) {
    const response = await anthropicClient.messages.create({
      model,
      max_tokens: maxTokens,
      messages,
    });
    return response.content[0].text;
  }

  // Otherwise assume it's a Kimi model
  return await callKimiAPI(model, messages, maxTokens);
}

// Route betting analysis based on complexity
function routeAnalysis(bets) {
  const numBets = bets.length;
  const hasEdgeData = bets.some(b => b.edge_percent && b.edge_percent !== 'N/A');
  const hasEvData = bets.some(b => b.ev_percent && b.ev_percent !== 'N/A');
  
  // Estimate complexity score
  let complexityScore = 0;
  if (numBets > 5) complexityScore++;
  if (numBets > 10) complexityScore++;
  if (!hasEdgeData || !hasEvData) complexityScore++; // missing data requires reasoning
  
  // Route decision
  if (complexityScore === 0 && numBets <= 3) {
    return {
      route: 'kimi:cheap',
      tier: 'cheap',
      reason: 'simple classification task with clear data, few bets, straightforward PLACE/PASS routing',
      model: KIMI_ROUTES.cheap,
      downgrade_after: null,
      escalate_if: 'conflicting signals or edge data missing across multiple bets'
    };
  } else if (complexityScore <= 1 && numBets <= 7) {
    return {
      route: 'kimi:standard',
      tier: 'standard',
      reason: 'moderate complexity analysis with multiple bets and edge metrics',
      model: KIMI_ROUTES.standard,
      downgrade_after: 'use cheap for final formatting after analysis is stable',
      escalate_if: 'recommendations require multi-step reasoning or high-confidence trade-off analysis'
    };
  } else {
    return {
      route: 'kimi:advanced',
      tier: 'advanced',
      reason: 'complex analysis with many bets, missing data, or ambiguous signals requiring multi-step reasoning',
      model: KIMI_ROUTES.advanced,
      downgrade_after: 'use standard or cheap for formatting after analysis plan is finalized',
      escalate_if: 'analysis fails twice or task expands to portfolio optimization'
    };
  }
}

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
      '• /upload_csv - Upload bets (.txt file)\n' +
      '• /analyze - Get AI recommendations\n' +
      '• /stats - View your performance\n' +
      '• /tier - See subscription options\n' +
      '• /help - Show all commands\n\n' +
      'Format: signal | odds | game | date\n' +
      'Example: Lakers ML | 195 | Lakers vs Celtics | 4/25/2026'
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

// /upload_csv command - Prompt user to attach a file
bot.command('upload_csv', (ctx) => {
  try {
    ctx.reply(
      'UPLOAD YOUR BET PICKS\n\n' +
      'Send a text file (.txt) with your bets.\n\n' +
      'Format (one bet per line):\n\n' +
      'Lakers ML | 195 | Lakers vs Celtics | 4/25/2026\n' +
      'Warriors -5 | 210 | Warriors vs Grizzlies | 4/26/2026\n' +
      'Knicks ML | 120 | Knicks vs Hawks | 4/25/2026\n\n' +
      'REQUIRED: signal | odds\n' +
      'OPTIONAL: game | date\n\n' +
      'That\'s it! Just use | to separate fields.\n' +
      'Create in Notepad and save as .txt'
    );
  } catch (error) {
    console.error('Error in /upload_csv command:', error.message);
  }
});

// Handle text file uploads (simple pipe-separated format)
bot.on('document', async (ctx) => {
  const userId = ctx.from.id;
  const file = ctx.message.document;
  const fileName = file.file_name.toLowerCase();

  // Check file type
  if (!fileName.endsWith('.txt')) {
    ctx.reply('Please upload a .txt file\n\nFormat:\nLakers ML | 195 | Lakers vs Celtics | 4/25/2026');
    return;
  }

  ctx.reply('Processing file... one moment');

  try {
    // Download file
    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    const response = await axios.get(fileLink);
    let fileContent = response.data;

    // Remove BOM if present
    if (typeof fileContent === 'string' && fileContent.charCodeAt(0) === 0xFEFF) {
      fileContent = fileContent.slice(1);
    }

    // Parse lines
    const lines = fileContent.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      ctx.reply('File is empty. Add bets in format:\nLakers ML | 195 | Lakers vs Celtics | 4/25/2026');
      return;
    }

    const bets = [];

    for (const line of lines) {
      const parts = line.split('|').map(p => p.trim());
      
      if (parts.length < 2) {
        console.log('DEBUG: Skipping invalid line:', line);
        continue;
      }

      const bet = {
        signal: parts[0] || 'Unknown',
        odds: parts[1] || 'N/A',
        game: parts[2] || 'N/A',
        date: parts[3] || 'N/A',
      };

      bets.push(bet);
    }

    if (bets.length === 0) {
      ctx.reply('No valid bets found. Format:\nLakers ML | 195 | Lakers vs Celtics | 4/25/2026');
      return;
    }

    // Validate required fields
    const allHaveSignalAndOdds = bets.every(b => b.signal !== 'Unknown' && b.odds !== 'N/A');
    
    if (!allHaveSignalAndOdds) {
      ctx.reply('All bets need at least: signal | odds\n\nExample:\nLakers ML | 195');
      return;
    }

    // Store data
    userData[userId].uploadedBets = bets;
    userData[userId].lastUpload = new Date();

    console.log('DEBUG: Parsed bets:', JSON.stringify(bets.slice(0, 2), null, 2));

    ctx.reply(
      `Loaded ${bets.length} bets!\n\n` +
      'Use /analyze to get AI recommendations\n' +
      'Or /stats to see performance metrics'
    );
  } catch (error) {
    console.error('File processing error:', error);
    ctx.reply('Error processing file: ' + error.message);
  }
});

// /analyze command - Get AI recommendations (Kimi-routed)
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

    // Route analysis based on complexity
    const routing = routeAnalysis(bets);
    console.log('ROUTING DECISION:', JSON.stringify(routing, null, 2));

    ctx.reply(`Analyzing with ${routing.tier.toUpperCase()} model...`);

    try {
      console.log('DEBUG: Bets data:', JSON.stringify(bets, null, 2));
      console.log('DEBUG: First bet keys:', Object.keys(bets[0]));
      
      const betsText = bets
        .map((b, i) => {
          const signal = b.signal || b.pick || b.team || b.bet || 'Unknown';
          const odds = b.odds || b.line || 'N/A';
          const game = b.game || 'N/A';
          const date = b.date || 'N/A';
          const market = b.market || 'UNKNOWN';
          const edge = b.edge_percent || 'N/A';
          const ev = b.ev_percent || 'N/A';
          return `${i + 1}. ${signal} @ ${odds}\nGame: ${game}\nDate: ${date}\nMarket: ${market} | Edge: ${edge}% | EV: ${ev}%`;
        });

      const message = await callAI(routing.model, [
        {
          role: 'user',
          content: `You are a sports betting expert. Analyze these picks and respond with PLACE or PASS for each:\n\n${betsText.join('\n')}\n\nFor each pick, explain your recommendation in 1-2 sentences. Focus on value, odds, and edge.`,
        },
      ]);

      const analysis = message;
      userData[userId].lastAnalysis = new Date();

      ctx.reply(
        'AI ANALYSIS RESULTS\n\n' + analysis + '\n\n' +
        `Powered by ${routing.tier.toUpperCase()} Model (${routing.route})`
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
