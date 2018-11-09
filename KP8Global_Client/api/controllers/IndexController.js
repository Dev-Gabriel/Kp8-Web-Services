var async = require('async')
  , crypt = require('../controllers/_services/_aes')
  , logging = require('../controllers/_services/_log4')
  , connectTo = require('../controllers/_services/db_connection')
  , _checkParam = require('../controllers/_services/_helpers').checkParameters;  

var logs = logging('index')
/*- config.ini parameter -*/
  , kp8ini = 'DBConfig kp8_Global'
  , kp7usr = 'DBConfig User'
  , dbconfigs = [kp8ini, kp7usr];

var inSession = 'kp8usersglobal'
  , idleSession = 'e_user_idle';
/*------------------------------------------------------------------
  Get /auth?rid=resourceI & eu=userName & ep=passWord & ak=authKey
------------------------------------------------------------------*/
var authentication = async function (req, res) {

  var result = { fullName : 'Temporary LoginID', bName : 'Temporary BranchName', bCode : 107, zCode : 3 };  
  req.session.ml = inSession;
  req.session.user = result;
  req.session.token = 'temporary';
  req.session.loginAttempt = 0;

  return res.view({ code : 1, data: result, message : 'Verified', errorCode : null });

  req.session.ml = '';
  req.session.user = '';  
  req.session.token = '';
  req.session.loginAttempt = 0;

  var db
    , tokenKey
    , credentials
    , authKeyExpired
    , hasError = false
    , response = { code : 0, data: null, message : null, errorCode : null };

  console.log('\n');
  console.log('────────────────────────────────────────────────');
  console.log('authentication')
  console.log('────────────────────────────────────────────────');
  
  logs.info('───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────');
  logs.info('authentication : Get /auth?rid=resourceID & eu=userName & ep=passWord & ak=authKey ────────────────────────────────────');
  
  var thisMethodParam = [ 'rid', 'eu', 'ep', 'ak' ]
    , methodParamType = { rid : 'string', eu : 'string', ep : 'string', ak : 'string' }
    , isParamOK = _checkParam(thisMethodParam, req.query, methodParamType);
  
  async.waterfall([
    function(callback) {
//-Getting rid of parameter errors--------------------------------------------------------
      if (isParamOK.isMatch) {
          try { credentials = { resourceID : crypt.decrypt(req.query.rid)
                              , userName   : crypt.decrypt(req.query.eu)
                              , passWord   : crypt.decrypt(req.query.ep)
                              , authKey    : crypt.decrypt(req.query.ak) };
                // console.log('Time Difference : -')
                // console.log((Date.now() - parseInt(credentials.authKey))) 
                // if ((Date.now() - parseInt(credentials.authKey)) > 180000) {
                //   console.log('authKey is more than 3 minutes');
                //   logs.info(credentials);
                //   response = { code : 0, data: null
                //              , message : 'Web key verification has expired \\n Please login through the application'
                //              , errorCode : 'E_AUTHENTICATION' };
                //   logs.error(response);
                //   logs.error('Login token expired');
                //   authKeyExpired = true;
                // }
          }
          catch (err) { console.log(req.ip + ' authentication : text decryption error');
                        logs.error(req.ip + ' authentication : text decryption error');
                        logs.error(err);
                        hasError = true;
          }
      }

      if (!isParamOK.isMatch || hasError) {
          response = { code : 0, data: null, message : 'invalid request \\n Please login through the application', errorCode : 'E_INV_PARA' };
      }
//-----------------------------------------------------------------------------------------
      else {
//-Start of config.ini error handling------------------------------------------------------
        for (var i = 0; i < dbconfigs.length; i++)
        {
            console.log(dbconfigs[i]);
            db = connectTo(dbconfigs[i]);
            if (db.code == 0) {
                response = { code : 0, data: null, message : 'Something went wrong \\n Please contact admin.', errorCode : 'E_CONFIG_PARAM' };
                logs.error(response);
                logs.error(db.error);
                console.log(db.error);
                hasError = true;
            }
            else if (db.code == -1) {
                response = { code : -1, data: null, message : 'Something went wrong \\n Please contact admin.', errorCode : 'E_INVALID_INI' };
                logs.fatal(response);
                logs.fatal(db.error);
                console.log(db.error);
                hasError = true;
            }
            db = null;
        }
      }
//-----------------------------------------------------------------------------------------
      //returns true whenever isParamOK.isMatch or hasError is true
      callback((!isParamOK.isMatch) || hasError || authKeyExpired ? true: false);
    },
    function(callback) {

      tokenKey = Math.random().toString(36).substring(6, 15);

      console.log(req.ip + ' authentication : '); 
      console.log(credentials);
      logs.info('credentials : -');
      logs.info(credentials);
      
      db = connectTo(kp8ini);
      db.connection.query('UPDATE `kp8globalcompliance`.`kp8usersglobal` SET authKey = NULL, authToken = ? '
                        + ' WHERE resourceID=? AND userName=? AND passWord=? AND authKey=?'
      , [tokenKey, credentials.resourceID, credentials.userName, credentials.passWord, credentials.authKey]
      , function (error, result){
        db.connection.end();
        if(error) {
          response = { code : -1, data: null, message : 'Something went wrong \\n Please try again later.', errorCode : 'E_DB_CON' };
          logs.fatal(response)
          logs.fatal(kp8ini + ' - ' + error);
          console.log(kp8ini + ' - ' + error);
        }
        else if(result.affectedRows != 0 && result.changedRows != 0) {
          console.log('User verified'); //console.log(result);
          console.log('token: ' + tokenKey);
        }
        else {
          console.log('Invalid user'); //console.log(result);
          response = { code : 0, data: null, message : 'Invalid user request \\n Please log in again through the application', errorCode : null };
          logs.error(response);
          error = true; //return
        }
        callback(error);
      });
    },
    function (callback){
      db = connectTo(kp7usr);
      db.connection.query('SELECT bu.BranchCode AS bCode, bu.ResourceID AS rID, bu.ZoneCode AS zCode, bu.Fullname AS fullName,'
                        + 'bu.Firstname AS fName, bu.Lastname AS lName, bu.Middlename AS mName, b.BranchName AS bName '
                        + 'FROM `kpusersglobal`.`branchusers` bu INNER JOIN `kpusersglobal`.`branches` b '
                        + 'WHERE bu.ZoneCode = b.ZoneCode AND bu.BranchCode = b.BranchCode AND bu.ResourceID = ?'
      , [credentials.resourceID]
      , function (error, result){
        db.connection.end();
        var returningValue = null;
        if(error){
          response = { code : -1, data: null, message : 'Something went wrong \\n Please try again later.', errorCode : 'E_DB_CON' };
          logs.error(response);
          logs.error(kp7usr + ' - ' + error);
          console.log(kp7usr + ' - ' + error);
        }
        else if(result.length != 0) {
          returningValue = result[0];
          response = { code : 1, data: result[0], message : 'Verified', errorCode : null };
          console.log('User verified');
        }
        else {
          response = { code : 0, data: null, message : 'Invalid user request \\n Please log in again through the application', errorCode : null };
          logs.error(response);
          console.log('Invalid user'); 
        }
        callback(error, returningValue);
      });
    }
  ], function (error, result) {
      console.log(response);
      if (result) {
        console.log('User authenticated and logged In');
        console.log(result);

        //Make first letter of every word uppercase and the rest lowercase
        var _fullName = result.fullName.toLowerCase().split(' ');
        for (var i = 0; i < _fullName.length; i++) {
            _fullName[i] = _fullName[i].charAt(0).toUpperCase() + _fullName[i].substring(1);     
        }
        result.fullName = _fullName.join(' ');         
        //-------------------------------------------------------------------
        logs.info('User verified : -')
        logs.info(result);
        logs.info('Token: ' + tokenKey);
        req.session.ml = inSession;
        req.session.token = tokenKey;
        req.session.user = result;
        req.session.loginAttempt = 0;
      }
      return res.view(response);
  });
}

