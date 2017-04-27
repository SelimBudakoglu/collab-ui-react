import { ICertificate, IformattedCertificate, CertificateFormatterService } from 'modules/hercules/services/certificate-formatter-service';
import { IToolkitModalService } from 'modules/core/modal';
import { CertService } from 'modules/hercules/services/cert-service';
import { Notification } from 'modules/core/notifications';

export class PrivateTrunkCertificateService {
  private formattedCertList: Array<IformattedCertificate>;
  private isImporting: boolean = false;
  private uploadedCertIds: Array<string> = [];

  /* @ngInject */
  constructor(
    private $modal: IToolkitModalService,
    private CertService: CertService,
    private CertificateFormatterService: CertificateFormatterService,
    private Authinfo,
    private Notification: Notification,
  ) {
  }

  public uploadCertificate(file: File): ng.IPromise<any> {
    this.isImporting = true;
    return this.CertService.uploadCertificate(this.Authinfo.getOrgId(), file)
    .then( (res) => this.readCerts(res))
    .catch (error => {
      this.isImporting = false;
      this.Notification.errorResponse(error, 'servicesOverview.cards.privateTrunk.error.certUploadError');
    });

  }

  public readCerts(res?: any): ng.IPromise<any> {
    this.formattedCertList = [];
    if (res) {
      let certId = _.get(res, 'data.certId', '');
      this.uploadedCertIds.push(certId);
    }
    return this.CertService.getCerts(this.Authinfo.getOrgId())
    .then( res => {
      let certificates: Array<ICertificate> = res || [];
      this.formattedCertList = this.CertificateFormatterService.formatCerts(certificates);
      this.isImporting = false;
      return ({ formattedCertList: this.formattedCertList, isImporting: this.isImporting });
    }, error => {
      this.Notification.errorResponse(error, 'hercules.settings.call.certificatesCannotRead');
      this.isImporting = false;
      return ({ formattedCertList: this.formattedCertList, isImporting: this.isImporting });
    });
  }

  public deleteCert(certId: string): ng.IPromise<any> {
    return this.$modal.open({
      templateUrl: 'modules/hercules/private-trunk/private-trunk-certificate/private-trunk-certificate-delete-confirm.html',
      type: 'dialog',
    })
      .result.then(() => {
        return this.CertService.deleteCert(certId)
        .then(() => { return this.getUpdatedCertInfo(certId);
        }).catch(error => {
          this.Notification.errorWithTrackingId(error, 'hercules.settings.call.certificatesCannotDelete');
        });
      });
  }

  public deleteUploadedCerts(): void {
    _.forEach(this.uploadedCertIds, (certId) => {
      this.CertService.deleteCert(certId);
    });
    this.formattedCertList = [];
  }

  public getUpdatedCertInfo(certId: string): ng.IPromise<any> {
    this.uploadedCertIds.splice(_.indexOf(this.uploadedCertIds, certId));
    return this.readCerts();
  }
}