var prePayment = require('../controllers/sendout/prePayment');
var searchKYC = require('../controllers/sendout/searchKYCglobal')
var getRatesPerBranchDom = require('../controllers/sendout/GetRatesPerBranchDomestic')
var getRatesPerBranchInt = require('../controllers/sendout/GetRatesPerBranchInternational')
var thresholdBothD = require('../controllers/sendout/thresholdBothDailyTrxn')
var thresholdMoni101 = require('../controllers/sendout/thresholdMonitoring101')
var dailyCTRmonitoring = require('../controllers/sendout/dailyCTRMonitoring')

var async = require('async');

var inSession = 'kp8usersglobal'
  , idleSession = 'e_user_idle';

/*-----------------------------------------------------------
  Get /prePaymentDisclosure
------------------------------------------------------------*/
var prePaymentDisclosure = async function (req, res) {
  res.view();
}

/*-----------------------------------------------------------
  Post /prePaymentDisclosure
------------------------------------------------------------*/
var prePaymentDisclosureData = async function (req, res) {

  console.log('\n');
  console.log('────────────────────────────────────────────────');
  console.log('prePaymentDisclosure')
  console.log('────────────────────────────────────────────────');
  console.log(req.session.ml);
  console.log(req.session.user);
  console.log(req.session.token);

  if (req.session.ml == inSession && req.session.token != null && typeof req.session.token == 'string') {
      async.waterfall([
        function (callback) {
        prePayment(req, callback)
      }],function (error, _response){
        return res.json(_response);
      });
  }
  else {
      var response = { code : 0, data :  { userName : '' }, 
                       message : 'Something\\\'s not right \\n Please login through the application', errorCode : 'E_LOGIN' };
      return res.json(response);
  }
}

var sendout = async function (req, res) {
  res.view();
}

var searchKYCglobal = async function (req, res) {
  console.log('\n');
  console.log('────────────────────────────────────────────────');
  console.log('search KYC')
  console.log('────────────────────────────────────────────────');
  console.log(req.session.ml);
  console.log(req.session.user);
  console.log(req.session.token);

  if (req.session.ml == inSession && req.session.token != null && typeof req.session.token == 'string') {
    async.waterfall([
      function (callback) {
        console.log('weeeeeeeeeeeeeeeeeee');
        searchKYC(req, callback)
    }],function (error, _response){
      return res.json(_response);
    });
}
else {
    var response = { code : 0, data :  { userName : '' }, 
                     message : 'Something\\\'s not right \\n Please login through the application', errorCode : 'E_LOGIN' };
    return res.json(response);
}
}

// var getOtherChargeD = async function (req, res) {
//   console.log('\n');
//   console.log('────────────────────────────────────────────────');
//   console.log('Get Other Charge Domestic')
//   console.log('────────────────────────────────────────────────');
//   console.log(req.session.ml);
//   console.log(req.session.user);
//   console.log(req.session.token);

//   if (req.session.ml == inSession && req.session.token != null && typeof req.session.token == 'string') {
//     async.waterfall([
//       function (callback) {
//         getOtherCharge(req, callback)
//     }],function (error, _response){
//       return res.json(_response);
//     });
// }
// else {
//     var response = { code : 0, data :  { userName : '' }, 
//                      message : 'Something\\\'s not right \\n Please login through the application', errorCode : 'E_LOGIN' };
//     return res.json(response);
// }
// }

// var getStandardRateInt = async function (req, res) {
//   console.log('\n');
//   console.log('────────────────────────────────────────────────');
//   console.log('Get Other Charge Domestic')
//   console.log('────────────────────────────────────────────────');
//   console.log(req.session.ml);
//   console.log(req.session.user);
//   console.log(req.session.token);

//   if (req.session.ml == inSession && req.session.token != null && typeof req.session.token == 'string') {
//     async.waterfall([
//       function (callback) {
//         getStandardRate(req, callback)
//     }],function (error, _response){
//       return res.json(_response);
//     });
// }
// else {
//     var response = { code : 0, data :  { userName : '' }, 
//                      message : 'Something\\\'s not right \\n Please login through the application', errorCode : 'E_LOGIN' };
//     return res.json(response);
// }
// }

