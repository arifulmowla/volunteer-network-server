const express = require("express");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const cors = require("cors");
require("dotenv").config();

const app = express();
var admin = require("firebase-admin");

app.use(cors());
app.use(bodyParser.json());

// firebase admin

var serviceAccount = require("./config/volunteer-network-frontend-firebase-adminsdk-o0fcd-7be4ca008c.json");
const { ObjectId } = require("mongodb");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://volunteer-network-frontend.firebaseio.com",
});

// Mongodb client area
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l97ey.mongodb.net/dbVolunteer?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const db = client.db("dbVolunteer");
  const serviceCollection = db.collection("services");
  const registerCollection = db.collection("registerEvent");

  // get all services
  app.get("/api/get-services", (req, res) => {
    serviceCollection.find({}).toArray((arr, document) => {
      res.status(200).send(document);
    });
  });

  // volunteer register add
  app.post("/api/register", (req, res) => {
    const body = req.body;

    // verify id token
    admin
      .auth()
      .verifyIdToken(body.token)
      .then(function (decodedToken) {
        let uid = decodedToken.uid;
        delete body.token;
        registerCollection
          .insertOne({ uid, ...body })
          .then((result) => res.status(200).send("inserted Data " + result))
          .catch((error) => res.status(401).send("Error " + error));
      })
      .catch(function (error) {
        // Handle error
        res.status(401).send("Error " + error);
        console.log(error);
      });
  });

  // get selected services
  app.post("/api/selected-service", (req, res) => {
    const auth = req.body.token;
    // verify id token
    admin
      .auth()
      .verifyIdToken(auth)
      .then(function (decodedToken) {
        let uid = decodedToken.uid;
        console.log(uid);
        registerCollection.find({ uid }).toArray((arr, document) => {
          console.log(document);
          res.status(200).send(document);
        });
      })
      .catch(function (error) {
        // Handle error
        console.log(error);
        res.status(401).send("Error " + error);
      });
  });

  // cencel a service
  app.post("/api/cancel-service", (req, res) => {
    const { serviceId, token } = req.body;

    admin
      .auth()
      .verifyIdToken(token)
      .then(function (decodedToken) {
        let uid = decodedToken.uid;
        // console.log(uid);
        registerCollection
          .deleteOne({
            _id: ObjectId(serviceId),
          })
          .then(function (result) {
            console.log(result);
          })
          .catch((err) => console.log("error", err));
      })
      .catch(function (error) {
        // Handle error
        console.log(error);
        res.status(401).send("Error " + error);
      });
  });

  // get volunteers list
  app.get("/api/volunteers", (req, res) => {
    registerCollection.find({}).toArray((arr, document) => {
      res.status(200).send(document);
    });
  });


  // delete single volunteers list
  app.post("/api/delete-entry", (req, res) => {
    const serviceId = req.body.id;

    console.log(req.body.id);
    registerCollection
      .deleteOne({
        _id: ObjectId(serviceId),
      })
      .then(function (result) {
        console.log(result);
        res.status(200).send(result);
      })
      .catch((err) => res.status(500).send(err));
  });

  app.get("/", (req, res) => {
    res.send("working");
  });
});

const port = 5000;
app.listen(process.env.PORT || port, () =>
  console.log(`Server is open in port: ${port}`)
);
