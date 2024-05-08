const mongoClient = require('mongodb').MongoClient;
let state = { db: null };

module.exports.connect = async function(done) {
    const url = "mongodb://localhost:27017/";
    const dbname = "ShoppingCart";

    mongoClient.connect(url)
    .then((client) => {
        console.log('successfully...')
        state.db=client.db(dbname)
        done()
    })
    .catch((err) => {
        console.log('Failed...', err)
        return done(err)
    })
};

module.exports.get = function() {
    console.log("State.db: " + state.db);
    return state.db;
};


