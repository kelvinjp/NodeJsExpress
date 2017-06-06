var express = require('express'),
	app = express(),
	mysql = require('mysql')
// 	,connectionpool = mysql.createPool({
// 		vhost: '127.0.0.1',
// 		user: 'root',
// 		password: '@4233asdf',
// 		database: 'pweb2'
// 	});
var pool = require('./connection'); 
var connectionpool = pool.getConn(); 
/*
Modulos requeridos para la seguridad de las Urls
 */
var bodyParser = require('body-parser');
var multer = require('multer');
var expressSession = require('express-session');

var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');

var secret = 'this is the secret secret secret 12356';

//app.use('/api', expressJwt({secret: secret}));

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
	extended: false
})); // for parsing application/x-www-form-urlencoded
app.use(multer()); // for parsing multipart/form-data   

app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization,Origin, Accept');
	next();
});
/*
Solo para probar si al autenticacion HTTP funciona
 */
app.get('/', function(req, res) {
	res.json('Working...');
});

var usuarios = require("./usuarios");
app.use('/',usuarios);


//Aqui solo probamos que funciona la base de datos y que nos podemos conectar

app.get('/mysql', function(req, res) {
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
/****************************LOGIN LISTO********************
 * Metodo Post para loguearse:
 * 1ro- Verificamos que e usuario y password sean corectos y
 * procedemos a crear una session del lado del servidor usando passport.
 * 2do- Una vez autenticado el usuario, retornamos un JSON con los datos del usuario.
 * @param username
 * @param password
 * @return json del usuario o json vacio
 ************************************************************/
app.post('/login', function(req, res) {
//TODO validate req.body.username and req.body.password
	//if is invalid, return 401
	connectionpool.getConnection(function(err, connection) {
		var username = req.body.email;
		var password = req.body.password;
		console.log(username + " " + password);
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("SELECT * FROM usuarios WHERE email='" + username + "' AND password='" + password + "'",
				function(err, rows, fields) {
					//Si hay algun error en la consulta no hacemos nada
			if (err) {
						console.error(err);
						res.status(401).send('Wrong user or password');
					}
					//Si el resutado de la consulta retorna mas de una fila
					//quiere decir que se el usuario y contraseña son correctas
					if (rows.length > 0) {
						var profile = {
							user: rows[0].email,
							name: rows[0].nombre,
						};
						console.log('Logeado corretamente como:' + profile.user + ' ' + profile.name);
						var token = jwt.sign(profile, secret, {
							expiresInMinutes: 60 * 5
						});
						rows[0].token = token;
						
						res.json(rows[0]);
					} else {
						res.status(401).send('Wrong user or password');
					}
					connection.release();
				
				});
		}
	});
});

/***********************AGREGAR USUARIO LISTO**************************
 * Para agregar un usuario cremamos una variable datos con los datos del
 * usuario agregar y le pasamos esa variable al INSERT
 **********************************************************************/
app.post('/addUser', function(req, res) {
	var password = req.body.password;
	var nombres = req.body.nombre;
	var email = req.body.email;
	//var identificacion = req.body.identificacion;
	//console.log(req.body.identificacion); 
	var idtipouser;

	if (req.body.idtipouser === undefined) {
		console.log('Id tipo user is black');
		idtipouser = 1;
	} else {
		idtipouser = parseInt(req.body.idtipouser);
	}

	var estado = 0;

	var data = {
		password: password,
		nombre: nombres,
		email: email,
		//	identificacion:identificacion,
		idtiposusuario: idtipouser,
		estado: estado
	};
	console.log(data);
	var existe = false;
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			///comparamos los email
			connection.query("SELECT * FROM  `usuarios` WHERE  `email`=  '" + email + "'", function(err, result) {
				if (err) {
					console.error(err);
					res.json(err);
				}
				console.log(result);
				console.log(result.length);

				if (result.length === 0) {
					//Si no hay conicidencias insertamos el usuario
					connection.query("INSERT INTO `usuarios` SET ?", data, function(err, result) {
						//Si hay algun error en la consulta no hacemos nada
						if (err) {
							console.error(err);
						}
						if (result) {
							//Si el resutado de la consulta retorna mas de una fila
							//quiere decir que se encontro el usuario
							console.log(result);
							res.json(result);
						} else {
							res.json('No se pudo insertar el Usuario');
						}

					});
				} else {
					existe = true;
					var retorno = {
						estado: false,
						email: true,
						comentario: 'Usuario ya existe.'
					};
					res.json(retorno);
				}
			}); //End Connection query 
		}
		console.log('Cerrando Conexion...');
		connection.release();
	});
});

/*************************** UPDATE USUARIO LISTO ***************
 *
 **************************************************************/
