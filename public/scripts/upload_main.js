// global vars
var htmlCodeMirror;
var cssCodeMirror;

// on document ready
$( document ).ready(function() {
  // set up code mirror for the html textarea
  var textArea = document.getElementById("upload-code");
  htmlCodeMirror = CodeMirror.fromTextArea(textArea, {
    mode:  "htmlmixed",
    indentWithTabs: false,
    tabSize: 2,
    lineNumbers: true
  });
  htmlCodeMirror.setSize(null, 150);
  // on change event: update preview and clean html
  htmlCodeMirror.on("change", function(cm, change) { convert(); });

  // set up code mirror for the css textarea
  var textAreaCSS = document.getElementById("upload-css");
  cssCodeMirror = CodeMirror.fromTextArea(textAreaCSS, {
    mode:  "htmlmixed",
    indentWithTabs: false,
    tabSize: 2,
    lineNumbers: true
  });
  cssCodeMirror.setSize(null, 150);
  // on change event: update preview and clean html
  cssCodeMirror.on("change", function(cm, change) { convert(); });

  // call convert on page load
  convert();
});

function convert() {
  // add CSS to head of this page
  // raw css
  var raw_css = cssCodeMirror.getValue();
  // style tag in head
  var cssHolder = $('style[title="temp css"]');
  if (cssHolder.length) {
    cssHolder.empty();
    cssHolder.html(raw_css);
  }
  else {
    // style doesn't exist so create it
    var head = document.getElementsByTagName('head')[0];
    var css = document.createElement('style');
    css.title = 'temp css';
    css.type = 'text/css';
    css.innerHTML = raw_css;
    head.appendChild(css);
  }

  // scrub the raw html for any security leaks
  var raw_html = htmlCodeMirror.getValue();
  function urlX(url) { if(/^https?:\/\//.test(url)) { return url; }}
  function idX(id) { return id; }
  var parsedHtml = html_sanitize(raw_html, urlX, idX);

  // inject the parsed html into the page
  var preview = document.getElementById('preview');
  preview.innerHTML = parsedHtml;
}

// append click handler the submit ad buttons
$('.submitAd').on('click', submitForReview);
function submitForReview() {
  var button = event.target;
  var submit = $(button).data("submit");
  
  var html = $("#preview").html();
  var css = cssCodeMirror.getValue();

  // get blacklist values
  var regions = [];
  $('.region').each(function(index, value) {
    if ($(value).prop('checked')) { regions.push(value.id); }
  });
  if (regions.length === 0) {
    alert('You need to add at least one region.');
    return;
  }

  // csrf
  var csrf = $('#_csrf').val();

  var data = {
    _csrf: csrf,
    submitted: submit,
    css: css,
    html: html,
    regions: regions
  };

  var adId = $('#adId').val();
  var userId = $('#userId').val();
  var url = "/sb/ads/";
  if (adId.length > 0) { url = url + adId; }

  if (!userId || userId.length === 0) {
    alert("You must be signed in to save an ad.");
    return;
  }

  $.ajax({
    type: "POST",
    url: url,
    data: data,
    success: function(data) {
      window.location="/sb/users/" + userId;
    }
  });
}

// append click handler to the submit reserved ad buttons
$('.submitReservedAd').on('click', submitReservedAd);
function submitReservedAd() {
  var button = event.target;
  var in_use = $(button).data("use");

  var html = $("#preview").html();
  var css = cssCodeMirror.getValue();

  // get blacklist values
  var regions = [];
  $('.region').each(function(index, value) {
    if ($(value).prop('checked')) { regions.push(value.id); }
  });
  if (regions.length === 0) {
    alert('You need to add at least one region.');
    return;
  }

  // csrf
  var csrf = $('#_csrf').val();

  var data = {
    _csrf: csrf,
    in_use: in_use,
    css: css,
    html: html,
    regions: regions
  };

  var adId = $('#adId').val();
  var userId = $('#userId').val();
  var url = "/admin/ads/reserved/";
  if (adId.length > 0) { url = url + adId; }

  if (!userId || userId.length === 0) {
    alert("You must be signed in to save an ad.");
    return;
  }

  $.ajax({
    type: "POST",
    url: url,
    data: data,
    success: function(data) {
      window.location = "/admin/ads/reserved";
    }
  });
}