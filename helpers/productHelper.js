var db=require('../config/connection')
var collection=require('../config/collection')
var objectId=require('mongodb').ObjectId
var bcrypt=require('bcrypt')
module.exports={

    addProduct: async (product, callback) => {
        console.log("Inside product helper module: " + product.admin_id);
        console.log(product);
        product.admin_id = new objectId(product.admin_id); // Convert adminId to ObjectId
        await db.get().collection("Product").insertOne(product).then((data) => {
            console.log("Data inserted id: " + data.insertedId);
            callback(data.insertedId);
        });
    },
    getAllProducts:(admin_id)=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({admin_id:new objectId(admin_id)}).toArray()
            console.log("Admin products"+admin_id)
            resolve(products)
        })
    },
    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },

    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },

    deleteProduct:(productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:new objectId(productId)}).then((response)=>{
                console.log(response);
                resolve(response);
            })
        })
    },
    getProductDetails:(productId)=>{
        return new Promise(async(resolve,reject)=>{
          await  db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:new objectId(productId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(productId,productDetails)=>{
        console.log(productDetails.name)
        return new Promise(async(resolve,reject)=>{
         await   db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:new objectId(productId)},{
                $set:{
                    "name":productDetails.name,
                    "description":productDetails.description,
                    "price":productDetails.price,
                    "category":productDetails.category
                }
            }).then((response)=>{
                console.log("Response:"+response)
                resolve(response)
            })
        })
    },
    doLogin: async (adminData) => {
        try {
            let response = {};
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email });
            if (admin) {
                let passwordMatch = await bcrypt.compare(adminData.password, admin.password);
                if (passwordMatch) {
                    console.log("Login success");
                    response.admin = admin;
                    response.status = true;
                } else {
                    console.log("Login failed: Password mismatch");
                    response.status = false;
                }
            } else {
                console.log("No such user");
                response.status = false;
            }
            return response;
        } catch (error) {
            console.error("Login error:", error);
            throw error; // Rethrow the error for handling in the caller
        }
    }
    ,
    doSignup:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            adminData.password=await bcrypt.hash(adminData.password,10)
            console.log(adminData.name)
            db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminData).then((data)=>{
                resolve(data)
            })
        })
    },
}