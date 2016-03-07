var _ = require('lodash');
var request = require('request');

var auth = {
  'sqtest-admin': {
    user: 'sqtest-admin@squared.example.com',
    pass: 'P@ssword123',
    org: '584cf4cd-eea7-4c8c-83ee-67d88fc6eab5'
  },
  'pbr-admin': {
    user: 'pbr-org-admin@squared2webex.com',
    pass: 'P@ssword123',
    org: '4214d345-7caf-4e32-b015-34de878d1158'
  },
  'partner-admin': {
    user: 'atlaspartneradmin@atlas.test.com',
    pass: 'P@ssword123',
    org: 'c054027f-c5bd-4598-8cd8-07c08163e8cd'
  },
  'partner-reports': {
    user: 'admin@sparkucreports-testpartner.com',
    pass: 'Cisco123!',
    org: 'd71b4d69-721a-41b1-ae4b-6e0305eab12b'
  },
  'partner-sales-user': {
    user: 'phtest77+salesadmin@gmail.com',
    pass: 'C1sc0123!',
    org: '7e268021-dc11-4728-b39d-9ba0e0abb5e0'
  },
  'pbr-admin-test': {
    user: 'pbr-org-admin-test@wx2.example.com',
    pass: 'C1sco123!',
    org: '4214d345-7caf-4e32-b015-34de878d1158'
  },
  'test-user': {
    user: 'atlasmapservice+ll1@gmail.com',
    pass: 'P@ssword123',
    org: '75653d2f-1675-415c-aa5d-c027233f68fe'
  },
  'huron-int1': {
    user: 'admin@int1.huron-alpha.com',
    pass: 'Cisco123!',
    org: '7e88d491-d6ca-4786-82ed-cbe9efb02ad2'
  },
  'huron-e2e': {
    user: 'admin@uc.e2e.huron-alpha.com',
    pass: 'Cisco123!',
    org: '30fdb01e-0bb2-4ed4-97f4-84a2289bdc79'
  },
  'huron-e2e-partner': {
    user: 'admin@ucpartner.e2e.huronalpha.com',
    pass: 'Cisco123!!',
    org: '666a7b2f-f82e-4582-9672-7f22829e728d'
  },
  'account-admin': {
    user: 'phtest77+acc2@gmail.com',
    pass: 'C1sc0123!',
    org: '58f01b76-2b3f-4c91-ad8a-e2af626fc7a5'
  },
  'non-trial-admin': {
    user: 'pbr-test-admin@squared2webex.com',
    pass: 'P@ssword123',
    org: '4214d345-7caf-4e32-b015-34de878d1158'
  },
  'invite-admin': {
    user: 'pbr-invite-user@squared2webex.com',
    pass: 'P@ssword123',
    org: '4214d345-7caf-4e32-b015-34de878d1158'
  },
  'support-admin': {
    user: 'sqtest-admin-support@squared.example.com',
    pass: 'P@ssword123',
    org: '584cf4cd-eea7-4c8c-83ee-67d88fc6eab5'
  },
  'media-super-admin': {
    user: 'super-admin@mfusion1webex.com',
    pass: 'C1sc0123!',
    org: 'baab1ece-498c-452b-aea8-1a727413c818'
  },
  'customer-support-admin': {
    user: 'admin@csreptestdom.collaborate.com',
    pass: 'P@ssword123',
    org: 'c1e59258-29e1-42d7-bfa7-84ab26632b46'
  },
  'customer-support-user': {
    user: 'regUser1@csreptestdom.collaborate.com',
    pass: 'C1sc0123!',
    org: 'c1e59258-29e1-42d7-bfa7-84ab26632b46'
  },
  'customer-regular-user': {
    user: 'regUser2@csreptestdom.collaborate.com',
    pass: 'P@ssword123',
    org: 'c1e59258-29e1-42d7-bfa7-84ab26632b46'
  },
  'multiple-subscription-user': {
    user: 'int-esub-1@mailinator.com',
    pass: 'C1sc0123!',
    org: '9d173ec9-198e-430d-9363-688a333bdee7'
  },
  'selfsign-sso-admin': {
    user: 'phtest77+dontdeleteme@gmail.com',
    pass: 'C1sc0123!',
    org: 'e9e33cac-eb07-4c34-8240-d08a43d0adce'
  },
  'mockcisco-support-user': {
    user: 'phtest77+testbilling@gmail.com',
    pass: 'C1sc0123!',
    org: 'd30a6828-dc35-4753-bab4-f9b468828688'
  },
  'contactcenter-admin': {
    user: 'sikkimadmn@outlook.com',
    pass: 'Cisco@123',
    org: '021fffdc-dd5e-49ca-b9d6-013445e3c3ae'
  }
};

