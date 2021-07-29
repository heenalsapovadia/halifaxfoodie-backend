const path = require('path');
const express = require('express');
const app = express();

const { Storage } = require('@google-cloud/storage');

const fs = require('fs');

const storage = new Storage();

// bucket that stores uploaded file and triggers the cloud function
const bucket1 = 'heenalbuckettest';
// bucket that stores the predicted data from cloud function
const bucket2 = 'output-prediction-heenal';

//parse the body
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// Use Routes
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With,X-Auth-Token, Content-Type, Accept'
  );
  next();
});

app.post('/uploadrecipe', (req, res) => {
  console.log(req.body.text);
  // console.log(req.body.formData);

  // data should hold data from the uploaded file
  var data = req.body.text; //'cheese pizza - dough, mozarella';
  var fileName = 'recipe.txt'; // filename of the uploaded file.txt

  fs.writeFileSync(fileName, data);

  const bucket = storage.bucket(bucket1);

  // fetch the output from bucket2
  const fileGCP = storage.bucket(bucket2).file(fileName);
  let fileData;

  //func to download output file from bucket2
  const bucketDownload = async () => {
    await fileGCP.download().then((data, err) => {
      if (err) console.log('File download error : ' + err);
      else {
        console.log('FILE FOUND ON B2 : ' + data);
        // return contents as response
        res.json({ output: data.toString() });

        fileGCP.delete().then((data, err) => {
          if (err) console.log('delete err : ', err);
          else {
            console.log('FILE deleted : ', data);
          }
        });
      }
    });
  };

  const asyncu = async () => {
    let flag = true;
    while (flag) {
      console.log('inside while');
      console.log('sleeping...');
      sleep(5000);
      await fileGCP.exists().then(function (data) {
        console.log('inside then');
        const exists = data[0];
        console.log('EXISTS ?? ', exists);
        if (exists) {
          bucketDownload();
          flag = false;
        }
      });
    }
  };

  bucket.upload(fileName, (err, data) => {
    if (err) console.log(err);
    else {
      console.log('File uploaded : ', data);
      asyncu();
    }
  });
});

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
