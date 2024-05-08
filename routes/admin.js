var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/productHelper');


const verifyLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn){
    next();
  }else{
    res.redirect('admin/login');
  }
}

/* GET users listing. */
router.get('/',verifyLogin,function(req, res, next) {
  console.log("inside all products")
  productHelper.getAllProducts(req.session.admin._id).then((products)=>{
    console.log(products);
    res.render('admin/viewProducts',{admin:true,products});
  })
});


router.get('/allOrders',(req,res)=>{
  productHelper.getAllOrders().then((orders)=>{
    res.render('admin/viewOrders',{admin:true,orders})
  })
})

router.get('/allUsers',(req,res)=>{
  productHelper.getAllUsers().then((users)=>{
    res.render('admin/viewUsers',{admin:true,users})
  })
})

router.get('/addProduct',function(req, res, next) {
  res.render('admin/addProduct',{admin:true,admin_id:req.session.admin._id});
});

router.post('/addProduct',(req,res)=>{
   console.log("hi")
  console.log(req.body.admin_id)
  console.log(req.body);
  console.log(req.files.image)
  productHelper.addProduct(req.body,(id)=>{
   
    let image=req.files.image
    console.log(req.files.image);
    image.mv('./public/productImages/'+id+'.jpg',(err,done)=>{
      if(!err){
        console.log("Admin.js>if");
        res.render('admin/addProduct');
      }else{
        console.log("Error"+err)
      }
    })
  })
})
router.get('/deleteProduct',(req,res)=>{
  let productId=req.query.id;
  console.log("Product ID:"+productId);
  productHelper.deleteProduct(productId).then((response)=>{
    res.redirect('/admin')
  })
})

router.get('/editProduct/:id',async(req,res)=>{
  let product=await productHelper.getProductDetails(req.params.id)
  console.log("Product"+product)
  res.render('admin/editProduct',{product})
})

router.post('/editProduct/:id',(req,res)=>{
  console.log("id"+req.params.id);
  productHelper.updateProduct(req.params.id,req.body).then((response)=>{
    console.log(response);
    res.redirect('/admin')
    if(req.files.image){
      console.log('hi')
      let image=req.files.image
      image.mv('./public/productImages/'+req.params.id+'.jpg')
    }
  })
})

router.post('/login',(req,res)=>{
  productHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      
      req.session.admin=response.admin;
      req.session.adminLoggedIn=true;
      productHelper.getAllProducts(req.session.admin._id).then((products)=>{
        // console.log(req.session.admin.id);
        res.render('admin/viewProducts',{admin:true,products});
      })
    }else{
      req.session.adminLoginErr="Invalid username or password";
      res.redirect('admin/login',{admin:true});
    }
  });
})

router.get('/logout',(req,res)=>{
  req.session.admin=null;
  res.render('admin/login',{admin:true});
})
router.get('/logout',(req,res)=>{
  req.session.user=null;
  req.session.userLoggedIn=false
  res.redirect('admin/login');
})


router.get('/signup',(req,res)=>{
  res.render('admin/signup',{admin:true})
})

router.post('/signup',(req,res)=>{
  console.log(req)
productHelper.doSignup(req.body).then((response)=>{
  console.log(response);
  req.session.admin=response.admin;
  req.session.adminLoggedIn=true;
  res.render('admin/login')
})
})
router.get('/login',(req,res)=>{
  if(req.session.adminLoggedIn){
    console.log('inside route get admin login')
    // console.log("REQ.SESSION LOGGEDIN if:"+req.session.loggedIn);
   res.render('admin/login',{admin:true});
  }else{
  res.render('admin/login',{"err":req.session.adminLoginErr,admin:true});
  // console.log("REQ.SESSION LOGGEDIN else:"+req.session.loggedIn);
  req.session.adminLoginErr=false;
  }
})

module.exports = router;
