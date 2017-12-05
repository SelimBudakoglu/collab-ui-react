import { OfferNameEnum } from 'modules/core/shared';

export enum AssignableServicesItemCategory {
  LICENSE = 'LICENSE',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export enum LicenseStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  DISABLED = 'DISABLED',
}

export interface ILicenseUsage {
  billingServiceId: string;
  licenseId: string;
  offerName: OfferNameEnum;
  siteUrl: string;
  status: LicenseStatus;
}

export interface ISubscription {
  subscriptionId: string;
  licenses: ILicenseUsage[];
}

export interface IAssignableItemCheckboxState {
  isSelected: boolean;
  isDisabled: boolean;
  license: ILicenseUsage;
}

export interface IAssignableItemChange {
  itemId: string;
  itemCategory: AssignableServicesItemCategory;
  item: IAssignableItemCheckboxState;
}
