var async = require('async')
,   connectTo = require('../_services/db_connection')
,   logging = require('../_services/_log4')

var logs = logging('sendout');
var kpFormsglobal = 'DBConfig kpforms';
var kpAdminlogsglobal = 'DBConfig kpadminlogs';
var inSession = 'kp8usersglobal'
, idleSession = 'e_user_idle';

var getRatesPerBranchInt = function (req, mainCB) {
    // password = req.query.password;
    // username = req.query.username;
    bcode    = req.query.bcode;
    zcode    = req.query.zcode;
    amount   = req.query.amount;
    

    console.log('-------------- in Get Rates Per Branch International ------------------')
    async.waterfall([
        // function(cb){
        //     authenticate(username, password, cb)
        // },
        function(cb){
            // ----------------------- 1st function in waterfall -------------------------------
            var dbTrans1 = connectTo(kpFormsglobal);
            dbTrans1.connection.query("SELECT nextID,currID,nDateEffectivity,cDateEffectivity,cEffective,nextID, NOW() as currentDate FROM kpformsglobal.ratesperbranchheader WHERE cEffective = 1 and branchcode = ? and zonecode = ?"    
        ,[bcode, zcode]
        ,function(error, result){
            dbTrans1.connection.end();
            var response;
            if(error)
            {
                console.log(error)
                response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                logs.fatal(response);
                logs.fatal(error);
                cb(error, response)
            }
            else if(result.length == 0) {
                // --------------- no result found ------------------
                console.log('no results found');
                response = { code : 0, data : { }, message : "Data query: no results found", errorCode : "E_DATA" }
                logs.info(response);
                error = true;
                cb(error, response)
            }
            else
            {
                console.log(result[0]);
                var nextID = result[0].nextID;
                var currID = result[0].currID;
                var nDateEffectivity = result[0].nDateEffectivity;
                var cDateEffectivity = result[0].cDateEffectivity;
                var cEffective = result[0].cEffective;
                var nextID = result[0].nextID;
                var currentDate = result[0].currentDate;
                cb(error,nextID,nDateEffectivity,currentDate,currID)
            }
            
        });
        },function(nextID,nDateEffectivity, currentDate, currID, cb){
            // ----------------------- 2nd function in waterfall ----------------------
            console.log('nextID: ' +nextID)
            console.log('nDateEffectivity : ' + nDateEffectivity)
            console.log('currentDate : ' + currentDate)
            if (nextID == 0 || (new Date(nDateEffectivity) - new Date(currentDate)) > 0)
                {
                    // TRUE
                    console.log('if nextID = 0')
                    var dbTrans2 = connectTo(kpFormsglobal);
                    dbTrans2.connection.query("SELECT ChargeValue AS charge FROM kpformsglobal.ratesperbranchcharges WHERE ROUND(?,2) BETWEEN MinAmount AND MaxAmount AND `type` = ?;"
                    ,[amount, currID]
                    ,function(error, result){
                        dbTrans2.connection.end();
                        var response;
                        if (error)
                        {
                            response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                            logs.fatal(response);
                            logs.fatal(error);
                        }
                        else if(result.length == 0) 
                        {
                            console.log('Data 404: ChargeValue');
                            response = { code : 0, data : { }, message : "Data 404: ChargeValue", errorCode : "E_DATA" }
                            logs.info(response);
                            error = true;
                        }
                        else
                        {
                            response = {
                                code : 1,
                                result
                            }
                        }
                        cb(error, response);
                    });
                }
                else
                {
                    // FALSE
                    if((new Date(nDateEffectivity) - new Date(currentDate)) < 0)
                    {
                        var dbTrans3 = connectTo(kpFormsglobal);
                        dbTrans3.connection.beginTransaction(function (errorTransaction){
                            if (errorTransaction)
                            {
                                response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                                logs.fatal(response);
                                logs.fatal(errorTransaction);
                                cb(errorTransaction, response);
                            }
                            else 
                            {
                                async.parallel([function(parCB)
                                    {
                                    // 1st update
                                        dbTrans3.connection.query("update kpformsglobal.ratesperbranchheader SET  cEffective = 2 where cEffective = 1 and branchcode = ? and zonecode = ?;"
                                        ,[bcode, zcode]
                                        ,function(error, result){
                                            parCB(error)
                                        })
                                    }, function(parCB)
                                    {
                                    // 2nd update
                                        dbTrans3.connection.query("update kpformsglobal.ratesperbranchheader SET cEffective = 1 where currID = ? and branchcode = ? and zonecode = ?;"
                                        ,[nextID,bcode, zcode]
                                        ,function(error, result){
                                            parCB(error)
                                        })
                                    }, function(parCB)
                                    {
                                    // insert logs;
                                        dbTrans3.connection.query("insert into kpadminlogsglobal.kpratesupdatelogs (ModifiedRatesID, NewRatesID, DateModified, Modifier) values (?, ?, NOW(), ?);"
                                        ,[nextID - 1, nextID, 'boskpws']
                                        ,function(error, result){
                                            parCB(error)
                                        })
                                    }
                                ],function(error){
                                    if(error){
                                        dbTrans3.connection.rollback(function(err){ dbTrans3.connection.end(); });
                                        response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                                        logs.fatal(response);
                                        logs.fatal(error);
                                        callback(errorTransaction);
                                    }
                                    else{
                                        logs.info("SUCCESS:: UPDATE kpformsglobal.ratesperbranchheader: SET cEffective: 2 WHERE cEffective: 1 AND branchcode: " + bcode + " AND zonecode: " + zcode);
                                        logs.info("SUCCESS:: UPDATE kpformsglobal.ratesperbranchheader: SET cEffective: 1 WHERE currID: " + nextID + " AND branchcode: " + bcode + " AND zonecode: " + zcode);
                                        logs.info("SUCCESS:: INSERT INTO kpadminlogsglobal.kpratesupdatelogs: ModifiedRatesID: " + (nextID - 1) + " " +"NewRatesID: " + nextID + " " +"Modifier: boskpws");
                                        dbTrans3.connection.commit(function(err){ dbTrans3.connection.end(); });
                                        // select charge
                                        var dbTrans4 = connectTo(kpFormsglobal);
                                        dbTrans4.connection.query("SELECT ChargeValue AS charge FROM kpformsglobal.ratesperbranchcharges WHERE ROUND(?,2) BETWEEN MinAmount AND MaxAmount AND `type` = ?;"
                                        ,[amount, currID]
                                        ,function(error, result){
                                            dbTrans4.connection.end();
                                            if(error) {
                                                response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                                                logs.fatal(response);
                                                logs.fatal(error);
                                            }
                                            else if(result.length == 0) {
                                                response = { code : 0, data : { }, message : "Data query: no results found", errorCode : "E_DATA" }
                                                logs.info(response);
                                                error = true;
                                            }
                                            else {
                                                response = {
                                                    code : 1,
                                                    result
                                                }
                                            }
                                            cb(error, response);
                                        });
                                    }
                                })
                            }
                        });
                    }
                }
        }
    ],function(error, _response){
        mainCB(null, _response);
    });
}

{
    // function authenticate(username, password, funcCb)
    // {
    //     var uname = 'boswebserviceusr';
    //     var pword = 'boyursa805';

    //     if (uname == username && pword == password)
    //     {
    //         funcCb(null);
    //     }
    //     else
    //     {
    //         response = { code : 1, data : {}, message : 'Invalid credentials.'}
    //         funcCb(true, response);
    //     }
    // }
}

module.exports = getRatesPerBranchInt;