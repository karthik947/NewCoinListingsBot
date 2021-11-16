const got = require('got');
const crypto = require('crypto');

module.exports = async (event) => {
  try {
    const { method, path, keys, params } = event;
    const baseURL = 'https://api.binance.com';
    if (!keys?.api) {
      //public request
      const queryString = params
        ? Object.keys(params)
            .map((d) => `${d}=${params[d]}`)
            .join('&')
        : '';
      const url = baseURL + path + (queryString ? `?${queryString}` : '');
      const resp = await got(url);
      return { statusCode: 200, body: JSON.parse(resp.body) };
    } else if (method === 'GET') {
      //signed get request
      params['timestamp'] = Date.now() - 1000;
      params['recvWindow'] = 15000;
      const queryString = Object.keys(params)
        .map((d) => `${d}=${params[d]}`)
        .join('&');
      const { api, sec } = keys;
      const signature = crypto
        .createHmac('sha256', sec)
        .update(queryString)
        .digest('hex');
      const url = `${baseURL}${path}?${queryString}&signature=${signature}`;
      const options = {
        headers: {
          'X-MBX-APIKEY': api,
        },
      };
      const resp = await got(url, options);
      return { statusCode: 200, body: JSON.parse(resp.body) };
    } else {
      //signed post request
      params['timestamp'] = Date.now() - 1000;
      params['recvWindow'] = 15000;
      const queryString = Object.keys(params)
        .map((d) => `${d}=${params[d]}`)
        .join('&');
      const { api, sec } = keys;
      const signature = crypto
        .createHmac('sha256', sec)
        .update(queryString)
        .digest('hex');
      const url = `${baseURL}${path}?${queryString}&signature=${signature}`;
      const options = {
        headers: {
          'X-MBX-APIKEY': api,
        },
      };
      const resp = await got.post(url, options);
      return { statusCode: 200, body: JSON.parse(resp.body) };
    }
  } catch (err) {
    throw JSON.stringify(err);
  }
};
