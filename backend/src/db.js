const { Pool, Client } = require('pg');

const { users, languages, entries } = require('./app-stuff.js');


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'linguanator',
    password: 'myPostgresPassword',
    port: 5432,
});
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client:', err);
    process.exit(-1); // TODO
});


exports.pool = pool;
// ============================================================================
// ============================================================================
// ============================================================================
function enclose(elem) {
    return "'" + elem + "'";
}


async function runAndLogError(query) {
    await pool.query(query).catch(err => console.error(err));
}


async function dbClear() {
    await runAndLogError('DROP TABLE IF EXISTS Language CASCADE');
    await runAndLogError('DROP TABLE IF EXISTS UserEntry CASCADE');
    await runAndLogError('DROP TABLE IF EXISTS WordEntry CASCADE');
    await runAndLogError('DROP TABLE IF EXISTS UserLanguages CASCADE');
}


async function dbCreateTableUserEntry() {
    const query = `
        CREATE TABLE IF NOT EXISTS UserEntry (
            id serial PRIMARY KEY,
            username varchar(20) NOT NULL UNIQUE,
            password varchar(30) NOT NULL,
            isadmin BOOLEAN NOT NULL
        );
    `;
    await runAndLogError(query);
}


async function dbCreateTableUserLanguages() {
    const query = `
        CREATE TABLE IF NOT EXISTS UserLanguages (
            userId integer REFERENCES UserEntry(id),
            languageId integer REFERENCES Language(id),
            PRIMARY KEY (userId, languageId)
        );
    `;
    await runAndLogError(query);
}


async function dbCreateTableLanguage() {
    const query = `
        CREATE TABLE IF NOT EXISTS Language (
            id serial PRIMARY KEY,
            name varchar(20) NOT NULL UNIQUE
        );
    `;
    await runAndLogError(query);
}


// TODO: add UNIQUE constrainst within a single User
async function dbCreateTableWordEntry() {
    const query = `
        CREATE TABLE IF NOT EXISTS WordEntry (
            userId integer REFERENCES UserEntry(id),
            id serial PRIMARY KEY,
            fromLanguage integer REFERENCES Language(id),
            toLanguage integer REFERENCES Language(id),
            word varchar(40) NOT NULL,
            translations varchar(40) ARRAY,
            score real NOT NULL CONSTRAINT score_nonnegative CHECK (score >= 0),
            tags varchar(20) ARRAY
        );
    `;
    await runAndLogError(query);
}


async function dbAddUsers(users) {
    for (let { username, password, isAdmin } of users) {
        const query = `INSERT INTO UserEntry (username,      password,      isAdmin)
                       VALUES             ('${username}', '${password}', '${isAdmin}')
                       ON CONFLICT DO NOTHING`;
        await runAndLogError(query);
    }
}


async function dbAddUserLanguages(entries) {
    let userLanguages = [];
    const notPresent = (uId, lId) => userLanguages.find(({ userId, languageId }) => uId == userId && lId == languageId) === undefined;
    for (let { userId, from, to } of entries) {
        if (notPresent(userId, from)) userLanguages.push({ userId, languageId: from });
        if (notPresent(userId, to))   userLanguages.push({ userId, languageId: to   });
    }

    for (let { userId, languageId } of userLanguages) {
        const query = `INSERT INTO UserLanguages (userId,      languageId)
                       VALUES                 ('${userId}', '${languageId}')
                       ON CONFLICT DO NOTHING`;
        await runAndLogError(query);
    }
}


async function dbAddLanguages(languages) {
    const queryBegin = 'INSERT INTO Language (name) VALUES ';
    const queryEnd = ' ON CONFLICT DO NOTHING';
    for (let language of languages) {
        const query = `INSERT INTO Language (name) VALUES ('${language}') ON CONFLICT DO NOTHING`;
        await runAndLogError(query);
    }
}


async function dbAddEntries(entries) {
    const queryBegin = 'INSERT INTO WordEntry (userId, fromLanguage, toLanguage, word, translations, score, tags) VALUES ';
    const queryEnd = ' ON CONFLICT DO NOTHING';
    for (let { userId, from, to, word, translations, score, tags } of entries) {
        translations = translations.map(enclose).join(',');
        tags = tags.map(enclose).join(',');
        const query =
            `INSERT INTO WordEntry (  userId,    fromLanguage, toLanguage, word,   translations,             score,  tags)
             VALUES                (${userId}, ${from},       ${to},    '${word}', ARRAY[${translations}], ${score}, ARRAY[${tags}])
             ON CONFLICT DO NOTHING`;
        await runAndLogError(query);
    }
}


async function dbClearAndLoadDefault() {
    await dbClear();
    await dbCreateTableUserEntry();
    await dbCreateTableLanguage();
    await dbCreateTableUserLanguages();
    await dbCreateTableWordEntry();
    await dbAddUsers(users);
    await dbAddLanguages(languages);
    await dbAddEntries(entries);
    await dbAddUserLanguages(entries);
}


exports.dbClearAndLoadDefault = dbClearAndLoadDefault;