/*-----------------------------------------------------------
  Get /
------------------------------------------------------------*/
var home = async function (req, res) {
  
  if (req.session.ml == inSession && req.session.token != null && typeof req.session.token == 'string') {
    console.log('\n');
    console.log('────────────────────────────────────────────────');
    console.log('home')
    console.log('────────────────────────────────────────────────');
    console.log(req.session.ml);
    console.log(req.session.user);
    console.log(req.session.token);
    logs.info('───────────────────────────────────────────────────────────────────────────────────');
    logs.info('home : Get / ──────────────────────────────────────────────────────────────────────');
    logs.info(req.session.user);
    logs.info('Token: ' + req.session.token);
    return res.view();
  }
  else {
    response = { code : 0, message : 'Something\\\'s not right \\n Please login through the application', errorCode : 'E_LOGIN' };
    return res.view('index/auth', response);
  }
}

/*-----------------------------------------------------------
  Get /_menu
------------------------------------------------------------*/
var menu = async function (req, res) {
  if (req.session.ml == inSession && req.session.token != null && typeof req.session.token == 'string')
    return res.view();
  else {
    response = { code : 0, message : 'Something\\\'s not right \\n Please login through the application', errorCode : 'E_LOGIN' };
    return res.view('index/auth', response);
  }
}

