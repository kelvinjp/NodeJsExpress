var express = require('express'),
    app     = express(),
    mysql   = require('mysql'),
    connectionpool = mysql.createPool({
        vhost     : '127.0.0.1',
        user     : 'root',
        password : '@4233asdf',
        database : 'pweb2'
    });
/*
Modulos requeridos para la seguridad de las Urls
 */
var bodyParser = require('body-parser');
var multer = require('multer');
var expressSession = require('express-session');

var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');

var secret = 'this is the secret secret secret 12356';

app.use('/api', expressJwt({secret: secret}));



	app.use(bodyParser.json()); // for parsing application/json
	app.use(bodyParser.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded
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
app.get('/', function(req,res){

    
        res.json('Working...');
    
});


/*
Aqui solo probamos que funciona la base de datos y que nos podemos conectar
*/
app.get('/mysql', function(req,res){
    console.log("vivo");
    connectionpool.getConnection(function(err, connection) {
        if (err) {
            console.error('CONNECTION error: ',err);
            res.statusCode = 503;
            res.send({
                result: 'error',
                err:    err.code
            });
        } else {
            connection.query('SELECT * FROM usuarios', function(err, rows, fields) {
                if (err) {
                    console.error(err);
                    res.statusCode = 500;
                    res.send({
                        result: 'error',
                        err:    err.code
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
app.post('/login', function(req,res){
   
    //TODO validate req.body.username and req.body.password
  //if is invalid, return 401
		
	 connectionpool.getConnection(function(err, connection) {
       	var username =req.body.username; 
		var password =req.body.password; 
		 
		 console.log(username+" "+password);
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
           
        } else {
            connection.query("SELECT * FROM usuarios WHERE username='"+username+"' AND password='"+password+"'",
            function(err, rows, fields) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
					res.status(401).send('Wrong user or password'); 
                }
                //Si el resutado de la consulta retorna mas de una fila
                //quiere decir que se el usuario y contraseña son correctas
               if(rows.length >0){
				   var profile ={
					   user : rows[0].username,
					   name : rows[0].nombres, 
				   }; 
                   
                    console.log('Logeado corretamente como:'+profile.user+' '+profile.name);
				   var token = jwt.sign(profile, secret, { expiresInMinutes: 60*5 });
				   rows[0].token = token; 
                   res.json(rows[0]);
               }
               else{
                  res.send(401, 'Wrong user or password');
               }
                connection.release();
            });
        }
    });
});





/***********************AGREGAR USUARIO LISTO**************************
 * 
 * Para agregar un usuario cremamos una variable datos con los datos del
 * usuario agregar y le pasamos esa variable al INSERT
 * 
**********************************************************************/
app.post('/addUser', function(req,res){
  
  var nombres = req.body.nombres;
  var apellidos = req.body.apellidos;
  var username = req.body.username;
  var password = req.body.password;
  var telefono = req.body.telefono;
  var direccion = req.body.direccion;
  var cedula = req.body.cedula;
  var email = req.body.email; 
  var idtipouser = parseInt(req.body.idtipouser);
  var estado = 0; 
  
  //Los nombres de las variablen en el arreglo datos deben tener el mismo
  //nombre de los campo de la tabla usuarios
  var data  = {
        nombres: nombres, 
        username:username, 
        apellidos:apellidos, 
        password:password, 
        telefono:telefono,
        direccion:direccion,
        identificacion:cedula,
        email:email,
        idtiposusuario:idtipouser,
        estado: estado
  };
  
    connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
        } else {
                connection.query("INSERT INTO `usuarios` SET ?",data,  function(err, result) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                if(result !== undefined){
                        //Si el resutado de la consulta retorna mas de una fila
                        //quiere decir que se encontro el usuario
                    console.log(result); 
                    res.json(result);
                }
                else{
                    res.json('No se pudo insertar el Usuario');
                }
                connection.release();
            });
        }
    });
});


/***************************UPDATE USUARIO LISTO****************
 * 
 * 
 * 
 ***************************************************************/
app.post('/api/editUser', function(req,res){

        console.log('----------EditUser-----------');
            //valores a recibir
            var nombres = req.body.nombres;
            var apellidos = req.body.apellidos;
            var username = req.body.username;
            var password = req.body.password;
            var telefono = req.body.telefono;
            var direccion = req.body.direccion;
            var cedula = req.body.cedula;
            var email = req.body.email; 
  
              var idtipouser = parseInt(req.body.idtipouser);
    
            //Los nombres de las variablen en el arreglo datos deben tener el mismo
            //nombre de los campo de la tabla usuarios
            var data  = {
                nombres: nombres, 
                username:username, 
                apellidos:apellidos, 
                password:password, 
                telefono:telefono,
                direccion:direccion,
                identificacion:cedula,
                idtiposusuario:idtipouser,
                email:email
            };
  
        connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
        } else {
            
            /**
             * UPDATE `usuarios` SET `idusuario`=[value-1],`username`=[value-2],`password`=[value-3],`nombres`=[value-4],`apellidos`=[value-5],`identificacion`=[value-6],`telefono`=[value-7],`direccion`=[value-8],`idtiposusuario`=[value-9] WHERE 1
             * */
                connection.query("UPDATE `usuarios` SET ? WHERE `username`= ?", [data, username],  function(err, result) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                if(result !== undefined){
                        //Si el resutado de la consulta retorna mas de una fila
                        //quiere decir que se encontro el usuario
                    console.log(result); 
                    res.json(result);
                }
                else{
                    res.json('No se pudo insertar el Usuario');
                }
                connection.release();
            });
        }
    });
       
});


