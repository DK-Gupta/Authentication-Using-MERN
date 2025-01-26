import mongoose from 'mongoose';

const connectdb = async ()=>{

    mongoose.connection.on('connected', ()=>console.log("Database is connected"))
    await mongoose.connect(`${process.env.MONGODB_URI}`)
}
export default connectdb;