var app = function () {
  var that = this;
  this.loginPopup = function () {
    that.loginPopupUri(that.config.authorize_uri, that.config.redirect_uri);
  }
  this.loginPopupUri = function (authUri, redirectUri) {
    var win = window.open(authUri, 'Login Window', 'width=800, height=800');
    var pollOAuth = window.setInterval(function () {
        try {
          console.log(win.document.URL);
          if (win.document.URL.indexOf(redirectUri) != -1) {
            window.clearInterval(pollOAuth);
            win.close();
            $.ajax({
              method: "GET",
              dataType: 'json',
              url: redirectUri,
              contentType: 'application/json',
              success: function (data, textStatus, jQxhr) {
                that.loggedInPageDisplay();
              },
              error: function (jqXhr, textStatus, errorThrown) {
                that.displayErrorMessage(`Error in loging in with status ${textStatus}`);
              }

            });

          }
        } catch (e) {
          console.log(e)
        }
      }, 100);
  }
  this.loadCallHistory = function () {
   that.loadSpinner();
    var from = $("#dateFrom").val();
    var to = $("#dateTo").val();
    if (!from) {
      from = this.getLastYearDate();
    }
    if (!to) {
      to = this.getNextYearDate();
    }
    if(!that.validateDate(from)){
      that.displayErrorMessage("Please enter proper From date eg 2018-10-10");
      return;
    }
    if(!that.validateDate(to)){
      that.displayErrorMessage("Please enter proper To date eg 2018-10-10");
      return;
    }
    var postData = {
      dateFrom: from,
      dateTo: to
    };
    $.ajax({
      method: "POST",
      dataType: 'json',
      url: "/callhistory",
      data: JSON.stringify(postData),
      contentType: 'application/json',
      success: function (data, textStatus, jQxhr) {
        if (data.data.length > 0) {
          var output = Mustache.render("<table class=\"table\" id=\"call-log-table\">" +
              "<thead>" +
              "<tr>" +
              "<th scope=\"col\">#</th>" +
              "<th scope=\"col\">Start time</th>" +
              "<th scope=\"col\">Duration</th>" +
              " <th scope=\"col\">Type</th>" +
              "<th scope=\"col\">Direction</th>" +
              "<th scope=\"col\">Action</th>" +
              "<th scope=\"col\">Result</th>" +
              "<th scope=\"col\">To</th>" +
              "<th scope=\"col\">From</th>" +
              "</tr>" +
              "</thead>" +
              "{{#data}}" +
              "<tr>" +
              "<td>{{id}}</td>" +
              "<td>{{startTime}}</td>" +
              "<td>{{duration}}</td>" +
              "<td>{{type}}</td>" +
              "<td>{{direction}}</td>" +
              "<td>{{action}}</td>" +
              "<td>{{result}}</td>" +
              "<td>{{to.phoneNumber}}</td>" +
              "<td>{{from.name}}</td>" +
              "</tr>" +
              "{{/data}}" +
              "</table>", data);
          $('#main-content').html(output);
        } else {
          that.displayErrorMessage(`No data found !!!`);
        }
      },
      error: function (jqXhr, textStatus, errorThrown) {
        that.displayErrorMessage(`Loading call log failed with status ${textStatus}`);
      }
    });
  }

  this.makeRingOut = function () {
    that.loadSpinner();
    var fromPhone=$("#callFrom").val();
    var toPhone=$("#callTo").val();
    if(!that.validatePhone(fromPhone)){
     that.displayErrorMessage("Please enter proper Call From phone number eg 6502283406");
     return;
    }
    if(!that.validatePhone(toPhone)){
      that.displayErrorMessage("Please enter proper Call To phone number eg 6502283406");
      return;
    }
    var postData = {
      from: fromPhone,
      to: toPhone
    };
    $.ajax({
      method: "POST",
      dataType: 'json',
      url: "/ringout",
      data: JSON.stringify(postData),
      contentType: 'application/json'
    })
    .done(function (data) {
      var output = Mustache.render("<div class=\"alert alert-success\" role=\"alert\" id=\"status-bar\">" +
          "<ul>" +
          "<li>Call Status => {{callStatus}} </li>" +
          "<li>Caller Status => {{callerStatus}}</li>" +
          "<li>Callee Status => {{calleeStatus}}</li>" +
          "</ul>" +
          "</div>", data);
      $('#main-content').html(output);
    }).fail(function (jqXHR, textStatus) {
      that.displayErrorMessage(`Ring out failed with status ${textStatus}`);
    });
  }

  this.validateLogin = function () {
    $("#loadCallLog").hide();
    $("#loadRingOut").hide();
    $.ajax({
      method: "GET",
      dataType: 'json',
      url: "/validatelogin",
      contentType: 'application/json',
      success: function (data, textStatus, jQxhr) {
        that.config = data.config;
        if (data.logggedin) {
          that.loggedInPageDisplay();
        }
      },
      error: function (jqXhr, textStatus, errorThrown) {
        alert("Request failed: " + textStatus);
      }

    });

  }
  this.getLastYearDate = function () {
    var date = new Date(Date.now());
    return `${date.getFullYear()-1}-${(date.getMonth()<9?('0'+date.getMonth()):date.getMonth())}-${(date.getDate()<9?('0'+date.getMonth()):date.getDate())}`;
  }
  this.getNextYearDate = function () {
    var date = new Date(Date.now());
    return `${date.getFullYear()+1}-${(date.getMonth()<9?('0'+date.getMonth()):date.getMonth())}-${(date.getDate()<9?('0'+date.getMonth()):date.getDate())}`;
  }

  this.loginPageDisplay = function () {
    $("#callLog").hide();
    $("#ringOut").hide();
  }

  this.loggedInPageDisplay = function () {
    $("#loginButton").hide();
    $("#loadCallLog").show();
    $("#loadRingOut").show();
  }

  this.callLogDisplay = function () {
    $("#callLog").toggle();
    $("#status-bar").hide();
    $("#ringOut").hide();
  }

  this.ringOutDisplay = function () {
    $("#callLog").hide();
    $("#call-log-table").hide();
    $("#ringOut").toggle();
  }

  this.displayErrorMessage = function (message) {
    var output = Mustache.render("<div class=\"alert alert-danger\" role=\"alert\" id=\"call-log-table\">" +
        message +
        "</div>");
    $('#main-content').html(output);
  }

  this.loadSpinner=function(){
     $('#main-content').html("<i class=\"fa fa-spinner fa-spin fa-3x\">&nbsp</i>");
  }
  
  this.validatePhone=function(phoneNumber){    
     return phoneNumber.match(/^\d{10}$/);
  }

  this.validateDate=function(date){    
    return date.match(/^\d{4}-\d{2}-\d{2}$/);
  }
  
}