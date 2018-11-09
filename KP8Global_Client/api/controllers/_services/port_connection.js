var fs = require('fs')  
  , ini = require('ini')

var path = 'C:\\kpconfig\\kp8GlobalPort.ini';
//var path = '../../kpconfig/kp8GlobalPort.ini';

module.exports = function () 
                 {
                    var config, iniFile, _port;

                    /*- check .ini existence -*/
                    try { 
                      config = ini.parse(fs.readFileSync(path, 'utf-8')); 
                      console.log('.ini: ' + config);
                    } 
                    catch (err) { 
                      console.log('port_connection.js Error:' + err);
                      return { code : -1, port : null, error : err.toString().replace(/[\\$'"]/g, "\\$&") } 
                    }

                    iniFile = config['DBConfig WebServer800']
                    
                    /*- check config if valid -*/
                    try { 
                        _port = iniFile.Port; 
                        console.log('ini assigned port: ' + _port);
                        return { code : 1, port : _port }; 
                    }
                    catch (err) {
                      console.log('port_connection.js Error:' + err);
                      return { code : 0, port : null, error : err.toString().replace(/[\\$'"]/g, "\\$&") + " - [" + DBConfig + "] is not found" }
                    }
                 }