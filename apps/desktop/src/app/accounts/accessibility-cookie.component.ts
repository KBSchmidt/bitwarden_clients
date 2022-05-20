import { Component, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { Utils } from "jslib-common/misc/utils";
import { getCookie } from "jslib-electron/utils";

import { EnvironmentService } from "jslib-common/abstractions/environment.service";
import { I18nService } from "jslib-common/abstractions/i18n.service";
import { PlatformUtilsService } from "jslib-common/abstractions/platformUtils.service";
import { BroadcasterService } from "jslib-common/abstractions/broadcaster.service";

const BroadcasterSubscriptionId = "AccessibilityCookieComponent";

@Component({
  selector: "app-accessibility-cookie",
  templateUrl: "accessibility-cookie.component.html",
})
export class AccessibilityCookieComponent {
  link = "";
  listenForCookie = false;
  hCaptchaWindow: Window;

  constructor(
    protected router: Router,
    protected platformUtilsService: PlatformUtilsService,
    protected environmentService: EnvironmentService,
    protected i18nService: I18nService,
    private broadcasterService: BroadcasterService,
    protected ngZone: NgZone
  ) {}

  async ngOnInit() {
    this.broadcasterService.subscribe(BroadcasterSubscriptionId, async (message: any) => {
      this.ngZone.run(() => {
        switch (message.command) {
          case "windowIsFocused":
            if (this.listenForCookie) {
              this.listenForCookie = false;
              this.checkForCookie();
            }
          default:
        }
      });
    });
  }

  registerhCaptcha() {
    this.platformUtilsService.launchUri("https://www.hcaptcha.com/accessibility");
  }

  async checkForCookie() {
    this.hCaptchaWindow.close();
    var [cookie] = await getCookie("https://www.hcaptcha.com/", "hc_accessibility");
    if (cookie) {
      this.onCookieSavedSuccess();
    } else {
      this.onCookieSavedFailure();
    }
  }

  onCookieSavedSuccess() {
    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("accessibilityCookieSaved")
    );
  }

  onCookieSavedFailure() {
    this.platformUtilsService.showToast(
      "error",
      null,
      this.i18nService.t("noAccessibilityCookieSaved")
    );
  }

  async submit() {
    if (this.link == null || this.link === "") {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("hCaptchaUrlRequired")
      );
      return;
    }
    if (Utils.getDomain(this.link) !== "accounts.hcaptcha.com") {
      this.platformUtilsService.showToast(
        "error",
        this.i18nService.t("errorOccurred"),
        this.i18nService.t("invalidUrl")
      );
      return;
    }
    this.listenForCookie = true;
    this.hCaptchaWindow = window.open(this.link);
  }

  ngOnDestroy() {
    this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
  }
}
