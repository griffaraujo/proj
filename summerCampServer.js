const fs = require("fs");
const path = require("path");
const express = require("express");
const { urlencoded } = require("body-parser");
const app = express(); 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));
app.use(urlencoded({extended : true}));
process.stdin.setEncoding("utf8");
require("dotenv").config({ path: path.resolve(__dirname, '.env') })  
const portNumber = process.argv[2];
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://garaujo:Chapatis1022@cluster0.7uk1vgy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const databaseAndCollection = {db: "SummerCampDB", collection:"summerCampCollection"};

process.stdout.write(`Web server started and running at http://localhost:${portNumber}\n`);
    const prompt = "Type itemList or stop to shutdown the server: ";
    process.stdout.write(prompt);
    process.stdin.on('readable', () => {  
        let dataInput = process.stdin.read();
        if (dataInput !== null) {
            let command = dataInput.trim();
            if (command === "stop") {
                console.log("Shutting down the server");
                process.exit(0);
            }else{
                console.log(`Invalid command: ${command}`);
            }
            process.stdout.write(prompt);
            process.stdin.resume();
        }
    });


async function insertStudent(client, databaseAndCollection, newStudent) {
    await client.connect();
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newStudent);
    await client.close();
}

app.get("/", (request, response) => { 
    response.render("index.ejs");
});
app.get("/apply", (request, response) => { 
    response.render("application.ejs"); 
});
app.post("/apply", (request, response) => { 
    const variables = {
        name: request.body.name,
        email: request.body.email,
        gpa: parseFloat(request.body.gpa),
        backgroundInformation: request.body.backgroundInformation
    }
    insertStudent(client, databaseAndCollection, variables);
    response.render("processApplication.ejs", variables);
});
app.get("/reviewApplication", (request, response) => { 
    response.render("reviewApplication.ejs");
});
app.post("/reviewApplication", async (request, response) => {

    await client.connect()
    let filter = {email: request.body.email};
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);
    await client.close();
    variables = {
        name: result.name,
        email: result.email,
        gpa: parseFloat(result.gpa),
        backgroundInformation: result.backgroundInformation
    }
    response.render("processApplication.ejs", variables);
});
app.get("/adminGFA", (request, response) => { 
    response.render("adminGFA.ejs"); 
});
app.post("/adminGFA", async (request, response) => { 
    await client.connect();

    let filter = {gpa : { $gte: parseFloat(request.body.GPAInput)}};
    const cursor = client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);
    const result = await cursor.toArray();
    let table = "<table border=\"1\"><tr><th>Name</th><th>GPA</th></tr>";
    result.forEach(student => {
        table += `<tr><td>${student.name}</td><td>${student.gpa}</td></tr>`;
    });
    table += "</table>";
    await client.close();
    variables = {table: table}
    response.render("processAdminGFA.ejs", variables);
});
app.get("/adminRemove", (request, response) => { 
    response.render("adminRemove.ejs"); 
});
app.post("/adminRemove", async (request, response) => { 

    await client.connect();
    const result = await client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .deleteMany({});
    const removed = result.deletedCount;
    variables = {pplRemoved : removed};
    response.render("processAdminRemove.ejs", variables);
});
app.listen(portNumber);