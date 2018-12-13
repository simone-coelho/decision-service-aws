// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var decision_service_pb = require('./decision_service_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');

function serialize_Optimizely_DecisionRequest(arg) {
  if (!(arg instanceof decision_service_pb.DecisionRequest)) {
    throw new Error('Expected argument of type Optimizely.DecisionRequest');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_Optimizely_DecisionRequest(buffer_arg) {
  return decision_service_pb.DecisionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Optimizely_DecisionResponse(arg) {
  if (!(arg instanceof decision_service_pb.DecisionResponse)) {
    throw new Error('Expected argument of type Optimizely.DecisionResponse');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_Optimizely_DecisionResponse(buffer_arg) {
  return decision_service_pb.DecisionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Optimizely_FeatureRequest(arg) {
  if (!(arg instanceof decision_service_pb.FeatureRequest)) {
    throw new Error('Expected argument of type Optimizely.FeatureRequest');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_Optimizely_FeatureRequest(buffer_arg) {
  return decision_service_pb.FeatureRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Optimizely_FeatureResponse(arg) {
  if (!(arg instanceof decision_service_pb.FeatureResponse)) {
    throw new Error('Expected argument of type Optimizely.FeatureResponse');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_Optimizely_FeatureResponse(buffer_arg) {
  return decision_service_pb.FeatureResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Optimizely_FeatureVariableStringRequest(arg) {
  if (!(arg instanceof decision_service_pb.FeatureVariableStringRequest)) {
    throw new Error('Expected argument of type Optimizely.FeatureVariableStringRequest');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_Optimizely_FeatureVariableStringRequest(buffer_arg) {
  return decision_service_pb.FeatureVariableStringRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_Optimizely_FeatureVariableStringResponse(arg) {
  if (!(arg instanceof decision_service_pb.FeatureVariableStringResponse)) {
    throw new Error('Expected argument of type Optimizely.FeatureVariableStringResponse');
  }
  return new Buffer(arg.serializeBinary());
}

function deserialize_Optimizely_FeatureVariableStringResponse(buffer_arg) {
  return decision_service_pb.FeatureVariableStringResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var DecisionServiceService = exports.DecisionServiceService = {
  activate: {
    path: '/Optimizely.DecisionService/Activate',
    requestStream: false,
    responseStream: false,
    requestType: decision_service_pb.DecisionRequest,
    responseType: decision_service_pb.DecisionResponse,
    requestSerialize: serialize_Optimizely_DecisionRequest,
    requestDeserialize: deserialize_Optimizely_DecisionRequest,
    responseSerialize: serialize_Optimizely_DecisionResponse,
    responseDeserialize: deserialize_Optimizely_DecisionResponse,
  },
  getVariation: {
    path: '/Optimizely.DecisionService/GetVariation',
    requestStream: false,
    responseStream: false,
    requestType: decision_service_pb.DecisionRequest,
    responseType: decision_service_pb.DecisionResponse,
    requestSerialize: serialize_Optimizely_DecisionRequest,
    requestDeserialize: deserialize_Optimizely_DecisionRequest,
    responseSerialize: serialize_Optimizely_DecisionResponse,
    responseDeserialize: deserialize_Optimizely_DecisionResponse,
  },
  getFeature: {
    path: '/Optimizely.DecisionService/GetFeature',
    requestStream: false,
    responseStream: false,
    requestType: decision_service_pb.FeatureRequest,
    responseType: decision_service_pb.FeatureResponse,
    requestSerialize: serialize_Optimizely_FeatureRequest,
    requestDeserialize: deserialize_Optimizely_FeatureRequest,
    responseSerialize: serialize_Optimizely_FeatureResponse,
    responseDeserialize: deserialize_Optimizely_FeatureResponse,
  },
  getFeatureVariableString: {
    path: '/Optimizely.DecisionService/GetFeatureVariableString',
    requestStream: false,
    responseStream: false,
    requestType: decision_service_pb.FeatureVariableStringRequest,
    responseType: decision_service_pb.FeatureVariableStringResponse,
    requestSerialize: serialize_Optimizely_FeatureVariableStringRequest,
    requestDeserialize: deserialize_Optimizely_FeatureVariableStringRequest,
    responseSerialize: serialize_Optimizely_FeatureVariableStringResponse,
    responseDeserialize: deserialize_Optimizely_FeatureVariableStringResponse,
  },
};

exports.DecisionServiceClient = grpc.makeGenericClientConstructor(DecisionServiceService);
