"use strict";

var User = require('./user_model.js');

module.exports = exports = {

  getById: function (req, res) {
    User.findById(req.params.id)
    .populate('tags.tagId')
    .exec(function (err, user) {
      if (err) {
        res.json(500, err);
        return;
      }
      res.json(200, user);
    });
  },

  putById: function (req, res) {
    User.findById(req.params.id, function (err, user) {
      if (err) {
        res.json(500, err);
        return;
      }

      User.schema.eachPath(function (field) {
        if ( (field !== '_id') && (field !== '__v') ) {
          if (req.body[field] !== undefined) {
            user[field] = req.body[field];
          }
        }
      });

      user.save(function (err, item) {
        if (err) {
          res.json(500, err);
          return;
        }
        res.json(201, item.id);
      });
    });
  },

  get: function (req, res) {
    User.find()
    .populate('tags.tagId')
    .exec(function (err, users) {
      if (err) {
        res.json(500, err);
        return;
      }
      res.json(200, users);
    });
  },

  post: function (req, res) {
    // TODO: need to generate a password rather than take one from user
    // TODO: need to protect this property from being changed by users
    User.create(req.body, function (err, user) {
      if (err) {
        res.json(500, err);
        return;
      }
      res.json(201, user.id);
    });
  }

};
