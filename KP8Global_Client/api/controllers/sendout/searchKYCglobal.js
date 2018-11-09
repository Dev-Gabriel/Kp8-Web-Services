var async = require('async')
  , connectTo = require('../_services/db_connection')
  , logging = require('../_services/_log4')

var logs = logging('sendout');
var kpCustomersglobal = 'DBConfig Customer';
var inSession = 'kp8usersglobal'
  , idleSession = 'e_user_idle';

  var Username = "";
  var Password = "";
  var Firstname = "";
  var Lastname = "";
  var page = "";
  var perPage = "";
  var version = "";
  var stationcode = "";
  

var searchKYC = function (req, mainCB) {
  password = req.query.password;
  username = req.query.username;
  Firstname = req.query.firstname;
  Lastname = req.query.lastname;

  console.log('in search KYC ----------------------------------------------');
  console.log(password);
  console.log(username);
  console.log(Firstname);
  console.log(Lastname);

  async.waterfall([
    function(cb){
      authenticate(username, password, cb )
    },
    function(cb){
      {
        //   var count = "";
        //   var dbTrans = connectTo(kpCustomersglobal);
        //   dbTrans.connection.query("SELECT Count (c.custid) as total FROM kpcustomersglobal.customers c left join kpcustomersglobal.customersdetails cc on c.custid = cc.CustID where c.FirstName LIKE ? and c.LastName Like ?;"
        //   ,[Firstname,Lastname]
        //   ,function (error, result){
        //     dbTrans.connection.end();
        //     var response;
        //     if(error){
        //       console.log(error)
        //       response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
        //       logs.fatal(response);
        //       logs.fatal(error);
        //     }
        //     else if (result.length == 0){
        //       console.log('Data 404 : custid');
        //       response = { code : 0, data : { }, message : "Data 404 : custid", errorCode : "E_DATA" }
        //       logs.info(response);
        //       error = true;
        //     }
        //     else {
        //       console.log(result[0]);
        //       count = result[0].custid;
        //       response = {code : 1, data: {count : count }, message : "Success"}
        //     }
        //     cb(error, response);
        //   });
        // },function (cb){
      }
    
      var custid = "";
      var cardno = "";
      var lastname = "";
      var firstname = "";
      var middlename = "";
      var birthdate = "";
      var gender = "";
      var mobileno = "";
      var street = "";
      var city = "";
      var zipcode = "";
      var state = "";
      var country = "";
      var idtype = "";
      var idnumber = "";
      var expirydate = "";
      var dbTrans = connectTo(kpCustomersglobal);
      dbTrans.connection.query("SELECT c.FirstName,c.LastName,c.MiddleName,c.Street,c.ProvinceCity,"
      + "DATE_FORMAT(c.BirthDate,'%Y-%m-%d') as BirthDate,c.Country,c.ZipCode,DATE_FORMAT(c.ExpiryDate,'%Y-%m-%d') as ExpiryDate,"
      + "c.Gender,c.IDNo,c.IDType,c.CustID,c.PhoneNo,c.Mobile,c.Email,c.cardno,DATE_FORMAT(c.IssuedDate,'%Y-%m-%d') as IssuedDate,"
      + "c.PlaceIssued,cc.SecondIDType,cc.SecondIDNo,cc.SecondPlaceIssued,DATE_FORMAT(cc.SecondIssuedDate,'%Y-%m-%d') as SecondIssuedDate,"
      + "DATE_FORMAT(cc.SecondExpiryDate,'%Y-%m-%d') as SecondExpiryDate,cc.HomeCity,cc.WorkStreet,cc.WorkProvinceCity,cc.WorkCity,cc.WorkCountry,"
      + "cc.WorkZipCode,cc.Occupation,cc.SSN,cc.SourceOfIncome,cc.Relation,cc.ProofOfFunds "
      + "from kpcustomersglobal.customers c left join kpcustomersglobal.customersdetails cc on c.custid = cc.CustID "
      + "where c.FirstName like ? AND c.LastName like ? ORDER BY c.LastName;"
      ,['%'+ Firstname +'%','%'+ Lastname +'%']
      ,function (error, result){
        dbTrans.connection.end();
        var response;
        if(error){
          console.log(error)
          response = { code : -1, data : { }, message : "Something\'s not right \n Please try again later", errorCode : "E_DB_CON" }
          logs.fatal(response);
          logs.fatal(error);
        }
        else if (result.length == 0){
          console.log('Data 404 : ');
          response = { code : 0, data : { }, message : "Data 404 : ", errorCode : "E_DATA" }
          logs.info(response);
          error = true;
        }
        else {
          // let row = [];
          for(let i = 0; i<result.length;i++)
          {
          console.log('result length----------------------------------------' ,result.length);
          console.log(result[i]);
          custid = result[i].CustID;
          cardno = result[i].cardno;
          lastname = result[i].LastName;
          firstname = result[i].FirstName;
          middlename = result[i].MiddleName;
          birthdate = result[i].BirthDate;
          gender = result[i].Gender;
          mobileno = result[i].Mobile;
          street = result[i].Street;
          zipcode = result[i].ZipCode;
          city = result[i].ProvinceCity;
          country = result[i].Country;
          idtype = result[i].IDType;
          idnumber = result[i].IDNo;
          expirydate = result[i].ExpiryDate;
          
          }
          
          response = {
            code : 1, 
            data: {
              result
            }, 
            message: "Success"
          }
          // logs.info(response);
        }
        cb(error, response);
      });
    }
  ], function (error, _response){
    // if(error){
    //   throw error;
    // }
        mainCB(null, _response);
  });
}


function authenticate(username, password, funcCB)
{
    var uname = 'boswebserviceusr';
    var pword = 'boyursa805';

    if (uname == username && pword == password)
    {
        funcCB(null);
    }
    else
    {
        response ={code : 1, data: {}, message : 'Invalid credentials.'}
        funcCB(true, response);
    }
}

module.exports = searchKYC;