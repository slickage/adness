var Charlatan = require('charlatan');
Charlatan.setLocale('en-us');
var names = [];
for (var i = 0; i < 100; i++) {
  var name = Charlatan.Name.firstName().toLowerCase();
  names.push(name);
}

console.log(JSON.stringify(names));
