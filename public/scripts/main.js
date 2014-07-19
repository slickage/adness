$(document).ready(function() {
  // check if auction times exists
  var asExists = $('#auctionStart').length > 0;
  // check if the hidden time fields exists
  var ashExists = $('#hiddenAuctionStart').length > 0;
  
  if (asExists) {
    // initialize the datetimepicker ui
    $('#auctionStart').datetimepicker({ useStrict: true, sideBySide: true });
    $('#auctionEnd').datetimepicker({ useStrict: true, sideBySide: true });
    $('#adsStart').datetimepicker({ useStrict: true, sideBySide: true });
    $('#adsEnd').datetimepicker({ useStrict: true, sideBySide: true });
  }

  if (ashExists) {
    // set date time picker values
    var auctionStart = $('#hiddenAuctionStart').val();
    var auctionEnd = $('#hiddenAuctionEnd').val();
    var adsStart = $('#hiddenAdsStart').val();
    var adsEnd = $('#hiddenAdsEnd').val();
    setDateTime(auctionStart, auctionEnd, adsStart, adsEnd);
  }
  else if (asExists) {
    // set default picker values
    setDateTime();
  }
});

// admin.ejs & auctionEdit.ejs

$('#addRegionButton').on('click', addRegion);
function addRegion() {
  // get all existing regions
  var regions = gatherRegions();

  // check that region isn't already used
  var regionName = $('#auctionRegion').val();
  var matchFound = false;
  regions.forEach(function(region) {
    if (region.name === regionName) {
      matchFound = true;
    }
  });
  if (matchFound) {
    $('#errorText').text(regionName + ' is already included.');
    return;
  }

  // check that slots is a valid number
  var slots = $('#slots').val();
  var slotsIsNumber = !isNaN(parseFloat(slots)) && isFinite(slots);
  if (!slotsIsNumber) {
    $('#errorText').text('Slots must be a number');
    return;
  }

  if (slotsIsNumber && slots < 1) {
    $('#errorText').text('Slots cannot be negative or zero');
    return;
  }

  // add region to the table to the table
  var html = '<tr><td>';
  html += regionName;
  html += '</td><td>';
  html += slots;
  html += '</td>';
  html += '<td class="text-center">';
  html += '<button class="btn btn-xs btn-danger">';
  html += '<span class="glyphicon glyphicon-remove"></span></button></td>';
  html += '</tr>';
  $('#regionsTable tbody').append(html);

  // append click handler to last tr in regionsTable
  $('#regionsTable tbody tr:last-child .btn').on('click', removeRegion);
}

// append click handler to last tr in regionsTable
$('#regionsTable tbody tr').on('click', removeRegion);
function removeRegion(element) {
  var parentRow = $(element.target).closest('tr');
  parentRow.remove();
}

function gatherRegions() {
  var regions = [];

  // get all row in the regions table
  $('#regionsTable tbody tr').each(function(index, value) {
    var regionName = $(this).find('td:nth-child(1)').text();
    var slots = Number($(this).find('td:nth-child(2)').text());

    // build region json object
    var region = { name: regionName, slots: slots };
    regions.push(region);
  });

  return regions;
}

