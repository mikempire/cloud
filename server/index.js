const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const config = require("config");
const fileUpload = require("express-fileupload");
const authRouter = require("./routes/auth.routes");
const fileRouter = require("./routes/file.routes");


const app = express();
const PORT = config.get('serverPort');

app.use(express.json());
app.use(express.static('static'));
app.use(fileUpload({}));
app.use(cors());

app.use('/api/auth', authRouter);
app.use('/api/files', fileRouter);

/*
use - это метод настройки промежуточного программного обеспечения,
используемого маршрутами объекта HTTP-сервера Express.
Метод определен как часть Connect, на котором основан Экспресс.
https://overcoder.net/q/7247/nodejs-express-что-такое-appuse
 */
const start = async () => {
    try {
        await mongoose.connect(config.get('dbUrl'));
        app.listen(PORT, () => {
            console.log('Server started on port', PORT);
        });
    } catch (e) {
        console.log(e);
    }
}

start();