/* ENDPOINTS:
    getPublicRoutines
        returns the list public routines (return name, imageData, description)
    getRoutinePosts (sockets)
        returns all the posts associated with that routine (within each post: name, pic, description)
    createPost
        creates a post given a uid


*/
const cron = require("node-cron")

const AWS = require('aws-sdk');
const fs = require('fs');
const fileType = require('file-type');
const bluebird = require('bluebird');
const multiparty = require('multiparty');

AWS.config.setPromisesDependency(bluebird);
const s3 = new AWS.S3();


const express = require('express');
//express is being used for FrontEndServer
const socketio = require('socket.io');
const http = require('http');
const https = require('https');
const router = require('./router');
const mongo = require('./mongoFunctions/helper')

const app = express();
//const server = http.createServer(app);
const server = https.createServer({
    key: fs.readFileSync('private.key'),
    cert: fs.readFileSync('habitual_live.crt'),
    passphrase: 'habit'
}, app)

require('dotenv').config();

const io = socketio(server);

async function main() {
    await mongo.connectToMongo();
    //mongo.markCompletion('123', '456')
}

main().catch(console.error);


const PORT = process.env.PORT || 9000;
console.log("RUNNING ON PORT", PORT)

let rooms = {}
class User {
    constructor(name) {
        this.name = name;
    }
};

class Room {
    constructor() {
        this.users = []
    }
};
io.on('connection', function (socket) {
    let members;

    socket.on('join', function ({ roomID, name }) {
        socket.join(roomID);
        console.log(`${name} has joined ${roomID}`)
        mongo.getRoomMessages(roomID, (result) => {
            mongo.getNumCompletions(roomID, (completions)=> {
                io.in(roomID).emit('first-connection', { messages:  result , numPeople: io.sockets.adapter.rooms[roomID], completions: completions});
            })
                // io.in(roomID).emit('first-connection', { messages:  result , numPeople: io.sockets.adapter.rooms[roomID]});
        })
        //mongo.getRoutineCompletions ->
    }
    )


    socket.on('markCompletion', function ({ uid, routine_ID, name, task }) {
        console.log(`${name} has completed ${task}`)
        mongo.markCompletion(uid, routine_ID, (response) => {
            if(response !== 'ERROR'){
                mongo.sendMessageToRoom(uid, routine_ID, task, (result) => {
                    console.log(`sending messages to ${name}`)
                    mongo.getRoomMessages(routine_ID, (result) => {
                        mongo.getNumCompletions(routine_ID, (completions)=>{
                            io.in(routine_ID).emit('people_routine_completion', { messages:  result, completions: completions });
                        })

                    })
                    console.log(result)
                })
            // io.in(routine_ID).emit('people_routine_completion', {messages: `${name} has completed ${task}`})
            }
            else{
                socket.emit({message: 'The Routine has already been completed'}) //NEED A CALLBACK ERROR in HELPER
            }
        })
    })
    socket.on('forceDisconnect', function(roomID){
        console.log("disconnecting")
        io.in(roomID).emit('active_people', {numPeople: io.sockets.adapter.rooms[roomID] });
        //NEED TO ADD TO CLIENT SIDE
        socket.disconnect();
    });
})
app.get('/', function(req,res) {
    console.log('hello');
    res.send('hello');
});

app.get("/getUsers", function (req, res) {

    // list of methods that are supported by the server
    res.header('Access-Control-Allow-Methods', 'GET');
    //console.log("here")
    //add the ret from db here
    res.send("testwdwq")
})
app.get("/createUser", function (req, res) {//admin supported
    res.header('Access-Control-Allow-Credentials', true);

    // origin can not be '*' when crendentials are enabled. so need to set it to the request origin
    res.header('Access-Control-Allow-Origin', req.headers.origin);

    // list of methods that are supported by the server
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');

    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');
    // console.log(req.data)
    mongo.createUserDoc(req.query.uid, req.query.email, req.query.displayName).then(result => {
        console.log(result)
        res.send(result);
    });
})
app.get("/createRoutine", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');
    let result;
    //console.log('recieved request');
    const response = mongo.createRoutine(req.query.uid, req.query.title, req.query.description, req.query.public, req.query.picturekey, (recordID) => {
        //console.log(recordID)
        res.send(recordID);
    })

})
app.get("/createRoutineWithBots", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');
    let result;
    //console.log('recieved request');
    const response = mongo.createRoutineWithBots(req.query.uid, req.query.title, req.query.description, req.query.public, req.query.picturekey, req.query.bots, (recordID) => {
        //console.log(recordID)
        res.send(recordID);
    })

})
app.get("/getPublicRoutines", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');
    let result;
    const response = mongo.getPublicRoutines(req.query.pageNumber, req.query.pageLimit, (routineArray) => {
        //console.log(routineArray)
        res.send(routineArray);
    })

})
app.get("/getPublicRoutinesData", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');
    let result;
    const response = mongo.getPublicRoutinesData(req.query.pageNumber, req.query.pageLimit, (executionStats) => {
        //console.log(routineArray)
        res.send(executionStats);
    })
})
app.get("/getUserRoutines", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');
    let result;
    const response = mongo.getUserRoutines(req.query.uid, (result) => {
        //console.log(result)
        res.send(result);
    })

})
app.get("/joinRoutine", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    const response = mongo.joinRoutine(req.query.uid, req.query.routineid, (result) => {
        //console.log(result)
        res.send(result);
    })

})
app.get("/leaveRoutine", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    const response = mongo.leaveRoutine(req.query.uid, req.query.routineid, (result) => {
        //console.log(result)
        res.send(result);
    })

})
app.post('/uploadImg', (req, res) => {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');


    const form = new multiparty.Form();
    form.parse(req, async (error, fields, files) => {
        if (error) throw new Error(error);
        try {
            const path = files.file[0].path;
            const buffer = fs.readFileSync(path);
            const type = await fileType.fromBuffer(buffer);
            const timestamp = Date.now().toString();
            const fileName = `bucketFolder/${timestamp}-lg`;
            const data = await uploadFile(buffer, fileName, type);
            return res.status(200).send(data);
        } catch (error) {
            console.log(error)
            return res.status(400).send(error);
        }
    });
    console.log("upload image called");
});
app.get("/createPost", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    const response = mongo.createPost(req.query.uid, req.query.title, req.query.content, req.query.parentRoutine, (result) => {
        //console.log(result)
        res.send(result);
    })

})
app.get("/checkCompletion", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    const response = mongo.checkCompletion(req.query.uid, req.query.routineid, (result) => {
        //console.log(result)
        res.send({ data: result });
    })
})
app.get("/getPosts", (req, res) => {//admin supported
    //takes routineID
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    const response = mongo.getPosts(req.query.parentRoutine, (result) => {
        //console.log(result)
        res.send(result);
    })

})
app.get("/getPhoto", (req, res) => {

    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    let s3 = new AWS.S3();
    async function getImage() {
        const data = s3.getObject(
            {
                Bucket: 'habitapp-photos',
                Key: req.query.key
            }

        ).promise();
        return data;
    }
    getImage()
        .then((img) => {
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.write(img.Body, 'binary');
            res.end(null, 'binary');
        }).catch((e) => {
            res.send(e)
        })
    console.log("get photo called")
})

