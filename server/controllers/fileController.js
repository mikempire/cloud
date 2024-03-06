const fileService = require('../services/fileServices');
const User = require('../models/User')
const File = require('../models/File');
const config = require('config');
const fs = require("fs"); // файловая система
const Uuid = require("uuid");

class FileController {
    async createDir(req, res) {
        try {
            const {name, type, parent} = req.body;
            const file = new File({name, type, parent, user: req.user.id});
            const parentFile = await File.findOne({_id: parent});
            if (!parentFile) {
                file.path = name;
                await fileService.createDir(file);
            } else {
                file.path = `${parentFile.path}\\${file.name}`;
                await fileService.createDir(file);
                parentFile.childs.push(file._id);
                await parentFile.save();
            }
            await file.save();
            return res.json(file);
        } catch (e) {
            console.log(e);
            return res.status(400).json(e);
        }
    }

    async getFiles(req, res) {
        try {
            const {sort} = req.query; // берем из гет запроса
            let files;
            switch (sort) {
                case 'name':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({name: 1});
                    break;
                case 'type':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({type: 1});
                    break;
                case 'date':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({date: 1});
                    break;
                default:
                    files = await File.find({user: req.user.id, parent: req.query.parent});
                    break

            }
            return res.json(files);
        } catch (e) {
            console.log(e);
            return res.status(500).json({message: 'Can not get files'});
        }
    }

    async uploadFile(req, res) {
        try {

            const file = req.files.file;
            const parent = await File.findOne({user: req.user.id, _id: req.body.parent});
            const user = await User.findOne({_id: req.user.id});

            if (user.usedSpace + file.size > user.diskSpace) {
                return res.status(400).json({message: 'There no space on the disk'})
            }

            user.usedSpace = user.usedSpace + file.size;
            let path;
            if (parent) {
                path = `${config.get('filePath')}\\${user._id}\\${parent.path}\\${file.name}`;
            } else {
                path = `${config.get('filePath')}\\${user._id}\\${file.name}`;
            }

            if (fs.existsSync(path)) {
                return res.status(400).json({message: 'File already exist'})
            }

            file.mv(path);

            const type = file.name.split('.').pop();
            let filePath = file.name;
            if (parent) {
                filePath = parent.path + '\\' + file.name;
            }


            const dbFile = new File({
                name: file.name,
                type,
                size: file.size,
                path: filePath,
                parent: parent?._id,
                user: user._id
            })

            await dbFile.save();
            await user.save();
            res.json(dbFile)
        } catch (e) {
            console.log(e);
            return res.status(500).json({message: 'Upload error'});
        }
    }

    async downloadFile(req, res) {
        try {
            const file = await File.findOne({_id: req.query.id, user: req.user.id});
            // const path = config.get('filePath') + '\\' + req.user.id + '\\' + file.path + '\\' + file.name;
            const path = fileService.getPath(file);
            if (fs.existsSync(path)) {
                return res.download(path, file.name);
            }
            return res.status(400).json({message: 'Download error'});
        } catch (e) {
            console.log(e);
            res.status(500).json({message: 'Download error'})
        }
    }

    async deleteFile(req, res) {
        try {
            const file = await File.findOne({_id: req.query.id, user: req.user.id});
            if (!file) {
                return res.status(400).json({message: 'file not found'})
            }
            console.log('file', file)
            fileService.deleteFile(file);// удаляем файл с сервера
            await file.remove();// удаляем файл с бд
            return res.json({message: "File delete"})

        } catch (e) {
            console.log(e);
            return res.status(500).json({message: 'Dir not empty'})
        }
    }

    async searchFile(req, res) {
        try {
            const searchName = req.query.search;
            console.log({searchName});
            let files = await File.find({user: req.user.id});
            files = files.filter((file) => file.name.includes(searchName));
            return res.json(files);
        } catch (e) {
            console.log(e);
            return res.status(400).json({message: 'Search error!'})
        }
    }

    async uploadAvatar(req, res) {
        try {
            const file = req.files.file;
            const user = await User.findById(req.user.id);
            const avatarName = Uuid.v4() + '.jpg';
            file.mv(config.get('staticPath') + "\\" + avatarName);// move
            user.avatar = avatarName;
            await user.save();
            return res.json(user);

        } catch (e) {
            console.log(e);
            return res.status(400).json({message: 'Avatar upload error!'})
        }
    }

    async deleteAvatar(req, res) {
        try {
            const user = await User.findById(req.user.id);
            fs.unlinkSync(config.get('staticPath') + '\\' + user.avatar); //  удаления файла в синхронном варианте
            user.avatar = null;
            await user.save();//
            return res.json(user)
        } catch (e) {
            console.log(e);
            return res.status(400).json({message: 'Avatar delete error!'})
        }
    }
}

module.exports = new FileController()