app.post('/api/editUser', function(req, res) {
	console.log('----------EditUser-----------');
	var nombre = req.body.nombre;
	var password = req.body.password;
	var identificacion = req.body.identificacion;
	var email = req.body.email;

	var data = {
		nombre: nombre,
		password: password,
		identificacion: identificacion,
		email: email
	};
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("UPDATE `usuarios` SET ? WHERE `email`= ?", [data, email], function(err, result) {
				//Si hay algun error en la consulta no hacemos nada
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					console.log(result);
					res.json(result);
				} else {
					res.status(401).send('No se pudo editar el Usuario');
				}
				connection.release();
			});
		}
	});
});


/************ AGREGA MEMBRESIA AL USUARIO ********************
 * @param:
 *************************************************************/
app.post('/api/membresia', function(req, res) {
	console.log('----------ADD MEMBRESIA-----------');
	var email = req.body.email;
	var dias = parseInt(req.body.tiempo); //aqui llega los dias a sumar a la fecha de vencimiendo del cliente
	/*MEJORA: Obtener la fecha de vencimiento desde la DB*/
	var vence1 = req.body.vence;
	var vence2 = new Date(vence1); //Aqui llega la fecha de vencimiento actual del usuario

	console.log('dias: ' + dias);
	console.log('vence: ' + vence1);
	console.log('vence2: ' + vence2);
	/*combertimos de mysql date (0000-00-00 00:00:00) a javascript date 
	desde aqui 
	*/
	var x1 = vence2.getDate();
	var x2 = vence2.getMonth() + 1; //los meses van de 0 a 11 asi que sumamos 1
	var x3 = vence2.getFullYear();

	console.log('dias: ' + x1);
	console.log('m: ' + x2);
	console.log('a: ' + x3);

	var xx = "";

	/*Si es la primera membresia del cliente entonces cuenta a partir de ahora*/
	if (isNaN(vence2)) {
		var toGetFecha = new Date();
		console.log(toGetFecha);
		console.log(toGetFecha.getDate());
		x3 = toGetFecha.getFullYear();
		x2 = toGetFecha.getMonth() + 1;
		x1 = toGetFecha.getDate();
		xx = x1 + "/" + x2 + "/" + x3; //formamos la fecha dd/mm/yyyy
	} else { //Si no es la primera membresia entonces sera a partir de finalizar la actual
		xx = x1 + "/" + x2 + "/" + x3;
	}
	/**
	Funcion para sumar dias a fecha
	*/
	sumaFecha = function(d, fecha) {
		var Fecha = new Date();
		var sFecha = fecha || (Fecha.getDate() + "/" + (Fecha.getMonth() + 1) + "/" + Fecha.getFullYear());
		var sep = sFecha.indexOf('/') != -1 ? '/' : '-';
		var aFecha = sFecha.split(sep);
		 fecha = aFecha[2] + '/' + aFecha[1] + '/' + aFecha[0];
		fecha = new Date(fecha);
		fecha.setDate(fecha.getDate() + parseInt(d));
		var anno = fecha.getFullYear();
		var mes = fecha.getMonth() + 1;
		var dia = fecha.getDate();
		mes = (mes < 10) ? ("0" + mes) : mes;
		dia = (dia < 10) ? ("0" + dia) : dia;
		var strfecha = anno + '-' + mes + '-' + dia + ' 00:00:00';
		var vencex = new Date(strfecha).toISOString().slice(0, 19).replace('T', ' ');
		console.log("Fecha a vencer en formato SQL: " + vencex);
		return (vencex);
	};
	var vencea = sumaFecha(dias, xx);
	console.log("vf: " + vencea);

	var data = {
		estado: 1,
		vence: vencea
	};
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("UPDATE `usuarios` SET ? WHERE `email`= ?", [data, email], function(err, result) {
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					//Si el resutado de la consulta retorna mas de una fila
					//quiere decir que se encontro el usuario
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo agregar la membresia');
				}
				connection.release();
			});
		}
	});
});

/************************** BANNEA USUARIO *******************
 *
 ************************************************************/
app.post('/api/declinarUsuario', function(req, res) {
	console.log('----------Declinando Usuario-----------');
	//valores a recibir
	var email = req.body.email;
	var data = {
		estado: 3 
	};

	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("UPDATE `usuarios` SET ? WHERE `email`= ?", [data, email], function(err, result) {
				//Si hay algun error en la consulta no hacemos nada
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo Declinar El Usuario');
				}
				connection.release();
			});
		}
	});
});

/**********GET TODOS LOS USUARIOS PENDIENTES REGISTRO ********
 * 
 *************************************************************/
app.get('/api/getPendientes', function(req, res) {
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			//Aqui obtenemos los datos de la alerta
			connection.query("SELECT * FROM `usuarios` WHERE `estado` =0 AND  `idtiposusuario` !=0",
				function(err, rows, fields) {
					//Si hay algun error en la consulta no hacemos nada
					if (err) {
						console.error(err);
					}
					console.log(rows);
					res.send(
						rows
					);

					connection.release();
				});
		}
	});

});

