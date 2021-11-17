//check new coin listsings
const { log, error } = console;
const Websocket = require('ws');
const got = require('got');
const events = require('events');
const detectE = new events();

let ws = '',
  symbols = {},
  pingTimeout = '';

const refreshSymbols = async () => {
  try {
    const resp = JSON.parse(
      (await got(`https://api.binance.com/api/v3/exchangeInfo`))?.body
    );
    resp.symbols.forEach(({ symbol, status }) => {
      if (status === 'TRADING') symbols[symbol] = 1;
    });
  } catch (err) {
    throw err;
  }
};

const onOpen = () => {
  log('Socket has been opened!');
  ws.send(
    JSON.stringify({
      method: 'SUBSCRIBE',
      params: ['!miniTicker@arr'],
      id: Math.floor(Math.random() * 10 ** 5),
    })
  );
};

const onError = (err) => {
  log(`Socket error ${err}`);
  setTimeout(startWS, 60 * 1000); //restart after 1 min
};

const heartbeat = () => {
  clearTimeout(pingTimeout);
  pingTimeout = setTimeout(() => {
    console.log('Socket has been terminated heartbeat!');
    startWS();
  }, 3 * 60 * 1000 + 60 * 1000);
};

// const processStream = (msg) => log(msg.toString());
const processStream = (mb) => {
  const payload = JSON.parse(mb.toString());
  if (!Array.isArray(payload)) return;
  payload.forEach((data) => {
    if (!data?.s) return;
    if (data?.s?.slice(-4) !== 'USDT') return;
    if (!symbols[data?.s]) {
      //new symbol detected
      log(`New symbol ${data?.s} detected at ${Date.now()}`);
      log(data);
      detectE.emit('NEWLISTING', data);
      symbols[data?.s] = 1;
    }
  });
};

const startWS = async () => {
  try {
    log('Socket has been restarted!');
    await refreshSymbols();
    if (ws) ws.terminate();
    ws = '';
    clearTimeout(pingTimeout);
    ws = new Websocket(`wss://stream.binance.com:9443/ws`);
    ws.on('open', onOpen);
    ws.on('message', processStream);
    ws.on('ping', heartbeat);
    ws.on('error', onError);
  } catch (err) {
    error(err);
    setTimeout(startWS, 60 * 1000); //restart after 1 min
  }
};

module.exports = { detectE, startWS };