/****************************Agregar Membresia***************************
 * 
 * 
 * 
 * 
 * 
 *********************************************************************** */

app.post('/api/membresia', function(req,res){
       console.log('----------EditUser-----------');
            //valores a recibir
          
    var username = req.body.username;
    var dias = parseInt(req.body.tiempo);
	var vence1 = req.body.vence; 
	var vence2 = new Date(vence1); 
	
	

	console.log('dias: '+ dias);
	console.log('vence: '+ vence1);
console.log('vence2: '+ vence2);
	
	var x1 = vence2.getDate();
	var x2 =vence2.getMonth()+1 ;
	var x3 = vence2.getFullYear();
	
	console.log('dias: '+x1 );
	console.log('m: '+ x2);
	console.log('a: '+ x3);
	
	var xx = ""; 

	if ( isNaN( vence2 ) ) {  // d.valueOf() could also work
    var toGetFecha = new Date(); 
            console.log(toGetFecha); 
            console.log(toGetFecha.getDate());
             x3 = toGetFecha.getFullYear();
             x2 = toGetFecha.getMonth()+1; 
             x1 = toGetFecha.getDate(); 
		xx= x1+"/"+x2+"/"+x3;
  }
  else {
    	xx= x1+"/"+x2+"/"+x3;
  }
	/**
	
	*/
sumaFecha = function(d, fecha){
 var Fecha = new Date();
 var sFecha = fecha || (Fecha.getDate() + "/" + (Fecha.getMonth() +1) + "/" + Fecha.getFullYear());
 var sep = sFecha.indexOf('/') != -1 ? '/' : '-'; 
 var aFecha = sFecha.split(sep);
 var fecha = aFecha[2]+'/'+aFecha[1]+'/'+aFecha[0];
 fecha= new Date(fecha);
 fecha.setDate(fecha.getDate()+parseInt(d));
 var anno=fecha.getFullYear();
 var mes= fecha.getMonth()+1;
 var dia= fecha.getDate();
 mes = (mes < 10) ? ("0" + mes) : mes;
 dia = (dia < 10) ? ("0" + dia) : dia;
var strfecha = anno+'-'+mes+'-'+dia+' 00:00:00';
			var vencex = new Date(strfecha).toISOString().slice(0, 19).replace('T', ' ');
            console.log("vi: "+vencex); 
 return (vencex);
 };
	              
            var vencea = sumaFecha(dias,xx);
            console.log("vf: "+vencea); 
       
            //Los nombres de las variablen en el arreglo datos deben tener el mismo
            //nombre de los campo de la tabla usuarios
            var data  = {
                estado:1, 
                vence:vencea 
    
            };
  
        connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
        } else {
            /**
             * UPDATE `usuarios` SET `idusuario`=[value-1],`username`=[value-2],`password`=[value-3],`nombres`=[value-4],`apellidos`=[value-5],`identificacion`=[value-6],`telefono`=[value-7],`direccion`=[value-8],`idtiposusuario`=[value-9] WHERE 1
             * */
                connection.query("UPDATE `usuarios` SET ? WHERE `username`= ?", [data, username],  function(err, result) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                if(result!== undefined){
                        //Si el resutado de la consulta retorna mas de una fila
                        //quiere decir que se encontro el usuario
                    console.log(result); 
                    res.json(result);
                }
                else{
                    res.json('No se pudo agregar la membresia');
                }
                connection.release();
            });
        }
    });

});

