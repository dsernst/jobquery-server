var Match = require('../../match/match_model.js');
var Tag = require('../../tag/tag_model.js');
var Category = require('../../category/category_model.js');
var Opportunity = require('../../opportunity/opportunity_model.js');
var User = require('../../user/user_model.js');
var Company = require('../../company/company_model.js');
var Q = require('q');
var mongoose = require('mongoose');

module.exports = exports = {

  getByOppId: function (req, res) {
    var user;
    var match;

    Q.all([
      Match
      .findOne({user: req.user.id, opportunity: req.params.id})
      .select('-createdAt -updatedAt -adminOverride -internalNotes -privateValue')
      .populate([
        {path: 'opportunity', select: '-createdAt -updatedAt'}
      ])
      .exec()
      .then(function (data) {
        return Tag.populate(data,
          {path: 'opportunity.tags.tag', select: '-createdAt -updatedAt'}
        )
        .then(function (matchesWithTags) {
          return Company.populate(matchesWithTags,
            {path: 'opportunity.company'});
        })
        .then(function (matchesWithTagsCompany) {
          return Category.populate(matchesWithTagsCompany,
            {path: 'opportunity.category'});
        })
        .then(function (results) {
          // filter opportunities that are not yet approved
          if (!results.opportunity.approved) {
            match = null;
            return;
          }

          // hide non-public tags from users
          for (var i = 0; i < results.opportunity.tags.length; i += 1) {
            if (results.opportunity.tags[i].tag.isPublic === false ||
              results.opportunity.tags[i].tag.active === false) {
              results.opportunity.tags.splice(i, 1);
              i -= 1;
            }
          }
          match = results;
          return;
        });
      }),

      User
      .findById(req.user.id)
      .select('-createdAt -updatedAt -resetHash')
      .populate([
        {path: 'category', select: 'name'},
        {path: 'tags.tag', select: '-createdAt -updatedAt'},
      ])
      .exec()
      .then(function (data) {
        return Category.populate(data,
          {path: 'tags.tag.category', select: '-createdAt -updatedAt'}
        ).then(function (usr) {

          // hide non-public and inactive tags from users
          for (var i = 0; i < usr.tags.length; i += 1) {
            if (usr.tags[i].tag.isPublic === false ||
              usr.tags[i].tag.active === false) {
              usr.tags.splice(i, 1);
              i -= 1;
            }
          }
          user = usr;
          return;
        });
      })
    ])
    .then(function () {
      res.json(200, {user: user, match: match});
    });
  },

  getByUserId: function (req, res) {
    var opportunities;
    var matches;
    var user;
    var nonApproved = {};

    Q.all([
      User
      .findOne({_id: req.user.id})
      .select('-createdAt -updatedAt')
      .exec()
      .then(function (data) {
          user = data;
          return;
      }),

      Match
      .find({user: req.user.id})
      .select('-createdAt -updatedAt -adminOverride -internalNotes -privateValue')
      .exec()
      .then(function (data) {
          matches = data;
          return;
      }),

      Opportunity
      .find()
      .select('active approved company jobTitle description category questions createdAt updatedAt tags')
      .where('active').equals(true)
      .where('approved').equals(true)
      .populate([
        {path: 'category', select: 'name'},
        {path: 'company', select: 'name city'},
        {path: 'tags.tag', select: 'name type isPublic active'}
      ])
      .exec()
      .then(function (data) {
          // filter opportunities that are not yet approved
          for (var i = 0; i < data.length; i += 1) {
            if (!data[i].approved) {
              nonApproved[data[i]._id] = true;
              data.splice(i, 1);
              i -= 1;
              continue;
            }
            // hide non-public and inactive tags from users
            for (var j = 0; j < data[i].tags.length; j += 1) {
              if (data[i].tags[j].tag.isPublic === false ||
                data[i].tags[j].tag.active === false) {
                data[i].tags.splice(j, 1);
                j -= 1;
              }
            }
          }
          opportunities = data;
          return;
      })
    ])
    .then(function () {
      matches = matches.filter(function (match) {
        return !nonApproved[match.opportunity];
      });
      res.json(200, {matches: matches, opportunities: opportunities, user: user});
    });
  },

  putByIds: function (req, res) {
    Match.findOne({_id: req.params.id}, function (err, match) {
      if (err) {
        res.json(500, err);
        return;
      }

      Match.schema.eachPath(function (field) {
        if ( (field !== '_id') && (field !== '__v') ) {
          if (req.body[field] !== undefined) {
            // depopulate user
            if (field === 'user') {
              if (req.body.user._id) {
                req.body.user = req.body.user._id;
              }
            }
            // depopulate opportunity
            if (field === 'opportunity') {
              if (req.body.opportunity._id) {
                req.body.opportunity = req.body.opportunity._id;
              }
            }
            match[field] = req.body[field];
          }
        }
      });

      match.save(function (err, item) {
        if (err) {
          res.json(500, err);
          return;
        }
        res.json(200, {_id: item.id});
      });
    });
  }
};
