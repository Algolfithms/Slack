'use strict';
module.getDatabase = function(connectionURL){
    return function(text, input = null){
        const Pool = require("pg");
        pool = new Pool({connectionString: connectionURL})
        const client = pool.connect();
        var result;
        var resultSetter = (err, res) => {
            if(err){
                console.log(err.stack);
                client.end();
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
        client.end();
        return result;
    };
}
