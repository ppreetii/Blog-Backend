const bcrypt = require("bcryptjs");
const validator = require("validator");

const User = require("../models/user");

module.exports = {
    createUser: async function (args, req){
        const {email, name , password} = args.userInput;

        //Validate Request Body
        const errors = [];
        if(!validator.isEmail(email))
        errors.push("Invalid Email");
        if( validator.isEmpty(password)  || !validator.isLength(password, {min : 5}))
        errors.push("Password must be min. 5 characters length");

        if(errors.length > 0){
            const error = new Error("Validation Error");
            error.data = errors;
            error.code = 422;
            throw error;
        }

        const isUserExists = await User.findOne({email});
        if(isUserExists){
            const error = new Error("User already exists");
            throw error;
        }

        const hashedPw = await bcrypt.hash(password, 12);
        const user = new User({
            email,
            name,
            password : hashedPw
        });

        const dbUser = await user.save();
        return {
            _id : dbUser._id.toString(),
            ...dbUser._doc
        }

    }
}