/****
*Declinar Usuario
*/
app.post('/api/declinarUsuario', function(req,res){
       console.log('----------Declinando Usuario-----------');
            //valores a recibir
            var username = req.body.username;
            var data  = {
                estado:3    
            };
  
        connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
        } else {
            /**
             * UPDATE `usuarios` SET `idusuario`=[value-1],`username`=[value-2],`password`=[value-3],`nombres`=[value-4],`apellidos`=[value-5],`identificacion`=[value-6],`telefono`=[value-7],`direccion`=[value-8],`idtiposusuario`=[value-9] WHERE 1
             * */
                connection.query("UPDATE `usuarios` SET ? WHERE `username`= ?", [data, username],  function(err, result) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                if(result!== undefined){
                        //Si el resutado de la consulta retorna mas de una fila
                        //quiere decir que se encontro el usuario
                    console.log(result); 
                    res.json(result);
                }
                else{
                    res.json('No se pudo Declinar El Usuario');
                }
                connection.release();
            });
        }
    });

});

/***************************GET TODOS LOS USUARIOS PENDIENTES REGISTRO ********
 * 
 * Retorna los datos de una alerta por su ID. 
 * 
 ***********************************************************************/
app.get('/api/getPendientes', function(req,res){
    //SELECT * FROM `alertas` WHERE 1
  
     connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
           
        } else {
            //Aqui obtenemos los datos de la alerta
            connection.query("SELECT * FROM `usuarios` WHERE `estado` =0 AND  `idtiposusuario` !=0",
            function(err, rows, fields) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                //Si el resutado de la consulta no es cero filas
                //quiere decir que se encontro el usuario
                console.log(rows);
                    res.send(
                        rows
                        );
               
                connection.release();
            });
        }
    });
    
});

/***************************GET TODOS LOS USUARIOS DECLINADOS ********
 * 
 * . 
 * 
 ***********************************************************************/
app.get('/api/getDeclinados', function(req,res){
     connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
           
        } else {
            //Aqui obtenemos los datos de la alerta
            connection.query("SELECT * FROM `usuarios` WHERE `estado` =3 AND  `idtiposusuario` !=0",
            function(err, rows, fields) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                //Si el resutado de la consulta no es cero filas
                //quiere decir que se encontro el usuario
                console.log(rows);
                    res.send(
                        rows
                        );
               
                connection.release();
            });
        }
    });
    
});

/***************************GET TODOS LOS USUARIOS Registrados ********
 * 
 * . 
 * 
 ***********************************************************************/
app.get('/api/getRegistrados', function(req,res){
     connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
           
        } else {
            //Aqui obtenemos los datos de la alerta
            connection.query("SELECT * FROM `usuarios` WHERE `estado` =1 AND  `idtiposusuario` !=0",
            function(err, rows, fields) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                //Si el resutado de la consulta no es cero filas
                //quiere decir que se encontro el usuario
                console.log(rows);
                    res.send(
                        rows
                        );
               
                connection.release();
            });
        }
    });
    
});



/***********************************AGREGAR ALERTAS LISTO********************
 * 
 * 
 * 
 * 
 *     Crea una nueva alerta 
 *****************************************************************************/
