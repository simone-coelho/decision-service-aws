const fetch = require('node-fetch');

class DecisionRPC {
  constructor({hostname, sdkKey, verbose = false}) {
    this.endpoint = `${hostname}/rpc`;
    this.sdkKey = sdkKey;
    this.verbose = verbose;
  }

  _buildFeaturesPayload(feature_key, user_id, attributes, variation_key, variation_key_type = 'string') {
    const data = {
      features: {
        feature_key,
        user_id,
        attributes,
        feature_config: {},
        datafile_key: this.sdkKey,
      },
    };
    if (variation_key) {
      data.features.feature_config[variation_key] = variation_key_type;
    }

    return JSON.stringify(data);
  }

  async _fetch(body) {
    if (this.verbose) console.log(`Fetching ${this.endpoint} with data: ${body}`);
    const resp = await fetch(this.endpoint, {
      method: 'POST',
      body,
    });
    const respData = await resp.json();
    if (resp.status !== 200) {
      throw new Error(`Status ${resp.status} error from RPC: ${JSON.stringify(respData)}`);
    }
    if (this.verbose) console.log(`Got response: ${JSON.stringify(respData)}`);
    return respData;
  }

  async isFeatureEnabled(feature_key, user_id, attributes) {
    const body = this._buildFeaturesPayload(feature_key, user_id, attributes);
    const respData = await this._fetch(body);
    return respData.features.is_enabled;
  }

  async getFeatureVariableString(feature_key, variable_key, user_id, attributes) {
    const body = this._buildFeaturesPayload(feature_key, user_id, attributes, variable_key);
    const respData = await this._fetch(body);
    return respData.features.feature_config[variable_key];
  }
}

module.exports = DecisionRPC;
