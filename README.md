# Server

## Connexion with MySql

This server uses the library ```mysql``` to connect to de DDBB in MySql.


## Endpoints

### /api/user

Endpoints related to the users:

- ```register```: Register an user to de DDBB. Example:
    ```json
        {
         "name": "userName",
         "password": "securePassword",
         "profileImage": "base64image",
         "role": "standard/creator/banned"
        }
     ```

- ```login```: Login an user to the DDBB. Example:
    ```json
        {
         "name": "userName",
         "password": "securePassword"
        }
     ```

- ```name```: Get the name of an userID. Example:
    ```json
        {
         "user_id": 3
        }
     ```
  

### /api/article

Endpoints related to articles

- ```list```: Get a list of articles by category and some parameters. Example:
    ```json
        {
         "category": 1,
         "user": "userName",
         "amount": 10,
         "language": "ES",
         "country": "JP",
         "date": "15/05/2024",
         "order": "ASC/DESC",
         "orderBy": "date/views"
        }
     ```

- ```post```: Publicate an article. Example:
    ```json
        {
         "title": "The title of the article",
         "preview_image": "base64Image",
         "content": ["some text", "more text", "base64Image", "even more text", "base64Image"],
         "language": "JP",
         "annex": "even more text if necesary",
         "country": "ES",
         "date": "15/05/2024",
         "user": "UserAuthor",
         "category": 1
        }
     ```
  
- ```sumview```: Sum one view to the articleID. Example:
    ```json
        {
         "article_id": "0001",
        }
     ```



## Instalation and running

Instal·lar dependències del servidor amb:
    
```bash
cd nodejs_server
npm install
```

Executar el servidor en mode desenvolupament amb:
    
```bash
cd nodejs_server
npm run dev
```
