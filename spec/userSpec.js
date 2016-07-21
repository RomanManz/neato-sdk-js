describe("Neato User", function () {

  describe("#initialize", function () {
    var user;

    it("sets defaults", function () {
      user = new Neato.User();
      expect(user.host).toEqual("beehive.neatocloud.com");
    });

    describe("when location includes access token", function () {
      var redirect_url_hash = "#access_token=f9fbd7c3c2f5d9373ea22967c252bc17a0e755aeaec8fff0e0752934b0897b70&token_type=bearer&expires_in=1209600";

      beforeEach(function () {
        document.location.hash = redirect_url_hash;
        user = new Neato.User();
      });

      it("sets the user's access token", function () {
        expect(user.token).toEqual("f9fbd7c3c2f5d9373ea22967c252bc17a0e755aeaec8fff0e0752934b0897b70");
      });

      it("does not set authError", function () {
        expect(typeof(user.authError)).toEqual("undefined");
      });

      it("does not set authErrorDescription", function () {
        expect(typeof(user.authErrorDescription)).toEqual("undefined");
      });
    });
  });

  describe("#isConnected", function () {
    var user = new Neato.User();

    it("calls __sessionsCheck", function () {
      var mock = $.Deferred();
      spyOn(user, "__sessionsCheck").and.returnValue(mock);

      user.isConnected();

      expect(user.__sessionsCheck).toHaveBeenCalled();
    });

    describe("when response http code is success", function() {

      var respondWithSuccess = function() {
        mostRecentAjaxRequest().respondWith({
          status: 200,
          responseText: '{"some": "response"}'
        });
      };

      it("sets the connected property to true", function() {
        user.isConnected();
        respondWithSuccess();

        expect(user.connected).toEqual(true);
      });
    });

    describe("when response http code is failure", function() {
      var respondWithFailure = function () {
        mostRecentAjaxRequest().respondWith({
          status: 401,
          responseText: '{"some": "response"}'
        });
      };

      it("sets the connected property to false and set the token error properties", function () {
        user.token = "123";
        user.isConnected();
        respondWithFailure();

        expect(user.connected).toEqual(false);
      });

    });
  });

  describe("#authenticationError", function () {
    var user = new Neato.User()
      , error = "my-error";

    it("return true is authError exists", function () {
      user.authError = error;
      expect(user.authenticationError()).toEqual(true);
    });

    it("return false is authError is null or undefined", function () {
      user.authError = undefined;
      expect(user.authenticationError()).toEqual(false);
      user.authError = null;
      expect(user.authenticationError()).toEqual(false);
    });
  });

  describe("#login", function () {
    var user = new Neato.User()
      , host = user.host
      , client_id = "123"
      , scopes = "my-scopes"
      , redirect_url = "my-url";

    it("navigates to the proper authentication url", function () {
      user = new Neato.User();
      spyOn(user, "__navigateToURL")
      user.login({
        client_id: client_id,
        scopes: scopes,
        redirect_url: redirect_url
      });

      var expected_auth_url = "https://" + host + "/oauth2/authorize?client_id=" + client_id + "&scope=" + scopes + "&response_type=token&redirect_uri=" + redirect_url;
      expect(user.__navigateToURL).toHaveBeenCalledWith(expected_auth_url);
    });
  });

  describe("#getRobots", function () {
    var user = new Neato.User();

    it("calls Beehive with the correct params", function () {
      var mock = $.Deferred();
      spyOn(user, "__call").and.returnValue(mock);
      user.getRobots();
      expect(user.__call).toHaveBeenCalledWith("GET", "/users/me/robots");
    });
  });

  describe("#__call", function () {
    var path = "/users/me",
      user;

    beforeEach(function () {
      var redirect_url_hash = "#access_token=1234567890";

      document.location.hash = redirect_url_hash;
      user = new Neato.User();
    });

    describe("the POST request", function () {
      var request;

      beforeEach(function () {
        jasmine.clock().install();

        var requestDate = new Date("September 15, 2015 15:25:12 GMT");
        jasmine.clock().mockDate(requestDate);

        user.__call("POST", path, {key: "value"});
        request = mostRecentAjaxRequest();
      });

      afterEach(function () {
        jasmine.clock().uninstall();
      });

      it("calls Beehive with the proper url and method", function () {
        expect(request.url).toBe("https://beehive.neatocloud.com/users/me");
        expect(request.method).toBe("POST");
      });

      it("calls Beehive with the proper headers", function () {
        expect(request.requestHeaders["Accept"]).toEqual("application/vnd.neato.beehive.v1+json");
        expect(request.requestHeaders["X-Date"]).toEqual("Tue, 15 Sep 2015 15:25:12 GMT");
        expect(request.requestHeaders["Authorization"]).toEqual("Bearer 1234567890");
      });

      it("calls Beehive with the proper body", function () {
        expect(request.params).toEqual('{"key":"value"}');
      });
    });

    describe("the GET request", function () {
      var request;

      beforeEach(function () {
        jasmine.clock().install();

        var requestDate = new Date("September 15, 2015 15:25:12 GMT");
        jasmine.clock().mockDate(requestDate);

        user.__call("GET", path);
        request = mostRecentAjaxRequest();
      });

      afterEach(function () {
        jasmine.clock().uninstall();
      });

      it("calls Beehive with the proper url and method", function () {
        expect(request.url).toBe("https://beehive.neatocloud.com/users/me");
        expect(request.method).toBe("GET");
      });

      it("calls Beehive with the proper headers", function () {
        expect(request.requestHeaders["Accept"]).toEqual("application/vnd.neato.beehive.v1+json");
        expect(request.requestHeaders["X-Date"]).toEqual("Tue, 15 Sep 2015 15:25:12 GMT");
        expect(request.requestHeaders["Authorization"]).toEqual("Bearer 1234567890");
      });

      it("calls Beehive with the proper body", function () {
        expect(request.params).toEqual(null);
      });
    });

    describe("when response http code is success", function () {
      var respondWithSuccess = function () {
        mostRecentAjaxRequest().respondWith({
          status: 200,
          responseText: '{"some": "response"}'
        });
      };

      it("calls the #done method of the returned deferred object with the correct context", function () {
        var testUser;
        user.__call("POST", "/users/me", {key: "value"}).done(function (result, data) {
          testUser = this;
        });
        respondWithSuccess();

        expect(testUser).toBe(user);
      });

      it("does not call the #fail method", function () {
        var failCallback = jasmine.createSpy("failCallback");

        user.__call("POST", "/users/me", {key: "value"}).fail(failCallback);
        respondWithSuccess();

        expect(failCallback).not.toHaveBeenCalled();
      });
    });

    describe("when response http code is NOT success", function () {
      var respondWithoutSuccess = function () {
        mostRecentAjaxRequest().respondWith({
          status: 404,
          responseText: '{"some": "response"}'
        });
      };

      it("does not call the #done method", function () {
        var doneCallback = jasmine.createSpy("doneCallback");

        user.__call("POST", "/users/me", {key: "value"}).done(doneCallback);
        respondWithoutSuccess();

        expect(doneCallback).not.toHaveBeenCalled();
      });

      it("does call the #fail method", function () {
        var failCallback = jasmine.createSpy("failCallback");

        user.__call("POST", "/users/me", {key: "value"}).fail(failCallback);
        respondWithoutSuccess();

        expect(failCallback).toHaveBeenCalled();
      });
    });

  });
});