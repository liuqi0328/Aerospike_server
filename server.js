'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const Aerospike = require('aerospike');

const PORT = process.env.PORT || 8000;

let app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

moment.tz.setDefault('America/New_York');

let config = {
    hosts: '172.28.128.3:3000',
};

let asClient = Aerospike.client({
    hosts: [{ addr: '172.28.128.3', port: 3000 }],
});

let policy = new Aerospike.WritePolicy({
    exists: Aerospike.policy.exists.CREATE_OR_REPLACE,
    key: Aerospike.policy.key.SEND,
});
let meta = { ttl: -1 };

asClient.connect((error) => {
    if (error) {
        // handle failure
        console.log('Connection to Aerospike cluster failed!');
    } else {
        // handle success
        console.log('Connection to Aerospike cluster succeeded!');
    }
});

app.route('/')
    .get((req, res) => {
        let messages = [];
        let query = asClient.query('voice', 'action');
        console.log(query);

        let stream = query.foreach();
        stream.on('data', function(record) {
            // process record
            console.log('records: ', record);
            messages.push(record);
        });
        stream.on('error', function(error) {
            // handle error
            console.log('error: ', error.message);
            res.sendStatus(500);
        });
        stream.on('end', function() {
            // signal the end of query result
            console.log('end!');
            res.send(messages);
        });
    })
    .post((req, res) => {
        // let id = req.params.id;
        let key = new Aerospike.Key('voice', 'action', 'abc222');
        console.log(key);
        let bins = {
            id: 'test222',
            data: 'test111222',
        };
        asClient.put(key, bins, meta, policy)
            .then(() => {
                console.log('updated');
                res.sendStatus(200);
            })
            .catch((err) => {
                console.log('error: ', err.message);
                res.sendStatus(500);
            });
    });


app.listen(PORT);
console.log(`Server started on: ${PORT}`);