/*******************GET TODOS LOS USUARIOS DECLINADOS ********
 *
 *************************************************************/
app.get('/api/getDeclinados', function(req, res) {
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			//Aqui obtenemos los datos de la alerta
			connection.query("SELECT * FROM `usuarios` WHERE `estado` =3 AND  `idtiposusuario` !=0",
				function(err, rows, fields) {
					//Si hay algun error en la consulta no hacemos nada
					if (err) {
						console.error(err);
					}
					console.log(rows);
					res.send(
						rows
					);
					connection.release();
				});
		}
	});
});

/*******************GET TODOS LOS USUARIOS Registrados ********
 *
 *************************************************************/
app.get('/api/getRegistrados', function(req, res) {
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			//Aqui obtenemos los datos de la alerta
			connection.query("SELECT * FROM `usuarios` WHERE `estado` =1 AND  `idtiposusuario` !=0",
				function(err, rows, fields) {
					//Si hay algun error en la consulta no hacemos nada
					if (err) {
						console.error(err);
					}
					console.log(rows);
					res.send(
						rows
					);
					connection.release();
				});
		}
	});
});


/****MANTENIMIENTO DE ESTADOSDE USUARIOS - AGREGAR**********
 *
 **********************************************************/
app.post('/api/addEstado', function(req, res) {
	console.log('----------ADD-----------');
	//valores a recibir
	var nombre = req.body.nombre;
	var Descripcion = req.body.Descripcion;

	var data = {
		nombre: nombre,
		Descripcion: Descripcion
	};
	console.log(data);
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("INSERT INTO `Estado` SET ?", [data], function(err, result) {
				//Si hay algun error en la consulta no hacemos nada
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					//Si el resutado de la consulta retorna mas de una fila
					//quiere decir que se encontro el usuario
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo insertar el Usuario');
				}
				connection.release();
			});
		}
	});
});


/*************MANTENIMIENTO DE ESTADOS - ELIMINAR*********
*
**********************************************************/
app.post('/api/deleteEstado', function(req, res) {
	console.log('----------rm-----------');
	//valores a recibir
	var idestado = req.body.idestado;

	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("DELETE FROM `Estado` WHERE idestado = " + idestado, function(err, result) {
				//Si hay algun error en la consulta no hacemos nada
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo Eliminar El Estado.');
				}
				connection.release();
			});
		}
	});
});
/**************** RETORNA TODOS LOS ESTADOS *****************
 *
 ***********************************************************/
app.get('/api/getEstados', function(req, res) {
	connectionpool.getConnection(function(err, connection) {	
		if (err) {
			console.error('CONNECTION error: ', err);

		} else {
			//Aqui obtenemos los datos de la alerta
			connection.query("SELECT * FROM Estado",
				function(err, rows, fields) {
					//Si hay algun error en la consulta no hacemos nada
					if (err) {
						console.error(err);
					}
					console.log(rows);
					res.send(
						rows
					);
					connection.release();
				});
		}
	});
});

/************** MODIFICA LOS ESTADOS***************
 *
 **************************************************/
app.post('/api/editEstado', function(req, res) {
	console.log('----------EditUser-----------');
	var idestado = req.body.idestado;
	var nombre = req.body.nombre;
	var Descripcion = req.body.Descripcion;

	var data = {
		idestado: idestado,
		nombre: nombre,
		Descripcion: Descripcion
	};
	console.log(data);
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("UPDATE `Estado` SET ? WHERE `idestado`= ?", [data, idestado], function(err, result) {
				//Si hay algun error en la consulta no hacemos nada
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo insertar el Usuario');
				}
				connection.release();
			});
		}
	});
});

/**************AGREGA UN TIPO DE MEMBRESIA**********
 *
 **************************************************/
app.post('/api/addMembresia', function(req, res) {
	console.log('----------ADD M-----------');
	//valores a recibir
	var nombre = req.body.nombre;
	var dias = parseInt(req.body.dias);

	var data = {
		nombre: nombre,
		dias: dias
	};
	console.log(data);
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("INSERT INTO `mebresia` SET ?", [data], function(err, result) {
				//Si hay algun error en la consulta no hacemos nada
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo insertar la mebresia');
				}
				connection.release();
			});
		}
	});
});

/**************ELIMINA UN TIPO DE MEMBRESIA**********
 *
 **************************************************/
app.post('/api/deleteMembresia', function(req, res) {
	console.log('----------rm-----------');
	//valores a recibir
	var idmebresia = req.body.idmebresia;

	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("DELETE FROM `mebresia` WHERE idmebresia = " + idmebresia, function(err, result) {
				//Si hay algun error en la consulta no hacemos nada
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo Eliminar El Estado.');
				}
				connection.release();
			});
		}
	});
});

/**************Modifica UN TIPO DE MEMBRESIA**********
 *
 **************************************************/
