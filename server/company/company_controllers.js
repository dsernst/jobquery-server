"use strict";

var Company = require('./company_model.js');
var _ = require('lodash');
var api = require('indeed-api').getInstance('5498153875439113');


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
    var keywords = [req.body.keyword];
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
      var opportunities = _.map(results.results, function(result) {
        if(result.company === req.body.keyword) {
          return result;
        }
      });
      // do something with the success results
      console.log(opportunities);
      res.json(201, opportunities);
    }, function (error) {
      // do something with the error results
      console.log(error,'  here is the error');
      res.json(400, error);
    });
  }
};
