$(".choose").click(function() {
  $(".choose").addClass("active");
  $(".choose > .icon").addClass("active");
  $(".pay").removeClass("active");
  $(".pay > .icon").removeClass("active");
  $("#line").addClass("one");
  $("#line").removeClass("two");
})

$(".pay").click(function() {
  $(".pay").addClass("active");
  $(".pay > .icon").addClass("active");
  $(".choose").removeClass("active");
  $(".choose > .icon").removeClass("active");
  $("#line").addClass("two");
  $("#line").removeClass("one");
})

$(".choose").click(function() {
  $("#first").addClass("active");
  $("#second").removeClass("active");
})

$(".pay").click(function() {
  $("#first").removeClass("active");
  $("#second").addClass("active");
})