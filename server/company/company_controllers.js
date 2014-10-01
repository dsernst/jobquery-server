"use strict";

var Company = require('./company_model.js');
var _ = require('lodash');
var api = require('indeed-api').getInstance('5498153875439113');
var q = require('q');
var indeedInfo = {};


var indeedSearch = function(company) {
    var deferred = q.defer();
    api.JobSearch()
      .Radius(100)
      .WhereLocation({
        city : "San Francisco",
        state : "CA"
      })
      .Limit(25)
      .WhereKeywords(company)
      .SortBy("date")
      .UserIP("http://localhost:9000")
      .UserAgent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36")
      .Search(function (results) {
        deferred.resolve(indeedInfo[company] = results);
        // do something with the success results
        // console.log(opportunities, '  opportunities');
      }, function (error) {
        // do something with the error results
        console.log(error,'  here is the error');
        deferred.reject(error);
    });
    return deferred.promise;
};

module.exports = exports = {

  getById: function (req, res) {
    Company.findById(req.params.id)
    .populate('opportunities')
    .exec(function (err, company) {
      if (err) {
        res.json(500, err);
        return;
      }
      res.json(200, company);
    });
  },

  putById: function (req, res) {
    Company.findById(req.params.id, function (err, company) {
      if (err) {
        res.json(500, err);
        return;
      }

      Company.schema.eachPath(function (field) {
        if ( (field !== '_id') && (field !== '__v') ) {
          if (req.body[field] !== undefined) {
            // depopulate opportunities
            if (field === 'opportunities') {
              if (req.body.opportunities) {
                for (var i = 0; i < req.body.opportunities.length; i += 1) {
                  if (req.body.opportunities[i]._id) {
                    req.body.opportunities[i] = req.body.opportunities[i]._id;
                  }
                }
              }
            }
            company[field] = req.body[field];
          }
        }
      });

      company.save(function (err, item) {
        if (err) {
          res.json(500, err);
          return;
        }
        res.json(200, {_id: item.id});
      });
    });
  },

  get: function (req, res) {
    Company.find()
    .exec(function (err, companies) {
      if (err) {
        res.json(500, err);
        return;
      }
      this.companies = _.map(companies.results, function(company) {
        return company.company;
      });
      res.json(200, companies);
    });
  },

  post: function (req, res) {
    Company.create(req.body, function (err, company) {
      if (err) {
        res.json(500, err);
        return;
      }
      res.json(201, {_id: company.id});
    });
  },
  getOpp: function(req, res) {
    var companies;
    Company.find()
      .select('name')
      .exec(function (err, companies) {
        if (err) {
          res.json(500, err);
          return;
        }
        var promises = _.map(companies, function(company) {
          var keyword = [company.name];
          return indeedSearch(keyword);
        });
        q.all(promises).done(function() {
          console.log(indeedInfo, '======finished!========');
          res.json(201, indeedInfo);
        });
        // console.log(promises, '-------promises========');

    });
  }
};
