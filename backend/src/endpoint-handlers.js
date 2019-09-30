const fs = require('fs');
const expressJwt = require('express-jwt');
const jwtwebtoken = require('jsonwebtoken');
const Moment = require('moment');

const { pool } = require('./db.js');
const {
    ERR_UNKNOWN,
    ERR_DUPLICATE,
    ERR_USERNAME_EXISTS,
    ERR_INVALID_CREDENTIALS
} = require('./error-codes.js');
// ============================================================================
// ====================== Entries =============================================
// ============================================================================
class TokenEntry {
    constructor(idToken, expiresAt) {
        this.idToken = idToken;
        this.expiresAt = expiresAt;
    }
}

class Response {
    constructor(data, tokenEntry, isAdmin) {
        this.data = data;
        this.tokenEntry = tokenEntry;
        this.isAdmin = isAdmin;
    }
}


class JwtValidator {
    constructor() {
        // Hashmap: hashOfId -> [TokenEntry]
        // 'Current' token is always at index 0
        this.jwtForUserId = {};
        // Hashmap: hashOfId -> moment
        this.lastRenewalAt = {};
    }
}


let jwtValidator = new JwtValidator();


const hashUserId = (userId) => 'userId' + userId;



// This function is module-bound
function intoResponse(userId, isAdmin, data) {
    const key = hashUserId(userId);
    const tokenRenewalDelaySeconds = 10; // Renew the token no more frequent than that
    if (!jwtValidator.lastRenewalAt[key] || Moment().subtract(tokenRenewalDelaySeconds, 'seconds').isAfter(jwtValidator.lastRenewalAt[key])) {
        jwtValidator.lastRenewalAt[key] = Moment();
        const newTokenEntry = generateTokenEntry(userId);
        jwtValidator.jwtForUserId[key].unshift(newTokenEntry);
    }
    const tokenEntry = jwtValidator.jwtForUserId[key][0]; // most up-to-date token
    return new Response(data, tokenEntry, isAdmin);
}


function retrieveEntries(request, response) {
    console.log('============== retrieveEntries =====================')
    const { userId } = request.user;
    const isAdmin = request.isAdmin;
    return pool.query('SELECT * FROM WordEntry WHERE userId = $1 ORDER BY id ASC', [userId])
        .then(res => response.status(200).json(intoResponse(userId, isAdmin, res.rows)))
        .catch(err => console.error(err));
};


function retrieveLanguages(request, response) {
    console.log('============== retrieveLanguages =====================')
    const { userId } = request.user;
    const isAdmin = request.isAdmin;
    const format = (res) => { // '(1,English)' => { id: 1, name: 'English' }
        const [id, name] = res.substring(1, res.length - 1).split(',');
        return { id: +id, name };
    };
    pool.query(`SELECT (id, name) FROM UserLanguages INNER JOIN Language ON (UserLanguages.languageId = Language.id) WHERE userId = ${userId} ORDER BY id ASC`)
        .then(res => response.status(200).json(intoResponse(userId, isAdmin, res.rows.map(obj => obj.row).map(format))))
        .catch(err => console.error(err));
}


function addUserLanguage(request, response) {
    console.log('============== addUserLanguage =====================')
    const { userId } = request.user;
    const isAdmin = request.isAdmin;
    let { name } = request.body;

    pool.query(`SELECT (id) FROM Language WHERE name = '${name}'`)
        .then(languageId => {
            languageId = languageId.rows[0].id;
            pool.query(`INSERT INTO UserLanguages (userId, languageId) VALUES ('${userId}', '${languageId}')`)
                .then(res => response.status(201).json(intoResponse(userId, isAdmin, { success: true })))
                .catch(err => {
                    let result;
                    if (err.code == '23505') {
                        result = ERR_DUPLICATE;
                    } else {
                        result = ERR_UNKNOWN;
                    }
                    console.error('>>>>>>>> ', result);
                    response.status(409).json({ code: result });
                });
        })
        .catch(err => console.error(err));

}


