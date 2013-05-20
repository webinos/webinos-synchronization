/*******************************************************************************
 *  Code contributed to the webinos project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright 2012 - 2013 Samsung Electronics (UK) Ltd
 * Author: Habib Virji (habib.virji@samsung.com)
 *******************************************************************************/

var Sync = function (jsonObject) {
    "use strict";
    var SyncObj = this;
    SyncObj.lastSync = {};
    /**
     * Get object hash of all elements we want to synchronize
     */
    this.getObjectHash = function () {
        var myKey, diff = {};
        for (myKey in jsonObject) {
            if (jsonObject.hasOwnProperty (myKey)) { // purposefully ignoring child elts
                diff[myKey] = require("crypto").createHash ("md5").update (JSON.stringify (jsonObject[myKey])).digest ("hex");
            }
        }
        return diff;
    };

    /**
     * Compare hash of the elements.
     */
    this.compareObjectHash = function (remoteJsonObject) {
        var diff = {};
        if (!remoteJsonObject) {
            remoteJsonObject = SyncObj.lastSync;
        }
        if (remoteJsonObject) {
            var ownJsonObject = SyncObj.getObjectHash();
            Object.keys(remoteJsonObject).forEach(function(key) {
                if (ownJsonObject[key] !== remoteJsonObject[key]){ // Object exists but hash differs
                    diff[key] = jsonObject[key];
                }
            });
            SyncObj.lastSync = remoteJsonObject;
        }
        return diff;
    };

    function findDiffApply(remoteJson, localJson) {
        var localDiff = {};
        for (var key in remoteJson) {
            if (remoteJson.hasOwnProperty(key) && localJson && localJson.hasOwnProperty(key)){
                if(typeof remoteJson[key] !== "object" ) {
                    if(remoteJson[key] !== localJson[key]){
                        localDiff[key] = remoteJson[key];
                    } else {
                        localDiff[key] = localJson[key];
                    }
                } else if (typeof remoteJson[key] === "object") {
                    localDiff[key]=findDiffApply(remoteJson[key], localJson[key]);
                }
            } else {
                localDiff[key] = remoteJson[key];
            }
        }

        // Special case when local JSON has more elements than remote JSON
        if (localJson && typeof localJson === "object" && Object.keys(localJson).length > Object.keys(remoteJson).length) {
            for (key in localJson) {
                if (!remoteJson.hasOwnProperty(key)){ // ignore remoteJSON as above part should handle it
                    localDiff[key] = localJson[key]; // Copy back all items
                }
            }
        }
        return localDiff;
    }


    /**
     * Here remoteJsonObject is not hash but actual data contents.
     */
    this.applyObjectHash = function(remoteJsonObject) {
        var myKey, diff = {}, updatedData = {};
        if (typeof remoteJsonObject !== "object") {
            return; // remoteJsonObject is not of type of object, return empty
        }
        var remote = Object.keys(remoteJsonObject)
        var local = Object.keys(jsonObject);
        remote.forEach(function(key){
            if(local.indexOf(key) === -1) { // This is new element add element
               jsonObject[key] = remoteJsonObject[key]
            } else { // Existing at both PZH and PZP
                if(typeof remoteJsonObject[key] === "string" && typeof jsonObject[key] === "string" &&
                remoteJsonObject[key] !== jsonObject[key]) { // Element are string
                    jsonObject[key] = remoteJsonObject[key];
                } else if (typeof remoteJsonObject[key] === "object"){
                    jsonObject[key] = findDiffApply(remoteJsonObject[key], jsonObject[key]);
                }
            }
        });
        return jsonObject;
    };
};
var ParseXML = function(xmlData, callback) {
    var xml2js = require('xml2js');
    var xmlParser = new xml2js.Parser(xml2js.defaults["0.2"]);
    var result = xmlParser.parseString(xmlData, function(err, jsonData) {
        if(!err) {
            callback(jsonData);
        }
    });
};

exports.sync = Sync;
exports.parseXML = ParseXML;