app.post('/api/editMembresia', function(req, res) {

	console.log('----------EditUser-----------');
	//valores a recibir
	var idmebresia = req.body.idmebresia;
	var nombre = req.body.nombre;
	var dias = req.body.dias;

	var data = {
		idmebresia: idmebresia,
		nombre: nombre,
		dias: dias
	};
	console.log(data);
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("UPDATE `mebresia` SET ? WHERE `idmebresia`= ?", [data, idmebresia], function(err, result) {
				//Si hay algun error en la consulta no hacemos nada
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo insertar el Usuario');
				}
				connection.release();
			});
		}
	});
});

/**************RETORNA TODAS LAS MEMBRESIAS**********
 *
 **************************************************/
app.get('/api/getMembresia', function(req, res) {
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			//Aqui obtenemos los datos de la alerta
			connection.query("SELECT * FROM mebresia",
				function(err, rows, fields) {
					//Si hay algun error en la consulta no hacemos nada
					if (err) {
						console.error(err);
					}
					console.log(rows);
					res.send(
						rows
					);
					connection.release();
				});
		}
	});
});


/****************************************************************
 ************************** UNIDADES ****************************
 ****************************************************************
 */
/******** AGREGA UNA UNIDAD DE MEDIDA A UN USUARIO**************
 **************************************************************/
app.post('/api/unidad/agregar', function(req, res) {
	console.log('----------Agregando Unidad-----------');	
	var unidad = req.body.unidad;
	
	var data = {
		unidad: unidad
	};
	console.log("Agregando unidad: "+data);
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("INSERT INTO `unidad` SET ?", data, function(err, result) {
				//Si hay algun error en la consulta no hacemos nada
				if (err) {
					if(err.code === 'ER_DUP_ENTRY')
						res.json({error:'Duplicado',message:'Registro ya existe.',more:err})
					 
					else	console.error('Error Insertando unidad'+err.code);
				}else if (result !== undefined) {
					//Si el resutado no es nulo se inserto correctamente
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo insertar la unidad.');
				}
				connection.release();
			});
		}
	});
});

/************** MODIFICA UNA MEDIDA***************
 *
 **************************************************/
app.post('/api/unidad/editar', function(req, res) {
	console.log('----------EditUser-----------');
	var unidad = req.body.unidad;
	var idunidad = req.body.idunidad;

	var data = {
		idunidad: idunidad,
		unidad: unidad
	};
	console.log(data);
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("UPDATE `unidad` SET ? WHERE `idunidad`= ?", [data, idunidad], function(err, result) {
				//Si hay algun error en la consulta no hacemos nada
				if (err) {
				if(err.code === 'ER_DUP_ENTRY')
						res.json({error:'Duplicado',message:'Registro ya existe.',more:err})
					 
					else	console.error('Error Insertando unidad'+err.code);
				}else if (result !== undefined) {
					//Si el resutado no es nulo se inserto correctamente
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo insertar la unidad.');
				}
				connection.release();
			});
		}
	});
});

/**************RETORNA TODAS LAS UNIDADES**********
 *
 **************************************************/
app.get('/api/unidad/get', function(req, res) {
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			//Aqui obtenemos los datos de la alerta
			connection.query("SELECT * FROM unidad",
				function(err, rows, fields) {
					//Si hay algun error en la consulta no hacemos nada
					if (err) {
						console.error(err);
					}
					console.log(rows);
					res.send(
						rows
					);
					connection.release();
				});
		}
	});
});

/**********************ELIMINAR UNA UNIDAD DE MIEDIA *************
 *
 *
 *****************************************************************/
app.post('/api/unidad/eliminar', function(req, res) {
	console.error('----------Eliminando---------------');
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("DELETE FROM unidad WHERE idunidad ='" + req.body.idunidad + "'",
				function(err, result, fields) {
					if (err) {
						console.error(err);
					}
					if (result !== undefined) {
						console.log('Eliminado');
						console.log(result);
						res.json(result);
					} else {
						res.json("Registro no encontrado");
					}
					connection.release();
				});
		}
	});
});


/*******************************************************************************************************************/
/********************** PRODUCTOS ****************************
 ****************************************************************
 ****************************************************************
 */
/******** AGREGA UN PRODUCTO A UN USUARIO**************
 **************************************************************/
app.post('/api/producto/agregar', function(req, res) {
	console.log('---------- Agregando producto -----------');		
	var data = {
		nombre: req.body.nombre,
		costo: req.body.costo,
		precio: req.body.precio,
		id_tipo_medida: req.body.idmedida,
		idusuario: req.body.idusuario
	};
	console.log("Agregando producto: "+ JSON.stringify(data));
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("INSERT INTO `producto` SET ?", data, function(err, result) {
				//Si hay algun error en la consulta no hacemos nada
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					//Si el resutado no es nulo se inserto correctamente
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo insertar el producto.');
				}
				connection.release();
			});
		}
	});
});

/************** MODIFICA UN PRODUCTO***************
 *
 **************************************************/
