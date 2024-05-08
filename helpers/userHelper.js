var db=require('../config/connection')
var collection=require('../config/collection')
var bcrypt=require('bcrypt')
const { deleteProduct } = require('./productHelper')
var objectId=require('mongodb').ObjectId
var Razorpay=require('razorpay')
const { rejects } = require('assert')
var instance=new Razorpay({
    key_id:'rzp_test_2t27zEJyxHHIOu',
    key_secret:'sBrI4cGNtaKd1TihJT2tiH1p'
})
module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.password=await bcrypt.hash(userData.password,10)
            console.log(userData.name)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data)
            })
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false;
            let response={};
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(user){
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                        console.log("Login success");
                        response.user=user;
                        response.status=true;
                        resolve(response);
                    }else{
                        console.log("Login failed");
                        resolve({status:false});
                    }
                })
            }else{
                console.log("No such user");
                resolve({status:false});
            }
        })
    },
    addToWishlist: (productId, userId) => {
        let productObj = {
            item: new objectId(productId),
        };
        return new Promise(async(resolve, reject) => {
            try {
                let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: new objectId(userId) });
                if (userWishlist) {
                    let productExist = userWishlist.products.findIndex(product => product.item.toString() === productId);
                    console.log("Product exist: " + productExist);
                    if (productExist !== -1) {
                        await db.get().collection(collection.WISHLIST_COLLECTION).updateOne(
                            { user: new objectId(userId) },
                            { $pull: { products: { item: new objectId(productId) } } }
                        );
                        resolve({ status: false }); // Product removed
                    } else {
                        await db.get().collection(collection.WISHLIST_COLLECTION).updateOne(
                            { user: new objectId(userId) },
                            { $push: { products: productObj } }
                        );
                        resolve({ status: true }); // Product added
                    }
                } else {
                    let wishlistObj = {
                        user: new objectId(userId),
                        products: [productObj]
                    };
                    await db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishlistObj);
                    resolve({ status: true }); // Product added
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    
    
    addToCart:(productId,userId)=>{
        let productObj={

            item:new objectId(productId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
            if(userCart){
                let proudctExist=userCart.products.findIndex(product=>product.item.toString() === productId)
                console.log("Product exist"+proudctExist)
                if(proudctExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:new objectId(userId),
                        'products.item':new objectId(productId)
                    },
                {
                    $inc:{'products.$.quantity':1}
                }).then(()=>{
                    resolve()
                })
                }else{
                    db.get().collection(collection.CART_COLLECTION).updateOne({
                        user:new objectId(userId)
                    },
                    {
                        $push:{products:productObj}
                    }
                ).then(()=>{
                    resolve()
                })
                }
            }else{
                let cartObj={
                    user:new objectId(userId),
                    products:[productObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve(response)
                })
            }
        })
    },
    addToCartFromWishlist:(productId,userId)=>{
        let productObj={

            item:new objectId(productId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
            if(userCart){
                let proudctExist=userCart.products.findIndex(product=>product.item.toString() === productId)
                console.log("Product exist"+proudctExist)
                if(proudctExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:new objectId(userId),
                        'products.item':new objectId(productId)
                    },
                {
                    $inc:{'products.$.quantity':1}
                })// Remove the product from the wishlist
                await db.get().collection(collection.WISHLIST_COLLECTION).updateOne(
                    { user: new objectId(userId) },
                    { $pull: { products: { item: new objectId(productId) } } }
                );
                    resolve()
                
                }else{
                    db.get().collection(collection.CART_COLLECTION).updateOne({
                        user:new objectId(userId)
                    },
                    {
                        $push:{products:productObj}
                    }
                )
                await db.get().collection(collection.WISHLIST_COLLECTION).updateOne(
                    { user: new objectId(userId) },
                    { $pull: { products: { item: new objectId(productId) } } }
                );
                    resolve()
              
                }
            }else{
                let cartObj={
                    user:new objectId(userId),
                    products:[productObj]
                }
                await db.get().collection(collection.WISHLIST_COLLECTION).updateOne(
                    { user: new objectId(userId) },
                    { $pull: { products: { item: new objectId(productId) } } }
                );
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve(response)
                    
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
          try {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
              {
                $match: {
                  user: new objectId(userId)
                }
              },
              {
                $unwind:'$products'
              },{
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
              },{
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'products'
                }
              },{
                $project:{
                    item:1,
                    quantity:1,
                    products:{$arrayElemAt:["$products",0]}
                }
              }
            //   {
            //     $lookup: {
            //       from: collection.PRODUCT_COLLECTION,
            //       let: {
            //         productList: '$products'
            //       },
            //       pipeline: [
            //         {
            //           $match: {
            //             $expr: {
            //               $in: ['$_id', '$$productList']
            //             }
            //           }
            //         }
            //       ],
            //       as: 'cartItems'
            //     }
            //   }
            ]).toArray();
            // Resolve with cartItems
            console.log('hi')
            // console.log("cart items are:", cartItems[0].products);
            resolve(cartItems);
           // Moved inside the try block
          } catch (error) {
            console.log("Error"+error);
            reject(error);
          }
        });
      },
      getWishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
          try {
            let wishlistItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
              {
                $match: {
                  user: new objectId(userId)
                }
              },
              {
                $unwind:'$products'
              },{
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
              },{
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'products'
                }
              },{
                $project:{
                    item:1,
                    quantity:1,
                    products:{$arrayElemAt:["$products",0]}
                }
              }
            //   {
            //     $lookup: {
            //       from: collection.PRODUCT_COLLECTION,
            //       let: {
            //         productList: '$products'
            //       },
            //       pipeline: [
            //         {
            //           $match: {
            //             $expr: {
            //               $in: ['$_id', '$$productList']
            //             }
            //           }
            //         }
            //       ],
            //       as: 'cartItems'
            //     }
            //   }
            ]).toArray();
            // Resolve with cartItems
            console.log('hi')
            // console.log("cart items are:", cartItems[0].products);
            resolve(wishlistItems);
           // Moved inside the try block
          } catch (error) {
            console.log("Error"+error);
            reject(error);
          }
        });
      },
      getWishlistCount: (userId) => {
        return new Promise(async(resolve, reject) => {
            try {
                let count = 0;
                let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: new objectId(userId) });
                if (wishlist && wishlist.products) {
                    count = wishlist.products.length;
                }
                console.log("wishlist count: " + count);
                resolve(count);
            } catch (error) {
                reject(error);
            }
        });
    },

      getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0;
            let cart=await db.get().collection(collection.CART_COLLECTION).find({ user: new objectId(userId) }).toArray();

            cart.forEach(cart => {
                cart.products.forEach(product => {
                    count += product.quantity;
                });
            });
            console.log("cart:"+count)
            // if(cart){
            //     count=cart.products.length
            // }
            resolve(count)
        })
      },
      changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(details.count===-1 && details.quantity===1){
                db.get().collection(collection.CART_COLLECTION).updateOne({
                    _id:new objectId(details.cartId)
                },{
                    $pull:{products:{item:new objectId(details.productId)}}
                }).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({
                    _id:new objectId(details.cartId),
                    'products.item':new objectId(details.productId)
                },{
                    $inc:{'products.$.quantity':details.count}
                }).then((response)=>{
                    resolve({status:true})
                })
            }
        })
      },
      deleteFromWishlist: (cartId, productId, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let userWishlistProduct = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({
                    _id: new objectId(cartId),
                    user: new objectId(userId)
                });
    
                if (!userWishlistProduct) {
                    return reject("User wishlist not found");
                }
    
                // Filter out the product to be removed
                const updatedProducts = userWishlistProduct.products.filter(product => product.item.toString() !== productId);
    
                // Update the cart document with the filtered products array
                await db.get().collection(collection.WISHLIST_COLLECTION).updateOne({
                    _id: new objectId(cartId),
                    user: new objectId(userId)
                }, {
                    $set: {
                        products: updatedProducts
                    }
                }).then((response)=>{
                    resolve({ status: true});
                })
            } catch (error) {
                console.error("Error deleting product from wishlist:", error);
                reject(error);
            }
        });
    }


      ,deleteFromCart: (cartId, productId, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let userCartProduct = await db.get().collection(collection.CART_COLLECTION).findOne({
                    _id: new objectId(cartId),
                    user: new objectId(userId)
                });
    
                if (!userCartProduct) {
                    return reject("User cart not found");
                }
    
                // Filter out the product to be removed
                const updatedProducts = userCartProduct.products.filter(product => product.item.toString() !== productId);
    
                // Update the cart document with the filtered products array
                await db.get().collection(collection.CART_COLLECTION).updateOne({
                    _id: new objectId(cartId),
                    user: new objectId(userId)
                }, {
                    $set: {
                        products: updatedProducts
                    }
                }).then((response)=>{
                    resolve({ status: true});
                })
            } catch (error) {
                console.error("Error deleting product from cart:", error);
                reject(error);
            }
        });
    },

    
    getWishlistTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let total = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                    {
                        $match: { user: new objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION, // Assuming PRODUCT_COLLECTION contains product details including price
                            localField: 'products.item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            quantity: 1,
                            price: {$toDouble:{ $arrayElemAt: ['$product.price', 0] } } // Accessing price from the product details
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: {
                                $sum: { $multiply: ['$quantity', '$price'] }
                            }
                        }
                    }
                ]).toArray();
    
                // console.log("Total:", total[0].total);
                if (total && total.length > 0 && total[0].total !== undefined) {
                    console.log("Total:", total[0].total);
                    resolve(total[0].total);
                } else {
                    // No items in the cart or total is undefined
                    resolve(0); // Return 0 or any default value
                }
            } catch (error) {
                console.error("Error calculating total amount:", error);
                reject(error);
            }
        });
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: new objectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION, // Assuming PRODUCT_COLLECTION contains product details including price
                            localField: 'products.item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            quantity: '$products.quantity',
                            price: {$toDouble:{ $arrayElemAt: ['$product.price', 0] } } // Accessing price from the product details
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: {
                                $sum: { $multiply: ['$quantity', '$price'] }
                            }
                        }
                    }
                ]).toArray();
    
                // console.log("Total:", total[0].total);
                if (total && total.length > 0 && total[0].total !== undefined) {
                    console.log("Total:", total[0].total);
                    resolve(total[0].total);
                } else {
                    // No items in the cart or total is undefined
                    resolve(0); // Return 0 or any default value
                }
            } catch (error) {
                console.error("Error calculating total amount:", error);
                reject(error);
            }
        });
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectId(userId) });
                if (cart !== null && cart.products) {
                    resolve(cart.products);
                } else {
                    // If cart or cart.products is null or undefined
                    resolve([]); // Return an empty array or handle as needed
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    getWishlsitProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: new objectId(userId) });
                if (wishlist !== null && wishlist.products) {
                    resolve(wishlist.products);
                } else {
                    // If cart or cart.products is null or undefined
                    resolve([]); // Return an empty array or handle as needed
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    placeOrder:(order,products,total)=>{
        console.log(order,products,total);
        return new Promise((resolve,reject)=>{
            let status=order.paymentMethod==='COD'?'Placed':'Pending'
            let orderObj={
                deliveryDetails:{
                    address:order.address,
                    pincode:order.pincode,
                    mobile:order.phone
                },
                userId:new objectId(order.userId),
                paymentMethod:order.paymentMethod,
                products:products,
                status:status,
                total:total,
                date:new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:new objectId(order.userId)})
                console.log("place order order id"+response.insertedId)
                resolve(response.insertedId)
            })
        })
    }
    ,
    getAllOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:new objectId(userId)}).toArray()
            resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async (resolve, reject) => {
            try {
              let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                  $match: {
                    _id: new objectId(orderId)
                  }
                },
                {
                  $unwind:'$products'
                },{
                  $project:{
                      item:'$products.item',
                      quantity:'$products.quantity'
                  }
                },{
                  $lookup:{
                      from:collection.PRODUCT_COLLECTION,
                      localField:'item',
                      foreignField:'_id',
                      as:'products'
                  }
                },{
                  $project:{
                      item:1,
                      quantity:1,
                      products:{$arrayElemAt:["$products",0]}
                  }
                }
              //   {
              //     $lookup: {
              //       from: collection.PRODUCT_COLLECTION,
              //       let: {
              //         productList: '$products'
              //       },
              //       pipeline: [
              //         {
              //           $match: {
              //             $expr: {
              //               $in: ['$_id', '$$productList']
              //             }
              //           }
              //         }
              //       ],
              //       as: 'cartItems'
              //     }
              //   }
              ]).toArray();
              // Resolve with cartItems
              // console.log("cart items are:", cartItems[0].products);
              resolve(orderItems);
             // Moved inside the try block
            } catch (error) {
              console.log("Error"+error);
              reject(error);
            }
          });
    }
    ,
    generateRazorpay:(orderId,total)=>{
        console.log("order id"+orderId)
        return new Promise(async(resolve,reject)=>{
            var productArray=await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:new objectId(orderId)})
            productArray.forEach(productArray => {
                productArray.item
                
            });
            console.log(productArray)
            var options={
                amount:total*100,
                currency:"INR",
                receipt:orderId
            };
            instance.orders.create(options,function(err,order){
                if(err){
                    console.log(err);
                }else{
                    console.log(order);
                    resolve(order)
                }
            })
        })
    },

    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto=require('crypto')
            let hmac=crypto.createHmac('sha256','sBrI4cGNtaKd1TihJT2tiH1p')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')
            if(hmac===details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({
                _id:new objectId(orderId)
            },{
                $set:{
                    status:'Placed'
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
      
}