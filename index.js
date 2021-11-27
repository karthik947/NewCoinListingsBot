require('dotenv').config();
const { log, error } = console;
const { detectE, startWS } = require('./detect');
const { loadeInfo, getQty, buy, sell } = require('./order');

const { usdt, api, sec, profit, sloss } = process.env;

startWS();
detectE.on('NEWLISTING', async (data) => {
  try {
    const { s: symbol, c: closePrice } = { ...data };
    await loadeInfo({ symbol });
    const qty = getQty({ symbol, price: closePrice, usdt });
    //place buy order
    const bresp = await buy({ keys: { api, sec }, qty, symbol });
    const buyPrice =
      bresp.fills.reduce((a, d) => a + d.price * d.qty, 0) /
      bresp.fills.reduce((a, d) => a + d.qty * 1, 0);
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
