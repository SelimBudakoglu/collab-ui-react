var WebExSiteListPage = function () {
  this.siteListPageId = element(by.id('site-list'));
  this.conferencingLink = element(by.css('a[href="#site-list"]'));
  this.license_MC200 = "Meeting Center 200";
  this.license_Multiple = "Multiple...";
};

module.exports = WebExSiteListPage;