app.post('/api/producto/editar', function(req, res) {
	console.log('----------EditUser-----------');
	var idusuario = req.body.idusuario; 
	var id_producto = req.body.id_producto;

	var data = {
	nombre: req.body.nombre,
	costo: req.body.costo,
	precio: req.body.precio,
	id_tipo_medida: req.body.idmedida,
	idusuario: req.body.idusuario
	};
	
	console.log(data);
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("UPDATE `producto` SET ? WHERE `id_producto`= ? AND `idusuario`= ?", [data, id_producto,idusuario], function(err, result) {
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo editar el producto.');
				}
				connection.release();
			});
		}
	});
});
/****** RETORNA TODOS LOS PRODUCTO DE UN USUARIO ****
 *
 **************************************************/
app.get('/api/producto/get/:idusuario', function(req, res) {
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("SELECT * FROM producto WHERE idusuario='" + req.params.idusuario + "'",
				function(err, rows, fields) {
					if (err) {
						console.error(err);
					}
					console.log(rows);
					res.send(rows);
					connection.release();
				});
		}
	});
});

/**********************ELIMINAR UN PRODUCTO DE UN USUARIO ********
 *
 *
 *****************************************************************/
app.post('/api/producto/eliminar', function(req, res) {
	console.error('----------Eliminando---------------');
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("DELETE FROM producto WHERE id_producto ='" + req.body.id_producto + " ' "+
							 " AND idusuario = '"+ req.body.idusuario + "'",
				function(err, result, fields) {
					if (err) {
						console.error(err);
					}
					if (result !== undefined) {
						console.log('Eliminado');
						console.log(result);
						res.json(result);
					} else {
						res.json("Registro no encontrado");
					}
					connection.release();
				});
		}
	});
});
/*******************************************************************************************************************/


/*******************************************************************************************************************/
/********************** CLIENTES ****************************
 ****************************************************************
 ****************************************************************
 */
/******** AGREGA UN CLIENTE A UN USUARIO**************
 **************************************************************/
app.post('/api/cliente/agregar', function(req, res) {
	console.log('---------- Agregando cliente -----------');		
	var data = {
		nombre: req.body.nombre,
		identificacion: req.body.identificacion,
		telefono: req.body.telefono,
		email: req.body.email,
		direccion:req.body.direccion, 
		idusuario: req.body.idusuario,
		estado: 'A'
	};
	console.log("Agregando cliente: "+JSON.parse(JSON.stringify(data)));
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("INSERT INTO `cliente` SET ?", data, function(err, result) {
				//Si hay algun error en la consulta no hacemos nada
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					//Si el resutado no es nulo se inserto correctamente
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo insertar el cliente.');
				}
				connection.release();
			});
		}
	});
});

/************** MODIFICA UN CLIENTE***************
 *
 **************************************************/
app.post('/api/cliente/editar', function(req, res) {
	console.log('----------Edit cliente -----------');
	var idusuario = req.body.idusuario; 
	var idcliente = req.body.idcliente;

	var data = {
		nombre: req.body.nombre,
		identificacion: req.body.identificacion,
		telefono: req.body.telefono,
		email: req.body.email,
		direccion:req.body.direccion
	};
	
	console.log(data);
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("UPDATE `cliente` SET ? WHERE `idusuario`= ? AND `idcliente`= ?", [data, idusuario,idcliente], function(err, result) {
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo editar el cliente.');
				}
				connection.release();
			});
		}
	});
});

/****** RETORNA TODOS LOS CLIENTES DE UN USUARIO ****
 *
 **************************************************/
app.get('/api/cliente/get/:idusuario', function(req, res) {
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("SELECT * FROM cliente WHERE idusuario='" + req.params.idusuario + "' and estado = 'A'",
				function(err, rows, fields) {
					if (err) {
						console.error(err);
					}
					console.log(rows);
					res.send(rows);
					connection.release();
				});
		}
	});
});

/****** RETORNA UN LOS CLIENTES DE UN USUARIO ****
 *
 **************************************************/
app.post('/api/cliente/getOne/', function(req, res) {
	var idcliente = req.body.idcliente; 
	var idusuario = req.body.idusuario; 
	console.log('--> usuario:'+idusuario +' cliente '+idcliente ); 
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("SELECT * FROM cliente WHERE idusuario='" +idusuario + "' and idcliente = '"+idcliente+"'",
				function(err, rows, fields) {
					if (err) {
						console.error(err);
					}
					console.log('Contacto: '+rows);
					res.send(rows[0]);
					connection.release();
				});
		}
	});
});

/**********************ELIMINAR UN CLIENTE DE UN USUARIO ********
 *
 *
 *****************************************************************/
