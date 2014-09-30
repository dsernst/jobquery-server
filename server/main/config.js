/* jslint node: true */

"use strict";

var bodyParser    = require('body-parser'),
    middle        = require('./middleware'),
    mongoose      = require('mongoose'),
    morgan        = require('morgan'),
    expressJwt    = require('express-jwt'),
    api           = require('indeed-api').getInstance('5498153875439113'),
    _             = require('lodash'),
    companyController = require('../company/company_controllers'),
    jobkeys       = [];

var keywords = [];

api.JobSearch()
  .Radius(100)
  .WhereLocation({
    city : "San Francisco",
    state : "CA"
  })
  .Limit(25)
  .WhereKeywords(keywords)
  .SortBy("date")
  .UserIP("http://localhost:9000")
  .UserAgent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36")
  .Search(function (results) {
    companyController.getList();
    // do something with the success results
    // console.log(results, '   results');
  }, function (error) {
    // do something with the error results
    console.log(error);
  });



mongoose.connect(process.env.DB_URL || 'mongodb://localhost/myApp');
/*
 * Include all your global env variables here.
*/
module.exports = exports = function (app, express, routers) {
  app.set('port', process.env.PORT || 9000);
  app.set('base url', process.env.URL || 'http://localhost');
  app.use(morgan('dev'));
  app.use(bodyParser());
  app.use(middle.cors);
  app.use('/login', routers.LoginRouter);
  app.use('/auth', routers.AuthRouter);

  app.use('/api', expressJwt({secret: process.env.ADMIN_SECRET || 'admin'}));
  app.use('/public', expressJwt({secret: process.env.USER_SECRET || 'user'}));

  app.use('/public', routers.PublicRouter);
  app.use('/api/opportunities', routers.OpportunityRouter);
  app.use('/api/tags', routers.TagRouter);
  app.use('/api/users' , routers.UserRouter);
  app.use('/api/matches', routers.MatchRouter);
  app.use('/api/companies', routers.CompanyRouter);
  app.use('/api/categories', routers.CategoryRouter);
  app.use('/api/invite', routers.InviteRouter);
  app.use(middle.logError);
  app.use(middle.handleError);
};
