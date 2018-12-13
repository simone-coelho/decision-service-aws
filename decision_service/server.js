/*
 * Copyright (c) 2018, Simone A. Coelho - Optimizely
 *
 * Module:          ds_rpc
 * File Name:       server.js
 * Last Modified:   12/9/18 3:12 AM
 *
 */

'use strict';

const http = require('http');
const url = require('url');
const routes = require('./routes');
const server_config = require('./configuration/config');
const PORT = server_config.server.NODE_PORT;
const grpcServer = require('./grpc_server')
const GRPC_PORT = server_config.server.GRPC_PORT
http.createServer(requestListener).listen(PORT);


/**
 * This function is called every time there is a new request, we wait on the data
 * coming in, after which, we look at the path, and match it to a handler on the routing table.
 *
 * @param request
 * @param response
 */
function requestListener(request, response) {
  let reqUrl = `http://${request.headers.host}${request.url}`;
  let parseUrl = url.parse(reqUrl, true);
  let pathname = parseUrl.pathname;

  // we're doing everything as json
  response.setHeader('Content-Type', 'application/json');

  // buffer for incoming data
  let buf = null;

  // listen for incoming data
  request.on('data', data => {
    if (buf === null) {
      buf = data;
    } else {
      buf = buf + data;
    }
  });

  // on end proceed with compute
  request.on('end', () => {
    let body = buf !== null ? buf.toString() : null;

    if (routes[pathname]) {
      let compute = routes[pathname].call(null, body);

      if (!(compute instanceof Promise)) {
        response.statusCode = 500;
        response.end(
            JSON.stringify({Message: 'Server error: Invalid Promise'}));
        console.warn('Whatever I got from the RPC was not a Promise!');
      } else {
        compute.then(res => {
          response.end(JSON.stringify(res));
        }).catch(err => {
          console.error(err);
          response.statusCode = 500;
          response.end(JSON.stringify({Message: 'Server error: ' + err}));
        });
      }

    } else {
      response.statusCode = 404;
      response.end(
          JSON.stringify({'Message': `Error: ${pathname} not found here`}));
    }
  });
}

grpcServer.startServer(GRPC_PORT);
console.log(`Starting the server on port ${PORT}`);