/*-----------------------------------------------------------
  Get /login
------------------------------------------------------------*/
var login = async function (req, res) {
  console.log('\n');
  console.log('────────────────────────────────────────────────');
  console.log('login')
  console.log('────────────────────────────────────────────────');
  console.log(req.session.ml);
  console.log(req.session.user);
  console.log(req.session.token);

  req.session.idleTime = Date.now();

  if (req.session.ml != 'logout' && req.session.token != null && typeof req.session.token == 'string') {
    req.session.ml = idleSession;
    response = { code : 0, data : { }, message : 'You\\\'ve been idle for 5 minutes', errorCode : 'E_LOGIN' };
    return res.view(response);
  }
  else {
    response = { code : 0, data :  { }, message : 'Something\\\'s not right \\n Please login through the application', errorCode : 'E_LOGIN' };
    return res.view('index/auth', response);
  }
}

/*-----------------------------------------------------------
  Post /login userName=userName & passWord=passWord
------------------------------------------------------------*/
var loginAuth = async function (req, res) {

  console.log('\n');
  console.log('────────────────────────────────────────────────');
  console.log('loginAuth')
  console.log('────────────────────────────────────────────────');
  console.log(req.session.ml);
  console.log(req.session.user);
  console.log(req.session.token);

  logs.info('──────────────────────────────────────────────────────────────────────────────────────────────────');
  logs.info('loginAuth : Post /login userName=userName & passWord=passWord ────────────────────────────────────');
  logs.info('for user : -');
  logs.info(req.session.user);
  logs.info('parameters : -')
  logs.info(req.body);

  var response = { code : 0, data: null, message : null, errorCode : null };;

  //if : Date.now() subtract from DateTime of idle is not more than 5 minutes(300,000 miliseconds)
  if ((Date.now() - req.session.idleTime) > 300000){
      response = { code : 0, message : 'You\\\'ve been idle to too long \\nPlease login back thru the application', errorCode : 'E_RELOG' };
      return res.view('index/auth', response);
  }
  //if : session.ml = e_user_idle, -AND- session.token is not null -AND- typeof token is string
  else if (req.session.ml == idleSession && req.session.token != null && typeof req.session.token == 'string') {
      var db = connectTo(kp8ini);
      db.connection.query('SELECT authToken FROM `kp8globalcompliance`.`kp8usersglobal` '
                        + 'WHERE resourceID=? AND userName=? AND passWord=? AND authToken=?'
      , [ req.session.user.rID, req.body.userName, req.body.passWord, req.session.token ]
      , function (error, result) {
        db.connection.end();
        if(error){
          console.log(kp8ini + ' - ' + error);
          logs.error(kp8ini + ' - ' + error);
          response = { code : -1, data: null, message : 'Something went wrong \\n Please try again later.', errorCode : 'E_DB_CON' };
          return res.view('index/auth', response);
        }
        else if(result.length == 1) {
          console.log('User verified');
          req.session.ml = inSession;
          response = { code : 1, data: null, message : 'Verified', errorCode : null };
          return res.view(response);
        }
        else {
          if (req.session.loginAttempt != 3) {
            console.log('Invalid user');
            response = { code : 0, data: null, message : 'Invalid credentials', errorCode : null };
            req.session.loginAttempt += 1;
            return res.view(response);
          }
          //----------------------------------------------------------------------
          //-On max(4) relogin attempt reached------------------------------------
          //----------------------------------------------------------------------
          else {
            //-Remove token in db just incase someone copied the cookie ----------
            //-no return needed from db for this as long as the session is cleared
            db = connectTo(kp8ini);
            db.connection.query('UPDATE `kp8globalcompliance`.`kp8usersglobal` SET authKey = NULL, authToken = NULL '
                              + ' WHERE authToken=? AND resourceID=?'
            , [req.session.token, req.session.user.rID]
            , function (error, result){
              db.connection.end();
            });
            //--------------------------------------------------------------------
            
            req.session.ml = 'logout';
            req.session.token = null;
            req.session.user = '';

            response = { code : 0, message : 'Login attempt limit reached \\nPlease login through the application', errorCode : 'E_LOGIN' };
            return res.view('index/auth', response);
          }
        }
      });
  }
  else 
    return res.view('4me');
}

