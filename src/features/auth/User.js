const express = require('express');
const router = express.Router();
const User = require('./auth.model');
const bcryptjs = require('bcryptjs');
const { protect } = require('./auth.middleware');
const jwt = require('jsonwebtoken');

router.get('/', protect, async(req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json({
            success: true,
            user: user
        });
    } catch(error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            msg: 'Server Error'
        });
    }
});

router.post('/register', async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
        let user_exist = await User.findOne({ email: email });

        if(user_exist) {
            return res.status(400).json({
                success: false,
                msg: 'User already exists'
            });
        }
        
        let user = new User();

        user.username = username;
        user.email = email;

        const salt = await bcryptjs.genSalt(10);
        user.password = await bcryptjs.hash(password, salt);

        let size = 200;
        user.avatar = "https://gravatar.com/avatar/?s="+size+'&d=retro';

        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '90d'
        }, (err, token) => {
            if(err) throw err;
            
            res.status(200).json({
                success: true,
                token: token
            });
        });

    } catch(err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Something error occurred'
        });
    }
});

router.post('/login', async(req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        let user = await User.findOne({
            email: email
        });

        if(!user) {
            return res.status(400).json({
                success: false,
                msg: 'User not exists go & register to continue.'
            });
        }

        const isMatch = await bcryptjs.compare(password, user.password);

        if(!isMatch) {
            return res.status(400).json({
                success: false,
                msg: 'Invalid password'
            });
        }

        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload, process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '90d'
            }, (err, token) => {
                if(err) throw err;

                res.status(200).json({
                    success: true,
                    msg: 'User logged in',
                    token: token,
                    user: user
                });
            }
        );

    } catch(error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            msg: 'Server Error'
        });
    }
});

module.exports = router;