app.post('/api/cliente/eliminar', function(req, res) {
	console.error('----------Eliminando cliente ---------------');
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else { 
			connection.query("UPDATE  cliente SET  estado =  'N' WHERE  idcliente = " + req.body.idcliente ,
				function(err, result, fields) {
					if (err) {
						console.error(err);
					}
					if (result !== undefined) {
						console.log('Eliminado');
						console.log(result);
						res.json(result);
					} else {
						res.json("Registro no encontrado");
					}
					connection.release();
				});
		}
	});
});


/****************************************************************
 ************************** MONEDAS ****************************
 ****************************************************************
 */
/******** AGREGA UNA MONEDAS **********************************
 **************************************************************/
app.post('/api/Monedas/agregar', function(req, res) {
	console.log('---------- agregar -----------');	
		var data = {
		nombre: req.body.nombre
	};
	console.log("Agregando unidad: "+data);
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("INSERT INTO `Monedas` SET ?", data, function(err, result) {
				//Si hay algun error en la consulta no hacemos nada
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					//Si el resutado no es nulo se inserto correctamente
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo insertar la Moneda.');
				}
				connection.release();
			});
		}
	});
});

/************** MODIFICA UNA MONEDAS***************
 *
 **************************************************/
app.post('/api/Monedas/editar', function(req, res) {
	console.log('----------Edit  Monedas -----------');
	
	var data = {
		nombre: req.body.nombre
	};
	
	console.log(data);
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("UPDATE `Monedas` SET ? WHERE `idmonedas`= ?", [data, req.body.idmonedas], function(err, result) {
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo editar la Moneda');
				}
				connection.release();
			});
		}
	});
});

/**************RETORNA TODAS LAS MONEDAS**********
 *
 **************************************************/
app.get('/api/Monedas/get', function(req, res) {
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("SELECT * FROM Monedas",
				function(err, rows, fields) {
					if (err) {
						console.error(err);
					}
					console.log(rows);
					res.send(rows);
					connection.release();
				});
		}
	});
});

/**********************ELIMINAR UNA MONEDA *************
********************************************************/
app.post('/api/Monedas/eliminar', function(req, res) {
	console.error('----------Eliminando---------------');
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("DELETE FROM Monedas WHERE idmonedas ='" + req.body.idmonedas + "'",
				function(err, result, fields) {
					if (err) {
						console.error(err);
					}
					if (result !== undefined) {
						console.log('Eliminado');
						console.log(result);
						res.json(result);
					} else {
						res.json("Registro no encontrado");
					}
					connection.release();
				});
		}
	});
});


/****************************************************************
 ************************** ESTADOS DE FACTURAS ****************
 ****************************************************************
 */
/******** AGREGA UNA MONEDAS **********************************
 **************************************************************/
app.post('/api/estadosfacturas/agregar', function(req, res) {
	console.log('---------- agregar -----------');	
		var data = {
		nombre: req.body.nombre
	};
	console.log("Agregando estadosfacturas: "+data);
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("INSERT INTO `estadosfacturas` SET ?", data, function(err, result) {
				//Si hay algun error en la consulta no hacemos nada
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					//Si el resutado no es nulo se inserto correctamente
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo insertar  estadosfacturas.');
				}
				connection.release();
			});
		}
	});
});

/************** MODIFICA UNA MONEDAS***************
 *
 **************************************************/
app.post('/api/estadosfacturas/editar', function(req, res) {
	console.log('----------Edit  Monedas -----------');
	
	var data = {
		nombre: req.body.nombre
	};
	
	console.log(data);
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("UPDATE `estadosfacturas` SET ? WHERE `idestado`= ?", [data, req.body.idestado], function(err, result) {
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo editar la Moneda');
				}
				connection.release();
			});
		}
	});
});

/**************RETORNA TODAS LAS MONEDAS**********
 *
 **************************************************/
app.get('/api/estadosfacturas/get', function(req, res) {
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("SELECT * FROM estadosfacturas",
				function(err, rows, fields) {
					if (err) {
						console.error(err);
					}
					console.log(rows);
					res.send(rows);
					connection.release();
				});
		}
	});
});

/**********************ELIMINAR UNA MONEDA *************
********************************************************/
app.post('/api/estadosfacturas/eliminar', function(req, res) {
	console.error('----------Eliminando---------------');
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("DELETE FROM estadosfacturas WHERE idestado ='" + req.body.idestado + "'",
				function(err, result, fields) {
					if (err) {
						console.error(err);
					}
					if (result !== undefined) {
						console.log('Eliminado');
						console.log(result);
						res.json(result);
					} else {
						res.json("Registro no encontrado");
					}
					connection.release();
				});
		}
	});
});



/****************************************************************
 **************************  FACTURAS ****************
 ****************************************************************
 */
/******** AGREGA UNA FACTURA **********************************

    var cliente = {nombre: "Kelvin",id: "13600184371",direccion: "Santo Domingo",telefono: "8098411883"} ;
    var encabezado= {fecha: "Kelvin",nota: "13600184371",asunto: "Santo Domingo",estado: "8098411883",moneda: 1, vence:"2015-08-10"};

    var detalle = [{idproducto: 1,cantidad: 80,precio: 100.0,detalle: "8098411883"},{idproducto: 2,cantidad: 830,precio: 1030.0,detalle: "ddd"}];

 **************************************************************/