/*-----------------------------------------------------------
  Get /logout
------------------------------------------------------------*/
var logout = async function (req, res) {

  //-Remove token in db just incase someone copied the cookie ----------
  //-no return needed from db for this as long as the session is cleared
  var db = connectTo(kp8ini);
  db.connection.query('UPDATE `kp8globalcompliance`.`kp8usersglobal` SET authKey = NULL, authToken = NULL '
                    + ' WHERE authToken=? AND resourceID=?'
  , [req.session.token, req.session.user.rID]
  , function (error, result){
    db.connection.end();
  });
  //--------------------------------------------------------------------
  req.session.ml = 'logout';
  req.session.token = 'logout';
  req.session.user = 'logout';
  
  if (req.query.u == 'idle') {
    response = { code : 0, message : 'You\\\'ve been idle for too long\\nPlease use the application to login', errorCode : 'E_RELOG' };
    return res.view('index/auth', response);
  }
  else {
    return res.view();
  }
}

/*-----------------------------------------------------------
  Get /changePassword
------------------------------------------------------------*/
var changePassword = async function (req, res) {
    console.log('\n');
    console.log('────────────────────────────────────────────────');
    console.log('changePassword')
    console.log('────────────────────────────────────────────────');
    console.log(req.session.ml);
    console.log(req.session.user);
    console.log(req.session.token);
    if (req.session.ml == inSession && req.session.token != null && typeof req.session.token == 'string')
      res.view();
    else {
      response = { code : 0, message : 'Something\\\'s not right \\n Please login through the application', errorCode : 'E_LOGIN' };
      return res.view('index/auth', response);
    }
}

