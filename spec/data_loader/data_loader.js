var mongoose = require('mongoose');
var faker    = require('faker');
var Q        = require('q');
var User     = require('../../server/user/user_model.js');
var Tag      = require('../../server/tag/tag_model.js');
var Company  = require('../../server/company/company_model.js');
var Category = require('../../server/category/category_model.js');
var Opportunity = require('../../server/opportunity/opportunity_model.js');
var Message     = require('../../server/message/message_model.js');
var Match       = require('../../server/match/match_model.js');


var DB_URL = 'mongodb://jobquery:Team3van@ds061787.mongolab.com:61787/jobquery';
// var DB_URL = 'mongodb://localhost/myApp';

//Remove everything
Category.collection.remove(function(){populate();});
Company.collection.remove(function(){});
Tag.collection.remove(function(){});
User.collection.remove(function(){});
Opportunity.collection.remove(function(){});
Message.collection.remove(function(){});
Match.collection.remove(function(){});


var db = mongoose.connect(DB_URL);

var populate = function() {

  var categorySaves = [];
  var categoryTypes = ['Tag', 'User', 'Opportunity'];
  var userTags = [];
  var users = [];
  var categories = [];

  for (var i = 0; i < 10; i++) {
    var category = {
      name:   faker.random.bs_noun(),
      type:   categoryTypes[Math.floor(Math.random() * 3)],
      rank:   faker.Helpers.randomNumber(100, 1)
    };
    categorySaves.push(Category.create(category));
  }
  console.log('Saving categories..');
  Q.all(categorySaves)
  .then(function(categoryResults){
    categories = categoryResults;
    console.log('Saved categories: ', categoryResults.length);
    var tagSaves = [];
    // Populate 20 tags
    for(var i = 0; i < 20; i++) {
      var tag = {
        name:             faker.random.bs_noun() + i,
        label:            faker.random.catch_phrase_descriptor(),
        scaleDescription: ['None', 'Basic', 'Experienced', 'Expert'],
        category:         categoryResults[Math.floor(Math.random() * categoryResults.length)]._id
      };
      tagSaves.push(Tag.create(tag));
    }
    console.log('Saving tags..');
    return Q.all(tagSaves);
  }).then(function(results){
    console.log('Saved tags: ', results.length);
    var deferred = Q.defer();

    Tag.find(function(err, tags){
      deferred.resolve(tags);
    });

    return deferred.promise;
  }).then(function(tags){

    userTags = tags.map(function(item){
      var tag = {
        tag: item._id,
        score: Math.floor(Math.random() * 4)
      };
      return tag
    });

    var userSaves = [];
    // Populate 20 users
    for(var i = 0; i < 20; i++) {
      var user = {
        email:          faker.Internet.email(),
        password:       'password',
        name:           faker.Name.findName(),
        github:         'github.com/' + faker.Name.firstName(),
        linkedin:       'linkedin.com/in/' + faker.Name.firstName(),
        isAdmin:        false,
        isRegistered:   true,
        searchStage:    'Early',
        city:           'San Francisco',
        state:          'CA',
        country:        'USA',
        tags:           userTags
      };
      userSaves.push(User.create(user));
    }
    console.log('Saving users.. ');
    return Q.all(userSaves);
  }).then(function(userResults){
    console.log(userResults);
    users = userResults;
    console.log('Saved users: ', userResults.length);
    var companySaves = [];

    // Create 10 companies
    for(var j = 0; j < 10; j++) {
      var company = {
        name:        faker.Company.companyName(),
        tagline:     faker.Company.catchPhrase(),
        description: faker.Company.bs(),
        address:     faker.Address.streetAddress(),
        city:        faker.Address.city(),
        state:       faker.Address.usState(),
        country:     faker.Address.ukCountry(),
        geo:         [faker.random.number(1,100), faker.random.number(1,100)],
        media:       [{caption : faker.random.catch_phrase_descriptor(), url : faker.Image.imageUrl()}],
        links:       [{title : faker.random.catch_phrase_descriptor(), url : faker.Image.imageUrl()}]
      };

      companySaves.push(Company.create(company));
    }

    console.log('Saving companies.. ');
    return Q.all(companySaves);
  }).then(function(companyResults){
    console.log('Saved companies: ', companyResults.length);
    var opportunitySaves = [];
    var stageEnum = [
      'Offer Accepted',
      'Offer Received',
      'On-Site Interview',
      'Phone Interview'
    ];

    for(var i = 0; i < 20; i++) {
      var index = Math.floor(Math.random() * companyResults.length);
      var opportunity = {
        active:         true,
        company:        companyResults[index]._id,
        jobTitle:       faker.Company.bs(),
        description:    faker.Company.catchPhrase(),
        tags:           userTags,
        links:          [{title : faker.random.catch_phrase_descriptor(), url : faker.Image.imageUrl()}],
        notes:          [{date : new Date(), text : faker.Lorem.sentence()}],
        internalNotes:  [{date : new Date(), text : faker.Lorem.sentence()}],
        questions:      [{date : new Date(), question : faker.Lorem.sentence()}],
        survey:         [{  user:   users[Math.floor(Math.random() * users.length)]._id,
                            salary: faker.random.number(80000, 160000),
                            notes:  [faker.Lorem.sentence(),faker.Lorem.sentence()],
                            stage:  stageEnum[Math.floor(Math.random() * stageEnum.length)]
                        }],
        category:       categories[Math.floor(Math.random() * categories.length)]._id
      };
      opportunitySaves.push(Opportunity.create(opportunity));
    // UPDATE COMPANIES WITH OPPERTUNITY
    }
    console.log('Saving opportunities.. ');
    return Q.all(opportunitySaves);
  }).then(function(opportunityResults){
    console.log('Saved opportunities: ', opportunityResults.length);
  }, function(error){
    console.log(error);
  });
 
};