app.post('/api/factura/agregar', function(req, res) {
	console.log('---------- agregar -----------');	
	
	var encabezado = {
			fecha: req.body.encabezado.fecha,
			nota: req.body.encabezado.nota,
			asunto: req.body.encabezado.asunto,
			estado: req.body.encabezado.estado,
			moneda: req.body.encabezado.moneda,
			vence: req.body.encabezado.vence,
			idusuario: req.body.encabezado.idusuario,
			ncfprefijo: 'undefined' ,
			ncfsufijo: 'undefined'
		};		
		var cliente = {
			nombre: req.body.cliente.nombre,
			identificacion: req.body.cliente.identificacion,
			telefono: req.body.cliente.telefono,
			email: req.body.cliente.email,
			direccion:req.body.cliente.direccion, 
			idusuario: req.body.cliente.idusuario
		};
		var idcliente; 
		var idencabezado; 
		var iddetalle; 
		var idfacoti; 	
	
	console.log(idfacoti); 
	
	//console.log(JSON.parse(JSON.stringify(req.body.detalle)));
	//console.log(JSON.parse(JSON.stringify(data)));
	console.log(req.body); 
	//console.log(req.body.encabezado.nota); 
	
	
	/***
				Si llega un idcliente quiere decir que el cliente existe, 
				si no llega lo creamos con los datos que lleguen
			**/
	if(req.body.cliente.idcliente === undefined){
				console.log('Creando CLiente...................'); 
				connectionpool.getConnection(function(err, connection) {
				if (err) {
					console.error('CONNECTION error: ', err);
				} else {
					connection.query('INSERT INTO cliente SET ?', cliente, function(err, result) {
						if (err) {
							return connection.rollback(function() {
								console.log("CLIENTE FAIL: "+err); 
								throw err;
							});
						}
						idcliente = result.insertId;  
						console.log( 'cliente ' + result.insertId + ' added');
						});
					}
				});
			}//
			else{
					console.log('ID USER: '+ req.body.cliente.idcliente); 
					console.log('Bravo!! Cliente ya existe!'); 
					idcliente = req.body.cliente.idcliente;  				
				}
	
	/**
	 *	Agregamos el No. Comprobante fiscal
	 		ncfprefijo
			ncfsufijo		
	 */	
	if(req.body.encabezado.tipo === 'factura' ){
			console.log('NCF:'+ req.body.encabezado.ncf );
		if(typeof req.body.encabezado.ncf  === 'undefined'){
	
				connectionpool.getConnection(function(err, connection) {
				if (err) {
					console.error('CONNECTION error: ', err);
				} else {     //SELECT CONCAT(`ncfprefijo`, lpad(`ncfsufijo`+1 ,8,0)) as ncf FROM `encabezado` WHERE `idusuario` = ? order by ncfsufijo DESC LIMIT 1       
					connection.query('SELECT CONCAT(`ncfprefijo`, lpad(`ncfsufijo`+1 ,8,0)) as ncf FROM `encabezado` WHERE `idusuario` = ? order by ncfsufijo DESC LIMIT 1', req.body.encabezado.idusuario, 
									 function(err, result) {
						if (err) {
							return connection.rollback(function() {
								console.log("NCF FAIL: "+err); 
								throw err;
							});
						}
						console.log( 'Ult NCF: ' + result[0].ncf );
							encabezado.ncfprefijo = result[0].ncf.substring(0,11); 
							encabezado.ncfsufijo = result[0].ncf.substring(11,19); 
								console.log('encabezado.ncfprefijo:'+ encabezado.ncfprefijo);
								console.log('encabezado.ncfprefijo:'+ encabezado.ncfsufijo);
						});
					}
				});
		}else {
			encabezado.ncfprefijo = req.body.encabezado.ncf.substring(0,11); 
			encabezado.ncfsufijo = req.body.encabezado.ncf.substring(11,19); 
			console.log('encabezado.ncfprefijo:'+ encabezado.ncfprefijo);
			console.log('encabezado.ncfprefijo:'+ encabezado.ncfsufijo);
			
		}
			
	}	
	
	connectionpool.getConnection(function(err, connection) {
		connection.beginTransaction(function(err) {
			if (err) {
				console.log(err); 
				throw err;
			} 
			connection.query('INSERT INTO encabezado SET ?', encabezado, function(err, result) {
					if (err) {
						return connection.rollback(function() {
							console.log("ENCABEZADO FAIL: "+err); 
							throw err;
						});
					}
					
					idencabezado = result.insertId;					
					//------------------------------------------------------------------
					var detalle = []; 
	
					for (var i = 0; i < req.body.detalle.length; i++) {
						detalle[i] = [req.body.detalle[i].cantidad,
													req.body.detalle[i].precio,
													idencabezado, 
													req.body.detalle[i].id_producto,
													req.body.detalle[i].detalle]; 
						console.log("cantidad: "+ req.body.detalle[i].cantidad + " precio: "+ req.body.detalle[i].precio ); 
						}
					
					console.log(detalle); 
				connection.query(
						'INSERT INTO detalle (cantidad, precio, idencabezado, id_producto, detalle) VALUES  ?',
						[detalle], function(err, result) {
					if (err) {
						return connection.rollback(function() {
							console.log("DETALLE FAIL: "+err); 
							throw err;
						});
					}
					
					 iddetalle = result.insertId;
							console.log("DETALLE ++: "+iddetalle); 
						
					//-----------------FACTURA/COTIZACION------------------------
							console.log('Se creara: '+req.body.encabezado.tipo); 
							console.log('Para el cliente: '+ idcliente +' y encabezado: '+ idencabezado + ' user: '+encabezado.idusuario); 
							
					connection.query(
					'INSERT INTO  `'+req.body.encabezado.tipo+'` (`idcliente` ,  `idencabezado`, `idusuario` ) VALUES ( '+idcliente+','+idencabezado+','+encabezado.idusuario+  ')',
						 function(err, result) {
					if (err) {
						return connection.rollback(function() {
							console.log("FACTUARA/COTIZACION FAIL: "+err); 
							throw err;
						});
					}
					
					 idfacoti = result.insertId;
							console.log("FACTURA/COTIZACION ++: "+idfacoti); 
										
					connection.commit(function(err) {						
						if (err) {
							return connection.rollback(function() {
								console.log(err); 
								throw err;
							});
						}
						console.log('success!');
						res.json({errorCode:'000', message:'success!',documento:encabezado});
					});	

					});
				});
			});
		});
	});
	console.log(encabezado); 

	
});

