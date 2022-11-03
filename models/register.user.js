const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
if (process.env.NODE_ENV !== 'production') 
require ('dotenv').config()

const UserSchema = new mongoose.Schema( {
    username:{
        type:String,
        required:true,
        trim:true,
        // unique:true
    },
    password:{
        type:String,
        required:true,
        trim:true,
        minLength:6,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('password cannot be password itself')
            }
        }
    },
    cpassword:{
        type:String,
        required:true,
        trim:true,
        minLength:6,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('password cannot be password itself')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required:true
        }
    }],
    avatar:{
        type: Buffer
    },
}, {
    timestamps:true
})



// passing necessary data to sever
UserSchema.methods.toJSON = function() {
    const userObject = this.toObject();

    delete userObject.password;
    delete userObject.tokens;
    // delete userObject.avatar;

    return userObject;
}

// process.env.JWT_SECRET

UserSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_TOKEN)
    // console.log(token);
    user.tokens = user.tokens.concat({ token:token })

    await user.save()

    return token
}

UserSchema.statics.findByCredentials = async function(username, password)  {
    const user = await User.findOne({ username: username })
    if (!user) {
        throw new Error("Unable to login")
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error("Unable to login")
    }
    return user;
}

UserSchema.pre('save', async function(next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    if (user.isModified('cpassword')) {
        user.cpassword = await bcrypt.hash(user.cpassword, 8);
    }

    next();
})

const User = mongoose.model('User' , UserSchema);

module.exports = User;