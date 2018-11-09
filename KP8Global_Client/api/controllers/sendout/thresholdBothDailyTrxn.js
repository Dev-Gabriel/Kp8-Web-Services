var sync = require('async')
,   connectTo = require('../_services/db_connection')
,   logging = require('../_services/_log4')
,   getServerDate = require('../_services/web_methods/getServerDate');

var logs = logging('sendout');
var kp7global = 'DBConfig Global';
var dateFormat = require('dateformat');
idleSession = 'e_user_idle';

var thresholdBothDaily = function (req, mainCB) 
{
    customeridno    = req.query.customeridno;
    firstname       = req.query.firstname;
    lastname        = req.query.lastname;
    middlename      = req.query.middlename;
    amount          = req.query.amount;
    syscreator      = req.query.syscreator;
    trxntype        = req.query.trxntype;
    regioncode      = req.query.regioncode;

    console.log('-------------- threshold ------------------')

    var serverDateTime
    , response = { code : 0, data : null, message: '', errorCode : null }
    , error = null;
    var totalamtcancel = 0;
    var totalamt = 0;
    var amttype = 0;
    var qrychktrxncancel = '';
    var qrychknewcust = '';
    var customertable = '';

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
        },function(cb)
        {
            getcustomertable(lastname,cb)
        },
        function(response,cb)
        {
            var custtable = response.data;
            if(regioncode == '4'){
                customertable = "kpadminlogsglobal.nevadaCustomer" + custtable;
            }
            else{
                customertable = "kpadminlogsglobal.customer" + custtable;
            }
            cb(null,customertable)
        },
        function(customertable,cb)
        {
            var tdate = dateFormat(serverDateTime,'yyyy-mm-dd 00:00:00');
            var edate = dateFormat(serverDateTime,'yyyy-mm-dd 23:59:59');
            console.log(tdate);
            console.log(edate);
            if(trxntype == '1'){
                qrychktrxncancel = "select if(sum(amount) is null,0,sum(amount)) as amtcancel from " + customertable + " where CustomerType = 'S' and (transdate between '" + tdate + "' and '" + edate + "') and `Status` = 2 and firstname=@firstname and lastname=@lastname and middlename=@middlename";
            }
            else{
                qrychktrxncancel = "select if(sum(amount) is null,0,sum(amount)) as amtcancel from " + customertable + " where CustomerType = 'R' and (transdate between '" + tdate + "' and '" + edate + "') and `Status` = 3 and firstname=@firstname and lastname=@lastname and middlename=@middlename";
            }
            cb(null, qrychktrxncancel)
        },
        function(qrychktrxncancel, cb)
        {
            var db = connectTo(kp7global);
            db.connection.query(qrychktrxncancel,[firstname,lastname,middlename],function(error, result)
            {
                db.connection.end();
                console.log(result);
                if(error){
                    console.log(error)
                    response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                    logs.fatal(response);
                    logs.fatal(error);
                    cb(error, response)
                }
                else{
                    var amtcancel = result[0].amtcancel;
                    totalamtcancel = totalamtcancel + amtcancel;
                    console.log('totalcancel ' +totalamtcancel)
                    cb(null,customertable,totalamtcancel)
                }
            })
        },
        function(customertable,totalamtcancel,cb)
        {
            var tdate = dateFormat(serverDateTime,'yyyy-mm-dd 00:00:00');
            var edate = dateFormat(serverDateTime,'yyyy-mm-dd 23:59:59');
            if(trxntype == '1'){
                qrychknewcust = "select if(sum(amount) is null,0,sum(amount)) as amt from " + customertable + " where CustomerType = 'S' and (transdate between '" + tdate + "' and '" + edate + "') and `Status` = 0 and firstname=@firstname and lastname=@lastname and middlename=@middlename";
            }
            else{
                qrychknewcust = "select if(sum(amount) is null,0,sum(amount)) as amt from " + customertable + " where CustomerType = 'R' and (transdate between '" + tdate + "' and '" + edate + "') and `Status` = 1 and firstname=@firstname and lastname=@lastname and middlename=@middlename";
            }
            cb(null, qrychknewcust);
        },
        function(qrychknewcust, cb)
        {
            var db1 = connectTo(kp7global);
            db1.connection.query(qrychknewcust,[firstname,lastname,middlename],function(error, result)
            {
                console.log(result);
                db1.connection.end();
                if(error){
                    console.log(error)
                    response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                    logs.fatal(response);
                    logs.fatal(error);
                    cb(error, response)
                }
                else{
                    var amt = result[0].amt;
                    totalamt = totalamt + amt;
                    cb(null,totalamt)
                }
            })
        },
        function(totalamt,cb)
        {
            if(totalamt == 0)
            {
                if (trxntype == "1")
                {
                    if (amount >= 2000 && amount <= 2999)
                    { amttype = 1; }
                    else if (amount >= 3000 && amount <= 4999)
                    { amttype = 2; }
                    else if (amount >= 5000 && amount <= 7999)
                    { amttype = 3; }
                    else if (amount >= 8000 && amount <= 9999)
                    { amttype = 4; }
                    else if (amount >= 10000)
                    { amttype = 5; }
                }
                else
                {
                    amttype = 0;
                }
            }
            else
            {
                if (amount >= 2000 && amount <= 2999 && trxntype == "1")
                {
                    totalamt = totalamt + amount;
                    if (totalamt >= 2000 && totalamt <= 2999)
                    {
                        amttype = 1;
                    }
                }
                else
                {
                    if (trxntype == "1")
                    {
                        totalamt = totalamt + amount;
                    }
                    if (totalamt >= 2000 && totalamt <= 2999)
                    {
                        amttype = 1;
                    }
                }
            }
            cb(null, amttype)
        },
        function(amttype, cb)
        {
            if(amttype != 0)
            {
                var insrtnewcusttrack = "insert into kpcustomersglobal.customerthresholdtracker (customerid,thresholdstart,thresholdend,syscreated,syscreator,totalamount) values ('"+ customeridno +"',Date_FORMAT(DATE_SUB(now(),INTERVAL 30 day),'%Y-%m-%d'),Date_FORMAT(now(),'%Y-%m-%d'),now(),'"+ syscreator +"','"+ totalamt +"')";
                var db2 = connectTo(kp7global);
                db2.connection.query(insrtnewcusttrack,function(error, result)
                {
                    console.log(result)
                    db2.connection.end();
                    if(error){
                        console.log(error)
                        response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                        logs.fatal(response);
                        logs.fatal(error);
                    }
                    else
                    {
                        response = {code : 1, amounttype : amttype ,message : "Threshold Transaction for new customer", errorCode : null}
                        error = null;
                    }
                    cb(error, response)
                })
            }
            else
            {
                response = {code : 0, amounttype : amttype ,message : "Normal Transaction for new customer", errorCode : null}
                cb(null,response);
            }
        }
    ],function(error, _response)
    {
        mainCB(null, _response);
    });
}

