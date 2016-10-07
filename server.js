var path = require('path');
var express = require('express');
var port = 3000;

var app = express();

app.use('/', express.static(__dirname));

app.listen(port, function() {
  console.log('listening on Port: ' + port);
});