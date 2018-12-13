const methods = require('./rpc/methods');
const types = require('./types/types');

module.exports = {
  /**
   * Defines the different url paths that our application will respond to. This is
   * the RPC endpoint and every operation/method request will come through here.
   *
   * @param body
   *   The JSON object in the request body that represents an individual function or method.
   * @returns {Promise<object>}
   *   Original JSON object with corresponding result(s) appended.
   */
  '/rpc': function(body) {

    return new Promise((resolve, reject) => {
      let _json = body;
      let keys = Object.keys(_json);
      let promiseArr = [];

      if (!body) {
        throw new Error(`RPC request was expecting some data...!`);
      }

      for (let key of keys) {
        if (methods[key] && typeof (methods[key].exec) === 'function') {
          let execPromise = methods[key].exec.call(null, _json[key]);
          if (!(execPromise instanceof Promise)) {
            throw new Error(`exec on ${key} did not return a promise`);
          }
          promiseArr.push(execPromise);
        } else {
          let execPromise = Promise.resolve({
            error: 'method is not defined',
          });
          promiseArr.push(execPromise);
        }
      }

      Promise.all(promiseArr).then(iter => {
        console.log(iter);
        let response = {};
        iter.forEach((val, index) => {
          response[keys[index]] = val;
        });

        resolve(response);
      }).catch(err => {
        reject('RPC method - ' + err);
      });
    });
  },


  /**
   * Describe endpoint, scans through the descriptions of both the methods
   * and the data types, and returns that information in the response.
   *
   * @returns {Promise<object>}
   *   JSON Object with the descriptions for all the methods supported.
   */
  '/describe': function() {
    // load the type descriptions
    return new Promise(resolve => {
      let type;
      let method = {};

      // set types
      type = types;

      //set methods
      for (let m in methods) {
        method[m] = JSON.parse(JSON.stringify(methods[m]));
      }

      resolve({
        types: type,
        methods: method,
      });
    });
  },
};