app.post('/api/newAlert', function(req,res){
 
        console.log('----------NewAlert-----------');
  
    var idUser = req.body.idUser;
    var tipo = req.body.tipo;
    var latitud = req.body.latitud;
    var longitud = req.body.longitud;
   

    var now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log(now);
    
  var data  = {
        fecha: now, 
        latitud:latitud, 
        longitud:longitud, 
        estado:0,
        actualizada:now, 
        comentario:"Nueva alerta(Sin Comentarios)", 
        idusuario:idUser,
        idtiposalerta:tipo
  };
  
 console.log(data);
    connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
        } else {
                connection.query("INSERT INTO `alertas` SET ?",data,  function(err, result) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                if(result !== undefined){
                        //Si el resutado no es nulo se inserto correctamente
                    console.log(result); 
                    res.json(result);
                }
                else{
                    res.json('No se pudo insertar la alerta');
                }
                connection.release();
            });
        }
    });
});

/***************************GET ALERTA POR ID LISTO***********************
 * 
 * Retorna los datos de una alerta por su ID. 
 * 
 ***********************************************************************/
app.get('/api/getAlert/:idAlerta', function(req,res){
    //SELECT * FROM `alertas` WHERE 1
    
     connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
           
        } else {
            //Aqui obtenemos los datos de la alerta
            connection.query("SELECT idalerta, fecha, latitud, longitud,"+
            " Estado.nombre AS estado, actualizada, comentario, username, "+
            "tiposalertas.nombre AS alerta FROM alertas JOIN Estado ON "+
            " alertas.idalerta = Estado.idEstado JOIN usuarios ON "+
            "alertas.idusuario = usuarios.idusuario JOIN tiposalertas ON "+
            "alertas.idtiposalerta = tiposalertas.idtiposalerta WHERE idalerta ='"+
            req.params.idAlerta+"' ORDER BY idalerta desc",
            function(err, rows, fields) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                //Si el resutado de la consulta no es cero filas
                //quiere decir que se encontro el usuario
               if(rows.length >0){
                   var now = Date(rows[0].fecha);
                   console.log('Fecha de la alerta: '+now);
                    res.json(rows);
               }
               else{
                  res.json("fallo en la consulta");
               }
                connection.release();
            });
        }
    });
});


/***************************GET TODAS LAS ALERTAS***********************
 * 
 * Retorna los datos de una alerta por su ID. 
 * 
 ***********************************************************************/
app.get('/api/getAlert', function(req,res){
    //SELECT * FROM `alertas` WHERE 1
     connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
           
        } else {
            //Aqui obtenemos los datos de la alerta
            connection.query("SELECT  `idalerta` ,  `fecha` ,  `latitud` ,  `longitud` , alertas.estado AS estado,  `actualizada` ,  `comentario` , alertas.idusuario,  `idtiposalerta`, `username` FROM  `alertas` JOIN usuarios ON alertas.idusuario = usuarios.idusuario",
            function(err, rows, fields) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                //Si el resutado de la consulta no es cero filas
                //quiere decir que se encontro el usuario
                console.log(rows);
                    res.send(
                        rows
                        );
               
                connection.release();
            });
        }
    })
       
});
/**
* Get Alertas por usuario
*/
app.get('/getAlertUsuario/:idAlerta', function(req,res){
    //SELECT * FROM `alertas` WHERE 1

     connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);

        } else {
            //Aqui obtenemos los datos de la alerta
            connection.query("SELECT idalerta, fecha, Estado.nombre AS estado, actualizada, comentario FROM alertas JOIN Estado WHERE alertas.estado =  Estado.idestado AND alertas.idusuario ='"+req.params.idAlerta+"'",
            function(err, rows, fields) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                //Si el resutado de la consulta no es cero filas
                //quiere decir que se encontro el usuario
               if(rows.length >0){
                   var now = Date(rows[0].fecha);
                   console.log('Fecha de la alerta: '+now);
                   res.send(
                        rows
                        );
               }
               else{
                  res.json("fallo en la consulta");
               }
                connection.release();
            });
        }
    });
});
/******
 * Todos los tipos de alertas
**/
app.get('/api/getTiposAlert', function(req,res){
    //SELECT * FROM `alertas` WHERE 1
  
     connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
           
        } else {
            //Aqui obtenemos los datos de la alerta
            connection.query("SELECT * FROM tiposalertas",
            function(err, rows, fields) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                //Si el resutado de la consulta no es cero filas
                //quiere decir que se encontro el usuario
                console.log(rows);
                    res.send(
                        rows
                        );
               
                connection.release();
            });
        }
    });
    
});

