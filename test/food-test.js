var assert = require('chai').assert
var app = require('../server')
var request = require('request')

var bodyParser = require('body-parser')
var Food = require('../lib/models/food')
var Meal = require('../lib/models/meal')
var FoodMeal = require('../lib/models/foodMeal')

describe('Food Endpoints', function(){
  before(function(done){
    this.port = 9876
    this.server = app.listen(this.port, function(err, result){
      if(err){return done(err)}
      done()
    })
    this.request = request.defaults({
      baseUrl: 'http://localhost:9876'
    })
  })

  after(function() {
    this.server.close()
  })

  describe('GET /api/foods', function() {
    this.timeout(1000000)
    beforeEach(function(done) {
      Food.createFood("Banana", 105)
      .then(function() {
        Food.createFood("French Silk Pie", 340).then(function() { done() })
      });
    })

    afterEach(function(done) {
      Food.emptyFoodsTable().then(function() {
        done()
      })
    })

    it('should have two food items from the resource', function(done) {
      this.request.get('/api/foods', function(error, response) {
        if (error) { done(error) }

        var parsedFoods = JSON.parse(response.body)
        var food1 = parsedFoods[0]
        var food2 = parsedFoods[1]

        assert.equal(parsedFoods.length, 2)
        assert.equal(food1.id, 1)
        assert.equal(food1.name, "Banana")
        assert.equal(food1.calories, 105)
        assert.equal(food2.id, 2)
        assert.equal(food2.name, "French Silk Pie")
        assert.equal(food2.calories, 340)

        done()
      })
    })
  })

  describe('GET api/foods/:id', function(){
    this.timeout(1000000)
    beforeEach(function(done) {
      Food.createFood("Banana", 105)
      .then(function() {
        Food.createFood("French Silk Pie", 340).then(function() { done() })
      });
    })

    afterEach(function(done) {
      Food.emptyFoodsTable().then(function() {
        done()
      })
    })

    it('should receive and id and return a single food', function(done) {
      this.request.get('api/foods/2', function(error, response) {
        if(error) { done(error) }

        var food = JSON.parse(response.body)

        assert.equal(food.id, 2)
        assert.equal(food.name, "French Silk Pie")
        assert.equal(food.calories, 340)

        done()
      })
    })

    it('should return 404 if resource is not found', function(done) {
      this.request.get('api/foods/3', function(error, response) {
        if(error) { done(error) }

        var food = JSON.parse(response.body)

        assert.equal(response.statusCode, 404)
        assert.hasAllKeys(food, ['error'])

        done()
      })
    })

  })

  describe('POST api/foods', function() {
    this.timeout(1000000)
    afterEach(function(done) {
      Food.emptyFoodsTable().then(function() {
        done()
      })
    })

    it('should recieve and store data', function(done) {
      var food = {
        name: "Banana",
        calories: 105
      }

      this.request.post('api/foods', { form: food }, function(error, response) {
        if(error) { done(error) }

        var parsedFoods = JSON.parse(response.body)
        var food1 = parsedFoods[0]

        assert.equal(parsedFoods.length, 1)
        assert.equal(food1.name, "Banana")
        assert.equal(food1.calories, 105)

        done()
      })
    })

    it('should send 422 when no name', function(done) {
      var food = {
        name: "",
        calories: 100
      }

      this.request.post('api/foods', { form: food }, function(error, response) {
        if(error) { done(error) }

        var parsedFoods = JSON.parse(response.body)

        Food.findAllFoods().then(function(data){
          assert.equal(data.rows.length, 0)
        })
        assert.equal(response.statusCode, 422)
        done()
      })
    })

    it('should send 422 when no calories', function(done) {
      var food = {
        name: "Pizza",
        calories: ""
      }

      this.request.post('api/foods', { form: food }, function(error, response) {
        if(error) { done(error) }

        var parsedFoods = JSON.parse(response.body)

        Food.findAllFoods().then(function(data){
          assert.equal(data.rows.length, 0)
        })
        assert.equal(response.statusCode, 422)
        done()
      })
    })

    it('should send 422 when nothing is sent', function(done) {
      var food = {
        name: "",
        calories: ""
      }

      this.request.post('api/foods', { form: food }, function(error, response) {
        if(error) { done(error) }

        var parsedFoods = JSON.parse(response.body)

        Food.findAllFoods().then(function(data){
          assert.equal(data.rows.length, 0)
        })
        assert.equal(response.statusCode, 422)
        done()
      })
    })
  })

  describe('DELETE api/foods/:id', function() {
    this.timeout(1000000)
    beforeEach(function(done) {
      Food.createFood("Banana", 105)
      .then(function() {
        Food.createFood("French Silk Pie", 340).then(function() { done() })
      });
    })

    afterEach(function(done) {
      Food.emptyFoodsTable().then(function() {
        done()
      })
    })

    it('should delete the food item', function(done) {

      this.request.delete('api/foods/2', function(error, response) {
        if(error) { done(error) }

        var parsedFoods = JSON.parse(response.body)
        var food1 = parsedFoods[0]

        assert.equal(parsedFoods.length, 1)
        assert.equal(food1.name, "Banana")
        assert.equal(food1.calories, 105)

        Food.find(2).then(function(data) {
          return data.rows[0]
        }).then(function(food){
          assert.equal(food.name, 'French Silk Pie')
          assert.equal(food.status, 'inactive')
        })

        done()
      })
    })

    it('should not delete an unknown id', function(done) {

      this.request.delete('api/foods/3', function(error, response) {
        if(error) { done(error) }

        var parsedFoods = JSON.parse(response.body)
        var food1 = parsedFoods[0]
        var food2 = parsedFoods[1]

        assert.equal(parsedFoods.length, 2)
        assert.equal(food1.name, "Banana")
        assert.equal(food1.calories, 105)
        assert.equal(food2.name, "French Silk Pie")
        assert.equal(food2.calories, 340)

        done()
      })
    })

  })

  describe('PUT /api/foods/:id?name=[]&calories=[]', function() {
    this.timeout(1000000)
    beforeEach(function(done) {
      Food.createFood("Banana", 105).then(function() {
        done()
      })
    })

    afterEach(function(done) {
      Food.emptyFoodsTable().then(function() {
        done()
      })
    })

    it('should allow update of exisiting food', function(done) {
      var updatedFood = {
        name: "Different",
        calories: 105
      }

      this.request.put('api/foods/1', { form: updatedFood }, function(error, response) {
        if(error) { done(error) }
        var parsedFoods = JSON.parse(response.body)
        var food1 = parsedFoods[0]

        assert.equal(parsedFoods.length, 1)
        assert.equal(food1.name, "Different")
        assert.equal(food1.calories, 105)
        done()
      })
    })

    it('should not allow an update with missing name', function(done) {
      var updatedFood = {
        name: "",
        calories: 200
      }

      this.request.put('api/foods/1', { form: updatedFood }, function(error, response) {
        if(error) { done(error) }

        var food = JSON.parse(response.body)

        assert.hasAllKeys(food, ['error'])
        assert.equal(response.statusCode, 422)
        done()
      })
    })

    it('should not allow an update with missing calories', function(done) {
      var updatedFood = {
        name: "Chocolates",
        calories: ""
      }

      this.request.put('api/foods/1', { form: updatedFood }, function(error, response) {
        if(error) { done(error) }

        var food = JSON.parse(response.body)

        assert.hasAllKeys(food, ['error'])
        assert.equal(response.statusCode, 422)
        done()
      })
    })

    it('should not allow an update with all info missing', function(done) {
      var updatedFood = {
        name: "",
        calories: ""
      }

      this.request.put('api/foods/1', { form: updatedFood }, function(error, response) {
        if(error) { done(error) }

        var food = JSON.parse(response.body)

        assert.hasAllKeys(food, ['error'])
        assert.equal(response.statusCode, 422)
        done()
      })
    })
  })







})
