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
        
    ],function(error, response)
    {
        mainCB(null, response);
    });
}


module.exports = dailyCTR;