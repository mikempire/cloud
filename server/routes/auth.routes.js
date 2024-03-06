const Router = require('express');
const User = require('../models/User');
const {check, validationResult} = require('express-validator');
const router = new Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const authCheck = require("../utils/authCheck");
const fileService = require('../services/fileServices');
const File = require('../models/File');



router.post('/registration',
    [
        check('email', 'Incorrect email').isEmail(),
        check('password', 'Password must be longer that 3 and shorter what 12').isLength({min: 3, max: 12}),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            console.log(req.body);
            if (!errors.isEmpty()) {
                return res.status(400).json({message: 'Incorrect request', errors });
            }
            const {email, password} = req.body;

            const candidate = await User.findOne({email});

            if (candidate) {
                return res.status(400).json({message: `User with email ${email} already exist!`});
            }
            const hashPassword = await bcrypt.hash(password, 8);
            const user = new User({email, password: hashPassword});
            await user.save();
            await fileService.createDir(new File({user: user.id, name: ''}))

            return res.json({message: 'User was create'});
        } catch (e) {
            console.log(e);
            res.send({message: 'Server error'})
        }
    })


router.post('/login',
    async (req, res) => {
        try {
            const {email, password} = req.body;
            const user = await User.findOne({email});
            console.log('user', req)
            if (!user) {
                return res.status(404).json({message: 'User not found'})
            }

            const isPassValid = bcrypt.compareSync(password, user.password);
            if (!isPassValid) {
                return res.status(404).json({message: 'Invalid password'})
            }

            const token = jwt.sign(
                {id: user.id},
                config.get('secretKey'),
                {expiresIn: "1h"})
            return res.json({
                token,
                user: {
                    id:user.id,
                    email: user.email,
                    diskSpace: user.diskSpace,
                    userSpace: user.userSpace,
                    avatar: user.avatar
                }
            })
        } catch (e) {
            console.log(e);
            res.send({message: 'Server error'})
        }
    })

router.get('/auth', authCheck,
    async (req, res) => {
        try {
            const user = await User.findOne({_id: req.user.id});
            const token = jwt.sign(
                {id: user.id}, config.get('secretKey'), {expiresIn: "1h"});
            return res.json({
                token,
                user: {
                    id:user.id,
                    email: user.email,
                    diskSpace: user.diskSpace,
                    userSpace: user.userSpace,
                    avatar: user.avatar
                }
            })
        } catch (e) {
            console.log('auth.routes', e);
            res.send({message: 'Server error'})
        }
    })

module.exports = router;

// https://expressjs.com/en/guide/routing.html