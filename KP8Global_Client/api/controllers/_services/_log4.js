var log4js = require('log4js');
var fileLocation = 'C:\\kp8globallogs\\KP8Global_Client\\' //development env
//var fileLocation = '../../kp8globallogs/KP8Global_Client/' //release env
                
module.exports = function (method){
                    var yy = new Date().getFullYear()
                    var mm = parseInt(new Date().getMonth()) + 1
                      , mm = mm < 10 ? '0' + mm : mm;                  
                    var dd = parseInt(new Date().getDate())
                      , dd = dd < 10 ? '0' + dd : dd;
                                    
                    log4js.configure({ // configure to use all types in different files.
                        appenders : {
                            default : {
                                type: 'file',
                                filename: fileLocation + 'GlobalClient_' + yy + mm + dd + '.log',
                            },
                            index : { 
                                type: 'file',
                                filename: fileLocation + 'index_' + yy + mm + dd + '.log',
                            },
                            sendout : { 
                                type: 'file',
                                filename: fileLocation + 'sendout_' + yy + mm + dd + '.log',
                            },
                            payout : { 
                                type: 'file',
                                filename: fileLocation + 'sendout_' + yy + mm + dd + '.log',
                            }
                        },
                        categories : {
                            default: { appenders: ['default'], level: 'info' },
                            index:   { appenders: [ 'index' ], level: 'info' },
                            sendout: { appenders: ['sendout'], level: 'info' },
                            payout:  { appenders: [ 'payout'], level: 'info' }
                        }
                    });
                    return log4js.getLogger(method);
                }