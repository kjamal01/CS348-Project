//connect to db
const { promisify } = require('util');
const mysql = require("mysql"); 
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB

})

exports.register = async (req, res) => {
    console.log(req.body);
    const name = req.body.name;
    const username = req.body.username;
    const password = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;

    //QUERY INTO DB
    // ? represents the username we're looking for, username comes from the form
    db.query(`SELECT username FROM user WHERE username = ?`, [username], async (error, result) => {
        if(error) {
            console.log(error)
        } else {
            if (result.length > 0) {
                return res.render('register', {
                    message: 'username already exists'
                }); //dont register user, take back to register page with message

            } else if (passwordConfirm != password) {
                return res.render('register', {
                    message: 'passwords dont match'
                }); //dont register user, take back to register page with message
            }
        }

        let hashpass = await bcryptjs.hash(password, 5);
        console.log(hashpass);

        db.query('INSERT INTO user SET ?', {name: name, username: username, password:hashpass}, (error, result) => {
            if (error) {
                console.log('error');
            } else {
                console.log(result)
                return res.render('register', {
                    message: 'user successfully registered'
                });

            }
        })
    })
}


exports.signin = async (req, res) => {

    try {
        const username = req.body.username;
        const password = req.body.password;

        if (!(username && password)) {
            return res.status(400).render('signin', {
                message: 'must provide both username and password'

            })
        } else {
            db.query(`SELECT * FROM user WHERE username = ?`, [username], async (error, result) => {
                if (!result || result.length == 0) {
                    return res.status(401).render('signin', {
                        message: 'invalid username or password'
                    });
                } else {
                    if (!(await bcryptjs.compare(password, result[0].password))) {
                        return res.status(401).render('signin', {
                            message: 'invalid username or password'
                        });
                    } else {
                        const id = result[0].id;
                        //create secret token and password for user
                        const jwttoken = jwt.sign({id:id}, process.env.JWT, {
                            expiresIn: process.env.JWT_EXPIRE
                        });

                        //create cookie with token
                        const fromnow = Date.now();
                        const cookie = {
                            expires: new Date(
                                fromnow + (((process.env.JWT_COOKIE_EXPIRE * 24)*60)*60)

                            ),
                            httpOnly: true
                        }
                        res.cookie("jwt", jwttoken, cookie);
                        res.status(200).redirect("/");
                    } 
                }
            })
        }

    } catch (error) {
        console.log(error);

    }
}

exports.signedIn = async (req, res, then) => {
    //console.log(req.cookies.jwt);
    if (req.cookies.jwt) {
        try {
            //check token, get user.id
            const token = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT);
            console.log(token);

            //make sure user still exists
            db.query(`SELECT * FROM user WHERE id = ?`, [token.id], (error, result) => {
                console.log(result);
                if (!result) {
                    return then();
                }

                req.user = result[0];
                return then();
            });

        } catch (error) {
            console.log(error);  
            return then();

        }

    } else {
        then();
    }
}

exports.signout = async(req, res) => {
    try {
        const now = new Date(Date.now() + 2*1000);
        //new cookie to overwrite the user's
        res.cookie("jwt",  jwt.sign({}, process.env.JWT, {expiresIn: Date.now()}), {
            expires: now,
            httpOnly: true
        });
    
        res.status(200).redirect("/");

    } catch (error) {
        console.log(error); 
    }
}

exports.listBooks = async(req, res, then) => {
    //console.log(res.body);

    if (req.cookies.jwt) {
        try {
            //check token, get user.id
            const token = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT);
            console.log(token);

            //make sure user still exists
            db.query(`SELECT * FROM user WHERE id = ?`, [token.id], (error, result) => {
                console.log(result);
                if (!result) {
                    return then();
                }
                req.user = result[0];

                db.query(`SELECT * FROM Books`, async (error, result) => {
                    if(error) {
                        console.log(error)
                    } else {
                        console.log(result);
                        result.shift();// Removes first element(skip 0 index just the column names)
                        return res.status(200).render('listBooks', {
                            books: result
                        });
                        // return res.render('books', {
                        //     message: 'listed books'
                        // });
            
                    }
                    then();
                })



            });

        } catch (error) {
            console.log(error);  
            return;

        }

    } else {
        then();
    }
}

//Same command as listBooks, but query instead performs a search
//Search String stored in req.params.text
exports.listBooksSearch = async(req, res, then) => {
    if (req.cookies.jwt) {
        try {
            //check token, get user.id
            const token = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT);
            console.log(token);

            //make sure user still exists
            db.query(`SELECT * FROM user WHERE id = ?`, [token.id], (error, result) => {
                console.log(result);
                if (!result) {
                    return then();
                }
                req.user = result[0];

                db.query(`SELECT * FROM Books WHERE Title like '%${req.params.text}%' 
                            OR Author like '%${req.params.text}%' 
                            OR Genre like '%${req.params.text}%' 
                            OR Publisher like '%${req.params.text}%' 
                            OR ID like '%${req.params.text}%' 
                            OR PublishDate like '%${req.params.text}%' 
                            OR Description like '%${req.params.text}%'`, 
                            async (error, result) => {
                    if(error) {
                        console.log(error)
                    } else {
                        console.log(result);
                        return res.status(200).render('listBooks', {
                            books: result
                        });
                    }
                    then();
                })
            });

        } catch (error) {
            console.log(error);  
            return;

        }

    } else {
        then();
    }
}

// Favourite Book
// book title needs to passed
exports.favBooks = async(favTitle, req, res) => {
    db.query('UPDATE User SET favBook = ?', [favTitle],(error, result) => {
        if(error){
            console.log(error);
        } else {
            console.log(result);
        }
    });
}

// Delete
// userID passed from routes.js
exports.deleteAccount = async(userID, req, res) => {
    db.query('DELETE FROM user WHERE id = ?', [userID],(error, result) => {
        if(error){
            console.log(error);
        } else {
            console.log(result);
        }
    });
}
