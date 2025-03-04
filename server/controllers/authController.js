 import bcrypt from 'bcryptjs';
 import jwt from 'jsonwebtoken';
import userModel from '../config/userModel.js';
import transporter from '../config/nodemailer.js';

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
        return res.json({success: false, message: error.message})
        
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
            return res.json({success: false, message: "Invailid mail..."})
        }
        
        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.json({success: false, message: 'Invalid Password please enter again...'})
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn:'7d'});

        res.cookie('token',token,{
            httponly: true,
            secure: process.env.NODE_ENV ==='Production',
            sameSite: process.env.NODE_ENV === 'Production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000

        });
        // Sending otp mail
        // const mailOption = {
        //     from: process.env.SENDER_EMAIL ,
        //     to: email,
        //     subject: 'Welcome to DK site',
        //     text: `Welcome to DK's site , your account is created using this email id: ${email}`
        // }
        // try {
        //     await transporter.sendMail(mailOption);
            
        // } catch (error) {
        //     return res.json({success: false, message: "Cannot send mail"})
            
        // }
        

        return res.json({success:true, message: "Login succesfull"});

    } catch (error) {
        return res.json({success: false, message: error.message});
        
    }
};

export const logOut = async (req, res)=>{
    try {


        const token = req.cookies.token;

        if (!token) {
            return res.status(400).json({ success: false, message: 'No token found' });
        }
        res.clearCookie('token',token,{
            httponly: true,
            secure: process.env.NODE_ENV ==='Production',
            sameSite: process.env.NODE_ENV === 'Production' ? 'none' : 'strict',
        });

        return res.json({success: true, message: 'Logged Out'});

        
    } catch (error) {
        return res.json({success:false, message: error.message})
        
    }

}

export const sendVerifyOtp = async(req, res)=>{
    try {
        const {userId} = req.body;

        const user = await userModel.findById(userId);

        if(user.isAccountVerified){
            return res.json({success: false, message: "Account is already verified"})
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now()+ 24*60*60*1000;

        await user.save();

        const mailOption ={
            from: process.env.SENDER_EMAIL ,
            to: user.email,
            subject: 'Account verification OTP',
            text: `Your OTP is ${otp}. Verify your account using this OTP `

        }
        await transporter.sendMail(mailOption);

        res.json({success: true, message:"Verification otp send on email"})
    } catch (error) {
        return res.json({success: false, message: error.message})
        
    }
}

export const verifyEmail = async(req, res)=>{
    const{userId, otp} = req.body;

    if(!userId || !otp){
        return res.json({success: false, message:"UserId or Otp is missing"});
    }
    try {
        const user = await userModel.findById(userId);

        if(!user){
            return res.json({success: false, message: "user not found"});
        }

        if(user.verifyOtp === '' || user.verifyOtp !== otp){
            return res.json({success: false, message: 'Invalid otp'})
        }
        if(user.verifyOtpExpireAt < Date.now()){
            return res.json({success:false, message: "otp expired"});
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();
        return res.json({success: true, message: "Email verifyied succesfully"
        })
    } catch (error) {
        return res.json({success: false, message: error.message})
        
    }
}