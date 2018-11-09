var logs = require('../_log4')()
  , connectTo = require('../db_connection')

module.exports = async function (dbConfig = '', callback) {
    var db = connectTo(dbConfig);
    var response;
    db.connection.query('SELECT NOW() AS sDateTime', function (error, result) {
        db.connection.end();
        if (error) {
            response = { code : -1, data: null, message : 'Something went wrong \\n Please try again later.', errorCode : 'E_DB_CON' };
            logs.error(response);
            logs.error(error);
            console.log(error);
        }
        else if (result.length == 0) {
            response = { code : 0, data: null, message : 'Unable to retrieve servers date & time', errorCode : 'E_NODATA' };
            logs.error(response);
            console.log('Unable to retrieve Server date & time...'); 
        }
        else {
            response = { code : 1, data: { serverDateTime: result[0].sDateTime}, message : 'Success', errorCode : null };
            console.log('Server Date: ' + response.data.serverDateTime);
        }
        callback(null, response);
    })
}