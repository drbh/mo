export default class PushService {
  private webServiceUrl: string;
  private webServiceId: string;
  private pubKey: string;
  private subscriptionEl: HTMLElement | null;
  private sub: any;
  private sw: any;
  private callBack: (sub: any) => void;

  constructor(callBack: (sub: string) => void) {
    this.webServiceUrl = "https://website.push.com";
    this.webServiceId = "web.com.YOUR_WEB_SERVICE_ID";
    this.pubKey =
      "BFXDWF_fSDAENLTpYoimqt9k9_WeiLffcj7uNWRk8lFUWiifNFdrcPGYjuQmjb0y3oxNGr5qSvlfbP2ctsr6BmE=";
    this.sw = null;
    this.callBack = callBack;
    this.initEventListeners();

    this.handleServiceWorkerRegistration =
      this.handleServiceWorkerRegistration.bind(this);
    this.handleGetSubscription = this.handleGetSubscription.bind(this);
    this.createSubscription = this.createSubscription.bind(this);
    this.updateSubscriptionStatus = this.updateSubscriptionStatus.bind(this);
    this.handleError = this.handleError.bind(this);
    this.urlB64ToUint8Array = this.urlB64ToUint8Array.bind(this);
    this.callBack = this.callBack.bind(this);
  }

  private initEventListeners() {}

  public sendPost(sub: any) {
    if (sub === null) {
      alert("Please subscribe first");
      return;
    }
    console.log("Sending POST", sub);

    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        expirationTime: sub.expirationTime,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
        sentence: "Hello World!",
      }),
    };

    console.log("Sending POST", options);

    fetch("https://king-pusha.fly.dev/push", options)
      .then((response) => response.json())
      .then((response) => console.log(response))
      .catch((err) => console.error(err));
  }

  public subscribeUser() {
    this.updateSubscriptionStatus("Subscribing...");

    if (!("serviceWorker" in navigator && "PushManager" in window)) {
      this.updateSubscriptionStatus("Push messaging is not supported");
      console.warn("Push messaging is not supported");
      return;
    }

    navigator.serviceWorker
      .register("/service-worker.js")
      .then(this.handleServiceWorkerRegistration)
      .catch(this.handleError);
  }
  private handleServiceWorkerRegistration(swReg) {
    console.log("Service Worker is registered", swReg);
    this.updateSubscriptionStatus("Service Worker is registered");
    this.sw = swReg;
    this.sw.pushManager
      .getSubscription()
      .then(this.handleGetSubscription, this.handleError);
  }

  private handleGetSubscription(subscription) {
    if (subscription === null) {
      this.createSubscription();
    } else {
      this.updateSubscriptionStatus(subscription);
    }
  }

  private createSubscription() {
    this.sw.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array(this.pubKey),
      })
      .then(this.updateSubscriptionStatus)
      .catch(this.handleError);
  }

  private updateSubscriptionStatus(subscription) {
    this.callBack(subscription);
  }

  private handleError(error) {
    console.error(error);
    this.updateSubscriptionStatus(error);
  }

  private urlB64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