/**
*
*/
app.post('/api/deleteEstado', function(req,res){
        console.log('----------rm-----------');
            //valores a recibir
            var idestado = req.body.idestado;
  
        connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
        } else {
			connection.query("DELETE FROM `Estado` WHERE idestado = "+idestado,  function(err, result) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                if(result !== undefined){
                        //Si el resutado de la consulta retorna mas de una fila
                        //quiere decir que se encontro el usuario
                    console.log(result); 
                    res.json(result);
                }
                else{
                    res.json('No se pudo Eliminar El Estado.');
                }
                connection.release();
            });
        }
    });       
});

/**
*
*/
app.post('/api/addEstado', function(req,res){
        console.log('----------ADD-----------');
            //valores a recibir
            var nombre = req.body.nombre;
            var Descripcion = req.body.Descripcion;
  
            var data  = {
                nombre: nombre, 
                Descripcion: Descripcion
            };
  console.log(data); 
        connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
        } else {
			connection.query("INSERT INTO `Estado` SET ?", [data],  function(err, result) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                if(result !== undefined){
                        //Si el resutado de la consulta retorna mas de una fila
                        //quiere decir que se encontro el usuario
                    console.log(result); 
                    res.json(result);
                }
                else{
                    res.json('No se pudo insertar el Usuario');
                }
                connection.release();
            });
        }
    });       
});

/**
*
*/
app.post('/api/addMembresia', function(req,res){
        console.log('----------ADD M-----------');
            //valores a recibir
            var nombre = req.body.nombre;
            var dias =  parseInt(req.body.dias);
  
            var data  = {
                nombre: nombre, 
                dias: dias
            };
  console.log(data); 
        connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
        } else {
			connection.query("INSERT INTO `mebresia` SET ?", [data],  function(err, result) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                if(result !== undefined){
                        //Si el resutado de la consulta retorna mas de una fila
                        //quiere decir que se encontro el usuario
                    console.log(result); 
                    res.json(result);
                }
                else{
                    res.json('No se pudo insertar la mebresia');
                }
                connection.release();
            });
        }
    });       
});

/**
*
*/
app.post('/api/deleteMembresia', function(req,res){
        console.log('----------rm-----------');
            //valores a recibir
            var idmebresia = req.body.idmebresia;
  
        connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
        } else {
			connection.query("DELETE FROM `mebresia` WHERE idmebresia = "+idmebresia,  function(err, result) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                if(result !== undefined){
                        //Si el resutado de la consulta retorna mas de una fila
                        //quiere decir que se encontro el usuario
                    console.log(result); 
                    res.json(result);
                }
                else{
                    res.json('No se pudo Eliminar El Estado.');
                }
                connection.release();
            });
        }
    });       
});



app.post('/api/editMembresia', function(req,res){

        console.log('----------EditUser-----------');
            //valores a recibir
            var idmebresia = req.body.idmebresia;
            var nombre = req.body.nombre;
            var dias = req.body.dias;
  
            var data  = {
                idmebresia: idmebresia, 
                nombre: nombre, 
                dias: dias
            };
  console.log(data); 
        connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
        } else {
			connection.query("UPDATE `mebresia` SET ? WHERE `idmebresia`= ?", [data, idmebresia],  function(err, result) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                if(result !== undefined){
                        //Si el resutado de la consulta retorna mas de una fila
                        //quiere decir que se encontro el usuario
                    console.log(result); 
                    res.json(result);
                }
                else{
                    res.json('No se pudo insertar el Usuario');
                }
                connection.release();
            });
        }
    });
       
});


