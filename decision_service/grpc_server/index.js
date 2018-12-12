require('google-protobuf/google/protobuf/struct_pb')
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
    getFeature
  })
  grpcServer.bind(address, grpc.ServerCredentials.createInsecure())
  grpcServer.start()
  console.log('Started grpc server on', address)
}

async function activate(call, callback) {
  let { request } = call

  // @TODO(mng): use the datafile key for getting the optly instance
  let { datafile_key } = parseContext(request)
  let parameters = parseParameters(request)
  let experimentKey = parameters.getExperimentKey()
  let userId = parameters.getUserId()
  let userAttributes = parameters.getUserAttributes()
  userAttributes = userAttributes ? userAttributes.toJavaScript() : {}
  
  let optlyInstance = await optimizely.getInstance()
  let variationKey = optlyInstance.activate(experimentKey, userId, userAttributes)
  let response = { variationKey }
  callback(null, response)
}

async function getVariation(call, callback) {
  let { request } = call
  // @TODO(mng): use the datafile key for getting the optly instance
  let { datafile_key } = parseContext(request)
  let parameters = parseParameters(request)
  let experimentKey = parameters.getExperimentKey()
  let userId = parameters.getUserId()
  let userAttributes = parameters.getUserAttributes()
  userAttributes = userAttributes ? userAttributes.toJavaScript() : {}

  let optlyInstance = await optimizely.getInstance()
  let variationKey = optlyInstance.getVariation(experimentKey, userId, userAttributes)
  let response = { variationKey }
  callback(null, response)
}

async function getFeature(call, callback) {  
  // @TODO: use the datafile key for getting the optly instance
  let { datafile_key } = parseContext(request)
  let parameters = parseParameters(request)
  let featureKey = parameters.getFeatureKey()
  let userId = parameters.getUserId()
  let userAttributes = parameters.getUserAttributes()
  userAttributes = userAttributes ? userAttributes.toJavaScript() : {}

  // @TODO(mng): Implement
  let response = new messages.FeatureResponse()
  response.setIsEnabled(true)
  response.setVariable(variable)
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
