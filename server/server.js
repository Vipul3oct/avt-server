// Api Using Node/Express    
var express = require('express');
var cors = require('cors');
var app = express();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('Database/Portfolio.db');
app.use(cors({origin: '*'}));
// var fs = require('fs');
var bodyParser = require('body-parser')

// var email   = require('emailjs/email')
// var nodemailer = require("nodemailer");

// var clientURL = 'http://localhost:4200/'
// var reviewProfilePath = 'reviewProfile/'

app.use(express.static('../client\portfolio/dist'));

app.use( bodyParser.json( 
{
    limit: '10mb'
}));       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true,
  limit: '1mb'
})); 

//authentication 
app.post('/api/authentication', function(req, res){
    let reqData = req.body
    console.log('login request recieved for user:',reqData.userName);
    
    db.all("SELECT * FROM tbl_AdminUser WHERE IsActive = 1 AND UserName = ? AND Password = ? ", reqData.userName, reqData.password, 
    function(err, row){
        if(err) {
            res.status(500);
            res.end('Error occuered while Login');
        }
        console.log(row)
        if(row.length > 0) {
            console.log('user available:')
            res.end('Success');
        } else {
            res.status(500);
            res.end('Failed');
        }
    });
});

//get profile detail
app.get('/api/getSelected/:id', function(req, res){
    console.log(req.params.id);
    db.all("SELECT * FROM tbl_ProfileList WHERE ReviewPending = 0 AND  ProfileId = ? ", req.params.id, function(err, row){
        console.log(row);
        res.json(row)
        // res.json([
		// { "id" : row.ProfileId ,
		//   "name" : row.Name	
		// }]);
    });
});

//get review Profile
app.get('/api/reviewProfile/:id', function(req, res){
    console.log(req.params.id);

    db.all("SELECT * FROM tbl_ProfileList WHERE ReviewPending = 1 AND  ProfileId = ? ", req.params.id, function(err, row){
        console.log(row);
        res.json(row)
    });
});

//approve Profile
app.get('/api/approveProfile/:id', function(req, res) {
    console.log('approve request received for Id:',req.params.id)
    db.all("SELECT * FROM tbl_ProfileList WHERE ProfileId = ? ", req.params.id, function(err, row){

        if(row.length > 0) {
            console.log('Profile found to approve')

            if(row[0].ReviewPending === 0) {
                console.log('Profile already approved, ProfileId:',row[0].ProfileId)
                res.status(500)
                res.end('Profile already approved')
            } else {
                db.run("UPDATE tbl_ProfileList SET ReviewPending = 0  WHERE ProfileId = ? ", req.params.id , function(err, row) {
                    if (err) {
                        console.log('error in profile approve:' + err);
                        res.status(500);
                    } else {
                        console.log('profile approved successfully');
                        res.end('profile approved successfully');
                    }})
                }
            } else {
            console.log('Profile not Available')
            res.end('Profile not Available')
        }
    })
})
//rejectProfile Profile
app.get('/api/rejectProfile/:id', function(req, res){
    console.log('reject request received for Id:',req.params.id)
    
    db.all("SELECT * FROM tbl_ProfileList WHERE ProfileId = ? ", req.params.id, function(err, row){
        if(row.length > 0) {
            console.log('Profile found to reject')
            // if(row[0].ReviewPending === 0) {
            //     console.log('Profile already approved, ProfileId:',row[0].ProfileId)
            //     res.status(500)
            //     res.end('Profile already approved')
            // } else {
            db.run("UPDATE tbl_ProfileList SET ReviewPending = 2 WHERE ProfileId = ?",req.params.id, function(err, row) {
                if (err) {
                    console.log('error in profile Reject:' + err);
                    res.status(500);
                } else {
                    console.log('profile Rejected successfully');
                    res.end('profile Rejected successfully');
                }})
                // }
            } else {
            console.log('Profile not Available')
            res.end('Profile not Available')
        }
    })
})

//get image
app.get('/api/getImage/:id', function(req, res){
    let reqData = JSON.parse(req.params.id)
    console.log('getImage for id:',reqData.id);
    let path = 'ProfilePics/' + reqData.id + '.png'

    if (fs.existsSync(path)) {
        fs.readFile(path, (err, data) => {
            if (err) {
                console.log('error in file read');
                res.status(500);
            } else {
                console.log('File read successfull for id:',req.params.id);
                res.writeHead(200, {'Content-Type': 'image/png'});
                res.end(data)
            }
        });
    }
    else{
        console.log('File does not exists. Returning dummy file for gender ', reqData.gender);
        let path = 'ProfilePics/dummy_' + reqData.gender.toLocaleLowerCase() + '.png'
        fs.readFile(path, (err, data) => {
            if (err) {
                console.log('error in file read');
                res.status(500);
            } else {
                console.log('File read successfull for id:',req.params.id);
                res.writeHead(200, {'Content-Type': 'image/png'});
                res.end(data)
            }
        });
    }

});

//review Pending profiles 
app.get('/api/getNSESymbols', function(req, res){
    db.all("SELECT SYMBOL as Symbol,NAME as Name, ISIN FROM StockInfo_NSE", function(err, row){
        console.log('NSE symbols fetched:' + row.length);
        res.json(row)
    });
});


//review Pending profiles 
app.get('/api/getUserWatchList/:userId', function(req, res){
    db.all("SELECT StockInfo_NSE.SYMBOL as Symbol, StockInfo_NSE.NAME as Name,StockInfo_NSE.ISIN as ISIN FROM UserWatchList INNER JOIN StockInfo_NSE ON UserWatchList.ISIN=StockInfo_NSE.ISIN WHERE UserWatchList.UserId=?",req.params.userId, function(err, row){
        console.log('watchlist items fetched for user:' + row.length);
        res.json(row)
    });
});

