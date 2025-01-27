 import bcrypt from 'bcryptjs';
 import jwt from 'jsonwebtoken';
import userModel from '../config/userModel.js';

export const register = async(req, res) =>{
    const {name, email, password} = req.body;

    if(!name || !email || !password){
        return res.json({success: false, message: 'Missing Details'})
    }

    try {
        const existingUser = await userModel.findOne({email});
        if(existingUser){
            return res.json({success: false, message: "User already exists"})
        }
        const hashPassword = await bcrypt.hash(password,10);
        const user = new userModel({name, email, password: hashPassword});
        await user.save();

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn:'7d'});

        res.cookie('token',token,{
            httponly: true,
            secure: process.env.NODE_ENV ==='Production',
            sameSite: process.env.NODE_ENV === 'Production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000

        });
        
    } catch (error) {
        res.json({success: false, message: error.message})
        
    }
}

export const login = async(req, res)=>{
    const {email, password} = req.body;

    if(!email || !password){
        return res.json({success: false, message: 'Email and Password Required'});
    }

    try {
        const user = await userModel.findOne({email});

        if(!user){
            res.json({success: false, message: "Invailid mail..."})
        }
        
        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            res.json({success: false, message: 'Invalid Password please enter again...'})
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn:'7d'});

        res.cookie('token',token,{
            httponly: true,
            secure: process.env.NODE_ENV ==='Production',
            sameSite: process.env.NODE_ENV === 'Production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000

        });

        return res.json({success:true});

    } catch (error) {
        res.json({success: false, message: error.message})
        
    }
}

export const logOut = async (req, res)=>{
    try {
        res.clearCookie('token',token,{
            httponly: true,
            secure: process.env.NODE_ENV ==='Production',
            sameSite: process.env.NODE_ENV === 'Production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000

        });

        return res.json({success: true, message: 'Logged Out'})

        
    } catch (error) {
        res.json({success:false, message: error.message})
        
    }

}