function deleteUserLanguage(request, response) {
    console.log('============== deleteUserLanguage =====================')
    const { userId } = request.user;
    const isAdmin = request.isAdmin;
    const languageId = parseInt(request.params.id)
    pool.query(`DELETE FROM UserLanguages WHERE userid = ${userId} AND languageid = ${languageId}`)
        .then(_ => {
            pool.query(`DELETE FROM WordEntry WHERE userid = ${userId} AND (fromlanguage = ${languageId} OR tolanguage = ${languageId})`)
                .then(_ => response.status(200).json(intoResponse(userId, isAdmin, { success: true })))
                .catch(err => {
                    const result = ERR_UNKNOWN;
                    console.error('>>>>>>>> ', result);
                    console.error(err);
                    response.status(409).json({ code: result });
                });
        })
        .catch(err => {
            const result = ERR_UNKNOWN;
            console.error('>>>>>>>> ', result);
            console.error(err);
            response.status(409).json({ code: result });
        });
}


function renameTag(request, response) {
    console.log('=================== renameTag ================')
    const { userId } = request.user;
    const isAdmin = request.isAdmin;
    const { oldName, newName } = request.body;
    pool.query(`UPDATE WordEntry SET tags = array_replace(tags, '${oldName}', '${newName}') WHERE userId = ${userId}`)
        .then(res => response.status(200).json(intoResponse(userId, isAdmin, { success: true })))
        .catch(err => {
            console.error('Error while renaming tag: ', err);
            response.status(409).json({ code: ERR_UNKNOWN });
        });
}


function deleteTag(request, response) {
    console.log('=================== deleteTag ================')
    const { userId } = request.user;
    const isAdmin = request.isAdmin;
    const name = request.params.name;
    pool.query(`UPDATE WordEntry SET tags = array_remove(tags, '${name}') WHERE userId = ${userId}`)
        .then(res => {
            const DEFAULT_TAG = 'main';
            pool.query(`UPDATE WordEntry SET tags = array_append(tags, '${DEFAULT_TAG}') WHERE userId = ${userId} AND tags = '{}'`)
                .then(res => response.status(200).json(intoResponse(userId, isAdmin, { success: true })))
                .catch(err => {
                    console.error('Encountered an error while settings default tag: ', err);
                    response.status(409).json({ code: ERR_UNKNOWN });
                });
        })
        .catch(err => {
            console.error('Encountered an error while deleting a tag: ', err);
            response.status(409).json({ code: ERR_UNKNOWN });
        });
};


function retrieveAllLanguages(request, response) {
    console.log('============== retrieveAllLanguages =====================')
    const { userId } = request.user;
    const isAdmin = request.isAdmin;

    const format = (res) => { // '(1,English)' => { id: 1, name: 'English' }
        const [id, name] = res.substring(1, res.length - 1).split(',');
        return { id: +id, name };
    };
    return pool.query(`SELECT (id, name) FROM Language ORDER BY id ASC`)
        .then(res => response.status(200).json(intoResponse(userId, isAdmin, res.rows.map(obj => obj.row).map(format))))
        .catch(err => console.error(err));
}


