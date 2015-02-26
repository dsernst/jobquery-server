"use strict";

var User = require('../../user/user_model.js');
var Category = require('../../category/category_model.js');
var bcrypt = require('bcrypt-nodejs');

module.exports = exports = {

  getById: function (req, res) {
    User.findById(req.user.id)
    .where('isAdmin').equals(false)
    .populate([
      {path: 'category', select: '-createdAt -updatedAt'},
      {path: 'tags.tag', select: '-createdAt -updatedAt'}
    ])
    .select('-isAdmin -internalNotes -password -resetHash')
    .exec()
    .then(function (data) {

      var questionsToRemove = {
        // data.tags[index].tag.name : data.tags[index].tag.label
        "Industries": "What industries excite you the most?",
        "Locations of Interest": "What other cities, if any, are you open to?",
        "Other (Job Search)": "Anything else we should know about your job search situation?  i.e. looking to move into product management role, visa issues,",
        "Exciting Industries": "What industries / domains excite you the most?",
        "Other (Role)": "What else should we know about the role you are looking for or the work you like doing?",
        "Other Skills": "Are there any other skills you\'d like to mention?"
      };

      for (var i = 0; i < data.tags.length; i++) {
        if ( questionsToRemove[ data.tags[i].tag.name ] ) {
          // Remove unwanted questions
          data.tags.splice(i, 1);
          // If we don't go backwards one step, we may skip over an index accidentally.
          i--;
        }
      }
      
      Category.populate(data,
        {path: 'tags.tag.category', select: '-createdAt -updatedAt'},
        function (err, dataWithCategory) {
          if (err) {
            res.json(500, err);
            return;
          }
          // hide non-public and inactive tags from users
          if (dataWithCategory) {
            for (var i = 0; i < dataWithCategory.tags.length; i += 1) {
              if (dataWithCategory.tags[i].tag.isPublic === false ||
                dataWithCategory.tags[i].tag.active === false) {
                dataWithCategory.tags.splice(i, 1);
                i -= 1;
              }
            }
          }
          res.json(200, dataWithCategory);
        }
      );
    });
  },

  putById: function (req, res) {

    if(req.body.oldPassword){
      exports.updatePassword(req, res);
    } else {
      User
      .findById(req.user.id)
      .populate('tags.tag')
      .exec(function (err, user) {
        if (err) {
          res.json(500, err);
          return;
        }

        // add privateTags that were not sent to user to tags array
        user.tags.forEach(function (tag) {
          if (!tag.tag.isPublic) {
            req.body.tags.push(tag);
          }
        });

        User.schema.eachPath(function (field) {
          if ( (field !== '_id') && (field !== '__v') && (field !== 'isAdmin')) {
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
          res.json(200, {_id: item.id});
        });
      });
    }

  },

  updatePassword: function(req, res){
    var oldPassword = req.body.oldPassword;
    var newPassword = req.body.newPassword;
    var newPasswordConfirm = req.body.newPasswordConfirm;
    var id = req.body._id;

    if(newPassword !== newPasswordConfirm){
      res.send(400);
    } else {
      User.findOne({_id: id}, null, {select: 'password'}, function(err, user){
        if(err){
          res.send(500);
        } else if (!user) {
          res.send(404);
        } else {
          bcrypt.compare(oldPassword, user.password, function(err, match){
            if(!match){
              res.send(401);
            } else {
              bcrypt.hash(newPassword, null, null, function(err, hash){
                user.password = hash;
                user.save(function(err){
                  err ? res.send(500) : res.send({_id: user._id});
                });
              });
            }
          });
        }
      });
    }

  }

};