//add to user watch list 
app.post('/api/addToWatchList', function(req, res) {
    console.log('Request for adding stock to watchlist received');
    let reqData = req.body
    console.log( reqData)
    
    db.run("INSERT INTO UserWatchList ( UserId , ISIN ) VALUES (?,?)", 
    [reqData.UserId, reqData.ISIN], function(err, row){
        if (err) {
            console.log('error while inserting stock to watclist:' + err);
            res.status(500);
            res.end('Error occuered while adding stock to Watchlist');
        } else {
            console.log('Stock added succesfully to Watchlist' + err);
            db.all("SELECT StockInfo_NSE.SYMBOL as Symbol, StockInfo_NSE.NAME as Name,StockInfo_NSE.ISIN as ISIN FROM UserWatchList INNER JOIN StockInfo_NSE ON UserWatchList.ISIN=StockInfo_NSE.ISIN WHERE UserWatchList.UserId=?", reqData.UserId, function(err, row){
                // console.log('NSE symbols fetched:' + row.length);
                res.json(row)
            });
        }
    })
})

//remove from user watch list 
app.get('/api/removeFromWatchList/:id', function(req, res) {
    console.log('Request for removing stock from watchlist received');
    let reqData = JSON.parse(req.params.id)
    console.log( reqData)
    
    db.run("DELETE From UserWatchList WHERE UserId = ? AND ISIN = ?", 
    reqData.UserId, reqData.ISIN, function(err, row){
        if (err) {
            console.log('Error while deleting stock from watclist:' + err);
            res.status(500);
            res.end('Error while deleting stock from watclist');
        } else {
            console.log('Stock deleted succesfully from Watchlist' + err);
            db.all("SELECT StockInfo_NSE.SYMBOL as Symbol, StockInfo_NSE.NAME as Name,StockInfo_NSE.ISIN as ISIN FROM UserWatchList INNER JOIN StockInfo_NSE ON UserWatchList.ISIN=StockInfo_NSE.ISIN WHERE UserWatchList.UserId=?", reqData.UserId, function(err, row){
                // console.log('NSE symbols fetched:' + row.length);
                res.json(row)
            });
        }
    })
})

//add profile
app.post("/api/addProfile", function(req , res){
                let reqData = req.body
                // console.log(reqData);
                console.log('name:' + reqData.Name)
                if(reqData !== undefined) { 
                    db.all("SELECT * FROM tbl_ProfileList Where Name = ? AND MobileNumber = ? AND ReviewPending = 0 ",reqData.Name,reqData.MobileNumber, function(err, row){
                        console.log(row);
                        // res.json(row)

                        if(row.length > 0) {
                            console.log('Duplicate record found:' + err);
                            res.status(500);
                            res.end('Duplicate Record found');
                        } else {
                            db.run("INSERT INTO tbl_ProfileList ( Name , Surname , MobileNumber , Age , Gender , IsManglik , Profession , Education , Address , FatherName , Height, Weight, ReviewPending, DateTimeOfBirth, EmailId, PlaceOfBirth) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, ?, ?, ?)", 
                            [reqData.Name,reqData.Surname,reqData.MobileNumber,reqData.Age,reqData.Gender,reqData.IsManglik,
                            reqData.Profession,reqData.Education,reqData.Address,reqData.FatherName, reqData.Height,reqData.Weight,1,reqData.DateTimeOfBirth, reqData.EmailId, reqData.PlaceOfBirth], function(err, row){
                            if (err){
                                    console.log('error in registration:' + err);
                                    res.status(500);
                                }
                                else {
                                    try {
                                        console.log('db.lastInsertRowId', db.lastInsertRowId)
                                        db.all("select MAX(ProfileId) as id from  tbl_ProfileList", function(err, row){
                                        // res.json(row)
                                        // last_insert_rowid()
                                        console.log('row:',row)
                                        let path = 'ProfilePics/' + row[0].id + '.png'
                                        console.log('path',path)
                                        const imgdata = reqData.fileURL;   
                                        const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');
                                        fs.writeFile(path, base64Data, 'base64', (err) => {
                                            console.log(err);
                                        });
                                        
                                        console.log('profile registerd successfully');

                                        let reviewProfileURL = clientURL + reviewProfilePath + row[0].id  
                                        
                                        console.log('reviewProfileURL:', reviewProfileURL)

                                        var smtpTransport = nodemailer.createTransport({
                                            service: "Gmail",
                                            tls: { rejectUnauthorized: false },
                                            auth: {
                                                user: "avtmiraroadsamiti@gmail.com",
                                                pass: "9892646410"
                                            }
                                        });

                                        var mailOptions={
                                            from: "avtmiraroadsamiti@gmail.com",
                                            to : "vipul3oct@gmail.com",
                                            subject : "New profile registration received",
                                            // text : "test mail",
                                            html: '<h3> New registration request is received </h3> '+
                                                  '<h3> Please click on below link to check review and approve </h3> <br/>' +
                                                  '<a href='+ reviewProfileURL + '>Review Profile</a>'
                                         }

                                         smtpTransport.sendMail(mailOptions, function(error, response){
                                            if(error){
                                                console.log('Error in sending mail:' + error);
                                                res.end("Error while sending mail");
                                            } else {
                                                console.log("Message sent: " + response.message);
                                                res.end("Mail sent successfully");
                                            }
                                        });
                                    });
                                    } catch(error) {
                                        console.log('error in saving pic:' + error);
                                        res.status(500);
                                    } 
                                }
                                res.end();
                            });
                        }
                    });
                } else {
                console.log('Request is undefined');
                res.status(500);
            }
});

app.listen(process.env.PORT || 8000);
console.log('Server is running on Port 8000')

