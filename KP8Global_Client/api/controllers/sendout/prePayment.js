var async = require('async')
  , connectTo = require('../_services/db_connection')
  , logging = require('../_services/_log4')

var logs = logging('sendout');
var kp7Forms = 'DBConfig kpforms';
var kp7Forex = 'DBConfig KpForex';
var kp7Trans = 'DBConfig Transaction';
var inSession = 'kp8usersglobal'
  , idleSession = 'e_user_idle';

var address, serverDate, exchangeRate, formattedServerDate;
var charge, maxAmountLimit

var prePayment = function (req, mainCB) {
      async.waterfall([
          function (cb){
                getInitialInfo(req,cb);
          },
          function (init_response, cb) {
              console.log('init_response : -');
                console.log(init_response);
                if (init_response.code == 1) {
                    address = init_response.data.address;
                    serverDate = init_response.data.serverDate;
                    exchangeRate = init_response.data.exchangeRate;

                    var dbDate = new Date(serverDate)
                        , dd = dbDate.getDate()
                        , mm = dbDate.getMonth() + 1 //January is 0!
                        , yyyy = dbDate.getFullYear();
                        if ( dd < 10 ) { dd='0'+dd; } 
                        if ( mm < 10 ) { mm='0'+mm; } 
                    formattedServerDate = mm + '/' + dd + '/' + yyyy;

                    cb(null);
                }
                else
                    cb(true, init_response);
          }, function (cb) {
                var dbTrans = connectTo(kp7Trans);
                console.log("SELECT MAX(c.MaxAmount) AS maxAmount FROM kpformsglobal.charges c ");
                console.log("INNER JOIN kpformsglobal.headercharges hc ON hc.currID = c.Type WHERE hc.cEffective = 1;")
                dbTrans.connection.query("SELECT MAX(c.MaxAmount) AS maxAmount FROM kpformsglobal.charges c "
                                        +"INNER JOIN kpformsglobal.headercharges hc ON hc.currID = c.Type WHERE hc.cEffective = ?;"
                ,[1]
                ,function (error, result){
                    dbTrans.connection.end();
                    var response;
                    if(error){
                        console.log(error)
                        response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                        logs.fatal(response);
                        logs.fatal(error);
                    }
                    else if (result.length == 0) {
                        console.log('Data 404 : maxAmount');
                        response = { code : 0, data : { }, message : "Data 404 : maxAmount", errorCode : "E_DATA" }
                        logs.info(response);
                        error = true;
                    }
                    else {
                        console.log(result[0]);
                        maxAmountLimit = result[0].maxAmount;
                    }                  
                    cb(error, response);
                });
          }, function (response, funcCb) {
                calculateChargePerBranchGlobal(req, funcCb);
          },
          function (cal_response, cb) {
                if (cal_response.errorCode == "E_NO_RATESPERBRANCHHEADEER") {
                    calculateChargeGlobal(cb);
                }
                else if (cal_response.code == 1) {
                    charge = cal_response.data.charge
                    var response = { code : 1, data : { address : address, date : formattedServerDate, exchangeRate : exchangeRate
                                , charge : charge, maxAmountLimit : maxAmountLimit, tax : 0 }
                                , message : "Pre-Payment Disclosure", errorCode : null }
                    cb(true, response);
                }
                else {
                    cb(true, cal_response);
                }
          },
          function(cal2_response, cb) {
                if (cal2_response.code == 1) {
                    charge = cal2_response.data.charge
                    var response = { code : 1, data : { address : address, date : formattedServerDate, exchangeRate : exchangeRate
                                , charge : charge, maxAmountLimit : maxAmountLimit, tax : 0 }
                                , message : "Pre-Payment Disclosure_", errorCode : null }
                    cb(true, response);
                }
                else {
                    cb(true, cal_response);
                }
          }
      ], function (error, _response){
            mainCB(null, _response);
      });
}
module.exports = prePayment;

