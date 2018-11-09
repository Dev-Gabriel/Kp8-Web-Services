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
    console.log('wee')
}

module.exports = dailyCTR;