function setDateTime(auctionStart, auctionEnd, adsStart, adsEnd) {
  if (auctionStart && auctionEnd && adsStart && adsEnd) {
    var newAuctionStart = moment.utc(Number(auctionStart));
    $('#auctionStart').data('DateTimePicker').setDate(newAuctionStart);

    var newAuctionEnd = moment.utc(Number(auctionEnd));
    $('#auctionEnd').data('DateTimePicker').setDate(newAuctionEnd);

    var newAdsStart = moment.utc(Number(adsStart));
    $('#adsStart').data('DateTimePicker').setDate(newAdsStart);

    var newAdsEnd = moment.utc(Number(adsEnd));
    $('#adsEnd').data('DateTimePicker').setDate(newAdsEnd);
  }
  else {
    // auction start is one day ahead midnight
    var defaultAuctionStart = moment.utc();
    defaultAuctionStart.date(defaultAuctionStart.date()+1);
    defaultAuctionStart.hours(0);
    defaultAuctionStart.minutes(0);
    defaultAuctionStart.seconds(0);
    defaultAuctionStart.milliseconds(0);
    $('#auctionStart').data('DateTimePicker').setDate(defaultAuctionStart);

    // auction end is three days ahead midnight
    var defaultAuctionEnd = moment.utc();
    defaultAuctionEnd.date(defaultAuctionEnd.date()+3);
    defaultAuctionEnd.hours(0);
    defaultAuctionEnd.minutes(0);
    defaultAuctionEnd.seconds(0);
    defaultAuctionEnd.milliseconds(0);
    $('#auctionEnd').data('DateTimePicker').setDate(defaultAuctionEnd);

    // ads start is two days ahead midnight of auction end 
    var defaultAdsStart = moment.utc();
    defaultAdsStart.date(defaultAdsStart.date()+5);
    defaultAdsStart.hours(0);
    defaultAdsStart.minutes(0);
    defaultAdsStart.seconds(0);
    defaultAdsStart.milliseconds(0);
    $('#adsStart').data('DateTimePicker').setDate(defaultAdsStart);

    // ads end is seven days ahead midnight of adsStart
    var defaultAdsEnd = moment.utc();
    defaultAdsEnd.date(defaultAdsEnd.date()+12);
    defaultAdsEnd.hours(0);
    defaultAdsEnd.minutes(0);
    defaultAdsEnd.seconds(0);
    defaultAdsEnd.milliseconds(0);
    $('#adsEnd').data('DateTimePicker').setDate(defaultAdsEnd);
  }
}

