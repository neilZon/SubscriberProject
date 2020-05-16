//=====================  index.js  ======================

const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const validator = require('validator');
const { check, validationResult } = require('express-validator');

var router = express.Router();

// user model
let User = require('../models/Users.models');

//landing page
router.get('/', (req, res) => {
    // console.log(req.sessionID)
    res.send("voucher landing page");
});


//----------------- register page ----------------------
router.get('/register', (req, res) => {
    res.render('registration');
});

// registration request
router.post('/register',[
        // check for and validate required inputs
        check('username', 'Username is required').notEmpty(),
        check('email', 'Email required').notEmpty(),
        check('email', 'Invalid email').isEmail().custom((value, {req}) => validator.isEmail(req.body.email)),
        check('password', 'Password is required').notEmpty(),
        check('confirmPassword', 'Passwords do not match').notEmpty().custom((value, { req }) => value === req.body.password),
        check('firstname', 'Firstname is required').notEmpty(),
        check('lastname', 'Lastname is required').notEmpty()
    ], (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;

    let errors = validationResult(req);
    
    // see if any errors were raised
    if(!errors.isEmpty()){
        return res.status(422).json(errors.array());
    } else {
        let newUser = new User({
            username:username,
            password:password,
            email:email,
            firstname:firstname,
            lastname:lastname
        });
        
        // hash password with salt
        bcrypt.genSalt(15, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
                if(err){
                    console.log(err);
                }
                newUser.password = hash;
                
                // save password to MongoDB
                newUser.save((err) => {
                    if(err){
                        // check for duplicate username or password
                        if(err.name === 'MongoError' && err.code === 11000){
                            let duplicatedField = (Object.keys(err.keyValue));
                            res.status(409);
                            res.send({msg:duplicatedField + " already exists" , keyValue:err.keyValue});
                        }

                    } else {
                        req.flash('success', 'You are now registered');
                        res.redirect('/login');
                    }
                })
            });
        })
    }
});

//----------------------- login page -----------------------------
router.get('/login', (req, res) => {
    res.render('login');
});

// authentication
router.post('/login', (req, res, next) => {
    passport.authenticate('local', { 
        successRedirect:'/',
        failureRedirect:'/login',
        failureFlash: true
    }, 
    function(){
        console.log('authentication successful');
        res.send("authentication success");
    })(req,res,next);
});

module.exports = router; 