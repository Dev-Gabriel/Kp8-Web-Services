var sync = require('async')
,   connectTo = require('../_services/db_connection')
,   logging = require('../_services/_log4')
,   getServerDate = require('../_services/web_methods/getServerDate');

var logs = logging('sendout');
var kp7global = 'DBConfig Global';
var dateFormat = require('dateformat');
idleSession = 'e_user_idle';

var dailyCTR = function(req, mainCB)
{
    KPTN        = req.query.KPTN
    TrxnType    = req.query.TrxnType
    regioncode  = req.query.regioncode

    console.log('-------------- Daily CTR Monitoring -----------------')
    console.log('KPTN       : ' +KPTN);
    console.log('TrxnType   : ' +TrxnType);
    console.log('regioncode : ' +regioncode);

    var tableName = 

    async.waterfall([
        function(cb){
            serverdate(cb);
        },
        function(serverdate){
            console.log('serverdate');
            console.log(serverdate);
        }
    ],function(error, response)
    {
        mainCB(null, response);
    });
}

function serverdate(cb)
{
    async.waterfall([
        function (cb){
            getServerDate(kp7global, cb);
        },function (getServerDate_response, cb){
            if(getServerDate_response.code != 1){
                response = getServerDate_response;
                cb(true);
            }
            else {
                serverDateTime = getServerDate_response.data.serverDateTime;
                cb(false);
            }
            console.log(serverDateTime)
        }
    ],function(serverDateTime){
        cb(serverDateTime)
    })
}

module.exports = dailyCTR;