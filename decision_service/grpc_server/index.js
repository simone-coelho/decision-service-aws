const grpc = require('grpc')
const path = require('path')
const protoLoader = require('@grpc/proto-loader')

const optimizely = require('../optimizely/optimizely_manager');
const packageDefinition = protoLoader.loadSync(path.join(__dirname, '../protos/decision_service.proto'))
const packageObject = grpc.loadPackageDefinition(packageDefinition)

let grpcServer
function startServer(address) {
  grpcServer = new grpc.Server()
  grpcServer.addService(packageObject.Optimizely.DecisionService.service, {
    activate,
  })
  grpcServer.bind(address, grpc.ServerCredentials.createInsecure())
  grpcServer.start()
  console.log('Started grpc server on', address)
}

async function activate(call, callback) {
  let { experimentKey, userId, userAttributes = {} } = call.request
  let optlyInstance = await optimizely.getInstance()
  let variationKey = optlyInstance.activate(experimentKey, userId, userAttributes)
  let response = { variationKey }
  callback(null, response)
}

module.exports = {
  startServer: startServer
}
