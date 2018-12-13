const fetch = require('node-fetch');
const optimizely = require('@optimizely/optimizely-sdk');

const defaultLogger = require("@optimizely/optimizely-sdk/lib/plugins/logger");
const LOG_LEVEL = require("@optimizely/optimizely-sdk/lib/utils/enums")
  .LOG_LEVEL;

const INSTRUMENTATION_SDK_KEY = process.env.INSTRUMENTATION_SDK_KEY;

let client;

const getDatafileForSDKKey = (sdkKey) => `https://cdn.optimizely.com/datafiles/${sdkKey}.json`;

exports.handler = async (req, res, next) => {
  if (!INSTRUMENTATION_SDK_KEY) {
    return next(new Error('No instrumentation SDK key defined'));
  }

  if (!client) {
    console.log(`Fetching new client for SDK key: ${INSTRUMENTATION_SDK_KEY}`);
    const datafile = await fetch(getDatafileForSDKKey(INSTRUMENTATION_SDK_KEY)).then(r => r.json());
    client = optimizely.createInstance({
      datafile,
      logger: defaultLogger.createLogger({
        logLevel: LOG_LEVEL.ERROR
      }),
    });
  }
  req.client = client;
  next();
};
