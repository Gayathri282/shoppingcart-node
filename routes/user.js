var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/productHelper')
const userHelper=require('../helpers/userHelper');
const { response } = require('../app');
const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
    next();
  }else{
    res.redirect('/login');
  }
}
/* GET home page. */
router.get('/', verifyLogin,async function(req, res, next) {
  let user=req.session.user;
  let cartCount=null
  let wishlistCount=null;
  // console.log("user id"+req.session.user._id)
  if(user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
    wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
    console.log("wishlist"+wishlistCount)
  }
  userHelper.getAllProducts().then((products)=>{
    // console.log(products);
    res.render('user/viewProducts',{products,user,cartCount,wishlistCount});
  })
});

router.get('/login',(req,res)=>{
  if(req.session.userLoggedIn){
    // console.log("REQ.SESSION LOGGEDIN if:"+req.session.loggedIn);
   res.redirect('/');
  }else{
  res.render('user/login',{"err":req.session.userLoginErr});
  // console.log("REQ.SESSION LOGGEDIN else:"+req.session.loggedIn);
  req.session.userLoginErr=false;
  }
})

router.get('/signup',(req,res)=>{
  res.render('user/signup')
})

router.post('/signup',(req,res)=>{
userHelper.doSignup(req.body).then((response)=>{
  // console.log(response);
  req.session.user=response.user;
  req.session.userLoggedIn=true;
  res.render('user/login')
})
})

router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      
      req.session.user=response.user;
      req.session.userLoggedIn=true;
      res.redirect('/');
    }else{
      req.session.userLoginErr="Invalid username or password";
      res.redirect('/login');
    }
  });
})

router.get('/logout',(req,res)=>{
  req.session.user=null;
  req.session.userLoggedIn=false
  res.redirect('/login');
})

// router.get('/cart',verifyLogin,async(req,res)=>{
//   let products= await userHelper.getCartProducts(req.session.user._id)
//   // console.log("Porducts in cart"+products);
  
//   res.render('user/cart',{products,user:req.session.user})
// })

router.get('/cart', verifyLogin, async (req, res) => {
  try {
      if (!req.session.user) {
          // Redirect to login page or display an error message
          return res.redirect('/login');
      }
      let user=req.session.user;
      // let cartCount=null
      let wishlistCount=null;
      // console.log("user id"+req.session.user._id)
      if(user){
        // cartCount=await userHelper.getCartCount(req.session.user._id)
        wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
        console.log("wishlist"+wishlistCount)
      }

      let products = await userHelper.getCartProducts(req.session.user._id);
      let total=await userHelper.getTotalAmount(req.session.user._id)
      res.render('user/cart', { products, user: req.session.user ,total,wishlistCount});
  } catch (error) {
      console.error("Error accessing cart:", error);
      // Handle error, e.g., display an error page
      res.status(500).render('error', { message: 'Internal Server Error', error });
  }
});
router.get('/wishlist', verifyLogin, async (req, res) => {
  try {
      if (!req.session.user) {
          // Redirect to login page or display an error message
          return res.redirect('/login');
      }
      let user=req.session.user;
      let cartCount=null
      // let wishlistCount=null;
      // console.log("user id"+req.session.user._id)
      if(user){
        cartCount=await userHelper.getCartCount(req.session.user._id)
        wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
        console.log("wishlist"+wishlistCount)
      }

      let products = await userHelper.getWishlistProducts(req.session.user._id);
      let total=await userHelper.getTotalAmount(req.session.user._id)
      res.render('user/wishlist', { products, user: req.session.user ,total,cartCount});
  } catch (error) {
      console.error("Error accessing wishlist:", error);
      // Handle error, e.g., display an error page
      res.status(500).render('error', { message: 'Internal Server Error', error });
  }
});

router.get('/addToCart/:id',(req,res)=>{
  console.log("API called")
  console.log("product id"+req.params.id);
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    // res.redirect('/')
    res.json({status:true})
  })
})


router.get('/addToCartFromWishlist/:id',async(req,res)=>{
   let user=req.session.user;
  let cartCount=null
  // let wishlistCount=null;
  // console.log("user id"+req.session.user._id)
  if(user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
    // wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
    console.log("wishlist"+wishlistCount)
  }
  userHelper.addToCartFromWishlist(req.params.id,req.session.user._id)
      .then(() => {
          console.log("User added to cart from wishlist");
          res.json({status: true});
      })
      .catch(error => {
          console.error("Error adding to cart from wishlist:", error);
          res.status(500).json({status: false, error: "Error adding to cart from wishlist"});
      });
});

