/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {


  //  ╦ ╦╔═╗╔╗ ╔═╗╔═╗╔═╗╔═╗╔═╗
  //  ║║║║╣ ╠╩╗╠═╝╠═╣║ ╦║╣ ╚═╗
  //  ╚╩╝╚═╝╚═╝╩  ╩ ╩╚═╝╚═╝╚═╝

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

/*Default

  '/': {
    view: 'pages/index'
  },

*/

'get /auth' : {
  controller: 'index',
  action: 'authentication',
  view: 'index/auth'
},

'get /' : {
  controller: 'index',
  action: 'home',
  view: 'index/home'
},

'get /login' : {
  controller: 'index',
  action: 'login'
},

'post /login' : {
  controller: 'index',
  action: 'loginAuth',
  view: 'index/login'
},

'get /_menu' : {
  controller: 'index',
  action: 'menu',
  view: '_shared/_menu',
  locals: {
    layout: false
  }
},

'get /changePassword' : {
  controller: 'index',
  action: 'changePassword',
  locals: {
    layout: false
  }
},

'post /changePassword' : {
  controller: 'index',
  action: 'updatePassword'
},

'get /logout' : {
  controller: 'index',
  action: 'logout'
},

'get /prePaymentDisclosure' : {
  controller: 'sendout',
  action: 'prePaymentDisclosure',
  locals: {
    layout: false
  }
},

'post /prePaymentDisclosure' : {
  controller: 'sendout',
  action: 'prePaymentDisclosureData'
},

'get /sendout' : {
  controller: 'sendout',
  action: 'sendout'
},

'get /searchBeneficiary' : {
  controller: 'sendout',
  action: 'searchBeneficiary'
},

'get /searchkyc' : {
  controller: 'sendout',
  action: 'searchKYCglobal'
},

'get /getOtherCharge' : {
  controller: 'sendout',
  action: 'getOtherChargeD'
},

'get /getStandardRate' : {
  controller: 'sendout',
  action: 'getStandardRateInt'
},

'get /getRatesPerBranchDom' : {
  controller: 'sendout',
  action: 'getRatesPerBranchDomestic'
},

'get /getRatesPerBranchInt' : {
  controller: 'sendout',
  action: 'getRatesPerBranchInternational'
},

'get /insertBeneficiary' : {
  controller: 'sendout',
  action: 'insertBeneficiary'
},

'get /thresholdBothDaily' : {
  controller: 'sendout',
  action: 'thresholdBothDailyTrxn'
},

'get /thresholdMonitor101' : {
  controller: 'sendout',
  action: 'thresholdMonitoring101'
},

'get /dailyCTRMonitoring' : {
  controller: 'sendout',
  action: 'dailyCTRMonitor'
}

  
  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/


  //  ╔═╗╔═╗╦  ╔═╗╔╗╔╔╦╗╔═╗╔═╗╦╔╗╔╔╦╗╔═╗
  //  ╠═╣╠═╝║  ║╣ ║║║ ║║╠═╝║ ║║║║║ ║ ╚═╗
  //  ╩ ╩╩  ╩  ╚═╝╝╚╝═╩╝╩  ╚═╝╩╝╚╝ ╩ ╚═╝



  //  ╦ ╦╔═╗╔╗ ╦ ╦╔═╗╔═╗╦╔═╔═╗
  //  ║║║║╣ ╠╩╗╠═╣║ ║║ ║╠╩╗╚═╗
  //  ╚╩╝╚═╝╚═╝╩ ╩╚═╝╚═╝╩ ╩╚═╝


  //  ╔╦╗╦╔═╗╔═╗
  //  ║║║║╚═╗║
  //  ╩ ╩╩╚═╝╚═╝


};
