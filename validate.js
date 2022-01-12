const { log, error } = console;
const binance = require('./binance');

const terminate = (message) => {
  log(message);
  log('Terminating the bot...');
  return process.exit();
};

const { usdt, api, sec, profit, sloss } = process.env;

const validation = async () => {
  try {
    if (!api) terminate('"api" is missing in .env file!');
    if (api.length !== 64)
      terminate('"api" should be an alphanumeric string of 64 char!');
    if (!sec) terminate('"sec" is missing in .env file!');
    if (sec.length !== 64)
      terminate('"sec" should be an alphanumeric string of 64 char!');
    if (!Number(usdt)) terminate('"usdt" is missing in .env file!');
    if (!Number(profit)) terminate('"profit" is missing in .env file!');
    if (sloss && !Number(sloss))
      terminate('"sloss" must be a number in .env file!');
    if (Number(sloss) < 5)
      log(
        'Warning! Stop-Loss is less than 5%, which could be too tight and result in the sell OCO order failure!'
      );
    await binance({
      method: 'POST',
      path: '/api/v3/order/test',
      keys: { api, sec },
      params: {
        quantity: 20,
        symbol: 'XRPUSDT',
        side: 'BUY',
        type: 'MARKET',
        newOrderRespType: 'FULL',
      },
    });
  } catch (err) {
    terminate(
      err.message +
        ' Invalid API keys, or Insufficient access to API keys, or IP Address access could be missing for the api keys'
    );
  }
};

module.exports = validation;