router.get('/addToWishlist/:id',(req,res)=>{
  // console.log("API called")
  // console.log("product id"+req.params.id);
  userHelper.addToWishlist(req.params.id,req.session.user._id).then((response)=>{
    // res.redirect('/')
    res.json(response)
  })
})

router.post('/changeProductQuantity', async (req, res, next) => {
 await userHelper.changeProductQuantity(req.body).then(async(response)=>{
  response.total=await userHelper.getTotalAmount(req.body.userId)
    res.json(response)
  })
});

router.get('/deleteFromCart/:cartId/:productId', (req, res) => {
  let cartId = req.params.cartId; // Retrieve productId from the route parameter
  let productId = req.params.productId; // Retrieve productsId from the route parameter
  // Now you can use productId and productsId as needed
  
  // Example usage:
  console.log("cart ID:", cartId);
  console.log("ProductID:", productId);
  userHelper.deleteFromCart(cartId,productId,req.session.user._id).then(async(response)=>{
    response.total=await userHelper.getTotalAmount(req.body.userId)
    console.log("delete cart"+req.body.userId)
    res.json(response)
  })
})

router.get('/deleteFromWishlist/:wishlistId/:productId', (req, res) => {
  let wishlistId = req.params.wishlistId; // Retrieve productId from the route parameter
  let productId = req.params.productId; // Retrieve productsId from the route parameter
  // Now you can use productId and productsId as needed
  
  // Example usage:
  console.log("wishlistId ID:", wishlistId);
  console.log("ProductID:", productId);
  userHelper.deleteFromWishlist(wishlistId,productId,req.session.user._id).then(async(response)=>{
    response.total=await userHelper.getWishlistTotalAmount(req.body.userId)
    console.log("delete cart"+req.body.userId)
    res.json(response)
  })
})




router.get('/placeOrder',verifyLogin,async(req,res)=>{
  let user=req.session.user;
  let cartCount=null
  let wishlistCount=null;
  // console.log("user id"+req.session.user._id)
  if(user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
    wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
    console.log("wishlist"+wishlistCount)
  }
  let total=await userHelper.getTotalAmount(req.session.user._id)

  res.render('user/placeOrder',{total,user:req.session.user,cartCount,wishlistCount})
})

router.post('/placeOrder',async(req,res)=>{
  console.log(req.body);
  let products=await userHelper.getCartProductList(req.body.userId)
  let totalAmount=await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body,products,totalAmount).then((orderId)=>{
    console.log('usr.js orderid'+orderId)
    if(req.body.paymentMethod==='COD'){
      res.json({cod_success:true})
    }else{
      userHelper.generateRazorpay(orderId,totalAmount).then((response)=>{
        res.json(response)
      })
    }
   
  })
})

router.get('/OrderPlaced',verifyLogin,async(req,res)=>{
  let user=req.session.user;
  let cartCount=null
  let wishlistCount=null;
  // console.log("user id"+req.session.user._id)
  if(user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
    wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
    console.log("wishlist"+wishlistCount)
  }
  res.render('user/orderPlaced',{user:req.session.user,cartCount,wishlistCount})
})

router.get('/orderHistory',verifyLogin,async(req,res)=>{
  let user=req.session.user;
  let cartCount=null
  let wishlistCount=null;
  // console.log("user id"+req.session.user._id)
  if(user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
    wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
    console.log("wishlist"+wishlistCount)
  }
 let orders= await userHelper.getAllOrders(req.session.user._id)
 console.log(orders.status)
 res.render('user/orderHistory',{orders,user:req.session.user,cartCount,wishlistCount})
})

router.get('/viewOrderProducts/:id',verifyLogin,async(req,res)=>{
  let user=req.session.user;
  let cartCount=null
  let wishlistCount=null;
  // console.log("user id"+req.session.user._id)
  if(user){
    cartCount=await userHelper.getCartCount(req.session.user._id)
    wishlistCount=await userHelper.getWishlistCount(req.session.user._id)
    console.log("wishlist"+wishlistCount)
  }
  let products=await userHelper.getOrderProducts(req.params.id)
  res.render('user/viewOrderProducts',{user:req.session.user,products,cartCount,wishlistCount})
})

router.post('/verifyPayment',(req,res)=>{
userHelper.verifyPayment(req.body).then(()=>{
  userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
    res.json({status:true})
  }).catch(()=>{
    res.json({status:false})
  })
})
})
module.exports = router;
