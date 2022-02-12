const { log, error } = console;
const binance = require('./binance');
const checkFrom = 10; //last 5days
const lastTS = Date.now() - checkFrom * 24 * 60 * 60 * 1000;
const bottleneck = require('bottleneck');
const limiter = new bottleneck({
  reservoir: 10, // initial value
  reservoirRefreshAmount: 10,
  reservoirRefreshInterval: 1 * 1000,
  maxConcurrent: 10,
  minTime: 100,
});

const getsymbols = async () => {
  try {
    const resp = await binance({
      method: 'GET',
      path: '/api/v3/exchangeInfo',
      keys: '',
      params: '',
    });
    return resp?.body.symbols
      .filter((d) => d?.quoteAsset === 'USDT' && d?.status === 'TRADING')
      .map((d) => d.symbol);
  } catch (err) {
    throw err;
  }
};

const checkWhenListed = limiter.wrap(async (symbol) => {
  try {
    const resp = await binance({
      method: 'GET',
      path: `/api/v3/klines?symbol=${symbol}&interval=1d`,
      keys: '',
      params: '',
    });
    return { symbol, listedOn: resp.body[0][0] };
  } catch (err) {
    throw err;
  }
});

const run = async () => {
  try {
    const symbols = await getsymbols();
    log(`${symbols.length} USDT pairs identified.`);
    const listingDate = await Promise.all(symbols.map(checkWhenListed));
    log(
      listingDate
        .filter((d) => d.listedOn > lastTS)
        .map(
          (d) =>
            `${d.symbol} is listed on ${new Date(d.listedOn).toLocaleString()}`
        )
    );
  } catch (err) {
    error(err);
  }
};

run();