/************** MODIFICA UNA FACTURA***************
 *
 **************************************************/
app.post('/api/factura/editar', function(req, res) {
	console.log('----------Edit  Monedas -----------');
	
	var data = {
		nombre: req.body.nombre
	};
	
	console.log(data);
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("UPDATE `estadosfacturas` SET ? WHERE `idestado`= ?", [data, req.body.idestado], function(err, result) {
				if (err) {
					console.error(err);
				}
				if (result !== undefined) {
					console.log(result);
					res.json(result);
				} else {
					res.json('No se pudo editar la Moneda');
				}
				connection.release();
			});
		}
	});
});

/**************RETORNA TODAS LAS FACTURAS**********
 *
 **************************************************/
app.get('/api/factura/get', function(req, res) {
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("SELECT * FROM estadosfacturas",
				function(err, rows, fields) {
					if (err) {
						console.error(err);
					}
					console.log(rows);
					res.send(rows);
					connection.release();
				});
		}
	});
});

/**********************ELIMINAR UNA FACTURA *************
********************************************************/
app.post('/api/factura/eliminar', function(req, res) {
	console.error('----------Eliminando---------------');
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ', err);
		} else {
			connection.query("DELETE FROM estadosfacturas WHERE idestado ='" + req.body.idestado + "'",
				function(err, result, fields) {
					if (err) {
						console.error(err);
					}
					if (result !== undefined) {
						console.log('Eliminado');
						console.log(result);
						res.json(result);
					} else {
						res.json("Registro no encontrado");
					}
					connection.release();
				});
		}
	});
});


/************************************VER USUARIO POR ID LSITO************
 *
 *
 * Dado el id de un usuario retorna sus datos.
 *
 *
 ***********************************************************************/

app.get('/api/verUser/:idusuario', function(req, res) {
	//SELECT * FROM `usuarios` WHERE 1
	//  if(req.isAuthenticated()){
	connectionpool.getConnection(function(err, connection) {
		//Si hay error en la conexion no hacemos nada
		if (err) {
			console.error('CONNECTION error: ', err);

		} else {
			//Aqui obtenemos los datos del usurio autenticado para retornarlos
			connection.query("SELECT * FROM usuarios WHERE idusuario='" + req.params.idusuario + "'",
				function(err, rows, fields) {
					//Si hay algun error en la consulta no hacemos nada
					if (err) {
						console.error(err);
					}
					//Si el resutado de la consulta no es cero filas
					//quiere decir que se encontro el usuario
					if (rows.length > 0) {
						console.log('Usuario Encontrado');
						res.json(rows);
					} else {
						res.json("fallo en la consulta");
					}
					connection.release();
				});
		}
	});
	// } else{
	//      res.json('No Tiene Acceso');
	// }

});
/*
Es necesario hacer logout del lado del servidor
para quitar la key que da acceso a las Urls restringidas
 */
app.get('/logout', function(req, res) {
	req.logout();
	res.json('logOut');
});

app.listen(8080);
console.log('API Running on port:' + 8080);