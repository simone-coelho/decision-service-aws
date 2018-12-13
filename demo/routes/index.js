const { performance } = require('perf_hooks');
var express = require('express');
var router = express.Router();

const fetch = require('node-fetch');
const optimizely = require('@optimizely/optimizely-sdk');

const DecisionRPC = require('../lib/decision_rpc');

const SERVICE_SDK_KEY = process.env.SERVICE_SDK_KEY;
const SERVICE_FEATURE_TEST = process.env.SERVICE_FEATURE_TEST || 'sdk_service_test';

const CLOUDFLARE_HOST = process.env.CLOUDFLARE_HOST || 'http://tyler.ocdndns.com';
const DECISION_SERVICE_HOST = process.env.DECISION_SERVICE_HOST || 'http://localhost:9090';

const TEST_FEATURE = 'banner';
const TEST_VARIABLE = 'message';

const getDatafileForSDKKey = (sdkKey) => `https://cdn.optimizely.com/datafiles/${sdkKey}.json`;

const getSDKServiceClient = async (sdkName) => {
  switch(sdkName) {
    case 'local':
      const datafile = await fetch(getDatafileForSDKKey(SERVICE_SDK_KEY)).then(r => r.json());
      return optimizely.createInstance({datafile});
    case 'cloudflare-worker':
      return Promise.resolve(new DecisionRPC({
        hostname: CLOUDFLARE_HOST,
        sdkKey: SERVICE_SDK_KEY,
      }));
    case 'decision-service':
      return Promise.resolve(new DecisionRPC({
        hostname: DECISION_SERVICE_HOST,
        sdkKey: SERVICE_SDK_KEY,
      }));
    default:
      throw new Error(`Don't know how to construct SDK: ${sdkName}`);
  }
}

const measure = async (fn, measureName, measures) => {
  const start = performance.now();
  const res = await fn();
  measures[measureName] = performance.now() - start;
  return res;
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  try {
    if (!req.client) {
      throw new Error('No instrumentation client defined!');
    }

    if (!req.userId) {
      throw new Error('No userId defined!');
    }

    let title = 'Express';

    const sdkService = req.client.activate(SERVICE_FEATURE_TEST, req.userId);
    if (sdkService) {
      const performanceItems = {};
      await measure(async () => {
        sdkClient = await measure(() => getSDKServiceClient(sdkService), 'initialize', performanceItems);

        const isFeatureEnabled = await measure(() =>
          Promise.resolve(sdkClient.isFeatureEnabled(TEST_FEATURE, req.userId)), 'isFeatureEnabled', performanceItems);

        if (isFeatureEnabled) {
          title = await measure(() =>
            Promise.resolve(sdkClient.getFeatureVariableString(TEST_FEATURE, TEST_VARIABLE, req.userId)), 'getFeatureVariableString', performanceItems);
        }
      }, 'totalSDKTime', performanceItems);

      for (const [ name, value ] of Object.entries(performanceItems)) {
        req.client.track(name, req.userId, null, {value});
      }
    } else {
      console.log(`User ${req.userId} is not in feature: ${SERVICE_FEATURE_TEST}`);
    }

    res.render('index', { title, sdkService, userId: req.userId });
  } catch(e) {
    next(e);
  }
});

module.exports = router;
