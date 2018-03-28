import { TooltipUtil, IBaseTooltipController } from 'modules/core/accessibility/tooltips/tooltip.util';

const ICON_TOOLTIP_BINDINGS = TooltipUtil.mkBaseTooltipBindings();

// notes (for PR discussion only):
// - implementing multiple interfaces is more flexible than creating a hierarchy and extending
class IconTooltipController implements ng.IComponentController, IBaseTooltipController {
  /* @ngInject */
  constructor(
  ) {
    // notes (for PR discussion only):
    // - use composition instead of classical inheritance to populate properties from a default base source
    // - (bonus) other sources could be added to the args list if re-use of other properties is desired

    _.assignInWith(this, TooltipUtil.mkBaseTooltipController({
      // defaults the icon trigger to (i)
      defaultClass: 'icon-information',
    }), function (_destValue, _srcValue, propertyName, dest, src) {
      // copy over getters from source objects as-needed
      const srcPropertyDescriptor = Object.getOwnPropertyDescriptor(src, propertyName);
      if (!srcPropertyDescriptor) {
        return;
      }
      if (srcPropertyDescriptor.get) {
        Object.defineProperty(dest, propertyName, srcPropertyDescriptor);
      }
    });
  }
}

export class IconTooltipComponent implements ng.IComponentOptions {
  public template = require('./icon-tooltip.tpl.html');
  public controller = IconTooltipController;
  public bindings = ICON_TOOLTIP_BINDINGS;
}
