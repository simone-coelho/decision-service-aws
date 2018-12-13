const { Struct } = require('google-protobuf/google/protobuf/struct_pb')
const messages = require('./decision_service_pb')
const services = require('./decision_service_grpc_pb')
const grpc = require('grpc')

const optimizely = require('../optimizely/optimizely_manager');

let grpcServer
function startServer(address) {
  grpcServer = new grpc.Server()
  grpcServer.addService(services.DecisionServiceService, {
    activate,
    getVariation,
    getFeature,
    getFeatureVariableString
  })
  grpcServer.bind(address, grpc.ServerCredentials.createInsecure())
  grpcServer.start()
  console.log('Started grpc server on', address)
}

async function activate(call, callback) {
  let { request } = call
  let { datafile_key } = parseContext(request)
  let parameters = parseParameters(request)
  let experimentKey = parameters.getExperimentKey()
  let userId = parameters.getUserId()
  let userAttributes = parameters.getUserAttributes()
  userAttributes = userAttributes ? userAttributes.toJavaScript() : {}

  let optlyInstance = await optimizely.getInstance(datafile_key)
  let variationKey = optlyInstance.activate(experimentKey, userId, userAttributes)
  
  let response = new messages.DecisionResponse()
  response.setVariationKey(variationKey)
  callback(null, response)
}

async function getVariation(call, callback) {
  let { request } = call
  let { datafile_key } = parseContext(request)
  let parameters = parseParameters(request)
  let experimentKey = parameters.getExperimentKey()
  let userId = parameters.getUserId()
  let userAttributes = parameters.getUserAttributes()
  userAttributes = userAttributes ? userAttributes.toJavaScript() : {}

  let optlyInstance = await optimizely.getInstance(datafile_key)
  let variationKey = optlyInstance.getVariation(experimentKey, userId, userAttributes)
  let response = { variationKey }
  callback(null, response)
}

async function getFeature(call, callback) {
  let { request } = call 
  let { datafile_key } = parseContext(request)
  let parameters = parseParameters(request)
  let featureKey = parameters.getFeatureKey()
  let userId = parameters.getUserId()
  let userAttributes = parameters.getUserAttributes()
  userAttributes = userAttributes ? userAttributes.toJavaScript() : {}
  let variableKeys = parameters.getVariableKeysMap() || new Map()
  
  console.log('Params', datafile_key, featureKey, userId, userAttributes, variableKeys)
  let optlyInstance = await optimizely.getInstance(datafile_key)
  let isFeatureEnabled = optlyInstance.isFeatureEnabled(featureKey, userId, userAttributes)  
  let config = {}
  variableKeys.forEach((variableType, variableKey) => {
    let variableValue
    switch (variableType) {
      case 'string':
      variableValue = optlyInstance.getFeatureVariableString(featureKey, variableKey, userId, userAttributes)
      break
      case 'boolean':
      variableValue = optlyInstance.getFeatureVariableBoolean(featureKey, variableKey, userId, userAttributes)
      break
      case 'integer':
      variableValue = optlyInstance.getFeatureVariableInteger(featureKey, variableKey, userId, userAttributes)
      break
      case 'double': 
      variableValue = optlyInstance.getFeatureVariableDouble(featureKey, variableKey, userId, userAttributes)
      break
    }
    config[variableKey] = variableValue
  })
  
  let response = new messages.FeatureResponse()
  response.setIsEnabled(isFeatureEnabled)
  if (Object.keys(config).length) {
    response.setConfig(Struct.fromJavaScript(config))
  }
  callback(null, response)
}

async function getFeatureVariableString(call, callback) {
  let { request } = call 
  let { datafile_key } = parseContext(request)
  let parameters = parseParameters(request)
  let featureKey = parameters.getFeatureKey()
  let variableKey = parameters.getVariableKey()
  let userId = parameters.getUserId()
  let userAttributes = parameters.getUserAttributes()
  userAttributes = userAttributes ? userAttributes.toJavaScript() : {}

  let optlyInstance = await optimizely.getInstance(datafile_key)
  let variableValue = optlyInstance.getFeatureVariableString(featureKey, variableKey, userId, userAttributes)
  let response = new messages.FeatureVariableStringResponse()
  response.setValue(variableValue)
  callback(null, response)
}

function parseContext(request) {
  let context = request.getContext()
  return {
    datafile_key: context.getDatafileKey()
  }
}

function parseParameters(request) {
  let parameters = request.getParameters()
  return parameters
}

module.exports = {
  startServer: startServer
}
