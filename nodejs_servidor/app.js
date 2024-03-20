const express = require('express')
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const app = express()
const port = process.env.PORT || 8888

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
  password: "admin",
  database: "mnt_db"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to MySQL!");
});


///////////////////
///  ENDPOINTS  ///
///////////////////

app.post('/data', upload.single('file'), async (req, res) => {
  writeLog('MESSAGE')
  const textPost = req.body;

  try {
    // take data
  } catch (error) {
    writeError('JSON error' + error);
    res.status(400).send('{status:"EROR", message:"Error en el JSON"}')
  }

})



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
  const logFilePath = path.join(__dirname, 'logs.txt'); // Ruta del archivo de logs

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
  const logFilePath = path.join(__dirname, 'logs.txt'); // Ruta del archivo de logs

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