function getcustomertable(lastname, cb)
{
    var customers = '';
    lastname = lastname.toUpperCase()
        if (lastname.startsWith("A") || lastname.startsWith("B") || lastname.startsWith("C"))
        {
            customers = "AtoC";
        }
        else if (lastname.startsWith("D") || lastname.startsWith("E") || lastname.startsWith("F"))
        {
            customers = "DtoF";
        }
        else if (lastname.startsWith("G") || lastname.startsWith("H") || lastname.startsWith("I"))
        {
            customers = "GtoI";
        }
        else if (lastname.startsWith("J") || lastname.startsWith("K") || lastname.startsWith("L"))
        {
            customers = "JtoL";
        }
        else if (lastname.startsWith("M") || lastname.startsWith("N") || lastname.startsWith("O"))
        {
            customers = "MtoO";
        }
        else if (lastname.startsWith("P") || lastname.startsWith("Q") || lastname.startsWith("R"))
        {
            customers = "PtoR";
        }
        else if (lastname.startsWith("S") || lastname.startsWith("T") || lastname.startsWith("U"))
        {
            customers = "StoU";
        }
        else if (lastname.startsWith("V") || lastname.startsWith("W") || lastname.startsWith("X"))
        {
            customers = "VtoX";
        }
        else if (lastname.startsWith("Y") || lastname.startsWith("Z"))
        {
            customers = "YtoZ";
        }
        var response = {code: 1, data: customers, message: 'get success'}
        cb(null, response);
}
module.exports = thresholdBothDaily;