function auctionValidation() {
  // Initial input validation
  var auctionStart;
  var auctionStartDate = $('#auctionStart').data('DateTimePicker').getDate();
  // auctionStartDate is in local timezone so convert to UTC
  if (auctionStartDate) {
    auctionStart = moment.utc();
    auctionStart.year(auctionStartDate.year());
    auctionStart.month(auctionStartDate.month());
    auctionStart.date(auctionStartDate.date());
    auctionStart.hours(auctionStartDate.hours());
    auctionStart.minutes(auctionStartDate.minutes());
    auctionStart.seconds(auctionStartDate.seconds());
    auctionStart.milliseconds(auctionStartDate.milliseconds());
    auctionStart = auctionStart.valueOf();
  }
  else { return alert('Auction Start Date/Time doesn\'t look right.'); }

  var auctionEnd;
  var auctionEndDate = $('#auctionEnd').data('DateTimePicker').getDate();
  // auctionEndDate is in local timezone so convert to UTC
  if (auctionEndDate) {
    auctionEnd = moment.utc();
    auctionEnd.year(auctionEndDate.year());
    auctionEnd.month(auctionEndDate.month());
    auctionEnd.date(auctionEndDate.date());
    auctionEnd.hours(auctionEndDate.hours());
    auctionEnd.minutes(auctionEndDate.minutes());
    auctionEnd.seconds(auctionEndDate.seconds());
    auctionEnd.milliseconds(auctionEndDate.milliseconds());
    auctionEnd = auctionEnd.valueOf();
  }
  else { return alert('Auction End Date/Time doesn\'t look right.'); }

  var adsStart;
  var adsStartDate = $('#adsStart').data('DateTimePicker').getDate();
  // adsStartDate is in local timezone so convert to UTC
  if (adsStartDate) {
    adsStart = moment.utc();
    adsStart.year(adsStartDate.year());
    adsStart.month(adsStartDate.month());
    adsStart.date(adsStartDate.date());
    adsStart.hours(adsStartDate.hours());
    adsStart.minutes(adsStartDate.minutes());
    adsStart.seconds(adsStartDate.seconds());
    adsStart.milliseconds(adsStartDate.milliseconds());
    adsStart = adsStart.valueOf();
  }
  else { return alert('Ads Start Date/Time doesn\'t look right.'); }

  var adsEnd;
  var adsEndDate = $('#adsEnd').data('DateTimePicker').getDate();
  // adsEndDate is in local timezone so convert to UTC
  if (adsEndDate) {
    adsEnd = moment.utc();
    adsEnd.year(adsEndDate.year());
    adsEnd.month(adsEndDate.month());
    adsEnd.date(adsEndDate.date());
    adsEnd.hours(adsEndDate.hours());
    adsEnd.minutes(adsEndDate.minutes());
    adsEnd.seconds(adsEndDate.seconds());
    adsEnd.milliseconds(adsEndDate.milliseconds());
    adsEnd = adsEnd.valueOf();
  }
  else { return alert('Ads End Date/Time doesn\'t look right.'); }

  // check that auction start datetime is valid
  var auctionStartValid = !isNaN(parseFloat(auctionStart)) && isFinite(auctionStart);
  if (auctionStartValid === false) {
    alert('The Auction Start date/time is not valid.');
    return false;
  }

  // check that auction end datetime is valid
  var auctionEndValid = !isNaN(parseFloat(auctionEnd)) && isFinite(auctionEnd);
  if (auctionEndValid === false) {
    alert('The Auction End date/time is not valid.');
    return false;
  }

  // check that auction end is not before auction start
  if (auctionEnd < auctionStart) {
    alert('The Auction End date/time is before Auction Start date/time.');
    return false;
  }

  // check that ads start datetime is valid
  var adsStartValid = !isNaN(parseFloat(adsStart)) && isFinite(adsStart);
  if (adsStartValid === false) {
    alert('The Ads Start date/time is not valid.');
    return false;
  }

  // check that ads end datetime is valid
  var adsEndValid = !isNaN(parseFloat(adsEnd)) && isFinite(adsEnd);
  if (adsEndValid === false) {
    alert('The Ads End date/time is not valid.');
    return false;
  }

  // check that ads end is not before ads start
  if (adsEnd < adsStart) {
    alert('The Ads End date/time is before Ads Start date/time.');
    return false;
  }

  // check that ads Start is not before Auction end datetime
  if (adsStart < auctionEnd) {
    alert('The Ads Start date/time is before Auction End date/time.');
    return false;
  }

  // auction description
  var description = $('#auctionDescription').val();
  function urlX(url) { if(/^https?:\/\//.test(url)) { return url; }}
  function idX(id) { return id; }
  var parsedHtml = html_sanitize(description, urlX, idX);

  return {
    auctionStart: auctionStart,
    auctionEnd: auctionEnd,
    adsStart: adsStart,
    adsEnd: adsEnd,
    description: parsedHtml
  };
}

function validateRegions(regions) {
  var valid = true;

  if (regions.length < 1) { valid = false; }

  if (valid === false) {
    alert('At least one region is required.');
  }

  return valid;
}

// append click handler to all submit auction buttons
$('.submitAuction').on('click', submitAuction);
function submitAuction() {
  // input validation
  var valid = auctionValidation();
  if(!valid) { return; }

  // grab region
  var regions = gatherRegions();
  var regionsValid = validateRegions(regions);
  if (!regionsValid) { return; }

  // ajax post call to server to create auction
  $.ajax({
    type: 'POST',
    url: '/sb/auctions',
    data: {
      start: valid.auctionStart,
      end: valid.auctionEnd,
      adsStart: valid.adsStart,
      adsEnd: valid.adsEnd,
      description: valid.description,
      regions: regions
    },
    success: function() {
      location.reload();
    },
    error: function() {
      alert('There was an error creating the auction.');
    }
  });
}

// append click handler to all update auction buttons
$('.updateAuction').on('click', updateAuction);
function updateAuction() {
  // input validation
  var valid = auctionValidation();
  if(!valid) { return; }

  // grab auction enabled
  var id = $('#auctionId').val();
  var enabled = $('#auctionEnabled').prop('checked');

  // grab region
  var regions = gatherRegions();
  var regionsValid = validateRegions(regions);
  if (!regionsValid) { return; }

  // ajax post call to server to create auction
  $.ajax({
    type: 'POST',
    url: '/sb/auctions/edit',
    data: {
      auctionId: id,
      start: valid.auctionStart,
      end: valid.auctionEnd,
      adsStart: valid.adsStart,
      adsEnd: valid.adsEnd,
      description: valid.description,
      regions: regions,
      enabled: enabled
    },
    success: function() {
      window.location.replace('http://' + window.location.host + '/admin');
    },
    error: function() {
      alert('There was an error updating the auction.');
    }
  });
}

// append click handler to all enable auction links
$('.enableAuctionLink').on('click', auctionEnable);
function auctionEnable(event) {
  event.preventDefault();
  var link = event.target;
  var auctionId = $(link).data("id");
  $.post('/sb/auctions/enable/' + auctionId,
    function(data) { location.reload(); });
}

// append click handler to all disable auction links
$('.disableAuctionLink').on('click', auctionDisable);
function auctionDisable(event) {
  event.preventDefault();
  var link = event.target;
  var auctionId = $(link).data("id");
  $.post('/sb/auctions/disable/' + auctionId,
    function(data) { location.reload(); });
}

// append click handler to the deleteAuctionButton
$('#deleteAuctionButton').on('click', auctionDelete);
function auctionDelete() {
  var auctionId = $("#deleteAuctionId").val();
  $.ajax({
    url: '/sb/auctions/' + auctionId,
    type: "DELETE",
    success: function(data) { location.reload(); },
    error: function(err) {
      alert("There was an issue deleting this auction.");
      console.log(err);
    }
  });
}

// append click handler to all load delete auction links
$('.loadDeleteAuction').on('click', loadDeleteAuction);
function loadDeleteAuction(event) {
  event.preventDefault();
  var link = event.target;
  var auctionId = $(link).data("id");
  $('#deleteAuctionId').val(auctionId);
  $('#deleteAuctionModal').modal('show');
}

// approvedAds.ejs & rejectedAds.ejs & reviewAds.ejs

// append click handler to all approveAd button
$('.approveAd').on('click', approveAd);
function approveAd(element) {
  var button = element.target;
  var adId = $(button).data("id");
  $.post('/sb/ads/' + adId + '/approve',
    function(data) { location.reload(); });
}

// append click handler to all approveAd button
$('.rejectAd').on('click', rejectAd);
function rejectAd(element) {
  var button = element.target;
  var adId = $(button).data("id");
  $.post('/sb/ads/' + adId + '/reject',
    function(data) { location.reload(); });
}

// factoids.ejs

$('#addFactoidButton').on('click', addFact);
function addFact() {
  // get current user from hidden input
  var username = $('#addFactoidUsername').val();

  // get textarea text
  var factElement = document.getElementById('newFact');
  var newFacts = factElement.value;
  
  // separate each fact by newline
  var factArray = newFacts.split('\n');

  // clear table if contents is only No Current Facts
  $('#factTable tbody tr').each(function(index, value) {
    var fact = $(this).find('td:nth-child(1)').text();
    // remove "No Current Facts"
    if (fact === 'No Current Facts') { $(this).remove(); }
  });

  // add each fact 
  factArray.forEach(function(fact) {
    // add each one to the table
    var html = '<tr><td>';
    html += fact;
    html += '</td><td>';
    html += username;
    html += '</td>';
    html += '<td>';
    html += '<button class="btn btn-xs btn-danger">';
    html += '<span class="glyphicon glyphicon-remove"></span></button></td>';
    html += '</tr>';
    $('#factTable tbody').append(html);
  });

  // append click handler to last tr in regionsTable
  $('#factTable tbody tr:last-child .btn').on('click', removeFact);

  // clear input
  factElement.value = '';
}

// append click handler to last tr in factTable
$('#factTable tbody tr').on('click', removeFact);
function removeFact(element) {
  var parentRow = $(element.target).closest('tr');
  parentRow.remove();
}

// append click handler to the updateFacts Button
$('#updateFactsButton').on('click', updateFacts);
function updateFacts() {
  var url = "/admin/ads/factoids";

  // get html 
  var rawHtml = document.getElementById('html').value;
  function urlX(url) { if(/^https?:\/\//.test(url)) { return url; }}
  function idX(id) { return id; }
  var html = html_sanitize(rawHtml, urlX, idX);
  // validate html for text include
  var textIndex = html.indexOf('%- text %');
  if (textIndex < 0) {
    var error = "HTML does not have a &lt;%- text %&gt; in it.";
    error = error.replace("&lt;", "<").replace("&gt;", ">");
    alert(error);
    return;
  }

  // get css
  var css = document.getElementById('css').value;

  // get all the facts
  var list = [];
  $('#factTable tbody tr').each(function(index, value) {
    var fact = $(this).find('td:nth-child(1)').text();
    var user = $(this).find('td:nth-child(2)').text();

    // build region json object
    var factoid = { text: fact, user: user };
    list.push(factoid);
  });

  // build data object
  var data = {
    html: html,
    css: css,
    list: list
  };

  // send request
  $.ajax({
    type: "POST",
    url: url,
    data: data,
    success: function(data) {
      window.location = "/admin/ads/factoids";
    },
    error: function() {
      var message = "There was a problem updating factoids.\n";
      message += data;
      alert(message);
    }
  });
}

// reservedAds.ejd

// append click handler to the deleteReservedAd Button
$('#deleteReservedAdButton').on('click', deleteAd);
function deleteAd(element) {
  var button = element.target;
  var adId = $(button).data("id");

  var url = "/admin/ads/reserved/" + adId;

  $.ajax({
    type: "DELETE",
    url: url,
    success: function(data) {
      window.location = "/admin/ads/reserved";
    },
    error: function() {
      var message = "There was a problem trying to delete this ad.\n";
      message += data;
      alert(message);
    }
  });
}

// auction_show.ejs

// append click handler to the load delete bid button
$('.loadDeleteBid').on('click', loadDeleteBid);
function loadDeleteBid(element) {
  var button = element.target;
  if (button.tagName === 'SPAN') {
    button = button.parentNode;
  }
  var bidId = $(button).data("id");
  $('#deleteBidId').val(bidId);
  $('#deleteBidModal').modal('show');
}

// append click handler to the load delete bid button
$('#deleteBidButton').on('click', deleteBid);
function deleteBid() {
  var bidId = $("#deleteBidId").val();

  $.ajax({
    url: "/sb/bids/" + bidId,
    type: "DELETE",
    success: function(data) {
      $('#deleteBidModal').modal('hide');

      var message = "";
      if (data && data.length > 0) {
        message = "Here is a list of invoices affected: \n";
        data.forEach(function(datum) {
          message += datum + '\n';
        });
      }
      else {
        message = "No Invoices were affected by this invalidation.";
      }
      alert(message);
      
      location.reload();
    },
    error: function(err) {
     alert("There was an issue deleting this bid.\n" + err.message);
     console.log(err);
    }
  });
}

// append click handler to the recalcAuction button
$('#recalAuctionButton').on('click', recalculateAuction);
function recalculateAuction(element) {
  var button = element.target;
  if (button.tagName === 'SPAN') {
    button = button.parentNode;
  }
  var auctionId = $(button).data("id");

  $.ajax({
    url: "/admin/auctions/recalculate/" + auctionId,
    type: "POST",
    success: function(data) {
      alert("Auction has been re-calculated.");
      location.reload();
    },
    error: function(err) {
     alert("There was an issue recalculating this auction.");
     console.log(err);
    }
  });
}