var getRatesPerBranchDomestic = async function (req, res) {
  console.log('\n');
  console.log('────────────────────────────────────────────────');
  console.log('Get Rates per Branch Domestic')
  console.log('────────────────────────────────────────────────');
  console.log(req.session.ml);
  console.log(req.session.user);
  console.log(req.session.token);

  if (req.session.ml == inSession && req.session.token != null && typeof req.session.token == 'string') {
    async.waterfall([
      function (callback) {
        getRatesPerBranchDom(req, callback)
    }],function (error, _response){
      return res.json(_response);
    });
}
else {
    var response = { code : 0, data :  { userName : '' }, 
                     message : 'Something\\\'s not right \\n Please login through the application', errorCode : 'E_LOGIN' };
    return res.json(response);
}
}

var getRatesPerBranchInternational = async function (req, res) {
  console.log('\n');
  console.log('────────────────────────────────────────────────');
  console.log('Get Rates per Branch International')
  console.log('────────────────────────────────────────────────');
  console.log(req.session.ml);
  console.log(req.session.user);
  console.log(req.session.token);

  if (req.session.ml == inSession && req.session.token != null && typeof req.session.token == 'string') {
    async.waterfall([
      function (callback) {
        getRatesPerBranchInt(req, callback)
    }],function (error, _response){
      return res.json(_response);
    });
}
else {
    var response = { code : 0, data :  { userName : '' }, 
                     message : 'Something\\\'s not right \\n Please login through the application', errorCode : 'E_LOGIN' };
    return res.json(response);
}
}

var thresholdBothDailyTrxn = async function (req, res) {
  console.log('\n');
  console.log('────────────────────────────────────────────────');
  console.log('threshold')
  console.log('────────────────────────────────────────────────');
  console.log(req.session.ml);
  console.log(req.session.user);
  console.log(req.session.token);

  if (req.session.ml == inSession && req.session.token != null && typeof req.session.token == 'string') {
    async.waterfall([
      function (callback) {
        thresholdBothD(req, callback)
    }],function (error, _response){
      return res.json(_response);
    });
}
else {
    var response = { code : 0, data :  { userName : '' }, 
                     message : 'Something\\\'s not right \\n Please login through the application', errorCode : 'E_LOGIN' };
    return res.json(response);
}
}

var thresholdMonitoring101 = async function (req, res) {
  console.log('\n');
  console.log('────────────────────────────────────────────────');
  console.log('threshold monitoring 101')
  console.log('────────────────────────────────────────────────');
  console.log(req.session.ml);
  console.log(req.session.user);
  console.log(req.session.token);

  if (req.session.ml == inSession && req.session.token != null && typeof req.session.token == 'string') {
    async.waterfall([
      function (callback) {
        thresholdMoni101(req, callback)
    }],function (error, _response){
      return res.json(_response);
    });
}
else {
    var response = { code : 0, data :  { userName : '' }, 
                     message : 'Something\\\'s not right \\n Please login through the application', errorCode : 'E_LOGIN' };
    return res.json(response);
}
}

var dailyCTRMonitor = async function (req, res) {
  console.log('\n');
  console.log('────────────────────────────────────────────────');
  console.log('Daily CTR Monitoring ')
  console.log('────────────────────────────────────────────────');
  console.log(req.session.ml);
  console.log(req.session.user);
  console.log(req.session.token);

  if (req.session.ml == inSession && req.session.token != null && typeof req.session.token == 'string') {
    async.waterfall([
      function (callback) {
        dailyCTRmonitoring(req, callback)
    }],function (error, _response){
      return res.json(_response);
    });
}
else {
    var response = { code : 0, data :  { userName : '' }, 
                     message : 'Something\\\'s not right \\n Please login through the application', errorCode : 'E_LOGIN' };
    return res.json(response);
}
}


module.exports = { prePaymentDisclosure, prePaymentDisclosureData, sendout , searchKYCglobal, getRatesPerBranchDomestic, getRatesPerBranchInternational,thresholdBothDailyTrxn,thresholdMonitoring101, dailyCTRMonitor}