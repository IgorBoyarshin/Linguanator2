const express = require('express');
const cors = require('cors'); // https://www.npmjs.com/package/cors
const bodyParser = require('body-parser');
const app = express();

const { dbClearAndLoadDefault } = require('./db.js');
const {
    retrieveEntries, retrieveLanguages, retrieveAllLanguages,
    addEntry, deleteEntry, updateEntry,
    renameTag, deleteTag,
    addUserLanguage, deleteUserLanguage,
    createUser, loginUser, reloginUser, logoutUser,
    checkJwt, validateJwt, jwtValidator, setIfAdmin,
    // For Admin
    statsUsers, statsLanguages, addLanguage, deleteLanguage
} = require('./endpoint-handlers.js');


// dbClearAndLoadDefault();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());
app.options('*', cors());


app.post('/create', createUser);
app.post('/login', loginUser);
app.post('/relogin', checkJwt, validateJwt, setIfAdmin, reloginUser);
app.post('/logout', checkJwt, validateJwt, setIfAdmin, logoutUser);

app.get('/selflanguages', checkJwt, validateJwt, setIfAdmin, retrieveLanguages);
app.post('/selflanguages', checkJwt, validateJwt, setIfAdmin, addUserLanguage);
app.delete('/selflanguages/:id', checkJwt, validateJwt, setIfAdmin, deleteUserLanguage);

app.get('/alllanguages', checkJwt, validateJwt, setIfAdmin, retrieveAllLanguages);

app.get('/entries', checkJwt, validateJwt, setIfAdmin, retrieveEntries);
app.post('/entries', checkJwt, validateJwt, setIfAdmin, addEntry);
app.put('/entries/:id', checkJwt, validateJwt, setIfAdmin, updateEntry);
app.delete('/entries/:id', checkJwt, validateJwt, setIfAdmin, deleteEntry);

app.put('/tags/rename', checkJwt, validateJwt, setIfAdmin, renameTag);
app.delete('/tags/:name', checkJwt, validateJwt, setIfAdmin, deleteTag);


// For Admin
app.get('/stats/users', checkJwt, validateJwt, setIfAdmin, statsUsers);
app.get('/stats/alllanguages', checkJwt, validateJwt, setIfAdmin, statsLanguages);
app.post('/stats/alllanguages', checkJwt, validateJwt, setIfAdmin, addLanguage);
app.delete('/alllanguages/:id', checkJwt, validateJwt, setIfAdmin, deleteLanguage);


const port = 1234;
app.listen(port, () => console.log(`################## ............Starting on port ${port}!............##################`));
