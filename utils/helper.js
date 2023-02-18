const fs = require("fs");
const path = require("path");

exports.clearImage = filepath =>{
    filepath = path.join(__dirname, "../" , filepath);
    fs.unlink(filepath, err =>{
        console.log(err);
    })
}