app.get('/api/getMembresia', function(req,res){
    //SELECT * FROM `alertas` WHERE 1
  
     connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
           
        } else {
            //Aqui obtenemos los datos de la alerta
            connection.query("SELECT * FROM mebresia",
            function(err, rows, fields) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                //Si el resutado de la consulta no es cero filas
                //quiere decir que se encontro el usuario
                console.log(rows);
                    res.send(
                        rows
                        );               
                connection.release();
            });
        }
    });
    
});

/******
 * Todos los Estados
**/
app.get('/api/getEstados', function(req,res){
    //SELECT * FROM `alertas` WHERE 1
  
     connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
           
        } else {
            //Aqui obtenemos los datos de la alerta
            connection.query("SELECT * FROM Estado",
            function(err, rows, fields) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                //Si el resutado de la consulta no es cero filas
                //quiere decir que se encontro el usuario
                console.log(rows);
                    res.send(
                        rows
                        );               
                connection.release();
            });
        }
    });
    
});

/***
*

*/
app.post('/api/editEstado', function(req,res){

        console.log('----------EditUser-----------');
            //valores a recibir
            var idestado = req.body.idestado;
            var nombre = req.body.nombre;
            var Descripcion = req.body.Descripcion;
  
            var data  = {
                idestado: idestado, 
                nombre: nombre, 
                Descripcion: Descripcion
            };
  console.log(data); 
        connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
        } else {
			connection.query("UPDATE `Estado` SET ? WHERE `idestado`= ?", [data, idestado],  function(err, result) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                if(result !== undefined){
                        //Si el resutado de la consulta retorna mas de una fila
                        //quiere decir que se encontro el usuario
                    console.log(result); 
                    res.json(result);
                }
                else{
                    res.json('No se pudo insertar el Usuario');
                }
                connection.release();
            });
        }
    });
       
});

/************************UPDATE ALERTA LISTO*****************
 * 
 * A las alertas solo se le actualizara
 * el estado, fecha de actualizacion,
 * y el comentario
 * 
 **************************************************************/
app.post('/api/editAlert', function(req,res){
   
    
   console.log('----------Editando-----------');
            //valores a recibir
            var idalerta = req.body.idalerta;
            var estado = parseInt(req.body.estado);
            var comentario = req.body.comentario;
            
             var now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            console.log(now);
    
            //Los nombres de las variablen en el arreglo datos deben tener el mismo
            //nombre de los campo de la tabla 
            var data  = {
                idalerta: idalerta, 
                estado:estado,
                actualizada:now,
                comentario:comentario, 
            };
  
        connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
        } else {
                connection.query("UPDATE `alertas` SET ? WHERE `idalerta`= ?", [data, idalerta],  function(err, result) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                if(result !== undefined){
                        //Si el resutado de la consulta retorna mas de una fila
                        //quiere decir que se encontro 
                    console.log(result); 
                    res.json(result);
                }
                else{
                    res.json('No se pudo insertar el Usuario');
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
  
app.get('/api/verUser/:idusuario', function(req,res){
  //SELECT * FROM `usuarios` WHERE 1
 //  if(req.isAuthenticated()){
       connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
           
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
               if(rows.length >0){
                    console.log('Usuario Encontrado');
                    res.json(rows);
               }
               else{
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
/***********************************AGREGAR VEHICULO LISTO******************* * 
 *     Crea una nueva alerta 
 *****************************************************************************/
app.post('/api/newVehiculo', function(req,res){
    
        console.log('---------------------');
   var color = req.body.color;
    var placa = req.body.placa;
    var chasis = req.body.chasis;
    var idusuario = req.body.idusuario;
    var marca = req.body.marca;
    var modelo = req.body.modelo;
    var fecha = req.body.fecha;
   

    var now = new Date().toISOString().slice(0, 19).replace('T', ' ');
   
  var data  = {
        color: color,
        placa: placa,
        chasis: chasis,
        idusuario: idusuario,
        marca: marca,
        modelo: modelo,
        fecha: fecha
  };
  
 console.log(data);
    connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
        } else {
                connection.query("INSERT INTO `vehiculos` SET ?",data,  function(err, result) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                if(result !== undefined){
                        //Si el resutado no es nulo se inserto correctamente
                    console.log(result); 
                    res.json(result);
                }
                else{
                    res.json('No se pudo insertar');
                }
                connection.release();
            });
        }
    });
   
});


/************************* Ver Vehiculo por ID Listo ********************
 * 
 * 
 * Dado el Id de un vehiculo retorna los datos del mismo. 
 * 
 * 
 ***********************************************************************/
app.get('/api/verVehiculos/:idusuario', function(req,res){
  //SELECT * FROM `usuarios` WHERE 1
  console.log('--------------------------------VER VEHICULOS--------------');
       connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
           
        } else {
            //Aqui obtenemos los datos del usurio autenticado para retornarlos
            connection.query("SELECT * FROM vehiculos WHERE idusuario='"+req.params.idusuario+"'",
            function(err, rows, fields) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                //Si el resutado de la consulta no es cero filas
                //quiere decir que se encontro el usuario
               if(rows.length >0){
                    console.log('Vehiculos  Encontrados');
                    res.json(rows);
               }
               else{
                  res.json("Registro no encontrado");
               }
                connection.release();
            });
        }
    });
   
  
});


