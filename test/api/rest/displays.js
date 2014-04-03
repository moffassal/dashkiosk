'use strict';

var setup = require('../../.');

var should = require('should'),
    assert = require('assert'),
    express = require('express'),
    request = require('supertest'),
    _ = require('lodash'),
    models = require('../../../lib/models'),
    bus = require('../../../lib/bus'),
    api = require('../../../lib/api'),
    app = express();

function fail(err) {
  assert.fail(err);
}

api.rest(app);

describe('/display', function() {

  beforeEach(function(done) {
    // Setup the database
    setup.db()
      .then(function() { done(); }, fail);
  });

  describe('GET /display', function() {
    it('should return an empty list', function(done) {
      request(app)
        .get('/api/display')
        .set('Accept', 'application/json')
        .expect(function(res) {
          res.should.have.status(200);
          JSON.parse(res.text).should.eql({});
        })
        .end(done);
    });

    it('should return a newly registered display', function(done) {
      models.Display.register()
        .then(function(display) {
          var name = display.toJSON().name;
          request(app)
            .get('/api/display')
            .set('Accept', 'application/json')
            .expect(function(res) {
              res.should.have.status(200);
              res.body[name].should.have.property('name', name);
              res.body[name].should.have.property('group');
            })
            .end(done);
        }, fail);
    });
  });

  describe('PUT /display/ID', function() {
    it('should modify an existing display', function(done) {
      models.Display.register()
        .then(function(display) {
          var name = display.toJSON().name;
          request(app)
            .put('/api/display/' + name)
            .set('Accept', 'application/json')
            .send({ description: 'Shiny', invalid: 'Something' })
            .expect(function(res) {
              res.should.have.status(200);
              res.body.should.have.property('name', name);
              res.body.should.have.property('description', 'Shiny');
              res.body.should.not.have.property('invalid');
            })
            .end(done);
        }, fail);
    });

    it('should 404 on inexistant display', function(done) {
      request(app)
        .put('/api/display/1234')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });

  describe('PUT /display/ID/group/ID', function() {

    it('should change the group of a display', function(done) {
      var g = new models.Group('Oops');
      g.create()
        .then(function(group) {
          return models.Display.register()
            .then(function(display) {
              return display.setGroup(group)
                .then(function() {
                  request(app)
                    .put('/api/display/' + display.toJSON().name + '/group/' + group.toJSON().id)
                    .set('Accept', 'application/json')
                    .end(function(err, res) {
                      if (err) {
                        done(err);
                      } else {
                        res.should.have.status(200);
                        res.body.should.have.property('group', group.toJSON().id);
                        models.Display.get(display.toJSON().name)
                          .then(function(display) {
                            display.toJSON().group.should.equal(group.toJSON().id);
                            done();
                          }, function(err) { done(err); });
                      }
                    });
                }, fail);
            }, fail);
        }, fail);
    });

    it('should 404 on inexistant display', function(done) {
      var g = new models.Group('Oops');
      g.create()
        .then(function(group) {
          request(app)
            .put('/api/display/1234/group/' + group.toJSON().id)
            .set('Accept', 'application/json')
            .expect(404, done);
        }, fail);
    });

    it('should 404 on inexistant group', function(done) {
      models.Display.register()
        .then(function(display) {
          var name = display.toJSON().name;
          request(app)
            .put('/api/display/' + name + '/group/42')
            .set('Accept', 'application/json')
            .expect(404, done);
        }, fail);
    });

  });

  describe('DELETE /display', function() {

    it('should delete an existing display', function(done) {
      models.Display.register()
        .then(function(display) {
          var name = display.toJSON().name;
          request(app)
            .del('/api/display/' + name)
            .set('Accept', 'application/json')
            .expect(204)
            .end(function(err, res) {
              if (err) {
                done(err);
              } else {
                models.Display.get(name)
                  .then(function() {
                    done(new Error('display not deleted'));
                  }, function() { done(); });
              }
            });
        }, fail);
    });

    it('should 404 on inexistant display', function(done) {
      request(app)
        .del('/api/display/1234')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

  });

});