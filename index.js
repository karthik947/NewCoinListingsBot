require('dotenv').config();
const { log, error } = console;
const { detectE, startWS } = require('./detect');
const { loadeInfo, getQty, buy, sell } = require('./order');
const validate = require('./validate');

const { usdt, api, sec, profit, sloss } = process.env;

log('NewCoinListings bot is running...');
validate();
log('The bot is waiting for a new coin to be listed in the USDT market.');
log('When detected, the bot automatically trades as per the configuration.');

startWS();
detectE.on('NEWLISTING', async (data) => {
  try {
    const { s: symbol, c: closePrice } = { ...data };
    log(`New symbol ${symbol} detected with price ${closePrice}`);
    await loadeInfo({ symbol });
    const qty = getQty({ symbol, price: closePrice, usdt });
    log(`Trade size is ${qty} for ${usdt} USDT at price ${closePrice} USDT`);
    //place buy order
    const bresp = await buy({ keys: { api, sec }, qty, symbol });
    const buyPrice =
      bresp.fills.reduce((a, d) => a + d.price * d.qty, 0) /
      bresp.fills.reduce((a, d) => a + d.qty * 1, 0);
    log(`Buy price is ${buyPrice}`);
    return await sell({
      keys: { api, sec },
      buyPrice,
      symbol,
      qty,
      profit,
      sloss,
    });
    //place sell order
  } catch (err) {
    error(err);
  }
});
