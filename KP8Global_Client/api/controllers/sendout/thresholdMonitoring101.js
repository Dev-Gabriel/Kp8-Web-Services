var sync = require('async')
,   connectTo = require('../_services/db_connection')
,   logging = require('../_services/_log4')
,   getServerDate = require('../_services/web_methods/getServerDate');

var logs = logging('sendout');
var kp7global = 'DBConfig Global';
var dateFormat = require('dateformat');
idleSession = 'e_user_idle';

var getthrebracket = "select id, message, currency, range1, range2 from kpformsglobal.thresholdsettings " +
            "where " +
            "case when range2 < ? then " +
            "((select max(range2) from kpformsglobal.thresholdsettings) BETWEEN Range1 and Range2 ) " +
            "else " +
            "(? BETWEEN Range1 and Range2 ) and range1 >= 3000.00 " +
            "end";

var thresholdMonitor101 = function (req, mainCB)
{
    customeridno    = req.query.customeridno;
    firstname       = req.query.firstname;
    lastname        = req.query.lastname;
    middlename      = req.query.middlename;
    amount          = req.query.amount;
    syscreator      = req.query.syscreator;
    trxntype        = req.query.trxntype;
    regioncode      = req.query.regioncode;
    
    console.log('-------------- threshold monitoring 101 -----------------')
    
    var customertable = '';
    var response = { code : 0, data : null, message: '', errorCode : null }

    async.waterfall([
        function(cb){
            getcustomertable(lastname,cb)
        },
        function(response, cb)
        {
            console.log(response.data);
            var custtable = response.data;
            if(regioncode == '4'){
                customertable = "kpadminlogsglobal.nevadaCustomer" + custtable;
            }
            else{
                customertable = "kpadminlogsglobal.customer" + custtable;
            }
            cb(null,customertable)
        },
        function(customertable, cb)
        {
            if (amount >= 3000 && trxntype == "1"){
                func1(cb);
            }
            else{
                func2(firstname,lastname,middlename,customertable,amount,customeridno,syscreator,trxntype,cb);
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
function func1(cb)
{
    var db = connectTo(kp7global);
    db.connection.query(getthrebracket,[amount,amount],function(error,result)
    {
        db.connection.end();
        console.log(result);
    if(error){
        console.log(error)
        response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
        logs.fatal(response);
        logs.fatal(error);
    }
    else if(result.length == 1){
        response = {code : 1, data : result, message : '', errorCode : null };
        error = null;
    }
    else{
        response = {code : 0, data : result, message : 'Normal Threshold', errorCode : null };
        error = null;
    }
    cb(error, response)
    })
}
function func2(firstname,lastname,middlename,customertable,amount,customeridno,syscreator,trxntype,cb)
{
    var qrychktrxncancel = '';
    var getcustrecord = '';
    var totalamtcancel = 0;
    var totalamount = 0;
    var threstart = "";
    var threend = "";
    console.log(lastname)
    async.waterfall([
        function(cb)
        {
            if (trxntype == "1"){
                qrychktrxncancel = "select if(sum(amount) is null,0,sum(amount)) as  amtcancel,Date_FORMAT(DATE_SUB(now(),INTERVAL 30 day),'%Y-%m-%d') as thresholdstart,  Date_FORMAT(now(),'%Y-%m-%d') as thresholdend  from " + customertable + " where status=2 and customertype='S' and (transdate between DATE_SUB(now(),INTERVAL 30 day) and now()) and firstname=? and lastname=? and middlename=?";
            }
            else{
                qrychktrxncancel = "select if(sum(amount) is null,0,sum(amount)) as  amtcancel,Date_FORMAT(now(),'%Y-%m-%d') as thresholdstart,  Date_FORMAT(now(),'%Y-%m-%d') as thresholdend  from " + customertable + " where status=3 and customertype='R' and (DATE_FORMAT(transdate,'%Y-%m-%d') = DATE_FORMAT(NOW(),'%Y-%m-%d')) and firstname=? and lastname=? and middlename=?";
            }
            cb(null,qrychktrxncancel);
        },
        function(qrychktrxncancel, cb)
        {
            console.log('in func 2')
            var db1 = connectTo(kp7global);
            db1.connection.query(qrychktrxncancel,[firstname,lastname,middlename],function(error, result)
            {
                db1.connection.end();
                console.log(result);
                if(error){
                    console.log(error)
                    response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                    logs.fatal(response);
                    logs.fatal(error);
                    cb(error, response)
                }
                else if(result.length == 1){
                    totalamtcancel = result[0].amtcancel;
                    console.log(totalamtcancel);
                    cb(null, totalamtcancel)
                }
                else{
                    cb(null, totalamtcancel)
                }
            })
        },
        function(totalamtcancel,cb)
        {
            if (trxntype == "1"){
                getcustrecord = "select if(sum(amount) is null,0,sum(amount)) as  totalamount,Date_FORMAT(DATE_SUB(now(),INTERVAL 30 day),'%Y-%m-%d') as thresholdstart,  Date_FORMAT(now(),'%Y-%m-%d') as thresholdend  from " + customertable + " where status=0 and customertype='S' and (transdate between DATE_SUB(now(),INTERVAL 30 day) and now()) and firstname=? and lastname=? and middlename=?";
            }
            else{
                getcustrecord = "select if(sum(amount) is null,0,sum(amount)) as  totalamount,Date_FORMAT(now(),'%Y-%m-%d') as thresholdstart,  Date_FORMAT(now(),'%Y-%m-%d') as thresholdend  from " + customertable + " where status=1 and customertype='R' and (DATE_FORMAT(transdate,'%Y-%m-%d') = DATE_FORMAT(NOW(),'%Y-%m-%d')) and firstname=? and lastname=? and middlename=?";
            }
            cb(null, getcustrecord)
        },
        function(getcustrecord,cb)
        {
            var db2 = connectTo(kp7global);
            db2.connection.query(getcustrecord,[firstname,lastname,middlename],function(error, result)
            {
                db2.connection.end();
                console.log(result);
                if(error){
                    console.log(error)
                    response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                    logs.fatal(response);
                    logs.fatal(error);
                    cb(error, response)
                }
                else if(result.length == 1){
                    var tot     = result[0].totalamount;
                    totalamount = tot - totalamtcancel;
                    threstart   = result[0].thresholdstart;
                    threend     = result[0].thresholdend;
                    cb(null, totalamount, threstart, threend)
                }
                else{
                    cb(null, totalamount, threstart, threend)
                }
            })
        },
        function( totalamount, threstart, threend, cb)
        {
            console.log(totalamount, threstart, threend)
            if (trxntype == "1"){
                totalamount = totalamount + parseInt(amount);
                console.log(totalamount);
            }
            cb(null, totalamount,threstart,threend)
        },
        function(totalamount, threstart, threend, cb)
        {
            var db3 = connectTo(kp7global);
            db3.connection.query(getthrebracket,[amount, amount],function(error, result)
            {
                db3.connection.end();
                console.log(result);
                if(error){
                    console.log(error)
                    response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                    logs.fatal(response);
                    logs.fatal(error);
                    cb(error, response)
                }
                else if(result.length == 1){
                    var message = result[0].message;
                    var threid = result[0].id;
                    var range1 = result[0].range1;
                    var range2 = result[0].range2;
                    console.log(trxntype == "2" ? totalamount : totalamount - parseInt(amount));
                    var inserttotracker = "insert into kpcustomersglobal.customerthresholdtracker (customerid,thresholdstart,thresholdend,syscreated,syscreator,totalamount) values (?,?,?,now(),?,?)";
                    var db4 = connectTo(kp7global);
                    db4.connection.query(inserttotracker, [customeridno,threstart,threend,syscreator,trxntype == "2" ? totalamount : totalamount - parseInt(amount)], function(error, result)
                    {
                        db4.connection.end();
                        console.log(result);
                        if(error){
                            console.log(error)
                            response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
                            logs.fatal(response);
                            logs.fatal(error);
                        }
                        else if(result.affectedRows = 1){
                            response = { code : 1, thresholdrangefrom : range1 , thresholdrangeto : range2, thresholdmessage : message, thresholdid : threid, totalpo : totalamount, message : "Insert success" }
                            // response = { code : 1, data : {result}, message : "Insert success" }
                            error = null;
                        }
                        else{
                            response = { code : 0, data : {result}, message : "Insert failed"};
                            error = null;
                        }
                        cb(error, response)
                    })
                }
                else{
                    response = {code : 0, data : {totalpo : totalamount}, message : "Normal Threshold"};
                    console.log(response);
                    cb(null, response)
                }
            })
        }
    ],function(error,_response)
    {
        cb(error,_response);
    })
}
module.exports = thresholdMonitor101;