//app.get("setProfilerLevel", (req, res)=>)
const uploadFile = (buffer, name, type) => {
    const params = {
        ACL: 'public-read-write',
        Body: buffer,
        Bucket: 'habitapp-photos',
        ContentType: type.mime,
        Key: `${name}.${type.ext}`
    };
    return s3.upload(params).promise();
};
//IGNORE THIS ONE RIGHT HERE V
app.get("/createRoom", (req, res) => {

    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');
    try {
        var request = require("request");
        var dataString = '{"name": "Rishis_room", "privacy": "private", "properties" : { "start_audio_off":true, "start_video_off":true}}';
        var options = {
            method: 'POST',
            url: 'https://api.daily.co/v1/rooms',
            headers: {
                'content-type': 'application/json',
                authorization: 'Bearer d4964dd7795730e98cb9fa93230557ebf19f04aaca506c87f586b074128fdc09',

            },
            body: dataString
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            console.log(body);
            res.send(body)
        });


    }
    catch (err) {
        console.log(err)
    }

})
app.get("/searchRoutines", (req, res) => {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    const response = mongo.searchRoutines(req.query.keywords, req.query.pageNumber, req.query.pageLimit, (result) => {
        //console.log(result)
        res.send({ data: result });
    })
})

app.get("/searchPosts", (req, res) => {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    const response = mongo.seachPosts(req.query.keywords, req.query.pageNumber, req.query.pageLimit, (result) => {
        //console.log(result)
        res.send({ data: result });
    })
})

app.get("/searchUsers", (req, res) => {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    const response = mongo.searchUsers(req.query.keywords, req.query.pageNumber, req.query.pageLimit, (result) => {
        //console.log(result)
        res.send({ data: result });
    })
})
app.use(router);

app.get("/getComments", (req, res) => {//admin supported
    //takes routineID
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    const response = mongo.getComments(req.query.parentPost, (result) => {
        //console.log(result)
        res.send(result);
    })

})
app.get("/createComment", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    const response = mongo.createComment(req.query.uid, req.query.content, req.query.parentPost, (result) => {
        //console.log(result)
        res.send(result);
    })

})
app.get("/sendMessageToRoom", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    const response = mongo.sendMessageToRoom(req.query.uid, req.query.roomid, req.query.message, (result) => {
        //console.log(result)
        res.send(result);
    })

})
app.get("/getRoomMessages", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    const response = mongo.getRoomMessages(req.query.roomid, (result) => {
        //console.log(result)
        res.send(result);
    })

})
app.get("/checkJoinStatus", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    const response = mongo.checkJoinStatus(req.query.uid, req.query.routineid, (result) => {
        //console.log(result)
        if(result == "user not found"){
            res.status(400);
        }
        res.send(result)
    })

})
app.get("/getNumCompletions", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');

    const response = mongo.getNumCompletions(req.query.routineid, (result) => {
        //console.log(result)
        res.send({numCompletions:result})
    })

})
app.get("/getDisplayName", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');
    console.log(req.query.uid);
    const response = mongo.getDisplayName(req.query.uid, (result) => {
        //console.log(result)
        res.send({displayName:result})
    })

})
app.get("/completeTest", (req, res) => {//admin supported
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');
    console.log(req.query.uid);
    const response = mongo.completeTest(req.query.uid, (result) => {
        //console.log(result)
        res.send({testResult:result})
    })

})
app.get("/getGraphData", (req, res) => {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-XSRF-TOKEN');
    mongo.getGraphData(req.query.uid, (result) => {
        res.send(result)
    })
})


cron.schedule("0 0 * * *", function() {
    console.log("clearing Completion Mappings & Live Feeds")
    mongo.clearCompletionMapping()
    mongo.clearLiveFeed()

}) 

server.listen(PORT, () => console.log(`Server has started`));