function getInitialInfo(req, funcCb) {
    var dbForms = connectTo(kp7Forms);
    console.log(dbForms);
    var dbForex = connectTo(kp7Forex);
    var address, serverDate;
    var bName, bCode, zCode, bClass, descriptions, buying, selling;
    var remarks, identifier, effectiveDate;
    var exchangeRate;

    var response = { code : 0, data : { }, message : null, errorCode : null }

    async.waterfall([
        function (callback) {
          console.log('SELECT now() AS serverDate, address FROM kpusersglobal.branches WHERE branchcode = 106 AND zonecode = 3');
          dbForms.connection.query('SELECT now() AS serverDate, address FROM kpusersglobal.branches WHERE branchcode = ? AND zonecode = ?', 
          [106, 3]
          , function (error, result) {
              dbForms.connection.end();
              if(error){
                console.log(error);
                response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                logs.fatal(response);
                logs.fatal(error);
              }
              else if (result.length == 0) {
                console.log('No address found');
                response = { code : 0, data : { }, message : "No address found", errorCode : "E_DATA" }
                logs.info(response);
                error = true;
              }
              else {
                console.log(result);
                address = result[0].address;
                serverDate = result[0].serverDate;
              }
              callback(error);
          });
        }, function (callback) {
              console.log('CALL mlforexrate.sp_getbranchclassification( '+ req.session.user.bCode + ' , ' + req.session.user.zCode + ' )'  );
              dbForex.connection.query('CALL mlforexrate.sp_getbranchclassification (?,?)'
              ,[req.session.user.bCode, req.session.user.zCode]
              , function(error, result) {
                  if(error){
                      console.log(error);
                      response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                      logs.fatal(response);
                      logs.fatal(error);
                      dbForex.connection.end();
                  }
                  else if (result[0].length == 0) {
                      console.log('No branch classification found');
                      response = { code : 0, data : { }, message : "No branch classification found", errorCode : "E_DATA" }
                      logs.info(response);
                      error = true;
                      dbForex.connection.end();
                  }
                  else {
                      console.log('resultings are : -------------')
                      console.log(result);
                      bName        = result[0][0].branchname;
                      bCode        = result[0][0].branchcode;
                      zCode        = result[0][0].zonecode;
                      bClass       = result[0][0].classification;
                      descriptions = result[0][0].descriptions;
                      buying       = result[0][0].buying;
                      selling      = result[0][0].selling;
                  }                  
                  callback(error);
              })
        }, function (callback) {
              console.log('SELECT remarks, identifier, IF(effectivedate IS NULL, NULL, ');
              console.log('DATE_FORMAT(effectivedate,"%Y-%m-%d %H:%i:%s")) AS effectiveDate ');
              console.log('FROM mlforexrate.branchforextagrates WHERE branchcode =' + req.session.user.bCode + 'AND zonecode = ' + req.session.user.zCode)
              dbForex.connection.query('SELECT remarks, identifier, IF(effectivedate IS NULL, NULL, '
                                     + 'DATE_FORMAT(effectivedate,"%Y-%m-%d %H:%i:%s")) AS effectiveDate '
                                     + 'FROM mlforexrate.branchforextagrates WHERE branchcode = ? AND zonecode = ?'
              ,[req.session.user.bCode, req.session.user.zCode]
              ,function (error, result) {
                  if(error){
                      console.log(error)
                      response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                      logs.fatal(response);
                      logs.fatal(error);
                      dbForex.connection.end();
                  }
                  else if (result.length == 0) {
                      console.log('Data 404 : remarks identifier and effectiveDate');
                      response = { code : 0, data : { }, message : "Data 404 : remarks identifier and effectiveDate", errorCode : "E_DATA" }
                      logs.info(response);
                      //error = true;
                      //dbForex.connection.end();


			        // console.log("CALL mlforexrate.sp_getbranchrates("+req.session.user.bCode+","+req.session.user.zCode+",'USD','"+bClass+"')");
                    // dbForex.connection.query("CALL mlforexrate.sp_getbranchrates(?,?,?,?)"
                    // ,[req.session.user.bCode, req.session.user.zCode, 'USD', bClass]
                    // , function (error, result){
                    //    // dbForex.connection.end();
                    //     if(error){
                    //         console.log(error)
                    //         response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                    //         logs.fatal(response);
                    //         logs.fatal(error);
                    //     }
                    //     else if (result[0].length == 0) {
                    //         console.log('Data 404: buying');
                    //         response = { code : 0, data : { }, message : "Data 404: buying", errorCode : "E_DATA" }
                    //         logs.info(response);
                    //         error = true;
                    //     }
                    //     else {
                    //         console.log(result[0]);
                    //         exchangeRate = result[0][0].buying;
                    //     }  
                    // })
                  }
                  else {
                      console.log(result[0]);
                      remarks = result[0].remarks;
                      identifier = result[0].identifier;
                      effectiveDate = result[0].effectiveDate
                  }
                  callback(error);
              });
        }, function (callback) {
            console.log('server date : ' + new Date(serverDate));
            console.log('effctv date : ' + new Date(effectiveDate));
            console.log('server date is greater ? '+ ((new Date(serverDate) - new Date(effectiveDate)) > 0));
            if (remarks != 'Automate' && (new Date(serverDate) - new Date(effectiveDate)) > 0) {
                console.log("SELECT b.branchname AS bName, b.branchcode AS bCode, bm.curr_sell AS selling, ");
                console.log("bm.curr_buy AS buying, 'USD' AS currency ");
                console.log("FROM mlforexrate.brachrateclassification b ");
                console.log("INNER JOIN mlforexrate.branchforexmanual bm ON bm.branchcode = b.branchcode ");
                console.log("AND bm.zonecode = b.zonecode ");
                console.log("WHERE bm.branchcode = "+req.session.user.bCode+" AND bm.zonecode = " + req.session.user.zCode);
                dbForex.connection.query("SELECT b.branchname AS bName, b.branchcode AS bCode, bm.curr_sell AS selling, "
                                       + "bm.curr_buy AS buying, ? AS currency "
                                       + "FROM mlforexrate.brachrateclassification b "
                                       + "INNER JOIN mlforexrate.branchforexmanual bm ON bm.branchcode = b.branchcode "
                                       + "AND bm.zonecode = b.zonecode "
                                       + "WHERE bm.branchcode = ? AND bm.zonecode = ?"
                ,['USD', req.session.user.bCode, req.session.user.zCode]
                ,function (error, result){
                    dbForex.connection.end();
                    if(error){
                        console.log(error)
                        response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                        logs.fatal(response);
                        logs.fatal(error);
                    }
                    else if (result.length == 0) {
                        console.log('Data 404: buying');
                        response = { code : 0, data : { }, message : "Data 404: buying", errorCode : "E_DATA" }
                        logs.info(response);
                        error = true;
                    }
                    else {
                        console.log(result[0]);
                        exchangeRate = result[0].buying;
                    }                  
                    callback(error);
                });
            }
            else {
                console.log("CALL mlforexrate.sp_getbranchrates("+req.session.user.bCode+","+req.session.user.zCode+",'USD','"+bClass+"')");
                dbForex.connection.query("CALL mlforexrate.sp_getbranchrates(?,?,?,?)"
                ,[req.session.user.bCode, req.session.user.zCode, 'USD', bClass]
                , function (error, result){
                    dbForex.connection.end();
                    if(error){
                        console.log(error)
                        response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                        logs.fatal(response);
                        logs.fatal(error);
                    }
                    else if (result[0].length == 0) {
                        console.log('Data 404: buying');
                        response = { code : 0, data : { }, message : "Data 404: buying", errorCode : "E_DATA" }
                        logs.info(response);
                        error = true;
                    }
                    else {
                        console.log(result[0]);
                        exchangeRate = result[0][0].buying;
                    }                  
                    callback(error);
                })
            }
        }], function (error){
                if (!error)
                    response = { code : 1, data : { address : address, serverDate : serverDate, exchangeRate : exchangeRate }
                             , message : null, errorCode : null }
                funcCb(null, response);
    });
}
function calculateChargePerBranchGlobal(req, funcCb) {
    var dbTrans = connectTo(kp7Trans);
    var nextID = null, currID, nDateEffectivity, currentDate;
    var charge;

    var response = { code : 0, data : { }, message : null, errorCode : null }

    async.waterfall([
        function (callback) {
                console.log("SELECT nextID, currID, nDateEffectivity, cDateEffectivity, cEffective, ");
                console.log("NOW() AS currentDate FROM kpformsglobal.ratesperbranchheader ");
                console.log("WHERE cEffective = 1 AND branchcode = "+req.session.user.bCode+" AND zonecode = "+req.session.user.zCode+";")
                dbTrans.connection.query("SELECT nextID, currID, nDateEffectivity, cDateEffectivity, cEffective, "
                                        +"NOW() AS currentDate FROM kpformsglobal.ratesperbranchheader "
                                        +"WHERE cEffective = 1 AND branchcode = ? AND zonecode = ?;"
                ,[req.session.user.bCode, req.session.user.zCode]
                ,function (error, result){
                        if(error){
                            dbTrans.connection.end();
                            console.log(error)
                            response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                            logs.fatal(response);
                            logs.fatal(error);
                        }
                        else if (result.length == 0) {
                            dbTrans.connection.end();
                            console.log('Data 404: nextID, currID, nDateEffectivity, cDateEffectivity, cEffective, currentDate');
                            response = { code : 0, data : { }, message : "Data 404: nextID, currID, nDateEffectivity, cDateEffectivity, cEffective, currentDate"
                                    , errorCode : "E_NO_RATESPERBRANCHHEADEER" }
                            logs.info(response);
                            error = true;
                        }
                        else {
                            console.log(result[0]);
                            nextID = result[0].nextID;
                            currID = result[0].currID;
                            nDateEffectivity = result[0].nDateEffectivity.startsWith(0) ? null : result[0].nDateEffectivity;
                            currentDate = new Date(result[0].currentDate)
                        }                  
                        callback(error);
                });
        }, function (callback) {
            if (nextID == 0 || (new Date(nDateEffectivity) - new Date(currentDate)) > 0) {
                console.log("SELECT ChargeValue AS charge, MinAmount AS minAmount, MaxAmount AS maxAmount ");
                console.log("FROM kpformsglobal.ratesperbranchcharges WHERE `Type` = " + currID + ";");
                dbTrans.connection.query("SELECT ChargeValue AS charge, MinAmount AS minAmount, MaxAmount AS maxAmount "
                                       + "FROM kpformsglobal.ratesperbranchcharges WHERE `Type` = ?;"
                ,[currID]
                , function (error, result){
                    dbTrans.connection.end();
                    if(error) {
                        dbTrans.connection.end();
                        console.log(error)
                        response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                        logs.fatal(response);
                        logs.fatal(error);
                    }
                    else if (result.length == 0) {
                        dbTrans.connection.end();
                        console.log('Data 404: ChargeValue');
                        response = { code : 0, data : { }, message : "Data 404: ChargeValue", errorCode : "E_DATA" }
                        logs.info(response);
                        error = true;
                    }
                    else {
                        console.log(result);
                        charge = result;
                        maxAmountLimit = result[result.length - 1].maxAmount;
                        console.log(maxAmountLimit);
                    }
                    callback(error);
                });
            }
            else {
                if ((new Date(nDateEffectivity) - new Date(currentDate)) < 0) {
                    dbTrans.connection.beginTransaction(function (errorTransaction){
                      if (errorTransaction){
                          dbTrans.connection.end();                        
                          response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                          logs.fatal(response);
                          logs.fatal(error);
                          callback(errorTransaction);
                      }
                      else {
                          async.parallel([
                            function(parCB) {
                              dbTrans.connection.query("UPDATE kpformsglobal.ratesperbranchheader SET cEffective = 2 "
                                                      +"WHERE cEffective = 1 AND branchcode = ? AND zonecode = ?"
                              ,[req.session.user.bCode, req.session.user.zCode]
                              , function (error, result){
                                  parCB(error)
                              })
                          }, function (parCB) {
                              dbTrans.connection.query("update kpformsglobal.ratesperbranchheader SET cEffective = 1 "
                                                      +"WHERE currID = ? AND branchcode = ? AND zonecode = ?"
                              ,[nextID, req.session.user.bCode, req.session.user.zCode]
                              , function (error, result){
                                  parCB(error)
                              })
                          }, function (parCB) {
                              dbTrans.connection.query("insert into kpadminlogsglobal.kpratesupdatelogs (ModifiedRatesID, NewRatesID, DateModified, Modifier) "
                                                      +"values (?, ?, NOW(), ?);"
                              ,[(parseInt(nextID)-1), nextID, "KP8Global-Client"]
                              , function (error, result){
                                  parCB(error)
                              })
                          }
                          ], function (error){
                              if (error) {
                                  connection.rollback(function(err){ connection.end(); });
                                  response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                                  logs.fatal(response);
                                  logs.fatal(error);
                                  callback(errorTransaction);
                              }
                              else {
                                  logs.info("SUCCESS:: UPDATE kpformsglobal.ratesperbranchheader: SET cEffective: 2 WHERE cEffective: 1 AND branchcode: " 
                                          + req.session.user.bCode + " AND zonecode: " + req.session.user.zCode);
                                  logs.info("SUCCESS:: UPDATE kpformsglobal.ratesperbranchheader: SET cEffective: 1 WHERE currID: " 
                                          + nextID + " AND branchcode: " + req.session.user.bCode + " AND zonecode: " + req.session.user.zCode);
                                  logs.info("SUCCESS:: INSERT INTO kpadminlogsglobal.kpratesupdatelogs: ModifiedRatesID: " 
                                          + (nextID - 1) + " " +"NewRatesID: " + nextID + " " + "Modifier: boskpws");

                                  connection.commit(function(err){ connection.end(); });
                                  console.log("SELECT ChargeValue AS charge, MinAmount AS minAmount, MaxAmount AS maxAmount ");
                                  console.log("FROM kpformsglobal.ratesperbranchcharges WHERE `Type` = "+currID+";");
                                  dbTrans.connection.query("SELECT ChargeValue AS charge, MinAmount AS minAmount, MaxAmount AS maxAmount "
                                                         + "FROM kpformsglobal.ratesperbranchcharges WHERE `Type` = ?;"
                                  ,[currID]
                                  , function (error, result){
                                      dbTrans.connection.end();
                                      if(error) {
                                          dbTrans.connection.end();
                                          console.log(error)
                                          response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                                          logs.fatal(response);
                                          logs.fatal(error);
                                      }
                                      else if (result.length == 0) {
                                          dbTrans.connection.end();
                                          console.log('no results found');
                                          response = { code : 0, data : { }, message : "Data query: no results found", errorCode : "E_DATA" }
                                          logs.info(response);
                                          error = true;
                                      }
                                      else {
                                          console.log(result);
                                          charge = result;
                                      }
                                      callback(error);
                                  });
                              }

                          })
                      }
                    })
                } 
            }
        }
      ], function (error) {
             if (!error) {
              response = { code : 1, data : { charge : charge }, message : "Pre-Payment Disclosure", errorCode : null }
            }
            console.log(response);
            funcCb(null, response);
      });
}
function calculateChargeGlobal(funcCb) {
    var dbTrans = connectTo(kp7Trans);
    var nextID = null, currID, nDateEffectivity, currentDate;
    var charge;

    var response = { code : 0, data : { }, message : null, errorCode : null }

    async.waterfall([
        function (callback) {
                console.log("SELECT nextID, currID, nDateEffectivity, cDateEffectivity, cEffective, ");
                console.log("NOW() AS currentDate FROM kpformsglobal.headercharges WHERE cEffective = 1;")
                dbTrans.connection.query("SELECT nextID,currID,nDateEffectivity,cDateEffectivity,cEffective,nextID, "
                                        +"NOW() as currentDate FROM kpformsglobal.headercharges WHERE cEffective = ?;"
                ,[1]
                ,function (error, result){
                if(error){
                    dbTrans.connection.end();
                    console.log(error)
                    response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                    logs.fatal(response);
                    logs.fatal(error);
                }
                else if (result.length == 0) {
                    dbTrans.connection.end();
                    console.log('Data 404: nextID, currID, nDateEffectivity, cDateEffectivity, cEffective, currentDate');
                    response = { code : 0, data : { }, message : "Data 404: nextID, currID, nDateEffectivity, cDateEffectivity, cEffective, currentDate"
                               , errorCode : "E_NO_RATESPERBRANCHHEADEER2" }
                    logs.info(response);
                    error = true;
                }
                else {
                    console.log(result[0]);
                    nextID = result[0].nextID;
                    currID = result[0].currID;
                    nDateEffectivity = result[0].nDateEffectivity.startsWith(0) ? null : result[0].nDateEffectivity;
                    currentDate = new Date(result[0].currentDate)
                }                  
                callback(error);
          });
        }, function (callback) {
            if (nextID == 0 || (new Date(nDateEffectivity) - new Date(currentDate)) > 0) {
                console.log("SELECT ChargeValue AS charge, MinAmount AS minAmount, MaxAmount AS maxAmount ");
                console.log("FROM kpformsglobal.charges WHERE `Type` = " + currID + ";");
                dbTrans.connection.query("SELECT ChargeValue AS charge, MinAmount AS minAmount, MaxAmount AS maxAmount "
                                      + "FROM kpformsglobal.charges WHERE `Type` = ?;"
                ,[currID]
                , function (error, result){
                    dbTrans.connection.end();
                    if(error) {
                        dbTrans.connection.end();
                        console.log(error)
                        response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                        logs.fatal(response);
                        logs.fatal(error);
                    }
                    else if (result.length == 0) {
                        dbTrans.connection.end();
                        console.log('Data 404: ChargeValue');
                        response = { code : 0, data : { }, message : "Data 404: ChargeValue", errorCode : "E_DATA" }
                        logs.info(response);
                        error = true;
                    }
                    else {
                        console.log(result);
                        charge = result;
                        maxAmountLimit = result[result.length - 1].maxAmount;
                        console.log(maxAmountLimit);
                    }
                    callback(error);
                });
            }
            else {
                if ((new Date(nDateEffectivity) - new Date(currentDate)) < 0) {
                    dbTrans.connection.beginTransaction(function (errorTransaction){
                      if (errorTransaction){
                          dbTrans.connection.end();                        
                          response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                          logs.fatal(response);
                          logs.fatal(error);
                          callback(errorTransaction);
                      }
                      else {
                          async.parallel([
                            function(parCB) {
                              dbTrans.connection.query("UPDATE kpformsglobal.headercharges SET cEffective = 2 WHERE cEffective = ?"
                              ,[1]
                              , function (error, result){
                                  parCB(error)
                              })
                          }, function (parCB) {
                              dbTrans.connection.query("update kpformsglobal.headercharges SET cEffective = 1 WHERE currID = ?"
                              ,[nextID]
                              , function (error, result){
                                  parCB(error)
                              })
                          }, function (parCB) {
                              dbTrans.connection.query("insert into kpadminlogsglobal.kpratesupdatelogs (ModifiedRatesID, NewRatesID, DateModified, Modifier) "
                                                      +"values (?, ?, NOW(), ?);"
                              ,[(parseInt(nextID)-1), nextID, "KP8Global-Client"]
                              , function (error, result){
                                  parCB(error)
                              })
                          }
                          ], function (error){
                              if (error) {
                                  connection.rollback(function(err){ connection.end(); });
                                  response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                                  logs.fatal(response);
                                  logs.fatal(error);
                                  callback(errorTransaction);
                              }
                              else {
                                  logs.info("SUCCESS:: UPDATE kpformsglobal.headercharges: SET cEffective: 2 WHERE cEffective: 1 AND branchcode: ");
                                  logs.info("SUCCESS:: UPDATE kpformsglobal.headercharges: SET cEffective: 1 WHERE currID: " + nextID );
                                  logs.info("SUCCESS:: INSERT INTO kpadminlogsglobal.kpratesupdatelogs: ModifiedRatesID: " 
                                          + (nextID - 1) + " " +"NewRatesID: " + nextID + " " + "Modifier: boskpws");

                                  connection.commit(function(err){ connection.end(); });
                                  console.log("SELECT ChargeValue AS charge, MinAmount AS minAmount, MaxAmount AS maxAmount ");
                                  console.log("FROM kpformsglobal.ratesperbranchcharges WHERE `Type` = "+currID+";");
                                  dbTrans.connection.query("SELECT ChargeValue AS charge, MinAmount AS minAmount, MaxAmount AS maxAmount "
                                                         + "FROM kpformsglobal.ratesperbranchcharges WHERE `Type` = ?;"
                                  ,[currID]
                                  , function (error, result){
                                      dbTrans.connection.end();
                                      if(error) {
                                          dbTrans.connection.end();
                                          console.log(error)
                                          response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                                          logs.fatal(response);
                                          logs.fatal(error);
                                      }
                                      else if (result.length == 0) {
                                          dbTrans.connection.end();
                                          console.log('no results found');
                                          response = { code : 0, data : { }, message : "Data query: no results found", errorCode : "E_DATA" }
                                          logs.info(response);
                                          error = true;
                                      }
                                      else {
                                          console.log(result);
                                          charge = result;
                                      }
                                      callback(error);
                                  });
                              }

                          })
                      }
                    })
                } 
            }
        }
      ], function (error) {
             if (!error) {
              response = { code : 1, data : { charge : charge }, message : "Pre-Payment Disclosure", errorCode : null }
            }
            console.log(response);
            funcCb(null, response);
      });
}