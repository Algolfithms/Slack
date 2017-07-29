'use strict';
class Database{

    /**
     * Makes a database object
     */
    this(connectionURL){
        const Pool = require("pg");
        this.pool = new Pool({connectionString: connectionURL})
    }

    /**
     * Queries the database with the given text
     * if an input is given, it does a clean query
     * Returns the output of the query
     */
    query(text, input = null){
        const client = await this.pool.connect();
        var result;
        var resultSetter = (err, res) => {
            if(err){
                console.log(err.stack);
                await client.end();
                throw err.stack;
            }else{
                result = res;
            }
        };
        if(input == null){
            client.query(text, resultSetter);
        }else{
            client.query(text, input, resultSetter);
        }
        await client.end();
        return result;
    }

}

module.exports = Database;
