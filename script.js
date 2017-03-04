// Load placeholder image if profile picture is missing
function imgError(image) {
    image.onerror = "";
    image.src = "img/placeholder.png";
    return true;
}

// Smooth scrolling when clicking on a menu item
$(document).ready(function(){
  // Add smooth scrolling to all links in navbar + footer link
  $(".navbar a, footer a[href='#myPage']").on('click', function(event) {
    // Make sure this.hash has a value before overriding default behavior
    if (this.hash !== "") {
      // Prevent default anchor click behavior
      event.preventDefault();

      // Store hash
      var hash = this.hash;

      // Using jQuery's animate() method to add smooth page scroll
      // The optional number (900) specifies the number of milliseconds it takes to scroll to the specified area
      $('html, body').animate({
        scrollTop: $(hash).offset().top
      }, 900, function(){
   
        // Add hash (#) to URL when done scrolling (default click behavior)
        window.location.hash = hash;
      });
    } // End if
  });

// Close collapse menu on click
$('.navbar-collapse ul li a').click(function() {
  $('.navbar-toggle:visible').click();
});