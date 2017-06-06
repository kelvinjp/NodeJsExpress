var mysql = require('mysql');

var connectionpool = mysql.createPool({
		vhost: '127.0.0.1',
		user: 'root',
		password: '@4233asdf',
		database: 'pweb2'
  // ,connectionLimit: 10,
  //  supportBigNumbers: true
	});

exports.getConn = function  () {
    return connectionpool;                // Function returns the product of a and b
}