/**********************ELIMINAR VEHICULO POR ID LISTO**************
 * 
 * 
 *****************************************************************/
app.post('/api/eliminarVehiculo', function(req,res){
    
            console.error('----------Eliminando---------------');
           
    //DELETE FROM `vehiculos` WHERE 1
   //valores a recibir
        connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
           
        } else {
            //Aqui obtenemos los datos del usurio autenticado para retornarlos
            connection.query("DELETE FROM vehiculos WHERE idvehiculo='" + req.body.idvehiculo+"'",
            function(err, result, fields) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                //Si el resutado de la consulta no es cero filas
                //quiere decir que se encontro el usuario
               if(result !== undefined){
                    console.log('Eliminado');
                    console.log(result);
                    res.json(result);
               }
               else{
                  res.json("Registro no encontrado");
               }
                connection.release();
            });
        }
    });
   
});

app.post('/api/editarVehiculo', function(req,res){
   // UPDATE `vehiculos` SET `idvehiculo`=[value-1],`color`=[value-2],`idusuario`=[value-3],`Placa`=[value-4],`Chasis`=[value-5],`Marcas_Id`=[value-6] WHERE 1
   
       console.log('---------------------');
            //valores a recibir
    var idvehiculo = req.body.idvehiculo;         
    var color = req.body.color;
    var placa = req.body.placa;
    var chasis = req.body.chasis;
    var idusuario = req.body.idusuario;
    var marca = req.body.marca;
    var modelo = req.body.modelo;
    var fecha = req.body.fecha;
   
  var data  = {
        color: color,
        placa: placa,
        chasis: chasis,
        idusuario: idusuario,
        marca: marca,
        modelo: modelo,
        fecha: fecha
  };
  
        connectionpool.getConnection(function(err, connection) {
        //Si hay error en la conexion no hacemos nada
        if (err) {
            console.error('CONNECTION error: ',err);
        } else {
                connection.query("UPDATE `vehiculos` SET ? WHERE `idvehiculo`= ?", [data, idvehiculo],  function(err, result) {
                //Si hay algun error en la consulta no hacemos nada
                if (err) {
                    console.error(err);
                }
                if(result !== undefined){
                        //Si el resutado de la consulta retorna mas de una fila
                        //quiere decir que se encontro 
                    console.log(result); 
                    res.json(result);
                }
                else{
                    res.json('Editar el vehiculo');
                }
                connection.release();
            });
        }
    });
});


/*
Es necesario hacer logout del lado del servidor
para quitar la key que da acceso a las Urls restringidas
 */
app.get('/logout', function(req,res){

    req.logout();
    res.json('logOut');
});

app.listen(8080);
console.log('API Running on port:' + 8080);
