const express = require('express')
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const { v4: uuidv4 } = require('uuid');

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
  if (err) writeError(err);
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

  var query = "SELECT * FROM articles WHERE ";
  var conditionsAdded = false;
  var uses = [];

  if (categoryName !== "*") {
    query += " category_id = ?";
    uses.push(parseInt(categoryName));
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
        if (err === null) {
          res.status(402).send('{"status":"ERROR", "message":"null"}');
        } else {
          res.status(401).send('{"status":"ERROR", "message":"Something gone wrong"}');
        } 
      }
    }
  });
});

app.post('/api/article/sumview', upload.single('file'), async (req, res) => {
  writeLog('MESSAGE article sumView');
  const textPost = req.body;

  try {
    article_id = textPost.article_id;
  } catch (error) {
    writeError('JSON error' + error);
    res.status(400).send('{"status":"ERROR", "message":"Error en el JSON"}');
    return;
  }

  var query = "UPDATE articles  SET views = views + 1  WHERE article_id = ?";
  

  con.query(query, [article_id], function (err, result) {
    if (err) {
      writeError('Error executing query: ' + err);
      res.status(400).send('{"status":"ERROR", "message":"Error executing query"}');
    } else {
      if (result.length > 0) {
        res.status(200).send(`{"status":"OK", "message":"View Counted"}`);
      } else {
        res.status(400).send('{"status":"ERROR", "message":"Something gone wrong"}');
      }
    }
  });
});

app.post('/api/article/post', upload.single('file'), async (req, res) => {
  writeLog('MESSAGE article post');
  const textPost = req.body;

  try {
    title = textPost.title;
    preview_image = textPost.preview_image;
    content = textPost.content;
    language = textPost.language;
    annex = textPost.annex;
    country = textPost.country;
    date = textPost.date;
    user = textPost.user;
    category = textPost.category;
  } catch (error) {
    writeError('JSON error' + error);
    res.status(400).send('{"status":"ERROR", "message":"Error en el JSON"}');
    return;
  }

  previewImage = saveImage(preview_image, uuid());

  savedContent = []
  for (let i = 0; i < content.length; i++) {
    if (isBase64Image(content[i])) {
      savedContent.push(saveImage(content[i], uuid()))
    } else {
      savedContent.push(content[i])
    }
  }

  userId = await getUserId(user);

  var query = "INSERT INTO articles (title, preview_image, content, language, annex, country, date, views, user_id, category_id) VALUES (?, ?, '{\"content\": ? }', ?, ?, ?, ?, 0, ?, ?);"
  
  params = [title, previewImage, savedContent, language, annex, country, date, userid, category]

  con.query(query, params, function (err, result) {
    if (err) {
      writeError('Error executing query: ' + err);
      res.status(400).send('{"status":"ERROR", "message":"Error executing query"}');
    } else {
      if (result.length > 0) {
        res.status(200).send(`{"status":"OK", "message":"Article created"}`);
      } else {
        res.status(400).send('{"status":"ERROR", "message":"Something gone wrong"}');
      }
    }
  });
});


///////////////////
///  FUNCTIONS  ///
///////////////////

function saveImage(imageData, imageName) {
  const directory = './public/images/'

  if (!fs.existsSync(directory)){
    fs.mkdirSync(directory);
  }


    // Create a buffer from the Base64 data
    const buffer = Buffer.from(imageData, 'base64');

  fs.writeFile(directory + imageName, buffer, function(err) {
    if (err) {
        writeError('Error saving image:', err);
    } else {
        return '/images/' + imageName
    }
  });
}

function imageToBase64(filePath) {
  // Read the image file
  const imageData = fs.readFileSync(filePath);

  // Convert the image data to base64
  const base64Image = Buffer.from(imageData).toString('base64');

  return base64Image;
}

function uuid() {
  return uuidv4() + '.png';
}

function isBase64Image(str) {
  if (str.startsWith("data:image/")) {
      return true;
  }

  if (str.length > 50 && base64Pattern.test(str)) {
      try {
          atob(str); 
          return true;
      } catch (e) {
          return false; 
      }
  }

  return false;
}

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


async function getUserId(user) {
  const query = "SELECT user_id FROM users WHERE name = ?;";
  con.query(query, [user], function (err, result) {
      if (err) {
        writeError('Error executing query: ' + err);
      } else {
        if (result.length > 0) {
          console.log(result[0].user_id)
        } else {
          writeError("Query ERROR")
        }
      }
    });
}


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