var clientId = 'C80fb9c7096bd8474627317ee1d7a817eff372ca9c9cee3ce43c3ea3e8d1511ec';

var clientSecret = 'c10c371b4641010a750073b3c8e65a7fff0567400d316055828d3c74925b0857';

var getSSOToken = function (req, jar, creds, cb) {
  var opts;
  opts = {
    url: 'https://idbroker.webex.com/idb/UI/Login?org=' + creds.org,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: {
      IDToken1: creds.user,
      IDToken2: creds.pass
    }
  };
  return req.post(opts, function (err, res, body) {
    var cookie, token;
    if (err) {
      console.error(err, body);
      throw new Error('Failed to fetch SSO token from CI. Status: ' + (res != null ? res.statusCode : void 0));
    }
    cookie = _.find(res.headers['set-cookie'], function (c) {
      return c.indexOf('cisPRODAMAuthCookie') !== -1;
    });
    if (!cookie) {
      throw new Error('Failed to retrieve a cookie with org credentials. Status: ' + (res != null ? res.statusCode : void 0));
    }
    token = cookie.match(/cisPRODAMAuthCookie=(.*); Domain/)[1];
    jar.setCookie('cisPRODiPlanetDirectoryPro=' + token + ' ; path=/; domain=.webex.com', 'https://idbroker.webex.com/');
    return cb();
  });
};

var getAuthCode = function (req, creds, cb) {
  var opts, rand_str;
  rand_str = "";
  while (rand_str.length < 40) {
    rand_str += Math.random().toString(36).substr(2);
  }
  rand_str.substr(0, 40);
  opts = {
    url: 'https://idbroker.webex.com/idb/oauth2/v1/authorize',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: {
      response_type: 'code',
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
      client_id: clientId,
      scope: 'webexsquare:admin ciscouc:admin Identity:SCIM Identity:Config Identity:Organization ccc_config:admin',
      realm: '/' + creds.org,
      state: rand_str
    }
  };
  return req.post(opts, function (err, res, body) {
    var code, ref;
    if (err) {
      console.error(err, body);
      throw new Error('Failed to fetch Auth Code from CI. Status: ' + (res != null ? res.statusCode : void 0));
    }
    code = (ref = body.match(/<title>(.*)</)) != null ? ref[1] : void 0;
    if (!code) {
      console.error(body);
      throw new Error('Failed to extract Auth Code. Status: ' + (res != null ? res.statusCode : void 0));
    }
    return cb(code);
  });
};

var getAccessToken = function (req, code, cb) {
  var opts;
  opts = {
    url: 'https://idbroker.webex.com/idb/oauth2/v1/access_token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: {
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
    },
    auth: {
      user: clientId,
      pass: clientSecret
    }
  };
  return req.post(opts, function (err, res, body) {
    var e, obj;
    if (err) {
      console.error(err, body);
      throw new Error('Failed to fetch Access Token from CI. Status: ' + (res != null ? res.statusCode : void 0));
    }
    obj = (function () {
      try {
        return JSON.parse(body);
      } catch (_error) {
        e = _error;
        console.error(body);
        throw new Error('Failed to parse Access Token JSON. Status: ' + (res != null ? res.statusCode : void 0));
      }
    })();
    if (!(obj != null ? obj.access_token : void 0)) {
      console.error(body);
      throw new Error('Failed to extract Access Token. Status: ' + (res != null ? res.statusCode : void 0));
    }
    return cb(obj.access_token);
  });
};

module.exports = {
  getBearerToken: function (user, callback) {
    var creds, jar, req;
    creds = auth[user];
    if (!creds) {
      throw new Error('Credentials for ' + user + ' not found');
    }
    jar = request.jar();
    req = request.defaults({
      jar: jar
    });
    return getSSOToken(req, jar, creds, function () {
      return getAuthCode(req, creds, function (authCode) {
        return getAccessToken(req, authCode, callback);
      });
    });
  },
  parseJSON: function (data) {
    try {
      return JSON.parse(data);
    } catch (_error) {
      throw new Error('Unable to parse JSON: ' + data);
    }
  },
  auth: auth
};
