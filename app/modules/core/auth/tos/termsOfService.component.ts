import { TOSService } from './termsOfService.service';

interface IToolkitModalSettings extends ng.ui.bootstrap.IModalSettings {
  type: string;
}

interface IToolkitModalService extends ng.ui.bootstrap.IModalService {
  open(options: IToolkitModalSettings): ng.ui.bootstrap.IModalServiceInstance;
}

class TermsOfServiceCtrl implements ng.IComponentController {
  public hasReadAggreement: boolean = false;

  /* @ngInject */
  constructor(
    private $state: ng.ui.IStateService,
    private Auth,
    private TOSService: TOSService,
    private $templateCache: ng.ITemplateCacheService,
    private $modal: IToolkitModalService,
    private $window: ng.IWindowService,
    private $scope: ng.IScope,
    private $log: ng.ILogService,
  ) { }

  private getScrollY(doc: Document) {
    let scrOfY = 0;
    if (doc.body && doc.body.scrollTop) {
      //DOM compliant
      scrOfY = doc.body.scrollTop;
    } else if (doc.documentElement && doc.documentElement.scrollTop) {
      //IE6 standards compliant mode
      scrOfY = doc.documentElement.scrollTop;
    }
    return scrOfY;
  }

  public $onInit(): void {
    // Load a copy of the ToS PDF that was converted to HTML. This WILL be out of date with what
    // is in the hosted PDF, but it looks nice and we can track the user scrolling to the bottom
    let tosHtml: string = this.$templateCache.get<string>('modules/core/auth/tos/tos.html');
    let tosStyle: string = this.$templateCache.get<string>('modules/core/auth/tos/tos-style.html');

    // Load the external hosted PDF.  This does not look good since we are up to the whims of the
    // embedded PDF viewer.  However, at least it is up to date.
    // Also, clicking any link in the PDF will navigate away to that page, not open a new tab.
    // Finally, there is no way to detect when the user has scrolled to the bottom of the PDF since
    // scrolling is handled by the PDF viewer, which could be different on every platform.
    // let tosUrl = 'http://www.cisco.com/c/dam/en_us/about/doing_business/legal/docs/universal-cloud-terms.pdf';
    // let tosHtml = `
        // <html>
        //   <body>
        //       <object data="${tosUrl}" type="application/pdf">
        //           <embed src="${tosUrl}" type="application/pdf" />
        //       </object>
        //   </body>
        // </html>
    // `;
    // let tosStyle = `
    // <style>
    //   object {
    //     width: 100%;
    //     height: 100%
    //   }
    // </style>`;

    // manually update the iframe content
    let iframeDoc = <Document>this.$window.frames['tos-frame'].document;
    let iframe = $(iframeDoc);
    let style = $(tosStyle);
    iframe.find('head').append(style);
    iframe.find('body').append(tosHtml);

    let self = this;
    iframe.scroll(() => {
      let iframeHeight = $('#tos-frame-id').height();
      let curPos = self.getScrollY(iframeDoc);
      let bottomPos = curPos + iframeHeight;
      let bodyHeight = iframe.height();

      if (bottomPos >= bodyHeight) {
        self.hasReadAggreement = true;
      }
      this.$scope.$apply();
    });

    iframe.delegate('a', 'click', (e: any) => {
      let url = e.currentTarget.href;
      this.$log.log('Terms of Service opening external link to: ' + url);
      this.$window.open(url, '_blank');
      e.preventDefault();
      e.stopPropagation();
    });
  }

  public agree(): ng.IPromise<any> {
    return this.TOSService.acceptTOS()
      .then(() => {
        this.TOSService.dismissModal();
        this.$state.go('login', {}, {
          reload: true,
        });
      });
  }

  public disagree(): void {
    this.$modal.open({
      template: '<h1 translate="termsOfService.loggingOut"></h1>',
      backdrop: 'static',
      keyboard: false,
      type: 'dialog',
    });
    this.Auth.logout();
  }

}

export class TermsOfServiceComponent implements ng.IComponentOptions {
  public controller = TermsOfServiceCtrl;
  public templateUrl = 'modules/core/auth/tos/termsOfService.html';
}