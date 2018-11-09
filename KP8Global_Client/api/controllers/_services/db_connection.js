var fs = require('fs')  
  , ini = require('ini')
  , mysql = require('mysql')

var path = 'C:\\kpconfig\\globalConf.ini';
//var path = '../../kpconfig/globalConf.ini';

module.exports = function (DBConfig) 
                 {
                    var config, iniFile, _connection;

                    /*- check .ini existence -*/
                    try { 
                      config = ini.parse(fs.readFileSync(path, 'utf-8'));
                    } 
                    catch (err) {
                      return { code : -1, connection : null, error : err.toString().replace(/[\\$'"]/g, "\\$&") } 
                    }

                    iniFile = config[DBConfig]
                    
                    /*- check config if valid -*/
                    try {
                      _connection = mysql.createConnection({  host : iniFile.Server,
                                                              user : iniFile.UID,
                                                          password : iniFile.Password,
                                                          database : iniFile.Database,
                                                              pool : iniFile.Pool == '1' ? true : false,
                                                    connectTimeout : parseInt(iniFile.Tout)
                                                        });
                      return { code : 1, connection : _connection };
                    }
                    catch (err) {
                      return { code : 0, connection : null, error : err.toString().replace(/[\\$'"]/g, "\\$&") + " - [" + DBConfig + "] is not found" }
                    }
                 }