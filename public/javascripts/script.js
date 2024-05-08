// $(document).ready(function() {
//     // Call changeQuantity function with initial parameters when document is loaded
//     changeQuantity(initialCartId, initialProductId, initialCount);
// });



    function addToCart(ProductId){
        $.ajax({
            url:'/addToCart/'+ProductId,
            method:'get',
            success:(response)=>{
                if(response.status){
                    let count=$('#cartCount').html()
                    count=parseInt(count)+1
                    $('#cartCount').html(count)
                    // alert('Product successfully added to cart');
                }
                // alert(response)
            }
        })
    }
    
    function addToCartFromWishlist(productId) {
        $.ajax({
            url: '/addToCartFromWishlist/' + productId,
            method: 'get',
            success: (response) => {
                console.log("Inside addToCartFromWishlist success callback");
                if (response.status) {
                    console.log('inside add to cart from wishlist if ');
                    let count = $('#wishCount').html();
                    count = parseInt(count) - 1;
                    $('#wishCount').html(count);
                    $('#row_' + productId).remove();
                }
            },
            error: (xhr, status, error) => {
                console.error("Error in addToCartFromWishlist:", error);
            }
        });
    }


    function addToWishlist(ProductId,icon){
        $.ajax({
            url:'/addToWishlist/'+ProductId,
            method:'get',
            success:(response)=>{
                if(response.status){
                    let count=$('#wishCount').html()
                    count=parseInt(count)+1
                    $('#wishCount').html(count)
                    icon.classList.add('red');
                    // alert('Product successfully added to cart');
                }else{
                    let count=$('#wishCount').html()
                    count=parseInt(count)-1
                    $('#wishCount').html(count)
                    icon.classList.remove('red');

                }
                // alert(response)
            }
        })
    }

    function deleteFromCart(cartId, productId, userId) {
        if (confirm('Are You Sure ?')) { // Prompt the user with a confirmation dialog
            console.log(userId);
            $.ajax({
                url: '/deleteFromCart/' + cartId + '/' + productId + '/' + userId,
                method: 'GET',
                success: (response) => {
                    if (response.status) {
                        // Remove the corresponding table row from the cart page
                        $('#row_' + productId).remove();
                        $('#total').html(response.total);
                        // Optionally, you can update the UI or perform any other actions here
                        alert('Product successfully deleted from cart');
                        location.reload(); // Reloading the page after successful deletion
                    } else {
                        // Handle the case where deletion failed
                        alert('Failed to delete product from cart');
                    }
                }
            });
        }
    }

    function deleteFromWishlist(wishlistId, productId, userId) {
        if (confirm('Are You Sure ?')) { // Prompt the user with a confirmation dialog
            console.log(userId);
            $.ajax({
                url: '/deleteFromWishlist/' + wishlistId + '/' + productId + '/' + userId,
                method: 'GET',
                success: (response) => {
                    if (response.status) {
                        // Remove the corresponding table row from the cart page
                        $('#row_' + productId).remove();
                        $('#WishlistTotal').html(response.total);
                        // Optionally, you can update the UI or perform any other actions here
                        alert('Product successfully deleted from cart');
                        location.reload(); // Reloading the page after successful deletion
                    } else {
                        // Handle the case where deletion failed
                        alert('Failed to delete product from cart');
                    }
                }
            });
        }
    }
    

    function changeQuantity(cartId, productId, userId, count) {
       let quantity=parseInt(document.getElementById(productId).innerHTML)
       console.log("userID"+userId)
       count=parseInt(count)
        $.ajax({
            url: '/changeProductQuantity',
            data: {
                cartId: cartId,
                productId: productId,
                count: count,
                userId: userId,
                quantity:quantity
            },
            method: 'POST',
            success: (response) => {
                if (response.removeProduct) {
                    alert('Product removed from cart');
                    location.reload();
                } else {
                    console.log("total amout"+response.total)
                    // Update the displayed quantity using the dynamically generated ID
                    document.getElementById(productId).innerHTML = quantity + count;
                    document.getElementById('total').innerHTML=response.total;
                  
            
                    // Update the total amount if it exists in the response
                    // if (response.total) {
                    //     document.getElementById('total').innerHTML = response.total;
                    // } else {
                    //     // Handle the case where total is not available
                    //     document.getElementById('total').innerHTML = '0';
                    // }
                }
            }
        })
    }
    

  
      
 $('#checkoutForm').submit((e)=>{
    e.preventDefault()
    $.ajax({
        url:'/placeOrder',
        method:'post',
        data:$('#checkoutForm').serialize(),
        success:(response)=>{
            // alert(response)
            if(response.cod_success){
                location.href='/OrderPlaced'
            }else{
                razorpayPayment(response)
            }
        }
    })
 })

 function razorpayPayment(order){
    var options = {
        "key": "rzp_test_2t27zEJyxHHIOu", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Shopping Cart", //your business name
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response){
            // alert(response.razorpay_payment_id);
            // alert(response.razorpay_order_id);
            // alert(response.razorpay_signature);
            verifyPayment(response,order);
        },
        "prefill": { //We recommend using the prefill parameter to auto-fill customer's contact information especially their phone number
            "name": "Gaurav Kumar", //your customer's name
            "email": "gaurav.kumar@example.com",
            "contact": "9000090000" //Provide the customer's phone number for better conversion rates 
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
 }


 function verifyPayment(payment,order){
    $.ajax({
        url:'/verifyPayment',
        data:{
            payment,
            order
        },
        method:'post',
        success:(response)=>{
            if(response.status){
                location.href='/OrderPlaced'
            }else{
                alert("payment Failed")
            }
        }
    })
 }

 $(document).ready( function () {
    $('#productsTable').DataTable();
} );