class WordEntry {
    constructor(userId, from, to, word, translations, score, tags) {
        this.userId = userId;
        this.from = from;
        this.to = to;
        this.word = word;
        this.translations = translations;
        this.score = score;
        this.tags = tags;
    }
}

function idOfIn(language, languages) {
    for (let i = 0; i < languages.length; i++) {
        if (languages[i] === language) return (i + 1);
    }
    console.error("Could not find index of language: ", name);
    return -1;
}

function initEntries(languages) {
    const ger = idOfIn("German", languages);
    const eng = idOfIn("English", languages);
    const rus = idOfIn("Russian", languages);
    const userId1 = 1;
    const userId2 = 2;
    return [
        new WordEntry(userId1, ger, eng, 'weit', ['wide', 'far', 'broad'], 3, ['tag1', 'tag2']),
        new WordEntry(userId1, ger, eng, 'aufmerksam', ['attentive', 'mindful', 'thoughtful'], 1, ['tag1']),
        new WordEntry(userId1, ger, eng, 'gehorsam', ['obedient', 'submissive'], 2, ['tag2']),
        new WordEntry(userId1, ger, eng, 'die Einsamkeit', ['the loneliness', 'the solitude'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'regungslos', ['motionless', 'dead still'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'die Kerze', ['the candle'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'zu zweit', ['in pairs'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'der Fels', ['the rock', 'the cliff'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'kundtun', ['make known', 'proclaim'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'das Verlangen', ['the demand', 'the desire', 'the request'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'verderben', ['spoil', 'ruin', 'corrupt'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'wesentlich', ['significant', 'essential', 'crucial', 'fundamental'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'die Sünde', ['the sin'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'auswendig', ['by heart'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'der Schatz', ['the treasure', 'the sweetheart', 'the honey'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'anschauen', ['look at', 'watch', 'view'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'unbeteiligt', ['unconcerned', 'uninvolved', 'indifferent'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'beweisen', ['prove', 'demonstrate', 'show'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'leuchten', ['light', 'shine', 'glow'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'allerdings', ['however', 'certainly', 'admittedly', 'though'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'sich mit etwas begnügen', ['content oneself with something', 'make do with something'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'ungefähr', ['approximate', 'rough', 'nearly'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'bestätigen', ['confirm', 'acknowledge', 'verify'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'die Verachtung', ['the disdain', 'the disgust'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'zur selben Zeit', ['at the same time'], 2, ['main']),
        new WordEntry(userId1, ger, eng, 'das Gedicht', ['the poem', 'the ode'], 2, ['main']),

        new WordEntry(userId1, eng, ger, 'the boy', ['der Junge', 'der Knabe'], 4, ['main']),

        new WordEntry(userId2, rus, eng, 'собачка', ['the dog'], 6, ['main']),
        new WordEntry(userId2, rus, eng, 'кошечка', ['the cat'], 4, ['joetag']),
        new WordEntry(userId2, eng, rus, 'the bird', ['птичка'], 2, ['joetag']),
        new WordEntry(userId2, eng, ger, 'the cow', ['die Kuh'], 4, ['joetag']),
        new WordEntry(userId2, eng, ger, 'the horse', ['das Pferd'], 5, ['main'])
    ];
}

const languages = [
    "English",
    "German",
    "Russian"
];
const entries = initEntries(languages);

class UserEntry {
    constructor(username, password, isAdmin) {
        this.username = username;
        this.password = password;
        this.isAdmin = isAdmin;
    }
}

const users = [
    new UserEntry('Igorek', 'igorekpass', false),
    new UserEntry('Joe', 'joepass', false),
    new UserEntry('Master', 'master', true)
];


exports.users = users;
exports.languages = languages;
exports.entries = entries;