/*-----------------------------------------------------------
  Post /changePassword passWord=_passWord & newPassWord=_newPassWord 
                     & confirmNewPassWord = _confirmNewPassWord
------------------------------------------------------------*/
var updatePassword = async function (req, res) {
    console.log('\n');
    console.log('────────────────────────────────────────────────');
    console.log('updatePassword')
    console.log('────────────────────────────────────────────────');
    console.log(req.session.ml);
    console.log(req.session.user);
    console.log(req.session.token);

    logs.info('─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────');
    logs.info('updatePassword : Post /changePassword passWord=_passWord & newPassWord=_newPassWord & confirmNewPassWord =_confirmNewPassWord────────────────────────────────────');
    logs.info('for user :');
    logs.info(req.session.user);

    var response = { code : 0, data: null, message : null, errorCode : null }
      , tokenKey = req.session.token
      , rID = req.session.user.rID;

    var dbKP8 = connectTo(kp8ini)
      , dbKP7 = connectTo(kp7usr);

    console.log(req.body);
    var thisMethodParam = [ 'passWord', 'newPassWord', 'confirmNewPassWord' ]
      , methodParamType = { passWord : 'string', newPassWord : 'string', confirmNewPassWord : 'string' }
      , isParamOK = _checkParam(thisMethodParam, req.body, methodParamType);


    if (req.session.ml != inSession || req.session.token == null || typeof req.session.token != 'string') {
        response = { code : -1, message : 'Something\'s not right \n Please login through the application', errorCode : 'E_LOGIN' };
        logs.fatal(response);
        console.log(response);
        res.json(response);
    }
    else if (isParamOK.isMatch == false) {
        if (isParamOK.errorCode == 'E_PARA_TYPE')
          response = { code : 0, message : 'All fields required', errorCode : isParamOK.errorCode };
        else
          response = { code : 0, message : isParamOK.responmsg, errorCode : isParamOK.errorCode };
        logs.fatal(response);
        console.log(response);
        res.json(response);
    }
    else if (req.body.confirmNewPassWord != req.body.newPassWord) {
        response = { code : 0, message : 'New password mismatch', errorCode : 'E_PW_MISMATCH' };
        logs.fatal(response);
        console.log(response);
        res.json(response);
    }
    else if (!password_validity(req.body.newPassWord)) {
        response = { code : 0, message : 'New password must be atleast 14 or more alphanumeric characters with upper and lowercase combination'
                  , errorCode : 'E_PW_REQUIREMENTS' };
        logs.fatal(response);
        console.log(response);
        res.json(response);
    }
    else {
        logs.info('parameters : -')
        logs.info(req.body);
        async.waterfall([
          function (callback) {
            dbKP8.connection.query('SELECT userName, passWord FROM `kp8globalcompliance`.`kp8usersglobal` WHERE resourceID = ? AND authToken = ?'
            ,[rID, tokenKey]
            ,function (error, result) {
              dbKP8.connection.end();
              var _userName = null;
              if (error){
                console.log(error.toString());
                response = { code : -1, message : 'Something\'s not right \n Please try again later', errorCode : 'E_DB_CON' }
                logs.fatal(response);
                logs.fatal(error);
              }
              else if (result.length == 0) {
                response = { code : 0, message : 'An error has occured, Try refreshing the page', errorCode : 'E_CURRENT_USR'}
                logs.info(response);
              }
              else {
                if (result[0].passWord.toString() === req.body.passWord) {
                  _userName = result[0].userName
                  response = { code : 1, message : 'Verified', errorCode : null}
                }
                else
                  response = { code : 0, message : 'Invalid user credentials', errorCode : 'E_INV_USR'}
                logs.info(response);
              }
              callback(error, _userName);
            });
          }
        ],function (error, _userName) {
            if(response.code == 1) {
                dbKP7.connection.beginTransaction(function (errUpdatePassword) {
                    if(!errUpdatePassword) {
                        async.waterfall([
                          function(callback) {
                              dbKP7.connection.query('SELECT sua.ResourceID, bu.Firstname, bu.Middlename, bu.Lastname, sur.Role, bu.ZoneCode, bu.BranchCode, '
                                                  + '(SELECT branchname FROM kpusersglobal.branches WHERE BranchCode = bu.BranchCode AND ZoneCode = bu.ZoneCode) AS Branchname, '
                                                  + '"Change Password" AS `Type` FROM kpusersglobal.branchusers bu '
                                                  + 'INNER JOIN kpusersglobal.sysuseraccounts sua  ON sua.ResourceID = bu.ResourceID AND sua.ZoneCode = bu.ZoneCode '
                                                  + 'INNER JOIN kpusersglobal.sysuserroles sur  ON sur.ResourceID = sua.ResourceID AND sur.ZoneCode = sua.ZoneCode '
                                                  + 'WHERE sua.UserLogin = ? AND sua.UserPassword = ?;'
                              ,[_userName, req.body.passWord]
                              ,function (err, result) {
                                var details = null;
                                if (result.length != 0) {
                                  details = "{Name: " + result[0].Firstname + " " + result[0].Middlename + " " + result[0].Lastname 
                                          + ", Role ID: " + result[0].Role + ", Branchcode: " + result[0].BranchCode + ", Type: " + result[0].Type;
                                }
                                console.log(details);
                                logs.info(details);
                                callback(err, details);
                              });
                          },function(details, callback) {
                              if (details != null) {
                                  dbKP7.connection.query('INSERT INTO kpadminlogsglobal.userslogs(resourceID, details, syscreated, syscreator) '
                                                        + 'VALUES(?, ?, NOW(), ?)'
                                  ,[rID, details, _userName]
                                  ,function (err){
                                      logs.info('');
                                      callback(err);
                                  });
                              }
                              else {
                                callback('data-mismatch');
                              }
                          },function(callback) {
                              dbKP7.connection.query('UPDATE kpusersglobal.sysuseraccounts SET userpassword = ?, sysmodified = NOW() ' 
                                                    + 'WHERE userlogin=? AND userpassword=?'
                              ,[req.body.newPassWord, _userName, req.body.passWord]
                              ,function (err){
                                  callback(err);
                              });
                          }], function (err) {
                              if (!err) {
                                dbKP7.connection.commit(function () {
                                  dbKP7.connection.end();
                                  dbKP8 = connectTo(kp8ini);
                                  dbKP8.connection.connect(function () {
                                      dbKP8.connection.query('UPDATE `kp8globalcompliance`.`kp8usersglobal` SET `passWord` = ? WHERE resourceID = ? AND authToken = ?'
                                      ,[req.body.newPassWord, rID, tokenKey]
                                      ,function(err, updteResult){
                                        dbKP8.connection.end();

                                        if (err) {
                                          console.log(err);
                                          response = { code : -1, message : 'Password updated succesfully!\n Please relogin thru the application', errorCode : 'E_KP8DB_CON'};
                                          logs.info('Successfully updated password but failed on KP8 DB - suggest to relog thru app');
                                        }
                                        else {
                                          console.log(updteResult);
                                          response = { code : 1, message : 'Password succesfully updated!', errorCode : null};
                                          logs.info('Successfully updated password');
                                        }
                                        console.log(response);
                                        logs.info(response);
                                        res.json(response);
                                      });
                                  });
                                });
                              }
                              else {
                                dbKP7.connection.rollback(function(err){ dbKP7.connection.end(); });
                                if (err == 'data-mismatch')
                                  response = { code : -1, message : 'Something\'s not right \n Please login back thru the application', errorCode : 'E_DB_DATAMISMATCH' }
                                else 
                                  response = { code : -1, message : 'Something\'s not right \n Please try again later', errorCode : 'E_DB_CON' }
                                
                                  console.log(response);
                                  logs.fatal(response);
                                  logs.fatal(err);
                                  res.json(response);
                              }
                        });
                    }
                    else {
                        response = { code : -1, message : 'Something\'s not right \n Please try again later', errorCode : 'E_DB_CON' }
                        console.log(response);
                        logs.fatal(response);
                        logs.fatal(errUpdatePassword);
                        res.json(response);
                    }
                });
            }
            else {
                console.log(response);
                res.json(response);
            }
        });
    }
}

module.exports = { authentication, home, menu, login, loginAuth, logout, changePassword, updatePassword }

function password_validity(_password) {
  var password = _password.split('')
    , has_numeric = false
    , has_upperCase = false
    , has_lowerCase = false
    , returnResponse = false;

  if(_password.length >= 14) {
      for(var i = 0; i < password.length; i++) {

          if(!isNaN(password[i])) {
              has_numeric = true;
          }
          else if(password[i] == password[i].toUpperCase()) {
              has_upperCase = true;
          }
          else if(password[i] == password[i].toLowerCase()) {
              has_lowerCase = true;
          }

          if(has_upperCase && has_lowerCase && has_numeric) {
              i = password.length
              returnResponse = true;
          }
      }
  }
  return returnResponse;
}