// сервис для работы с FS
const fs = require('fs');
const File = require('../models/File');
const config = require('config');

class FileServices {
    createDir(file) {
        const filePath = `${config.get('filePath')}\\${file.user}\\${file.path}`
        return new Promise(((resolve, reject) => {
            try {
                if (!fs.existsSync(filePath)) {
                    fs.mkdirSync(filePath)
                    return resolve({message: 'File was create'})
                } else {
                    return reject({message: 'File already exist'})
                }
            } catch (e) {
                return reject({ message: 'File error'})
            }
        }))
    }

    deleteFile(file) {
        const path = this.getPath(file);
        if (file.type === 'dir') {
            fs.rmdirSync(path); //  удаления папки в синхронном варианте
        } else {
            fs.unlinkSync(path); //  удаления файла в синхронном варианте
        }
    }


    getPath(file) {
        return config.get('filePath') + '\\' + file.user + '\\' + file.path ;
    }
}

module.exports = new FileServices();