var express = require('express')
var app = express()

app.set('port', process.env.PORT || 3000)
app.locals.title = 'Quantified Self'

app.get('/', function(request, response) {
  response.send('It\'s a secret to everyone.')
})

app.listen(app.get('port'), function() {
  console.log(`${app.locals.title} is running on ${app.get('port')}.`)
})

module.exports = app
