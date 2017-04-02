$(document).ready(function() {
  $('#minimize-btn').on('click', function() {
    var element = document.getElementById('minimize-btn');
    if(element.classList.contains('glyphicon-chevron-up')) {
      minimize();
    } else {
      maximize();
    }
    
  });
});

function minimize(){
  $('#minimize-btn').removeClass('glyphicon-chevron-up');
  $('#minimize-btn').addClass('glyphicon-chevron-down');
  $( "#right-panel" ).animate({
    height: "24px"
  }, 200, function() {
    // Animation complete.
  });
  //$('#right-panel').css("height", "24px");
}

function maximize(){
  $('#minimize-btn').removeClass('glyphicon-chevron-down');
  $('#minimize-btn').addClass('glyphicon-chevron-up');
  $('#right-panel').css("height", "");
}