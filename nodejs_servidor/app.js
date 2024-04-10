const express = require('express')
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const app = express()
const port = process.env.PORT || 80

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000 * 1024 * 1024 }
});

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.json());

//////////////
//  SERVER  //
//////////////
const httpServer = app.listen(port, async () => {
  console.log(`Listening for HTTP queries on: http://localhost:${port}`)
})

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  httpServer.close()
  process.exit(0);
}

/////////////
//  MySQL  //
/////////////
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Admin_123",
  database: "minarai_db"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to MySQL!");
});


///////////////////
///  ENDPOINTS  ///
///////////////////

app.post('/api/user/register', upload.single('file'), async (req, res) => {
  writeLog('MESSAGE user register')
  const textPost = req.body;

  try {
    userName = textPost.name;
    userPassword = textPost.password;
    userProfileImage = textPost.profileImage;
    userRole = textPost.role;
  } catch (error) {
    writeError('JSON error' + error);
    res.status(400).send('{"status":"EROR", "message":"Error en el JSON"}')
  } 

  var query = "INSERT INTO users (name, password, profile_image, role) VALUES (?, ?, ?, ?)"

  con.query(query, [userName, userPassword, userProfileImage, userRole], function (err, result) {
    if (err) {
      writeError('Error executing query: ' + err);
      res.status(400).send('{"status":"EROR", "message":"Error executing query"}')
    } else {
      res.status(200).send('{"status":"OK", "message":"User registered", "data":{}')
    }
  });

})

app.post('/api/user/login', upload.single('file'), async (req, res) => {
  writeLog('MESSAGE user login')
  const textPost = req.body;

  try {
    userName = textPost.name;
    userPassword = textPost.password;
  } catch (error) {
    writeError('JSON error' + error);
    res.status(400).send('{"status":"EROR", "message":"Error en el JSON"}')
  } 

  var query = "SELECT name, password FROM users WHERE name = ? and password = ?"

  con.query(query, [userName, userPassword], function (err, result) {
    if (err) {
      writeError('Error executing query: ' + err);
      res.status(400).send('{"status":"EROR", "message":"Error executing query"}')
    } else {
      if (result.length > 0) {
        res.status(200).send('{"status":"OK", "message":"User login ok", "data":{}')
      } else {
        res.status(400).send('{"status":"EROR", "message":"Invalid username or password"}')
      }
    }
  });

})

app.post('/api/article/list', upload.single('file'), async (req, res) => {
  writeLog('MESSAGE article list');
  const textPost = req.body;

  var params = [];
  var vars = ['LANGUAGE', 'COUNTRY', 'DATE'];

  try {
    categoryName = textPost.category;
    userName = textPost.user;
    amount = textPost.amount;
    params.push(textPost.language);
    params.push(textPost.country);
    params.push(textPost.date);
    orderBy = textPost.orderBy;
    order = textPost.order;
  } catch (error) {
    writeError('JSON error' + error);
    res.status(400).send('{"status":"ERROR", "message":"Error en el JSON"}');
    return;
  }

  var query = "SELECT * FROM Articles WHERE ";
  var conditionsAdded = false;
  var uses = [];

  if (categoryName !== "*") {
    query += " category_id = (SELECT category_id from categories where name = ?)";
    uses.push(categoryName);
    conditionsAdded = true;
    if (userName !== "*") {
      query += " AND ";
    }
  }

  if (userName !== "*") {
    query += " user_id = (SELECT user_id from users where name = ?) ";
    uses.push(userName);
    conditionsAdded = true;
  }

  for (var i = 0; i < params.length; i++) {
    if (params[i].toString() !== "*") {
      if (conditionsAdded) {
        query += " AND ";
      }
      query += ` ${vars[i]} = ?`;
      uses.push(params[i].toString());
      conditionsAdded = true;
    }
  }

  var orderByClause = ' ORDER BY ? ?';
  uses.push(orderBy);
  uses.push(order);
  query += orderByClause;


  if (amount < 0) {
    query += " LIMIT ?";
    uses.push(amount);
  }

  con.query(query, uses, function (err, result) {
    if (err) {
      writeError('Error executing query: ' + err);
      res.status(400).send('{"status":"ERROR", "message":"Error executing query"}');
    } else {
      if (result.length > 0) {
        res.status(200).send(`{"status":"OK", "message":"Query ok", "data":${JSON.stringify(result)}}`);
      } else {
        res.status(401).send('{"status":"ERROR", "message":"Something gone wrong"}');
      }
    }
  });
});

app.post('/api/article/get', upload.single('file'), async (req, res) => {
  writeLog('MESSAGE article get');
  const textPost = req.body;

  try {
    article_id = textPost.article_id;
  } catch (error) {
    writeError('JSON error' + error);
    res.status(400).send('{"status":"ERROR", "message":"Error en el JSON"}');
    return;
  }

  var query = "SELECT * FROM Articles WHERE article_id = ?";
  

  con.query(query, [article_id], function (err, result) {
    if (err) {
      writeError('Error executing query: ' + err);
      res.status(400).send('{"status":"ERROR", "message":"Error executing query"}');
    } else {
      if (result.length > 0) {
        res.status(200).send(`{"status":"OK", "message":"Query ok", "data":${JSON.stringify(result)}}`);
      } else {
        res.status(400).send('{"status":"ERROR", "message":"Something gone wrong"}');
      }
    }
  });
});



///////////////////
///  FUNCTIONS  ///
///////////////////

function executeQuery(query, callback) {
  con.query(query, function (err, result, fields) {
    if (err) {
      writeError('Error executing query: ' + err);
      callback(err, null);
    } else {
      callback(null, result);
    }
  });
}

// example
// function getAllArticles() {
//   const query = "SELECT * FROM articles";
//   executeQuery(query, (err, result) => {
//     if (err) {
//       writeError('Error getting articles: ' + err.message);
//     } else {
//       console.log('Articles:', result);
//     }
//   });
// }

///////////////
///  LOGGS  ///
///////////////

function writeLog(message) {
  message = '>> ' + message
  console.log(message)
  const logFilePath = path.join(__dirname, 'logs.txt'); 

  // Agregar la fecha y hora actual al mensaje de log
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;

  // Escribir en el archivo de logs
  fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
          console.error('>>>>>> Error al escribir en el archivo de logs:', err);
      }
  });
}

function writeError(errorMessage) {
  errorMessage = '>>> [ERROR] ' + errorMessage
  console.log(errorMessage)
  const logFilePath = path.join(__dirname, 'logs.txt'); 

  // Agregar la fecha y hora actual al mensaje de log
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${errorMessage}\n`;

  // Escribir en el archivo de logs
  fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
          console.error('>>>>>> Error al escribir en el archivo de logs:', err);
      }
  });
}
