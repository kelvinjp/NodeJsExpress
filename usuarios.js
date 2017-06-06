var express = require('express');
var pool = require('./connection'); 
var connectionpool = pool.getConn(); 
var router = express.Router();


router.get('/mysql', function(req, res) {
	console.log("vivo");
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
			res.statusCode = 503;
			res.send({
				result: 'error',
				err: err.code
			});
		} else {
			connection.query('SELECT * FROM usuarios', function(err, rows, fields) {
				if (err) {
					console.error(err);
					res.statusCode = 500;
					res.send({
						result: 'error',
						err: err.code
					});
				}
				res.send(
					rows
				);
				connection.release();
			});
		}
	});
});
module.exports = router;