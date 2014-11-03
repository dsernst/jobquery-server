"use strict";

var controller = require('./match_controllers.js');

module.exports = exports = function (router) {

  router.route('/users/:user/opportunities/:opportunity')
    .put(controller.putByIds);

  router.route('/users/:id')
    .get(controller.getByUserId);

  router.route('/opportunities/:id')
    .get(controller.getByOppId);

  router.route('/download')
    .get(controller.download);

  router.route('/batchProcess')
    .get(controller.batchProcess);

  router.route('/')
    .get(controller.get)
    .put(controller.put);

};