function addEntry(request, response) {
    console.log('============== addEntry =====================')
    const { userId } = request.user;
    const isAdmin = request.isAdmin;
    const score = 0;
    let { fromLanguage, toLanguage, word, translations, tags } = request.body;
    const DEFAULT_TAGS = ['main'];
    if (tags.length == 0) tags = DEFAULT_TAGS;
    return pool.query('INSERT INTO WordEntry (userId, fromLanguage, toLanguage, word, translations, score, tags) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [userId, fromLanguage, toLanguage, word, translations, score, tags])
        .then(res => response.status(201).json(intoResponse(userId, isAdmin, { success: true })))
        .catch(err => {
            let result;
            if (err.code == '23505') {
                result = ERR_DUPLICATE;
            } else {
                result = ERR_UNKNOWN;
            }
            console.error('>>>>>>>> ', result);
            response.status(409).json({ code: result });
        });
};


function deleteEntry(request, response) {
    console.log('=================== deleteEntry ================')
    const { userId } = request.user;
    const isAdmin = request.isAdmin;
    const id = parseInt(request.params.id)
    return pool.query('DELETE FROM WordEntry WHERE id = $1', [id])
        .then(res => response.status(200).json(intoResponse(userId, isAdmin, { success: true })))
        .catch(err => {
            const result = ERR_UNKNOWN;
            console.error('>>>>>>>> ', result);
            response.status(409).json({ code: result });
        });
};


function updateEntry(request, response) {
    console.log('=================== updateEntry ================')
    const { userId } = request.user;
    const isAdmin = request.isAdmin;
    const id = parseInt(request.params.id)
    let { fromLanguage, toLanguage, word, translations, score, tags } = request.body;
    const DEFAULT_TAGS = ['main'];
    if (tags.length == 0) tags = DEFAULT_TAGS;
    return pool.query('UPDATE WordEntry SET fromLanguage = $2, toLanguage = $3, word = $4, translations = $5, score = $6, tags = $7 WHERE id = $1',
        [id, fromLanguage, toLanguage, word, translations, score, tags])
        .then(res => response.status(200).json(intoResponse(userId, isAdmin, { success: true })))
        .catch(err => {
            let result;
            if (err.code == '23505') {
                result = ERR_DUPLICATE;
            } else {
                result = ERR_UNKNOWN;
            }
            console.error('>>>>>>>> ', result);
            response.status(409).json({ code: result });
        });
};
// ============================================================================
// ====================== User/Session =========================================
// ============================================================================
// TODO: why is it relative to the Node rather than current file??
const RSA_PRIVATE_KEY = fs.readFileSync('./src/private.key');
const RSA_PUBLIC_KEY = fs.readFileSync('./src/public.key');


// This function is module-bound
function generateTokenEntry(userId) {
    const payload = { userId };
    const expiresInSeconds = 10 * 240;
    const expiresAt = Moment().add(expiresInSeconds, 'seconds').format();
    const idToken = jwtwebtoken.sign(payload, RSA_PRIVATE_KEY, {
        algorithm: 'RS256',
        expiresIn: expiresInSeconds
    });

    return new TokenEntry(idToken, expiresAt);
}


function createUser(request, response) {
    console.log('=================== create user ================')
    const { username, password } = request.body;
    return pool.query('INSERT INTO UserEntry (username, password, isAdmin) VALUES ($1, $2, $3)', [username, password, false])
        .then(_ => response.status(200).json({ success: true }))
        .catch(err => {
            let result;
            if (err.code == '23505') {
                result = ERR_USERNAME_EXISTS;
            } else {
                result = ERR_UNKNOWN;
            }
            console.error('>>>>>>>> ', result);
            response.status(401).json({ code: result });
        });
};


function loginUser(request, response) {
    console.log('=================== login ================')
    const { username, password } = request.body;
    return pool.query('SELECT (id, isAdmin) FROM UserEntry WHERE username = $1 AND password = $2', [username, password])
        .then(res => {
            if (res.rows.length == 0) { // no matches
                let result = ERR_INVALID_CREDENTIALS;
                console.error('>>>>>>>> ', result);
                response.status(401).json({ code: result });
                return;
            }

            const format = (data) => { // '(1,t)' => { userId: 1, isAdmin: true' }
                const [userId, isAdmin] = data.substring(1, data.length - 1).split(',');
                return { userId: +userId, isAdmin: isAdmin === 't' };
            };
            const { userId, isAdmin } = format(res.rows[0].row);
            const key = hashUserId(userId);
            console.log('^^^^ Initting hashtable for key: ', key);
            if (!jwtValidator.jwtForUserId[key]) jwtValidator.jwtForUserId[key] = []; // first init for this user
            response.status(200).json(intoResponse(userId, isAdmin, { success: true }));
        })
        // Is not triggered when there are no matches:
        .catch(err => {console.error(err); response.sendStatus(401);});
};


function reloginUser (request, response) {
    console.log('=================== relogin ================')
    // If we got to this function then the provided JWT was valid
    const { userId } = request.user;
    const isAdmin = request.isAdmin;
    response.status(200).json(intoResponse(userId, isAdmin, { success: true }));
    // console.log('Setting ', userId, ' to ', token.idToken);
};


function logoutUser(request, response) {
    console.log('=================== logout ================')
    const { userId } = request.user;
    response.status(200).json({ code: 'OK' });
    const key = hashUserId(userId);
    jwtValidator.jwtForUserId[key] = []; // clear
    jwtValidator.lastRenewalAt[key] = null; // clear
    // console.log('Setting ', userId, ' to ', token.idToken);
}


// This functiion is module-bound
function isIn(elem, array) {
    for (let a of array) {
        // console.log('Comparing ', elem);
        // console.log('With      ', a);
        if (elem === a) return true;
    }
    return false;
}


function tidyValidJwtsArray(userId) {
    const key = hashUserId(userId);
    for (let i = 0; i < jwtValidator.jwtForUserId[key].length; i++) {
        const tokenEntry = jwtValidator.jwtForUserId[key][i];
        const expired = Moment().isAfter(Moment(tokenEntry.expiresAt));
        if (expired) {
            const removed = jwtValidator.jwtForUserId[key].splice(i, 1);
            console.log('#### Removing stale tokenEntry: ', removed);
            i--;
        }
    }
}


// Check that the JWT is one among registered at the moment for the user
function validateJwt(request, response, next) {
    // console.log('--------- validating --------- ');
    const { userId } = request.user;

    const key = hashUserId(userId);
    if (!jwtValidator.jwtForUserId[key]) {
        console.log('>>>> Somewhy hashtable is undefined for key: ', key);
        response.status(401).json({ code: 'THE SERVER WAS RESTARTED IN THE MIDDLE OF THE CLIENT SESSION. PLEASE LOGOUT AND TRY AGAIN' });
        return;
    }

    tidyValidJwtsArray(userId);

    const actualJwtString = request.headers.authorization.substring(7); // skip 'Bearer '
    const expectedJwtStrings = jwtValidator.jwtForUserId[key].map(entry => entry.idToken);
    if (isIn(actualJwtString, expectedJwtStrings)) {
        // console.log('match!');
        next();
    } else {
        // console.log('no match!');
        response.status(401).json({ code: 'VALID BUT UNEXPECTED JWT' });
    }
}


// Check that the user is an Admin
function setIfAdmin(request, response, next) {
    const { userId } = request.user;
    pool.query('SELECT (isAdmin) FROM UserEntry WHERE id = $1', [userId])
        .then(res => {
            const isAdmin = res.rows[0].isadmin;
            request.isAdmin = isAdmin ? true : false; // To make an explicit 'false' instead of 'undefined'
            next();
        })
        .catch(err => console.error('>>> Could not determine if the User is an Admin: ', err));
}


function statsUsers(request, response) {
    console.log('============== Stats: Users =====================')
    const { userId } = request.user;
    const isAdmin = request.isAdmin;
    if (!isAdmin) {
        response.status(401).json({ code: 'THIS ENTRY IS RESTRICTED TO ADMINS ONLY' });
        return;
    }

    const format = (data) => { // '(1,Igorek,f)' => { id: 1, username: 'Igorek', isAdmin: false }
        const [id, username, isAdmin] = data.substring(1, data.length - 1).split(',');
        return { id: +id, username, isAdmin: isAdmin === 't' };
    };
    return pool.query('SELECT (id, username, isAdmin) FROM UserEntry ORDER BY id ASC')
        .then(res => {
            const result = res.rows.map(({ row }) => row).map(format);
            response.status(200).json(intoResponse(userId, isAdmin, result));
        })
        .catch(err => console.error(err));
}


function statsLanguages(request, response) {
    console.log('============== Stats: Languages =====================')
    const { userId } = request.user;
    const isAdmin = request.isAdmin;
    if (!isAdmin) {
        response.status(401).json({ code: 'THIS ENTRY IS RESTRICTED TO ADMINS ONLY' });
        return;
    }

    const format = (res) => { // '(1,English)' => { id: 1, name: 'English' }
        const [id, name] = res.substring(1, res.length - 1).split(',');
        return { id: +id, name };
    };

    // Result: { id, name, wordsFrom, wordsTo, totalWords }
    pool.query(`SELECT (id, name) FROM Language ORDER BY id ASC`)
        .then(allLanguages => {
            pool.query('SELECT * FROM WordEntry')
                .then(wordEntries => {
                    allLanguages = allLanguages.rows.map(({ row }) => row).map(format); // { id, name }
                    wordEntries = wordEntries.rows;

                    const result = allLanguages.map(({ id, name }) => {
                        const [ wordsFrom, wordsTo ] = wordEntries.reduce(function reducer(
                                [ wordsFrom, wordsTo ],
                                { fromlanguage: fromLanguage, tolanguage: toLanguage }) {
                            if (fromLanguage == id) wordsFrom++;
                            if (toLanguage   == id) wordsTo++;
                            return [ wordsFrom, wordsTo ];
                        }, [0, 0]) // initial value

                        const totalWords = wordsFrom + wordsTo;
                        return { id, name, wordsFrom, wordsTo, totalWords };
                    })

                    response.status(200).json(intoResponse(userId, isAdmin, result));
                })
                .catch(err => console.error(err));
        })
        .catch(err => console.error(err));
}


function addLanguage(request, response) {
    console.log('============== addLanguage =====================')
    const { userId } = request.user;
    const isAdmin = request.isAdmin;
    if (!isAdmin) {
        response.status(401).json({ code: 'THIS ENTRY IS RESTRICTED TO ADMINS ONLY' });
        return;
    }

    let { name } = request.body;
    return pool.query(`INSERT INTO Language (name) VALUES ('${name}')`)
        .then(res => response.status(201).json(intoResponse(userId, isAdmin, { success: true })))
        .catch(err => {
            let result;
            if (err.code == '23505') {
                result = ERR_DUPLICATE;
            } else {
                result = ERR_UNKNOWN;
            }
            console.error('>>>>>>>> ', result);
            response.status(409).json({ code: result });
        });
};


function deleteLanguage(request, response) {
    console.log('=================== removeLanguage ================')
    const { userId } = request.user;
    const isAdmin = request.isAdmin;
    if (!isAdmin) {
        response.status(401).json({ code: 'THIS ENTRY IS RESTRICTED TO ADMINS ONLY' });
        return;
    }
    const id = parseInt(request.params.id)

    return pool.query('DELETE FROM Language WHERE id = $1', [id])
        .then(res => response.status(200).json(intoResponse(userId, isAdmin, { success: true })))
        .catch(err => {
            const result = ERR_UNKNOWN;
            console.error('>>>>>>>> ', result);
            response.status(409).json({ code: result });
        });
};


module.exports = {
    retrieveEntries, retrieveLanguages, retrieveAllLanguages,
    addEntry, deleteEntry, updateEntry,
    renameTag, deleteTag,
    addUserLanguage, deleteUserLanguage,
    createUser, loginUser, reloginUser, logoutUser,
    checkJwt: expressJwt({secret: RSA_PUBLIC_KEY}), // is a func
    validateJwt, jwtValidator, setIfAdmin,
    statsUsers, statsLanguages, addLanguage, deleteLanguage
};
