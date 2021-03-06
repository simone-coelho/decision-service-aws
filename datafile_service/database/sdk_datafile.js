/*
 * Copyright (c) 2018, Simone A. Coelho - Optimizely
 *
 * Module:          datafile_manager
 * File Name:       sdk_datafile.js
 * Last Modified:   12/9/18 7:19 PM
 */
'use strict';

const fetch = require('node-fetch');
const placeHolder = require('string-placeholder');
const fileStorage = require('../database/db');
const SDK_URL = 'https://cdn.optimizely.com/datafiles/${SDK_KEY}.json';
let datafileKeys = [];

function refreshDatafiles(sdkKeys) {
  datafileKeys = sdkKeys;
  for (const key of datafileKeys) {
    let datafile = fetchDatafile(key, true);
    console.log('Updated datafile_json: ' + key + '[Revision: ' + datafile.revision + ']');
  }
}

function refreshDatafile(sdkKey) {
  let datafile = fetchDatafile(key, true);
  console.log('Updated datafile_json: ' + sdkKey + '[Revision: ' + datafile.revision + ']');
}

function getDatafileKeys() {
  let datafiles = fileStorage.datafiles.fetchAll();
  let result = [];
  for (const key of datafiles) {
    result.push(key.id);
  }
  return result;
}

/**
 * Fetches a datafile_json from a CDN or remote server.
 *
 * @param url
 * @returns {Promise<object>}
 */
async function fetchFileSync(url) {
  const response = await fetch(url);
  return await response.json();
}

/**
 * Fetches the SDK datafile_json from a CDN or remote server.
 *
 * @param datafileKey
 * @param fullRefresh
 * @returns {Promise<*>}
 */
async function fetchDatafile(datafileKey, fullRefresh) {
  try {
    let datafile = null;

    if (fullRefresh) {
      fileStorage.datafiles.delete(datafileKey);
    } else {
      datafile = fileStorage.datafiles.fetch(datafileKey);
    }

    if (!datafile) {
      datafile = await fetchFileSync(placeHolder(SDK_URL, {SDK_KEY: datafileKey}));
      if (datafile) {
        let storedDatafile = {};
        storedDatafile.id = datafileKey;
        storedDatafile.datafile_json = datafile;
        fileStorage.datafiles.save(storedDatafile);
        console.log('Successfully downloaded datafile_json: ' + datafileKey);
        return datafile;
      }
    } else {
      return datafile.datafile_json;
    }
  } catch (err) {
    console.error('Unable to download datafile_json: ' + datafileKey + ' - ' + err);
    return null;
  }
}

module.exports.downloadFileSync = fetchDatafile;
module.exports.refreshDatafile = refreshDatafile;
module.exports.refreshAllDatafiles = refreshDatafiles;
module.exports.getAllDatafiles = getDatafileKeys;
module.exports.getAllDatafileKeys = getDatafileKeys;
module.exports.sdk_url = SDK_URL;
