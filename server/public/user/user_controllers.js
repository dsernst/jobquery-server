"use strict";

var User = require('../../user/user_model.js');

module.exports = exports = {

  getById: function (req, res) {
    User.findById(req.user.id)
    .populate([
      {path: 'category'},
      {path: 'tags.tag'}
    ])
    .select('-isAdmin -internalNotes -password')
    .exec(function (err, user) {
      if (err) {
        res.json(500, err);
        return;
      }
      res.json(200, user);
    });
  },

  putById: function (req, res) {
    User.findById(req.user.id, function (err, user) {
      if (err) {
        res.json(500, err);
        return;
      }

      User.schema.eachPath(function (field) {
        if ( (field !== '_id') && (field !== '__v') ) {
          if (req.body[field] !== undefined) {
            // depopulate tags
            if (field === 'tags') {
              if (req.body.tags) {
                for (var i = 0; i < req.body.tags.length; i += 1) {
                  if (req.body.tags[i].tag._id) {
                    req.body.tags[i].tag = req.body.tags[i].tag._id;
                  }
                }
              }
            }
            // depopulate category
            if (field === 'category') {
              if (req.body.category && req.body.category._id) {
                req.body.category = req.body.category._id;
              }
            }
            user[field] = req.body[field];
          }
        }
      });

      user.save(function (err, item) {
        if (err) {
          res.json(500, err);
          return;
        }
        res.json(201, {_id: item.id});
      });
    });
  }

};
